import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: '请先登录' }); return; }
  const notifications = notificationService.getUserNotifications(req.user.userId);
  const unreadCount = notificationService.getUnreadCount(req.user.userId);
  res.json({ notifications, unreadCount });
}

export async function getUnreadCount(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: '请先登录' }); return; }
  const count = notificationService.getUnreadCount(req.user.userId);
  res.json({ count });
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: '请先登录' }); return; }
  const id = Number(req.params.id);
  const success = notificationService.markAsRead(id, req.user.userId);
  res.json({ success });
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  if (!req.user) { res.status(401).json({ error: '请先登录' }); return; }
  const count = notificationService.markAllAsRead(req.user.userId);
  res.json({ count });
}
