import { Router } from 'express';
import { AdminBookingController } from '../controllers/AdminBookingController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.get('/', authenticate, requireAdmin, AdminBookingController.list);
router.get('/:id', authenticate, requireAdmin, AdminBookingController.getById);
router.patch('/:id', authenticate, requireAdmin, AdminBookingController.updateStatus);

export default router;
