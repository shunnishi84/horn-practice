interface Props {
  value: number; // remaining seconds (0 means GO)
}

export default function Countdown({ value }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80" data-testid="countdown-overlay">
      <div className="text-9xl font-bold text-sky-400 animate-pulse" data-testid="countdown-value">
        {value === 0 ? 'スタート！' : value}
      </div>
    </div>
  );
}
