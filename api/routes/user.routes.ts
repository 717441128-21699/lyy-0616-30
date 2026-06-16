import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUserStats } from '../controllers/certificate.controller.js';
import { getMyFeedback } from '../controllers/feedback.controller.js';

const router = Router();

router.get('/stats', authMiddleware, getUserStats);
router.get('/feedback', authMiddleware, getMyFeedback);

export default router;
