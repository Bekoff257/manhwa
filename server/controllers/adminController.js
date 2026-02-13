import Manga from '../models/Manga.js';
import User, { ROLES } from '../models/User.js';

export const listUsers = async (req, res) => {
  const q = req.query.q?.trim();
  const query = q
    ? {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      }
    : {};

  const users = await User.find(query).sort({ createdAt: -1 }).limit(100);
  res.json({ users });
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user });
};

export const deleteUser = async (req, res) => {
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete yourself' });
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
};

export const adminDeleteManga = async (req, res) => {
  await Manga.findByIdAndDelete(req.params.id);
  res.json({ message: 'Manga deleted by admin' });
};
