import type { Server, Socket } from 'socket.io';
import type { RoomInfo } from '../engine/types.js';

interface Room {
  roomId: string;
  hostId: string;
  players: { id: string; socketId: string; name: string; avatar: string; userId?: string; ready: boolean }[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
}

const rooms = new Map<string, Room>();

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getRoomByPlayer(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.find(p => p.socketId === socketId)) return room;
  }
  return undefined;
}

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // Create room
  socket.on('room:create', (data: { maxPlayers: number }, callback) => {
    try {
      const user = (socket as any).user;
      if (!user) { callback?.({ error: '未登录' }); return; }

      // Leave any existing room
      const existing = getRoomByPlayer(socket.id);
      if (existing) {
        existing.players = existing.players.filter(p => p.socketId !== socket.id);
        if (existing.players.length === 0) rooms.delete(existing.roomId);
        else io.to(existing.roomId).emit('room:updated', roomToInfo(existing));
      }

      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const room: Room = {
        roomId,
        hostId: socket.id,
        players: [{ id: socket.id, socketId: socket.id, name: user.username, avatar: user.avatar, userId: user.userId, ready: true }],
        maxPlayers: data.maxPlayers || 2,
        status: 'waiting',
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      callback?.({ room: roomToInfo(room) });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Join room
  socket.on('room:join', (data: { roomId: string }, callback) => {
    try {
      const user = (socket as any).user;
      if (!user) { callback?.({ error: '未登录' }); return; }

      const room = rooms.get(data.roomId);
      if (!room) { callback?.({ error: '房间不存在' }); return; }
      if (room.status !== 'waiting') { callback?.({ error: '游戏已开始' }); return; }
      if (room.players.length >= room.maxPlayers) { callback?.({ error: '房间已满' }); return; }
      if (room.players.find(p => p.userId === user.userId)) { callback?.({ error: '已在房间中' }); return; }

      // Leave existing room
      const existing = getRoomByPlayer(socket.id);
      if (existing) {
        existing.players = existing.players.filter(p => p.socketId !== socket.id);
        if (existing.players.length === 0) rooms.delete(existing.roomId);
        else io.to(existing.roomId).emit('room:updated', roomToInfo(existing));
        socket.leave(existing.roomId);
      }

      room.players.push({ id: socket.id, socketId: socket.id, name: user.username, avatar: user.avatar, userId: user.userId, ready: false });
      socket.join(data.roomId);
      io.to(data.roomId).emit('room:updated', roomToInfo(room));
      callback?.({ room: roomToInfo(room) });
    } catch (err: any) {
      callback?.({ error: err.message });
    }
  });

  // Leave room
  socket.on('room:leave', () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(room.roomId);
    if (room.players.length === 0) {
      rooms.delete(room.roomId);
    } else {
      if (room.hostId === socket.id) room.hostId = room.players[0].socketId;
      io.to(room.roomId).emit('room:updated', roomToInfo(room));
    }
  });

  // Ready toggle
  socket.on('room:ready', (ready: boolean) => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    const p = room.players.find(p => p.socketId === socket.id);
    if (p) p.ready = ready;
    io.to(room.roomId).emit('room:updated', roomToInfo(room));
  });

  // Get room list
  socket.on('room:list', (_data, callback) => {
    const list: RoomInfo[] = [];
    for (const room of rooms.values()) {
      if (room.status === 'waiting') list.push(roomToInfo(room));
    }
    callback?.({ rooms: list });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const room = getRoomByPlayer(socket.id);
    if (!room) return;
    room.players = room.players.filter(p => p.socketId !== socket.id);
    socket.leave(room.roomId);
    if (room.players.length === 0) {
      rooms.delete(room.roomId);
    } else {
      if (room.hostId === socket.id) room.hostId = room.players[0].socketId;
      io.to(room.roomId).emit('room:updated', roomToInfo(room));
    }
  });
}

function roomToInfo(room: Room): RoomInfo {
  return {
    roomId: room.roomId,
    hostId: room.hostId,
    players: room.players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, userId: p.userId, ready: p.ready })),
    maxPlayers: room.maxPlayers,
    status: room.status,
  };
}

export { rooms };
