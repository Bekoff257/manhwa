import { Router } from 'express';
import {
  createManga,
  deleteManga,
  getLikeStatus,
  getMangaById,
  incrementView,
  listManga,
  reportManga,
  searchManga,
  toggleLike,
  updateManga
} from '../controllers/mangaController.js';
import { optionalAuth, requireAuth, requireNotBanned } from '../middleware/auth.js';
import { upload, validateMangaFiles } from '../middleware/upload.js';

const router = Router();

router.get('/', optionalAuth, listManga);
router.get('/search', optionalAuth, searchManga);
router.get('/:id/like', optionalAuth, getLikeStatus);
router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/view', optionalAuth, incrementView);
router.post('/:id/report', requireAuth, reportManga);
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
router.delete('/:id', requireAuth, deleteManga);

export default router;
