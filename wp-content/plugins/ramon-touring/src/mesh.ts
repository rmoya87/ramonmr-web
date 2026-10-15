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

/** Vertical column (Y-axis) for posts, trunks and rounded props. */
export function column(a: Face[], x: number, y: number, z: number, r: number, h: number, c: string, segments = 8): void {
  const y0 = y - h / 2;
  const y1 = y + h / 2;
  for (let i = 0; i < segments; i++) {
    const t = (i * 2 * Math.PI) / segments;
    const u = ((i + 1) * 2 * Math.PI) / segments;
    const x0 = x + Math.cos(t) * r;
    const z0 = z + Math.sin(t) * r;
    const x1 = x + Math.cos(u) * r;
    const z1 = z + Math.sin(u) * r;
    a.push({
      v: [v(x0, y0, z0), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z0)],
      c: shade(c, 0.72 + 0.22 * Math.cos(t)),
    });
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

/** Layered glass: dark tint + sky band + specular edge. */
function glassPane(a: Face[], corners: [V, V, V, V], tint: string, sky: string, highlight: string): void {
  a.push({ c: tint, v: corners });
  const [A, B, C, D] = corners;
  const mix = (p: V, q: V, t: number) => v(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, p.z + (q.z - p.z) * t);
  a.push({ c: sky, v: [mix(A, D, 0.12), mix(B, C, 0.12), mix(B, C, 0.42), mix(A, D, 0.42)] });
  a.push({ c: highlight, v: [mix(A, D, 0.18), mix(B, C, 0.18), mix(B, C, 0.28), mix(A, D, 0.28)] });
}

/** Paint highlight strips to fake glossy body reflections. */
function glossStripe(a: Face[], y: number, z0: number, z1: number, width: number, color: string, lift = 0.02): void {
  a.push({
    c: shade(color, 1.22),
    v: [v(-width / 2, y + lift, z0), v(width / 2, y + lift, z0), v(width / 2, y + lift, z1), v(-width / 2, y + lift, z1)],
  });
  a.push({
    c: shade(color, 1.08),
    v: [
      v(-width / 2.4, y + lift * 0.6, z0 + 0.08),
      v(width / 2.4, y + lift * 0.6, z0 + 0.08),
      v(width / 2.4, y + lift * 0.6, z1 - 0.08),
      v(-width / 2.4, y + lift * 0.6, z1 - 0.08),
    ],
  });
}

const carCache = new Map<string, Face[]>();

export function car(
  a: Face[],
  x: number,
  z: number,
  color: string,
  opts: { angle?: number; roll?: number; spin?: number; hood?: number | boolean; lights?: boolean; brake?: boolean; steer?: number } = {},
): void {
  const key = 'r6:' + color + ':' + !!opts.hood + ':' + !!opts.lights + ':' + !!opts.brake;
  let b = carCache.get(key);
  if (!b) {
    b = [];
    // Smooth coupe silhouette with denser side profile
    prism(
      b,
      [
        [0.2, 2.12],
        [0.42, 2.22],
        [0.68, 2.12],
        [0.86, 1.7],
        [0.94, 1.15],
        [1.0, 0.7],
        [1.38, 0.42],
        [1.5, 0.1],
        [1.5, -0.35],
        [1.42, -0.85],
        [1.18, -1.35],
        [0.98, -1.75],
        [0.78, -2.05],
        [0.48, -2.22],
        [0.26, -2.14],
        [0.18, -1.7],
        [0.15, 1.55],
      ],
      1.88,
      color,
    );
    // Soft underbody + rocker
    box(b, 0, 0.28, 0, 1.78, 0.22, 3.7, shade(color, 0.7));
    cylinder(b, 0, 0.36, 2.08, 0.2, 1.72, '#1a2228', 0);
    cylinder(b, 0, 0.38, -2.08, 0.18, 1.68, '#1a2228', 0);
    box(b, 0, 0.5, -2.2, 1.3, 0.05, 0.04, '#d8d2c4');

    // Glossy paint reflections on hood / roof / trunk
    glossStripe(b, 0.92, 0.85, 1.95, 1.55, color, 0.03);
    glossStripe(b, 1.48, -0.85, 0.55, 1.15, color, 0.025);
    glossStripe(b, 0.98, -2.05, -1.15, 1.4, color, 0.03);
    for (const side of [-1, 1]) {
      b.push({
        c: shade(color, 1.18),
        v: [v(side * 0.96, 0.72, 1.6), v(side * 0.98, 0.78, 1.55), v(side * 0.98, 0.78, -1.55), v(side * 0.96, 0.72, -1.6)],
      });
      b.push({
        c: '#e8eef4',
        v: [v(side * 0.985, 0.8, 0.9), v(side * 0.99, 0.84, 0.85), v(side * 0.99, 0.84, -0.2), v(side * 0.985, 0.8, -0.15)],
      });
    }

    // Cabin frame (pillars) so glass reads clearly
    box(b, 0, 1.42, -0.15, 1.55, 0.1, 1.55, shade(color, 0.88));
    for (const side of [-1, 1]) {
      box(b, side * 0.78, 1.22, 0.55, 0.08, 0.42, 0.12, shade(color, 0.9));
      box(b, side * 0.8, 1.22, -0.15, 0.07, 0.4, 0.1, shade(color, 0.92));
      box(b, side * 0.78, 1.2, -0.9, 0.08, 0.38, 0.12, shade(color, 0.9));
    }

    // Windshield — reflective glass
    glassPane(b, [v(-0.7, 1.45, 0.15), v(0.7, 1.45, 0.15), v(0.78, 0.98, 0.95), v(-0.78, 0.98, 0.95)], '#1a3548', '#8ec8e8', '#f2f8ff');
    // Rear window
    glassPane(b, [v(-0.68, 1.44, -0.55), v(0.68, 1.44, -0.55), v(0.76, 1.0, -1.15), v(-0.76, 1.0, -1.15)], '#152c3c', '#6aa8c8', '#dceaf4');
    // Side windows
    for (const side of [-1, 1]) {
      glassPane(
        b,
        [v(side * 0.9, 1.38, 0.45), v(side * 0.9, 1.38, -0.75), v(side * 0.9, 1.02, -0.85), v(side * 0.9, 1.02, 0.55)],
        '#183448',
        '#7eb8d8',
        '#eef6fc',
      );
      box(b, side * 0.91, 1.2, -0.12, 0.03, 0.42, 1.35, '#c8d4dc');
    }

    if (opts.hood) {
      box(b, 0, 0.9, 1.3, 1.4, 0.05, 1.1, '#192228');
      box(b, 0, 1.05, 1.35, 0.7, 0.18, 0.55, '#8e989d');
    }
    for (const side of [-1, 1]) {
      cylinder(b, side * 0.92, 0.4, 1.32, 0.48, 0.18, shade(color, 0.82), 0);
      cylinder(b, side * 0.92, 0.4, -1.32, 0.48, 0.18, shade(color, 0.82), 0);
      for (const f of [-1, 1]) cylinder(b, side * 1.02, 0.38, f * 1.32, 0.4, 0.28, '#1a1e22', 0);
      cylinder(b, side * 0.58, 0.66, -2.12, 0.15, 0.11, opts.brake ? '#ff3a28' : '#e04030', Math.PI / 2);
      cylinder(b, side * 0.58, 0.64, 2.12, 0.15, 0.11, opts.lights ? '#fff8d0' : '#e8e4c8', Math.PI / 2);
    }
    if (opts.hood) {
      const panel: Face[] = [];
      box(panel, 0, 1.02, 1.45, 1.55, 0.06, 1.05, color);
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
      box(b, 0, 0.99, 1.5, 1.28, 0.04, 0.85, '#192228');
      box(b, 0, 1.08, 1.4, 0.66, 0.14, 0.5, '#8e989d');
    }
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
          // Hairline stroke softens polygon edges (software AA)
          c.strokeStyle = face.c;
          c.lineWidth = 0.9;
          c.lineJoin = 'round';
          c.stroke();
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
