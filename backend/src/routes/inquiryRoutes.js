import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { InquiryController } from '../controllers/InquiryController.js';
import { handleValidation } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { inquiryLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post(
  '/',
  inquiryLimiter,
  [
    // Optional type discriminator; defaults to 'question' in the controller.
    body('type')
      .optional()
      .isIn(['question', 'viewing_request', 'furnished_interest'])
      .withMessage('Invalid inquiry type'),
    // Furnished-interest inquiries need no property, name, or message — only
    // an email. All other types keep today's required-field behavior.
    body('property_id')
      .if((value, { req }) => (req.body.type || 'question') !== 'furnished_interest')
      .isInt({ min: 1 })
      .withMessage('property_id must be a positive integer'),
    body('name')
      .if((value, { req }) => (req.body.type || 'question') !== 'furnished_interest')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('message')
      .if((value, { req }) => (req.body.type || 'question') !== 'furnished_interest')
      .trim()
      .notEmpty()
      .withMessage('Message is required'),
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
