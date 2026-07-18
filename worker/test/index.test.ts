import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { SignJWT, exportJWK, generateKeyPair, type JWK, type KeyLike } from 'jose';
import app from '../src/index';
import type { Session, Settings } from '../src/types';

const JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const KID = 'test-key';

let privateKey: KeyLike;

// requireAuth's remote JWKS fetcher is a module-level singleton with a
// cooldown between fetches, so all tests in this file share one signing key
// (fetched once here) rather than rotating a key per test.
beforeAll(async () => {
  const keyPair = await generateKeyPair('RS256');
  privateKey = keyPair.privateKey;
  const publicJwk: JWK = await exportJWK(keyPair.publicKey);
  publicJwk.kid = KID;
  publicJwk.alg = 'RS256';

  const realFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === JWKS_URL) {
      return Promise.resolve(
        new Response(JSON.stringify({ keys: [publicJwk] }), {
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    return realFetch(input, init);
  });
});

async function issueToken(sub = 'firebase-uid-999') {
  return new SignJWT({ email: 'player@example.com', name: 'Player One' })
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`)
    .setAudience(env.FIREBASE_PROJECT_ID)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
}

async function authedRequest(path: string, init: RequestInit = {}) {
  const token = await issueToken();
  return app.request(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } }, env);
}

describe('API routes', () => {
  beforeEach(async () => {
    // Storage isn't reset between tests within a file, so clear explicitly.
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions'),
      env.DB.prepare('DELETE FROM settings'),
      env.DB.prepare('DELETE FROM users'),
    ]);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await app.request('/api/sessions', {}, env);
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const res = await app.request('/api/sessions', { headers: { Authorization: 'Bearer not-a-jwt' } }, env);
    expect(res.status).toBe(401);
  });

  it('creates the user lazily and returns an empty session list', async () => {
    const res = await authedRequest('/api/sessions');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessions: [] });
  });

  it('saves and lists a session', async () => {
    const session: Session = {
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
      noteResults: [],
    };

    const createRes = await authedRequest('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(session),
    });
    expect(createRes.status).toBe(201);

    const listRes = await authedRequest('/api/sessions');
    const { sessions } = await listRes.json<{ sessions: Session[] }>();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('session-1');
  });

  it('deletes all sessions for the authenticated user', async () => {
    const session: Session = {
      id: 'session-del',
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
      noteResults: [],
    };

    await authedRequest('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(session),
    });

    const deleteRes = await authedRequest('/api/sessions', { method: 'DELETE' });
    expect(deleteRes.status).toBe(200);

    const listRes = await authedRequest('/api/sessions');
    expect(await listRes.json()).toEqual({ sessions: [] });
  });

  it('round-trips settings', async () => {
    const settings: Settings = {
      instrument: 'trumpet',
      transposition: 'Bb',
      tuningHz: 440,
      pitchToleranceCents: 20,
      timingToleranceMs: 80,
      durationToleranceRatio: 0.15,
      metronomeOn: true,
      theme: 'dark',
    };

    const putRes = await authedRequest('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    });
    expect(putRes.status).toBe(200);

    const getRes = await authedRequest('/api/settings');
    const { settings: saved } = await getRes.json<{ settings: Settings }>();
    expect(saved).toEqual(settings);
  });
});
