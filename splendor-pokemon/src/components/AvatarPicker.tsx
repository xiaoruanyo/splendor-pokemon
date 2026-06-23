import { useState } from 'react';
import { PRESET_AVATARS } from '../network/api';

interface AvatarPickerProps {
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ currentAvatar, onSelect, onClose }: AvatarPickerProps) {
  const [selected, setSelected] = useState(currentAvatar);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-xs w-full shadow-2xl border border-gray-700 animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-4 text-center">选择头像</h3>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {PRESET_AVATARS.map(emoji => (
            <button
              key={emoji}
              onClick={() => setSelected(emoji)}
              className={`w-14 h-14 rounded-xl text-2xl flex items-center justify-center transition-all ${
                selected === emoji
                  ? 'bg-poke-gold/20 ring-2 ring-poke-gold scale-110'
                  : 'bg-gray-700/50 hover:bg-gray-600'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onSelect(selected)}
            className="flex-1 py-2.5 rounded-xl bg-poke-gold text-poke-dark font-bold text-sm hover:bg-yellow-500 transition-all active:scale-95"
          >
            确认
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-300 font-bold text-sm hover:bg-gray-600 transition-all active:scale-95"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
