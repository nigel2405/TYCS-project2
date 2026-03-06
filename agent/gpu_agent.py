import socketio
import requests
import os
import time
import json
import subprocess
import secrets
import threading
from dotenv import load_dotenv
from pyngrok import ngrok

# Load environment variables
load_dotenv()

SERVER_URL = os.getenv('SERVER_URL', 'http://localhost:5000')
PROVIDER_ID = os.getenv('PROVIDER_ID')

if not PROVIDER_ID:
    print("\n[ERROR] PROVIDER_ID not found in .env")
    print("Please make sure you downloaded the pre-configured agent from your dashboard.")
    exit(1)

# Global state to track active workloads
active_workloads = {}

def detect_gpu():
    """Detects local GPU hardware specifications."""
    gpu_info = {
        "manufacturer": "Unknown",
        "model": "Unknown Model",
        "vram": 4
    }
    
    try:
        if os.name == 'nt':  # Windows
            # Get GPU Name
            cmd = "wmic path win32_VideoController get name"
            output = subprocess.check_output(cmd, shell=True).decode()
            lines = [l.strip() for l in output.split('\n') if l.strip() and 'Name' not in l]
            if lines:
                gpu_info["model"] = lines[0]
                if "nvidia" in lines[0].lower(): gpu_info["manufacturer"] = "NVIDIA"
                elif "amd" in lines[0].lower() or "radeon" in lines[0].lower(): gpu_info["manufacturer"] = "AMD"
                elif "intel" in lines[0].lower(): gpu_info["manufacturer"] = "Intel"

            # Get VRAM (AdapterRAM is in bytes)
            cmd = "wmic path win32_VideoController get AdapterRAM"
            output = subprocess.check_output(cmd, shell=True).decode()
            ram_lines = [l.strip() for l in output.split('\n') if l.strip() and 'AdapterRAM' not in l]
            if ram_lines:
                try:
                    bytes_val = int(ram_lines[0])
                    gpu_info["vram"] = max(1, round(bytes_val / (1024**3))) # Convert to GB
                except:
                    pass
        else: # Linux/Mac (Basic fallback)
            try:
                # Try nvidia-smi if available
                output = subprocess.check_output("nvidia-smi --query-gpu=gpu_name,memory.total --format=csv,noheader,nounits", shell=True).decode()
                parts = output.strip().split(',')
                if len(parts) >= 2:
                    gpu_info["model"] = parts[0].strip()
                    gpu_info["manufacturer"] = "NVIDIA"
                    gpu_info["vram"] = max(1, round(int(parts[1].strip()) / 1024))
            except:
                pass
    except Exception as e:
        print(f"Error detecting hardware locally: {e}")
        
    return gpu_info

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
    workspace_dir = os.path.abspath(os.path.join(os.getcwd(), "workspaces", session_id))
    os.makedirs(workspace_dir, exist_ok=True)
    
    cmd = [
        'docker', 'run', '-d', '--rm',
        '--name', container_name,
        '--gpus', 'all',
        '-e', 'JUPYTER_ENABLE_LAB=yes',
        '-p', f'{port}:8888',
        '-v', f'{workspace_dir}:/home/jovyan/work',
        'jupyter/minimal-notebook',
        'start-notebook.sh',
        f'--ServerApp.token={token}',
        '--ServerApp.allow_origin=*',
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
            port = 8888 
            process, token = start_jupyter_lab(session_id, port)
            if not process:
                sio.emit('workload-ready', {'sessionId': session_id, 'error': 'Failed to spawn Jupyter Lab.'})
                return
            print(f"Opening Ngrok tunnel...")
            try:
                tunnel = ngrok.connect(port)
                full_url = f"{tunnel.public_url}/lab?token={token}"
                active_workloads[session_id] = {'process': process, 'tunnel': tunnel}
                sio.emit('workload-ready', {'sessionId': session_id, 'connectionUrl': full_url, 'status': 'active'})
                print(f"[SUCCESS] Workload active: {full_url}")
            except Exception as e:
                print(f"Ngrok error: {e}")
                subprocess.run(['docker', 'stop', process], stdout=subprocess.DEVNULL)
                sio.emit('workload-ready', {'sessionId': session_id, 'error': f'Ngrok failed: {str(e)}'})
        except Exception as e:
            print(f"[ERROR] {e}")
            sio.emit('workload-ready', {'sessionId': session_id, 'error': str(e)})
    threading.Thread(target=spawn_and_notify).start()

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
