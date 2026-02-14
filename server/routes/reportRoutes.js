import { Router } from 'express';
import { reportUser } from '../controllers/userFeaturesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/user/:id', requireAuth, reportUser);

export default router;
