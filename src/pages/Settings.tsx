import { useEffect, useState } from 'react';
import { useAppStore } from '../store/store';
import { INSTRUMENT_LIST } from '../music/instruments';
import { listAudioInputs } from '../audio/micInput';

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    listAudioInputs().then(setDevices).catch(() => setDevices([]));
  }, []);

  return (
    <div className="space-y-4" data-testid="settings-page">
      <h1 className="text-2xl font-extrabold">⚙️ 設定</h1>
      <Field label={`🎷 楽器`}>
        <select className="select-pop" value={settings.instrument} onChange={(e) => updateSettings({ instrument: e.target.value as any })}>
          {INSTRUMENT_LIST.map((i) => <option key={i.key} value={i.key}>{i.displayName}</option>)}
        </select>
      </Field>
      <Field label="🎵 移調">
        <select className="select-pop" value={settings.transposition} onChange={(e) => updateSettings({ transposition: e.target.value as any })}>
          <option value="C">C</option>
          <option value="Bb">Bb</option>
          <option value="Eb">Eb</option>
          <option value="F">F</option>
        </select>
      </Field>
      <Field label={`🎚️ チューニング基準: ${settings.tuningHz} Hz`}>
        <SliderWithSteppers min={415} max={470} value={settings.tuningHz}
          onChange={(v) => updateSettings({ tuningHz: v })}
          testId="tuning-hz" />
      </Field>
      <Field label={`🎯 許容セント数: ±${settings.pitchToleranceCents}¢`}>
        <SliderWithSteppers min={5} max={50} value={settings.pitchToleranceCents}
          onChange={(v) => updateSettings({ pitchToleranceCents: v })} />
      </Field>
      <Field label={`⏰ 許容タイミング: ±${settings.timingToleranceMs} ms`}>
        <SliderWithSteppers min={20} max={200} value={settings.timingToleranceMs}
          onChange={(v) => updateSettings({ timingToleranceMs: v })} />
      </Field>
      <Field label={`📏 音価許容比率: ±${Math.round(settings.durationToleranceRatio * 100)}%`}>
        <SliderWithSteppers min={5} max={30} value={Math.round(settings.durationToleranceRatio * 100)}
          onChange={(v) => updateSettings({ durationToleranceRatio: v / 100 })} />
      </Field>
      <Field label="🥁 メトロノーム">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={settings.metronomeOn} onChange={(e) => updateSettings({ metronomeOn: e.target.checked })} />
          <span>練習中に鳴らす</span>
        </label>
      </Field>
      <Field label="🎤 マイクデバイス">
        <select className="select-pop" value={settings.inputDeviceId ?? ''} onChange={(e) => updateSettings({ inputDeviceId: e.target.value || undefined })}>
          <option value="">自動選択</option>
          {devices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId.slice(0, 6)}</option>)}
        </select>
      </Field>
      <Field label="🎨 テーマ">
        <select className="select-pop" value={settings.theme} onChange={(e) => updateSettings({ theme: e.target.value as any })} data-testid="theme-select">
          <option value="dark">ダーク</option>
          <option value="light">ライト</option>
        </select>
      </Field>
    </div>
  );
}

function SliderWithSteppers({ min, max, value, onChange, testId }: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  testId?: string;
}) {
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));
  const btnClass =
    'w-8 h-8 shrink-0 rounded-full bg-surface border-2 border-line text-ink font-bold leading-none transition hover:border-pop-violet disabled:opacity-40 disabled:hover:border-line';
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btnClass} onClick={() => step(-1)} disabled={value <= min} aria-label="減らす">−</button>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        data-testid={testId} />
      <button type="button" className={btnClass} onClick={() => step(1)} disabled={value >= max} aria-label="増やす">＋</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-bold">{label}</div>
      <div>{children}</div>
    </div>
  );
}
