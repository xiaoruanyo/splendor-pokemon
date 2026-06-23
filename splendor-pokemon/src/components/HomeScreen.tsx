import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TRAINERS, UI_ASSETS } from '../types/game';
import type { GameMode, AIDifficulty } from '../types/game';
import RulesModal from './RulesModal';

interface HomeScreenProps {
  onStartSolo: () => void;
  onEnterOnline: () => void;
}

export default function HomeScreen({ onStartSolo, onEnterOnline }: HomeScreenProps) {
  const startGame = useGameStore(s => s.startGame);
  const [mode, setMode] = useState<GameMode | null>(null);
  const [players, setPlayers] = useState<{
    name: string; trainer: string; trainerEmoji: string; isAI: boolean; aiDifficulty?: AIDifficulty;
  }[]>([
    { name: '你', trainer: 'ash', trainerEmoji: '🧢', isAI: false },
    { name: 'AI对手', trainer: 'misty', trainerEmoji: '💧', isAI: true, aiDifficulty: 'medium' },
  ]);
  const [showRules, setShowRules] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');

  const handleStart = () => {
    if (!mode) return;
    const configs = mode === 'solo'
      ? [players[0], ...players.slice(1).map(p => ({ ...p, isAI: true, aiDifficulty }))]
      : players.map(p => ({ ...p, isAI: false }));
    startGame(mode, configs);
    onStartSolo();
  };

  const updatePlayer = (i: number, field: string, value: any) => {
    const newPlayers = [...players];
    (newPlayers[i] as any)[field] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => {
    if (players.length < 4) {
      const t = TRAINERS[players.length % 4];
      setPlayers([...players, {
        name: `玩家${players.length + 1}`,
        trainer: t.id,
        trainerEmoji: t.emoji,
        isAI: mode === 'solo',
        aiDifficulty: mode === 'solo' ? aiDifficulty : undefined,
      }]);
    }
  };

  const removePlayer = () => {
    if (players.length > 2) setPlayers(players.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{
      background: `linear-gradient(rgba(10,10,30,0.35), rgba(10,10,30,0.50)), url(${UI_ASSETS.homeBg}) center/cover no-repeat`,
    }}>
      {/* Title */}
      <div className="text-center mb-8">
        <img src={UI_ASSETS.logo} alt="璀璨宝石：宝可梦" className="h-16 md:h-20 mx-auto mb-4 drop-shadow-lg" />
        <p className="text-gray-400 text-sm md:text-base">
          Splendor: Pokémon Edition
        </p>
      </div>

      {/* Mode Selection */}
      {!mode ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
          <button
            onClick={() => {
              setMode('solo');
              setPlayers([
                { name: '你', trainer: 'ash', trainerEmoji: '🧢', isAI: false },
                { name: '小霞', trainer: 'misty', trainerEmoji: '💧', isAI: true, aiDifficulty: 'medium' },
              ]);
            }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 text-white text-left hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-3xl mb-3">🤖</div>
            <div className="text-xl font-bold mb-1">单人模式</div>
            <div className="text-sm opacity-80">与AI对手对战练习</div>
          </button>
          <button
            onClick={() => {
              setMode('local');
              setPlayers([
                { name: '玩家1', trainer: 'ash', trainerEmoji: '🧢', isAI: false },
                { name: '玩家2', trainer: 'misty', trainerEmoji: '💧', isAI: false },
              ]);
            }}
            className="p-6 rounded-2xl bg-gradient-to-br from-green-600 to-teal-700 text-white text-left hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-3xl mb-3">👥</div>
            <div className="text-xl font-bold mb-1">本地热座</div>
            <div className="text-sm opacity-80">同设备多人轮流对战</div>
          </button>
          <button
            onClick={onEnterOnline}
            className="p-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white text-left hover:scale-105 transition-transform shadow-xl"
          >
            <div className="text-3xl mb-3">🌐</div>
            <div className="text-xl font-bold mb-1">在线对战</div>
            <div className="text-sm opacity-80">与真实玩家联网对战</div>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md space-y-5 animate-slide-up">
          <button onClick={() => setMode(null)} className="text-gray-400 hover:text-white mb-2">
            ← 返回选择模式
          </button>

          {/* Player count */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold">玩家人数</span>
              <div className="flex gap-2">
                <button onClick={removePlayer} className="w-8 h-8 rounded-lg bg-gray-700 text-white">-</button>
                <span className="text-white font-bold text-lg w-8 text-center">{players.length}</span>
                <button onClick={addPlayer} className="w-8 h-8 rounded-lg bg-gray-700 text-white">+</button>
              </div>
            </div>
          </div>

          {/* AI Difficulty (solo mode) */}
          {mode === 'solo' && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <span className="text-white font-bold block mb-2">AI 难度</span>
              <div className="flex gap-2">
                {(['easy', 'medium'] as AIDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setAiDifficulty(d);
                      setPlayers(players.map((p, i) => i === 0 ? p : { ...p, aiDifficulty: d }));
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${
                      aiDifficulty === d
                        ? 'bg-poke-gold text-poke-dark'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {d === 'easy' ? '😊 简单' : '🧠 中等'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player configs */}
          <div className="space-y-3">
            {players.map((p, i) => (
              <div key={i} className="bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{p.trainerEmoji}</span>
                  <span className="text-white font-bold">
                    {p.isAI ? `AI对手 ${i}` : `玩家 ${i + 1}`}
                  </span>
                </div>
                {!p.isAI && (
                  <input
                    type="text"
                    value={p.name}
                    onChange={e => updatePlayer(i, 'name', e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-poke-gold"
                    placeholder="输入名字"
                  />
                )}
                <div className="flex gap-2 mt-3">
                  {TRAINERS.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { updatePlayer(i, 'trainer', t.id); updatePlayer(i, 'trainerEmoji', t.emoji); }}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                        p.trainer === t.id ? 'ring-2 ring-poke-gold scale-110' : 'opacity-50 hover:opacity-80'
                      }`}
                      style={{ backgroundColor: t.color + '30' }}
                      title={t.name}
                    >
                      {t.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-xl bg-poke-gold text-poke-dark font-extrabold text-lg hover:bg-yellow-500 transition-all shadow-xl active:scale-95"
          >
            ⚡ 开始游戏！
          </button>

          {/* Rules button */}
          <button
            onClick={() => setShowRules(true)}
            className="w-full py-3 rounded-xl bg-gray-700/50 text-gray-300 font-bold text-sm hover:bg-gray-600/50 transition-all border border-gray-600/30"
          >
            📖 查看游戏规则
          </button>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
