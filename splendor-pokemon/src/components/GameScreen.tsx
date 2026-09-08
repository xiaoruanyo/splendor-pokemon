import EvolutionRequirement from './EvolutionRequirement';
import PokemonCardView from './PokemonCardView';
import { useGameStore } from '../store/gameStore';
import { TOKEN_COLORS, TOKEN_EMOJI, TOKEN_NAMES, TOKEN_IMG, ALL_COLORS, MAX_RESERVED, WIN_SCORE, UI_ASSETS } from '../types/game';
import type { TokenColor, PokemonCard, PlayerState } from '../types/game';
import { canAfford, calculatePayment } from '../engine/cards';
import { getAvailableEvolutions } from '../engine/evolution';
import { getCurrentPlayer } from '../engine/game';
import { useState, useEffect, useRef } from 'react';
import GameOverModal from './GameOverModal';
import RulesModal from './RulesModal';

export default function GameScreen({ onBack }: { onBack: () => void }) {
  const game = useGameStore(s => s.game);
  const actionMode = useGameStore(s => s.actionMode);
  const selectedTokens = useGameStore(s => s.selectedTokens);
  const selectedCard = useGameStore(s => s.selectedCard);
  const message = useGameStore(s => s.message);
  const messageType = useGameStore(s => s.messageType);
  const isAIThinking = useGameStore(s => s.isAIThinking);
  const gameOver = useGameStore(s => s.gameOver);

  const selectToken = useGameStore(s => s.selectToken);
  const deselectToken = useGameStore(s => s.deselectToken);
  const selectCard = useGameStore(s => s.selectCard);
  const setActionMode = useGameStore(s => s.setActionMode);
  const clearSelection = useGameStore(s => s.clearSelection);
  const executeTake3Diff = useGameStore(s => s.executeTake3Diff);
  const executeTake2Same = useGameStore(s => s.executeTake2Same);
  const executeBuyCard = useGameStore(s => s.executeBuyCard);
  const executeReserve = useGameStore(s => s.executeReserve);
  const executeEvolve = useGameStore(s => s.executeEvolve);
  const executePass = useGameStore(s => s.executePass);

  const [showReserveDeck, setShowReserveDeck] = useState(false);
  const [showEvolvePanel, setShowEvolvePanel] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [turnPopup, setTurnPopup] = useState<{ show: boolean; name: string; trainerEmoji: string }>({ show: false, name: '', trainerEmoji: '' });
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);
  const prevTurnRef = useRef(-1);

  // Turn change popup
  useEffect(() => {
    if (!game) return;
    if (game.turnNumber !== prevTurnRef.current && prevTurnRef.current !== -1) {
      const cp = game.players[game.currentPlayerIndex];
      setTurnPopup({ show: true, name: cp.name, trainerEmoji: cp.trainerEmoji || '🧢' });
      setTimeout(() => setTurnPopup({ show: false, name: '', trainerEmoji: '' }), 1800);
    }
    prevTurnRef.current = game.turnNumber;
  }, [game?.turnNumber]);

  if (!game) return null;

  const currentPlayer = getCurrentPlayer(game);
  const player = game.mode === 'solo' ? game.players.find(p => !p.isAI)! : currentPlayer;
  const isMyTurn = !currentPlayer.isAI;

  // Compute affordable cards
  const getCardAffordable = (card: PokemonCard) => {
    const { affordable } = canAfford(card, player.tokens, player.bonuses);
    return affordable;
  };

  // Token selection handlers
  const handleTokenClick = (color: TokenColor) => {
    if (!isMyTurn || actionMode !== 'take_3') return;
    if (selectedTokens.includes(color)) {
      deselectToken(color);
    } else {
      selectToken(color);
    }
  };

  const handleTake3Confirm = () => {
    if (selectedTokens.length === 0) return;
    executeTake3Diff();
  };

  const handleTake2 = (color: TokenColor) => {
    if (!isMyTurn) return;
    executeTake2Same(color);
  };

  const handleBuyCard = (card: PokemonCard, source: 'board' | 'reserved') => {
    if (!isMyTurn) return;
    const payment = calculatePayment(card, player.tokens, player.bonuses);
    if (!payment) return;
    executeBuyCard(card.id, source);
  };

  const handleReserveBoard = (card: PokemonCard) => {
    if (!isMyTurn) return;
    executeReserve('board', card.id);
  };

  const handleReserveDeck = (level: 1 | 2 | 3) => {
    if (!isMyTurn) return;
    executeReserve('deck', undefined, level);
    setShowReserveDeck(false);
  };

  const handleEvolve = (fromId: string, toId: string) => {
    executeEvolve(fromId, toId);
    setShowEvolvePanel(false);
  };

  // Compute available evolutions
  const currentEvolutions = getAvailableEvolutions(player, game.board);

  // Token emoji display
  const tokenEmoji = (color: TokenColor) => TOKEN_EMOJI[color] || '⚪';

  return (
    <div className="game-table">
      {/* Turn Popup Overlay */}
      {turnPopup.show && (
        <div className="turn-toast animate-fade-in pointer-events-none">
          <div className="bg-gray-900/90 rounded-3xl px-10 py-8 shadow-2xl border border-poke-gold/40 animate-scale-in text-center">
            <div className="text-6xl mb-4">{turnPopup.trainerEmoji}</div>
            <div className="text-poke-gold text-sm font-bold mb-2">轮到</div>
            <div className="text-white text-3xl font-extrabold">{turnPopup.name}</div>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="table-header">
        <button onClick={onBack} className="text-gray-400 hover:text-white text-sm px-2 py-1">
          ← 返回
        </button>
        <div className="turn-heading">
          <span className="table-brand">璀璨宝石 <span>宝可梦</span></span>
          <div className="text-xs text-gray-400">回合 {game.turnNumber}</div>
          <div className="text-sm font-bold">
            当前: {currentPlayer.trainerEmoji} {currentPlayer.name}
            {isAIThinking && <span className="ml-2 animate-pulse">🤔 思考中...</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRules(true)}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-gray-700/50 transition-all"
            title="查看规则"
          >
            📖 规则
          </button>
          <span className="text-xs text-gray-400">
            {game.lastRoundTriggered ? '⚠ 最后一轮' : `目标: ${WIN_SCORE}分`}
          </span>
        </div>
      </div>

      {/* Message banner */}
      {message && (
        <div role="status" className={`table-message px-4 py-2 text-center text-sm font-bold animate-slide-up ${
          messageType === 'error' ? 'bg-red-600/80' :
          messageType === 'success' ? 'bg-green-600/80' : 'bg-blue-600/60'
        }`}>
          {message}
        </div>
      )}

      {/* Main game area */}
      <div className="table-main">
        <div className="board-layout">

          {/* Opponents (expandable) */}
          <div className="opponents">
            {game.players.filter((p: PlayerState) => p.id !== player.id).map((p: PlayerState) => {
              const idx = game.players.indexOf(p);
              const isExpanded = expandedOpponent === p.id;
              return (
                <div key={p.id}>
                  <div
                    onClick={() => setExpandedOpponent(isExpanded ? null : p.id)}
                    className={`rounded-xl p-2.5 text-sm transition-all cursor-pointer hover:scale-[1.02] ${
                      game.currentPlayerIndex === idx ? 'bg-poke-gold/20 ring-1 ring-poke-gold/50' : 'bg-gray-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{p.trainerEmoji}</span>
                      <div>
                        <div className="font-bold text-xs">{p.name}</div>
                        <div className="text-poke-gold font-bold">{p.score}分</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-0.5 text-xs">
                      {(['red','blue','black','pink','yellow'] as TokenColor[]).map(c => (
                        <span key={c} className="inline-flex items-center gap-0.5 text-gray-400">
                          <img src={TOKEN_IMG[c]} className="w-4 h-4 object-contain" alt="" />
                          ×{p.tokens[c] || 0}
                        </span>
                      ))}
                      <span className="text-purple-400 inline-flex items-center gap-0.5">
                        <img src={TOKEN_IMG.purple} className="w-4 h-4 object-contain" alt="" />
                        ×{p.tokens.purple || 0}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      🃏{p.ownedCards.length}只 | 预留{p.reservedCards.length}
                      <span className="text-gray-600 ml-1">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-1 bg-gray-800/60 rounded-xl p-2">
                      <div className="text-xs text-gray-400 mb-1">已捕获的宝可梦:</div>
                      {p.ownedCards.length === 0 ? (
                        <div className="text-xs text-gray-600">暂无</div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {TOKEN_COLORS.map(color => {
                            const cards = p.ownedCards.filter(c => c.bonus === color);
                            if (cards.length === 0) return null;
                            return cards.map(card => (
                              <div key={card.id} className="flex items-center gap-1 bg-gray-700/50 rounded-lg px-1.5 py-0.5 text-xs">
                                <img src={card.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                                <span>{card.name}</span>
                                <span className="text-poke-gold">{card.points}分</span>
                                <span>{TOKEN_EMOJI[card.bonus]}</span>
                              </div>
                            ));
                          })}
                        </div>
                      )}
                      {p.reservedCards.length > 0 && (
                        <>
                          <div className="text-xs text-gray-400 mt-2 mb-1">保留卡牌 ({p.reservedCards.length}):</div>
                          <div className="flex flex-wrap gap-1">
                            {p.reservedCards.map(card => (
                              <div key={card.id} className="flex items-center gap-1 bg-blue-900/30 rounded-lg px-1.5 py-0.5 text-xs">
                                <img src={card.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                                <span>{card.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Special cards: Rare + Legendary */}
          <div className="special-market">
            <h2 className="section-title">特别邂逅 <span>稀有 · 传说</span></h2>
            {game.board.rareRevealed && (
              <PokemonCardView
                card={game.board.rareRevealed}
                affordable={getCardAffordable(game.board.rareRevealed)}
                isSelected={selectedCard === game.board.rareRevealed.id}
                onClick={() => isMyTurn && selectCard(game.board.rareRevealed!.id)}
                onBuy={() => handleBuyCard(game.board.rareRevealed!, 'board')}
                onReserve={() => handleReserveBoard(game.board.rareRevealed!)}
                isMyTurn={isMyTurn} evolutionPlayer={player}
                compact
              />
            )}
            {game.board.legendaryRevealed && (
              <PokemonCardView
                card={game.board.legendaryRevealed}
                affordable={getCardAffordable(game.board.legendaryRevealed)}
                isSelected={selectedCard === game.board.legendaryRevealed.id}
                onClick={() => isMyTurn && selectCard(game.board.legendaryRevealed!.id)}
                onBuy={() => handleBuyCard(game.board.legendaryRevealed!, 'board')}
                onReserve={() => handleReserveBoard(game.board.legendaryRevealed!)}
                isMyTurn={isMyTurn} evolutionPlayer={player}
                compact
              />
            )}
          </div>

          {/* Card Grid Lv3, Lv2, Lv1 */}
          <div id="card-market" className="card-market">
            {([3, 2, 1] as const).map(level => (
              <div key={level} className="market-tier" data-level={level}>
                <div className="tier-heading">
                  {level === 3 ? '⭐ 高级 Lv.3' : level === 2 ? '⭐ 中级 Lv.2' : '⭐ 初级 Lv.1'}
                  <span className="ml-2 text-gray-600">牌堆: {game.board.decks[level].length}张</span>
                </div>
                <div className="market-row">
                  {(game.board.revealed[level] || []).map((card: PokemonCard) => (
                    <PokemonCardView
                      key={card.id}
                      card={card}
                      affordable={getCardAffordable(card)}
                      isSelected={selectedCard === card.id}
                      onClick={() => isMyTurn && selectCard(card.id)}
                      onBuy={() => handleBuyCard(card, 'board')}
                      onReserve={() => handleReserveBoard(card)}
                      isMyTurn={isMyTurn} evolutionPlayer={player}
                    />
                  ))}
                  {Array.from({ length: 4 - (game.board.revealed[level] || []).length }).map((_, i) => (
                    <div key={`empty-${i}`} className="empty-card">
                      <img src={UI_ASSETS.cardBack} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Token Supply */}
          <div id="token-supply" className="token-supply">
            <div className="section-title">精灵球供应区 <span>{actionMode === 'take_3' ? `已选 ${selectedTokens.length}/3 · 点击球后确认` : '先点击「拿3枚不同球」，再选择颜色'}</span></div>
            <div className="flex flex-wrap gap-2 justify-center">
              {ALL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleTokenClick(color)}
                  disabled={game.tokenSupply[color] <= 0 || color === 'purple' || !isMyTurn || actionMode !== 'take_3'}
                  aria-pressed={selectedTokens.includes(color)}
                  title={color === 'purple' ? '大师球通过保留卡牌获得' : TOKEN_NAMES[color]}
                  className={`relative rounded-xl text-center transition-all ${
                    selectedTokens.includes(color)
                      ? 'ring-2 ring-poke-gold scale-110 shadow-lg shadow-poke-gold/30'
                      : 'hover:scale-105'
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                  style={{ width: 64, height: 64 }}
                >
                  <img src={TOKEN_IMG[color]} alt={TOKEN_NAMES[color]} className="w-full h-full object-contain drop-shadow-md" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-900/80 rounded-full px-1.5 text-xs text-white font-bold">
                    ×{game.tokenSupply[color]}
                  </div>
                  {selectedTokens.includes(color) && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-poke-gold rounded-full text-xs text-poke-dark flex items-center justify-center font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Dashboard (bottom) */}
      <div id="player-dashboard" className="player-dashboard">
        <div className="dashboard-content">
          <div className="trainer-summary">
            <div className="section-title">训练家面板 <span>{isMyTurn ? '你的回合' : '等待对手'}</span></div>
            <div className="trainer-score"><strong>{player.name}</strong><div><b>{player.score}</b><span> / {WIN_SCORE} 分</span></div></div>
            <progress value={player.score} max={WIN_SCORE} aria-label="获胜分数进度" />
            <p>{player.ownedCards.length} 只宝可梦 <span>·</span> {player.evolutionCount} 次进化 <span>·</span> {player.reservedCards.length}/{MAX_RESERVED} 张保留</p>
          </div>

          {/* My tokens */}
          <div className="my-tokens">
            <span className="text-xs text-gray-300 mr-1">我的精灵球</span>
            {ALL_COLORS.map(color => (
              <span key={color} className="text-sm bg-gray-900/60 rounded-lg px-1.5 py-0.5 flex items-center gap-1">
                <img src={TOKEN_IMG[color]} alt="" className="w-5 h-5 object-contain" />
                <span className="text-white">×{player.tokens[color]}</span>
              </span>
            ))}
            <span className="text-xs text-gray-400 ml-2">
              ({Object.values(player.tokens).reduce((a, b) => a + b, 0)}/10)
            </span>
          </div>

          {/* My bonuses */}
          <div className="my-bonuses">
            <span className="text-gray-300">永久奖励:</span>
            {TOKEN_COLORS.map(color => (
              player.bonuses[color] > 0 && (
                <span key={color} className="bg-gray-900/60 rounded-lg px-1.5 py-0.5 flex items-center gap-1 font-bold">
                  <img src={TOKEN_IMG[color]} alt="" className="w-5 h-5 object-contain" />
                  <span className="text-white">×{player.bonuses[color]}</span>
                </span>
              )
            ))}
            {Object.values(player.bonuses).every(b => b === 0) && <span className="text-gray-500">暂无</span>}
          </div>

          {/* Reserved cards */}
          {player.reservedCards.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">保留区 ({player.reservedCards.length}/{MAX_RESERVED}):</div>
              <div className="flex gap-2 overflow-x-auto">
                {player.reservedCards.map(card => (
                  <div key={card.id} className="relative shrink-0">
                    <PokemonCardView
                      card={card}
                      affordable={getCardAffordable(card)}
                      isSelected={selectedCard === card.id}
                      onClick={() => isMyTurn && selectCard(card.id)}
                      onBuy={() => handleBuyCard(card, 'reserved')}
                      isMyTurn={isMyTurn} evolutionPlayer={player}
                      compact
                      reserved
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Pokémon (owned) */}
          <div>
            <div className="text-xs text-gray-400 mb-1">
              我的宝可梦 · {player.ownedCards.length} 只
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TOKEN_COLORS.map(color => {
                const cards = player.ownedCards.filter(c => c.bonus === color);
                if (cards.length === 0) return null;
                return (
                  <div key={color} className="flex flex-col gap-0.5">
                    {cards.map(card => (
                      <div key={card.id} className="text-xs bg-gray-800 px-2 py-1 rounded-lg whitespace-nowrap flex items-center gap-1">
                        <img src={card.image} alt="" className="w-4 h-4 rounded-full object-cover" />
                        <span>{card.name}</span>
                        <span className="text-gray-500">{card.points > 0 ? `+${card.points}分` : ''}</span>
                        <span>{tokenEmoji(color)}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {player.ownedCards.length === 0 && <span className="text-gray-600 text-xs">还没有宝可梦</span>}
            </div>
          </div>

          {/* Action buttons */}
          {isMyTurn && !gameOver && (
            <div className="action-buttons">
              {/* Take 3 different */}
              <button
                onClick={() => setActionMode(actionMode === 'take_3' ? 'none' : 'take_3')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  actionMode === 'take_3' ? 'bg-poke-gold text-poke-dark' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                拿3枚不同球
              </button>

              {/* Take 2 same */}
              {actionMode !== 'take_3' ? (
                <div className="flex gap-1">
                  {TOKEN_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => handleTake2(color)}
                      disabled={game.tokenSupply[color] < 4 || !isMyTurn}
                      className="px-2 py-2 rounded-xl bg-gray-700 text-xs hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      title={`拿2枚${TOKEN_NAMES[color]}`}
                    >
                      <img src={TOKEN_IMG[color]} alt="" className="w-5 h-5 inline-block" /> ×2
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handleTake3Confirm}
                  disabled={selectedTokens.length === 0}
                  className="px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-500 disabled:opacity-30 transition-all"
                >
                  ✓ 确认拿取 ({selectedTokens.length})
                </button>
              )}

              {/* Reserve from deck */}
              <div className="relative">
                <button
                  onClick={() => setShowReserveDeck(!showReserveDeck)}
                  disabled={player.reservedCards.length >= MAX_RESERVED || game.tokenSupply.purple <= 0}
                  className="px-3 py-2 rounded-xl bg-gray-700 text-white text-xs font-bold hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  从牌堆保留 + 大师球
                </button>
                {showReserveDeck && (
                  <div className="absolute bottom-full mb-1 left-0 bg-gray-800 rounded-xl p-2 flex gap-2 z-20 shadow-xl">
                    {([1, 2, 3] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => handleReserveDeck(l)}
                        disabled={game.board.decks[l].length === 0}
                        className="px-3 py-2 rounded-lg bg-gray-700 text-xs hover:bg-gray-600 disabled:opacity-30"
                      >
                        Lv.{l} ({game.board.decks[l].length})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Evolution button */}
              {currentEvolutions.length > 0 && (
                <button
                  onClick={() => setShowEvolvePanel(!showEvolvePanel)}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 animate-pulse-soft transition-all"
                >
                  ⬆ 进化 ({currentEvolutions.length})
                </button>
              )}

              {/* Clear selection */}
              {actionMode !== 'none' && (
                <button
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-xl bg-red-600/50 text-white text-xs hover:bg-red-500 transition-all"
                >
                  ✕ 取消
                </button>
              )}
            </div>
          )}

          {/* Evolution panel */}
          {showEvolvePanel && currentEvolutions.length > 0 && (
            <div className="bg-purple-900/30 rounded-xl p-3 border border-purple-500/30">
              <div className="text-xs font-bold text-purple-300 mb-2">选择进化:</div>
              <div className="flex gap-3 overflow-x-auto">
                {currentEvolutions.map(evo => (
                  <button
                    key={`${evo.from.id}-${evo.to.id}`}
                    onClick={() => handleEvolve(evo.from.id, evo.to.id)}
                    className="shrink-0 bg-gray-800 rounded-xl p-2 hover:bg-gray-700 text-left transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <img src={evo.from.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs">→</span>
                      <img src={evo.to.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                    </div>
                    <div className="text-xs mt-1 text-center text-purple-300">
                      {evo.from.name} → {evo.to.name}
                      <EvolutionRequirement card={evo.to} player={player} detailed />
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => { executePass(); setShowEvolvePanel(false); }}
                  className="shrink-0 bg-gray-700 rounded-xl p-2 hover:bg-gray-600 text-xs text-gray-400 px-4"
                >
                  跳过
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <nav className="mobile-table-nav" aria-label="对局区域">
        <a href="#card-market">卡牌市场</a><a href="#token-supply">拿取精灵球</a><a href="#player-dashboard">我的面板 · 操作</a>
      </nav>
      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      {/* Game Over Modal */}
      {gameOver && game.phase === 'finished' && <GameOverModal onBackToMenu={onBack} />}
    </div>
  );
}
