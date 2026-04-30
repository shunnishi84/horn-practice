interface Props {
  cents: number | null;
  noteName?: string | null;
}

export default function PitchMeter({ cents, noteName }: Props) {
  const clamped = cents == null ? 0 : Math.max(-50, Math.min(50, cents));
  const pct = ((clamped + 50) / 100) * 100;
  return (
    <div className="bg-slate-800 rounded-lg p-3" data-testid="pitch-meter">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>-50¢</span>
        <span>{noteName ?? '—'}</span>
        <span>+50¢</span>
      </div>
      <div className="relative h-2 bg-slate-700 rounded-full">
        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-400" />
        {cents != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-400"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
      <div className="text-center mt-1 text-sm font-mono">
        {cents == null ? '—' : `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢`}
      </div>
    </div>
  );
}
