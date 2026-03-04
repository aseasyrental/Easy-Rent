import { Router } from 'express';
import { param } from 'express-validator';
import multer from 'multer';
import { PropertyMediaController } from '../controllers/PropertyMediaController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const imageIdParam = [
  param('imageId').isInt({ min: 1 }).withMessage('Image ID must be a positive integer'),
];

router.get(
  '/',
  idParam,
  handleValidation,
  PropertyMediaController.list,
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  idParam,
  handleValidation,
  upload.single('image'),
  PropertyMediaController.upload,
);

router.delete(
  '/:imageId',
  authenticate,
  requireAdmin,
  [...idParam, ...imageIdParam],
  handleValidation,
  PropertyMediaController.delete,
);

export default router;
