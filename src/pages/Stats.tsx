import { useMemo, useState } from 'react';
import { useAppStore } from '../store/store';
import HeatmapCalendar from '../components/HeatmapCalendar';
import NoteHeatmap from '../components/NoteHeatmap';
import { aggregateDaily, buildStatistics, computeStreak } from '../scoring/statistics';

export default function Stats() {
  const sessions = useAppStore((s) => s.sessions);
  const [calMetric, setCalMetric] = useState<'time' | 'score'>('time');
  const [periodDays, setPeriodDays] = useState<number | undefined>(undefined);
  const [octaveFilter, setOctaveFilter] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const [dirFilter, setDirFilter] = useState<'all' | 'ascending' | 'descending' | 'static'>('all');

  const daily = useMemo(() => aggregateDaily(sessions), [sessions]);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const stats = useMemo(() => buildStatistics(sessions, periodDays), [sessions, periodDays]);

  // Weekly bars
  const weekly = useMemo(() => {
    const weeks: { label: string; mins: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() - 7 * 7);
    const cursor = new Date(start);
    while (cursor <= today) {
      let mins = 0;
      for (let i = 0; i < 7; i++) {
        const k = cursor.toISOString().slice(0, 10);
        mins += (daily.get(k)?.totalSeconds ?? 0) / 60;
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push({ label: `${cursor.getMonth() + 1}/${cursor.getDate()}`, mins });
    }
    return weeks;
  }, [daily]);

  return (
    <div className="space-y-8" data-testid="stats-page">
      <section>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">活動カレンダー</h1>
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => setCalMetric('time')}
              className={`px-2 py-1 rounded ${calMetric === 'time' ? 'bg-sky-600' : 'bg-slate-700'}`}
            >練習時間</button>
            <button
              onClick={() => setCalMetric('score')}
              className={`px-2 py-1 rounded ${calMetric === 'score' ? 'bg-sky-600' : 'bg-slate-700'}`}
            >平均スコア</button>
          </div>
        </div>
        <div className="text-sm text-slate-400 mt-1">現在のストリーク {streak.current} 日 / 最長 {streak.longest} 日</div>
        <div className="mt-3"><HeatmapCalendar daily={daily} metric={calMetric} days={365} /></div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">週ごとの練習時間</h2>
        <div className="flex items-end gap-1 h-32" data-testid="weekly-bars">
          {weekly.map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-sky-500 rounded-t"
                style={{ height: `${Math.min(100, w.mins * 4)}%` }}
                title={`${w.mins.toFixed(1)} 分`}
              />
              <div className="text-[10px] text-slate-400">{w.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold">苦手音分析</h2>
          <div className="flex gap-2 text-sm flex-wrap">
            <select className="bg-slate-800 px-2 py-1 rounded" value={periodDays ?? 'all'} onChange={(e) => setPeriodDays(e.target.value === 'all' ? undefined : parseInt(e.target.value))}>
              <option value="all">全期間</option>
              <option value="7">直近7日</option>
              <option value="30">直近30日</option>
            </select>
            <select className="bg-slate-800 px-2 py-1 rounded" value={octaveFilter} onChange={(e) => setOctaveFilter(e.target.value as any)}>
              <option value="all">全音域</option>
              <option value="low">低音域</option>
              <option value="mid">中音域</option>
              <option value="high">高音域</option>
            </select>
            <select className="bg-slate-800 px-2 py-1 rounded" value={dirFilter} onChange={(e) => setDirFilter(e.target.value as any)}>
              <option value="all">全進行方向</option>
              <option value="ascending">上行</option>
              <option value="descending">下行</option>
              <option value="static">静止</option>
            </select>
          </div>
        </div>
        <div className="mt-3"><NoteHeatmap stats={stats} octaveFilter={octaveFilter} directionFilter={dirFilter} /></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm" data-testid="stats-table">
            <thead className="text-slate-400">
              <tr>
                <th className="px-2 py-1 text-left">音名</th>
                <th className="px-2 py-1">オクターブ</th>
                <th className="px-2 py-1">方向</th>
                <th className="px-2 py-1">サンプル</th>
                <th className="px-2 py-1">平均スコア</th>
                <th className="px-2 py-1">平均ズレ</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .filter((s) => octaveFilter === 'all'
                  || (octaveFilter === 'low' && s.octave <= 3)
                  || (octaveFilter === 'mid' && s.octave >= 4 && s.octave <= 5)
                  || (octaveFilter === 'high' && s.octave >= 6))
                .filter((s) => dirFilter === 'all' || s.direction === dirFilter)
                .sort((a, b) => a.avgPitchScore - b.avgPitchScore)
                .map((s, i) => (
                  <tr key={i} className="border-t border-slate-700">
                    <td className="px-2 py-1 font-mono">{s.pitchClass}</td>
                    <td className="px-2 py-1 text-center">{s.octave}</td>
                    <td className="px-2 py-1 text-center">{s.direction === 'ascending' ? '上行' : s.direction === 'descending' ? '下行' : '静止'}</td>
                    <td className="px-2 py-1 text-center">{s.sampleCount}</td>
                    <td className="px-2 py-1 text-center">{Math.round(s.avgPitchScore)}</td>
                    <td className="px-2 py-1 text-center">{s.avgPitchDeviationCents > 0 ? '+' : ''}{s.avgPitchDeviationCents.toFixed(1)}¢</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
