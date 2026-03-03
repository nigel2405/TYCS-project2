# GPU Provider Agent

This agent runs on the GPU provider's machine to handle remote session requests.

## Setup

1.  **Install Python** (3.8+).
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Ngrok Setup**:
    - Sign up at [ngrok.com](https://ngrok.com).
    - Get your Authtoken.
    - Run: `ngrok config add-authtoken <YOUR_TOKEN>`
4.  **Configure Environment**:
    Create a `.env` file in this directory:
    ```env
    SERVER_URL=http://localhost:5000
    PROVIDER_ID=your_mongo_user_id_here
    ```

## Usage

Run the agent:
```bash
python gpu_agent.py
```

The agent will:
1.  Connect to the server.
2.  Listen for `start-workload`.
3.  Automatically spawn `jupyter lab` and create an Ngrok tunnel.
4.  Send the secure URL back to the server.
