import { io, Socket } from 'socket.io-client';
import { getToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  const token = getToken();
  if (!token) throw new Error('未登录');

  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket 已连接:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket 断开:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('WebSocket 连接失败:', err.message);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
