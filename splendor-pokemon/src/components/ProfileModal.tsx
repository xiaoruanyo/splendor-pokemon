import { useState, useEffect } from 'react';
import { users } from '../network/api';
import AvatarPicker from './AvatarPicker';

interface ProfileModalProps {
  userId: string;
  currentAvatar: string;
  username: string;
  onAvatarChange: (newAvatar: string) => void;
  onClose: () => void;
}

interface StatItem {
  label: string;
  value: string | number;
  accent?: boolean;
}

export default function ProfileModal({ userId, currentAvatar, username, onAvatarChange, onClose }: ProfileModalProps) {
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatar, setAvatar] = useState(currentAvatar);

  useEffect(() => {
    Promise.all([
      users.getStats(userId),
      users.getHistory(),
    ]).then(([statsData, historyData]) => {
      setStats(statsData);
      setHistory(historyData.history || []);
    }).catch(() => {
      // Silently handle errors
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleAvatarChange = async (newAvatar: string) => {
    try {
      await users.updateAvatar(newAvatar);
      setAvatar(newAvatar);
      onAvatarChange(newAvatar);
    } catch {
      // Ignore errors
    }
    setShowAvatarPicker(false);
  };

  const statItems: StatItem[] = stats ? [
    { label: '总场次', value: stats.totalGames },
    { label: '胜场', value: stats.wins },
    { label: '负场', value: stats.losses },
    { label: '胜率', value: stats.winRate + '%' },
    { label: '最高分', value: stats.highestScore },
    { label: '平均分', value: Number(stats.avgScore).toFixed(1) },
    { label: 'ELO 评分', value: stats.ratingElo, accent: true },
  ] : [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[85vh] shadow-2xl border border-gray-700 flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <h2 className="text-white font-extrabold text-lg">个人战绩</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white flex items-center justify-center text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-400 animate-pulse">加载中...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* User info + avatar */}
            <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="w-16 h-16 rounded-2xl bg-gray-700 text-4xl flex items-center justify-center hover:bg-gray-600 transition-all shrink-0"
                title="点击更换头像"
              >
                {avatar}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-lg truncate">{username}</div>
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="text-xs text-poke-gold hover:text-yellow-400 transition-all mt-1"
                >
                  更换头像 →
                </button>
              </div>
            </div>

            {/* Stats grid */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">📊 战绩概况</h3>
              <div className="grid grid-cols-2 gap-2">
                {statItems.map(item => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 text-center ${
                      item.accent
                        ? 'bg-poke-gold/10 border border-poke-gold/30'
                        : 'bg-gray-800/60'
                    }`}
                  >
                    <div className={`text-xs text-gray-400 mb-1`}>{item.label}</div>
                    <div className={`text-xl font-extrabold ${item.accent ? 'text-poke-gold' : 'text-white'}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <div>
              <h3 className="text-sm font-bold text-gray-300 mb-2">🕹️ 对战记录</h3>
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  暂无对战记录
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.map((record: any) => (
                    <div key={record.id} className="bg-gray-800/40 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{formatDate(record.createdAt)}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                          record.myResult?.isWin
                            ? 'bg-green-600/30 text-green-400'
                            : 'bg-red-600/30 text-red-400'
                        }`}>
                          {record.myResult?.isWin ? '🏆 胜利' : '💔 失败'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {record.players.map((p: any, i: number) => (
                          <div
                            key={i}
                            className={`flex items-center justify-between rounded-lg px-2 py-1 text-xs ${
                              p.userId === userId ? 'bg-poke-gold/10 border border-poke-gold/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base">{p.avatar}</span>
                              <span className="text-gray-300">{p.username}</span>
                              {p.rank === 1 && <span className="text-yellow-400 text-xs">👑</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-400">#{p.rank}</span>
                              <span className="text-poke-gold font-bold">{p.score}分</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-700 text-white font-bold text-sm hover:bg-gray-600 transition-all active:scale-95"
          >
            关闭
          </button>
        </div>

        {/* Avatar picker overlay */}
        {showAvatarPicker && (
          <AvatarPicker
            currentAvatar={avatar}
            onSelect={handleAvatarChange}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
