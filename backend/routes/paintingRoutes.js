import express from 'express';
import {
  getPaintings,
  getPaintingById,
  addPainting,
  editPainting,
} from '../controllers/paintingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public: Browse paintings
router.get('/', getPaintings);
router.get('/:id', getPaintingById);

// Admin-only: Add a painting and edit an eligible available painting
router.post('/', requireAuth, requireRole('admin'), addPainting);
router.put('/:id', requireAuth, requireRole('admin'), editPainting);

export default router;
