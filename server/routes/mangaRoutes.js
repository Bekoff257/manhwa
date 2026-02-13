import { Router } from 'express';
import { createManga, deleteManga, getMangaById, listManga } from '../controllers/mangaController.js';
import { requireAuth } from '../middleware/auth.js';
import { upload, validateMangaFiles } from '../middleware/upload.js';

const router = Router();

router.get('/', listManga);
router.get('/:id', getMangaById);
router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  validateMangaFiles,
  createManga
);
router.delete('/:id', requireAuth, deleteManga);

export default router;
