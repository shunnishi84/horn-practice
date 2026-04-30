import type { Transposition } from '../types';
import { midiFromNote, noteFromMidi } from './noteUtils';

// Concert-pitch -> written-pitch semitone offset
// In Bb instruments: written sounds a major 2nd lower => to display written, transpose UP by 2
// In Eb: written sounds a major 6th lower => transpose UP by 9
// In F: written sounds a perfect 5th lower => transpose UP by 7
const OFFSETS: Record<Transposition, number> = {
  C: 0,
  Bb: 2,
  Eb: 9,
  F: 7,
};

export function concertToWritten(concertNote: string, transposition: Transposition): string {
  const midi = midiFromNote(concertNote);
  return noteFromMidi(midi + OFFSETS[transposition]);
}

export function writtenToConcert(writtenNote: string, transposition: Transposition): string {
  const midi = midiFromNote(writtenNote);
  return noteFromMidi(midi - OFFSETS[transposition]);
}
