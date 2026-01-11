import express from 'express';
import {
  startSession,
  stopSession,
  cancelSession,
  getSession,
  updateMetrics,
  getMetrics,
} from '../controllers/sessionController.js';
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

export default router;
