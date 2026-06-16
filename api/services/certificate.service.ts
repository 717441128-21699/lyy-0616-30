import { getStore, getNextId, generateCertificateNo, persist } from '../db/index.js';
import * as notificationService from './notification.service.js';
import type { Certificate, CertificateLevel, CertificateLevelInfo, UserStats } from '../../shared/types.js';

const CERTIFICATE_LEVELS: Record<CertificateLevel, { name: string; minHours: number; color: string }> = {
  bronze: { name: '铜质证书', minHours: 20, color: '#CD7F32' },
  silver: { name: '银质证书', minHours: 50, color: '#C0C0C0' },
  gold: { name: '金质证书', minHours: 100, color: '#FFD700' },
  platinum: { name: '白金证书', minHours: 200, color: '#E5E4E2' },
};

export function getUserStats(userId: number): UserStats {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    return {
      totalHours: 0,
      activityCount: 0,
      certificateCount: 0,
      nextLevel: null,
      currentLevel: null,
      upcomingLevel: null,
    };
  }

  const certificates = store.certificates.filter((c) => c.userId === userId);
  let currentLevel: CertificateLevel | null = null;

  const levels = Object.keys(CERTIFICATE_LEVELS) as CertificateLevel[];
  for (let i = levels.length - 1; i >= 0; i--) {
    if (user.totalHours >= CERTIFICATE_LEVELS[levels[i]].minHours) {
      currentLevel = levels[i];
      break;
    }
  }

  let nextLevel: CertificateLevelInfo | null = null;
  for (const level of levels) {
    if (user.totalHours >= CERTIFICATE_LEVELS[level].minHours) {
      const existing = certificates.find((c) => c.level === level);
      if (!existing) {
        nextLevel = {
          level,
          name: CERTIFICATE_LEVELS[level].name,
          requiredHours: CERTIFICATE_LEVELS[level].minHours,
          currentHours: user.totalHours,
          progress: 100,
        };
        break;
      }
    }
  }

  let upcomingLevel: CertificateLevelInfo | null = null;
  for (const level of levels) {
    if (user.totalHours < CERTIFICATE_LEVELS[level].minHours) {
      upcomingLevel = {
        level,
        name: CERTIFICATE_LEVELS[level].name,
        requiredHours: CERTIFICATE_LEVELS[level].minHours,
        currentHours: user.totalHours,
        progress: Math.min(100, (user.totalHours / CERTIFICATE_LEVELS[level].minHours) * 100),
      };
      break;
    }
  }

  return {
    totalHours: user.totalHours || 0,
    activityCount: user.activityCount || 0,
    certificateCount: certificates.length,
    currentLevel,
    nextLevel,
    upcomingLevel,
  };
}

export function getCertificatesByUser(userId: number): Certificate[] {
  const store = getStore();
  return store.certificates
    .filter((c) => c.userId === userId)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

export function getCertificateById(id: number): Certificate | null {
  const store = getStore();
  return store.certificates.find((c) => c.id === id) || null;
}

export function getNextCertificateLevel(userId: number): CertificateLevelInfo | null {
  const stats = getUserStats(userId);
  return stats.nextLevel;
}

export function getEarliestAvailableCertificate(userId: number): CertificateLevel | null {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) return null;

  const levels = Object.keys(CERTIFICATE_LEVELS) as CertificateLevel[];
  for (const level of levels) {
    if (user.totalHours >= CERTIFICATE_LEVELS[level].minHours) {
      const existing = store.certificates.find(
        (c) => c.userId === userId && c.level === level
      );
      if (!existing) {
        return level;
      }
    }
  }
  return null;
}

export function applyCertificate(userId: number, requestedLevel?: CertificateLevel): Certificate {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const levels = Object.keys(CERTIFICATE_LEVELS) as CertificateLevel[];

  if (requestedLevel) {
    const requestedIndex = levels.indexOf(requestedLevel);
    if (requestedIndex === -1) {
      throw new Error('无效的证书等级');
    }

    const existing = store.certificates.find(
      (c) => c.userId === userId && c.level === requestedLevel
    );
    if (existing) {
      const name = CERTIFICATE_LEVELS[requestedLevel].name;
      throw new Error(`您已获得${name}证书，无需重复申请`);
    }

    if (user.totalHours < CERTIFICATE_LEVELS[requestedLevel].minHours) {
      throw new Error('服务时长未达到该等级要求');
    }

    for (let i = 0; i < requestedIndex; i++) {
      const prevLevel = levels[i];
      const prevExisting = store.certificates.find(
        (c) => c.userId === userId && c.level === prevLevel
      );
      if (!prevExisting && user.totalHours >= CERTIFICATE_LEVELS[prevLevel].minHours) {
        const name = CERTIFICATE_LEVELS[prevLevel].name;
        throw new Error(`请先领取${name}证书后再申请`);
      }
    }

    const certificateInfo = CERTIFICATE_LEVELS[requestedLevel];
    const certificate: Certificate = {
      id: getNextId('certificates'),
      userId,
      userName: user.name,
      certificateNo: generateCertificateNo(),
      level: requestedLevel,
      totalHours: user.totalHours,
      activityCount: user.activityCount || 0,
      issuedAt: new Date().toISOString(),
    };

    store.certificates.push(certificate);
    persist();

    notificationService.createNotification({
      userId: userId,
      type: 'certificate_granted',
      title: '证书颁发成功',
      content: `恭喜您获得「${certificateInfo.name}」公益证书，证书编号：${certificate.certificateNo}`,
      relatedId: certificate.id,
      relatedType: 'certificate',
    });

    return certificate;
  }

  let eligibleLevel: CertificateLevel | null = null;
  let highestEligibleExistingLevel: CertificateLevel | null = null;

  for (const level of levels) {
    if (user.totalHours >= CERTIFICATE_LEVELS[level].minHours) {
      const existing = store.certificates.find(
        (c) => c.userId === userId && c.level === level
      );
      if (!existing) {
        eligibleLevel = level;
        break;
      } else {
        highestEligibleExistingLevel = level;
      }
    }
  }

  if (!eligibleLevel) {
    if (highestEligibleExistingLevel) {
      const name = CERTIFICATE_LEVELS[highestEligibleExistingLevel].name;
      throw new Error(`您已获得${name}证书，无需重复申请`);
    } else {
      throw new Error('暂无可申请的证书等级');
    }
  }

  const certificateInfo = CERTIFICATE_LEVELS[eligibleLevel];

  const certificate: Certificate = {
    id: getNextId('certificates'),
    userId,
    userName: user.name,
    certificateNo: generateCertificateNo(),
    level: eligibleLevel,
    totalHours: user.totalHours,
    activityCount: user.activityCount || 0,
    issuedAt: new Date().toISOString(),
  };

  store.certificates.push(certificate);
  persist();

  notificationService.createNotification({
    userId: userId,
    type: 'certificate_granted',
    title: '证书颁发成功',
    content: `恭喜您获得「${certificateInfo.name}」公益证书，证书编号：${certificate.certificateNo}`,
    relatedId: certificate.id,
    relatedType: 'certificate',
  });

  return certificate;
}

export { CERTIFICATE_LEVELS };
