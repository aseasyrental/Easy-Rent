import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/register',
  // Locked to admins. This was a PUBLIC endpoint: anyone could create an account
  // and mint a JWT. Bill has no renter-registration feature — the only historical
  // use was bootstrapping his admin account (then promoted via direct SQL). Gating
  // it behind admin auth closes the open door without removing the capability.
  authenticate,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  handleValidation,
  AuthController.register,
);

router.post(
  '/login',
  loginLimiter,
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidation,
  AuthController.login,
);

router.get('/me', authenticate, AuthController.me);

export default router;
