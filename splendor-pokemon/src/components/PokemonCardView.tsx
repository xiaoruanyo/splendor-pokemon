import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { PokemonCard, PlayerState } from '../types/game';
import { ALL_COLORS, TOKEN_IMG, TOKEN_NAMES } from '../types/game';
import EvolutionRequirement from './EvolutionRequirement';

const accents = { red: '#ee8975', blue: '#77b9ed', black: '#8fb89c', pink: '#eaa4ca', yellow: '#e5cc76', purple: '#b79bed' };

interface Props {
  card: PokemonCard;
  affordable: boolean;
  isSelected: boolean;
  onClick: () => void;
  onBuy: () => void;
  onReserve?: () => void;
  isMyTurn: boolean;
  compact?: boolean;
  reserved?: boolean;
  evolutionPlayer?: Pick<PlayerState, 'bonuses' | 'ownedCards'>;
}

/** Shared by local and online games so cost, score and actions stay consistent. */
export default function PokemonCardView({ card, affordable, isSelected, onClick, onBuy, onReserve, isMyTurn, compact, reserved, evolutionPlayer }: Props) {
  const [open, setOpen] = useState(false);
  const special = card.level === 'rare' || card.level === 'legendary';
  const showActions = open && isSelected && isMyTurn;
  const frontRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (showActions) closeRef.current?.focus({ preventScroll: true });
  }, [showActions]);
  const flipBack = () => {
    setOpen(false);
    requestAnimationFrame(() => frontRef.current?.focus({ preventScroll: true }));
  };
  return (
    <article className={`pokemon-card ${special ? 'special-card' : ''} ${compact ? 'compact-card' : ''} ${isSelected ? 'selected-card' : ''} ${affordable && isMyTurn ? 'affordable-card' : ''}`}
      style={{ '--card-accent': accents[card.bonus] } as CSSProperties}>
      <div className={`card-flipper ${showActions ? 'is-flipped' : ''}`}>
      <button ref={frontRef} className="card-face" onClick={() => { onClick(); setOpen(true); }} disabled={!isMyTurn} inert={showActions} aria-hidden={showActions}
        aria-label={`${card.name}，${card.points}分${affordable ? '，可捕获' : ''}${reserved ? '，已保留' : ''}`} aria-expanded={showActions}>
        <div className="card-topline">
          <span className="card-points" aria-label={`${card.points}分`}>{card.points > 0 ? card.points : ''}</span>
          <span className="card-bonus" title={`永久奖励：${TOKEN_NAMES[card.bonus]} ×${card.bonusCount}`} aria-label={`永久奖励：${TOKEN_NAMES[card.bonus]} ×${card.bonusCount}`}>
            {Array.from({ length: card.bonusCount }, (_, index) => <img key={index} src={TOKEN_IMG[card.bonus]} alt="" />)}
          </span>
        </div>
        <div className="card-art"><img src={card.image} alt="" loading="lazy" /></div>
        <div className="card-name">{card.name}</div>
        <div className="card-cost" aria-label="捕获费用">
          {ALL_COLORS.filter(color => card.cost[color] > 0).map(color => <span key={color} title={TOKEN_NAMES[color]}><img src={TOKEN_IMG[color]} alt={TOKEN_NAMES[color]} /><b>{card.cost[color]}</b></span>)}
          {ALL_COLORS.every(color => !card.cost[color]) && <span aria-label="免费捕获">0</span>}
        </div>
      </button>
      <div ref={backRef} className="card-back" role="group" aria-label={`${card.name}背面与操作`} aria-hidden={!showActions} inert={!showActions}
        onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); flipBack(); } }}>
        <div className="card-back-heading"><strong>{card.name}</strong><span>{reserved ? '已保留' : '进化条件'}</span></div>
        <div className="card-back-content">
          {card.evolutionOf ? <EvolutionRequirement card={card} player={evolutionPlayer} detailed /> : <p className="card-no-evolution">{special ? '不可保留 · 需大师球捕获' : '这张卡没有进化前置条件'}</p>}
        </div>
        <div className="card-back-actions">
          <button onClick={() => { onBuy(); setOpen(false); }} disabled={!affordable || !isMyTurn} className="catch-button">{affordable ? '捕获' : '球不足'}</button>
          {onReserve && !reserved && !special && <button onClick={() => { onReserve(); setOpen(false); }} disabled={!isMyTurn}>保留 + 大师球</button>}
        </div>
        <button ref={closeRef} onClick={flipBack} className="flip-back">↶ 翻回正面</button>
      </div>
      </div>
    </article>
  );
}
