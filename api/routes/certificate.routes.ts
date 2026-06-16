import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/my', authMiddleware, certificateController.getMyCertificates);
router.get('/next-level', authMiddleware, certificateController.getNextCertificateLevel);
router.post('/apply', authMiddleware, certificateController.applyCertificate);
router.get('/:id', certificateController.getCertificateDetail);
router.get('/:id/pdf', certificateController.downloadCertificatePdf);

export default router;
