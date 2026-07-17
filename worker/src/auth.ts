import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { MiddlewareHandler } from 'hono';
import type { Env } from './types';

const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

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

export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const header = c.req.header('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    return c.json({ error: 'missing bearer token' }, 401);
  }

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(JWKS_URL));
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${c.env.FIREBASE_PROJECT_ID}`,
      audience: c.env.FIREBASE_PROJECT_ID,
    });

    if (typeof payload.sub !== 'string') {
      return c.json({ error: 'invalid token subject' }, 401);
    }

    c.set('user', {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      displayName: typeof payload.name === 'string' ? payload.name : undefined,
    });
  } catch {
    return c.json({ error: 'invalid or expired token' }, 401);
  }

  await next();
};
