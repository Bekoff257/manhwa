import path from 'path';
import Manga from '../models/Manga.js';
import Like from '../models/Like.js';
import Report from '../models/Report.js';
import User from '../models/User.js';
import { supabase } from '../config/supabase.js';

const MODERATOR_ROLES = ['MODERATOR', 'ADMIN', 'OWNER'];

const sanitizeFileName = (filename = '') =>
  path
    .parse(filename)
    .name.replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';

const parseCsv = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const canTouchOwnerContent = (manga, actor) => {
  if (!manga.uploaderId || ['ADMIN', 'OWNER'].includes(actor.role)) return true;
  if (actor.role !== 'MODERATOR') return true;
  return manga.uploaderId.role !== 'OWNER';
};

const getStoragePathFromPublicUrl = (publicUrl = '') => {
  const marker = '/object/public/manga-bucket/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
};

const removeStorageFiles = async (manga) => {
  const paths = [getStoragePathFromPublicUrl(manga.pdfUrl), getStoragePathFromPublicUrl(manga.thumbnailUrl)].filter(Boolean);
  if (!paths.length) return;
  const { error } = await supabase.storage.from('manga-bucket').remove(paths);
  if (error) console.error('Supabase remove failed:', error.message);
};

const removeThumbnailFile = async (manga) => {
  const pathFromUrl = getStoragePathFromPublicUrl(manga.thumbnailUrl);
  if (!pathFromUrl) return;
  const { error } = await supabase.storage.from('manga-bucket').remove([pathFromUrl]);
  if (error) console.error('Supabase thumbnail remove failed:', error.message);
};

export const createManga = async (req, res) => {
  try {
    const { title, description = '', tags = '', genres = '', author = '', status = 'ONGOING' } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const pdfFile = req.files?.pdf?.[0];
    const thumbFile = req.files?.thumbnail?.[0];
    if (!pdfFile || !thumbFile) return res.status(400).json({ message: 'PDF and thumbnail are required' });

    const safeFileName = sanitizeFileName(pdfFile.originalname || title);
    const pdfPath = `manga-pdfs/${Date.now()}-${safeFileName}.pdf`;
    const { error: pdfError } = await supabase.storage.from('manga-bucket').upload(pdfPath, pdfFile.buffer, { contentType: pdfFile.mimetype, upsert: false });
    if (pdfError) return res.status(500).json({ message: pdfError.message });
    const { data: pdfPublic } = supabase.storage.from('manga-bucket').getPublicUrl(pdfPath);

    const thumbExt = path.extname(thumbFile.originalname || '').replace('.', '') || 'jpg';
    const thumbPath = `thumbnails/${Date.now()}-${safeFileName}.${thumbExt}`;
    const { error: thumbError } = await supabase.storage.from('manga-bucket').upload(thumbPath, thumbFile.buffer, { contentType: thumbFile.mimetype, upsert: false });
    if (thumbError) return res.status(500).json({ message: thumbError.message });
    const { data: thumbPublic } = supabase.storage.from('manga-bucket').getPublicUrl(thumbPath);

    const manga = await Manga.create({
      title,
      description,
      tags: parseCsv(tags),
      genres: parseCsv(genres),
      author,
      status,
      pdfUrl: pdfPublic.publicUrl,
      thumbnailUrl: thumbPublic.publicUrl,
      uploaderId: req.user._id,
      uploaderName: req.user.username
    });

    const populated = await manga.populate('uploaderId', 'username role avatar creatorBadge');
    return res.status(201).json({ manga: populated });
  } catch (error) {
    console.error('Create manga error:', error);
    return res.status(500).json({ message: 'Failed to create manga' });
  }
};

export const listManga = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 12), 30);
    const skip = (page - 1) * limit;

    const filter = req.user && MODERATOR_ROLES.includes(req.user.role) ? {} : { 'moderation.status': 'ACTIVE' };
    const [items, total] = await Promise.all([
      Manga.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploaderId', 'username role avatar creatorBadge'),
      Manga.countDocuments(filter)
    ]);
    return res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list mangas' });
  }
};

export const searchManga = async (req, res) => {
  try {
    const { q = '', genre = '', tag = '', author = '' } = req.query;
    const filter = { 'moderation.status': 'ACTIVE' };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { author: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { genres: { $regex: q, $options: 'i' } }
      ];
    }
    if (genre) filter.genres = { $in: [new RegExp(genre, 'i')] };
    if (tag) filter.tags = { $in: [new RegExp(tag, 'i')] };
    if (author) filter.author = { $regex: author, $options: 'i' };

    const items = await Manga.find(filter).sort({ createdAt: -1 }).limit(100).populate('uploaderId', 'username role avatar creatorBadge');
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: 'Search failed' });
  }
};

export const getMangaById = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate('uploaderId', 'username role avatar creatorBadge');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    if (manga.moderation.status !== 'ACTIVE' && (!req.user || !MODERATOR_ROLES.includes(req.user.role))) {
      return res.status(404).json({ message: 'Manga not found' });
    }
    return res.json({ manga });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch manga' });
  }
};

export const updateManga = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate('uploaderId', 'role');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    const isUploader = manga.uploaderId?._id?.toString() === req.user._id.toString();
    const isStaff = MODERATOR_ROLES.includes(req.user.role);
    if (!isUploader && !isStaff) return res.status(403).json({ message: 'Forbidden' });
    if (!canTouchOwnerContent(manga, req.user)) return res.status(403).json({ message: 'Moderator cannot touch owner uploads' });

    const { title, description, tags, genres, author, status } = req.body;
    if (title !== undefined) manga.title = String(title).trim();
    if (description !== undefined) manga.description = description;
    if (status !== undefined) manga.status = status;
    if (author !== undefined) manga.author = author;
    if (tags !== undefined) manga.tags = parseCsv(tags);
    if (genres !== undefined) manga.genres = parseCsv(genres);
    await manga.save();
    return res.json({ manga: await manga.populate('uploaderId', 'username role avatar creatorBadge') });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update manga' });
  }
};

export const changeModerationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason = null } = req.body;
    const manga = await Manga.findById(id).populate('uploaderId', 'role');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    if (!canTouchOwnerContent(manga, req.user)) return res.status(403).json({ message: 'Moderator cannot moderate owner uploads' });

    manga.moderation = {
      status,
      reason,
      byUserId: req.user._id,
      updatedAt: new Date()
    };
    await manga.save();
    return res.json({ manga });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update moderation status' });
  }
};

export const deleteManga = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate('uploaderId', 'role');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    const isUploader = manga.uploaderId?._id?.toString() === req.user._id.toString();
    const isStaff = MODERATOR_ROLES.includes(req.user.role);
    if (!isUploader && !isStaff) return res.status(403).json({ message: 'Forbidden' });
    if (!canTouchOwnerContent(manga, req.user)) return res.status(403).json({ message: 'Moderator cannot delete owner uploads' });

    await removeStorageFiles(manga);
    await manga.deleteOne();
    await Like.deleteMany({ mangaId: manga._id });
    await Report.deleteMany({ type: 'MANGA', targetId: manga._id });
    await User.updateMany({}, { $pull: { library: { mangaId: manga._id }, progress: { mangaId: manga._id } } });
    return res.json({ message: 'Manga deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete manga' });
  }
};

export const removeMangaThumbnail = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).populate('uploaderId', 'role');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    if (!canTouchOwnerContent(manga, req.user)) return res.status(403).json({ message: 'Moderator cannot edit owner uploads' });
    await removeThumbnailFile(manga);
    manga.thumbnailUrl = '';
    await manga.save();
    return res.json({ manga });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to remove thumbnail' });
  }
};

export const incrementView = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    manga.views += 1;
    await manga.save();
    return res.json({ views: manga.views });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update views' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id);
    if (!manga) return res.status(404).json({ message: 'Manga not found' });

    const existing = await Like.findOne({ mangaId: manga._id, userId: req.user._id });
    let liked = false;
    if (existing) {
      await existing.deleteOne();
      manga.likesCount = Math.max(0, manga.likesCount - 1);
    } else {
      await Like.create({ mangaId: manga._id, userId: req.user._id });
      manga.likesCount += 1;
      liked = true;
    }
    await manga.save();
    return res.json({ liked, likesCount: manga.likesCount });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to toggle like' });
  }
};

export const getLikeStatus = async (req, res) => {
  try {
    const manga = await Manga.findById(req.params.id).select('likesCount');
    if (!manga) return res.status(404).json({ message: 'Manga not found' });
    const liked = req.user ? Boolean(await Like.findOne({ mangaId: manga._id, userId: req.user._id })) : false;
    return res.json({ liked, likesCount: manga.likesCount || 0 });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch like status' });
  }
};

export const reportManga = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    if (!reason.trim()) return res.status(400).json({ message: 'Reason is required' });
    await Report.create({ type: 'MANGA', targetId: req.params.id, reporterId: req.user._id, reason: reason.trim() });
    return res.status(201).json({ message: 'Report submitted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit report' });
  }
};
