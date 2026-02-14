import { Router } from 'express';
import { banUser, listAdminMangas, listUsers, unbanUser, updateUserRole } from '../controllers/adminController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/users', requireAuth, requireRoles('ADMIN', 'OWNER'), listUsers);
router.patch('/users/:id/role', requireAuth, requireRoles('ADMIN', 'OWNER'), updateUserRole);
router.post('/users/:id/ban', requireAuth, requireRoles('ADMIN', 'OWNER'), banUser);
router.post('/users/:id/unban', requireAuth, requireRoles('ADMIN', 'OWNER'), unbanUser);
router.get('/mangas', requireAuth, requireRoles('MODERATOR', 'ADMIN', 'OWNER'), listAdminMangas);

export default router;
