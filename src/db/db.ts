import { openDB, type IDBPDatabase } from 'idb';
import type { Session, Settings } from '../types';

const DB_NAME = 'wind-trainer';
const DB_VERSION = 1;

interface WTSchema {
  sessions: Session;
  meta: { id: string; settings: Settings };
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('by-startedAt', 'startedAt');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDb();
  return await db.getAll('sessions');
}

export async function deleteAllSessions(): Promise<void> {
  const db = await getDb();
  await db.clear('sessions');
}

export async function loadSettings(): Promise<Settings | null> {
  const db = await getDb();
  const row = await db.get('meta', 'settings');
  return row?.settings ?? null;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await getDb();
  await db.put('meta', { id: 'settings', settings });
}
