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

def check_docker():
    """Verifies if Docker is installed and running."""
    try:
        subprocess.run(['docker', '--version'], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Also check if daemon is running
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
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        err_msg = stderr.decode()
        if "--gpus" in err_msg or "nvidia" in err_msg.lower():
            print("GPU passthrough failed. Retrying in Fallback (CPU-only) Mode...")
            cmd.remove('--gpus')
            cmd.remove('all')
            process2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout2, stderr2 = process2.communicate()
            if process2.returncode != 0:
                print(f"Fallback failed: {stderr2.decode()}")
                return None, None
        else:
            print(f"Failed to start container: {err_msg}")
            return None, None
            
    print(f"Docker container {container_name} started successfully.")
    return container_name, token

# Initialize Socket.IO client
sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=1)

@sio.event
def connect():
    print(f'\n[SUCCESS] Connected to server: {SERVER_URL}')
    sio.emit('register-provider', PROVIDER_ID)
    print(f"Successfully registered as Provider: {PROVIDER_ID}")

@sio.event
def disconnect():
    print('\n[WARNING] Disconnected from server. Reconnecting...')

@sio.on('start-workload')
def on_start_workload(data):
    session_id = data.get('sessionId')
    print(f"\n[INFO] Starting workload for session: {session_id}")

    def spawn_and_notify():
        try:
            port = 8888 
            process, token = start_jupyter_lab(session_id, port)
            if not process:
                sio.emit('workload-ready', {'sessionId': session_id, 'error': 'Failed to spawn Jupyter Lab. Check Docker logs.'})
                return

            print(f"Opening Ngrok tunnel to port {port}...")
            try:
                tunnel = ngrok.connect(port)
                public_url = tunnel.public_url
            except Exception as e:
                print(f"Ngrok error: {e}")
                subprocess.run(['docker', 'stop', process], stdout=subprocess.DEVNULL)
                sio.emit('workload-ready', {'sessionId': session_id, 'error': f'Ngrok failed: {str(e)}'})
                return

            full_url = f"{public_url}/lab?token={token}"
            active_workloads[session_id] = {'process': process, 'tunnel': tunnel}

            sio.emit('workload-ready', {
                'sessionId': session_id,
                'connectionUrl': full_url,
                'status': 'active'
            })
            print(f"[SUCCESS] Workload active: {full_url}")
            
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
            print("[SUCCESS] Session stopped cleaned up.")
        except Exception as e:
            print(f"[ERROR] Cleanup error: {e}")
        del active_workloads[session_id]
        sio.emit('workload-stopped', {'sessionId': session_id})

def main():
    print("\n" + "="*50)
    print("   GPU SHARING PLATFORM - PROVIDER AGENT")
    print("="*50)

    if not check_docker():
        print("\n[CRITICAL ERROR] Docker is not installed or not running!")
        print("Please install Docker Desktop and make sure it is open.")
        print("Download at: https://www.docker.com/products/docker-desktop")
        return

    # Fix: websocket-client ValueError with 'https'
    # python-socketio handles http/https urls, but underlying libraries can be picky.
    # Cleaning URL to ensure it starts correctly for the library.
    clean_url = SERVER_URL.strip()
    if clean_url.endswith('/'):
        clean_url = clean_url[:-1]
    
    # We use a loop for initial connection to be robust
    while True:
        try:
            if not sio.connected:
                print(f"\nAttempting to connect to {clean_url}...")
                # We specify transports to avoid some protocol negotiation issues on Windows
                sio.connect(clean_url, transports=['polling', 'websocket'])
            
            # Wait while connected
            while sio.connected:
                time.sleep(1)
                
        except (socketio.exceptions.ConnectionError, ValueError) as e:
            # Catching ValueError specifically for 'scheme https is invalid'
            err_msg = str(e)
            if "scheme https" in err_msg:
                # If https fails, try wss directly or warn
                print(f"\n[PROTOCOL WARNING] Webhooks/Websockets mismatch detected.")
                print("Switching transport modes...")
                try:
                    sio.connect(clean_url, transports=['polling'])
                except Exception as inner_e:
                    print(f"Reconnect failed: {inner_e}")
            else:
                print(f"\n[CONNECTION ERROR] {e}")
            
            print("Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nShutting down agent...")
            if sio.connected:
                sio.disconnect()
            break
        except Exception as e:
            print(f"\n[UNEXPECTED ERROR] {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()
