import express from 'express';
import { getAdminStats } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', getAdminStats);

export default router;
