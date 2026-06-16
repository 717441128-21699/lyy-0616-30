import bcrypt from 'bcryptjs';
import { getStore, getNextId } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import type { User, LoginRequest, RegisterRequest, LoginResponse } from '../../shared/types.js';

function sanitizeUser(user: User & { passwordHash?: string }): User {
  const { passwordHash, ...sanitized } = user;
  return sanitized as User;
}

export function login(req: LoginRequest): LoginResponse {
  const { username, password, role } = req;
  const store = getStore();

  const user = store.users.find(
    (u) => u.username === username && u.role === role
  );

  if (!user) {
    throw new Error('用户不存在');
  }

  const isValid = bcrypt.compareSync(password, (user as User & { passwordHash: string }).passwordHash || '');
  if (!isValid) {
    throw new Error('密码错误');
  }

  const userData = sanitizeUser(user as User & { passwordHash: string });
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return { token, user: userData };
}

export function register(req: RegisterRequest): LoginResponse {
  const { username, password, email, role, name, phone, orgName, orgDescription } = req;
  const store = getStore();

  const existing = store.users.find(
    (u) => u.username === username || u.email === email
  );

  if (existing) {
    throw new Error('用户名或邮箱已存在');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User & { passwordHash: string } = {
    id: getNextId('users'),
    username,
    email,
    role,
    name,
    phone: phone || undefined,
    totalHours: 0,
    activityCount: 0,
    orgName: orgName || undefined,
    orgDescription: orgDescription || undefined,
    createdAt: new Date().toISOString(),
    passwordHash,
  };

  store.users.push(newUser);

  const userData = sanitizeUser(newUser);
  const token = generateToken({
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role,
  });

  return { token, user: userData };
}

export function getUserById(userId: number): User | null {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  return user ? sanitizeUser(user as User & { passwordHash: string }) : null;
}

export function updateUserStats(userId: number, hoursToAdd: number): void {
  const store = getStore();
  const user = store.users.find((u) => u.id === userId);
  if (user) {
    user.totalHours = (user.totalHours || 0) + hoursToAdd;
    user.activityCount = (user.activityCount || 0) + 1;
  }
}
