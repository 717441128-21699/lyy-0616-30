import { Request, Response } from 'express';
import * as registrationService from '../services/registration.service.js';
import * as authService from '../services/auth.service.js';
import * as activityService from '../services/activity.service.js';

export async function registerForActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const activityId = Number(req.params.activityId);
    const user = authService.getUserById(req.user.userId);
    
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const registration = registrationService.createRegistration(
      activityId,
      req.user.userId,
      user.name,
      user.phone || ''
    );
    
    res.status(201).json({ registration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '报名失败';
    res.status(400).json({ error: message });
  }
}

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const registrations = registrationService.getRegistrationsByUser(req.user.userId);
    res.json({ list: registrations });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取报名记录失败';
    res.status(500).json({ error: message });
  }
}

export async function getActivityRegistrations(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const activityId = Number(req.params.activityId);
    const activity = activityService.getActivityById(activityId);

    if (!activity) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (activity.organizerId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const registrations = registrationService.getRegistrationsByActivity(activityId);
    
    res.json({ list: registrations });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取报名列表失败';
    res.status(500).json({ error: message });
  }
}

export async function auditRegistration(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const registrationId = Number(req.params.id);
    const { approved, auditNote } = req.body;

    if (typeof approved !== 'boolean') {
      res.status(400).json({ error: '无效的审核状态' });
      return;
    }

    const registration = registrationService.getRegistrationById(registrationId);
    if (!registration) {
      res.status(404).json({ error: '报名记录不存在' });
      return;
    }

    const activity = activityService.getActivityById(registration.activityId);
    if (!activity) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (activity.organizerId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const updatedRegistration = registrationService.auditRegistration(registrationId, approved, auditNote);

    res.json({ registration: updatedRegistration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '审核失败';
    res.status(400).json({ error: message });
  }
}

export async function cancelRegistration(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const registrationId = Number(req.params.id);
    const registration = registrationService.getRegistrationById(registrationId);
    
    if (!registration) {
      res.status(404).json({ error: '报名记录不存在' });
      return;
    }

    if (registration.userId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const cancelledRegistration = registrationService.cancelRegistration(registrationId);

    res.json({ success: true, registration: cancelledRegistration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '取消报名失败';
    res.status(400).json({ error: message });
  }
}

export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: '请提供签到二维码token' });
      return;
    }

    const registration = registrationService.getRegistrationByToken(token);
    
    if (!registration) {
      res.status(404).json({ error: '无效的签到凭证' });
      return;
    }

    const activity = activityService.getActivityById(registration.activityId);
    if (!activity) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (activity.organizerId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const checkedInRegistration = registrationService.checkInByToken(token);

    res.json({ registration: checkedInRegistration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '签到失败';
    res.status(400).json({ error: message });
  }
}

export async function checkOut(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'organization') {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: '请提供签退二维码token' });
      return;
    }

    const registration = registrationService.getRegistrationByToken(token);
    
    if (!registration) {
      res.status(404).json({ error: '无效的签退凭证' });
      return;
    }

    const activity = activityService.getActivityById(registration.activityId);
    if (!activity) {
      res.status(404).json({ error: '活动不存在' });
      return;
    }

    if (activity.organizerId !== req.user.userId) {
      res.status(403).json({ error: '无权限操作' });
      return;
    }

    const checkedOutRegistration = registrationService.checkOutByToken(token);

    res.json({ registration: checkedOutRegistration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '签退失败';
    res.status(400).json({ error: message });
  }
}

export async function getRegistrationDetail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '请先登录' });
      return;
    }

    const id = Number(req.params.id);
    const registration = registrationService.getRegistrationById(id);
    
    if (!registration) {
      res.status(404).json({ error: '报名记录不存在' });
      return;
    }

    if (req.user.role === 'volunteer' && registration.userId !== req.user.userId) {
      res.status(403).json({ error: '无权限查看' });
      return;
    }

    if (req.user.role === 'organization') {
      const activity = activityService.getActivityById(registration.activityId);
      if (!activity || activity.organizerId !== req.user.userId) {
        res.status(403).json({ error: '无权限查看' });
        return;
      }
    }

    res.json({ registration });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取报名详情失败';
    res.status(500).json({ error: message });
  }
}
