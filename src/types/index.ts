export type InstrumentKey =
  | 'soprano_sax'
  | 'alto_sax'
  | 'tenor_sax'
  | 'baritone_sax'
  | 'trumpet'
  | 'horn'
  | 'flute'
  | 'clarinet'
  | 'trombone'
  | 'tuba';

export type Transposition = 'C' | 'Bb' | 'Eb' | 'F';

export interface InstrumentProfile {
  key: InstrumentKey;
  displayName: string;
  defaultTransposition: Transposition;
  range: { lowest: string; highest: string };
}

export type PresetCategory =
  | 'long_tone'
  | 'scale'
  | 'arpeggio'
  | 'interval'
  | 'tonguing';

export interface NoteEvent {
  pitch: string;
  startBeat: number;
  durationBeats: number;
  isRest: boolean;
}

export interface Preset {
  id: string;
  category: PresetCategory;
  title: string;
  description?: string;
  notes: NoteEvent[];
  defaultBpm: number;
  timeSignature: { numerator: number; denominator: number };
  scoreData?: string;
}

export interface Settings {
  instrument: InstrumentKey;
  transposition: Transposition;
  tuningHz: number;
  pitchToleranceCents: number;
  timingToleranceMs: number;
  durationToleranceRatio: number;
  countdownSeconds: 3;
  metronomeOn: boolean;
  inputDeviceId?: string;
  theme: 'dark' | 'light';
}

export interface NoteResult {
  noteIndex: number;
  expectedPitch: string;
  detectedPitchHz?: number;
  pitchDeviationCents?: number;
  onsetDeviationMs?: number;
  offsetDeviationMs?: number;
  durationRatio?: number;
  pitchScore: number;
  timingScore: number;
  durationScore: number;
  totalScore: number;
}

export interface Session {
  id: string;
  presetId: string;
  presetTitle: string;
  instrument: InstrumentKey;
  transposition: Transposition;
  tuningHz: number;
  bpm: number;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  totalScore: number;
  pitchScore: number;
  timingScore: number;
  durationScore: number;
  noteResults: NoteResult[];
}

export interface NoteStatistics {
  pitchClass: string;
  octave: number;
  direction?: 'ascending' | 'descending' | 'static';
  sampleCount: number;
  avgPitchDeviationCents: number;
  avgPitchScore: number;
  avgTimingScore: number;
  avgDurationScore: number;
}
