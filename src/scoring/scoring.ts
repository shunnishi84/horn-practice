import type { NoteEvent, NoteResult } from '../types';
import { centsBetween, midiFromNote, noteToHz } from '../music/noteUtils';

export function pitchScore(deviationCents: number, tolerance: number): number {
  const abs = Math.abs(deviationCents);
  if (abs <= tolerance) return 100;
  if (abs >= tolerance * 2) return 0;
  return Math.round(100 * (1 - (abs - tolerance) / tolerance));
}

export function timingScore(deviationMs: number, tolerance: number): number {
  const abs = Math.abs(deviationMs);
  if (abs <= tolerance) return 100;
  if (abs >= tolerance * 4) return 0;
  return Math.round(100 * (1 - (abs - tolerance) / (tolerance * 3)));
}

export function durationScore(ratio: number, tolerance: number): number {
  const dev = Math.abs(ratio - 1);
  if (dev <= tolerance) return 100;
  if (dev >= tolerance * 3) return 0;
  return Math.round(100 * (1 - (dev - tolerance) / (tolerance * 2)));
}

export interface NoteSample {
  // ms relative to expected onset
  detectedOnsetMs?: number;
  detectedOffsetMs?: number;
  // averaged Hz during stable region
  avgHz?: number;
}

export interface ScoreParams {
  pitchToleranceCents: number;
  timingToleranceMs: number;
  durationToleranceRatio: number;
  tuningHz: number;
}

export function buildNoteResult(
  noteIndex: number,
  expectedNote: NoteEvent,
  expectedDurationMs: number,
  sample: NoteSample,
  params: ScoreParams,
): NoteResult {
  if (expectedNote.isRest) {
    return {
      noteIndex,
      expectedPitch: 'rest',
      pitchScore: 100,
      timingScore: 100,
      durationScore: 100,
      totalScore: 100,
    };
  }
  const expectedHz = noteToHz(expectedNote.pitch, params.tuningHz);
  let pScore = 0;
  let pDev: number | undefined;
  if (sample.avgHz && sample.avgHz > 0) {
    pDev = centsBetween(sample.avgHz, expectedHz);
    pScore = pitchScore(pDev, params.pitchToleranceCents);
  }
  let tScore = 0;
  let tDev: number | undefined;
  if (sample.detectedOnsetMs !== undefined) {
    tDev = sample.detectedOnsetMs;
    tScore = timingScore(tDev, params.timingToleranceMs);
  }
  let dScore = 0;
  let dRatio: number | undefined;
  let offDev: number | undefined;
  if (sample.detectedOnsetMs !== undefined && sample.detectedOffsetMs !== undefined) {
    const detectedDur = sample.detectedOffsetMs - sample.detectedOnsetMs + expectedDurationMs;
    dRatio = detectedDur / expectedDurationMs;
    dScore = durationScore(dRatio, params.durationToleranceRatio);
    offDev = sample.detectedOffsetMs;
  }
  const total = Math.round((pScore + tScore + dScore) / 3);
  return {
    noteIndex,
    expectedPitch: expectedNote.pitch,
    detectedPitchHz: sample.avgHz,
    pitchDeviationCents: pDev,
    onsetDeviationMs: tDev,
    offsetDeviationMs: offDev,
    durationRatio: dRatio,
    pitchScore: pScore,
    timingScore: tScore,
    durationScore: dScore,
    totalScore: total,
  };
}

export function summarizeSession(results: NoteResult[]): {
  pitchScore: number;
  timingScore: number;
  durationScore: number;
  totalScore: number;
} {
  if (results.length === 0) return { pitchScore: 0, timingScore: 0, durationScore: 0, totalScore: 0 };
  const sum = results.reduce(
    (a, r) => ({
      p: a.p + r.pitchScore,
      t: a.t + r.timingScore,
      d: a.d + r.durationScore,
      tot: a.tot + r.totalScore,
    }),
    { p: 0, t: 0, d: 0, tot: 0 },
  );
  const n = results.length;
  return {
    pitchScore: Math.round(sum.p / n),
    timingScore: Math.round(sum.t / n),
    durationScore: Math.round(sum.d / n),
    totalScore: Math.round(sum.tot / n),
  };
}

export function noteMidiDistance(a: string, b: string): number {
  return midiFromNote(b) - midiFromNote(a);
}
