import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['MANGA', 'USER'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Report', reportSchema);
