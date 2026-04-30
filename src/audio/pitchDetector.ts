import { PitchDetector } from 'pitchy';

export class LivePitchDetector {
  private detector: ReturnType<typeof PitchDetector.forFloat32Array>;
  private buffer: Float32Array<ArrayBuffer>;
  constructor(private analyser: AnalyserNode, private sampleRate: number) {
    const size = analyser.fftSize;
    this.buffer = new Float32Array(new ArrayBuffer(size * 4));
    this.detector = PitchDetector.forFloat32Array(size);
    this.detector.minVolumeDecibels = -45;
  }

  detect(): { hz: number | null; clarity: number; rms: number } {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i] * this.buffer[i];
    const rms = Math.sqrt(sum / this.buffer.length);
    // pitchy types lag behind TS lib changes; cast for compatibility
    const [pitch, clarity] = (this.detector as any).findPitch(this.buffer, this.sampleRate);
    if (clarity < 0.85 || rms < 0.005 || !isFinite(pitch) || pitch <= 0) {
      return { hz: null, clarity, rms };
    }
    return { hz: pitch, clarity, rms };
  }
}
