import mongoose from 'mongoose';

// Canonical items and glazes fallback catalog (derived from studio catalog specification)
export const VALID_POTTERY_ITEMS = [
  'Ceramic Mug',
  'Artisan Vase',
  'Serving Bowl',
  'Decorative Plate',
  'Planter Pot',
  'Tea Set Pot',
];

export const VALID_GLAZE_OPTIONS = [
  'Matte Terracotta',
  'Earthy Sage Green',
  'Speckled Sand',
  'Ocean Cobalt Blue',
  'Rustic Charcoal',
  'Warm Ivory Glaze',
];

const potteryRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Pottery request must belong to a customer'],
      index: true,
    },
    item: {
      type: String,
      required: [true, 'Pottery item is required'],
      trim: true,
      enum: {
        values: VALID_POTTERY_ITEMS,
        message: '{VALUE} is not an available studio pottery item',
      },
    },
    glaze: {
      type: String,
      required: [true, 'Glaze option is required'],
      trim: true,
      enum: {
        values: VALID_GLAZE_OPTIONS,
        message: '{VALUE} is not an available studio glaze option',
      },
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [12, 'Quantity cannot exceed 12'],
    },
    // Normalized neededBy date in 'YYYY-MM-DD' format, must be at least 14 days in future
    neededBy: {
      type: String,
      required: [true, 'Needed-by date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Needed-by date must be in YYYY-MM-DD format'],
    },
    specialNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Special notes cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['requested', 'accepted', 'declined', 'cancelled'],
        message: '{VALUE} is not a valid pottery request status',
      },
      default: 'requested',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

potteryRequestSchema.index({ customer: 1, createdAt: -1 });

export const PotteryRequest = mongoose.model('PotteryRequest', potteryRequestSchema);
