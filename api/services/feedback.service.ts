import { getStore, getNextId, persist } from '../db/index.js';
import type { Feedback, CreateFeedbackRequest } from '../../shared/types.js';
import * as registrationService from './registration.service.js';

export function createFeedback(
  data: CreateFeedbackRequest & { userId: number; userName: string }
): Feedback {
  const store = getStore();

  const existing = store.feedback.find(
    (f) => f.activityId === data.activityId && f.userId === data.userId
  );
  if (existing) {
    throw new Error('您已经对该活动提交过反馈');
  }

  const registrations = registrationService.getRegistrationsByUser(data.userId);
  const validRegistration = registrations.find(
    (r) => r.activityId === data.activityId && r.status === 'completed'
  );

  if (!validRegistration) {
    throw new Error('您无权对该活动提交反馈');
  }

  if (validRegistration.userId !== data.userId) {
    throw new Error('您无权对该活动提交反馈');
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
