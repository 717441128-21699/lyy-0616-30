import { Request, Response } from 'express';
import * as activityService from '../services/activity.service.js';
import type { ActivityListParams } from '../../shared/types.js';

export async function getActivityList(req: Request, res: Response): Promise<void> {
  try {
    const params: ActivityListParams = {
      city: req.query.city as string | undefined,
      type: req.query.type as ActivityListParams['type'],
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      keyword: req.query.keyword as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 10,
    };

    const result = activityService.getActivityList(params);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取活动列表失败';
    res.status(500).json({ error: message });
  }
}

export async function getActivityDetail(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const activity = activityService.getActivityById(id);

    if (!activity) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    res.json({ activity });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取活动详情失败';
    res.status(500).json({ error: message });
  }
}

export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const data = req.body;
    const activity = activityService.createActivity({
      ...data,
      organizerId: req.user.userId,
      organizerName: req.user.username,
      currentParticipants: 0,
    });

    res.status(201).json({ activity });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建活动失败';
    res.status(400).json({ error: message });
  }
}

export async function updateActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const id = Number(req.params.id);
    const existing = activityService.getActivityById(id);

    if (!existing) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (existing.organizerId !== req.user.userId) {
      res.status(403).json({ error: '只能编辑自己发布的活动' });
      return;
    }

    const updated = activityService.updateActivity(id, req.body);
    res.json({ activity: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新活动失败';
    res.status(400).json({ error: message });
  }
}

export async function deleteActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const id = Number(req.params.id);
    const existing = activityService.getActivityById(id);

    if (!existing) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (existing.organizerId !== req.user.userId) {
      res.status(403).json({ error: '只能删除自己发布的活动' });
      return;
    }

    const success = activityService.deleteActivity(id);
    res.json({ success });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除活动失败';
    res.status(400).json({ error: message });
  }
}

export async function getMyActivities(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const activities = activityService.getActivitiesByOrganizer(req.user.userId);
    res.json({ list: activities });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取活动列表失败';
    res.status(500).json({ error: message });
  }
}

export async function addActivitySummary(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const id = Number(req.params.id);
    const { summary } = req.body;

    if (!summary) {
      res.status(400).json({ error: '请填写活动总结' });
      return;
    }

    const existing = activityService.getActivityById(id);
    if (!existing) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (existing.organizerId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const updated = activityService.addActivitySummary(id, summary);
    res.json({ activity: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : '发布活动总结失败';
    res.status(400).json({ error: message });
  }
}

export async function getActivityStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限访问' });
      return;
    }
    const { dateFrom, dateTo } = req.query as { dateFrom?: string; dateTo?: string };
    const stats = activityService.getOrganizerActivityStats(req.user.userId, dateFrom, dateTo);
    res.json({ stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取统计失败';
    res.status(400).json({ error: message });
  }
}

export async function getActivityDetailStats(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限访问' });
      return;
    }
    const activityId = Number(req.params.id);
    const detail = activityService.getOrganizerActivityDetailStats(req.user.userId, activityId);
    if (!detail) {
      res.status(404).json({ error: '活动不存在或无权限访问' });
      return;
    }
    res.json({ detail });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取详情失败';
    res.status(400).json({ error: message });
  }
}
