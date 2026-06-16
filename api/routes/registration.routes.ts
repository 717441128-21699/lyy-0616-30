import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/my', authMiddleware, registrationController.getMyRegistrations);
router.get('/:id', authMiddleware, registrationController.getRegistrationDetail);
router.put('/:id/audit', authMiddleware, requireRole('organization'), registrationController.auditRegistration);
router.put('/:id/cancel', authMiddleware, registrationController.cancelRegistration);

router.post('/checkin', authMiddleware, requireRole('organization'), registrationController.checkIn);
router.post('/checkout', authMiddleware, requireRole('organization'), registrationController.checkOut);

export default router;
