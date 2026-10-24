import express from 'express';
import {
  getBookingAvailability,
  createBooking,
  getMyBookings,
  getAllBookings,
  confirmBooking,
  declineBooking,
  cancelBooking,
} from '../controllers/wallBookingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: View rates and booked dates
router.get('/availability', getBookingAvailability);

// Customer-only: Create a booking
router.post('/', requireAuth, requireRole('customer'), createBooking);

// Customer-only: View my own bookings
router.get('/my', requireAuth, requireRole('customer'), getMyBookings);

// Customer-only: Cancel my own eligible booking (>= 3 days before date)
router.put('/:id/cancel', requireAuth, requireRole('customer'), cancelBooking);

// Admin-only: View all bookings
router.get('/all', requireAuth, requireRole('admin'), getAllBookings);

// Admin-only: Confirm or decline a booking
router.put('/:id/confirm', requireAuth, requireRole('admin'), confirmBooking);
router.put('/:id/decline', requireAuth, requireRole('admin'), declineBooking);

export default router;
