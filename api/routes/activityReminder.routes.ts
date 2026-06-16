import { Router } from 'express';
import * as reminderController from '../controllers/activityReminder.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.post('/', authMiddleware, reminderController.sendReminder);
router.get('/', authMiddleware, reminderController.getReminders);
export default router;
