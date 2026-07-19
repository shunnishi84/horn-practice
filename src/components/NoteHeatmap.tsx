import type { NoteStatistics } from '../types';

interface Props {
  stats: NoteStatistics[];
  octaveFilter?: 'low' | 'mid' | 'high' | 'all';
  directionFilter?: 'ascending' | 'descending' | 'static' | 'all';
}

const PITCH_CLASSES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function NoteHeatmap({ stats, octaveFilter = 'all', directionFilter = 'all' }: Props) {
  const filtered = stats.filter((s) => {
    if (octaveFilter !== 'all') {
      if (octaveFilter === 'low' && s.octave > 3) return false;
      if (octaveFilter === 'mid' && (s.octave < 4 || s.octave > 5)) return false;
      if (octaveFilter === 'high' && s.octave < 6) return false;
    }
    if (directionFilter !== 'all' && s.direction !== directionFilter) return false;
    return true;
  });

  // Aggregate by pitch class
  const byPc = new Map<string, { score: number; dev: number; n: number }>();
  for (const s of filtered) {
    // Normalize sharps/flats roughly
    const pc = s.pitchClass.replace('Db', 'C#').replace('Gb', 'F#').replace('Ab', 'G#').replace('A#', 'Bb');
    const key = PITCH_CLASSES.includes(pc) ? pc : s.pitchClass;
    const cur = byPc.get(key) ?? { score: 0, dev: 0, n: 0 };
    cur.score += s.avgPitchScore * s.sampleCount;
    cur.dev += s.avgPitchDeviationCents * s.sampleCount;
    cur.n += s.sampleCount;
    byPc.set(key, cur);
  }

  const colorOf = (score: number, n: number) => {
    if (n === 0) return 'bg-surface2 border-line text-muted';
    if (score >= 90) return 'bg-pop-teal border-pop-teal text-white';
    if (score >= 75) return 'bg-pop-yellow border-pop-yellow text-yellow-950';
    if (score >= 50) return 'bg-pop-orange border-pop-orange text-white';
    return 'bg-pop-rose border-pop-rose text-white';
  };

  return (
    <div className="grid grid-cols-6 sm:grid-cols-12 gap-2" data-testid="note-heatmap">
      {PITCH_CLASSES.map((pc) => {
        const v = byPc.get(pc) ?? { score: 0, dev: 0, n: 0 };
        const avgScore = v.n ? Math.round(v.score / v.n) : 0;
        const avgDev = v.n ? Math.round(v.dev / v.n) : 0;
        return (
          <div
            key={pc}
            className={`rounded-xl border-2 p-2 text-center ${colorOf(avgScore, v.n)}`}
            title={v.n ? `${pc}: 平均 ${avgScore}点 / ズレ ${avgDev}¢` : `${pc}: データなし`}
          >
            <div className="font-bold">{pc}</div>
            <div className="text-xs">{v.n ? `${avgScore}点` : '—'}</div>
            <div className="text-[10px]">{v.n ? `${avgDev > 0 ? '+' : ''}${avgDev}¢` : ''}</div>
          </div>
        );
      })}
    </div>
  );
}
