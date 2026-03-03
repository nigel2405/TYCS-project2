# Peer-to-Peer GPU Sharing Platform - Project Synopsis

## Overview
The Peer-to-Peer GPU Sharing Platform is a comprehensive MERN-stack web application designed to connect individuals with idle GPU hardware (Providers) to users who require high-performance computing power for tasks like AI training, rendering, or data science (Consumers). The platform serves as a decentralized marketplace, offering dynamic GPU rentals, real-time metrics, secure session tracking, and an integrated digital wallet/billing system.

## Core Architecture
The system is built upon four distinct but interconnected components:

1. **Client (`/client`)**
   - **Role:** The primary, user-facing frontend application for both Consumers and Providers. It allows Consumers to browse the GPU marketplace, top up their wallets, launch remote Jupyter sessions, and chat directly with providers. Providers use it to register their hardware, toggle availability, and monitor their active earnings.
   - **Tech Stack:** React.js, Tailwind CSS, Socket.io-client, Anime.js.

2. **Server (`/server`)**
   - **Role:** The central backend REST API and live WebSocket hub. It is responsible for handling secure user authentication (JWT), executing MongoDB database operations, managing the financial ledger (wallet transactions), tracking session lifecycles, and relaying real-time signaling between clients and provider hardware.
   - **Tech Stack:** Node.js, Express.js, Socket.io, Mongoose/MongoDB.

3. **Admin Dashboard (`/admin`)**
   - **Role:** A dedicated, secure front-end portal strictly for platform administrators. It provides tools to monitor global platform statistics, supervise all active and completed sessions, manage user accounts, approve/suspend new hardware providers, and intervene in billing processes if required (e.g., Kill Switch functionality).
   - **Tech Stack:** React.js, Tailwind CSS.

4. **GPU Agent (`/agent`)**
   - **Role:** A lightweight, local Python daemon executed directly on the Provider's physical machine. It bridges the gap between local hardware and the remote consumer. Upon receiving a start signal from the Server, it automatically spins up a local Jupyter Lab instance and safely exposes it to the broader internet using an Ngrok secure tunnel.
   - **Tech Stack:** Python (3.8+), Ngrok, Jupyter.

## Platform Workflow
1. **Onboarding & Approval:** A hardware owner registers as a "Provider" on the Client interface and submits their hardware specs. The Platform Admin reviews and approves the hardware via the Admin Dashboard.
2. **Hardware Connection:** The approved Provider downloads the Agent script and runs it on their machine. The Agent establishes a WebSocket connection with the Server, marking the GPU as "online" and ready for workloads.
3. **Marketplace & Provisioning:** A Consumer creates an account, funds their digital wallet, browses the live marketplace, and requests to rent an available GPU. 
4. **Execution & Access:** The Server processes the request, deducts the initial funds, and emits a `start-workload` event to the specific Provider's Agent. The Agent provisions the Jupyter environment, opens the Ngrok tunnel, and sends the secure access URL back to the Consumer.
5. **Continuous Billing:** While the Consumer works in the Jupyter environment, the Server continuously monitors the session duration. Billing occurs in real-time, debiting the Consumer and crediting the Provider until the session is voluntarily stopped or funds run out.

By abstracting away the complex networking and provisioning steps, this platform provides a frictionless, democratized alternative to traditional cloud service providers like AWS or GCP, benefiting both resource providers and consumers.
