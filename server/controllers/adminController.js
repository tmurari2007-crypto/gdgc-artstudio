import { Painting } from '../models/Painting.js';
import { Order } from '../models/Order.js';
import { WallBooking } from '../models/WallBooking.js';
import { PotteryRequest } from '../models/PotteryRequest.js';
import { User } from '../models/User.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalPaintings,
      availablePaintings,
      soldPaintings,
      totalOrders,
      activeOrders,
      totalBookings,
      requestedBookings,
      confirmedBookings,
      totalPotteryRequests,
      requestedPottery,
      acceptedPottery,
      totalCustomers,
    ] = await Promise.all([
      Painting.countDocuments(),
      Painting.countDocuments({ isAvailable: true }),
      Painting.countDocuments({ isAvailable: false }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'placed' }),
      WallBooking.countDocuments(),
      WallBooking.countDocuments({ status: 'requested' }),
      WallBooking.countDocuments({ status: 'confirmed' }),
      PotteryRequest.countDocuments(),
      PotteryRequest.countDocuments({ status: 'requested' }),
      PotteryRequest.countDocuments({ status: 'accepted' }),
      User.countDocuments({ role: 'customer' }),
    ]);

    // Calculate revenue from placed orders and confirmed wall bookings
    const placedOrders = await Order.find({ status: 'placed' }).select('purchasePrice');
    const paintingRevenue = placedOrders.reduce((sum, o) => sum + (o.purchasePrice || 0), 0);

    const confirmedBookingsData = await WallBooking.find({ status: 'confirmed' }).select(
      'totalPrice'
    );
    const wallPaintingRevenue = confirmedBookingsData.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    res.status(200).json({
      success: true,
      stats: {
        paintings: {
          total: totalPaintings,
          available: availablePaintings,
          sold: soldPaintings,
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
          revenue: paintingRevenue,
        },
        bookings: {
          total: totalBookings,
          requested: requestedBookings,
          confirmed: confirmedBookings,
          revenue: wallPaintingRevenue,
        },
        pottery: {
          total: totalPotteryRequests,
          requested: requestedPottery,
          accepted: acceptedPottery,
        },
        customers: totalCustomers,
      },
    });
  } catch (error) {
    next(error);
  }
};
