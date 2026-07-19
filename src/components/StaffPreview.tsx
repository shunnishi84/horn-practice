import type { NoteEvent, Transposition } from '../types';
import { concertToWritten } from '../music/transposition';
import { StaffLines, TrebleClef, TimeSignatureGlyph, StaffNoteGlyph, StaffRestGlyph, STAFF_HEIGHT } from './StaffBits';

interface Props {
  notes: NoteEvent[];
  transposition: Transposition;
  timeSignature: { numerator: number; denominator: number };
}

const NOTE_DX = 44;
const FIRST_X = 112; // leave room for the clef and time signature

export default function StaffPreview({ notes, transposition, timeSignature }: Props) {
  const width = FIRST_X + notes.length * NOTE_DX + 16;
  return (
    <div className="relative" style={{ height: STAFF_HEIGHT, minWidth: width }}>
      <StaffLines />
      <TrebleClef />
      <TimeSignatureGlyph numerator={timeSignature.numerator} denominator={timeSignature.denominator} />
      {notes.map((n, i) => {
        const x = FIRST_X + i * NOTE_DX;
        return n.isRest ? (
          <StaffRestGlyph key={i} x={x - NOTE_DX / 2 + 8} width={NOTE_DX} durationBeats={n.durationBeats} />
        ) : (
          <StaffNoteGlyph key={i} written={concertToWritten(n.pitch, transposition)} x={x} />
        );
      })}
    </div>
  );
}
