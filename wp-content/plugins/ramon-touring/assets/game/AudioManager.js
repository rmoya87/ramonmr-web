/** Procedural Web Audio — no external assets, no autoplay before unlock. */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.unlocked = false;
        this.engine = null;
        this.engineGain = null;
        this.master = 0.8;
        this.sfx = 0.8;
        this.music = 0.4;
        this.muted = false;
    }
    async unlock() {
        if (this.unlocked)
            return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC)
            return;
        this.ctx = new AC();
        if (this.ctx.state === 'suspended')
            await this.ctx.resume();
        this.unlocked = true;
        this.startEngine();
    }
    setPaused(paused) {
        if (!this.ctx)
            return;
        if (paused)
            void this.ctx.suspend();
        else
            void this.ctx.resume();
    }
    vol(kind = 'sfx') {
        if (this.muted || !this.unlocked)
            return 0;
        const base = kind === 'music' ? this.music : this.sfx;
        return this.master * base;
    }
    startEngine() {
        if (!this.ctx || this.engine)
            return;
        this.engine = this.ctx.createOscillator();
        this.engine.type = 'sawtooth';
        this.engine.frequency.value = 40;
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.value = 0;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        this.engine.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engine.start();
    }
    updateEngine(speed, accel) {
        if (!this.engine || !this.engineGain || !this.ctx)
            return;
        const t = this.ctx.currentTime;
        const freq = 40 + speed * 0.55 + (accel ? 12 : 0);
        this.engine.frequency.setTargetAtTime(freq, t, 0.05);
        this.engineGain.gain.setTargetAtTime(this.vol() * Math.min(0.12, 0.02 + speed / 2500), t, 0.08);
    }
    beep(freq, dur = 0.08, type = 'square', gain = 0.08) {
        if (!this.ctx || this.vol() <= 0)
            return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = gain * this.vol();
        o.connect(g);
        g.connect(this.ctx.destination);
        const t = this.ctx.currentTime;
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.start(t);
        o.stop(t + dur);
    }
    play(name) {
        switch (name) {
            case 'hit':
                this.beep(90, 0.2, 'sawtooth', 0.12);
                break;
            case 'pass':
                this.beep(520, 0.06, 'triangle', 0.06);
                break;
            case 'combo':
                this.beep(660, 0.07, 'triangle', 0.07);
                this.beep(880, 0.08, 'triangle', 0.05);
                break;
            case 'level':
                this.beep(440, 0.1, 'square', 0.06);
                this.beep(660, 0.12, 'square', 0.05);
                break;
            case 'mission':
                this.beep(523, 0.1, 'sine', 0.08);
                this.beep(784, 0.15, 'sine', 0.07);
                break;
            case 'exit':
                this.beep(300, 0.15, 'triangle', 0.07);
                break;
            case 'brake':
                this.beep(120, 0.05, 'sawtooth', 0.04);
                break;
            case 'ui':
                this.beep(480, 0.04, 'sine', 0.04);
                break;
            default: {
                const _exhaustive = name;
                void _exhaustive;
            }
        }
    }
}
