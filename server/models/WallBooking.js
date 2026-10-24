import mongoose from 'mongoose';

const wallBookingSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a customer'],
      index: true,
    },
    // Normalized booking date string in 'YYYY-MM-DD' format to avoid UTC/timezone shifts
    bookingDate: {
      type: String,
      required: [true, 'Booking date is required (YYYY-MM-DD)'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be in YYYY-MM-DD format'],
    },
    wallSize: {
      type: Number,
      required: [true, 'Wall size in square feet is required'],
      min: [10, 'Wall size must be at least 10 square feet'],
      max: [500, 'Wall size cannot exceed 500 square feet'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    // Applicable rate locked at time of booking
    ratePerSqFt: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    // Total price locked at time of booking (wallSize * ratePerSqFt)
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: {
        values: ['requested', 'confirmed', 'declined', 'cancelled'],
        message: '{VALUE} is not a valid booking status',
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

// CRITICAL UNIQUE PARTIAL INDEX:
// Ensures that only one ACTIVE booking (requested or confirmed) can exist per bookingDate.
// Cancelled or declined bookings do NOT hold the date and automatically release it!
wallBookingSchema.index(
  { bookingDate: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['requested', 'confirmed'] },
    },
  }
);

wallBookingSchema.index({ customer: 1, createdAt: -1 });

export const WallBooking = mongoose.model('WallBooking', wallBookingSchema);
