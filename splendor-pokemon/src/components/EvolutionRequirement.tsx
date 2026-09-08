import type { PlayerState, PokemonCard } from '../types/game';
import { ALL_COLORS, TOKEN_IMG, TOKEN_NAMES } from '../types/game';

interface Props {
  card: PokemonCard;
  player?: Pick<PlayerState, 'bonuses' | 'ownedCards'>;
  detailed?: boolean;
}

export default function EvolutionRequirement({ card, player, detailed = false }: Props) {
  if (!card.evolutionOf) return null;
  const requirements = card.evolutionReq;
  const hasBase = player?.ownedCards.some(owned => owned.name === card.evolutionOf);
  return (
    <div className={`evolution-requirement ${detailed ? 'evolution-detail' : ''}`} aria-label={`${card.name}进化条件`}>
      <div className="evolution-base">由 <strong>{card.evolutionOf}</strong> 进化{detailed && player && <span>{hasBase ? ' · 已拥有' : ' · 尚未拥有'}</span>}</div>
      <div className="evolution-bonuses"><span>永久奖励</span>
        {requirements ? ALL_COLORS.filter(color => requirements[color] > 0).map(color => (
          <span key={color} className={detailed && player && player.bonuses[color] < requirements[color] ? 'requirement-missing' : ''}
            title={`${TOKEN_NAMES[color]}永久奖励需${requirements[color]}个${player ? `，当前${player.bonuses[color]}个` : ''}`}>
            <img src={TOKEN_IMG[color]} alt={TOKEN_NAMES[color]} />
            <b>{detailed && player ? `${player.bonuses[color]}/` : '×'}{requirements[color]}</b>
          </span>
        )) : <span>未配置</span>}
      </div>
      {detailed && <p>{player ? '当前 / 需求 · ' : ''}只检查永久奖励，不消耗手中精灵球</p>}
      {detailed && <p>基础版牌表 · 社区转录交叉核对</p>}
    </div>
  );
}
