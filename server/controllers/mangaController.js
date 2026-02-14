import path from 'path';
import Manga from '../models/Manga.js';
import { supabase } from '../config/supabase.js';

const MODERATOR_ROLES = ['MODERATOR', 'ADMIN', 'OWNER'];
const sanitizeFileName = (filename = '') =>
  path
    .parse(filename)
    .name.replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const canModeratorManage = (manga, user) => {
  if (['ADMIN', 'OWNER'].includes(user.role)) return true;
  if (user.role !== 'MODERATOR') return false;
  return manga.moderation.hidden || manga.uploaderId?.role !== 'OWNER';
};

const canEditManga = (manga, user) => {
  const isUploader = manga.uploaderId?._id?.toString() === user._id.toString();
  if (isUploader) return true;
  return canModeratorManage(manga, user);
};

const canDeleteManga = (manga, user) => {
  if (canModeratorManage(manga, user)) return true;
  const isUploader = manga.uploaderId?._id?.toString() === user._id.toString();
  if (!isUploader) return false;
  return !manga.moderation.hidden;
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
  if (error) {
    console.error('Supabase remove failed:', error.message);
  }
};

export const createManga = async (req, res) => {
  try {
    const { title, description = '', tags = '', status = 'ONGOING' } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const pdfFile = req.files?.pdf?.[0];
    const thumbFile = req.files?.thumbnail?.[0];

    if (!pdfFile || !thumbFile) {
      return res.status(400).json({ message: 'PDF and thumbnail are required' });
    }

    const safeFileName = sanitizeFileName(pdfFile.originalname || title);
    const pdfPath = `manga-pdfs/${Date.now()}-${safeFileName}.pdf`;

    const { error: pdfError } = await supabase.storage.from('manga-bucket').upload(pdfPath, pdfFile.buffer, {
      contentType: pdfFile.mimetype,
      upsert: false
    });

    if (pdfError) return res.status(500).json({ message: pdfError.message });

    const { data: pdfPublic } = supabase.storage.from('manga-bucket').getPublicUrl(pdfPath);
    const pdfUrl = pdfPublic.publicUrl;

    const thumbExt = path.extname(thumbFile.originalname || '').replace('.', '') || 'jpg';
    const thumbPath = `thumbnails/${Date.now()}-${safeFileName}.${thumbExt}`;

    const { error: thumbError } = await supabase.storage
      .from('manga-bucket')
      .upload(thumbPath, thumbFile.buffer, {
        contentType: thumbFile.mimetype,
        upsert: false
      });

    if (thumbError) return res.status(500).json({ message: thumbError.message });

    const { data: thumbPublic } = supabase.storage.from('manga-bucket').getPublicUrl(thumbPath);
    const thumbnailUrl = thumbPublic.publicUrl;

    const manga = await Manga.create({
      title,
      description,
      tags: parseTags(tags),
      status,
      pdfUrl,
      thumbnailUrl,
      uploaderId: req.user._id,
      uploaderName: req.user.username
    });

    const populated = await manga.populate('uploaderId', 'username role avatar');
    return res.status(201).json({ manga: populated });
  } catch (error) {
    console.error('Create manga error:', error);
    return res.status(500).json({ message: 'Failed to create manga' });
  }
};

export const listManga = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 12), 30);
  const skip = (page - 1) * limit;

  const filter = req.user && MODERATOR_ROLES.includes(req.user.role) ? {} : { 'moderation.hidden': { $ne: true } };

  const [items, total] = await Promise.all([
    Manga.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploaderId', 'username role avatar'),
    Manga.countDocuments(filter)
  ]);

  res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
};

export const getMangaById = async (req, res) => {
  const manga = await Manga.findById(req.params.id).populate('uploaderId', 'username role avatar');
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  if (manga.moderation.hidden && (!req.user || !MODERATOR_ROLES.includes(req.user.role))) {
    return res.status(404).json({ message: 'Manga not found' });
  }

  res.json({ manga });
};

export const updateManga = async (req, res) => {
  const manga = await Manga.findById(req.params.id).populate('uploaderId', 'role');
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  if (!canEditManga(manga, req.user)) return res.status(403).json({ message: 'Forbidden' });

  const { title, description, tags, status } = req.body;
  if (title !== undefined) manga.title = String(title).trim();
  if (description !== undefined) manga.description = description;
  if (status !== undefined) manga.status = status;
  if (tags !== undefined) manga.tags = parseTags(tags);

  await manga.save();
  const populated = await manga.populate('uploaderId', 'username role avatar');
  return res.json({ manga: populated });
};

export const hideManga = async (req, res) => {
  const manga = await Manga.findById(req.params.id);
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  if (!MODERATOR_ROLES.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });

  manga.moderation.hidden = true;
  manga.moderation.hiddenBy = req.user._id.toString();
  manga.moderation.hiddenReason = req.body.reason?.trim() || null;
  await manga.save();

  return res.json({ manga });
};

export const unhideManga = async (req, res) => {
  const manga = await Manga.findById(req.params.id);
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  if (!MODERATOR_ROLES.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });

  manga.moderation.hidden = false;
  manga.moderation.hiddenBy = null;
  manga.moderation.hiddenReason = null;
  await manga.save();

  return res.json({ manga });
};

export const deleteManga = async (req, res) => {
  const manga = await Manga.findById(req.params.id).populate('uploaderId', 'role');
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  if (!canDeleteManga(manga, req.user)) return res.status(403).json({ message: 'Forbidden' });

  await removeStorageFiles(manga);
  await manga.deleteOne();

  return res.json({ message: 'Manga deleted' });
};

export const listAdminMangas = async (req, res) => {
  const q = req.query.q?.trim();
  const filter = q
    ? {
        $or: [{ title: { $regex: q, $options: 'i' } }, { uploaderName: { $regex: q, $options: 'i' } }]
      }
    : {};

  const mangas = await Manga.find(filter).sort({ createdAt: -1 }).limit(200).populate('uploaderId', 'username role avatar');
  return res.json({ mangas });
};
