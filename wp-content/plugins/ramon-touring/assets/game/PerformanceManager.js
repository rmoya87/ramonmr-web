const PRESETS = {
    low: { drawDistance: 220, propStep: 40, shadows: false, particles: false, resolutionScale: 0.7, maxTrafficDraw: 8 },
    medium: { drawDistance: 300, propStep: 28, shadows: true, particles: true, resolutionScale: 0.85, maxTrafficDraw: 12 },
    high: { drawDistance: 360, propStep: 22, shadows: true, particles: true, resolutionScale: 1, maxTrafficDraw: 16 },
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
        if (this.profile !== 'auto' || now - this.lastAdjust < 4000)
            return;
        const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
        this.lastAdjust = now;
        if (avg > 18 && this.resolved !== 'low') {
            this.resolved = this.resolved === 'high' ? 'medium' : 'low';
        }
        else if (avg < 9 && this.resolved !== 'high') {
            this.resolved = this.resolved === 'low' ? 'medium' : 'high';
        }
    }
}
