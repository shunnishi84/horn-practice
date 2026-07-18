export interface Env {
  DB: D1Database;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGIN: string;
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
  instrument: string;
  transposition: string;
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

export interface Settings {
  instrument: string;
  transposition: string;
  tuningHz: number;
  pitchToleranceCents: number;
  timingToleranceMs: number;
  durationToleranceRatio: number;
  metronomeOn: boolean;
  inputDeviceId?: string;
  theme: 'dark' | 'light';
}
