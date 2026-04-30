import type { Preset, NoteEvent } from '../types';
import { midiFromNote, noteFromMidi } from './noteUtils';

function buildSeq(notes: string[], beatsPerNote = 1): NoteEvent[] {
  return notes.map((p, i) => ({
    pitch: p,
    startBeat: i * beatsPerNote,
    durationBeats: beatsPerNote,
    isRest: false,
  }));
}

function scale(rootMidi: number, intervals: number[], octaves = 1): string[] {
  const out: string[] = [];
  let base = rootMidi;
  for (let o = 0; o < octaves; o++) {
    for (const semi of intervals) out.push(noteFromMidi(base + semi));
    base += 12;
  }
  out.push(noteFromMidi(rootMidi + 12 * octaves));
  // descending
  const desc = [...out].reverse().slice(1);
  return [...out, ...desc];
}

const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];
const HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
const MELODIC_MINOR_UP = [0, 2, 3, 5, 7, 9, 11];
const CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function makeMajorScale(rootNote: string, id: string): Preset {
  const root = midiFromNote(rootNote);
  return {
    id,
    category: 'scale',
    title: `${rootNote.replace(/\d/, '')} メジャースケール`,
    notes: buildSeq(scale(root, MAJOR_INTERVALS, 1), 1),
    defaultBpm: 80,
    timeSignature: { numerator: 4, denominator: 4 },
  };
}

function makeMinorScale(rootNote: string, type: 'natural' | 'harmonic' | 'melodic', id: string): Preset {
  const intervals = type === 'natural' ? NATURAL_MINOR : type === 'harmonic' ? HARMONIC_MINOR : MELODIC_MINOR_UP;
  const root = midiFromNote(rootNote);
  return {
    id,
    category: 'scale',
    title: `${rootNote.replace(/\d/, '')} ${type === 'natural' ? '自然短音階' : type === 'harmonic' ? '和声短音階' : '旋律短音階'}`,
    notes: buildSeq(scale(root, intervals, 1), 1),
    defaultBpm: 80,
    timeSignature: { numerator: 4, denominator: 4 },
  };
}

function makeArpeggio(rootNote: string, qualities: number[], id: string, label: string): Preset {
  const root = midiFromNote(rootNote);
  const up = qualities.map((s) => noteFromMidi(root + s));
  up.push(noteFromMidi(root + 12));
  const down = [...up].reverse().slice(1);
  return {
    id,
    category: 'arpeggio',
    title: `${rootNote.replace(/\d/, '')} ${label}`,
    notes: buildSeq([...up, ...down], 1),
    defaultBpm: 80,
    timeSignature: { numerator: 4, denominator: 4 },
  };
}

const longTone: Preset = {
  id: 'lt-halfstep',
  category: 'long_tone',
  title: '半音階ロングトーン (C4-C5)',
  description: '全音符でゆっくりロングトーン',
  notes: buildSeq(
    [...Array(13)].map((_, i) => noteFromMidi(midiFromNote('C4') + i)),
    4,
  ),
  defaultBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
};

const longToneCresc: Preset = {
  id: 'lt-cresc',
  category: 'long_tone',
  title: 'ロングトーン C メジャー (クレッシェンド付き)',
  notes: buildSeq(['C4', 'D4', 'E4', 'F4', 'G4'], 4),
  defaultBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
};

const chromatic: Preset = {
  id: 'sc-chromatic',
  category: 'scale',
  title: '半音階 (C4-C5)',
  notes: buildSeq(scale(midiFromNote('C4'), CHROMATIC, 1), 0.5),
  defaultBpm: 90,
  timeSignature: { numerator: 4, denominator: 4 },
};

const intervals3rd: Preset = {
  id: 'iv-3rd',
  category: 'interval',
  title: '3度のインターバル (Cメジャー)',
  notes: buildSeq(
    ['C4', 'E4', 'D4', 'F4', 'E4', 'G4', 'F4', 'A4', 'G4', 'B4', 'A4', 'C5', 'B4', 'D5', 'C5'],
    1,
  ),
  defaultBpm: 90,
  timeSignature: { numerator: 4, denominator: 4 },
};

const intervals5th: Preset = {
  id: 'iv-5th',
  category: 'interval',
  title: '5度のインターバル',
  notes: buildSeq(['C4', 'G4', 'D4', 'A4', 'E4', 'B4', 'F4', 'C5', 'G4', 'D5'], 1),
  defaultBpm: 90,
  timeSignature: { numerator: 4, denominator: 4 },
};

const tonguingQuarter: Preset = {
  id: 'tg-quarter',
  category: 'tonguing',
  title: '4分音符同音連打 (G4)',
  notes: buildSeq(Array.from({ length: 16 }, () => 'G4'), 1),
  defaultBpm: 100,
  timeSignature: { numerator: 4, denominator: 4 },
};

const tonguingEighth: Preset = {
  id: 'tg-eighth',
  category: 'tonguing',
  title: '8分音符同音連打 (G4)',
  notes: buildSeq(Array.from({ length: 16 }, () => 'G4'), 0.5),
  defaultBpm: 100,
  timeSignature: { numerator: 4, denominator: 4 },
};

export const PRESETS: Preset[] = [
  longTone,
  longToneCresc,
  makeMajorScale('C4', 'sc-c-major'),
  makeMajorScale('F4', 'sc-f-major'),
  makeMajorScale('G4', 'sc-g-major'),
  makeMajorScale('Bb3', 'sc-bb-major'),
  makeMajorScale('Eb4', 'sc-eb-major'),
  makeMinorScale('A3', 'natural', 'sc-a-natural-minor'),
  makeMinorScale('A3', 'harmonic', 'sc-a-harmonic-minor'),
  makeMinorScale('A3', 'melodic', 'sc-a-melodic-minor'),
  chromatic,
  makeArpeggio('C4', [0, 4, 7], 'arp-c-maj', 'メジャー三和音'),
  makeArpeggio('A3', [0, 3, 7], 'arp-a-min', 'マイナー三和音'),
  makeArpeggio('C4', [0, 4, 7, 10], 'arp-c-7', 'ドミナント7thコード'),
  makeArpeggio('C4', [0, 4, 7, 11], 'arp-c-maj7', 'メジャー7thコード'),
  intervals3rd,
  intervals5th,
  tonguingQuarter,
  tonguingEighth,
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
