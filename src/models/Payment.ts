import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  },
  billingMonth: {
    type: String,
    required: true, // Format: "2025-06"
  },
  paidAt: {
    type: Date,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  collectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  collectedByName: {
    type: String,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mobile_banking', 'bank_transfer'],
    default: 'cash',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ billingMonth: 1 });
paymentSchema.index({ paidAt: 1 });
paymentSchema.index({ collectedBy: 1 });

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
