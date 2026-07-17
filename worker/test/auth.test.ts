import { describe, expect, it } from 'vitest';
import { env } from 'cloudflare:test';
import { SignJWT, createLocalJWKSet, exportJWK, generateKeyPair } from 'jose';
import { verifyFirebaseToken } from '../src/auth';

interface TokenOverrides {
  issuer?: string;
  audience?: string;
  sub?: string;
  expirationTime?: number | string;
}

async function issueToken(overrides: TokenOverrides = {}) {
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = 'test-key';
  publicJwk.alg = 'RS256';

  const projectId = env.FIREBASE_PROJECT_ID;
  const token = await new SignJWT({ email: 'player@example.com', name: 'Player One' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(overrides.issuer ?? `https://securetoken.google.com/${projectId}`)
    .setAudience(overrides.audience ?? projectId)
    .setSubject(overrides.sub ?? 'firebase-uid-123')
    .setIssuedAt()
    .setExpirationTime(overrides.expirationTime ?? '1h')
    .sign(privateKey);

  const jwks = createLocalJWKSet({ keys: [publicJwk] });
  return { token, jwks };
}

describe('verifyFirebaseToken', () => {
  it('extracts uid/email/displayName from a valid token', async () => {
    const { token, jwks } = await issueToken();
    const user = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID, jwks);
    expect(user).toEqual({
      uid: 'firebase-uid-123',
      email: 'player@example.com',
      displayName: 'Player One',
    });
  });

  it('rejects a token issued for a different Firebase project (audience)', async () => {
    const { token, jwks } = await issueToken({ audience: 'some-other-project' });
    await expect(verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID, jwks)).rejects.toThrow();
  });

  it('rejects a token from a different issuer', async () => {
    const { token, jwks } = await issueToken({
      issuer: 'https://securetoken.google.com/some-other-project',
    });
    await expect(verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID, jwks)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const { token, jwks } = await issueToken({
      expirationTime: Math.floor(Date.now() / 1000) - 3600,
    });
    await expect(verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID, jwks)).rejects.toThrow();
  });
});
