import { useLayoutEffect, useRef, useState } from 'react';
import type { NoteEvent } from '../types';
import { concertToWritten } from '../music/transposition';
import type { Transposition } from '../types';
import { StaffLines, TrebleClef, StaffNoteGlyph, StaffRestGlyph, STAFF_HEIGHT } from './StaffBits';

interface Props {
  notes: NoteEvent[];
  bpm: number;
  elapsedMs: number;
  transposition: Transposition;
  perNoteStatus?: Record<number, 'good' | 'warn' | 'bad' | undefined>;
  liveCents?: number | null;
}

const PX_PER_BEAT = 80;

const STATUS_COLORS: Record<string, { head: string; bar: string }> = {
  good: { head: 'bg-pop-teal border-pop-teal', bar: 'bg-pop-teal/40' },
  warn: { head: 'bg-pop-yellow border-pop-yellow', bar: 'bg-pop-yellow/40' },
  bad: { head: 'bg-pop-rose border-pop-rose', bar: 'bg-pop-rose/40' },
  pending: { head: 'bg-pop-violet border-pop-violet', bar: 'bg-pop-violet/30' },
};

export default function ScoreScroller({ notes, bpm, elapsedMs, transposition, perNoteStatus, liveCents }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beatsElapsed = (elapsedMs / 1000) * (bpm / 60);
  // The now-line sits at 50% of the container; notes must be offset by the
  // same amount so beat 0 is exactly under the line at elapsedMs=0.
  const [playheadX, setPlayheadX] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setPlayheadX(el.clientWidth / 2);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalBeats = notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0);
  const widthPx = totalBeats * PX_PER_BEAT + 800;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden bg-surface2 rounded-2xl border-2 border-line shadow-card"
      style={{ height: STAFF_HEIGHT }}
      data-testid="score-scroller"
    >
      {/* Center line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-pop-pink to-pop-orange z-10" style={{ left: '50%' }} />
      <StaffLines />
      <TrebleClef />
      {/* Notes */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: widthPx,
          transform: `translateX(${-(beatsElapsed * PX_PER_BEAT) + playheadX}px)`,
          willChange: 'transform',
        }}
      >
        {notes.map((n, idx) => {
          const x = n.startBeat * PX_PER_BEAT;
          const w = n.durationBeats * PX_PER_BEAT - 4;
          const status = perNoteStatus?.[idx];
          const colors = STATUS_COLORS[status ?? 'pending'];
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0"
              style={{ left: x, width: w }}
              data-testid={`note-${idx}`}
              data-status={status ?? 'pending'}
            >
              {n.isRest ? (
                <StaffRestGlyph x={0} width={w} durationBeats={n.durationBeats} />
              ) : (
                <StaffNoteGlyph
                  written={concertToWritten(n.pitch, transposition)}
                  x={0}
                  width={w}
                  headClass={colors.head}
                  barClass={colors.bar}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Live cents indicator */}
      {liveCents != null && (
        <div
          className="absolute z-20 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-surface text-xs font-bold border-2 border-line"
          style={{ top: 4 }}
        >
          {liveCents > 0 ? '↑' : '↓'} {Math.abs(liveCents).toFixed(1)}¢
        </div>
      )}
    </div>
  );
}
