import mongoose from 'mongoose';

const moderationSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['ACTIVE', 'HIDDEN', 'BANNED'], default: 'ACTIVE' },
    reason: { type: String, default: null },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const mangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    author: { type: String, default: '' },
    genres: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, default: 'ONGOING' },
    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
    pdfUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploaderName: { type: String, required: true },
    moderation: { type: moderationSchema, default: () => ({}) }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('Manga', mangaSchema);
