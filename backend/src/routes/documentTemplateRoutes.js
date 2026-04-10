import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { DocumentTemplateController } from '../controllers/DocumentTemplateController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } }); // 4 MB — Vercel body limit is 4.5 MB

const CATEGORIES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

router.get('/', authenticate, requireAdmin, DocumentTemplateController.list);

router.post('/upload', authenticate, requireAdmin, upload.single('file'), DocumentTemplateController.upload);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('file_url').isURL().withMessage('Valid file URL is required'),
    body('file_name').trim().notEmpty().withMessage('File name is required'),
    body('file_size').optional({ values: 'falsy' }).isInt({ min: 0 }).withMessage('File size must be a non-negative integer'),
  ],
  handleValidation,
  DocumentTemplateController.createFromUrl,
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  [param('id').isInt({ min: 1 }).withMessage('Template ID must be a positive integer')],
  handleValidation,
  DocumentTemplateController.delete,
);

export default router;
