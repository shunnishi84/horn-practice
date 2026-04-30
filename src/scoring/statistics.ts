import type { NoteResult, NoteStatistics, Session } from '../types';
import { noteDirection, parseNoteName } from '../music/noteUtils';

export function buildStatistics(sessions: Session[], days?: number): NoteStatistics[] {
  const cutoff = days ? Date.now() - days * 86400_000 : 0;
  const buckets = new Map<string, { sum: number; pSum: number; tSum: number; dSum: number; count: number; pitchClass: string; octave: number; direction: 'ascending' | 'descending' | 'static' }>();
  for (const s of sessions) {
    if (cutoff && new Date(s.startedAt).getTime() < cutoff) continue;
    let prev: string | undefined;
    for (const r of s.noteResults) {
      if (r.expectedPitch === 'rest') continue;
      const dir = noteDirection(prev, r.expectedPitch);
      prev = r.expectedPitch;
      const { pitchClass, octave } = parseNoteName(r.expectedPitch);
      const key = `${pitchClass}|${octave}|${dir}`;
      const b = buckets.get(key) ?? { sum: 0, pSum: 0, tSum: 0, dSum: 0, count: 0, pitchClass, octave, direction: dir };
      b.sum += r.pitchDeviationCents ?? 0;
      b.pSum += r.pitchScore;
      b.tSum += r.timingScore;
      b.dSum += r.durationScore;
      b.count++;
      buckets.set(key, b);
    }
  }
  return Array.from(buckets.values()).map((b) => ({
    pitchClass: b.pitchClass,
    octave: b.octave,
    direction: b.direction,
    sampleCount: b.count,
    avgPitchDeviationCents: b.count ? b.sum / b.count : 0,
    avgPitchScore: b.count ? b.pSum / b.count : 0,
    avgTimingScore: b.count ? b.tSum / b.count : 0,
    avgDurationScore: b.count ? b.dSum / b.count : 0,
  }));
}

export interface DailyAgg {
  date: string; // YYYY-MM-DD
  totalSeconds: number;
  avgScore: number;
  sessionCount: number;
}

export function aggregateDaily(sessions: Session[]): Map<string, DailyAgg> {
  const map = new Map<string, DailyAgg>();
  for (const s of sessions) {
    const date = s.startedAt.slice(0, 10);
    const cur = map.get(date) ?? { date, totalSeconds: 0, avgScore: 0, sessionCount: 0 };
    cur.totalSeconds += s.durationSec;
    cur.avgScore = (cur.avgScore * cur.sessionCount + s.totalScore) / (cur.sessionCount + 1);
    cur.sessionCount += 1;
    map.set(date, cur);
  }
  return map;
}

export function computeStreak(sessions: Session[]): { current: number; longest: number } {
  const days = new Set(sessions.map((s) => s.startedAt.slice(0, 10)));
  if (days.size === 0) return { current: 0, longest: 0 };
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    const diff = (cur.getTime() - prev.getTime()) / 86400_000;
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  // current streak ending today/yesterday
  const today = new Date().toISOString().slice(0, 10);
  let current = 0;
  let cursor = new Date(today);
  for (let i = 0; i < 365; i++) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // allow yesterday gap if we haven't started counting
      if (current === 0 && i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return { current, longest };
}
