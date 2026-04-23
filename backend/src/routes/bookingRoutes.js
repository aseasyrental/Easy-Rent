import { Router } from 'express';
import { BookingController } from '../controllers/BookingController.js';
import { availabilityLimiter, bookingCreateLimiter, verifyCancelLimiter } from '../middleware/rateLimiters.js';

const router = Router();

// Public routes
router.get('/availability', availabilityLimiter, BookingController.availability);
router.post('/', bookingCreateLimiter, BookingController.create);
router.get('/verify/:token', verifyCancelLimiter, BookingController.verifyPage);
router.post('/verify/:token', verifyCancelLimiter, BookingController.verify);
router.get('/cancel/:token', verifyCancelLimiter, BookingController.cancelPage);
router.post('/cancel/:token', verifyCancelLimiter, BookingController.cancel);

export default router;
