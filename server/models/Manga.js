import mongoose from 'mongoose';

const mangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    genres: [{ type: String, trim: true }],
    author: { type: String, trim: true, default: '' },
    thumbnailUrl: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('Manga', mangaSchema);
