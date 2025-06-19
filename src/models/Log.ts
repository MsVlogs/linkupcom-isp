import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
logSchema.index({ userId: 1 });
logSchema.index({ action: 1 });
logSchema.index({ createdAt: -1 });

export const Log = mongoose.models.Log || mongoose.model('Log', logSchema);
