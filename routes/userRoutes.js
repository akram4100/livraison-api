// routes/userRoutes.js
import express from "express";
import {
  registerUser,
  verifyEmailCode,
  loginUser,
  sendPasswordResetCode,
  verifyResetCode,
  resetPassword
} from "../controllers/userController.js";

const router = express.Router();

// 🔹 Routes للتسجيل والتحقق
router.post("/register", registerUser);
router.post("/verify-code", verifyEmailCode);
router.post("/login", loginUser); // المسار الآن: /api/login

// 🔹 Routes لكلمة المرور
router.post("/send-reset-code", sendPasswordResetCode);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password", resetPassword);

export default router;