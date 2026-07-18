import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRESETS } from '../music/presets';
import type { PresetCategory } from '../types';

const CATEGORIES: { value: PresetCategory; label: string; emoji: string }[] = [
  { value: 'long_tone', label: 'ロングトーン', emoji: '🌬️' },
  { value: 'scale', label: 'スケール', emoji: '🎼' },
  { value: 'arpeggio', label: 'アルペジオ', emoji: '🎹' },
  { value: 'interval', label: 'インターバル', emoji: '↕️' },
  { value: 'tonguing', label: 'タンギング', emoji: '⚡' },
];

export default function PresetSelect() {
  const [active, setActive] = useState<PresetCategory>('long_tone');
  const filtered = PRESETS.filter((p) => p.category === active);
  const activeEmoji = CATEGORIES.find((c) => c.value === active)?.emoji ?? '🎵';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">🎯 プリセットを選ぶ</h1>
      <div className="flex gap-2 flex-wrap" data-testid="category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActive(c.value)}
            className={active === c.value ? 'chip-on' : 'chip'}
            data-testid={`tab-${c.value}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to={`/setup/${p.id}`}
            className="card p-4 block transition hover:-translate-y-1 hover:border-pop-pink"
            data-testid={`preset-${p.id}`}
          >
            <div className="font-extrabold">{activeEmoji} {p.title}</div>
            {p.description && <div className="text-xs text-muted mt-1 font-bold">{p.description}</div>}
            <div className="text-xs font-bold text-pop-violet mt-2">
              ♩ = {p.defaultBpm} · {p.notes.length} ノート · {p.timeSignature.numerator}/{p.timeSignature.denominator}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
