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
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold mb-2">今日のサマリー</h1>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="練習時間" value={`${Math.round(todaySeconds / 60)} 分`} testid="today-minutes" />
          <Stat label="平均スコア" value={todays.length ? `${todayAvg}` : '—'} testid="today-score" />
          <Stat label="ストリーク" value={`${streak.current} 日`} testid="streak-days" />
        </div>
      </section>

      <section className="flex gap-3">
        <Link
          to="/presets"
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-6 rounded-lg"
          data-testid="start-practice"
        >
          練習を始める
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">直近セッション</h2>
        {sessions.length === 0 ? (
          <div className="text-slate-400 text-sm" data-testid="no-sessions">まだセッションがありません</div>
        ) : (
          <ul className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <li key={s.id} className="flex justify-between bg-slate-800 rounded p-3 text-sm">
                <Link to={`/result/${s.id}`} className="hover:underline">
                  {s.presetTitle}
                </Link>
                <span className="text-slate-400">{new Date(s.startedAt).toLocaleString('ja-JP')}</span>
                <span className="font-bold">{s.totalScore}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">活動カレンダー</h2>
        <HeatmapCalendar daily={daily} metric="time" days={120} />
      </section>
    </div>
  );
}

function Stat({ label, value, testid }: { label: string; value: string; testid?: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center" data-testid={testid}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
