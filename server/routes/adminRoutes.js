import express from 'express';
import {
  getPlatformStats,
  getUsers,
  getUser,
  updateUser,
  approveProvider,
  suspendProvider,
  getAllGPUs,
  getAllSessions,
  processBilling,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Stats
router.get('/stats', getPlatformStats);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);

// Provider management
router.post('/providers/:id/approve', approveProvider);
router.post('/providers/:id/suspend', suspendProvider);

// GPU and session management
router.get('/gpus', getAllGPUs);
router.get('/sessions', getAllSessions);

// Billing
router.post('/billing/process', processBilling);

export default router;
