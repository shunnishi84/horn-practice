import { beforeEach, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import * as repo from '../src/repository';
import type { Session, Settings } from '../src/types';

const user = { uid: 'user-1', email: 'a@example.com', displayName: 'Alice' };

function sampleSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'session-1',
    presetId: 'preset-1',
    presetTitle: 'Long Tone',
    instrument: 'trumpet',
    transposition: 'Bb',
    tuningHz: 440,
    bpm: 80,
    startedAt: '2026-01-01T00:00:00.000Z',
    endedAt: '2026-01-01T00:05:00.000Z',
    durationSec: 300,
    totalScore: 90,
    pitchScore: 88,
    timingScore: 92,
    durationScore: 90,
    noteResults: [
      {
        noteIndex: 0,
        expectedPitch: 'C4',
        detectedPitchHz: 261.6,
        pitchScore: 95,
        timingScore: 90,
        durationScore: 88,
        totalScore: 91,
      },
    ],
    ...overrides,
  };
}

describe('repository', () => {
  beforeEach(async () => {
    // Storage isn't reset between tests within a file, so clear explicitly.
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions'),
      env.DB.prepare('DELETE FROM settings'),
      env.DB.prepare('DELETE FROM users'),
    ]);
    await repo.ensureUser(env, user);
  });

  it('upserts users idempotently', async () => {
    await repo.ensureUser(env, { ...user, displayName: 'Alice Updated' });
    const row = await env.DB.prepare('SELECT display_name FROM users WHERE id = ?1')
      .bind(user.uid)
      .first<{ display_name: string }>();
    expect(row?.display_name).toBe('Alice Updated');
  });

  it('round-trips sessions including note results', async () => {
    await repo.insertSession(env, user.uid, sampleSession());
    const sessions = await repo.listSessions(env, user.uid);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({ id: 'session-1', presetTitle: 'Long Tone' });
    expect(sessions[0].noteResults[0].expectedPitch).toBe('C4');
  });

  it('ignores a duplicate session id instead of overwriting', async () => {
    await repo.insertSession(env, user.uid, sampleSession());
    await repo.insertSession(env, user.uid, sampleSession({ presetTitle: 'Different Title' }));
    const sessions = await repo.listSessions(env, user.uid);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].presetTitle).toBe('Long Tone');
  });

  it('scopes sessions per user', async () => {
    await repo.ensureUser(env, { uid: 'user-2' });
    await repo.insertSession(env, user.uid, sampleSession({ id: 'session-a' }));
    await repo.insertSession(env, 'user-2', sampleSession({ id: 'session-b' }));

    expect(await repo.listSessions(env, user.uid)).toHaveLength(1);
    expect(await repo.listSessions(env, 'user-2')).toHaveLength(1);
  });

  it('orders sessions by startedAt descending', async () => {
    await repo.insertSession(env, user.uid, sampleSession({ id: 's1', startedAt: '2026-01-01T00:00:00.000Z' }));
    await repo.insertSession(env, user.uid, sampleSession({ id: 's2', startedAt: '2026-01-02T00:00:00.000Z' }));

    const sessions = await repo.listSessions(env, user.uid);
    expect(sessions.map((s) => s.id)).toEqual(['s2', 's1']);
  });

  it('deletes all sessions for a user without touching others', async () => {
    await repo.ensureUser(env, { uid: 'user-2' });
    await repo.insertSession(env, user.uid, sampleSession({ id: 'session-a' }));
    await repo.insertSession(env, 'user-2', sampleSession({ id: 'session-b' }));

    await repo.deleteAllSessions(env, user.uid);

    expect(await repo.listSessions(env, user.uid)).toHaveLength(0);
    expect(await repo.listSessions(env, 'user-2')).toHaveLength(1);
  });

  it('returns null settings when none have been saved', async () => {
    expect(await repo.getSettings(env, user.uid)).toBeNull();
  });

  it('upserts settings', async () => {
    const settings: Settings = {
      instrument: 'trumpet',
      transposition: 'Bb',
      tuningHz: 440,
      pitchToleranceCents: 20,
      timingToleranceMs: 80,
      durationToleranceRatio: 0.15,
      metronomeOn: true,
      inputDeviceId: 'default',
      theme: 'dark',
    };

    await repo.putSettings(env, user.uid, settings);
    expect(await repo.getSettings(env, user.uid)).toEqual(settings);

    await repo.putSettings(env, user.uid, { ...settings, metronomeOn: false, theme: 'light' });
    const updated = await repo.getSettings(env, user.uid);
    expect(updated?.metronomeOn).toBe(false);
    expect(updated?.theme).toBe('light');
  });
});
