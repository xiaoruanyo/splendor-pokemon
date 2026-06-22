import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { config } from '../config.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import { validateCode, useCode } from '../services/activation.js';

const router = Router();

// 预设头像列表
export const PRESET_AVATARS = ['🧢', '💧', '🪨', '🚀', '🎩', '🎀', '👒', '🔥', '⚡', '🌿', '👻'];

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, activationCode, avatar } = req.body;

    if (!username || !password || !activationCode) {
      res.status(400).json({ error: '请填写用户名、密码和激活码' });
      return;
    }

    if (username.length < 2 || username.length > 20) {
      res.status(400).json({ error: '用户名需要2-20个字符' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: '密码至少6个字符' });
      return;
    }

    // Validate activation code
    const valid = await validateCode(activationCode);
    if (!valid) {
      res.status(400).json({ error: '激活码无效或已被使用' });
      return;
    }

    // Check username uniqueness
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(400).json({ error: '用户名已存在' });
      return;
    }

    // Validate avatar
    const userAvatar = avatar && PRESET_AVATARS.includes(avatar) ? avatar : '🧢';

    // Create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        avatar: userAvatar,
      },
    });

    // Mark activation code as used
    await useCode(activationCode, user.id);

    // Create user stats
    await prisma.userStats.create({
      data: { userId: user.id },
    });

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, avatar: user.avatar } satisfies AuthPayload,
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: '注册失败: ' + err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '请填写用户名和密码' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(400).json({ error: '用户名或密码错误' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: '用户名或密码错误' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, avatar: user.avatar } satisfies AuthPayload,
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: '登录失败: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { stats: true },
    });

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      createdAt: user.createdAt,
      stats: user.stats ? {
        totalGames: user.stats.totalGames,
        wins: user.stats.wins,
        losses: user.stats.losses,
        winRate: user.stats.totalGames > 0
          ? Math.round((user.stats.wins / user.stats.totalGames) * 100)
          : 0,
        highestScore: user.stats.highestScore,
        avgScore: user.stats.avgScore,
        ratingElo: user.stats.ratingElo,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/avatars - 获取可用头像列表
router.get('/avatars', (_req: Request, res: Response) => {
  res.json({ avatars: PRESET_AVATARS });
});

export default router;
