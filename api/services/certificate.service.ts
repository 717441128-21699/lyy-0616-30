import { getStore, getNextId, generateCertificateNo, persist } from '../db/index.js';
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

export function applyCertificate(userId: number): Certificate {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  let eligibleLevel: CertificateLevel | null = null;
  const levels = Object.keys(CERTIFICATE_LEVELS) as CertificateLevel[];

  for (const level of levels) {
    if (user.totalHours >= CERTIFICATE_LEVELS[level].minHours) {
      const existing = store.certificates.find(
        (c) => c.userId === userId && c.level === level
      );
      if (!existing) {
        eligibleLevel = level;
        break;
      }
    }
  }

  if (!eligibleLevel) {
    throw new Error('暂无可申请的证书，请继续积累志愿服务时长');
  }

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
  return certificate;
}

export { CERTIFICATE_LEVELS };
