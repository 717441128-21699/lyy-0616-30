import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Activity,
  Registration,
  Certificate,
  Feedback,
  ActivityType,
  ActivityStatus,
  RegistrationStatus,
  UserRole,
  Notification,
  NotificationType,
} from '../../shared/types.js';

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'volunteer.db.json');

interface DataStore {
  users: User[];
  activities: Activity[];
  registrations: Registration[];
  certificates: Certificate[];
  feedback: Feedback[];
  notifications: Notification[];
  nextIds: {
    users: number;
    activities: number;
    registrations: number;
    certificates: number;
    feedback: number;
    notifications: number;
  };
}

const store: DataStore = {
  users: [],
  activities: [],
  registrations: [],
  certificates: [],
  feedback: [],
  notifications: [],
  nextIds: {
    users: 1,
    activities: 1,
    registrations: 1,
    certificates: 1,
    feedback: 1,
    notifications: 1,
  },
};

function getNextId(type: keyof typeof store.nextIds): number {
  const id = store.nextIds[type];
  store.nextIds[type]++;
  return id;
}

function generateQrToken(): string {
  return 'QR_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
}

function generateCertificateNo(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VOL-${dateStr}-${random}`;
}

function saveToFile() {
  const dataDir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(DB_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function loadFromFile(): boolean {
  if (!fs.existsSync(DB_FILE_PATH)) {
    return false;
  }
  try {
    const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    const data = JSON.parse(content) as DataStore;
    if (data && data.users && data.activities && data.registrations && data.certificates && data.feedback && data.nextIds) {
      store.users = data.users;
      store.activities = data.activities;
      store.registrations = data.registrations;
      store.certificates = data.certificates;
      store.feedback = data.feedback;
      store.notifications = data.notifications || [];
      store.nextIds = {
        ...data.nextIds,
        notifications: data.nextIds.notifications || 1,
      };
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to load database from file:', e);
    return false;
  }
}

export function persist() {
  saveToFile();
}

function initMockData() {
  const salt = bcrypt.genSaltSync(10);

  const org1: User = {
    id: getNextId('users'),
    username: 'greenearth',
    email: 'contact@greenearth.org',
    role: 'organization',
    name: '绿色地球公益组织',
    phone: '010-12345678',
    orgName: '绿色地球公益基金会',
    orgDescription: '致力于环境保护和可持续发展的公益组织，成立于2010年。',
    totalHours: 0,
    activityCount: 0,
    createdAt: new Date().toISOString(),
  };
  org1.passwordHash = bcrypt.hashSync('org123456', salt);
  store.users.push(org1);

  const org2: User = {
    id: getNextId('users'),
    username: 'sunshine_edu',
    email: 'hello@sunshine-edu.org',
    role: 'organization',
    name: '阳光教育公益',
    phone: '021-87654321',
    orgName: '阳光教育发展中心',
    orgDescription: '专注于乡村教育支持和儿童成长的公益机构。',
    totalHours: 0,
    activityCount: 0,
    createdAt: new Date().toISOString(),
  };
  org2.passwordHash = bcrypt.hashSync('org123456', salt);
  store.users.push(org2);

  const vol1: User = {
    id: getNextId('users'),
    username: 'zhangsan',
    email: 'zhangsan@example.com',
    role: 'volunteer',
    name: '张三',
    phone: '13800138001',
    totalHours: 32.5,
    activityCount: 5,
    createdAt: new Date().toISOString(),
  };
  vol1.passwordHash = bcrypt.hashSync('vol123456', salt);
  store.users.push(vol1);

  const vol2: User = {
    id: getNextId('users'),
    username: 'lisi',
    email: 'lisi@example.com',
    role: 'volunteer',
    name: '李四',
    phone: '13800138002',
    totalHours: 68.0,
    activityCount: 12,
    createdAt: new Date().toISOString(),
  };
  vol2.passwordHash = bcrypt.hashSync('vol123456', salt);
  store.users.push(vol2);

  const vol3: User = {
    id: getNextId('users'),
    username: 'wangwu',
    email: 'wangwu@example.com',
    role: 'volunteer',
    name: '王五',
    phone: '13800138003',
    totalHours: 12.0,
    activityCount: 2,
    createdAt: new Date().toISOString(),
  };
  vol3.passwordHash = bcrypt.hashSync('vol123456', salt);
  store.users.push(vol3);

  const activities: Omit<Activity, 'id' | 'createdAt'>[] = [
    {
      title: '城市河道清洁行动',
      description: '与我们一起参与城市河道清洁，守护身边的水环境。活动包括河道垃圾清理、水质检测、环保知识宣传等内容。欢迎热爱环保的朋友加入！',
      type: 'environment',
      city: '北京',
      location: '朝阳区亮马河畔',
      startDate: '2026-07-05',
      endDate: '2026-07-05',
      startTime: '09:00',
      endTime: '12:00',
      maxParticipants: 30,
      currentParticipants: 18,
      requirements: '18-55岁，身体健康，无严重疾病；\n穿着舒适的运动服装和鞋子；\n自带水杯，我们提供矿泉水。',
      notes: '活动当天请提前15分钟到达集合地点；\n如遇恶劣天气活动将顺延。',
      status: 'published',
      organizerId: org1.id,
      organizerName: '绿色地球公益组织',
      imageUrl: '',
    },
    {
      title: '乡村小学支教周末营',
      description: '前往山区小学开展周末支教活动，为孩子们带去有趣的课程和陪伴。课程内容包括美术、音乐、科学实验等。',
      type: 'education',
      city: '成都',
      location: '四川省雅安市希望小学',
      startDate: '2026-07-12',
      endDate: '2026-07-13',
      startTime: '08:00',
      endTime: '17:00',
      maxParticipants: 15,
      currentParticipants: 12,
      requirements: '有教学经验者优先；\n有耐心，善于与孩子沟通；\n自备生活用品，住宿由学校安排。',
      notes: '需要在学校住宿一晚；\n统一包车前往，费用AA。',
      status: 'published',
      organizerId: org2.id,
      organizerName: '阳光教育公益',
      imageUrl: '',
    },
    {
      title: '敬老院探访活动',
      description: '探访社区敬老院，为老人们带去关怀和欢乐。活动内容包括陪伴聊天、文艺表演、帮助打扫卫生等。',
      type: 'elderly',
      city: '上海',
      location: '浦东新区阳光敬老院',
      startDate: '2026-07-08',
      endDate: '2026-07-08',
      startTime: '14:00',
      endTime: '17:00',
      maxParticipants: 20,
      currentParticipants: 15,
      requirements: '有爱心、有耐心；\n会表演节目者优先；\n尊重老人，态度亲切。',
      notes: '请不要给老人带食品；\n活动期间听从工作人员安排。',
      status: 'published',
      organizerId: org1.id,
      organizerName: '绿色地球公益组织',
      imageUrl: '',
    },
    {
      title: '流浪动物救助站志愿服务',
      description: '帮助流浪动物救助站清洁犬舍、喂食、遛狗，为流浪动物们带去温暖和关爱。',
      type: 'animal',
      city: '深圳',
      location: '宝安区爱心流浪动物救助站',
      startDate: '2026-07-06',
      endDate: '2026-07-06',
      startTime: '10:00',
      endTime: '16:00',
      maxParticipants: 25,
      currentParticipants: 10,
      requirements: '喜爱动物，有责任心；\n穿着耐脏的衣物和鞋子；\n可自备手套。',
      notes: '请勿私自投喂动物；\n注意安全，服从工作人员指引。',
      status: 'published',
      organizerId: org2.id,
      organizerName: '阳光教育公益',
      imageUrl: '',
    },
    {
      title: '社区图书馆整理志愿',
      description: '协助社区图书馆进行图书分类、整理上架、读者引导等工作，为社区居民创造更好的阅读环境。',
      type: 'community',
      city: '杭州',
      location: '西湖区文苑社区图书馆',
      startDate: '2026-07-10',
      endDate: '2026-07-10',
      startTime: '09:00',
      endTime: '12:00',
      maxParticipants: 10,
      currentParticipants: 6,
      requirements: '做事认真细心；\n热爱阅读者优先；\n会基本电脑操作。',
      notes: '工作内容以图书分类整理为主；\n表现优秀者可获得图书馆荣誉证书。',
      status: 'published',
      organizerId: org1.id,
      organizerName: '绿色地球公益组织',
      imageUrl: '',
    },
    {
      title: '植树造林公益行动',
      description: '参与春季植树活动，为城市增添一抹绿色。我们提供树苗、工具和专业指导，一起种下希望的种子。',
      type: 'environment',
      city: '武汉',
      location: '江夏区青龙山森林公园',
      startDate: '2026-07-15',
      endDate: '2026-07-15',
      startTime: '08:30',
      endTime: '12:30',
      maxParticipants: 50,
      currentParticipants: 35,
      requirements: '年满16周岁，未成年人需家长陪同；\n穿着适合户外活动的服装和鞋子；\n自带防晒用品。',
      notes: '活动免费，提供树苗和工具；\n可获得植树纪念证书。',
      status: 'published',
      organizerId: org1.id,
      organizerName: '绿色地球公益组织',
      imageUrl: '',
    },
    {
      title: '已结束：世界环境日宣传活动',
      description: '六五世界环境日主题宣传活动，通过展板、互动游戏、签名倡议等形式，向市民普及环保知识，倡导绿色生活方式。',
      type: 'environment',
      city: '北京',
      location: '朝阳区三里屯太古里广场',
      startDate: '2026-06-05',
      endDate: '2026-06-05',
      startTime: '10:00',
      endTime: '18:00',
      maxParticipants: 40,
      currentParticipants: 40,
      requirements: '形象气质佳，有活动经验者优先；\n善于沟通，有亲和力；\n两班倒：上午班/下午班。',
      notes: '活动当天提供工作餐和饮用水；\n发放志愿者T恤和工作证。',
      status: 'completed',
      organizerId: org1.id,
      organizerName: '绿色地球公益组织',
      summary: '本次世界环境日宣传活动圆满结束！共有40名志愿者参与，累计服务时长300余小时，现场发放宣传资料2000余份，获得了市民的广泛好评。感谢所有志愿者的辛勤付出，期待下次活动再相聚！',
      imageUrl: '',
    },
  ];

  const createdActivities: Activity[] = [];
  for (const act of activities) {
    const activity: Activity = {
      ...act,
      id: getNextId('activities'),
      createdAt: new Date().toISOString(),
    };
    store.activities.push(activity);
    createdActivities.push(activity);
  }

  const reg1: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[0].id,
    userId: vol1.id,
    userName: vol1.name,
    userPhone: vol1.phone,
    status: 'approved',
    qrToken: generateQrToken(),
    registeredAt: '2026-06-20T10:30:00.000Z',
    auditedAt: '2026-06-20T14:00:00.000Z',
    serviceHours: 0,
  };
  store.registrations.push(reg1);

  const reg2: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[0].id,
    userId: vol2.id,
    userName: vol2.name,
    userPhone: vol2.phone,
    status: 'pending',
    registeredAt: '2026-06-22T09:15:00.000Z',
    serviceHours: 0,
  };
  store.registrations.push(reg2);

  const reg3: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[1].id,
    userId: vol1.id,
    userName: vol1.name,
    userPhone: vol1.phone,
    status: 'approved',
    qrToken: generateQrToken(),
    registeredAt: '2026-06-18T16:45:00.000Z',
    auditedAt: '2026-06-19T10:20:00.000Z',
    serviceHours: 0,
  };
  store.registrations.push(reg3);

  const reg4: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[1].id,
    userId: vol3.id,
    userName: vol3.name,
    userPhone: vol3.phone,
    status: 'pending',
    registeredAt: '2026-06-25T11:00:00.000Z',
    serviceHours: 0,
  };
  store.registrations.push(reg4);

  const reg5: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[2].id,
    userId: vol2.id,
    userName: vol2.name,
    userPhone: vol2.phone,
    status: 'approved',
    qrToken: generateQrToken(),
    registeredAt: '2026-06-15T08:30:00.000Z',
    auditedAt: '2026-06-15T16:00:00.000Z',
    serviceHours: 0,
  };
  store.registrations.push(reg5);

  const reg6: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[6].id,
    userId: vol1.id,
    userName: vol1.name,
    userPhone: vol1.phone,
    status: 'completed',
    qrToken: generateQrToken(),
    checkInTime: '2026-06-05T09:45:00.000Z',
    checkOutTime: '2026-06-05T17:50:00.000Z',
    serviceHours: 7.5,
    registeredAt: '2026-05-28T14:20:00.000Z',
    auditedAt: '2026-05-29T09:00:00.000Z',
  };
  store.registrations.push(reg6);

  const reg7: Registration = {
    id: getNextId('registrations'),
    activityId: createdActivities[6].id,
    userId: vol2.id,
    userName: vol2.name,
    userPhone: vol2.phone,
    status: 'completed',
    qrToken: generateQrToken(),
    checkInTime: '2026-06-05T09:30:00.000Z',
    checkOutTime: '2026-06-05T18:10:00.000Z',
    serviceHours: 8.0,
    registeredAt: '2026-05-25T10:00:00.000Z',
    auditedAt: '2026-05-26T15:30:00.000Z',
  };
  store.registrations.push(reg7);

  const cert1: Certificate = {
    id: getNextId('certificates'),
    userId: vol2.id,
    userName: vol2.name,
    certificateNo: generateCertificateNo(),
    level: 'silver',
    totalHours: 68.0,
    activityCount: 12,
    issuedAt: '2026-05-15T10:00:00.000Z',
  };
  store.certificates.push(cert1);

  const fb1: Feedback = {
    id: getNextId('feedback'),
    activityId: createdActivities[6].id,
    userId: vol1.id,
    userName: vol1.name,
    rating: 5,
    content: '非常有意义的活动！组织得很好，学到了很多环保知识。下次还会参加！',
    createdAt: '2026-06-06T10:30:00.000Z',
  };
  store.feedback.push(fb1);

  const fb2: Feedback = {
    id: getNextId('feedback'),
    activityId: createdActivities[6].id,
    userId: vol2.id,
    userName: vol2.name,
    rating: 4,
    content: '活动很棒，就是当天太阳太大有点热。建议增加一些遮阳设施。',
    createdAt: '2026-06-06T11:20:00.000Z',
  };
  store.feedback.push(fb2);

  console.log('Mock data initialized successfully!');
  console.log('Test accounts:');
  console.log('  Organization: greenearth / org123456');
  console.log('  Organization: sunshine_edu / org123456');
  console.log('  Volunteer: zhangsan / vol123456');
  console.log('  Volunteer: lisi / vol123456');
  console.log('  Volunteer: wangwu / vol123456');
}

let initialized = false;

export function initDatabase() {
  if (initialized) return;
  const loaded = loadFromFile();
  if (!loaded) {
    initMockData();
    saveToFile();
  } else {
    console.log('Database loaded from file successfully!');
  }
  initialized = true;
}

export function getStore() {
  return store;
}

export { getNextId, generateQrToken, generateCertificateNo };

declare module '../../shared/types.js' {
  interface User {
    passwordHash?: string;
  }
}
