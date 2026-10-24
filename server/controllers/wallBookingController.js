import { WallBooking } from '../models/WallBooking.js';

// Studio configured rate per sq ft (defaults to $25 / sq ft)
export const getStudioWallRate = () => {
  return Number(process.env.WALL_PAINTING_RATE_PER_SQFT) || 25;
};

/**
 * Helper to validate booking date range:
 * Between 7 to 90 days in the future from today.
 * Uses normalized date strings (YYYY-MM-DD) to prevent timezone drift.
 */
export const validateBookingDateRange = (dateStr) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, message: 'Invalid date format. Use YYYY-MM-DD.' };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetDate - todayUTC) / msPerDay);

  if (diffDays < 7 || diffDays > 90) {
    return {
      valid: false,
      message: `Booking date must be between 7 and 90 days away from today (Selected is ${diffDays} days away).`,
      diffDays,
    };
  }

  return { valid: true, diffDays };
};

/**
 * Helper to check cancellation cutoff:
 * Customer can cancel ONLY until 3 days before the date.
 */
export const canCancelBooking = (bookingDateStr) => {
  const [year, month, day] = bookingDateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetDate - todayUTC) / msPerDay);

  return diffDays >= 3;
};

/**
 * Public/Customer endpoint to check studio rate and taken dates
 */
export const getBookingAvailability = async (req, res, next) => {
  try {
    const ratePerSqFt = getStudioWallRate();

    // Find all active bookings (requested or confirmed)
    const activeBookings = await WallBooking.find({
      status: { $in: ['requested', 'confirmed'] },
    }).select('bookingDate');

    const bookedDates = activeBookings.map((b) => b.bookingDate);

    res.status(200).json({
      success: true,
      ratePerSqFt,
      bookedDates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new wall booking
 * Requirements:
 * - Date between 7 to 90 days away
 * - Wall size: 10 to 500 sq ft
 * - Address required
 * - Each date booked only once (enforced by DB unique partial index)
 * - Initial status: 'requested'
 * - Server strictly calculates price = wallSize * ratePerSqFt
 */
export const createBooking = async (req, res, next) => {
  try {
    const { bookingDate, wallSize, address } = req.body;

    if (!bookingDate || wallSize === undefined || !address) {
      return res.status(400).json({
        success: false,
        message: 'Booking date, wall size, and address are required.',
      });
    }

    const numWallSize = Number(wallSize);
    if (isNaN(numWallSize) || numWallSize < 10 || numWallSize > 500) {
      return res.status(400).json({
        success: false,
        message: 'Wall size must be between 10 and 500 square feet.',
      });
    }

    if (!address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid address is required.',
      });
    }

    const dateCheck = validateBookingDateRange(bookingDate.trim());
    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: dateCheck.message,
      });
    }

    const ratePerSqFt = getStudioWallRate();
    const totalPrice = numWallSize * ratePerSqFt;

    try {
      const booking = await WallBooking.create({
        customer: req.user._id,
        bookingDate: bookingDate.trim(),
        wallSize: numWallSize,
        address: address.trim(),
        ratePerSqFt,
        totalPrice,
        status: 'requested',
      });

      const populated = await WallBooking.findById(booking._id).populate(
        'customer',
        'name email'
      );

      res.status(201).json({
        success: true,
        message: 'Wall painting booking requested successfully!',
        booking: populated,
      });
    } catch (dbError) {
      // Catch MongoDB unique index collision (code 11000) for concurrency safety
      if (dbError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'This date has already been booked by another client. Please select another date.',
        });
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * View Customer's own bookings
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await WallBooking.find({ customer: req.user._id }).sort({
      bookingDate: 1,
    });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View all bookings as admin
 */
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await WallBooking.find()
      .populate('customer', 'name email')
      .sort({ bookingDate: 1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Confirm a booking
 */
export const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await WallBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm a booking that is currently '${booking.status}'.`,
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin action: Decline a booking
 */
export const declineBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await WallBooking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline a booking that is currently '${booking.status}'.`,
      });
    }

    booking.status = 'declined';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking declined. The calendar date is now released.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Customer action: Cancel an eligible booking
 * Business rules:
 * - Customers can cancel only their own bookings.
 * - Customer accessing someone else's record gets 404 (per recruitment brief).
 * - Customer can cancel only until 3 days before the selected date.
 * - Cancelling releases the date for others.
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership: Customer can only access their own record.
    const booking = await WallBooking.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled.',
      });
    }

    if (booking.status === 'declined') {
      return res.status(400).json({
        success: false,
        message: 'This booking was declined and cannot be cancelled.',
      });
    }

    // Enforce 3-day cancellation cutoff
    if (!canCancelBooking(booking.bookingDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation deadline passed. Bookings can only be cancelled until 3 days before the booked date.',
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. The reserved date has been released.',
      booking,
    });
  } catch (error) {
    next(error);
  }
};
