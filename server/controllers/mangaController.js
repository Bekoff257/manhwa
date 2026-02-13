import Manga from '../models/Manga.js';
import { firebaseBucket } from '../config/firebaseAdmin.js';

const uploadBuffer = async (file, folder) => {
  const ext = file.originalname.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = firebaseBucket.file(filename);

  await blob.save(file.buffer, { contentType: file.mimetype, public: true });
  return `https://storage.googleapis.com/${firebaseBucket.name}/${filename}`;
};

export const createManga = async (req, res) => {
  if (!firebaseBucket) return res.status(500).json({ message: 'Firebase Storage not configured' });

  const { title, description = '', author = '', genres = '' } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  const pdfUrl = await uploadBuffer(req.files.pdf[0], 'manga-pdfs');
  const thumbnailUrl = await uploadBuffer(req.files.thumbnail[0], 'manga-thumbnails');

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
  res.status(201).json({ manga: populated });
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
