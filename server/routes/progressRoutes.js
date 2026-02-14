import { Router } from 'express';
import { getProgress, saveProgress } from '../controllers/userFeaturesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/:mangaId', requireAuth, getProgress);
router.post('/:mangaId', requireAuth, saveProgress);

export default router;
