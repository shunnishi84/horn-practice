import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../store/store';

export default function Result() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessions = useAppStore((s) => s.sessions);
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <div data-testid="result-not-found">
        <p>結果が見つかりません</p>
        <Link to="/" className="text-sky-400 underline">ホームへ</Link>
      </div>
    );
  }

  const weakest = [...session.noteResults]
    .filter((r) => r.expectedPitch !== 'rest')
    .sort((a, b) => a.totalScore - b.totalScore)
    .slice(0, 3);

  return (
    <div className="space-y-6" data-testid="result-page">
      <section>
        <div className="text-center">
          <div className="text-sm text-slate-400">総合スコア</div>
          <div className="text-7xl font-bold text-sky-400" data-testid="total-score">{session.totalScore}</div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <ScoreBox label="音程" value={session.pitchScore} testid="score-pitch" />
        <ScoreBox label="タイミング" value={session.timingScore} testid="score-timing" />
        <ScoreBox label="音価" value={session.durationScore} testid="score-duration" />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">3軸の比較</h2>
        <RadarChart pitch={session.pitchScore} timing={session.timingScore} duration={session.durationScore} />
      </section>

      {weakest.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">苦手だった音</h2>
          <ul className="flex gap-2 flex-wrap" data-testid="weakest">
            {weakest.map((r) => (
              <li key={r.noteIndex} className="bg-rose-900/40 border border-rose-700 px-3 py-1 rounded text-sm">
                {r.expectedPitch}: {r.totalScore}点
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">ノート別結果</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="note-table">
            <thead className="text-slate-400">
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
                <tr key={r.noteIndex} className="border-t border-slate-700">
                  <td className="px-2 py-1">{r.noteIndex + 1}</td>
                  <td className="px-2 py-1 font-mono">{r.expectedPitch}</td>
                  <td className="px-2 py-1 text-center">{r.pitchScore}</td>
                  <td className="px-2 py-1 text-center">{r.timingScore}</td>
                  <td className="px-2 py-1 text-center">{r.durationScore}</td>
                  <td className="px-2 py-1 text-center font-bold">{r.totalScore}</td>
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
        <Link
          to={`/practice/${session.presetId}?bpm=${session.bpm}`}
          className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded font-bold"
          data-testid="retry"
        >
          もう一度
        </Link>
        <Link
          to={`/setup/${session.presetId}`}
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded"
        >
          設定を変えて再挑戦
        </Link>
        <Link to="/" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded">ホームへ</Link>
      </section>
    </div>
  );
}

function ScoreBox({ label, value, testid }: { label: string; value: number; testid?: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 text-center" data-testid={testid}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-3xl font-bold">{value}</div>
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
      <polygon points={[ptOuter(0), ptOuter(1), ptOuter(2)].map((p) => p.join(',')).join(' ')} fill="none" stroke="#334155" />
      <polygon points={polyStr} fill="rgba(56,189,248,0.4)" stroke="#38bdf8" strokeWidth="2" />
      <text x={100} y={20} textAnchor="middle" fill="#cbd5e1" fontSize={12}>音程</text>
      <text x={185} y={170} textAnchor="end" fill="#cbd5e1" fontSize={12}>タイミング</text>
      <text x={15} y={170} textAnchor="start" fill="#cbd5e1" fontSize={12}>音価</text>
    </svg>
  );
}
