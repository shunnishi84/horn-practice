const NOTE_TO_SEMI: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8,
  Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const SEMI_TO_NOTE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SEMI_TO_NOTE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function parseNoteName(note: string): { pitchClass: string; octave: number; semitone: number } {
  const m = note.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!m) throw new Error(`Invalid note: ${note}`);
  const pc = m[1];
  const oct = parseInt(m[2], 10);
  const semi = NOTE_TO_SEMI[pc];
  if (semi === undefined) throw new Error(`Invalid pitch class: ${pc}`);
  return { pitchClass: pc, octave: oct, semitone: semi + (oct + 1) * 12 };
}

export function midiFromNote(note: string): number {
  return parseNoteName(note).semitone;
}

export function noteFromMidi(midi: number, useFlat = false): string {
  const oct = Math.floor(midi / 12) - 1;
  const idx = ((midi % 12) + 12) % 12;
  const pc = (useFlat ? SEMI_TO_NOTE_FLAT : SEMI_TO_NOTE_SHARP)[idx];
  return `${pc}${oct}`;
}

export function noteToHz(note: string, tuningHz = 440): number {
  const midi = midiFromNote(note);
  return tuningHz * Math.pow(2, (midi - 69) / 12);
}

export function hzToMidi(hz: number, tuningHz = 440): number {
  return 69 + 12 * Math.log2(hz / tuningHz);
}

export function hzToNote(hz: number, tuningHz = 440, useFlat = false): { note: string; cents: number } {
  const m = hzToMidi(hz, tuningHz);
  const rounded = Math.round(m);
  const cents = (m - rounded) * 100;
  return { note: noteFromMidi(rounded, useFlat), cents };
}

export function centsBetween(detectedHz: number, expectedHz: number): number {
  return 1200 * Math.log2(detectedHz / expectedHz);
}

export function pitchClassOf(note: string): string {
  return parseNoteName(note).pitchClass;
}

export function octaveOf(note: string): number {
  return parseNoteName(note).octave;
}

export function noteDirection(prev: string | undefined, current: string): 'ascending' | 'descending' | 'static' {
  if (!prev) return 'static';
  const a = midiFromNote(prev);
  const b = midiFromNote(current);
  if (b > a) return 'ascending';
  if (b < a) return 'descending';
  return 'static';
}
