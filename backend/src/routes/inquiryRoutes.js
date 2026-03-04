import { Router } from 'express';
import { body } from 'express-validator';
import { InquiryController } from '../controllers/InquiryController.js';
import { handleValidation } from '../middleware/validate.js';

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

export default router;
