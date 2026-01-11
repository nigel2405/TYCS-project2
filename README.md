# Peer-to-Peer GPU Sharing Platform

A complete MERN stack web application for sharing GPU resources remotely. Providers can list their GPUs for rent, and consumers can browse and rent GPUs for computing, gaming, AI workloads, and more.

## ✨ UI/UX Features

### Modern Design System
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Smooth Animations**: Anime.js powered micro-interactions
- **Futuristic Aesthetic**: Dark theme with neon accents
- **Color Palette**: 
  - Primary: `#25CCF7` (Cyan Blue)
  - Secondary: `#55E6C1` (Mint Green)
  - Success: `#58B19F` (Teal)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG compliant with reduced motion support

### Animation Features
- Page load fade & slide-up animations
- Card hover scale & glow effects
- Button ripple effects on click
- Floating background blobs
- Animated counters for statistics
- Skeleton loaders with shimmer effect
- Smooth modal transitions

## Features

### Authentication Module
- User registration and login with JWT authentication
- Role-based access control (Admin, Provider, Consumer)
- Password hashing with bcrypt
- Protected routes

### GPU Provider Module
- Register and manage GPU systems
- Auto-detect GPU specifications (mocked for demo)
- Set hourly pricing and availability
- View earnings and session history
- Provider approval system (admin-controlled)

### GPU Consumer Module
- Browse available GPUs with advanced filtering
- Filter by VRAM, manufacturer, price range
- Request GPU sessions
- View active and past sessions
- Wallet balance tracking

### Session Management Module
- Create, start, stop, and monitor GPU sessions
- Real-time session metrics (GPU utilization, temperature, memory)
- Connection details for remote access
- Session status tracking

### Billing Module
- Automatic hourly billing for active sessions
- Wallet-based payment system
- Transaction history
- Real-time billing updates via WebSocket

### Admin Dashboard
- Platform statistics and analytics
- User management (approve/suspend providers)
- Monitor all sessions
- Manual billing processing
- View platform-wide revenue

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication

### Frontend
- **React.js** - UI library
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket client
- **CSS** - Styling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd gpuallocatio
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/gpu-sharing-platform
JWT_SECRET=your-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd client
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

## Running the Application

### Start Backend Server

```bash
cd server
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Start Frontend

```bash
cd client
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

### Creating Users

1. **Register as Consumer**: Browse and rent GPUs
2. **Register as Provider**: List GPUs for rent (requires admin approval)
3. **Admin Account**: Create manually in database or use default admin credentials

### Provider Workflow

1. Register an account with role "Provider"
2. Wait for admin approval (if required)
3. Once approved, go to Provider Dashboard
4. Register your GPU(s) with pricing
5. Set availability status
6. Monitor sessions and earnings

### Consumer Workflow

1. Register an account with role "Consumer"
2. Add funds to wallet (mock feature)
3. Browse available GPUs in Marketplace
4. Filter by specifications and price
5. Request a session for desired GPU
6. Start the session when ready
7. Monitor GPU metrics in real-time
8. Stop session when done (billing is processed automatically)

### Admin Workflow

1. Access Admin Dashboard
2. View platform statistics
3. Approve/suspend provider accounts
4. Monitor all sessions
5. Process billing manually if needed

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/wallet/add` - Add funds to wallet

### Provider Routes
- `POST /api/provider/gpus` - Register new GPU
- `GET /api/provider/gpus` - Get all provider GPUs
- `GET /api/provider/gpus/:id` - Get single GPU
- `PUT /api/provider/gpus/:id` - Update GPU
- `DELETE /api/provider/gpus/:id` - Delete GPU
- `GET /api/provider/earnings` - Get earnings summary
- `GET /api/provider/sessions` - Get session history

### Consumer Routes
- `GET /api/consumer/gpus` - Browse available GPUs
- `GET /api/consumer/gpus/:id` - Get GPU details
- `POST /api/consumer/sessions/request` - Request session
- `GET /api/consumer/sessions` - Get consumer sessions
- `GET /api/consumer/summary` - Get consumer summary

### Session Routes
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/start` - Start session
- `POST /api/sessions/:id/stop` - Stop session
- `POST /api/sessions/:id/cancel` - Cancel session
- `GET /api/sessions/:id/metrics` - Get session metrics
- `PUT /api/sessions/:id/metrics` - Update metrics (mock)

### Admin Routes
- `GET /api/admin/stats` - Get platform stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get single user
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/providers/:id/approve` - Approve provider
- `POST /api/admin/providers/:id/suspend` - Suspend provider
- `GET /api/admin/gpus` - Get all GPUs
- `GET /api/admin/sessions` - Get all sessions
- `POST /api/admin/billing/process` - Process billing

## Billing System

- Sessions are billed hourly at the rate set by the provider
- Billing is processed automatically every hour for active sessions
- When a session stops, final billing is calculated and processed
- Funds are deducted from consumer wallet and added to provider wallet
- Insufficient funds will terminate the session automatically

## Real-time Features

- WebSocket connection for real-time session updates
- Live billing notifications
- Real-time GPU metrics updates (every 5 seconds when active)

## Project Structure

```
gpuallocatio/
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── gpuConsumerController.js
│   │   ├── gpuProviderController.js
│   │   └── sessionController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── GPU.js
│   │   ├── Session.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── gpuConsumerRoutes.js
│   │   ├── gpuProviderRoutes.js
│   │   └── sessionRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── gpuDetector.js
│   │   └── sessionBilling.js
│   ├── package.json
│   └── server.js
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.js
│   │   │   │   └── Navbar.css
│   │   │   └── routing/
│   │   │       └── PrivateRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   └── AdminDashboard.css
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   └── Auth.css
│   │   │   ├── consumer/
│   │   │   │   ├── ConsumerMarketplace.js
│   │   │   │   └── ConsumerMarketplace.css
│   │   │   ├── provider/
│   │   │   │   ├── ProviderDashboard.js
│   │   │   │   └── ProviderDashboard.css
│   │   │   ├── sessions/
│   │   │   │   ├── SessionDetails.js
│   │   │   │   └── SessionDetails.css
│   │   │   ├── Dashboard.js
│   │   │   └── Dashboard.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── README.md
```

## Notes

- GPU detection is currently mocked. In production, integrate with actual GPU detection libraries.
- Session metrics are simulated. Real GPU monitoring would require additional integration.
- Wallet funding is a placeholder. Integrate with payment gateway for production.
- Provider approval can be automated or manual based on requirements.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
