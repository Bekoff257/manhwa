import { Router } from 'express';
import { adminDeleteManga, deleteUser, listUsers, updateUserRole } from '../controllers/adminController.js';
import { requireAuth, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRoles('ADMIN', 'OWNER'));
router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.delete('/manga/:id', adminDeleteManga);

export default router;
