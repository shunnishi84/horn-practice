import type { Session, Settings } from '../types';

export interface ExportPayload {
  manifest: {
    app: 'wind-trainer';
    version: 1;
    exportedAt: string;
  };
  settings: Settings;
  sessions: Session[];
}

export function buildExport(settings: Settings, sessions: Session[]): ExportPayload {
  return {
    manifest: { app: 'wind-trainer', version: 1, exportedAt: new Date().toISOString() },
    settings,
    sessions,
  };
}

export function parseImport(text: string): ExportPayload {
  const data = JSON.parse(text);
  if (!data?.manifest || data.manifest.app !== 'wind-trainer') throw new Error('Invalid file');
  return data as ExportPayload;
}

export function downloadFile(name: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}
