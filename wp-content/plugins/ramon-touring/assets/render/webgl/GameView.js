import * as THREE from 'three';
import { RoadWorld } from './RoadWorld.js';
import { GarageWorld } from './GarageWorld.js';
import { sectionLabels } from '../../labels.js';
/**
 * Owns WebGLRenderer + road/garage worlds.
 * Must be the only owner of the canvas WebGL context (never call getContext('2d')).
 */
export class GameView {
    constructor(canvas) {
        this.canvas = canvas;
        this.road = new RoadWorld();
        this.garage = new GarageWorld();
        this.mode = 'road';
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'default',
        });
        this.renderer.setClearColor(0x1a2834, 1);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    setMode(mode) {
        this.mode = mode;
    }
    resize(cssW, cssH, resolutionScale) {
        const dpr = Math.min(2, window.devicePixelRatio || 1) * resolutionScale;
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(cssW, cssH, false);
    }
    renderRoad(s, opts) {
        this.mode = 'road';
        const w = this.canvas.clientWidth || 1;
        const h = this.canvas.clientHeight || 1;
        const st = performance.now();
        this.road.update(s, {
            ...opts,
            sectionLabels: opts.sectionLabels || sectionLabels,
        }, w / h);
        this.renderer.render(this.road.scene, this.road.camera);
        return performance.now() - st;
    }
    renderGarage(opts) {
        this.mode = 'garage';
        const w = this.canvas.clientWidth || 1;
        const h = this.canvas.clientHeight || 1;
        const st = performance.now();
        this.garage.update({ ...opts, aspect: w / h });
        this.renderer.render(this.garage.scene, this.garage.camera);
        return performance.now() - st;
    }
    dispose() {
        this.road.dispose();
        this.garage.dispose();
        this.renderer.dispose();
    }
}
