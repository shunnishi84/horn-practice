interface Props {
  value: number; // remaining seconds (0 means GO)
}

export default function Countdown({ value }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pop-violet/90 to-pop-pink/90 backdrop-blur-sm" data-testid="countdown-overlay">
      <div key={value} className="text-9xl font-extrabold text-white drop-shadow-lg animate-popin" data-testid="countdown-value">
        {value === 0 ? '🎺 スタート！' : value}
      </div>
    </div>
  );
}
