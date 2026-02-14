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

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'USER' },
    ban: { type: banSchema, default: () => ({}) }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('User', userSchema);
