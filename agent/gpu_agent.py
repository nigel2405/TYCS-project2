import socketio
import requests
import os
import time
import json
import subprocess
import socket
import secrets
import threading
from dotenv import load_dotenv
from pyngrok import ngrok

# Load environment variables
load_dotenv()

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5000')
PROVIDER_ID = os.getenv('PROVIDER_ID')
NGROK_AUTH_TOKEN = os.getenv('NGROK_AUTH_TOKEN')

if NGROK_AUTH_TOKEN:
    print("[INFO] Setting Ngrok Auth Token...")
    ngrok.set_auth_token(NGROK_AUTH_TOKEN)
else:
    print("[WARNING] NGROK_AUTH_TOKEN not found in .env. Ngrok may fail if authentication is required.")


if not PROVIDER_ID:
    print("\n[ERROR] PROVIDER_ID not found in .env")
    print("Please make sure you downloaded the pre-configured agent from your dashboard.")
    exit(1)

# Global state to track active workloads
active_workloads = {}

def detect_gpu():
    """Detects local GPU hardware specifications, prioritizing dedicated hardware."""
    gpu_info = {
        "manufacturer": "Unknown",
        "model": "Unknown Model",
        "vram": 4
    }
    
    try:
        # Strategy 1: Try nvidia-smi (Most accurate for NVIDIA)
        try:
            output = subprocess.check_output("nvidia-smi --query-gpu=gpu_name,memory.total --format=csv,noheader,nounits", shell=True, stderr=subprocess.DEVNULL).decode()
            parts = output.strip().split(',')
            if len(parts) >= 2:
                gpu_info["model"] = parts[0].strip()
                gpu_info["manufacturer"] = "NVIDIA"
                gpu_info["vram"] = max(1, round(int(parts[1].strip()) / 1024))
                print(f"[DEBUG] NVIDIA detected via nvidia-smi: {gpu_info['model']}")
                return gpu_info
        except:
            pass

        # Strategy 2: Windows wmic (Fallback)
        if os.name == 'nt':
            cmd = "wmic path win32_VideoController get name, AdapterRAM /format:list"
            output = subprocess.check_output(cmd, shell=True).decode()
            
            # Parse list format (Name=..., AdapterRAM=...)
            current_gpu = {}
            best_gpu = None
            
            for line in output.split('\n'):
                line = line.strip()
                if '=' in line:
                    key, val = line.split('=', 1)
                    if key.strip() == 'Name':
                        current_gpu['model'] = val.strip()
                    elif key.strip() == 'AdapterRAM':
                        try:
                            bytes_val = int(val.strip())
                            current_gpu['vram'] = max(1, round(bytes_val / (1024**3)))
                        except:
                            current_gpu['vram'] = 0
                
                # If we have both name and vram for one controller
                if 'model' in current_gpu and 'vram' in current_gpu:
                    model_lower = current_gpu['model'].lower()
                    # Prioritize NVIDIA > AMD > Intel
                    score = 0
                    if "nvidia" in model_lower: score = 3
                    elif "amd" in model_lower or "radeon" in model_lower: score = 2
                    elif "intel" in model_lower: score = 1
                    
                    if not best_gpu or score > best_gpu['score']:
                        best_gpu = {**current_gpu, 'score': score}
                    current_gpu = {}

            if best_gpu:
                gpu_info["model"] = best_gpu["model"]
                gpu_info["vram"] = best_gpu["vram"]
                if "nvidia" in best_gpu["model"].lower(): gpu_info["manufacturer"] = "NVIDIA"
                elif "amd" in best_gpu["model"].lower() or "radeon" in best_gpu["model"].lower(): gpu_info["manufacturer"] = "AMD"
                elif "intel" in best_gpu["model"].lower(): gpu_info["manufacturer"] = "Intel"
                print(f"[DEBUG] GPU detected via wmic: {gpu_info['model']}")

    except Exception as e:
        print(f"Error detecting hardware locally: {e}")
        
    return gpu_info

def get_free_port():
    """Finds an available TCP port."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]

def check_docker():
    """Verifies if Docker is installed and running."""
    try:
        subprocess.run(['docker', '--version'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(['docker', 'info'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def start_jupyter_lab(session_id, port):
    """Starts a Jupyter Lab instance in a securely isolated Docker container."""
    token = secrets.token_hex(16)
    container_name = f"gpu_session_{session_id}"
    
    # Use a simpler relative path structure to prevent "Directory not found" errors in Docker on Windows
    # Docker sometimes struggles with deeply nested or absolute Windows paths in volume mounting
    rel_workspace = os.path.join("workspaces", session_id)
    workspace_dir = os.path.abspath(rel_workspace)
    os.makedirs(workspace_dir, exist_ok=True)
    
    # On Windows, we need to ensure the path is compatible with Docker's Linux engine
    mount_path = workspace_dir
    if os.name == 'nt':
        # Convert C:\path\to\folder to /c/path/to/folder if needed, but abspath usually works if handled right
        pass 

    cmd = [
        'docker', 'run', '-d', '--rm',
        '--name', container_name,
        '--gpus', 'all',
        '-e', 'JUPYTER_ENABLE_LAB=yes',
        '-p', f'{port}:8888',
        '-v', f'{workspace_dir}:/home/jovyan/work',
        'jupyter/scipy-notebook',
        'start-notebook.sh',
        f'--ServerApp.token={token}',
        '--ServerApp.allow_origin=*',
        '--ServerApp.root_dir=/home/jovyan/work',
        f'--NotebookApp.token={token}',
        '--NotebookApp.allow_origin=*'
    ]
    
    print(f"Starting Docker container {container_name} on port {port}...")
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    _, stderr = process.communicate()
    
    if process.returncode != 0:
        err_msg = stderr.decode()
        if "--gpus" in err_msg or "nvidia" in err_msg.lower():
            print("GPU passthrough failed. Retrying in CPU-only Fallback Mode...")
            cmd.remove('--gpus')
            cmd.remove('all')
            process2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            _, stderr2 = process2.communicate()
            if process2.returncode != 0:
                print(f"Fallback failed: {stderr2.decode()}")
                return None, None
        else:
            print(f"Failed to start container: {err_msg}")
            return None, None
            
    return container_name, token

# Initialize Socket.IO client with auto-reconnect disabled (we handle it manually)
sio = socketio.Client(reconnection=False)

@sio.event
def connect():
    print(f'\n[SUCCESS] Connected to server!')
    sio.emit('register-provider', PROVIDER_ID)
    print(f"Successfully registered as Provider: {PROVIDER_ID}")

@sio.event
def disconnect():
    print('\n[WARNING] Connection lost. Attempting to reconnect...')

@sio.on('start-workload')
def on_start_workload(data):
    session_id = data.get('sessionId')
    print(f"\n[INFO] Starting workload for session: {session_id}")
    def spawn_and_notify():
        try:
            port = get_free_port()
            print(f"Allocated dynamic port: {port}")
            process, token = start_jupyter_lab(session_id, port)
            if not process:
                sio.emit('workload-ready', {'sessionId': session_id, 'error': 'Failed to spawn Jupyter Lab.'})
                return
            print(f"Opening Ngrok tunnel...")
            try:
                # Set region to 'ap' (Asia/Pacific) for better stability in India
                tunnel = ngrok.connect(port, pyngrok_config=ngrok.PyngrokConfig(region="ap"))
                full_url = f"{tunnel.public_url}/lab?token={token}"
                active_workloads[session_id] = {'process': process, 'tunnel': tunnel, 'active': True}
                sio.emit('workload-ready', {'sessionId': session_id, 'connectionUrl': full_url, 'status': 'active'})
                print(f"[SUCCESS] Workload active: {full_url}")

                # Start metrics reporting thread for this session
                def report_metrics():
                    while session_id in active_workloads and active_workloads[session_id].get('active'):
                        try:
                            # Only report if we are actually connected to avoid BadNamespaceError
                            if sio.connected:
                                gpu_data = detect_gpu_metrics()
                                if gpu_data:
                                    sio.emit('session-metrics', {
                                        'sessionId': session_id,
                                        'utilization': gpu_data['utilization'],
                                        'temperature': gpu_data['temperature'],
                                        'memoryUsed': gpu_data['memoryUsed']
                                    })
                        except Exception as e:
                            # Log error but keep the thread alive for reconnection
                            print(f"[METRICS ERROR] {e}")
                            
                        time.sleep(10) # Report every 10 seconds
                
                threading.Thread(target=report_metrics, daemon=True).start()

            except Exception as e:
                print(f"Ngrok error: {e}")
                subprocess.run(['docker', 'stop', process], stdout=subprocess.DEVNULL)
                sio.emit('workload-ready', {'sessionId': session_id, 'error': f'Ngrok failed: {str(e)}'})
        except Exception as e:
            print(f"[ERROR] {e}")
            sio.emit('workload-ready', {'sessionId': session_id, 'error': str(e)})
    threading.Thread(target=spawn_and_notify).start()

def detect_gpu_metrics():
    """Collects real-time GPU performance metrics."""
    try:
        # Try nvidia-smi for real-time stats
        output = subprocess.check_output(
            "nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used --format=csv,noheader,nounits", 
            shell=True, stderr=subprocess.DEVNULL
        ).decode()
        parts = output.strip().split(',')
        if len(parts) >= 3:
            return {
                "utilization": int(parts[0].strip()),
                "temperature": int(parts[1].strip()),
                "memoryUsed": int(parts[2].strip())
            }
    except:
        # Fallback to zeros if not available
        pass
    return None

@sio.on('stop-workload')
def on_stop_workload(data):
    session_id = data.get('sessionId')
    if session_id in active_workloads:
        info = active_workloads[session_id]
        print(f"\n[INFO] Stopping session {session_id}...")
        try:
            ngrok.disconnect(info['tunnel'].public_url)
            subprocess.run(['docker', 'stop', info['process']], check=True, stdout=subprocess.DEVNULL)
            print("[SUCCESS] Session stopped.")
        except Exception as e:
            print(f"[ERROR] Cleanup error: {e}")
        del active_workloads[session_id]
        sio.emit('workload-stopped', {'sessionId': session_id})

@sio.on('request-gpu-scan')
def on_request_gpu_scan(data):
    print("\n[INFO] Received hardware scan request from dashboard...")
    gpu_info = detect_gpu()
    print(f"Detected: {gpu_info['manufacturer']} {gpu_info['model']} ({gpu_info['vram']}GB)")
    sio.emit('gpu-scan-results', gpu_info)
    print("Sent scan results back to server.")

def main():
    print("\n" + "="*50)
    print("   GPU SHARING PLATFORM - PROVIDER AGENT")
    print("="*50)

    if not check_docker():
        print("\n[CRITICAL ERROR] Docker is not installed or not running!")
        print("Please install Docker Desktop and keep it open.")
        return

    # Force HTTPS for render URLs if not present
    clean_url = SERVER_URL.strip()
    if 'onrender.com' in clean_url and clean_url.startswith('http://'):
        clean_url = clean_url.replace('http://', 'https://')
    if clean_url.endswith('/'):
        clean_url = clean_url[:-1]
    
    while True:
        try:
            # Clear any existing ngrok processes/tunnels to avoid conflicts/limits
            try:
                print("[INFO] Cleaning up legacy tunnels...")
                ngrok.kill()
            except:
                pass

            # Force a fresh state before every connection attempt
            try:
                if sio.connected:
                    sio.disconnect()
            except:
                pass
                
            print(f"\nAttempting to connect to {clean_url}...")
            # We use only 'polling' first to be more robust with some proxy/firewall setups
            sio.connect(clean_url, transports=['polling', 'websocket'], wait_timeout=10)
            
            # sio.wait() blocks until disconnected
            sio.wait()
                
        except Exception as e:
            print(f"[CONNECTION ERROR] {e}")
            # Ensure we are fully disconnected for the next loop iteration
            try:
                sio.disconnect()
            except:
                pass
            print("Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nShutting down agent...")
            try:
                sio.disconnect()
            except:
                pass
            break

if __name__ == '__main__':
    main()
