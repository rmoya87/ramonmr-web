import type { QualityProfile } from './config.js';

export type QualitySettings = {
  drawDistance: number;
  propStep: number;
  shadows: boolean;
  particles: boolean;
  resolutionScale: number;
  maxTrafficDraw: number;
};

const PRESETS: Record<'low' | 'medium' | 'high', QualitySettings> = {
  low: { drawDistance: 220, propStep: 40, shadows: false, particles: false, resolutionScale: 0.7, maxTrafficDraw: 8 },
  medium: { drawDistance: 300, propStep: 28, shadows: true, particles: true, resolutionScale: 0.85, maxTrafficDraw: 12 },
  high: { drawDistance: 360, propStep: 22, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 16 },
};

export class PerformanceManager {
  profile: QualityProfile = 'auto';
  private resolved: 'low' | 'medium' | 'high' = 'medium';
  private samples: number[] = [];
  private lastAdjust = 0;

  constructor() {
    this.resolved = this.detect();
  }

  setProfile(p: QualityProfile): void {
    this.profile = p;
    if (p !== 'auto') this.resolved = p;
  }

  settings(): QualitySettings {
    return PRESETS[this.resolved];
  }

  private detect(): 'low' | 'medium' | 'high' {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    if ((mem && mem <= 2) || cores <= 2) return 'low';
    if ((mem && mem >= 8) || cores >= 8) return 'high';
    return 'medium';
  }

  sampleFrame(drawMs: number, now: number): void {
    this.samples.push(drawMs);
    if (this.samples.length > 45) this.samples.shift();
    if (this.profile !== 'auto' || now - this.lastAdjust < 4000) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.lastAdjust = now;
    if (avg > 18 && this.resolved !== 'low') {
      this.resolved = this.resolved === 'high' ? 'medium' : 'low';
    } else if (avg < 9 && this.resolved !== 'high') {
      this.resolved = this.resolved === 'low' ? 'medium' : 'high';
    }
  }
}
