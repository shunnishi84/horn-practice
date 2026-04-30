export interface MicSession {
  ctx: AudioContext;
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  analyser: AnalyserNode;
  sampleRate: number;
  stop: () => void;
}

export async function startMic(deviceId?: string): Promise<MicSession> {
  const constraints: MediaStreamConstraints = {
    audio: deviceId
      ? { deviceId: { exact: deviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      : { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
  if (ctx.state === 'suspended') await ctx.resume();
  const source = ctx.createMediaStreamSource(stream);

  // Highpass filter to reduce low-frequency noise
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 60;
  source.connect(hp);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096;
  analyser.smoothingTimeConstant = 0;
  hp.connect(analyser);

  const stop = () => {
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      ctx.close();
    } catch {}
  };

  return { ctx, stream, source, analyser, sampleRate: ctx.sampleRate, stop };
}

export async function listAudioInputs(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audioinput');
}
