// routes/userRoutes.js - FIXED VERSION
import express from 'express';
import {
  registerUser,
  verifyEmailCode,
  loginUser,
  sendPasswordResetCode,
  verifyResetCode,
  resetPassword
} from '../controllers/userController.js';

const router = express.Router();

// ✅ Routes الأساسية (المتوفرة حالياً)
router.post('/register', registerUser);
router.post('/verify-code', verifyEmailCode);
router.post('/login', loginUser);
router.post('/send-reset-code', sendPasswordResetCode);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// ❌ Routes مؤقتاً معطلة (لإصلاح الخطأ)
// router.get('/profile/:email', getUserProfile);
// router.put('/profile/:email', updateUserProfile);

export default router;