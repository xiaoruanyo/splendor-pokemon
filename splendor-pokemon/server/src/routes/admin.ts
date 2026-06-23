import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { config } from '../config.js';
import { generateCodes } from '../services/activation.js';
import { adminAuthMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/admin/login — 管理员登录
router.post('/login', (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password !== config.adminPassword) {
      res.status(401).json({ error: '管理员密码错误' });
      return;
    }

    const token = jwt.sign(
      { role: 'admin' },
      config.jwtSecret,
      { expiresIn: '12h' }
    );

    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/generate-codes — 生成邀请码（需要管理员权限）
router.post('/generate-codes', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { count = 10 } = req.body;
    if (count < 1 || count > 100) {
      res.status(400).json({ error: '数量限制 1-100' });
      return;
    }

    const codes = await generateCodes(count);
    res.json({ count: codes.length, codes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/codes — 查看所有邀请码（需要管理员权限）
router.get('/codes', adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const filter = req.query.filter as string; // 'used' | 'unused' | undefined

    const where: any = {};
    if (filter === 'used') where.isUsed = true;
    else if (filter === 'unused') where.isUsed = false;

    const [codes, total] = await Promise.all([
      prisma.activationCode.findMany({
        where,
        include: {
          user: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activationCode.count({ where }),
    ]);

    const totalUsed = await prisma.activationCode.count({ where: { isUsed: true } });
    const totalUnused = await prisma.activationCode.count({ where: { isUsed: false } });

    res.json({
      codes: codes.map(c => ({
        id: c.id,
        code: c.code,
        isUsed: c.isUsed,
        usedBy: c.user?.username || null,
        usedAt: c.usedAt,
        createdAt: c.createdAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      stats: { total, totalUsed, totalUnused },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
