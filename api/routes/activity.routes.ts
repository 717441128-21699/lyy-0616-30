import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import * as registrationController from '../controllers/registration.controller.js';
import * as feedbackController from '../controllers/feedback.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', activityController.getActivityList);
router.get('/my', authMiddleware, requireRole('organization'), activityController.getMyActivities);
router.get('/stats', authMiddleware, activityController.getActivityStats);
router.get('/:id/stats-detail', authMiddleware, activityController.getActivityDetailStats);
router.get('/:id', activityController.getActivityDetail);

router.post('/', authMiddleware, requireRole('organization'), activityController.createActivity);
router.put('/:id', authMiddleware, requireRole('organization'), activityController.updateActivity);
router.delete('/:id', authMiddleware, requireRole('organization'), activityController.deleteActivity);

router.post('/:activityId/register', authMiddleware, registrationController.registerForActivity);
router.get('/:activityId/registrations', authMiddleware, requireRole('organization'), registrationController.getActivityRegistrations);

router.post('/:id/summary', authMiddleware, requireRole('organization'), activityController.addActivitySummary);

router.get('/:activityId/feedback', feedbackController.getActivityFeedback);
router.post('/feedback', authMiddleware, feedbackController.createFeedback);

export default router;
