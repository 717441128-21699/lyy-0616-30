import { getStore, getNextId, persist } from '../db/index.js';
import type { Feedback, CreateFeedbackRequest } from '../../shared/types.js';
import * as registrationService from './registration.service.js';
import * as activityService from './activity.service.js';

export function createFeedback(
  data: CreateFeedbackRequest & { userId: number; userName: string }
): Feedback {
  const store = getStore();

  const activity = activityService.getActivityById(data.activityId);
  if (!activity || activity.status !== 'completed') {
    throw new Error('活动尚未结束，暂不能提交反馈');
  }

  const existing = store.feedback.find(
    (f) => f.activityId === data.activityId && f.userId === data.userId
  );
  if (existing) {
    throw new Error('您已提交过该活动的反馈');
  }

  const registrations = registrationService.getRegistrationsByUser(data.userId);
  const validRegistration = registrations.find(
    (r) => r.activityId === data.activityId && r.status === 'completed'
  );

  if (!validRegistration) {
    const hasRegistration = registrations.some((r) => r.activityId === data.activityId);
    if (hasRegistration) {
      throw new Error('您尚未完成该活动的志愿服务，不能提交反馈');
    } else {
      throw new Error('您无权对该活动提交反馈');
    }
  }

  const feedback: Feedback = {
    id: getNextId('feedback'),
    activityId: data.activityId,
    userId: data.userId,
    userName: data.userName,
    rating: data.rating,
    content: data.content,
    createdAt: new Date().toISOString(),
  };

  store.feedback.push(feedback);
  persist();
  return feedback;
}

export function getFeedbackById(id: number): Feedback | null {
  const store = getStore();
  return store.feedback.find((f) => f.id === id) || null;
}

export function getFeedbackByActivity(activityId: number): Feedback[] {
  const store = getStore();
  return store.feedback
    .filter((f) => f.activityId === activityId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFeedbackByUser(userId: number): Feedback[] {
  const store = getStore();
  return store.feedback
    .filter((f) => f.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
