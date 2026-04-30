import { useRef, useState } from 'react';
import { useAppStore } from '../store/store';
import { buildExport, downloadFile, parseImport } from '../lib/exporter';

export default function ExportPage() {
  const settings = useAppStore((s) => s.settings);
  const sessions = useAppStore((s) => s.sessions);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const importSessions = useAppStore((s) => s.importSessions);
  const clearAllSessions = useAppStore((s) => s.clearAllSessions);
  const fileRef = useRef<HTMLInputElement>(null);
  const [merge, setMerge] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const onExport = () => {
    const payload = buildExport(settings, sessions);
    downloadFile(`wind-trainer-${new Date().toISOString().slice(0, 10)}.windtrn`, JSON.stringify(payload, null, 2));
    setMsg(`${sessions.length} 件のセッションをエクスポートしました`);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = parseImport(text);
      if (!merge) await clearAllSessions();
      await importSessions(data.sessions, merge);
      await updateSettings(data.settings);
      setMsg(`${data.sessions.length} 件のセッションをインポートしました`);
    } catch (e: any) {
      setMsg(`インポート失敗: ${e?.message ?? e}`);
    }
  };

  return (
    <div className="space-y-4" data-testid="export-page">
      <h1 className="text-2xl font-bold">エクスポート / インポート</h1>
      <p className="text-sm text-slate-400">現在のセッション数: {sessions.length}</p>

      <section className="bg-slate-800 rounded p-4 space-y-2">
        <h2 className="font-semibold">エクスポート</h2>
        <p className="text-sm text-slate-400">設定・セッション履歴をひとつのファイルに保存します。</p>
        <button onClick={onExport} className="bg-sky-600 hover:bg-sky-500 px-4 py-2 rounded font-bold" data-testid="export-btn">
          ダウンロード (.windtrn)
        </button>
      </section>

      <section className="bg-slate-800 rounded p-4 space-y-2">
        <h2 className="font-semibold">インポート</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={merge} onChange={(e) => setMerge(e.target.checked)} />
          既存データに追加マージ（オフ：上書き）
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".windtrn,.json,application/json"
          onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          data-testid="import-file"
        />
      </section>

      {msg && <div className="text-emerald-400 text-sm" data-testid="export-msg">{msg}</div>}
    </div>
  );
}
