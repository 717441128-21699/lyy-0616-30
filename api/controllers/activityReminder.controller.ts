import { Request, Response } from 'express';
import * as reminderService from '../services/activityReminder.service.js';

export async function sendReminder(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }
    const { activityId, targetScope, title, content } = req.body;
    if (!activityId || !targetScope || !content) {
      res.status(400).json({ error: '请填写完整信息' });
      return;
    }
    if (targetScope !== 'all_registered' && targetScope !== 'approved_only') {
      res.status(400).json({ error: '无效的发送范围' });
      return;
    }
    const record = reminderService.sendActivityReminder({
      organizerId: req.user.userId,
      activityId: Number(activityId),
      targetScope,
      title,
      content,
    });
    res.status(201).json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : '发送失败';
    res.status(400).json({ error: message });
  }
}

export async function getReminders(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限访问' });
      return;
    }
    const reminders = reminderService.getOrganizerReminders(req.user.userId);
    res.json({ reminders });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取失败';
    res.status(400).json({ error: message });
  }
}
