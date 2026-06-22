import { useState, useEffect, useCallback } from 'react';
import { connectSocket, getSocket, disconnectSocket } from '../network/socket';
import { users, clearToken } from '../network/api';
import type { Socket } from 'socket.io-client';

interface LobbyScreenProps {
  user: { id: string; username: string; avatar: string };
  onStartGame: (gameState: any) => void;
  onLogout: () => void;
  onBackToSolo: () => void;
}

interface RoomInfo {
  roomId: string;
  hostId: string;
  players: { id: string; name: string; avatar: string; ready: boolean }[];
  maxPlayers: number;
  status: string;
}

export default function LobbyScreen({ user, onStartGame, onLogout, onBackToSolo }: LobbyScreenProps) {
  const [socket, setLocalSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [roomList, setRoomList] = useState<RoomInfo[]>([]);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    let s = getSocket();
    if (!s?.connected) {
      s = connectSocket();
    }
    setLocalSocket(s);

    return () => {
      // Don't disconnect on unmount so game can continue
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const onRoomUpdated = (info: RoomInfo) => {
      setRoom(info);
    };

    const onGameStarted = (gameState: any) => {
      onStartGame(gameState);
    };

    const onError = (err: { error: string } | string) => {
      const msg = typeof err === 'string' ? err : err.error;
      setError(msg);
    };

    socket.on('room:updated', onRoomUpdated);
    socket.on('game:started', onGameStarted);
    socket.on('error', onError);

    return () => {
      socket.off('room:updated', onRoomUpdated);
      socket.off('game:started', onGameStarted);
      socket.off('error', onError);
    };
  }, [socket, onStartGame]);

  // Load room list
  const refreshRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('room:list', {}, (res: any) => {
      if (res?.rooms) setRoomList(res.rooms);
    });
  }, [socket]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await users.getLeaderboard();
      setLeaderboard(data.leaderboard || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (showLeaderboard) loadLeaderboard();
  }, [showLeaderboard, loadLeaderboard]);

  // Create room
  const handleCreate = () => {
    if (!socket) return;
    setError('');
    socket.emit('room:create', { maxPlayers: 4 }, (res: any) => {
      if (res?.error) setError(res.error);
      else if (res?.room) setRoom(res.room);
    });
  };

  // Join room
  const handleJoin = (roomId: string) => {
    if (!socket) return;
    setError('');
    socket.emit('room:join', { roomId }, (res: any) => {
      if (res?.error) setError(res.error);
      else if (res?.room) setRoom(res.room);
    });
  };

  // Leave room
  const handleLeave = () => {
    if (!socket) return;
    socket.emit('room:leave');
    setRoom(null);
  };

  // Toggle ready
  const handleReady = () => {
    if (!socket || !room) return;
    const me = room.players.find(p => p.id === socket.id);
    socket.emit('room:ready', !me?.ready);
  };

  // Start game (host only)
  const handleStart = () => {
    if (!socket) return;
    socket.emit('game:start', {}, (res: any) => {
      if (res?.error) setError(res.error);
    });
  };

  // Logout
  const handleLogout = () => {
    disconnectSocket();
    clearToken();
    onLogout();
  };

  const isHost = room && socket && room.hostId === socket.id;
  const allReady = room?.players.every(p => p.ready) && room.players.length >= 2;

  // If not connected yet
  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">连接服务器中...</div>
      </div>
    );
  }

  // In room view
  if (room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">房间 {room.roomId.slice(-6)}</h2>
            <span className="text-xs text-gray-400">{room.players.length}/{room.maxPlayers} 人</span>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 mb-3">
              {error}
            </div>
          )}

          <div className="space-y-2 mb-4">
            {room.players.map(p => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                p.id === room.hostId ? 'bg-poke-gold/10 border border-poke-gold/30' : 'bg-gray-700/40'
              }`}>
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">
                    {p.name}
                    {p.id === room.hostId && <span className="text-xs text-poke-gold ml-1">房主</span>}
                  </div>
                </div>
                {p.ready ? (
                  <span className="text-green-400 text-sm font-bold">✓ 已准备</span>
                ) : (
                  <span className="text-gray-500 text-sm">未准备</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={handleReady} className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold text-sm hover:bg-gray-600 transition-all">
              {room.players.find(p => p.id === socket.id)?.ready ? '取消准备' : '准备'}
            </button>
            {isHost && allReady && (
              <button onClick={handleStart} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-500 transition-all">
                ⚡ 开始游戏
              </button>
            )}
            {!isHost && allReady && (
              <div className="flex-1 py-3 rounded-xl bg-gray-700 text-gray-400 font-bold text-sm text-center">
                等待房主开始...
              </div>
            )}
            <button onClick={handleLeave} className="py-3 px-4 rounded-xl bg-red-600/30 text-red-300 text-sm hover:bg-red-600/50 transition-all">
              离开
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby view
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{user.avatar}</span>
            <div>
              <div className="text-white font-bold text-lg">{user.username}</div>
              <div className="text-xs text-gray-400">在线大厅</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="px-3 py-2 rounded-xl bg-gray-700 text-white text-xs hover:bg-gray-600 transition-all">
              🏆 排行
            </button>
            <button onClick={onBackToSolo} className="px-3 py-2 rounded-xl bg-blue-600/50 text-white text-xs hover:bg-blue-600 transition-all">
              🤖 单人
            </button>
            <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-red-600/30 text-red-300 text-xs hover:bg-red-600/50 transition-all">
              退出
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-300 mb-4">
            {error}
          </div>
        )}

        {/* Leaderboard */}
        {showLeaderboard && (
          <div className="bg-gray-800/60 rounded-2xl p-4 mb-4">
            <h3 className="text-white font-bold mb-3">🏆 排行榜</h3>
            {leaderboard.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-4">暂无数据</div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {leaderboard.slice(0, 20).map((entry, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-700/30 text-sm">
                    <span className={`font-bold w-6 ${
                      i === 0 ? 'text-poke-gold' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'
                    }`}>{entry.rank}</span>
                    <span className="text-xl">{entry.avatar}</span>
                    <span className="text-white flex-1">{entry.username}</span>
                    <span className="text-gray-400 text-xs">{entry.ratingElo} ELO</span>
                    <span className="text-gray-500 text-xs">{entry.wins}胜/{entry.totalGames - entry.wins}负</span>
                    <span className="text-gray-500 text-xs">{entry.winRate}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={handleCreate} className="flex-1 py-4 rounded-2xl bg-gradient-to-br from-poke-gold to-yellow-600 text-poke-dark font-extrabold text-lg hover:scale-105 transition-transform shadow-xl">
            ⚡ 创建房间
          </button>
          <button onClick={refreshRooms} className="px-6 py-4 rounded-2xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all">
            🔄 刷新
          </button>
        </div>

        {/* Room list */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-sm">可加入的房间</h3>
          {roomList.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              暂无房间，创建一个吧！
            </div>
          ) : (
            roomList.map(r => (
              <div key={r.roomId} className="bg-gray-800/40 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">房间 {r.roomId.slice(-6)}</div>
                  <div className="text-gray-400 text-xs">
                    {r.players.length}/{r.maxPlayers} 人 · 房主: {r.players[0]?.name}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {r.players.map(p => (
                      <span key={p.id} title={p.name} className="text-lg">{p.avatar}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(r.roomId)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-all"
                >
                  加入
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
