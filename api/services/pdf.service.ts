import jsPDF from 'jspdf';
import { CERTIFICATE_LEVELS } from '../../shared/types.js';
import { getCertificateById } from './certificate.service.js';

export function generateCertificatePdf(certificateId: number): Buffer {
  const cert = getCertificateById(certificateId);
  if (!cert) throw new Error('证书不存在');

  const levelInfo = CERTIFICATE_LEVELS.find(l => l.level === cert.level);
  const levelName = levelInfo?.name || '志愿者';
  const levelColor = levelInfo?.color || '#10B981';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30, 'S');

  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.rect(18, 18, pageWidth - 36, pageHeight - 36, 'S');

  doc.setFontSize(36);
  doc.setTextColor(16, 185, 129);
  doc.text('Volunteer Service Certificate', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(71, 85, 105);
  doc.text('公 益 志 愿 服 务 证 书', pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('Certificate No. ' + cert.certificateNo, pageWidth / 2, 65, { align: 'center' });

  const r = 30;
  const cx = pageWidth / 2;
  const cy = 95;
  
  doc.setDrawColor(parseInt(levelColor.slice(1, 3), 16), parseInt(levelColor.slice(3, 5), 16), parseInt(levelColor.slice(5, 7), 16));
  doc.setLineWidth(3);
  doc.circle(cx, cy, r, 'S');
  doc.circle(cx, cy, r - 4, 'S');

  doc.setFontSize(16);
  doc.setTextColor(parseInt(levelColor.slice(1, 3), 16), parseInt(levelColor.slice(3, 5), 16), parseInt(levelColor.slice(5, 7), 16));
  doc.text(levelName, cx, cy - 5, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('荣誉称号', cx, cy + 8, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(51, 65, 85);
  doc.text('兹证明', pageWidth / 2, 140, { align: 'center' });

  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(cert.userName, pageWidth / 2, 155, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(71, 85, 105);
  const text1 = `累计参与志愿服务活动 ${cert.activityCount} 次`;
  doc.text(text1, pageWidth / 2, 168, { align: 'center' });

  const text2 = `累计志愿服务时长 ${cert.totalHours.toFixed(1)} 小时`;
  doc.text(text2, pageWidth / 2, 178, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text('特发此证，以资鼓励！', pageWidth / 2, 190, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  const issueDate = new Date(cert.issuedAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text('签发日期：' + issueDate, pageWidth / 2, 205, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text('志愿者活动招募与管理平台', pageWidth / 2, pageHeight - 20, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}
