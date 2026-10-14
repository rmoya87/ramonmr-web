import { FIXED_DT, MAX_FRAME_DT, MAX_PHYSICS_STEPS } from './config.js';

export type LoopCallbacks = {
  update: (dt: number) => void;
  render: (alpha: number, frameDt: number) => void;
  shouldSimulate: () => boolean;
};

/** Fixed-timestep simulation with render interpolation alpha. */
export class GameLoop {
  private last = 0;
  private acc = 0;
  private raf = 0;
  private running = false;

  constructor(private readonly cb: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.acc = 0;
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Drop accumulated time after pause/tab restore to avoid spirals. */
  resetClock(): void {
    this.last = 0;
    this.acc = 0;
  }

  private frame(t: number): void {
    if (!this.running) return;
    const raw = this.last ? (t - this.last) / 1000 : FIXED_DT;
    this.last = t;
    const frameDt = Math.min(MAX_FRAME_DT, Math.max(0, raw));

    if (this.cb.shouldSimulate()) {
      this.acc += frameDt;
      let steps = 0;
      while (this.acc >= FIXED_DT && steps < MAX_PHYSICS_STEPS) {
        this.cb.update(FIXED_DT);
        this.acc -= FIXED_DT;
        steps++;
      }
      if (steps >= MAX_PHYSICS_STEPS) this.acc = 0;
    } else {
      this.acc = 0;
    }

    const alpha = this.cb.shouldSimulate() ? this.acc / FIXED_DT : 0;
    this.cb.render(alpha, frameDt);
    this.raf = requestAnimationFrame((nt) => this.frame(nt));
  }
}
