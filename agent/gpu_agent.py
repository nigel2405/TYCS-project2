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
    print("Error: PROVIDER_ID not found in .env")
    exit(1)

# Initialize Socket.IO client
sio = socketio.Client()

# Global state to track active workloads
# structure: { session_id: { 'process': subprocess.Popen, 'tunnel': ngrok_tunnel_obj, 'port': int } }
active_workloads = {}

def start_jupyter_lab(session_id, port):
    """
    Starts a Jupyter Lab instance in a securely isolated Docker container.
    """
    token = secrets.token_hex(16)
    container_name = f"gpu_session_{session_id}"
    
    # Create an isolated workspace directory for this session on the host
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
        f'--NotebookApp.token={token}', # Backwards compatibility
        '--NotebookApp.allow_origin=*'
    ]
    
    print(f"Starting Docker container {container_name} on port {port}...")
    
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        print("Failed to start with GPU passthrough. Output:")
        print("STDOUT:", stdout.decode())
        print("STDERR:", stderr.decode())
        print("Retrying without --gpus all (Fallback Mode)...")
        
        # Remove --gpus all for environments without nvidia-container-toolkit
        cmd.remove('--gpus')
        cmd.remove('all')
        
        process2 = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout2, stderr2 = process2.communicate()
        
        if process2.returncode != 0:
            print("Fallback Docker start failed. Output:")
            print("STDERR:", stderr2.decode())
            return None, None
            
    print(f"Docker container {container_name} started successfully.")
    # Return container_name as the process handle
    return container_name, token

@sio.event
def connect():
    print('Connected to server')
    sio.emit('register-provider', PROVIDER_ID)

@sio.event
def disconnect():
    print('Disconnected from server')

@sio.on('start-workload')
def on_start_workload(data):
    print("\nReceived start-workload request:")
    print(json.dumps(data, indent=2))

    session_id = data.get('sessionId')
    workload_type = data.get('workloadType', 'jupyter')
    
    if session_id in active_workloads:
        print(f"Session {session_id} is already active.")
        return

    print(f"Starting {workload_type} environment for session {session_id}...")

    def spawn_and_notify():
        try:
            # 1. Select a port 
            port = 8888 
            
            # 2. Start Jupyter Process
            process, token = start_jupyter_lab(session_id, port)
            if not process:
                sio.emit('workload-ready', {'sessionId': session_id, 'error': 'Failed to spawn Jupyter Lab'})
                return

            # 3. Start Ngrok Tunnel
            print(f"Opening Ngrok tunnel to port {port}...")
            try:
                # connect method returns a Tunnel object
                tunnel = ngrok.connect(port)
                public_url = tunnel.public_url
            except Exception as e:
                print(f"Ngrok error: {e}")
                process.terminate()
                sio.emit('workload-ready', {'sessionId': session_id, 'error': f'Ngrok failed: {str(e)}'})
                return

            full_url = f"{public_url}/lab?token={token}"
            print(f"Workload started successfully!")
            print(f"Public URL: {full_url}")

            # 4. Store state
            active_workloads[session_id] = {
                'process': process,
                'tunnel': tunnel,
                'port': port,
                'token': token
            }

            # 5. Send success response back to server
            response_data = {
                'sessionId': session_id,
                'connectionUrl': full_url,
                'status': 'active'
            }
            sio.emit('workload-ready', response_data)
            print("Sent workload-ready signal to server.")
            
        except Exception as e:
            print(f"Unexpected error starting workload: {e}")
            sio.emit('workload-ready', {'sessionId': session_id, 'error': str(e)})

    # Run in a separate thread so we don't block the socket loop
    thread = threading.Thread(target=spawn_and_notify)
    thread.start()

@sio.on('stop-workload')
def on_stop_workload(data):
    session_id = data.get('sessionId')
    print(f"\nReceived stop-workload request for session {session_id}")
    
    if session_id in active_workloads:
        info = active_workloads[session_id]
        
        # Kill tunnel
        try:
            ngrok.disconnect(info['tunnel'].public_url)
            print("Ngrok tunnel closed.")
        except Exception as e:
            print(f"Error closing tunnel: {e}")

        # Kill Docker container
        try:
            container_name = info['process']
            print(f"Stopping Docker container {container_name}...")
            subprocess.run(['docker', 'stop', container_name], check=True)
            print("Docker container stopped and removed.")
        except Exception as e:
             print(f"Error stopping container: {e}")
        
        del active_workloads[session_id]
        sio.emit('workload-stopped', {'sessionId': session_id})
    else:
        print("Session not found in active workloads.")

def main():
    try:
        sio.connect(SERVER_URL)
        print(f"Agent running for Provider ID: {PROVIDER_ID}")
        sio.wait()
    except Exception as e:
        print(f"Connection error: {e}")
        time.sleep(5)
        main() # Retry

if __name__ == '__main__':
    main()
