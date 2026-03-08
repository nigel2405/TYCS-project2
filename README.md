# 🚀 Peer-to-Peer GPU Sharing Platform

A comprehensive **MERN stack** web platform that connects owners of idle GPUs (Providers) with users who need high-performance computing power (Consumers).

The system features secure session tracking, real-time GPU metrics, billing, a secure admin dashboard, and a provider agent for bridging local hardware with remote users.

---

## 🏗️ System Architecture

The project consists of 4 distinct components working together:

### 1. Client (`/client`) 
The main frontend application for **Consumers** and **Providers**.
- **Role**: Allows consumers to browse the GPU marketplace, rent instances, launch Jupyter environments, add wallet funds, and chat with providers. Allows providers to register their hardware, manage availability, and view earnings.
- **Tech Stack**: React.js, Tailwind CSS, Socket.io-client, Anime.js (animations).
- **Run**: `PORT=3000 npm start` (or `3002`)

### 2. Admin (`/admin`)
A dedicated secure dashboard for **Platform Administrators**.
- **Role**: Allows admins to monitor platform stats, view all active/completed sessions, manage users, approve/suspend providers, and trigger manual session billing processing.
- **Tech Stack**: React.js, Tailwind CSS.
- **Run**: `PORT=3001 npm start`

### 3. Server (`/server`)
The core backend REST API and WebSocket hub.
- **Role**: Handles user authentication (JWT), database operations (MongoDB), wallet transactions, session tracking, and real-time signaling between clients and the agent using `Socket.io`.
- **Tech Stack**: Node.js, Express.js, Socket.io, Mongoose (MongoDB).
- **Run**: `npm run dev` (Runs on `PORT=5000`)

### 4. GPU Agent (`/agent`)
A local daemon that runs directly on the **Provider's hardware**.
- **Role**: Listens for incoming sessions via WebSockets. When a consumer rents the GPU, this Python script automatically spins up a local `Jupyter Lab` instance and exposes it securely to the internet using an `Ngrok` tunnel. It returns this secure connection URL to the server so the consumer can access the GPU.
- **Tech Stack**: Python (3.8+), Ngrok.
- **Run**: `python gpu_agent.py`

---

## ⚙️ How It All Works Together (The Flow)

1. **Registration & Approval**: A hardware owner registers as a `Provider` on the `Client`. The platform `Admin` logs into the admin portal, reviews the hardware, and approves the provider.
2. **Agent Connection**: The approved provider downloads and runs the `Agent` script on their GPU machine, which connects via WebSockets to the `Server` indicating the GPU is online and ready.
3. **Renting**: A `Consumer` logs into the `Client`, tops up their wallet, browses the marketplace, and requests to start a session on the provider's GPU.
4. **Provisioning**: The `Server` bills the consumer's wallet, creates a session, and emits a `start-workload` event to the provider's `Agent`.
5. **Connecting**: The `Agent` spins up a Jupyter Lab environment, opens an Ngrok tunnel to it, and sends the URL back to the `Server`, which forwards it to the `Consumer`.
6. **Execution & Billing**: The `Consumer` utilizes the remote environment via the provided URL. The `Server` tracks the duration, updates GPU metrics, and processes billing continuously until the session is stopped.

---

## 🛠️ Quick Setup Guide

### Prerequisites
- Node.js (v14+)
- Python (3.8+)
- MongoDB (Running locally on 27017 or Cloud URI)
- Ngrok Account & Auth Token
- NVIDIA Container Toolkit (Required for Providers to share hardware)

### 1. Booting the Server
```bash
cd server
npm install
# Ensure you have a .env file with MONGODB_URI, JWT_SECRET, PORT=5000, CLIENT_URL=http://localhost:3000
npm run dev
```

### 2. Booting the Client & Admin
```bash
# In terminal 2
cd client
npm install
npm start # (Will prompt to run on 3000 or 3002)

# In terminal 3
cd admin
npm install
PORT=3001 npm start 
```

### 3. Running the GPU Agent
```bash
cd agent
pip install -r requirements.txt
ngrok config add-authtoken <YOUR_NGROK_TOKEN>
# Ensure you have a .env file here with SERVER_URL and PROVIDER_ID
python gpu_agent.py
```

---
*For a more detailed local setup breakdown and database seeding, please see `SETUP.md`.*
