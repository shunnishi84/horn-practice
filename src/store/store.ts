import { create } from 'zustand';
import type { Session, Settings } from '../types';
import { getAllSessions, loadSettings, saveSession, saveSettings as dbSaveSettings, deleteAllSessions } from '../db/db';
import {
  apiGetAllSessions,
  apiLoadSettings,
  apiSaveSession,
  apiSaveSettings,
  apiDeleteAllSessions,
} from '../api/client';
import { subscribeAuth, signInWithGoogle, signOutUser, type AuthUser } from '../auth/auth';

const DEFAULT_SETTINGS: Settings = {
  instrument: 'trumpet',
  transposition: 'Bb',
  tuningHz: 440,
  pitchToleranceCents: 20,
  timingToleranceMs: 80,
  durationToleranceRatio: 0.15,
  countdownSeconds: 3,
  metronomeOn: true,
  theme: 'dark',
};

interface AppState {
  settings: Settings;
  sessions: Session[];
  loaded: boolean;
  selectedPresetId: string | null;
  user: AuthUser | null;
  syncing: boolean;
  loadAll: () => Promise<void>;
  initAuth: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  recordSession: (s: Session) => Promise<void>;
  selectPreset: (id: string | null) => void;
  clearAllSessions: () => Promise<void>;
  importSessions: (sessions: Session[], merge: boolean) => Promise<void>;
}

const sortSessions = (sessions: Session[]) =>
  [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

// 設定の保存は直列化する。並行して走らせると完了順序が前後して
// 古い値が最後に書き込まれることがある(ステッパー連打・スライダードラッグ時)。
let settingsSaveChain: Promise<void> = Promise.resolve();
function enqueueSettingsSave(save: () => Promise<void>): void {
  settingsSaveChain = settingsSaveChain.then(save).catch((e) => {
    console.error('設定の保存に失敗しました', e);
  });
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  sessions: [],
  loaded: false,
  selectedPresetId: null,
  user: null,
  syncing: false,
  loadAll: async () => {
    const useApi = get().user !== null;
    const [stored, sessions] = useApi
      ? await Promise.all([apiLoadSettings(), apiGetAllSessions()])
      : await Promise.all([loadSettings(), getAllSessions()]);
    set({
      settings: stored ?? DEFAULT_SETTINGS,
      sessions: sortSessions(sessions),
      loaded: true,
    });
  },
  initAuth: () => {
    subscribeAuth(async (user) => {
      const prevUser = get().user;
      set({ user });
      if (user && !prevUser) {
        // ログイン直後: ローカル(IndexedDB)の履歴をサーバーへ送ってから読み直す。
        // サーバー側はセッションIDで重複を無視するため何度実行しても安全。
        set({ syncing: true });
        try {
          const local = await getAllSessions();
          for (const s of local) await apiSaveSession(s);
          await get().loadAll();
        } finally {
          set({ syncing: false });
        }
      } else if (!user && prevUser) {
        await get().loadAll();
      }
    });
  },
  login: async () => {
    await signInWithGoogle();
  },
  logout: async () => {
    await signOutUser();
  },
  updateSettings: async (partial) => {
    // 先にstateを更新してから永続化する。保存完了を待ってからだと、
    // ステッパー連打やスライダードラッグ中の連続変更で古い値を基に
    // 計算してしまい更新が失われる。
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    enqueueSettingsSave(async () => {
      if (get().user) await apiSaveSettings(next);
      else await dbSaveSettings(next);
    });
  },
  recordSession: async (s) => {
    // ログイン中でもIndexedDBに常に保存し、オフラインや未ログイン時の閲覧に備える
    await saveSession(s);
    if (get().user) await apiSaveSession(s);
    set((state) => ({ sessions: [s, ...state.sessions] }));
  },
  selectPreset: (id) => set({ selectedPresetId: id }),
  clearAllSessions: async () => {
    await deleteAllSessions();
    if (get().user) await apiDeleteAllSessions();
    set({ sessions: [] });
  },
  importSessions: async (sessions, merge) => {
    if (!merge) {
      await deleteAllSessions();
      if (get().user) await apiDeleteAllSessions();
    }
    for (const s of sessions) {
      await saveSession(s);
      if (get().user) await apiSaveSession(s);
    }
    await get().loadAll();
  },
}));
