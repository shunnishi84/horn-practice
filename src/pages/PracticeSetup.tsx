import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPreset } from '../music/presets';
import { useAppStore } from '../store/store';
import { INSTRUMENT_LIST } from '../music/instruments';
import StaffPreview from '../components/StaffPreview';
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
      <div className="card p-6 text-center space-y-2">
        <p className="font-bold">😢 プリセットが見つかりません</p>
        <Link to="/presets" className="text-pop-pink font-bold underline">戻る</Link>
      </div>
    );
  }

  const start = () => {
    navigate(`/practice/${preset.id}?bpm=${bpm}`);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">🎼 {preset.title}</h1>
      <div className="card p-3 overflow-x-auto" data-testid="score-preview">
        <StaffPreview notes={preset.notes} transposition={settings.transposition} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="card p-4 block">
          <span className="text-sm font-bold text-muted">🥁 BPM: <span className="text-pop-pink">{bpm}</span></span>
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
            className="w-24 select-pop text-sm mt-2"
            data-testid="bpm-input"
          />
        </label>

        <label className="card p-4 block">
          <span className="text-sm font-bold text-muted">🎷 楽器</span>
          <select
            className="w-full select-pop mt-2"
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

        <label className="card p-4 block">
          <span className="text-sm font-bold text-muted">🎵 移調</span>
          <select
            className="w-full select-pop mt-2"
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

        <label className="card p-4 block">
          <span className="text-sm font-bold text-muted">🎤 マイクデバイス</span>
          <select
            className="w-full select-pop mt-2"
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

      <button onClick={start} className="btn-pop text-lg" data-testid="start-countdown">
        🚀 3・2・1で開始
      </button>
    </div>
  );
}
