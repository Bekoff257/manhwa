import { Router } from 'express';
import { getCurrentUser, syncUser } from '../controllers/authController.js';
import { requireAuth, requireFirebase } from '../middleware/auth.js';

const router = Router();

router.post('/sync', requireFirebase, syncUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;
