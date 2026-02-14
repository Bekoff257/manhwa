import { Router } from 'express';
import {
  adminDeleteManga,
  adminEditManga,
  adminRemoveThumbnail,
  approveCreatorApplication,
  banMangaAdmin,
  banUser,
  hideMangaAdmin,
  listAdminMangas,
  listCreatorApplications,
  listReports,
  listUsers,
  rejectCreatorApplication,
  resolveReport,
  unbanUser,
  unhideMangaAdmin,
  updateUserRole
} from '../controllers/adminController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/users', requireAuth, requireRoles('ADMIN', 'OWNER'), listUsers);
router.patch('/users/:id/role', requireAuth, requireRoles('ADMIN', 'OWNER'), updateUserRole);
router.post('/users/:id/ban', requireAuth, requireRoles('ADMIN', 'OWNER'), banUser);
router.post('/users/:id/unban', requireAuth, requireRoles('ADMIN', 'OWNER'), unbanUser);

router.get('/mangas', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), listAdminMangas);
router.patch('/mangas/:id', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), adminEditManga);
router.post('/mangas/:id/hide', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), hideMangaAdmin);
router.post('/mangas/:id/unhide', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), unhideMangaAdmin);
router.post('/mangas/:id/ban', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), banMangaAdmin);
router.delete('/mangas/:id', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), adminDeleteManga);
router.post('/mangas/:id/remove-thumbnail', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), adminRemoveThumbnail);

router.get('/reports', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), listReports);
router.post('/reports/:id/resolve', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), resolveReport);

router.get('/creator-applications', requireAuth, requireRoles('ADMIN', 'OWNER'), listCreatorApplications);
router.post('/creator-applications/:userId/approve', requireAuth, requireRoles('ADMIN', 'OWNER'), approveCreatorApplication);
router.post('/creator-applications/:userId/reject', requireAuth, requireRoles('ADMIN', 'OWNER'), rejectCreatorApplication);

export default router;
