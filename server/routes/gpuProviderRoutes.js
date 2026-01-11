import express from 'express';
import {
  registerGPU,
  getMyGPUs,
  getGPU,
  updateGPU,
  deleteGPU,
  getEarnings,
  getSessionHistory,
} from '../controllers/gpuProviderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and provider role
router.use(protect);
router.use(authorize('provider'));

// GPU management routes
router.post('/gpus', registerGPU);
router.get('/gpus', getMyGPUs);
router.get('/gpus/:id', getGPU);
router.put('/gpus/:id', updateGPU);
router.delete('/gpus/:id', deleteGPU);

// Earnings and session history
router.get('/earnings', getEarnings);
router.get('/sessions', getSessionHistory);

export default router;
