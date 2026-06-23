import { Router, Request, Response } from 'express';
import prisma from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/users/leaderboard - 排行榜 (must be before /:id)
router.get('/leaderboard', async (_req: Request, res: Response) => {
  try {
    const topPlayers = await prisma.userStats.findMany({
      orderBy: { ratingElo: 'desc' },
      take: 50,
      include: { user: { select: { username: true, avatar: true } } },
    });

    res.json({
      leaderboard: topPlayers.map((s: any, i: number) => ({
        rank: i + 1,
        username: s.user.username,
        avatar: s.user.avatar,
        ratingElo: s.ratingElo,
        wins: s.wins,
        totalGames: s.totalGames,
        winRate: s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0,
        highestScore: s.highestScore,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/me/history - 当前用户的游戏历史 (must be before /:id)
router.get('/me/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const records = await prisma.gameRecord.findMany({
      where: {
        players: { some: { userId } },
      },
      include: {
        players: {
          include: { user: { select: { username: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const history = records.map((r: any) => {
      const myPlayer = r.players.find((p: any) => p.userId === userId);
      return {
        id: r.id,
        mode: r.mode,
        playerCount: r.playerCount,
        createdAt: r.createdAt,
        players: r.players.map((p: any) => ({
          userId: p.userId,
          username: p.user?.username || '未知',
          avatar: p.user?.avatar || '🧢',
          score: p.score,
          rank: p.rank,
        })),
        myResult: myPlayer ? {
          score: myPlayer.score,
          rank: myPlayer.rank,
          isWin: myPlayer.rank === 1,
        } : null,
      };
    });

    res.json({ history });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id - 用户公开资料
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const u: any = user;
    res.json({
      id: u.id,
      username: u.username,
      avatar: u.avatar,
      createdAt: u.createdAt,
      stats: u.stats ? {
        totalGames: u.stats.totalGames,
        wins: u.stats.wins,
        losses: u.stats.losses,
        winRate: u.stats.totalGames > 0 ? Math.round((u.stats.wins / u.stats.totalGames) * 100) : 0,
        highestScore: u.stats.highestScore,
        avgScore: u.stats.avgScore,
        ratingElo: u.stats.ratingElo,
      } : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/stats - 用户战绩
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const stats = await prisma.userStats.findUnique({
      where: { userId },
      include: { user: { select: { username: true, avatar: true } } },
    });

    if (!stats) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const s: any = stats;
    res.json({
      username: s.user.username,
      avatar: s.user.avatar,
      totalGames: s.totalGames,
      wins: s.wins,
      losses: s.losses,
      winRate: s.totalGames > 0 ? Math.round((s.wins / s.totalGames) * 100) : 0,
      highestScore: s.highestScore,
      avgScore: s.avgScore,
      ratingElo: s.ratingElo,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/me/avatar - 更新头像
router.put('/me/avatar', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      res.status(400).json({ error: '请选择头像' });
      return;
    }

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatar },
    });

    res.json({ success: true, avatar });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
