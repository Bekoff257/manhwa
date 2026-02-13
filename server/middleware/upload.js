import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

export const validateMangaFiles = (req, res, next) => {
  const { pdf, thumbnail } = req.files || {};

  if (!pdf?.[0] || !thumbnail?.[0]) {
    return res.status(400).json({ message: 'PDF and thumbnail are required' });
  }

  if (pdf[0].mimetype !== 'application/pdf') {
    return res.status(400).json({ message: 'Only PDF files are allowed' });
  }

  if (!thumbnail[0].mimetype.startsWith('image/')) {
    return res.status(400).json({ message: 'Thumbnail must be an image' });
  }

  next();
};
