import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  jwtSecret: process.env.JWT_SECRET || 'splendor-pokemon-secret',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
};
