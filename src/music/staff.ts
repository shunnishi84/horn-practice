import { parseNoteName } from './noteUtils';

const LETTER_STEP: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

// Diatonic steps above E4, the bottom line of the treble staff.
// One step is half the gap between adjacent staff lines.
export function trebleSteps(note: string): number {
  const { pitchClass, octave } = parseNoteName(note);
  return (octave - 4) * 7 + LETTER_STEP[pitchClass[0]] - LETTER_STEP.E;
}

export function accidentalOf(note: string): string | null {
  const pc = parseNoteName(note).pitchClass;
  if (pc.includes('#')) return '♯';
  if (pc.length > 1 && pc.endsWith('b')) return '♭';
  return null;
}

// Even steps outside the staff (0..8) where ledger lines are needed
// to reach the given note step.
export function ledgerSteps(step: number): number[] {
  const lines: number[] = [];
  for (let s = -2; s >= step; s -= 2) lines.push(s);
  for (let s = 10; s <= step; s += 2) lines.push(s);
  return lines;
}

// Rest glyph by duration: whole (4+ beats), half (2+), otherwise quarter.
export function restGlyph(durationBeats: number): string {
  if (durationBeats >= 4) return '𝄻';
  if (durationBeats >= 2) return '𝄼';
  return '𝄽';
}
