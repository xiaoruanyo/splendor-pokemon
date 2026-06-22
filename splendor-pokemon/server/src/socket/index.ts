import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { registerRoomHandlers } from './room.js';
import { registerGameHandlers } from './game.js';

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('未登录'));
      return;
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret) as any;
      (socket as any).user = { userId: payload.userId, username: payload.username, avatar: payload.avatar || '🧢' };
      next();
    } catch {
      next(new Error('登录已过期'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`玩家连接: ${(socket as any).user?.username} (${socket.id})`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`玩家断开: ${(socket as any).user?.username} (${socket.id})`);
    });
  });

  return io;
}
