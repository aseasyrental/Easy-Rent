import { Router } from 'express';
import { body, param } from 'express-validator';
import multer from 'multer';
import { DocumentController } from '../controllers/DocumentController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';
import { handleValidation } from '../middleware/validate.js';

const router = Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } }); // 4 MB — Vercel body limit is 4.5 MB

const DOC_TYPES = ['lease', 'agreement', 'form', 'inspection', 'notice'];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('Property ID must be a positive integer'),
];

const docIdParam = [
  param('docId').isInt({ min: 1 }).withMessage('Document ID must be a positive integer'),
];

router.get('/', authenticate, requireAdmin, idParam, handleValidation, DocumentController.list);

router.post(
  '/upload',
  authenticate,
  requireAdmin,
  idParam,
  handleValidation,
  upload.single('file'),
  DocumentController.upload,
);

router.post(
  '/',
  authenticate,
  requireAdmin,
  [
    ...idParam,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('type').isIn(DOC_TYPES).withMessage(`Type must be one of: ${DOC_TYPES.join(', ')}`),
    body('file_url').isURL().withMessage('Valid file URL is required'),
  ],
  handleValidation,
  DocumentController.createFromUrl,
);

router.delete(
  '/:docId',
  authenticate,
  requireAdmin,
  [...idParam, ...docIdParam],
  handleValidation,
  DocumentController.delete,
);

export default router;
