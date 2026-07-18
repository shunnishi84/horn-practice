import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../store/store';

export default function Result() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessions = useAppStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div className="card p-6 text-center space-y-2" data-testid="result-not-found">
        <p className="font-bold">😢 結果が見つかりません</p>
        <Link to="/" className="text-pop-pink font-bold underline">ホームへ</Link>
      </div>
    );
  }

  const weakest = [...session.noteResults]
    .filter((r) => r.expectedPitch !== 'rest')
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, 3);

  const cheer =
    session.totalScore >= 90 ? '🎉 すばらしい！' :
    session.totalScore >= 75 ? '✨ いい調子！' :
    session.totalScore >= 50 ? '💪 あと少し！' :
    '🌱 コツコツいこう！';

  return (
    <div className="space-y-6" data-testid="result-page">
      <section>
        <div className="card p-6 text-center animate-popin">
          <div className="text-sm font-bold text-muted">総合スコア</div>
          <div className="text-7xl font-extrabold text-pop-gradient" data-testid="total-score">{session.totalScore}</div>
          <div className="text-xl font-extrabold mt-2">{cheer}</div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <ScoreBox icon="🎯" label="音程" value={session.pitchScore} accent="text-pop-pink" testid="score-pitch" />
        <ScoreBox icon="⏰" label="タイミング" value={session.timingScore} accent="text-pop-sky" testid="score-timing" />
        <ScoreBox icon="📏" label="音価" value={session.durationScore} accent="text-pop-teal" testid="score-duration" />
      </section>

      <section>
        <h2 className="text-lg font-extrabold mb-3">📊 3軸の比較</h2>
        <div className="card p-4">
          <RadarChart pitch={session.pitchScore} timing={session.timingScore} duration={session.durationScore} />
        </div>
      </section>

      {weakest.length > 0 && (
        <section>
          <h2 className="text-lg font-extrabold mb-3">🤔 苦手だった音</h2>
          <ul className="flex gap-2 flex-wrap" data-testid="weakest">
            {weakest.map((r) => (
              <li key={r.noteIndex} className="bg-pop-rose/10 border-2 border-pop-rose text-pop-rose font-bold px-4 py-1.5 rounded-full text-sm">
                {r.expectedPitch}: {r.totalScore}点
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-extrabold mb-3">📝 ノート別結果</h2>
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm" data-testid="note-table">
            <thead className="text-muted font-bold">
              <tr>
                <th className="px-2 py-1 text-left">#</th>
                <th className="px-2 py-1 text-left">音</th>
                <th className="px-2 py-1">音程</th>
                <th className="px-2 py-1">タイミング</th>
                <th className="px-2 py-1">音価</th>
                <th className="px-2 py-1">総合</th>
                <th className="px-2 py-1">ズレ(¢)</th>
              </tr>
            </thead>
            <tbody>
              {session.noteResults.map((r) => (
                <tr key={r.noteIndex} className="border-t-2 border-line">
                  <td className="px-2 py-1">{r.noteIndex + 1}</td>
                  <td className="px-2 py-1 font-bold text-pop-violet">{r.expectedPitch}</td>
                  <td className="px-2 py-1 text-center">{r.pitchScore}</td>
                  <td className="px-2 py-1 text-center">{r.timingScore}</td>
                  <td className="px-2 py-1 text-center">{r.durationScore}</td>
                  <td className="px-2 py-1 text-center font-extrabold">{r.totalScore}</td>
                  <td className="px-2 py-1 text-center">
                    {r.pitchDeviationCents != null ? `${r.pitchDeviationCents > 0 ? '+' : ''}${r.pitchDeviationCents.toFixed(1)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex gap-3 flex-wrap">
        <Link to={`/practice/${session.presetId}?bpm=${session.bpm}`} className="btn-pop" data-testid="retry">
          🔁 もう一度
        </Link>
        <Link to={`/setup/${session.presetId}`} className="btn-sub">
          設定を変えて再挑戦
        </Link>
        <Link to="/" className="btn-sub">ホームへ</Link>
      </section>
    </div>
  );
}

function ScoreBox({ icon, label, value, accent, testid }: { icon: string; label: string; value: number; accent: string; testid?: string }) {
  return (
    <div className="card p-3 text-center" data-testid={testid}>
      <div className="text-lg">{icon}</div>
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}

function RadarChart({ pitch, timing, duration }: { pitch: number; timing: number; duration: number }) {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  const pt = (i: number, v: number) => {
    const rr = (v / 100) * r;
    return [cx + Math.cos(ang(i)) * rr, cy + Math.sin(ang(i)) * rr];
  };
  const ptOuter = (i: number) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const points = [pt(0, pitch), pt(1, timing), pt(2, duration)];
  const polyStr = points.map((p) => p.join(',')).join(' ');
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
      <polygon points={[ptOuter(0), ptOuter(1), ptOuter(2)].map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--c-line)" strokeWidth="2" />
      <polygon points={polyStr} fill="rgba(255,79,154,0.35)" stroke="#ff4f9a" strokeWidth="3" strokeLinejoin="round" />
      <text x={100} y={20} textAnchor="middle" fill="var(--c-muted)" fontSize={12} fontWeight="bold">音程</text>
      <text x={185} y={170} textAnchor="end" fill="var(--c-muted)" fontSize={12} fontWeight="bold">タイミング</text>
      <text x={15} y={170} textAnchor="start" fill="var(--c-muted)" fontSize={12} fontWeight="bold">音価</text>
    </svg>
  );
}
