import { Request, Response } from 'express';
import * as timelineService from '../services/timeline.service.js';

export async function getUserTimeline(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }
    const timeline = timelineService.getUserTimeline(req.user.userId);
    res.json({ timeline });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取时间线数据失败';
    res.status(500).json({ error: message });
  }
}
