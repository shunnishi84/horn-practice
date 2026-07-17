import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Env } from './types';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let remoteJwks: JWTVerifyGetKey | null = null;

export interface AuthedUser {
  uid: string;
  email?: string;
  displayName?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthedUser;
  }
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string,
  getKey: JWTVerifyGetKey,
): Promise<AuthedUser> {
  const { payload } = await jwtVerify(token, getKey, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (typeof payload.sub !== 'string') {
    throw new Error('invalid token subject');
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    displayName: typeof payload.name === 'string' ? payload.name : undefined,
  };
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    return c.json({ error: 'missing bearer token' }, 401);
  }

  if (!remoteJwks) {
    remoteJwks = createRemoteJWKSet(new URL(JWKS_URL));
  }

  try {
    const user = await verifyFirebaseToken(token, c.env.FIREBASE_PROJECT_ID, remoteJwks);
    c.set('user', user);
  } catch {
    return c.json({ error: 'invalid or expired token' }, 401);
  }

  await next();
};
