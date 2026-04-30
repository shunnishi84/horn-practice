export class Metronome {
  private timer: number | null = null;
  private startTime = 0;
  private nextBeat = 0;
  constructor(private ctx: AudioContext, private bpm: number, private onBeat?: (beatIndex: number) => void) {}

  start() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.startTime = this.ctx.currentTime;
    this.nextBeat = 0;
    const tick = () => {
      const beatDur = 60 / this.bpm;
      while (this.startTime + this.nextBeat * beatDur < this.ctx.currentTime + 0.1) {
        this.scheduleClick(this.startTime + this.nextBeat * beatDur, this.nextBeat % 4 === 0);
        this.onBeat?.(this.nextBeat);
        this.nextBeat++;
      }
      this.timer = window.setTimeout(tick, 25);
    };
    tick();
  }

  stop() {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleClick(when: number, accent: boolean) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.value = accent ? 1200 : 800;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.25, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + 0.06);
  }
}

export function playCountdownBeep(ctx: AudioContext, when: number, freq = 880) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.3, when + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.25);
}
