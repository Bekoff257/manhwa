import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    mangaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manga', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

likeSchema.index({ mangaId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Like', likeSchema);
