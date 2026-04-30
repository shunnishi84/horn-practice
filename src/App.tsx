import { useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAppStore } from './store/store';
import Home from './pages/Home';
import PresetSelect from './pages/PresetSelect';
import PracticeSetup from './pages/PracticeSetup';
import Practice from './pages/Practice';
import Result from './pages/Result';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import ExportPage from './pages/ExportImport';

export default function App() {
  const loadAll = useAppStore((s) => s.loadAll);
  const loaded = useAppStore((s) => s.loaded);
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (theme === 'light') document.body.classList.add('theme-light');
    else document.body.classList.remove('theme-light');
  }, [theme]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-300">
        読み込み中…
      </div>
    );
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <NavLink to="/" className="text-lg font-bold text-sky-400">WindTrainer</NavLink>
          <nav className="flex gap-2 flex-wrap" data-testid="main-nav">
            <NavLink to="/" end className={navClass}>ホーム</NavLink>
            <NavLink to="/presets" className={navClass}>プリセット</NavLink>
            <NavLink to="/stats" className={navClass}>統計</NavLink>
            <NavLink to="/settings" className={navClass}>設定</NavLink>
            <NavLink to="/data" className={navClass}>エクスポート</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/presets" element={<PresetSelect />} />
          <Route path="/setup/:presetId" element={<PracticeSetup />} />
          <Route path="/practice/:presetId" element={<Practice />} />
          <Route path="/result/:sessionId" element={<Result />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/data" element={<ExportPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-slate-500 py-4">
        WindTrainer · オフラインで動く管楽器練習補助アプリ
      </footer>
    </div>
  );
}
