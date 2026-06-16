import { getStore, getNextId, generateQrToken } from '../db/index.js';
import { incrementParticipants, decrementParticipants } from './activity.service.js';
import { updateUserStats } from './auth.service.js';
import type { Registration, RegistrationStatus } from '../../shared/types.js';

export function createRegistration(
  activityId: number,
  userId: number,
  userName: string,
  userPhone: string
): Registration {
  const store = getStore();

  const existing = store.registrations.find(
    (r) => r.activityId === activityId && r.userId === userId
  );
  if (existing) {
    throw new Error('您已经报名过该活动');
  }

  const success = incrementParticipants(activityId);
  if (!success) {
    throw new Error('活动名额已满');
  }

  const registration: Registration = {
    id: getNextId('registrations'),
    activityId,
    userId,
    userName,
    userPhone,
    status: 'pending',
    registeredAt: new Date().toISOString(),
    serviceHours: 0,
  };

  store.registrations.push(registration);
  return registration;
}

export function getRegistrationById(id: number): Registration | null {
  const store = getStore();
  return store.registrations.find((r) => r.id === id) || null;
}

export function getRegistrationByToken(token: string): Registration | null {
  const store = getStore();
  return store.registrations.find((r) => r.qrToken === token) || null;
}

export function getRegistrationsByActivity(activityId: number, status?: string): Registration[] {
  const store = getStore();
  let regs = store.registrations.filter((r) => r.activityId === activityId);

  if (status && status !== 'all') {
    regs = regs.filter((r) => r.status === status);
  }

  return regs.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
}

export function getRegistrationsByUser(userId: number, status?: string): Registration[] {
  const store = getStore();
  let regs = store.registrations.filter((r) => r.userId === userId);

  if (status && status !== 'all') {
    regs = regs.filter((r) => r.status === status);
  }

  return regs.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
}

export function auditRegistration(
  id: number,
  approved: boolean,
  auditNote?: string
): Registration | null {
  const store = getStore();
  const registration = store.registrations.find((r) => r.id === id);
  if (!registration) return null;
  if (registration.status !== 'pending') {
    throw new Error('该报名已审核过');
  }

  if (approved) {
    registration.status = 'approved';
    registration.qrToken = generateQrToken();
  } else {
    registration.status = 'rejected';
    registration.auditNote = auditNote;
    decrementParticipants(registration.activityId);
  }

  registration.auditedAt = new Date().toISOString();
  return registration;
}

export function cancelRegistration(id: number): Registration | null {
  const store = getStore();
  const registration = store.registrations.find((r) => r.id === id);
  if (!registration) return null;

  if (registration.status === 'approved' || registration.status === 'pending') {
    decrementParticipants(registration.activityId);
  }

  registration.status = 'cancelled';
  registration.cancelledAt = new Date().toISOString();
  return registration;
}

export function checkInByToken(token: string): Registration | null {
  const store = getStore();
  const registration = store.registrations.find((r) => r.qrToken === token);
  if (!registration) return null;
  if (registration.status !== 'approved') {
    throw new Error('该报名状态不允许签到');
  }

  registration.checkInTime = new Date().toISOString();
  return registration;
}

export function checkOutByToken(token: string): Registration | null {
  const store = getStore();
  const registration = store.registrations.find((r) => r.qrToken === token);
  if (!registration) return null;
  if (!registration.checkInTime) {
    throw new Error('尚未签到，不能签退');
  }
  if (registration.status === 'completed') {
    throw new Error('该活动已完成');
  }

  const checkOutTime = new Date().toISOString();
  registration.checkOutTime = checkOutTime;

  const checkIn = new Date(registration.checkInTime).getTime();
  const checkOut = new Date(checkOutTime).getTime();
  const hours = Math.round(((checkOut - checkIn) / 1000 / 60 / 60) * 10) / 10;
  registration.serviceHours = Math.max(0, hours);

  registration.status = 'completed';

  if (registration.serviceHours > 0) {
    updateUserStats(registration.userId, registration.serviceHours);
  }

  return registration;
}
