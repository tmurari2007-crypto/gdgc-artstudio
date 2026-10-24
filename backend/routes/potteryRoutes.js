import express from 'express';
import {
  getPotteryCatalog,
  createPotteryRequest,
  getMyPotteryRequests,
  getAllPotteryRequests,
  editPotteryRequest,
  cancelPotteryRequest,
  acceptPotteryRequest,
  declinePotteryRequest,
} from '../controllers/potteryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: View official catalog of pottery items and glazes
router.get('/catalog', getPotteryCatalog);

// Customer-only: Submit custom pottery request
router.post('/', requireAuth, requireRole('customer'), createPotteryRequest);

// Customer-only: View my own requests
router.get('/my', requireAuth, requireRole('customer'), getMyPotteryRequests);

// Customer-only: Edit or cancel only while status is 'requested'
router.put('/:id', requireAuth, requireRole('customer'), editPotteryRequest);
router.put('/:id/cancel', requireAuth, requireRole('customer'), cancelPotteryRequest);

// Admin-only: View all pottery requests
router.get('/all', requireAuth, requireRole('admin'), getAllPotteryRequests);

// Admin-only: Accept or decline request
router.put('/:id/accept', requireAuth, requireRole('admin'), acceptPotteryRequest);
router.put('/:id/decline', requireAuth, requireRole('admin'), declinePotteryRequest);

export default router;
