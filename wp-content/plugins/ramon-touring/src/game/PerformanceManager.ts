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
  low: { drawDistance: 260, propStep: 28, shadows: true, particles: false, resolutionScale: 0.95, maxTrafficDraw: 10 },
  medium: { drawDistance: 340, propStep: 20, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 14 },
  high: { drawDistance: 420, propStep: 14, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 18 },
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
    if (this.profile !== 'auto' || now - this.lastAdjust < 5000) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.lastAdjust = now;
    if (avg > 22 && this.resolved !== 'low') {
      this.resolved = this.resolved === 'high' ? 'medium' : 'low';
    } else if (avg < 11 && this.resolved !== 'high') {
      this.resolved = this.resolved === 'low' ? 'medium' : 'high';
    }
  }
}

/**
 * Size the buffer near native device pixels for a smoother (less blocky) look.
 * Cap total pixels so the software projector stays interactive.
 */
export function sizeGameCanvas(canvas: HTMLCanvasElement, resolutionScale: number): boolean {
  const r = canvas.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = Math.max(1, Math.round(r.width * dpr * resolutionScale));
  let h = Math.max(1, Math.round(r.height * dpr * resolutionScale));
  const maxW = 1920;
  const maxPixels = 2_400_000;
  if (w > maxW) {
    const f = maxW / w;
    w = maxW;
    h = Math.max(1, Math.round(h * f));
  }
  if (w * h > maxPixels) {
    const f = Math.sqrt(maxPixels / (w * h));
    w = Math.max(1, Math.round(w * f));
    h = Math.max(1, Math.round(h * f));
  }
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

export function prepareDrawContext(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}
