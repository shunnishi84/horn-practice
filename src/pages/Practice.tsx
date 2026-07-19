import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getPreset } from '../music/presets';
import { useAppStore } from '../store/store';
import ScoreScroller from '../components/ScoreScroller';
import Countdown from '../components/Countdown';
import PitchMeter from '../components/PitchMeter';
import { startMic } from '../audio/micInput';
import { LivePitchDetector } from '../audio/pitchDetector';
import { EnergyOnsetDetector } from '../audio/onsetDetector';
import { Metronome, playCountdownBeep } from '../audio/metronome';
import { centsBetween, hzToNote, noteToHz } from '../music/noteUtils';
import { buildNoteResult, summarizeSession } from '../scoring/scoring';
import type { NoteResult, Session } from '../types';

interface FrameSample {
  t: number; // ms since practice start
  hz: number | null;
  rms: number;
}

export default function Practice() {
  const { presetId } = useParams<{ presetId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const preset = presetId ? getPreset(presetId) : undefined;
  const settings = useAppStore((s) => s.settings);
  const recordSession = useAppStore((s) => s.recordSession);

  const bpm = parseInt(params.get('bpm') ?? '') || preset?.defaultBpm || 80;

  const [phase, setPhase] = useState<'init' | 'countdown' | 'play' | 'paused' | 'done' | 'error'>('init');
  const [countdownVal, setCountdownVal] = useState(3);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [liveCents, setLiveCents] = useState<number | null>(null);
  const [liveNote, setLiveNote] = useState<string | null>(null);
  const [perNoteStatus, setPerNoteStatus] = useState<Record<number, 'good' | 'warn' | 'bad'>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const micRef = useRef<Awaited<ReturnType<typeof startMic>> | null>(null);
  const detectorRef = useRef<LivePitchDetector | null>(null);
  const onsetRef = useRef<EnergyOnsetDetector | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);
  const samplesRef = useRef<FrameSample[]>([]);
  const startTsRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);

  // E2E test fallback - allows running without real mic
  const isE2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === '1';

  useEffect(() => {
    if (!preset) return;
    let cancelled = false;
    const init = async () => {
      try {
        if (!isE2E) {
          const mic = await startMic(settings.inputDeviceId);
          if (cancelled) {
            mic.stop();
            return;
          }
          micRef.current = mic;
          detectorRef.current = new LivePitchDetector(mic.analyser, mic.sampleRate);
          onsetRef.current = new EnergyOnsetDetector();
        }
        setPhase('countdown');
      } catch (e: any) {
        setErrorMsg(e?.message ?? 'マイクの取得に失敗しました');
        setPhase('error');
      }
    };
    init();
    return () => {
      cancelled = true;
      if (micRef.current) micRef.current.stop();
      if (metronomeRef.current) metronomeRef.current.stop();
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset?.id]);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdownVal(3);
    const ctx = micRef.current?.ctx;
    let n = 3;
    if (ctx) playCountdownBeep(ctx, ctx.currentTime, 880);
    const intv = window.setInterval(() => {
      n -= 1;
      setCountdownVal(n);
      if (ctx) playCountdownBeep(ctx, ctx.currentTime, n === 0 ? 1320 : 880);
      if (n <= 0) {
        window.clearInterval(intv);
        setTimeout(() => setPhase('play'), 600);
      }
    }, 800);
    return () => window.clearInterval(intv);
  }, [phase]);

  // Play loop
  useEffect(() => {
    if (phase !== 'play' || !preset) return;
    // Anchor both the visual progress and the metronome to the audio clock,
    // so the scroller and the clicks can never drift apart. Fall back to
    // performance.now() when there is no AudioContext (E2E mode).
    const audioCtx = micRef.current?.ctx ?? null;
    const ctxStartTime = audioCtx ? audioCtx.currentTime : 0;
    startTsRef.current = performance.now();
    samplesRef.current = [];
    if (settings.metronomeOn && micRef.current && !isE2E) {
      metronomeRef.current = new Metronome(micRef.current.ctx, bpm);
      metronomeRef.current.start(ctxStartTime);
    }

    const totalBeats = preset.notes.reduce((m, n) => Math.max(m, n.startBeat + n.durationBeats), 0);
    const totalDurMs = (totalBeats / bpm) * 60_000;

    const loop = () => {
      if (pauseRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const t = audioCtx
        ? (audioCtx.currentTime - ctxStartTime) * 1000
        : performance.now() - startTsRef.current;
      setElapsedMs(t);

      if (detectorRef.current) {
        const { hz, rms } = detectorRef.current.detect();
        samplesRef.current.push({ t, hz, rms });
        // live cents vs current expected note
        if (hz) {
          const beat = (t / 1000) * (bpm / 60);
          const idx = preset.notes.findIndex(
            (n) => beat >= n.startBeat && beat < n.startBeat + n.durationBeats,
          );
          if (idx >= 0 && !preset.notes[idx].isRest) {
            const expHz = noteToHz(preset.notes[idx].pitch, settings.tuningHz);
            const c = centsBetween(hz, expHz);
            setLiveCents(c);
            setLiveNote(hzToNote(hz, settings.tuningHz).note);
            // realtime status
            const abs = Math.abs(c);
            const status: 'good' | 'warn' | 'bad' = abs <= settings.pitchToleranceCents ? 'good' : abs <= settings.pitchToleranceCents * 2 ? 'warn' : 'bad';
            setPerNoteStatus((p) => (p[idx] && p[idx] === 'good' ? p : { ...p, [idx]: status }));
          } else {
            setLiveCents(null);
          }
        } else {
          setLiveCents(null);
        }
      }

      if (t >= totalDurMs + 200) {
        finalize();
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (metronomeRef.current) {
        metronomeRef.current.stop();
        metronomeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finalize = async () => {
    if (!preset) return;
    cancelAnimationFrame(rafRef.current);
    if (metronomeRef.current) metronomeRef.current.stop();
    const beatToMs = (b: number) => (b / bpm) * 60_000;

    const noteResults: NoteResult[] = preset.notes.map((note, idx) => {
      if (note.isRest) {
        return {
          noteIndex: idx,
          expectedPitch: 'rest',
          pitchScore: 100,
          timingScore: 100,
          durationScore: 100,
          totalScore: 100,
        };
      }
      const startMs = beatToMs(note.startBeat);
      const endMs = beatToMs(note.startBeat + note.durationBeats);
      const window = samplesRef.current.filter((s) => s.t >= startMs && s.t < endMs);
      const stable = window.filter((s) => s.hz != null);
      let avgHz: number | undefined;
      if (stable.length > 0) {
        const mid = stable.slice(Math.floor(stable.length * 0.25), Math.ceil(stable.length * 0.75));
        const arr = (mid.length ? mid : stable).map((s) => s.hz!);
        avgHz = arr.reduce((a, b) => a + b, 0) / arr.length;
      }
      let onsetMs: number | undefined;
      let offsetMs: number | undefined;
      const firstActive = window.findIndex((s) => s.hz != null);
      const lastActive = (() => {
        for (let i = window.length - 1; i >= 0; i--) if (window[i].hz != null) return i;
        return -1;
      })();
      if (firstActive >= 0) onsetMs = window[firstActive].t - startMs;
      if (lastActive >= 0) offsetMs = window[lastActive].t - endMs;

      return buildNoteResult(idx, note, endMs - startMs, {
        detectedOnsetMs: onsetMs,
        detectedOffsetMs: offsetMs,
        avgHz,
      }, {
        pitchToleranceCents: settings.pitchToleranceCents,
        timingToleranceMs: settings.timingToleranceMs,
        durationToleranceRatio: settings.durationToleranceRatio,
        tuningHz: settings.tuningHz,
      });
    });

    // For E2E mode, fabricate plausible results so we exercise the result path
    if (isE2E) {
      for (let i = 0; i < noteResults.length; i++) {
        const r = noteResults[i];
        if (r.expectedPitch === 'rest') continue;
        r.pitchScore = 90;
        r.timingScore = 85;
        r.durationScore = 80;
        r.totalScore = 85;
        r.detectedPitchHz = noteToHz(r.expectedPitch, settings.tuningHz);
        r.pitchDeviationCents = 5;
        r.onsetDeviationMs = 30;
        r.offsetDeviationMs = -10;
        r.durationRatio = 1.05;
      }
    }

    const summary = summarizeSession(noteResults);
    const startedAt = new Date(Date.now() - elapsedMs).toISOString();
    const session: Session = {
      id: crypto.randomUUID(),
      presetId: preset.id,
      presetTitle: preset.title,
      instrument: settings.instrument,
      transposition: settings.transposition,
      tuningHz: settings.tuningHz,
      bpm,
      startedAt,
      endedAt: new Date().toISOString(),
      durationSec: Math.round(elapsedMs / 1000),
      ...summary,
      noteResults,
    };
    await recordSession(session);
    if (micRef.current) micRef.current.stop();
    micRef.current = null;
    setPhase('done');
    navigate(`/result/${session.id}`);
  };

  const abort = async (savePartial: boolean) => {
    if (savePartial) {
      await finalize();
    } else {
      cancelAnimationFrame(rafRef.current);
      if (metronomeRef.current) metronomeRef.current.stop();
      if (micRef.current) micRef.current.stop();
      navigate('/');
    }
  };

  if (!preset) {
    return <div className="card p-6 text-center font-bold">😢 プリセットが見つかりません</div>;
  }

  if (phase === 'error') {
    return (
      <div className="card p-6 space-y-4" data-testid="practice-error">
        <h1 className="text-xl font-extrabold text-pop-rose">🎤 マイクが利用できません</h1>
        <p className="font-bold">{errorMsg}</p>
        <p className="text-muted text-sm font-bold">ブラウザのサイト設定からマイクの許可を確認してください。</p>
        <button onClick={() => navigate('/presets')} className="btn-sub">戻る</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {phase === 'init' && (
        <div className="text-muted font-bold" data-testid="practice-init">🎤 マイクを準備しています…</div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold">🎼 {preset.title}</h1>
        <div className="text-sm font-bold text-pop-violet">♩ = {bpm}</div>
      </div>
      <PitchMeter cents={liveCents} noteName={liveNote} />
      {phase === 'countdown' && <Countdown value={countdownVal} />}
      <ScoreScroller
        notes={preset.notes}
        bpm={bpm}
        elapsedMs={elapsedMs}
        transposition={settings.transposition}
        perNoteStatus={perNoteStatus}
        liveCents={liveCents}
      />
      <div className="flex gap-2">
        <button
          onClick={() => {
            pauseRef.current = !pauseRef.current;
            setPhase((p) => (p === 'play' ? 'paused' : 'play'));
          }}
          className="btn-sub"
          data-testid="pause-btn"
        >
          {phase === 'paused' ? '▶️ 再開' : '⏸️ 一時停止'}
        </button>
        <button
          onClick={() => abort(true)}
          className="rounded-full px-5 py-2.5 font-bold text-white bg-gradient-to-r from-pop-orange to-pop-yellow shadow-pop transition hover:-translate-y-0.5 active:translate-y-0"
          data-testid="finish-now"
        >
          🏁 ここまでで終了
        </button>
        <button
          onClick={() => abort(false)}
          className="rounded-full px-5 py-2.5 font-bold text-white bg-pop-rose shadow-pop transition hover:-translate-y-0.5 active:translate-y-0"
          data-testid="abort-discard"
        >
          中断（破棄）
        </button>
        {isE2E && phase === 'play' && (
          <button
            onClick={finalize}
            data-testid="e2e-finalize"
            className="rounded-full px-5 py-2.5 font-bold text-white bg-pop-violet shadow-pop"
          >
            E2E: 即終了
          </button>
        )}
      </div>
    </div>
  );
}
