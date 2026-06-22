import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from './config.js';
import { createSocketServer } from './socket/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO
createSocketServer(httpServer);

// Start
httpServer.listen(config.port, () => {
  console.log(`🎮 璀璨宝石宝可梦 服务端启动`);
  console.log(`   API: http://localhost:${config.port}`);
  console.log(`   WebSocket: ws://localhost:${config.port}`);
});
