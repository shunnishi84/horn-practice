import { trebleSteps, accidentalOf, ledgerSteps, restGlyph } from '../music/staff';

// Shared treble-staff geometry: 5 lines, 20px apart, top line (F5) at y=40.
export const STAFF_TOP = 40;
export const LINE_GAP = 20;
export const STAFF_BOTTOM = STAFF_TOP + LINE_GAP * 4; // E4 line
export const STAFF_HEIGHT = 180;

export const yOfStep = (step: number) => STAFF_BOTTOM - step * (LINE_GAP / 2);

export function StaffLines() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute left-0 right-0 bg-muted opacity-60"
          style={{ top: `${STAFF_TOP + i * LINE_GAP}px`, height: 1.5 }}
        />
      ))}
    </div>
  );
}

export function TrebleClef({ left = 8 }: { left?: number }) {
  return (
    <div
      className="absolute font-music select-none pointer-events-none z-10"
      style={{ left, top: STAFF_TOP - 26, fontSize: 112, lineHeight: 1 }}
      aria-hidden
    >
      𝄞
    </div>
  );
}

interface NoteGlyphProps {
  written: string; // written pitch, e.g. "F#4"
  x: number;
  width?: number; // duration bar width; omit to draw the head only
  headClass?: string;
  barClass?: string;
}

export function StaffNoteGlyph({ written, x, width, headClass = 'bg-pop-violet border-pop-violet', barClass = 'bg-pop-violet/30' }: NoteGlyphProps) {
  const step = trebleSteps(written);
  const y = yOfStep(step);
  const acc = accidentalOf(written);
  return (
    <div className="absolute top-0 bottom-0" style={{ left: x }}>
      {width != null && (
        <div className={`absolute rounded-full ${barClass}`} style={{ left: 8, width: width - 8, top: y - 5, height: 10 }} />
      )}
      {ledgerSteps(step).map((s) => (
        <div key={s} className="absolute bg-muted" style={{ left: -6, width: 30, height: 2, top: yOfStep(s) - 1 }} />
      ))}
      {acc && (
        <div className="absolute font-bold" style={{ left: -15, top: y - 11, fontSize: 18, lineHeight: 1 }}>
          {acc}
        </div>
      )}
      <div
        className={`absolute border-2 ${headClass}`}
        style={{ left: 0, top: y - 7, width: 18, height: 14, borderRadius: '50%', transform: 'rotate(-18deg)' }}
      />
    </div>
  );
}

export function StaffRestGlyph({ x, width, durationBeats }: { x: number; width: number; durationBeats: number }) {
  return (
    <div
      className="absolute font-music text-muted select-none"
      style={{ left: x + width / 2 - 10, top: STAFF_TOP + LINE_GAP - 2, fontSize: 42, lineHeight: 1 }}
    >
      {restGlyph(durationBeats)}
    </div>
  );
}
