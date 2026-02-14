import mongoose from 'mongoose';
import Manga from '../models/Manga.js';
import Report from '../models/Report.js';
import User from '../models/User.js';

const validLibraryStatuses = ['PLANNED', 'READING', 'COMPLETED'];

export const getLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const ids = user.library.map((item) => item.mangaId);
    const mangas = await Manga.find({ _id: { $in: ids } }).select('title thumbnailUrl author views likesCount moderation').lean();
    const map = new Map(mangas.map((m) => [m._id.toString(), m]));
    const items = user.library.map((item) => ({ ...item, manga: map.get(item.mangaId.toString()) || null }));
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch library' });
  }
};

export const upsertLibraryItem = async (req, res) => {
  try {
    const { status } = req.body;
    if (!validLibraryStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const mangaId = new mongoose.Types.ObjectId(req.params.mangaId);
    const user = await User.findById(req.user._id);
    const existing = user.library.find((item) => item.mangaId.toString() === mangaId.toString());
    if (existing) {
      existing.status = status;
      existing.updatedAt = new Date();
    } else {
      user.library.push({ mangaId, status, updatedAt: new Date() });
    }
    await user.save();
    return res.json({ library: user.library });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update library' });
  }
};

export const removeLibraryItem = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user._id }, { $pull: { library: { mangaId: req.params.mangaId } } });
    return res.json({ message: 'Removed from library' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove library item' });
  }
};

export const getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('progress');
    const item = user.progress.find((entry) => entry.mangaId.toString() === req.params.mangaId);
    return res.json({ page: item?.page || 1 });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch progress' });
  }
};

export const saveProgress = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.body.page || 1));
    const user = await User.findById(req.user._id);
    const existing = user.progress.find((entry) => entry.mangaId.toString() === req.params.mangaId);
    if (existing) {
      existing.page = page;
      existing.updatedAt = new Date();
    } else {
      user.progress.push({ mangaId: req.params.mangaId, page, updatedAt: new Date() });
    }
    await user.save();
    return res.json({ page });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save progress' });
  }
};

export const reportUser = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    if (!reason.trim()) return res.status(400).json({ message: 'Reason is required' });
    await Report.create({ type: 'USER', targetId: req.params.id, reporterId: req.user._id, reason: reason.trim() });
    return res.status(201).json({ message: 'Report submitted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit report' });
  }
};

export const applyCreatorBadge = async (req, res) => {
  try {
    if (req.user.creatorBadge?.status === 'PENDING') return res.status(400).json({ message: 'Application already pending' });
    req.user.creatorBadge = {
      status: 'PENDING',
      message: req.body.message || '',
      note: '',
      appliedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null
    };
    await req.user.save();
    return res.json({ creatorBadge: req.user.creatorBadge });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to apply for creator badge' });
  }
};
