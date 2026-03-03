import express from 'express';
import {
  startSession,
  stopSession,
  cancelSession,
  getSession,
  updateMetrics,
  getMetrics,
  addReview,
} from '../controllers/sessionController.js';
import {
  getMessages,
  sendMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/:id', getSession);
router.get('/:id/metrics', getMetrics);
router.post('/:id/start', startSession);
router.post('/:id/stop', stopSession);
router.post('/:id/cancel', cancelSession);
router.put('/:id/metrics', updateMetrics);
router.post('/:id/review', addReview);

// Chat routes
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);

export default router;
