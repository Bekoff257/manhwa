import { Router } from 'express';
import {
  createManga,
  deleteManga,
  getMangaById,
  hideManga,
  listManga,
  unhideManga,
  updateManga
} from '../controllers/mangaController.js';
import { optionalAuth, requireAuth, requireNotBanned, requireRoles } from '../middleware/auth.js';
import { upload, validateMangaFiles } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, listManga);
router.get('/:id', optionalAuth, getMangaById);
router.post(
  '/',
  requireAuth,
  requireNotBanned,
  upload.fields([
    { name: 'pdf', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  validateMangaFiles,
  createManga
);
router.patch('/:id', requireAuth, updateManga);
router.post('/:id/hide', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), hideManga);
router.post('/:id/unhide', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), unhideManga);
router.delete('/:id', requireAuth, deleteManga);

export default router;
