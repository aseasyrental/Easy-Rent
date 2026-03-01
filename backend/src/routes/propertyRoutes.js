import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.post('/', authenticate, requireAdmin, PropertyController.create);

export default router;
