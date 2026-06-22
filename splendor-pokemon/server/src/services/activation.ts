import { v4 as uuidv4 } from 'uuid';
import prisma from '../db.js';

// Generate a single unique activation code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 3) code += '-';
  }
  return code;
}

// Generate multiple activation codes and save to DB
export async function generateCodes(count: number): Promise<string[]> {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 100) throw new Error('生成激活码失败');
    } while (await prisma.activationCode.findUnique({ where: { code } }));

    await prisma.activationCode.create({ data: { code } });
    codes.push(code);
  }
  return codes;
}

// Validate an activation code
export async function validateCode(code: string): Promise<boolean> {
  const record = await prisma.activationCode.findUnique({ where: { code } });
  if (!record || record.isUsed) return false;
  return true;
}

// Mark a code as used
export async function useCode(code: string, userId: string): Promise<void> {
  await prisma.activationCode.update({
    where: { code },
    data: { isUsed: true, usedBy: userId, usedAt: new Date() },
  });
}
