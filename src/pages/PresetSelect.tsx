import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRESETS } from '../music/presets';
import type { PresetCategory } from '../types';

const CATEGORIES: { value: PresetCategory; label: string }[] = [
  { value: 'long_tone', label: 'ロングトーン' },
  { value: 'scale', label: 'スケール' },
  { value: 'arpeggio', label: 'アルペジオ' },
  { value: 'interval', label: 'インターバル' },
  { value: 'tonguing', label: 'タンギング' },
];

export default function PresetSelect() {
  const [active, setActive] = useState<PresetCategory>('long_tone');
  const filtered = PRESETS.filter((p) => p.category === active);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">プリセットを選ぶ</h1>
      <div className="flex gap-2 flex-wrap" data-testid="category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActive(c.value)}
            className={`px-3 py-1.5 rounded ${active === c.value ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            data-testid={`tab-${c.value}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to={`/setup/${p.id}`}
            className="bg-slate-800 hover:bg-slate-700 rounded-lg p-4 block"
            data-testid={`preset-${p.id}`}
          >
            <div className="font-semibold">{p.title}</div>
            {p.description && <div className="text-xs text-slate-400 mt-1">{p.description}</div>}
            <div className="text-xs text-slate-400 mt-2">
              ♩ = {p.defaultBpm} · {p.notes.length} ノート · {p.timeSignature.numerator}/{p.timeSignature.denominator}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
