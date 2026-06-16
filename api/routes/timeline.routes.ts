import { Router } from 'express';
import * as timelineController from '../controllers/timeline.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.get('/', authMiddleware, timelineController.getUserTimeline);
export default router;
