import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import type { LoginRequest, RegisterRequest } from '../../shared/types.js';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, role } = req.body as LoginRequest;

    if (!username || !password || !role) {
      res.status(400).json({ error: '请填写完整的登录信息' });
      return;
    }

    const result = authService.login({ username, password, role });
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(401).json({ error: message });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data = req.body as RegisterRequest;

    if (!data.username || !data.password || !data.email || !data.role || !data.name) {
      res.status(400).json({ error: '请填写完整的注册信息' });
      return;
    }

    if (data.role === 'organization' && !data.orgName) {
      res.status(400).json({ error: '组织方注册需要填写组织名称' });
      return;
    }

    const result = authService.register(data);
    res.status(201).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(400).json({ error: message });
  }
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未授权' });
      return;
    }

    const user = authService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    res.status(500).json({ error: message });
  }
}
