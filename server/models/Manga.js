import mongoose from 'mongoose';

const moderationSchema = new mongoose.Schema(
  {
    hidden: { type: Boolean, default: false },
    hiddenBy: { type: String, default: null },
    hiddenReason: { type: String, default: null }
  },
  { _id: false }
);

const mangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    status: { type: String, default: 'ONGOING' },
    pdfUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderName: { type: String, required: true },
    moderation: { type: moderationSchema, default: () => ({}) }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('Manga', mangaSchema);
