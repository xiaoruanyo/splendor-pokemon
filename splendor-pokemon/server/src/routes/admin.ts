import { Router, Request, Response } from 'express';
import { generateCodes } from '../services/activation.js';

const router = Router();

// POST /api/admin/generate-codes
router.post('/generate-codes', async (req: Request, res: Response) => {
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

export default router;
