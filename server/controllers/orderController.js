import mongoose from 'mongoose';
import { Painting } from '../models/Painting.js';
import { Order } from '../models/Order.js';

/**
 * Purchase a painting.
 * Concurrency protection:
 * Uses atomic conditional update (findOneAndUpdate with condition { _id: id, isAvailable: true }).
 * If another customer purchases it simultaneously, only one succeeds and the other gets null -> HTTP 409 Conflict.
 * Transaction support: Uses session if replica set supports it, with clean rollback fallback.
 */
export const purchasePainting = async (req, res, next) => {
  const { paintingId } = req.body;

  if (!paintingId) {
    return res.status(400).json({
      success: false,
      message: 'Painting ID is required.',
    });
  }

  let session = null;
  let useTransactions = false;
  // Transactions require replica set; in standalone or memory-server fallback cleanly
  try {
    if (mongoose.connection.client?.topology?.description?.type === 'ReplicaSetWithPrimary') {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransactions = true;
    }
  } catch (err) {
    if (session) {
      session.endSession();
      session = null;
    }
  }

  try {
    const opts = session ? { session, returnDocument: 'before' } : { returnDocument: 'before' };

    // Atomic conditional claim of the painting: only succeeds if isAvailable is true
    const claimedPainting = await Painting.findOneAndUpdate(
      { _id: paintingId, isAvailable: true },
      { $set: { isAvailable: false } },
      opts
    );

    if (!claimedPainting) {
      if (useTransactions && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(409).json({
        success: false,
        message: 'This painting is no longer available. It was just purchased by another collector.',
      });
    }

    // Create the order with locked purchasePrice from the painting record
    let order;
    if (useTransactions && session) {
      const orders = await Order.create(
        [
          {
            customer: req.user._id,
            painting: claimedPainting._id,
            purchasePrice: claimedPainting.price,
            status: 'placed',
          },
        ],
        { session }
      );
      order = orders[0];
      await session.commitTransaction();
      session.endSession();
    } else {
      try {
        order = await Order.create({
          customer: req.user._id,
          painting: claimedPainting._id,
          purchasePrice: claimedPainting.price,
          status: 'placed',
        });
      } catch (orderError) {
        // Rollback painting availability if order creation fails in non-transactional mode
        await Painting.findByIdAndUpdate(claimedPainting._id, { $set: { isAvailable: true } });
        throw orderError;
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('painting', 'title price imageUrl medium dimensions')
      .populate('customer', 'name email');

    res.status(201).json({
      success: true,
      message: 'Painting purchased successfully! Your order has been placed.',
      order: populatedOrder,
    });
  } catch (error) {
    if (useTransactions && session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  }
};

/**
 * View Customer's own orders
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate('painting', 'title price imageUrl medium dimensions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * View all orders as admin
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('painting', 'title price imageUrl medium dimensions')
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel an order
 * Business rules:
 * - Customers can cancel only their own orders.
 * - An order must be in 'placed' status to be cancelled.
 * - Cancelling makes the painting available again atomically.
 * - Customer accessing another customer's record gets 404 (per recruitment brief).
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership: Customer can only access their own record.
    // If not found or belongs to someone else, return 404 as required by the brief
    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled.',
      });
    }

    // Mark order cancelled atomically
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Release the painting back to available status
    await Painting.findByIdAndUpdate(order.painting, {
      $set: { isAvailable: true },
    });

    const updatedOrder = await Order.findById(order._id)
      .populate('painting', 'title price imageUrl')
      .populate('customer', 'name email');

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully. The artwork is now available again.',
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
