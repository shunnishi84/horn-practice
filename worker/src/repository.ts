import type { Env, Session, Settings } from './types';
import type { AuthedUser } from './auth';

export async function ensureUser(env: Env, user: AuthedUser): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO users (id, email, display_name) VALUES (?1, ?2, ?3)
     ON CONFLICT(id) DO UPDATE SET email = ?2, display_name = ?3`,
  )
    .bind(user.uid, user.email ?? null, user.displayName ?? null)
    .run();
}

export async function listSessions(env: Env, userId: string): Promise<Session[]> {
  const { results } = await env.DB.prepare(
    `SELECT * FROM sessions WHERE user_id = ?1 ORDER BY started_at DESC`,
  )
    .bind(userId)
    .all<Record<string, unknown>>();

  return results.map(rowToSession);
}

export async function insertSession(env: Env, userId: string, session: Session): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO sessions (
      id, user_id, preset_id, preset_title, instrument, transposition, tuning_hz, bpm,
      started_at, ended_at, duration_sec, total_score, pitch_score, timing_score, duration_score, note_results
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
    ON CONFLICT(id) DO NOTHING`,
  )
    .bind(
      session.id,
      userId,
      session.presetId,
      session.presetTitle,
      session.instrument,
      session.transposition,
      session.tuningHz,
      session.bpm,
      session.startedAt,
      session.endedAt,
      session.durationSec,
      session.totalScore,
      session.pitchScore,
      session.timingScore,
      session.durationScore,
      JSON.stringify(session.noteResults),
    )
    .run();
}

export async function deleteAllSessions(env: Env, userId: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?1`).bind(userId).run();
}

export async function getSettings(env: Env, userId: string): Promise<Settings | null> {
  const row = await env.DB.prepare(`SELECT * FROM settings WHERE user_id = ?1`)
    .bind(userId)
    .first<Record<string, unknown>>();
  return row ? rowToSettings(row) : null;
}

export async function putSettings(env: Env, userId: string, settings: Settings): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO settings (
      user_id, instrument, transposition, tuning_hz, pitch_tolerance_cents,
      timing_tolerance_ms, duration_tolerance_ratio, metronome_on, input_device_id, theme, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      instrument = ?2, transposition = ?3, tuning_hz = ?4, pitch_tolerance_cents = ?5,
      timing_tolerance_ms = ?6, duration_tolerance_ratio = ?7, metronome_on = ?8,
      input_device_id = ?9, theme = ?10, updated_at = datetime('now')`,
  )
    .bind(
      userId,
      settings.instrument,
      settings.transposition,
      settings.tuningHz,
      settings.pitchToleranceCents,
      settings.timingToleranceMs,
      settings.durationToleranceRatio,
      settings.metronomeOn ? 1 : 0,
      settings.inputDeviceId ?? null,
      settings.theme,
    )
    .run();
}

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    presetId: row.preset_id as string,
    presetTitle: row.preset_title as string,
    instrument: row.instrument as string,
    transposition: row.transposition as string,
    tuningHz: row.tuning_hz as number,
    bpm: row.bpm as number,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string,
    durationSec: row.duration_sec as number,
    totalScore: row.total_score as number,
    pitchScore: row.pitch_score as number,
    timingScore: row.timing_score as number,
    durationScore: row.duration_score as number,
    noteResults: JSON.parse(row.note_results as string),
  };
}

function rowToSettings(row: Record<string, unknown>): Settings {
  return {
    instrument: row.instrument as string,
    transposition: row.transposition as string,
    tuningHz: row.tuning_hz as number,
    pitchToleranceCents: row.pitch_tolerance_cents as number,
    timingToleranceMs: row.timing_tolerance_ms as number,
    durationToleranceRatio: row.duration_tolerance_ratio as number,
    metronomeOn: Boolean(row.metronome_on),
    inputDeviceId: (row.input_device_id as string | null) ?? undefined,
    theme: row.theme as 'dark' | 'light',
  };
}
