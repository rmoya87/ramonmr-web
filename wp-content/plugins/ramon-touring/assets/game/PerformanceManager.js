const PRESETS = {
    low: { drawDistance: 240, propStep: 34, shadows: true, particles: false, resolutionScale: 0.95, maxTrafficDraw: 10 },
    medium: { drawDistance: 320, propStep: 26, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 14 },
    high: { drawDistance: 380, propStep: 20, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 18 },
};
export class PerformanceManager {
    constructor() {
        this.profile = 'auto';
        this.resolved = 'medium';
        this.samples = [];
        this.lastAdjust = 0;
        this.resolved = this.detect();
    }
    setProfile(p) {
        this.profile = p;
        if (p !== 'auto')
            this.resolved = p;
    }
    settings() {
        return PRESETS[this.resolved];
    }
    detect() {
        const mem = navigator.deviceMemory;
        const cores = navigator.hardwareConcurrency || 4;
        if ((mem && mem <= 2) || cores <= 2)
            return 'low';
        if ((mem && mem >= 8) || cores >= 8)
            return 'high';
        return 'medium';
    }
    sampleFrame(drawMs, now) {
        this.samples.push(drawMs);
        if (this.samples.length > 45)
            this.samples.shift();
        if (this.profile !== 'auto' || now - this.lastAdjust < 5000)
            return;
        const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
        this.lastAdjust = now;
        if (avg > 22 && this.resolved !== 'low') {
            this.resolved = this.resolved === 'high' ? 'medium' : 'low';
        }
        else if (avg < 11 && this.resolved !== 'high') {
            this.resolved = this.resolved === 'low' ? 'medium' : 'high';
        }
    }
}
/**
 * Size the buffer near native device pixels for a smoother (less blocky) look.
 * Cap total pixels so the software projector stays interactive.
 */
export function sizeGameCanvas(canvas, resolutionScale) {
    const r = canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2)
        return false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = Math.max(1, Math.round(r.width * dpr * resolutionScale));
    let h = Math.max(1, Math.round(r.height * dpr * resolutionScale));
    const maxW = 1920;
    const maxPixels = 2400000;
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
    if (canvas.width === w && canvas.height === h)
        return false;
    canvas.width = w;
    canvas.height = h;
    return true;
}
export function prepareDrawContext(ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
}
