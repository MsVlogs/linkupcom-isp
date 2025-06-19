import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  package: {
    type: String,
    required: true,
  },
  monthlyFee: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  area: {
    type: String,
    required: true,
  },
  connectionDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
customerSchema.index({ name: 1 });
customerSchema.index({ area: 1 });
customerSchema.index({ status: 1 });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
