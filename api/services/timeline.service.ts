import { getStore } from '../db/index.js';
import { CERTIFICATE_LEVELS } from '../../shared/types.js';
import type { CertificateLevel } from '../../shared/types.js';

export interface TimelineItem {
  id: string;
  type: 'registration_approved' | 'check_in' | 'check_out' | 'certificate' | 'activity_reminder';
  title: string;
  description: string;
  date: string;
  relatedId?: number;
  relatedType: 'activity' | 'certificate' | 'registration';
  iconType: string;
}

const certificateLevelMap: Record<CertificateLevel, { name: string; hours: number; color: string }> = {} as Record<CertificateLevel, { name: string; hours: number; color: string }>;
CERTIFICATE_LEVELS.forEach((level) => {
  certificateLevelMap[level.level] = {
    name: level.name,
    hours: level.hours,
    color: level.color,
  };
});

export function getUserTimeline(userId: number): TimelineItem[] {
  const store = getStore();
  const items: TimelineItem[] = [];

  const registrations = store.registrations.filter(
    (r) => r.userId === userId && (r.status === 'approved' || r.status === 'completed')
  );
  registrations.forEach((reg) => {
    const activity = store.activities.find((a) => a.id === reg.activityId);
    if (!activity) return;
    items.push({
      id: `reg_${reg.id}_approved`,
      type: 'registration_approved',
      title: '报名审核通过',
      description: `您报名的「${activity.title}」已通过审核`,
      date: reg.auditedAt || reg.registeredAt,
      relatedId: activity.id,
      relatedType: 'activity',
      iconType: 'check',
    });
    if (reg.checkInTime) {
      items.push({
        id: `reg_${reg.id}_checkin`,
        type: 'check_in',
        title: '活动签到',
        description: `「${activity.title}」签到成功`,
        date: reg.checkInTime,
        relatedId: activity.id,
        relatedType: 'activity',
        iconType: 'login',
      });
    }
    if (reg.checkOutTime) {
      items.push({
        id: `reg_${reg.id}_checkout`,
        type: 'check_out',
        title: '服务完成',
        description: `「${activity.title}」服务结束，本次服务 ${reg.serviceHours?.toFixed(1) || 0} 小时`,
        date: reg.checkOutTime,
        relatedId: activity.id,
        relatedType: 'activity',
        iconType: 'clock',
      });
    }
  });

  const certificates = store.certificates.filter((c) => c.userId === userId);
  certificates.forEach((cert) => {
    const levelInfo = certificateLevelMap[cert.level];
    items.push({
      id: `cert_${cert.id}`,
      type: 'certificate',
      title: '获得证书',
      description: `恭喜获得「${levelInfo.name}」公益证书`,
      date: cert.issuedAt,
      relatedId: cert.id,
      relatedType: 'certificate',
      iconType: 'award',
    });
  });

  const notifications = store.notifications.filter(
    (n) => n.userId === userId && n.type === 'activity_reminder'
  );
  notifications.forEach((n) => {
    items.push({
      id: `notif_${n.id}`,
      type: 'activity_reminder',
      title: '活动提醒',
      description: n.title,
      date: n.createdAt,
      relatedId: n.relatedId,
      relatedType: n.relatedType || 'activity',
      iconType: 'megaphone',
    });
  });

  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}
