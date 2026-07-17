-- Mirrors the Firebase user; created lazily on first authenticated request.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- Firebase UID
  email TEXT,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  transposition TEXT NOT NULL,
  tuning_hz REAL NOT NULL,
  pitch_tolerance_cents REAL NOT NULL,
  timing_tolerance_ms REAL NOT NULL,
  duration_tolerance_ratio REAL NOT NULL,
  metronome_on INTEGER NOT NULL DEFAULT 0,
  input_device_id TEXT,
  theme TEXT NOT NULL DEFAULT 'dark',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- note_results stores the NoteResult[] array as JSON; per-note SQL queries
-- aren't needed yet since Stats aggregation happens client-side today.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preset_id TEXT NOT NULL,
  preset_title TEXT NOT NULL,
  instrument TEXT NOT NULL,
  transposition TEXT NOT NULL,
  tuning_hz REAL NOT NULL,
  bpm INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_sec REAL NOT NULL,
  total_score REAL NOT NULL,
  pitch_score REAL NOT NULL,
  timing_score REAL NOT NULL,
  duration_score REAL NOT NULL,
  note_results TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON sessions(user_id, started_at);
