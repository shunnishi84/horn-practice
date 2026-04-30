import { create } from 'zustand';
import type { Session, Settings } from '../types';
import { getAllSessions, loadSettings, saveSession, saveSettings as dbSaveSettings, deleteAllSessions } from '../db/db';

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
  loadAll: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
  recordSession: (s: Session) => Promise<void>;
  selectPreset: (id: string | null) => void;
  clearAllSessions: () => Promise<void>;
  importSessions: (sessions: Session[], merge: boolean) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  sessions: [],
  loaded: false,
  selectedPresetId: null,
  loadAll: async () => {
    const [stored, sessions] = await Promise.all([loadSettings(), getAllSessions()]);
    set({
      settings: stored ?? DEFAULT_SETTINGS,
      sessions: sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      loaded: true,
    });
  },
  updateSettings: async (partial) => {
    const next = { ...get().settings, ...partial };
    await dbSaveSettings(next);
    set({ settings: next });
  },
  recordSession: async (s) => {
    await saveSession(s);
    set((state) => ({ sessions: [s, ...state.sessions] }));
  },
  selectPreset: (id) => set({ selectedPresetId: id }),
  clearAllSessions: async () => {
    await deleteAllSessions();
    set({ sessions: [] });
  },
  importSessions: async (sessions, merge) => {
    if (!merge) {
      await deleteAllSessions();
    }
    for (const s of sessions) await saveSession(s);
    const all = await getAllSessions();
    set({ sessions: all.sort((a, b) => b.startedAt.localeCompare(a.startedAt)) });
  },
}));
