import { useGameStore } from '../store/gameStore';
import type { PlayerState } from '../types/game';

export default function GameOverModal({ onBackToMenu }: { onBackToMenu: () => void }) {
  const game = useGameStore(s => s.game);
  const startGame = useGameStore(s => s.startGame);

  if (!game || game.phase !== 'finished') return null;

  const { winner, rankings } = game;

  const handleNewGame = () => {
    // Reset to same config
    const configs = game.players.map((p: PlayerState) => ({
      name: p.name,
      trainer: p.trainer,
      trainerEmoji: p.trainerEmoji,
      isAI: p.isAI,
      aiDifficulty: p.aiDifficulty,
    }));
    startGame(game.mode, configs);
  };

  const handleBackToMenu = () => {
    onBackToMenu();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-slide-up">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-700">
        {/* Winner */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🏆</div>
          <h2 className="text-2xl font-extrabold text-poke-gold mb-1">
            {winner!.name} 获胜！
          </h2>
          <p className="text-gray-400 text-sm">
            {winner!.trainerEmoji} {winner!.trainer}
          </p>
        </div>

        {/* Rankings */}
        <div className="space-y-2 mb-6">
          {rankings.map((p: PlayerState, i: number) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-xl ${
                i === 0 ? 'bg-poke-gold/20 border border-poke-gold/30' : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xl font-bold ${i === 0 ? 'text-poke-gold' : 'text-gray-400'}`}>
                  #{i + 1}
                </span>
                <span className="text-2xl">{p.trainerEmoji}</span>
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-xs text-gray-400">
                    {p.isAI ? `AI (${p.aiDifficulty})` : '玩家'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-poke-gold">{p.score}分</div>
                <div className="text-xs text-gray-400">
                  🃏{p.ownedCards.length}只 ⬆{p.evolutionCount}次进化
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleNewGame}
            className="flex-1 py-3 rounded-xl bg-poke-gold text-poke-dark font-extrabold hover:bg-yellow-500 transition-all active:scale-95"
          >
            🔄 再来一局
          </button>
          <button
            onClick={handleBackToMenu}
            className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 transition-all active:scale-95"
          >
            🏠 返回主菜单
          </button>
        </div>
      </div>
    </div>
  );
}
