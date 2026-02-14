import { Router } from 'express';
import { getLibrary, removeLibraryItem, upsertLibraryItem } from '../controllers/userFeaturesController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.get('/', requireAuth, getLibrary);
router.post('/:mangaId', requireAuth, upsertLibraryItem);
router.delete('/:mangaId', requireAuth, removeLibraryItem);

export default router;
