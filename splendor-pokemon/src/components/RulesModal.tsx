import { TOKEN_IMG, TOKEN_NAMES, WIN_SCORE, MAX_RESERVED, ALL_COLORS } from '../types/game';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] shadow-2xl border border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h2 className="text-lg font-extrabold text-white">游戏规则</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white flex items-center justify-center text-lg transition-all"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm leading-relaxed">
          {/* 1. Overview */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">🎯 游戏目标</h3>
            <p className="text-gray-300">
              收集精灵球、捕获宝可梦、进化你的队伍！任一玩家达到 <span className="text-poke-gold font-bold">{WIN_SCORE} 分</span> 触发终局，
              同轮结束后<strong>分数最高者获胜</strong>。同分时进化次数多者获胜。
            </p>
          </section>

          {/* 2. Components */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">🃏 游戏组件</h3>
            <div className="space-y-2 text-gray-300">
              <div>
                <span className="font-bold text-white">宝可梦卡牌</span>（共 90 张）：
                <ul className="list-disc list-inside pl-2 mt-1 space-y-0.5 text-xs text-gray-400">
                  <li><span className="text-white">初级 Lv.1</span> — 40张，基础宝可梦，多为0-1分</li>
                  <li><span className="text-white">中级 Lv.2</span> — 30张，一阶进化，多为1-3分</li>
                  <li><span className="text-white">高级 Lv.3</span> — 10张，强力宝可梦，多为3-5分</li>
                  <li><span className="text-yellow-400">稀有 Rare</span> — 5张，需大师球，双倍奖励</li>
                  <li><span className="text-yellow-400">传说 Legendary</span> — 5张，需大师球，最高分</li>
                </ul>
              </div>
              <div>
                <span className="font-bold text-white">精灵球代币</span>（共 40 枚）：
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ALL_COLORS.map(c => (
                    <span key={c} className="inline-flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 text-xs">
                      <img src={TOKEN_IMG[c]} alt="" className="w-5 h-5 object-contain" />
                      <span>{TOKEN_NAMES[c]}</span>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">大师球（🟣）可替代任意颜色，是捕获稀有/传说宝可梦的必需品。</p>
              </div>
            </div>
          </section>

          {/* 3. Turn Actions */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">🔄 回合行动（每回合 4 选 1）</h3>
            <div className="space-y-3">
              <div className="bg-gray-800/60 rounded-xl p-3">
                <div className="font-bold text-white mb-1">① 拿取精灵球</div>
                <div className="text-gray-400 text-xs space-y-1">
                  <p><strong className="text-green-400">方案A：</strong>拿 3 枚不同颜色的精灵球（不能拿大师球）</p>
                  <p><strong className="text-green-400">方案B：</strong>拿 2 枚相同颜色的精灵球（该颜色≥4枚时可用，不能拿大师球）</p>
                  <p className="text-gray-500">⚠ 回合结束时手持上限为 10 枚</p>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-3">
                <div className="font-bold text-white mb-1">② 捕获宝可梦</div>
                <div className="text-gray-400 text-xs space-y-1">
                  <p>支付卡牌左下方显示的精灵球费用，大师球可替代任意颜色</p>
                  <p>可从<strong>场上</strong>或<strong>保留区</strong>中购买</p>
                  <p>购买的宝可梦提供<strong className="text-poke-gold">永久奖励</strong>（后续购买自动减免）</p>
                  <p>购买后空位从牌堆顶自动补充</p>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-3">
                <div className="font-bold text-white mb-1">③ 保留卡牌（预约）</div>
                <div className="text-gray-400 text-xs space-y-1">
                  <p>从场上选 1 张牌，或从牌堆顶部暗抽 1 张保留到手</p>
                  <p>同时获得 <strong className="text-purple-400">1 枚大师球</strong></p>
                  <p>保留上限 <strong className="text-white">{MAX_RESERVED} 张</strong>，超出不可再保留</p>
                </div>
              </div>

              <div className="bg-gray-800/60 rounded-xl p-3 border border-purple-500/30">
                <div className="font-bold text-white mb-1">④ 宝可梦进化 ⭐</div>
                <div className="text-gray-400 text-xs space-y-1">
                  <p><strong className="text-purple-300">不用付费！</strong>满足进化条件即可将高阶宝可梦覆盖到低阶宝可梦上</p>
                  <p>需要有<strong>基础形态的宝可梦</strong>，且进化形态在场上或保留区中</p>
                  <p>每回合最多进化 <strong>1 只</strong></p>
                  <p className="text-gray-500">进化链示例：小火龙 → 火恐龙 → 喷火龙</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Special cards */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">⭐ 稀有 & 传说宝可梦</h3>
            <div className="bg-yellow-900/20 rounded-xl p-3 border border-yellow-600/30 text-xs text-gray-300">
              <ul className="space-y-1 list-disc list-inside">
                <li>各单独成堆，每堆只翻开 1 张在场</li>
                <li><strong>必须使用大师球</strong>作为费用的一部分才能捕获</li>
                <li>提供 <strong className="text-yellow-400">双倍永久奖励</strong>，加速你的队伍成长</li>
                <li>分值通常较高，是获胜的关键</li>
              </ul>
            </div>
          </section>

          {/* 5. Game End */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">🏁 游戏结束</h3>
            <div className="bg-gray-800/60 rounded-xl p-3 text-xs text-gray-300 space-y-1">
              <p>1. 任一玩家达到 <strong className="text-poke-gold">{WIN_SCORE} 分</strong> → 触发终局</p>
              <p>2. 当前轮继续，确保所有玩家回合数相同</p>
              <p>3. <strong>分数最高者获胜</strong></p>
              <p>4. 同分时 → 进化次数多者胜 → 仍平手则共享胜利</p>
            </div>
          </section>

          {/* 6. Tips */}
          <section>
            <h3 className="text-poke-gold font-bold text-base mb-2">💡 新手小贴士</h3>
            <div className="bg-blue-900/20 rounded-xl p-3 text-xs text-gray-300 space-y-1.5">
              <p>• 前期多拿低级宝可梦，积累永久奖励可以让你后期<strong>免费或低价</strong>拿高级卡</p>
              <p>• 保留卡牌是获取大师球的好方法，同时也是干扰对手的手段</p>
              <p>• 进化系统是<strong>免费</strong>的，能有效提升分数和奖励</p>
              <p>• 手中精灵球不要超过 10 枚，合理规划拿取和消费</p>
              <p>• 留意对手的保留区和分数，适时拦截关键卡牌</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-poke-gold text-poke-dark font-extrabold hover:bg-yellow-500 transition-all active:scale-95"
          >
            我知道了，开始游戏！
          </button>
        </div>
      </div>
    </div>
  );
}
