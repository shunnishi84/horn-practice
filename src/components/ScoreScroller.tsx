import { useEffect, useRef } from 'react';
import type { NoteEvent } from '../types';
import { concertToWritten } from '../music/transposition';
import type { Transposition } from '../types';

interface Props {
  notes: NoteEvent[];
  bpm: number;
  elapsedMs: number;
  transposition: Transposition;
  perNoteStatus?: Record<number, 'good' | 'warn' | 'bad' | undefined>;
  liveCents?: number | null;
}

const PX_PER_BEAT = 80;
const STAFF_H = 180;

export default function ScoreScroller({ notes, bpm, elapsedMs, transposition, perNoteStatus, liveCents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beatsElapsed = (elapsedMs / 1000) * (bpm / 60);

  useEffect(() => {
    if (containerRef.current) {
      // No-op; render via transform
    }
  }, [elapsedMs]);

  const totalBeats = notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0);
  const widthPx = totalBeats * PX_PER_BEAT + 800;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-slate-950 rounded-lg border border-slate-700"
      style={{ height: STAFF_H }}
      data-testid="score-scroller"
    >
      {/* Center line */}
      <div className="absolute top-0 bottom-0 w-px bg-rose-500 z-10" style={{ left: '50%' }} />
      {/* Staff lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px bg-slate-600"
            style={{ top: `${40 + i * 20}px` }}
          />
        ))}
      </div>
      {/* Notes */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: widthPx,
          transform: `translateX(${-(beatsElapsed * PX_PER_BEAT) + 200}px)`,
          willChange: 'transform',
        }}
      >
        {notes.map((n, idx) => {
          const x = n.startBeat * PX_PER_BEAT;
          const w = n.durationBeats * PX_PER_BEAT - 4;
          const status = perNoteStatus?.[idx];
          const color =
            status === 'good'
              ? 'bg-emerald-500/70 border-emerald-300'
              : status === 'warn'
                ? 'bg-yellow-400/70 border-yellow-200'
                : status === 'bad'
                  ? 'bg-rose-500/70 border-rose-300'
                  : 'bg-slate-600/70 border-slate-300';
          const written = n.isRest ? '—' : concertToWritten(n.pitch, transposition);
          return (
            <div
              key={idx}
              className={`absolute rounded border-2 ${color} flex items-center justify-center text-sm font-mono text-white`}
              style={{ left: x, width: w, top: 70, height: 40 }}
              data-testid={`note-${idx}`}
              data-status={status ?? 'pending'}
            >
              {written}
            </div>
          );
        })}
      </div>
      {/* Live cents indicator */}
      {liveCents != null && (
        <div
          className="absolute z-20 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-800/80 text-xs text-slate-100 border border-slate-600"
          style={{ top: 4 }}
        >
          {liveCents > 0 ? '↑' : '↓'} {Math.abs(liveCents).toFixed(1)}¢
        </div>
      )}
    </div>
  );
}
