import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  addWalletFunds,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/wallet/add', protect, addWalletFunds);

export default router;
