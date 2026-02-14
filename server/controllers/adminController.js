import Manga from '../models/Manga.js';
import Report from '../models/Report.js';
import User, { ROLES } from '../models/User.js';
import { hasRoleAtLeast } from '../middleware/auth.js';
import { deleteManga as deleteMangaController, removeMangaThumbnail, updateManga, changeModerationStatus } from './mangaController.js';

const ROLE_WEIGHT = { USER: 0, VERIFIED: 1, MODERATOR: 2, ADMIN: 3, OWNER: 4 };

export const listUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const query = q ? { $or: [{ username: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] } : {};
    const users = await User.find(query).sort({ createdAt: -1 }).limit(150).select('username email avatar role ban creatorBadge createdAt');
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list users' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

    const actor = req.user;
    if (role === 'OWNER' && actor.role !== 'OWNER') return res.status(403).json({ message: 'Only owner can assign OWNER role' });
    if (actor.role === 'ADMIN' && !hasRoleAtLeast('ADMIN', role)) return res.status(403).json({ message: 'Admins can assign up to ADMIN role' });

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'OWNER' && actor.role !== 'OWNER') return res.status(403).json({ message: 'Cannot modify owner account' });
    if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] >= ROLE_WEIGHT[actor.role]) return res.status(403).json({ message: 'Cannot modify equal or higher role' });

    target.role = role;
    await target.save();
    return res.json({ user: target });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user role' });
  }
};

export const banUser = async (req, res) => {
  try {
    const actor = req.user;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (actor._id.toString() === target._id.toString()) return res.status(400).json({ message: 'You cannot ban yourself' });
    if (target.role === 'OWNER' && actor.role !== 'OWNER') return res.status(403).json({ message: 'Cannot ban owner account' });
    if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] >= ROLE_WEIGHT[actor.role]) return res.status(403).json({ message: 'Cannot ban equal or higher role' });

    const { durationMinutes = null, reason = null } = req.body;
    target.ban = { isBanned: true, until: durationMinutes ? new Date(Date.now() + Number(durationMinutes) * 60000) : null, reason: reason?.trim() || null };
    await target.save();
    return res.json({ user: target });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to ban user' });
  }
};

export const unbanUser = async (req, res) => {
  try {
    const actor = req.user;
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'OWNER' && actor.role !== 'OWNER') return res.status(403).json({ message: 'Cannot unban owner account' });
    if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] >= ROLE_WEIGHT[actor.role]) return res.status(403).json({ message: 'Cannot unban equal or higher role' });

    target.ban = { isBanned: false, until: null, reason: null };
    await target.save();
    return res.json({ user: target });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to unban user' });
  }
};

export const listAdminMangas = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const status = req.query.status?.trim();
    const filter = {};
    if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { uploaderName: { $regex: q, $options: 'i' } }];
    if (status) filter['moderation.status'] = status;
    const mangas = await Manga.find(filter).sort({ createdAt: -1 }).limit(200).populate('uploaderId', 'username role avatar creatorBadge');
    return res.json({ mangas });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list mangas' });
  }
};

export const adminEditManga = updateManga;
export const adminDeleteManga = deleteMangaController;
export const adminRemoveThumbnail = removeMangaThumbnail;

export const hideMangaAdmin = (req, res) => changeModerationStatus({ ...req, body: { ...req.body, status: 'HIDDEN' } }, res);
export const unhideMangaAdmin = (req, res) => changeModerationStatus({ ...req, body: { ...req.body, status: 'ACTIVE', reason: null } }, res);
export const banMangaAdmin = (req, res) => changeModerationStatus({ ...req, body: { ...req.body, status: 'BANNED' } }, res);

export const listReports = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const reports = await Report.find(filter).sort({ createdAt: -1 }).limit(300).populate('reporterId', 'username role');
    const openCount = await Report.countDocuments({ status: 'OPEN' });
    return res.json({ reports, openCount });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list reports' });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    report.status = 'RESOLVED';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();
    return res.json({ report });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to resolve report' });
  }
};

export const listCreatorApplications = async (_req, res) => {
  try {
    const users = await User.find({ 'creatorBadge.status': { $in: ['PENDING', 'REJECTED', 'APPROVED'] } })
      .select('username email role creatorBadge')
      .sort({ 'creatorBadge.appliedAt': -1 });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list creator applications' });
  }
};

export const approveCreatorApplication = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.creatorBadge.status = 'APPROVED';
    user.creatorBadge.reviewedAt = new Date();
    user.creatorBadge.reviewedBy = req.user._id;
    user.creatorBadge.note = '';
    await user.save();
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to approve creator application' });
  }
};

export const rejectCreatorApplication = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.creatorBadge.status = 'REJECTED';
    user.creatorBadge.reviewedAt = new Date();
    user.creatorBadge.reviewedBy = req.user._id;
    user.creatorBadge.note = req.body.note || '';
    await user.save();
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reject creator application' });
  }
};
