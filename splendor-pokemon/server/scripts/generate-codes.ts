// CLI script to generate activation codes
// Usage: npx tsx scripts/generate-codes.ts [count] [--output codes.txt]

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

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

async function main() {
  const args = process.argv.slice(2);
  const count = parseInt(args[0]) || 10;
  const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : null;

  if (count < 1 || count > 500) {
    console.error('数量范围: 1-500');
    process.exit(1);
  }

  console.log(`正在生成 ${count} 个激活码...\n`);
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 100) {
        console.error('生成失败，请重试');
        process.exit(1);
      }
    } while (await prisma.activationCode.findUnique({ where: { code } }));

    await prisma.activationCode.create({ data: { code } });
    codes.push(code);
    console.log(`  ${(i + 1).toString().padStart(3)}. ${code}`);
  }

  console.log(`\n✅ 成功生成 ${count} 个激活码`);

  if (outputFile) {
    fs.writeFileSync(outputFile, codes.join('\n'));
    console.log(`📁 已保存到: ${outputFile}`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('错误:', err);
  prisma.$disconnect();
  process.exit(1);
});
