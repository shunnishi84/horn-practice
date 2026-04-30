import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPreset } from '../music/presets';
import { useAppStore } from '../store/store';
import { INSTRUMENT_LIST } from '../music/instruments';
import { concertToWritten } from '../music/transposition';
import { listAudioInputs } from '../audio/micInput';
import type { Transposition } from '../types';

export default function PracticeSetup() {
  const { presetId } = useParams<{ presetId: string }>();
  const navigate = useNavigate();
  const preset = presetId ? getPreset(presetId) : undefined;
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [bpm, setBpm] = useState(preset?.defaultBpm ?? 80);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (preset) setBpm(preset.defaultBpm);
  }, [preset]);

  useEffect(() => {
    listAudioInputs().then(setDevices).catch(() => setDevices([]));
  }, []);

  if (!preset) {
    return (
      <div>
        <p>プリセットが見つかりません</p>
        <Link to="/presets" className="text-sky-400 underline">戻る</Link>
      </div>
    );
  }

  const start = () => {
    navigate(`/practice/${preset.id}?bpm=${bpm}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{preset.title}</h1>
      <div className="bg-slate-800 rounded-lg p-3 overflow-x-auto" data-testid="score-preview">
        <div className="flex gap-1 min-w-max">
          {preset.notes.map((n, i) => (
            <span key={i} className="px-2 py-1 rounded bg-slate-700 text-sm font-mono">
              {n.isRest ? '—' : concertToWritten(n.pitch, settings.transposition)}
            </span>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-slate-400">BPM: {bpm}</span>
          <input
            type="range"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full"
            data-testid="bpm-slider"
          />
          <input
            type="number"
            min={40}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value) || 80)}
            className="w-24 bg-slate-800 rounded px-2 py-1 text-sm mt-1"
            data-testid="bpm-input"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">楽器</span>
          <select
            className="w-full bg-slate-800 rounded px-2 py-1.5"
            value={settings.instrument}
            onChange={(e) => updateSettings({ instrument: e.target.value as any })}
            data-testid="instrument-select"
          >
            {INSTRUMENT_LIST.map((i) => (
              <option key={i.key} value={i.key}>
                {i.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">移調</span>
          <select
            className="w-full bg-slate-800 rounded px-2 py-1.5"
            value={settings.transposition}
            onChange={(e) => updateSettings({ transposition: e.target.value as Transposition })}
            data-testid="transposition-select"
          >
            <option value="C">in C (実音)</option>
            <option value="Bb">in Bb</option>
            <option value="Eb">in Eb</option>
            <option value="F">in F</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">マイクデバイス</span>
          <select
            className="w-full bg-slate-800 rounded px-2 py-1.5"
            value={settings.inputDeviceId ?? ''}
            onChange={(e) => updateSettings({ inputDeviceId: e.target.value || undefined })}
            data-testid="device-select"
          >
            <option value="">自動選択</option>
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Device ${d.deviceId.slice(0, 6)}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={start}
        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg"
        data-testid="start-countdown"
      >
        3・2・1で開始
      </button>
    </div>
  );
}
