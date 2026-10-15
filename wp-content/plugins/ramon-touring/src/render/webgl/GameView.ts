import * as THREE from 'three';
import type { RunState } from '../../game/types.js';
import type { QualitySettings } from '../../game/PerformanceManager.js';
import type { EnvironmentId, WeatherId } from '../../game/config.js';
import { RoadWorld, type RoadRenderOpts } from './RoadWorld.js';
import { GarageWorld } from './GarageWorld.js';
import { sectionLabels } from '../../labels.js';

/**
 * Owns WebGLRenderer + road/garage worlds.
 * Must be the only owner of the canvas WebGL context (never call getContext('2d')).
 */
export class GameView {
  private renderer: THREE.WebGLRenderer;
  private road = new RoadWorld();
  private garage = new GarageWorld();
  private mode: 'road' | 'garage' = 'road';

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'default',
    });
    this.renderer.setClearColor(0x1a2834, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  setMode(mode: 'road' | 'garage'): void {
    this.mode = mode;
  }

  resize(cssW: number, cssH: number, resolutionScale: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1) * resolutionScale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssW, cssH, false);
  }

  renderRoad(s: RunState, opts: Omit<RoadRenderOpts, 'sectionLabels'> & { sectionLabels?: string[] }): number {
    this.mode = 'road';
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const st = performance.now();
    this.road.update(
      s,
      {
        ...opts,
        sectionLabels: opts.sectionLabels || sectionLabels,
      },
      w / h,
    );
    this.renderer.render(this.road.scene, this.road.camera);
    return performance.now() - st;
  }

  renderGarage(opts: {
    angle: number;
    zoom: number;
    color: string;
    hood: boolean;
    lights: boolean;
  }): number {
    this.mode = 'garage';
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    const st = performance.now();
    this.garage.update({ ...opts, aspect: w / h });
    this.renderer.render(this.garage.scene, this.garage.camera);
    return performance.now() - st;
  }

  dispose(): void {
    this.road.dispose();
    this.garage.dispose();
    this.renderer.dispose();
  }
}

export type { QualitySettings, EnvironmentId, WeatherId };
