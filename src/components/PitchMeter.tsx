interface Props {
  cents: number | null;
  noteName?: string | null;
}

export default function PitchMeter({ cents, noteName }: Props) {
  const clamped = cents == null ? 0 : Math.max(-50, Math.min(50, cents));
  const pct = ((clamped + 50) / 100) * 100;
  const inTune = cents != null && Math.abs(cents) <= 10;
  return (
    <div className="card p-4" data-testid="pitch-meter">
      <div className="flex justify-between text-xs font-bold text-muted mb-2">
        <span>-50¢</span>
        <span className={`text-base ${inTune ? 'text-pop-teal' : 'text-ink'}`}>{noteName ?? '—'}</span>
        <span>+50¢</span>
      </div>
      <div className="relative h-3 rounded-full bg-gradient-to-r from-pop-pink via-pop-teal to-pop-pink opacity-90">
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/80 rounded" />
        {cents != null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-4 border-pop-violet shadow-pop transition-[left] duration-75"
            style={{ left: `${pct}%` }}
          />
        )}
      </div>
      <div className={`text-center mt-2 text-sm font-extrabold ${inTune ? 'text-pop-teal' : 'text-muted'}`}>
        {cents == null ? '—' : `${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢ ${inTune ? '✨' : ''}`}
      </div>
    </div>
  );
}
