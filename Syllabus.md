Peer-to-Peer GPU Sharing Platform: Full Detailed Syllabus & Technical Record

## 1. Executive Summary & Core Concept
The **Peer-to-Peer GPU Sharing Platform** is a decentralized marketplace designed to connect individuals who own idle Graphical Processing Units (Providers) with users who require high-performance computing power (Consumers). Rather than relying on centralized cloud providers (like AWS or GCP), this platform democratizes access to compute power. 

Key features include dynamic GPU listing, wallet-based financial transactions, automated local container provisioning (via an Agent), and real-time remote access (via Jupyter/Ngrok tunnels) to hardware.

---

## 2. Technology Stack & Frameworks

### 2.1 Backend (Server)
- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Real-time Communication:** Socket.io
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs (Password Hashing)

### 2.2 Frontend (Client & Admin)
- **Library:** React.js
- **Styling:** Tailwind CSS
- **Animations:** Anime.js
- **Real-time Client:** Socket.io-client
- **State Management:** React Context API / Hooks

### 2.3 Provider Agent
- **Language:** Python (3.8+)
- **Tunneling:** Ngrok (Secure Intranet Exposure)
- **Compute Environment Environment:** Jupyter Lab

---

## 3. System Architecture & Components

The architecture consists of four distinct, decoupled components working in tandem:

### 3.1 `client` (Consumer & Provider Portal)
- **Purpose:** Primary user-facing web application.
- **Consumer capabilities:** Marketplace browsing, Wallet management, Session initiation, real-time metrics monitoring, and Chat.
- **Provider capabilities:** Hardware registration, Setting availability and pricing ($/hr), Earnings tracking, Profile management.
- **Key Modules/Pages:** 
  - `auth/`: Login, Register, Forgot Password.
  - `consumer/`: Marketplace, Dashboard, Wallet.
  - `provider/`: Hardware Registration, Earnings Dashboard.
  - `sessions/`: Active Session Remote View, Session History.

### 3.2 `admin` (Platform Management Dashboard)
- **Purpose:** Secure, restricted portal for global platform administration.
- **Capabilities:** Monitor global statistics, Review & Approve/Suspend Providers, Enforce Kill-Switches on compute sessions, handle manual Withdrawal requests.
- **Key Modules/Pages:**
  - `Dashboard`: Global overview and active metrics.
  - `AdminWithdrawals`: Managing financial exits from the platform.
  - User and Hardware tracking pages.

### 3.3 `server` (Core REST API & WebSocket Hub)
- **Purpose:** The central nervous system handling business logic, data persistence, and real-time signaling.
- **Capabilities:** Manages REST endpoints for CRUD operations, handles Socket.io connections from Clients and Agents to sync states, continuously processes billing for Active sessions in background processes.

### 3.4 `agent` (Local Hardware Daemon)
- **Purpose:** A lightweight worker script running physically on the Provider's machine.
- **Capabilities:** Listens to `start-workload` events from the server. Automatically spins up a Jupyter computing environment, mounts a secure Ngrok tunnel directly to that environment, and passes the access URL back to the server for Consumer handover.

---

## 4. Database Schema Overview (MongoDB Models)

### 4.1 User Model (`User.js`)
Tracks all users across three distinct roles (`consumer`, `provider`, `admin`).
- **Fields:** `username`, `email`, `password` (hashed), `role`, `walletBalance` (Number), `profile` (Nested object with avatar/location info), `isProviderApproved`.

### 4.2 GPU Component Model (`GPU.js`)
Tracks the hardware listed on the marketplace.
- **Fields:** `provider` (Ref: User), `name`, `manufacturer` (e.g., NVIDIA, AMD), `vram`, `clockSpeed`, `pricePerHour`, `isAvailable`, `currentSession` (Ref: Session), `totalEarnings`, `rating`.
- **Logic:** Indexed heavily by `provider`, `isActive`, and `isAvailable` for fast marketplace querying.

### 4.3 Compute Session Model (`Session.js`)
The most critical model tracking active computing rentages.
- **Fields:** `consumer` (Ref: User), `provider` (Ref: User), `gpu` (Ref: GPU), `status` (pending, active, completed, cancelled), `startTime`, `endTime`, `duration`, `totalCost`, `hourlyRate`, `connectionUrl` (Ngrok tunnel link).
- **Virtuals:** `calculatedDuration` and `calculatedCost` compute live tallies dynamically base on `startTime` and `Date.now()`.

### 4.4 Ancillary Models
- **Review Model (`Review.js`):** Ratings left by consumers on hardware.
- **Message Model (`Message.js`):** Peer-to-peer chat functionality.
- **Withdrawal Model (`Withdrawal.js`):** Ledger for tracking when Providers cash-out earnings.

---

## 5. API Endpoints Breakdown (`/routes`)

- **`/api/auth`** (`authRoutes.js`): User registration, login, token generation, profile fetching.
- **`/api/gpus/consumer`** (`gpuConsumerRoutes.js`): Marketplace search, filtering hardware by specs, availability status.
- **`/api/gpus/provider`** (`gpuProviderRoutes.js`): Creating new GPU listings, toggling status online/offline, hardware deletion.
- **`/api/sessions`** (`sessionRoutes.js`): Requesting a GPU session, updating session metrics via socket overrides, stopping execution.
- **`/api/payments`** (`paymentRoutes.js`): Adding wallet funds, transaction history, withdrawal requests.
- **`/api/admin`** (`adminRoutes.js`): Fetching platform aggregates, overriding session states, provider approval flows.

---

## 6. End-to-End Execution Workflow

1. **Host Registration:** A user registers a `Provider` profile and inputs backend hardware specs.
2. **Approval Gate:** The `Admin` reviews the specs on the `/admin` portal and flags `isProviderApproved: true`.
3. **Agent Link:** The Provider runs the `agent.py` script locally, passing their backend User ID. The Agent connects to the Server via WebSockets, marking the GPU as `isAvailable: true`.
4. **Market & Wallet:** A `Consumer` logs in, adds funds via the Payments route, and browses the live Marketplace.
5. **Session Bootstrap:** 
    - Consumer clicks "Rent" on a GPU.
    - Server creates a `Session` document (`status: pending`).
    - Server emits a `start-session` Socket event to the Provider's Agent.
6. **Tunnel Provisioning:**
    - Agent receives the event, launches a local Jupyter Lab instance.
    - Agent generates an Ngrok URL mapped to Jupyter's localhost port.
    - Agent emits `session-ready` back to the Server containing the URL.
7. **Execution & Billing:** 
    - Server updates Session to `status: active`.
    - Server passes the URL to the Consumer frontend.
    - As time elapses, the Server deducts from Consumer's `walletBalance` and adds to Provider's `walletBalance` based on the GPU's `pricePerHour`.
8. **Termination:** Consumer clicks "Stop Session" (or runs out of funds), Server emits `stop-session` to Agent (which kills Jupyter/Ngrok), and the Session is marked `completed`.

---

## 7. Configuration & Environment

### `.env` Structure (Server)
```env
MONGODB_URI=mongodb://localhost:27017/gpu-sharing-platform
JWT_SECRET=your-secret-string
JWT_EXPIRE=30d
PORT=5000
CLIENT_URL=http://localhost:3000
```
### Agent Configuration (`agent/.env`)
```env
SERVER_URL=ws://localhost:5000
PROVIDER_ID=mongodb-user-id
NGROK_AUTH_TOKEN=your-ngrok-token
```
