import { Link } from 'react-router-dom';
import { useAppStore } from '../store/store';
import { aggregateDaily, computeStreak } from '../scoring/statistics';
import HeatmapCalendar from '../components/HeatmapCalendar';

export default function Home() {
  const sessions = useAppStore((s) => s.sessions);
  const today = new Date().toISOString().slice(0, 10);
  const todays = sessions.filter((s) => s.startedAt.startsWith(today));
  const todaySeconds = todays.reduce((a, s) => a + s.durationSec, 0);
  const todayAvg = todays.length ? Math.round(todays.reduce((a, s) => a + s.totalScore, 0) / todays.length) : 0;
  const streak = computeStreak(sessions);
  const daily = aggregateDaily(sessions);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-extrabold mb-3">☀️ 今日のサマリー</h1>
        <div className="grid grid-cols-3 gap-3">
          <Stat icon="⏱️" label="練習時間" value={`${Math.round(todaySeconds / 60)} 分`} accent="text-pop-sky" testid="today-minutes" />
          <Stat icon="💯" label="平均スコア" value={todays.length ? `${todayAvg}` : '—'} accent="text-pop-orange" testid="today-score" />
          <Stat icon="🔥" label="ストリーク" value={`${streak.current} 日`} accent="text-pop-pink" testid="streak-days" />
        </div>
      </section>

      <section className="flex gap-3">
        <Link to="/presets" className="btn-pop text-lg" data-testid="start-practice">
          🎺 練習を始める
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-extrabold mb-3">🎵 直近セッション</h2>
        {sessions.length === 0 ? (
          <div className="card p-6 text-center text-muted font-bold" data-testid="no-sessions">
            まだセッションがありません<br />
            <span className="text-2xl">🎷 さっそく1曲吹いてみよう！</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="card flex items-center justify-between gap-3 p-4 text-sm transition hover:-translate-y-0.5 hover:border-pop-pink">
                <Link to={`/result/${s.id}`} className="font-bold hover:text-pop-pink">
                  {s.presetTitle}
                </Link>
                <span className="text-muted">{new Date(s.startedAt).toLocaleString('ja-JP')}</span>
                <span className="font-extrabold text-lg text-pop-violet">{s.totalScore}<span className="text-xs text-muted">点</span></span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-extrabold mb-3">🗓️ 活動カレンダー</h2>
        <div className="card p-4">
          <HeatmapCalendar daily={daily} metric="time" days={120} />
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, accent, testid }: { icon: string; label: string; value: string; accent: string; testid?: string }) {
  return (
    <div className="card p-4 text-center" data-testid={testid}>
      <div className="text-xl">{icon}</div>
      <div className="text-xs font-bold text-muted mt-1">{label}</div>
      <div className={`text-2xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}
