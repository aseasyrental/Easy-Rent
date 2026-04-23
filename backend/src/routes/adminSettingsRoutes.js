import { Router } from 'express';
import { AdminSettingsController } from '../controllers/AdminSettingsController.js';
import { authenticate, requireAdmin } from '../middleware/index.js';

const router = Router();

router.get('/', authenticate, requireAdmin, AdminSettingsController.getSettings);
router.put('/', authenticate, requireAdmin, AdminSettingsController.updateSettings);
router.get('/google/auth', authenticate, requireAdmin, AdminSettingsController.googleAuth);
router.post('/google/disconnect', authenticate, requireAdmin, AdminSettingsController.googleDisconnect);

export default router;
