import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { processBillingForAllActiveSessions } from './utils/sessionBilling.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import gpuProviderRoutes from './routes/gpuProviderRoutes.js';
import gpuConsumerRoutes from './routes/gpuConsumerRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/provider', gpuProviderRoutes);
app.use('/api/consumer', gpuConsumerRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join session room for real-time updates
  socket.on('join-session', (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session: ${sessionId}`);
  });

  // Leave session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    console.log(`Socket ${socket.id} left session: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Billing cron job - run every hour
setInterval(async () => {
  try {
    console.log('Processing billing for all active sessions...');
    const results = await processBillingForAllActiveSessions();
    console.log(`Billing processed. Results: ${results.length} sessions processed.`);
    
    // Emit billing updates via Socket.io
    results.forEach((result) => {
      if (result.billed) {
        io.to(`session:${result.sessionId}`).emit('billing-update', result);
      }
    });
  } catch (error) {
    console.error('Error processing billing:', error);
  }
}, 60 * 60 * 1000); // Every hour

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  httpServer.close(() => process.exit(1));
});

export { io };
