/**
 * Headless visual/playability gates for the soft-3D renderer.
 * Fails if the road scene lacks continuity cues or the car loses glass/gloss.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const assets = join(root, 'assets');

function mockDocument() {
  globalThis.document = {
    createElement() {
      const canvas = {
        width: 640,
        height: 180,
        getContext() {
          return createRecordingContext(640, 180);
        },
      };
      return canvas;
    },
  };
}

function createRecordingContext(w, h) {
  const fills = [];
  const styles = new Set();
  const ops = { fillRect: 0, ellipse: 0, arc: 0, fill: 0 };
  const ctx = {
    canvas: { width: w, height: h },
    fillStyle: '#000000',
    strokeStyle: '#000000',
    globalAlpha: 1,
    lineWidth: 1,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    font: '16px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    set fillStyle(v) {
      this._fill = v;
      if (typeof v === 'string') styles.add(v);
    },
    get fillStyle() {
      return this._fill;
    },
    createLinearGradient() {
      const g = { stops: [] };
      g.addColorStop = (o, c) => {
        g.stops.push([o, c]);
        if (typeof c === 'string') styles.add(c);
      };
      return g;
    },
    createRadialGradient() {
      return this.createLinearGradient();
    },
    clearRect() {},
    fillRect(x, y, fw, fh) {
      ops.fillRect++;
      fills.push({ x, y, w: fw, h: fh, c: this._fill });
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {
      ops.fill++;
    },
    stroke() {},
    arc() {
      ops.arc++;
    },
    ellipse() {
      ops.ellipse++;
    },
    save() {},
    restore() {},
    clip() {},
    setTransform() {},
    drawImage() {},
    measureText(t) {
      return { width: String(t).length * 10 };
    },
    fillText() {},
    getImageData(x, y, iw, ih) {
      return { data: new Uint8ClampedArray(iw * ih * 4), width: iw, height: ih };
    },
    putImageData() {},
    _fills: fills,
    _styles: styles,
    _ops: ops,
  };
  ctx._fill = '#000000';
  return ctx;
}

describe('Render quality gates', () => {
  let drawRoad;
  let car;
  let createRun;

  before(async () => {
    mockDocument();
    ({ drawRoad } = await import(join(assets, 'world.js')));
    ({ car } = await import(join(assets, 'mesh.js')));
    ({ createRun } = await import(join(assets, 'game/GameManager.js')));
  });

  it('car mesh includes reflective glass + gloss (arcade soft)', () => {
    const faces = [];
    car(faces, 0, 0, '#c23a2b', { lights: true });
    assert.ok(faces.length >= 90, `expected detailed car mesh, got ${faces.length} faces`);
    const colors = faces.map((f) => f.c.toLowerCase());
    const glass = colors.some((c) => /#(1e3a4c|8ec8e0|eef6fc|bee0f0)/.test(c));
    const gloss = colors.some((c) => c === '#e8eef4' || c.startsWith('#e') || c.startsWith('#f'));
    assert.ok(glass, 'missing LOOK.glass colors on car');
    assert.ok(gloss, 'missing gloss highlight colors on car');
  });

  it('look bible exports shared materials', async () => {
    const { LOOK, mixHex, fogToward } = await import(join(assets, 'look.js'));
    assert.equal(LOOK.glass.tint, '#1e3a4c');
    assert.equal(LOOK.asphalt.day.length, 7);
    assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
    assert.ok(fogToward('#5c646c', '#e8dcc8', 200).startsWith('#'));
  });

  it('road scene paints full-bleed sky + ground (no void start)', () => {
    const W = 960;
    const H = 540;
    const ctx = createRecordingContext(W, H);
    const s = createRun('arcade', 'coast');
    s.d = 40;
    s.speed = 90;
    drawRoad(ctx, s, W, H, {
      color: '#c23a2b',
      camera: 0,
      brake: false,
      lights: false,
      environment: 'coast',
      weather: 'clear',
      quality: {
        drawDistance: 280,
        propStep: 30,
        shadows: true,
        particles: false,
        resolutionScale: 1,
        maxTrafficDraw: 8,
      },
      reduceEffects: true,
    });
    assert.ok(ctx._ops.fillRect >= 2, 'expected sky/ground fillRect passes');
    const fullBleed = ctx._fills.some((f) => f.x === 0 && f.w === W && f.h >= H * 0.4);
    assert.ok(fullBleed, 'sky/ground should cover full canvas width');
    const styleList = [...ctx._styles].join(' ');
    assert.match(styleList, /#|rgb|hsl/, 'expected painted colors');
    // Asphalt / verge cues from the 3D strip painter
    const asphaltish = [...ctx._styles].some((c) => typeof c === 'string' && /^#([3-6][0-9a-f]){3}$/i.test(c));
    assert.ok(asphaltish || ctx._ops.fill >= 3, 'expected asphalt / terrain fill styles');
  });

  it('traffic spawn gaps stay playable', async () => {
    const { createInitialTraffic } = await import(join(assets, 'game/TrafficManager.js'));
    const { TRAFFIC } = await import(join(assets, 'game/config.js'));
    const { traffic } = createInitialTraffic('arcade');
    assert.ok(traffic.length >= 6, 'need a traffic pool');
    const sorted = traffic.slice().sort((a, b) => a.d - b.d);
    let minGap = Infinity;
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i].x - sorted[i - 1].x) < 1.5) {
        minGap = Math.min(minGap, sorted[i].d - sorted[i - 1].d);
      }
    }
    assert.ok(minGap >= TRAFFIC.minGap * 0.7 || minGap === Infinity, `lane gap too tight: ${minGap}`);
    assert.ok(sorted[0].d >= 100, 'first car too close to player spawn');
  });
});
