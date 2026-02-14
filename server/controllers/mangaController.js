import path from 'path';
import Manga from '../models/Manga.js';
import { supabase } from '../config/supabase.js';

const sanitizeFileName = (filename = '') =>
  path
    .parse(filename)
    .name.replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file';

export const createManga = async (req, res) => {
  try {
    const { title, description = '', author = '', genres = '' } = req.body;
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
      author,
      genres: String(genres)
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      pdfUrl,
      thumbnailUrl,
      uploadedBy: req.user._id
    });

    const populated = await manga.populate('uploadedBy', 'username role avatar');
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

  const [items, total] = await Promise.all([
    Manga.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploadedBy', 'username role avatar'),
    Manga.countDocuments()
  ]);

  res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
};

export const getMangaById = async (req, res) => {
  const manga = await Manga.findById(req.params.id).populate('uploadedBy', 'username role avatar');
  if (!manga) return res.status(404).json({ message: 'Manga not found' });
  res.json({ manga });
};

export const deleteManga = async (req, res) => {
  const manga = await Manga.findById(req.params.id);
  if (!manga) return res.status(404).json({ message: 'Manga not found' });

  const isOwner = manga.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = ['ADMIN', 'OWNER'].includes(req.user.role);

  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

  await manga.deleteOne();
  res.json({ message: 'Manga deleted' });
};
