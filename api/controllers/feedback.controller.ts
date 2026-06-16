import { Request, Response } from 'express';
import * as feedbackService from '../services/feedback.service.js';
import * as authService from '../services/auth.service.js';

export async function createFeedback(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const { activityId, rating, content } = req.body;

    if (!activityId || !rating || !content) {
      res.status(400).json({ error: '请填写完整的反馈信息' });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ error: '评分必须在1-5之间' });
      return;
    }

    const user = authService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const feedback = feedbackService.createFeedback({
      activityId: Number(activityId),
      userId: req.user.userId,
      userName: user.name,
      rating: Number(rating),
      content,
    });

    res.status(201).json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交反馈失败';
    res.status(400).json({ error: message });
  }
}

export async function getActivityFeedback(req: Request, res: Response): Promise<void> {
  try {
    const activityId = Number(req.params.activityId);
    const feedbackList = feedbackService.getFeedbackByActivity(activityId);
    
    res.json({ list: feedbackList });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取反馈列表失败';
    res.status(500).json({ error: message });
  }
}

export async function getMyFeedback(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const feedbackList = feedbackService.getFeedbackByUser(req.user.userId);
    res.json({ list: feedbackList });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取我的反馈失败';
    res.status(500).json({ error: message });
  }
}
