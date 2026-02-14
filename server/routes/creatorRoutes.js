import { Router } from 'express';
import { applyCreatorBadge } from '../controllers/userFeaturesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/apply', requireAuth, applyCreatorBadge);

export default router;
