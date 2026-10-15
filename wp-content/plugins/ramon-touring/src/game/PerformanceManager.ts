import type { QualityProfile } from './config.js';

export type QualitySettings = {
  drawDistance: number;
  propStep: number;
  shadows: boolean;
  particles: boolean;
  resolutionScale: number;
  maxTrafficDraw: number;
};

/** Prefer sharp output; low only dips slightly for weak devices. */
const PRESETS: Record<'low' | 'medium' | 'high', QualitySettings> = {
  low: { drawDistance: 240, propStep: 36, shadows: true, particles: false, resolutionScale: 0.9, maxTrafficDraw: 10 },
  medium: { drawDistance: 320, propStep: 26, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 14 },
  high: { drawDistance: 380, propStep: 20, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 18 },
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
    // Stay sharper longer; only drop when clearly struggling.
    if (avg > 22 && this.resolved !== 'low') {
      this.resolved = this.resolved === 'high' ? 'medium' : 'low';
    } else if (avg < 11 && this.resolved !== 'high') {
      this.resolved = this.resolved === 'low' ? 'medium' : 'high';
    }
  }
}

/** Size canvas buffer for sharp display (DPR-aware, no pixel-art upscale). */
export function sizeGameCanvas(canvas: HTMLCanvasElement, resolutionScale: number): boolean {
  const r = canvas.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = Math.max(1, Math.round(r.width * dpr * resolutionScale));
  let h = Math.max(1, Math.round(r.height * dpr * resolutionScale));
  // Soft cap keeps the software renderer playable on large displays.
  const maxW = 1920;
  if (w > maxW) {
    const f = maxW / w;
    w = maxW;
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
