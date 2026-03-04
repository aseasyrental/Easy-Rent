import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { InquiryController } from '../controllers/InquiryController.js';
import { handleValidation } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.post(
  '/',
  [
    body('property_id').isInt({ min: 1 }).withMessage('property_id must be a positive integer'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
  ],
  handleValidation,
  InquiryController.create,
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  [
    query('status').optional().isIn(['new', 'responded', 'scheduled', 'closed']),
    query('property_id').optional().isInt({ min: 1 }),
  ],
  handleValidation,
  InquiryController.list,
);

router.get(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isInt({ min: 1 })],
  handleValidation,
  InquiryController.getById,
);

router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['new', 'responded', 'scheduled', 'closed']),
  ],
  handleValidation,
  InquiryController.updateStatus,
);

export default router;
