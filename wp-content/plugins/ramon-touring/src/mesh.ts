export type V = { x: number; y: number; z: number };
export type Face = { v: V[]; c: string; wheel?: { y: number; z: number } };
export type Cam = { pos: V; target: V; fov: number };

export const v = (x: number, y: number, z: number): V => ({ x, y, z });

export function shade(c: string, n: number): string {
  if (!c.startsWith('#')) return c;
  const k = parseInt(c.slice(1), 16);
  return (
    '#' +
    [k >> 16, (k >> 8) & 255, k & 255]
      .map((x) => Math.min(255, Math.max(0, Math.round(x * n))).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function box(a: Face[], x: number, y: number, z: number, w: number, h: number, d: number, c: string, ry = 0): void {
  const q = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ].map(([i, j, k]) =>
    v(
      x + (i * w) / 2 * Math.cos(ry) + (k * d) / 2 * Math.sin(ry),
      y + (j * h) / 2,
      z - (i * w) / 2 * Math.sin(ry) + (k * d) / 2 * Math.cos(ry),
    ),
  );
  (
    [
      [0, 1, 2, 3],
      [5, 4, 7, 6],
      [4, 0, 3, 7],
      [1, 5, 6, 2],
      [3, 2, 6, 7],
      [4, 5, 1, 0],
    ] as number[][]
  ).forEach((f, i) => a.push({ v: f.map((n) => q[n]), c: shade(c, [0.75, 0.82, 0.65, 0.9, 1.08, 0.55][i]) }));
}

export function cylinder(a: Face[], x: number, y: number, z: number, r: number, w: number, c: string, spin = 0): void {
  for (let i = 0; i < 8; i++) {
    const t = (i * Math.PI) / 4 + spin;
    const u = t + Math.PI / 4;
    const p = [
      v(x - w / 2, y + Math.cos(t) * r, z + Math.sin(t) * r),
      v(x + w / 2, y + Math.cos(t) * r, z + Math.sin(t) * r),
      v(x + w / 2, y + Math.cos(u) * r, z + Math.sin(u) * r),
      v(x - w / 2, y + Math.cos(u) * r, z + Math.sin(u) * r),
    ];
    a.push({ v: p, c: shade(c, 0.6 + 0.25 * Math.cos(t)) });
  }
  for (const side of [-1, 1]) {
    a.push({
      v: Array.from({ length: 8 }, (_, i) => v(x + (side * w) / 2, y + Math.cos((i * Math.PI) / 4) * r, z + Math.sin((i * Math.PI) / 4) * r)),
      c: '#22272c',
    });
    a.push({
      v: Array.from({ length: 10 }, (_, i) =>
        v(x + side * (w / 2 + 0.004), y + Math.cos((i * Math.PI) / 5) * r * 0.64, z + Math.sin((i * Math.PI) / 5) * r * 0.64),
      ),
      c: '#a8afb3',
    });
    for (let i = 0; i < 5; i++) {
      const t = (i * Math.PI) / 2.5 + spin;
      a.push({
        v: [
          v(x + side * (w / 2 + 0.008), y, z),
          v(x + side * (w / 2 + 0.008), y + Math.cos(t) * r * 0.57, z + Math.sin(t) * r * 0.57),
          v(x + side * (w / 2 + 0.008), y + Math.cos(t + 0.18) * r * 0.57, z + Math.sin(t + 0.18) * r * 0.57),
        ],
        c: '#30383f',
        wheel: { y, z },
      });
    }
  }
}

function prism(a: Face[], side: number[][], width: number, c: string): void {
  const l = side.map(([y, z]) => v(-width / 2, y, z));
  const r = side.map(([y, z]) => v(width / 2, y, z));
  a.push({ v: l, c: shade(c, 0.72) }, { v: r.slice().reverse(), c: shade(c, 0.92) });
  for (let i = 0; i < side.length; i++) {
    const j = (i + 1) % side.length;
    a.push({ v: [l[i], r[i], r[j], l[j]], c: shade(c, i === 1 ? 1.15 : 0.95) });
  }
}

const carCache = new Map<string, Face[]>();

export function car(
  a: Face[],
  x: number,
  z: number,
  color: string,
  opts: { angle?: number; roll?: number; spin?: number; hood?: number | boolean; lights?: boolean; brake?: boolean; steer?: number } = {},
): void {
  const key = color + ':' + !!opts.hood + ':' + !!opts.lights + ':' + !!opts.brake;
  let b = carCache.get(key);
  if (!b) {
    b = [];
    // Lower body / rocker
    box(b, 0, 0.42, 0, 2.05, 0.55, 4.35, shade(color, 0.82));
    // Hood
    box(b, 0, 0.82, 1.35, 1.92, 0.28, 1.55, color);
    // Cabin base
    box(b, 0, 0.95, -0.15, 1.95, 0.42, 1.85, color);
    // Roof
    box(b, 0, 1.48, -0.2, 1.55, 0.12, 1.35, shade(color, 0.92));
    // Trunk
    box(b, 0, 0.88, -1.75, 1.9, 0.32, 1.05, color);
    // Chin / rear bumper chrome
    box(b, 0, 0.38, 2.28, 1.95, 0.22, 0.18, '#1a2228');
    box(b, 0, 0.4, -2.28, 1.92, 0.2, 0.16, '#1a2228');
    box(b, 0, 0.55, -2.32, 1.7, 0.08, 0.06, '#c8c2b4');
    if (opts.hood) {
      box(b, 0, 0.87, 1.36, 1.55, 0.06, 1.25, '#192228');
      box(b, 0, 1.03, 1.4, 0.75, 0.2, 0.65, '#8e989d');
    }
    prism(b, [[0.99, -1.15], [1.48, -0.7], [1.5, 0.32], [1, 0.98]], 1.52, '#3a4e58');
    // Glass panes (brighter so cabin reads clearly)
    b.push({ c: '#a8d0e0', v: [v(-0.72, 1.48, 0.34), v(0.72, 1.48, 0.34), v(0.79, 1.01, 0.99), v(-0.79, 1.01, 0.99)] });
    b.push({ c: '#5a7a88', v: [v(-0.72, 1.48, -0.71), v(0.72, 1.48, -0.71), v(0.79, 1.01, -1.17), v(-0.79, 1.01, -1.17)] });
    for (const side of [-1, 1]) {
      box(b, side * 0.8, 1.22, -0.2, 0.05, 0.42, 0.08, shade(color, 1.05));
      box(b, side * 0.86, 0.95, -0.1, 0.05, 0.08, 2.35, shade(color, 0.9));
      box(b, side * 1.0, 0.55, 0, 0.06, 0.1, 2.1, '#4a555c');
      box(b, side * 0.9, 0.95, 0.55, 0.14, 0.07, 0.3, shade(color, 1.08));
      box(b, side * 1.02, 1.1, 0.6, 0.18, 0.12, 0.28, shade(color, 1.12));
      box(b, side * 0.92, 1.22, -0.15, 0.03, 0.3, 1.15, '#7aa4b4');
      for (const f of [-1, 1]) cylinder(b, side * 1.08, 0.42, f * 1.38, 0.46, 0.32, '#1c2024', 0);
    }
    if (opts.hood) {
      const panel: Face[] = [];
      box(panel, 0, 1.02, 1.45, 1.62, 0.065, 1.1, color);
      for (const f of panel) {
        b.push({
          c: f.c,
          v: f.v.map((p) => {
            const yy = p.y - 1;
            const zz = p.z - 0.9;
            return v(p.x, 1 + yy * Math.cos(-1.05) - zz * Math.sin(-1.05), 0.9 + yy * Math.sin(-1.05) + zz * Math.cos(-1.05));
          }),
        });
      }
      box(b, 0, 0.99, 1.5, 1.34, 0.04, 0.9, '#192228');
      box(b, 0, 1.08, 1.4, 0.7, 0.14, 0.55, '#8e989d');
    }
    for (const side of [-1, 1]) {
      box(b, side * 0.68, 0.72, -2.28, 0.55, 0.14, 0.06, opts.brake ? '#ff3a28' : '#e04030');
      box(b, side * 0.7, 0.7, 2.28, 0.5, 0.16, 0.06, opts.lights ? '#fff8d0' : '#e8e4c8');
      box(b, side * 0.72, 0.36, -2.28, 0.16, 0.1, 0.14, '#b0bcbc');
    }
    box(b, 0, 0.62, -2.34, 0.5, 0.14, 0.04, '#efe9d4');
    // Spoiler lip for silhouette
    box(b, 0, 1.12, -2.15, 1.5, 0.06, 0.18, shade(color, 0.88));
    carCache.set(key, b);
  }
  const angle = opts.angle || 0;
  const roll = opts.roll || 0;
  const steer = opts.steer || 0;
  for (const f of b) {
    a.push({
      c: f.c,
      v: f.v.map((original) => {
        let p = original;
        if (f.wheel) {
          const t = opts.spin || 0;
          const y = p.y - f.wheel.y;
          const z0 = p.z - f.wheel.z;
          p = v(p.x, f.wheel.y + y * Math.cos(t) - z0 * Math.sin(t), f.wheel.z + y * Math.sin(t) + z0 * Math.cos(t));
          // Front wheels yaw with steer
          if (f.wheel.z > 0.5 && Math.abs(steer) > 0.01) {
            const lx = p.x;
            const lz = p.z - f.wheel.z;
            p = v(
              Math.cos(steer) * lx + Math.sin(steer) * lz,
              p.y,
              f.wheel.z - Math.sin(steer) * lx + Math.cos(steer) * lz,
            );
          }
        }
        const xx = p.x * Math.cos(roll) - p.y * Math.sin(roll);
        const yy = p.y * Math.cos(roll) + p.x * Math.sin(roll);
        return v(x + xx * Math.cos(angle) + p.z * Math.sin(angle), yy, z - xx * Math.sin(angle) + p.z * Math.cos(angle));
      }),
    });
  }
}

export function renderer(c: CanvasRenderingContext2D, w: number, h: number, cam: Cam, depthTest = false) {
  const image = depthTest ? c.getImageData(0, 0, w, h) : null;
  const depth = depthTest ? new Float32Array(w * h).fill(Infinity) : null;
  const dz = cam.target.z - cam.pos.z;
  const dx = cam.target.x - cam.pos.x;
  const dy = cam.target.y - cam.pos.y;
  const len = Math.hypot(dx, dy, dz);
  const f = v(dx / len, dy / len, dz / len);
  const rr = Math.hypot(f.z, f.x);
  const r = v(f.z / rr, 0, -f.x / rr);
  const u = v(f.y * r.z, f.z * r.x - f.x * r.z, -f.y * r.x);
  function coord(p: V) {
    const x = p.x - cam.pos.x;
    const y = p.y - cam.pos.y;
    const z = p.z - cam.pos.z;
    return v(x * r.x + y * r.y + z * r.z, x * u.x + y * u.y + z * u.z, x * f.x + y * f.y + z * f.z);
  }
  function project(p: V) {
    const q = coord(p);
    return { x: w / 2 + (q.x * cam.fov) / q.z, y: h / 2 - (q.y * cam.fov) / q.z, z: q.z };
  }
  return {
    project,
    draw(a: Face[], ordered = false) {
      const faces = a
        .map((face) => {
          const q = face.v.map(coord);
          const out: V[] = [];
          for (let i = 0; i < q.length; i++) {
            const A = q[i];
            const B = q[(i + 1) % q.length];
            if (A.z >= 0.2) out.push(A);
            if (A.z >= 0.2 !== B.z >= 0.2) {
              const t = (0.2 - A.z) / (B.z - A.z);
              out.push(v(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, 0.2));
            }
          }
          return { f: face, q: out, depth: out.reduce((sum, p) => sum + p.z, 0) / out.length };
        })
        .filter((o) => o.q.length > 2);
      if (!ordered) faces.sort((A, B) => B.depth - A.depth);
      for (const { f: face, q } of faces) {
        if (image && depth) {
          const pts = q.map((p) => ({ x: w / 2 + (p.x * cam.fov) / p.z, y: h / 2 - (p.y * cam.fov) / p.z, iz: 1 / p.z }));
          const rgb = parseInt(face.c.slice(1), 16);
          for (let j = 1; j < pts.length - 1; j++) {
            const A = pts[0];
            const B = pts[j];
            const C = pts[j + 1];
            const den = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
            if (Math.abs(den) < 0.001) continue;
            const x0 = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
            const x1 = Math.min(w - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
            const y0 = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
            const y1 = Math.min(h - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
            for (let y = y0; y <= y1; y++) {
              for (let x = x0; x <= x1; x++) {
                const aa = ((B.y - C.y) * (x + 0.5 - C.x) + (C.x - B.x) * (y + 0.5 - C.y)) / den;
                const bb = ((C.y - A.y) * (x + 0.5 - C.x) + (A.x - C.x) * (y + 0.5 - C.y)) / den;
                const dd = 1 - aa - bb;
                if (aa < -0.0001 || bb < -0.0001 || dd < -0.0001) continue;
                const z = 1 / (aa * A.iz + bb * B.iz + dd * C.iz);
                const idx = y * w + x;
                if (z < depth[idx]) {
                  depth[idx] = z;
                  image.data[idx * 4] = rgb >> 16;
                  image.data[idx * 4 + 1] = (rgb >> 8) & 255;
                  image.data[idx * 4 + 2] = rgb & 255;
                  image.data[idx * 4 + 3] = 255;
                }
              }
            }
          }
        } else {
          c.beginPath();
          q.forEach((p, i) => {
            const xx = w / 2 + (p.x * cam.fov) / p.z;
            const yy = h / 2 - (p.y * cam.fov) / p.z;
            i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
          });
          c.closePath();
          c.fillStyle = face.c;
          c.fill();
        }
      }
      if (image) c.putImageData(image, 0, 0);
    },
  };
}

export function quad(a: Face[], x1: number, z1: number, x2: number, z2: number, width: number, color: string, y = 0.01): void {
  a.push({
    c: color,
    v: [v(x1 - width / 2, y, z1), v(x1 + width / 2, y, z1), v(x2 + width / 2, y, z2), v(x2 - width / 2, y, z2)],
  });
}
