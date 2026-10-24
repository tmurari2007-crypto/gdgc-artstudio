import mongoose from 'mongoose';

const paintingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a painting title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a painting description'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [1, 'Price must be greater than zero'],
    },
    medium: {
      type: String,
      trim: true,
      default: 'Oil on Canvas',
    },
    dimensions: {
      type: String,
      trim: true,
      default: '24" x 36"',
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful query indexes
paintingSchema.index({ isAvailable: 1, createdAt: -1 });

export const Painting = mongoose.model('Painting', paintingSchema);
