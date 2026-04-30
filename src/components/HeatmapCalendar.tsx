import type { DailyAgg } from '../scoring/statistics';

interface Props {
  daily: Map<string, DailyAgg>;
  metric: 'time' | 'score';
  days?: number;
}

export default function HeatmapCalendar({ daily, metric, days = 365 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  // align to Sunday at start
  start.setDate(start.getDate() - start.getDay());
  const cells: { date: string; value: number; inRange: boolean }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    const agg = daily.get(key);
    const value = agg ? (metric === 'time' ? agg.totalSeconds / 60 : agg.avgScore) : 0;
    cells.push({ date: key, value, inRange: true });
    cursor.setDate(cursor.getDate() + 1);
  }
  // Group into weeks (columns)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const max = Math.max(1, ...cells.map((c) => c.value));
  const colorOf = (v: number) => {
    if (v <= 0) return 'bg-slate-700';
    const t = v / max;
    if (t < 0.25) return 'bg-emerald-900';
    if (t < 0.5) return 'bg-emerald-700';
    if (t < 0.75) return 'bg-emerald-500';
    return 'bg-emerald-300';
  };

  return (
    <div className="overflow-x-auto" data-testid="heatmap">
      <div className="flex gap-[2px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map((c) => (
              <div
                key={c.date}
                title={`${c.date}: ${metric === 'time' ? `${c.value.toFixed(1)} 分` : `平均 ${c.value.toFixed(1)} 点`}`}
                className={`w-3 h-3 rounded-sm ${colorOf(c.value)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
