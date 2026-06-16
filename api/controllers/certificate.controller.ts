import { Request, Response } from 'express';
import * as certificateService from '../services/certificate.service.js';
import { generateCertificatePdf } from '../services/pdf.service.js';
import type { CertificateLevel } from '../../shared/types.js';

export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const stats = certificateService.getUserStats(req.user.userId);
    res.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取统计数据失败';
    res.status(500).json({ error: message });
  }
}

export async function getMyCertificates(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const certificates = certificateService.getCertificatesByUser(req.user.userId);
    res.json({ list: certificates });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取证书列表失败';
    res.status(500).json({ error: message });
  }
}

export async function getCertificateDetail(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const certificate = certificateService.getCertificateById(id);

    if (!certificate) {
      res.status(404).json({ error: '证书不存在' });
      return;
    }

    if (req.user && req.user.role === 'volunteer' && certificate.userId !== req.user.userId) {
      res.status(403).json({ error: '无权限查看' });
      return;
    }

    res.json({ certificate });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取证书详情失败';
    res.status(500).json({ error: message });
  }
}

export async function applyCertificate(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'volunteer') {
      res.status(403).json({ error: '只有志愿者可以申请证书' });
      return;
    }

    const { level } = req.body;
    const certificate = certificateService.applyCertificate(req.user.userId, level as CertificateLevel | undefined);
    res.status(201).json({ certificate });
  } catch (err) {
    const message = err instanceof Error ? err.message : '申请证书失败';
    res.status(400).json({ error: message });
  }
}

export async function downloadCertificatePdf(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const certificate = certificateService.getCertificateById(id);

    if (!certificate) {
      res.status(404).json({ error: '证书不存在' });
      return;
    }

    if (req.user && req.user.role === 'volunteer' && certificate.userId !== req.user.userId) {
      res.status(403).json({ error: '无权限下载' });
      return;
    }

    const pdfBuffer = generateCertificatePdf(id);
    const filename = `certificate-${certificate.certificateNo}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成证书PDF失败';
    res.status(500).json({ error: message });
  }
}

export async function getNextCertificateLevel(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const result = certificateService.getNextCertificateLevel(req.user.userId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取证书等级信息失败';
    res.status(500).json({ error: message });
  }
}
