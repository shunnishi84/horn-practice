// Simple energy-threshold onset detector with hysteresis. Returns true when
// transitioning from silence -> sound.
export class EnergyOnsetDetector {
  private wasActive = false;
  private noiseFloor = 0.005;
  constructor(private threshold = 0.012, private release = 0.006) {}

  step(rms: number, hz: number | null): { onset: boolean; offset: boolean; active: boolean } {
    let onset = false;
    let offset = false;
    const active = rms > this.threshold && hz !== null;
    if (active && !this.wasActive) onset = true;
    if (!active && this.wasActive && rms < this.release) offset = true;
    this.wasActive = active;
    return { onset, offset, active: this.wasActive };
  }
}
