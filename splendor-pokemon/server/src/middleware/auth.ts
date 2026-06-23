import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthPayload {
  userId: string;
  username: string;
  avatar: string;
}

export interface AdminPayload {
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      admin?: AdminPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// Admin auth middleware — checks for admin role in JWT
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '请先登录管理后台' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AdminPayload;
    if (payload.role !== 'admin') {
      res.status(403).json({ error: '无管理员权限' });
      return;
    }
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: '管理员登录已过期' });
  }
}
