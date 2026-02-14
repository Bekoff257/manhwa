import Manga from '../models/Manga.js';
import User, { ROLES } from '../models/User.js';
import { hasRoleAtLeast } from '../middleware/auth.js';

const ROLE_WEIGHT = {
  USER: 0,
  VERIFIED: 1,
  MODERATOR: 2,
  ADMIN: 3,
  OWNER: 4
};

export const listUsers = async (req, res) => {
  const q = req.query.q?.trim();
  const query = q
    ? {
        $or: [{ username: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }]
      }
    : {};

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(150)
    .select('username email avatar role ban createdAt');

  return res.json({ users });
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const actor = req.user;
  if (role === 'OWNER' && actor.role !== 'OWNER') {
    return res.status(403).json({ message: 'Only owner can assign OWNER role' });
  }

  if (actor.role === 'ADMIN' && !hasRoleAtLeast('ADMIN', role)) {
    return res.status(403).json({ message: 'Admins can assign up to ADMIN role' });
  }

  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  if (target.role === 'OWNER' && actor.role !== 'OWNER') {
    return res.status(403).json({ message: 'Cannot modify owner account' });
  }

  if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] > ROLE_WEIGHT[actor.role]) {
    return res.status(403).json({ message: 'Cannot modify higher role' });
  }

  target.role = role;
  await target.save();

  return res.json({ user: target });
};

export const banUser = async (req, res) => {
  const { durationMinutes = null, reason = null } = req.body;
  const actor = req.user;

  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (actor._id.toString() === target._id.toString()) {
    return res.status(400).json({ message: 'You cannot ban yourself' });
  }
  if (target.role === 'OWNER' && actor.role !== 'OWNER') {
    return res.status(403).json({ message: 'Cannot ban owner account' });
  }

  if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] >= ROLE_WEIGHT[actor.role]) {
    return res.status(403).json({ message: 'Cannot ban equal or higher role' });
  }

  target.ban = {
    isBanned: true,
    until: durationMinutes ? new Date(Date.now() + Number(durationMinutes) * 60 * 1000) : null,
    reason: reason?.trim() || null
  };
  await target.save();

  return res.json({ user: target });
};

export const unbanUser = async (req, res) => {
  const actor = req.user;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found' });

  if (actor.role !== 'OWNER' && ROLE_WEIGHT[target.role] >= ROLE_WEIGHT[actor.role]) {
    return res.status(403).json({ message: 'Cannot unban equal or higher role' });
  }

  target.ban = { isBanned: false, until: null, reason: null };
  await target.save();

  return res.json({ user: target });
};

export const listAdminMangas = async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? {
        $or: [{ title: { $regex: q, $options: 'i' } }, { uploaderName: { $regex: q, $options: 'i' } }]
      }
    : {};

  const mangas = await Manga.find(filter).sort({ createdAt: -1 }).limit(200).populate('uploaderId', 'username role');
  return res.json({ mangas });
};
