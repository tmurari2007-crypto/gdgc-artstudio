import express from 'express';
import {
  purchasePainting,
  getMyOrders,
  getAllOrders,
  cancelOrder,
} from '../controllers/orderController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Customer-only: Purchase a painting
router.post('/purchase', requireAuth, requireRole('customer'), purchasePainting);

// Customer-only: View my own orders
router.get('/my', requireAuth, requireRole('customer'), getMyOrders);

// Customer-only: Cancel my own order
router.put('/:id/cancel', requireAuth, requireRole('customer'), cancelOrder);

// Admin-only: View all orders
router.get('/all', requireAuth, requireRole('admin'), getAllOrders);

export default router;
