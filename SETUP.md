# Quick Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or cloud instance)
- npm or yarn

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
MONGODB_URI=mongodb://localhost:27017/gpu-sharing-platform
JWT_SECRET=your-secret-jwt-key-change-this-in-production-make-it-long-and-random
JWT_EXPIRE=30d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Important**: Change `JWT_SECRET` to a random, secure string for production!

### 2. Frontend Setup

```bash
cd client
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running:

**Windows:**
```bash
mongod
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or simply
mongod
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd server
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

The frontend will run on `http://localhost:3000`

### 5. Create Your First User

1. Open `http://localhost:3000` in your browser
2. Click "Register"
3. Choose your account type:
   - **Consumer**: To rent GPUs
   - **Provider**: To list GPUs for rent (requires admin approval)

### 6. Creating an Admin Account (Optional)

To create an admin account, you can either:

**Option A: Use MongoDB Compass or mongo shell:**
```javascript
use gpu-sharing-platform
db.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$10$...", // bcrypt hash of your password
  role: "admin",
  isProviderApproved: true,
  isActive: true,
  walletBalance: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Option B: Modify the register controller temporarily** to allow admin registration.

**Option C: Use a tool like Postman** to manually create an admin user.

### 7. Testing the Application

1. **Register as a Consumer:**
   - Browse available GPUs in the Marketplace
   - Request a session
   - Start and monitor the session

2. **Register as a Provider:**
   - Register your GPU(s) with pricing
   - Wait for admin approval (if required)
   - Once approved, manage your GPUs and view earnings

3. **Admin Dashboard:**
   - View platform statistics
   - Approve/suspend providers
   - Monitor all sessions
   - Process billing manually if needed

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running
- Check the `MONGODB_URI` in your `.env` file
- Verify MongoDB is accessible on the specified port (default: 27017)

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: React will ask to use a different port automatically

### CORS Errors
- Make sure `CLIENT_URL` in backend `.env` matches your frontend URL
- Default should work: `http://localhost:3000`

### JWT Errors
- Make sure `JWT_SECRET` is set in `.env`
- Token expires after 30 days (configurable via `JWT_EXPIRE`)

## Project Structure

```
gpuallocatio/
├── server/          # Backend (Node.js + Express)
├── client/          # Frontend (React)
└── README.md        # Full documentation
```

## Next Steps

1. Review the main README.md for full feature documentation
2. Customize GPU detection logic in `server/utils/gpuDetector.js`
3. Integrate real payment gateway for wallet funding
4. Add real GPU monitoring for session metrics
5. Set up production environment variables
6. Deploy to your preferred hosting platform

## Need Help?

- Check the main README.md for detailed API documentation
- Review the code comments for implementation details
- Ensure all dependencies are installed correctly

Enjoy building with the GPU Sharing Platform! 🚀
