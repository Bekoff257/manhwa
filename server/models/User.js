import mongoose from 'mongoose';

export const ROLES = ['USER', 'VERIFIED', 'MODERATOR', 'ADMIN', 'OWNER'];

const banSchema = new mongoose.Schema(
  {
    isBanned: { type: Boolean, default: false },
    until: { type: Date, default: null },
    reason: { type: String, default: null }
  },
  { _id: false }
);

const libraryItemSchema = new mongoose.Schema(
  {
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true },
    status: { type: String, enum: ['PLANNED', 'READING', 'COMPLETED'], default: 'PLANNED' },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const progressItemSchema = new mongoose.Schema(
  {
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true },
    page: { type: Number, default: 1, min: 1 },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const creatorBadgeSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
      default: 'NONE'
    },
    message: { type: String, default: '' },
    note: { type: String, default: '' },
    appliedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'USER' },
    ban: { type: banSchema, default: () => ({}) },
    library: { type: [libraryItemSchema], default: [] },
    progress: { type: [progressItemSchema], default: [] },
    creatorBadge: { type: creatorBadgeSchema, default: () => ({}) }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('User', userSchema);
