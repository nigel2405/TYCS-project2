import express from 'express';
import {
  browseGPUs,
  getGPUDetails,
  requestSession,
  getMySessions,
  getConsumerSummary,
} from '../controllers/gpuConsumerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and consumer role
router.use(protect);
router.use(authorize('consumer', 'provider', 'admin')); // Allow all authenticated users to browse

// GPU browsing routes
router.get('/gpus', browseGPUs);
router.get('/gpus/:id', getGPUDetails);

// Session management (consumer-specific)
router.post('/sessions/request', authorize('consumer'), requestSession);
router.get('/sessions', authorize('consumer'), getMySessions);
router.get('/summary', authorize('consumer'), getConsumerSummary);

export default router;
