import type { Session, Settings } from '../types';
import { API_BASE_URL } from '../config';
import { getIdToken } from '../auth/auth';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGetAllSessions(): Promise<Session[]> {
  const { sessions } = await request<{ sessions: (Session & { instrument: string; transposition: string })[] }>(
    '/api/sessions',
  );
  return sessions as Session[];
}

export async function apiSaveSession(session: Session): Promise<void> {
  await request('/api/sessions', { method: 'POST', body: JSON.stringify(session) });
}

export async function apiDeleteAllSessions(): Promise<void> {
  await request('/api/sessions', { method: 'DELETE' });
}

// countdownSecondsは定数(3)でサーバーには保存しないため、受信時に補う。
export async function apiLoadSettings(): Promise<Settings | null> {
  const { settings } = await request<{ settings: Omit<Settings, 'countdownSeconds'> | null }>('/api/settings');
  return settings ? { ...settings, countdownSeconds: 3 } : null;
}

export async function apiSaveSettings(settings: Settings): Promise<void> {
  const { countdownSeconds: _omit, ...rest } = settings;
  await request('/api/settings', { method: 'PUT', body: JSON.stringify(rest) });
}
