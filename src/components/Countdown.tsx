interface Props {
  value: number; // remaining seconds (0 means GO)
}

// Compact banner instead of a fullscreen overlay, so the score (and the
// first note under the now-line) stays visible while counting down.
export default function Countdown({ value }: Props) {
  return (
    <div
      className="card border-pop-pink flex items-center justify-center gap-5 p-4"
      data-testid="countdown-overlay"
    >
      <span className="text-4xl animate-floaty">🎺</span>
      <span
        key={value}
        className={`font-extrabold text-pop-gradient animate-popin text-center ${value === 0 ? 'text-4xl' : 'text-6xl w-16'}`}
        data-testid="countdown-value"
      >
        {value === 0 ? 'スタート！' : value}
      </span>
      <span className="text-sm font-bold text-muted">
        最初の音符はラインの位置から始まります 👇
      </span>
    </div>
  );
}
