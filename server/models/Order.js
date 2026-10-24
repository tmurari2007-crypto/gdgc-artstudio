import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer'],
      index: true,
    },
    painting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Painting',
      required: [true, 'Order must be for a specific painting'],
      index: true,
    },
    // Historical price at time of purchase to ensure price changes don't alter history
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['placed', 'cancelled'],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
      required: true,
      index: true,
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
