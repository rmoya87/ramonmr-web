export const v = (x, y, z) => ({ x, y, z });
export function shade(c, n) {
    if (!c.startsWith('#'))
        return c;
    const k = parseInt(c.slice(1), 16);
    return ('#' +
        [k >> 16, (k >> 8) & 255, k & 255]
            .map((x) => Math.min(255, Math.max(0, Math.round(x * n))).toString(16).padStart(2, '0'))
            .join(''));
}
export function box(a, x, y, z, w, h, d, c, ry = 0) {
    const q = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
    ].map(([i, j, k]) => v(x + (i * w) / 2 * Math.cos(ry) + (k * d) / 2 * Math.sin(ry), y + (j * h) / 2, z - (i * w) / 2 * Math.sin(ry) + (k * d) / 2 * Math.cos(ry)));
    [
        [0, 1, 2, 3],
        [5, 4, 7, 6],
        [4, 0, 3, 7],
        [1, 5, 6, 2],
        [3, 2, 6, 7],
        [4, 5, 1, 0],
    ].forEach((f, i) => a.push({ v: f.map((n) => q[n]), c: shade(c, [0.75, 0.82, 0.65, 0.9, 1.08, 0.55][i]) }));
}
export function cylinder(a, x, y, z, r, w, c, spin = 0) {
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
            v: Array.from({ length: 10 }, (_, i) => v(x + side * (w / 2 + 0.004), y + Math.cos((i * Math.PI) / 5) * r * 0.64, z + Math.sin((i * Math.PI) / 5) * r * 0.64)),
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
export function column(a, x, y, z, r, h, c, segments = 8) {
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
function prism(a, side, width, c) {
    const l = side.map(([y, z]) => v(-width / 2, y, z));
    const r = side.map(([y, z]) => v(width / 2, y, z));
    a.push({ v: l, c: shade(c, 0.72) }, { v: r.slice().reverse(), c: shade(c, 0.92) });
    for (let i = 0; i < side.length; i++) {
        const j = (i + 1) % side.length;
        a.push({ v: [l[i], r[i], r[j], l[j]], c: shade(c, i === 1 ? 1.15 : 0.95) });
    }
}
/** Layered glass: dark tint + sky band + specular edge. */
function glassPane(a, corners, tint, sky, highlight) {
    a.push({ c: tint, v: corners });
    const [A, B, C, D] = corners;
    const mix = (p, q, t) => v(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, p.z + (q.z - p.z) * t);
    a.push({ c: sky, v: [mix(A, D, 0.12), mix(B, C, 0.12), mix(B, C, 0.42), mix(A, D, 0.42)] });
    a.push({ c: highlight, v: [mix(A, D, 0.18), mix(B, C, 0.18), mix(B, C, 0.28), mix(A, D, 0.28)] });
}
/** Paint highlight strips to fake glossy body reflections. */
function glossStripe(a, y, z0, z1, width, color, lift = 0.02) {
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
const carCache = new Map();
/** Wheel with tire + rim + hub — readable from chase cam. */
function wheelAssembly(a, x, y, z, tireR, width, spin = 0) {
    cylinder(a, x, y, z, tireR, width, '#1a1e22', spin);
    cylinder(a, x, y, z, tireR * 0.62, width * 0.55, '#c8d0d4', spin);
    cylinder(a, x, y, z, tireR * 0.28, width * 0.35, '#3a4248', spin);
    // Arch lip so wheels sit in sculpted body
    column(a, x, y + tireR * 0.15, z, tireR * 0.95, tireR * 0.22, '#2a3036', 8);
}
function carSilhouette(variant) {
    switch (variant) {
        case 'van':
            return {
                width: 1.95,
                wheelZ: 1.25,
                wheelR: 0.42,
                profile: [
                    [0.22, 2.35],
                    [0.55, 2.45],
                    [0.95, 2.25],
                    [1.15, 1.55],
                    [1.35, 0.55],
                    [1.55, 0.12],
                    [1.55, -0.55],
                    [1.45, -1.35],
                    [1.25, -1.95],
                    [0.95, -2.25],
                    [0.45, -2.35],
                    [0.22, -2.15],
                    [0.2, 1.85],
                ],
            };
        case 'truck':
            return {
                width: 2.05,
                wheelZ: 1.35,
                wheelR: 0.48,
                profile: [
                    [0.25, 2.4],
                    [0.7, 2.5],
                    [1.05, 2.15],
                    [1.2, 1.35],
                    [1.45, 0.55],
                    [1.65, 0.12],
                    [1.65, -0.4],
                    [1.55, -1.0],
                    [1.35, -1.55],
                    [1.05, -2.0],
                    [0.7, -2.35],
                    [0.35, -2.45],
                    [0.22, -2.2],
                    [0.22, 1.55],
                ],
            };
        case 'slow':
            return {
                width: 1.72,
                wheelZ: 1.15,
                wheelR: 0.4,
                profile: [
                    [0.2, 1.85],
                    [0.45, 1.95],
                    [0.75, 1.75],
                    [0.9, 1.2],
                    [1.05, 0.55],
                    [1.28, 0.12],
                    [1.28, -0.45],
                    [1.15, -1.05],
                    [0.95, -1.55],
                    [0.7, -1.9],
                    [0.4, -2.05],
                    [0.2, -1.85],
                    [0.18, 1.25],
                ],
            };
        case 'sedan':
            return {
                width: 1.9,
                wheelZ: 1.28,
                wheelR: 0.44,
                profile: [
                    [0.2, 2.2],
                    [0.48, 2.32],
                    [0.78, 2.15],
                    [0.95, 1.55],
                    [1.05, 0.95],
                    [1.22, 0.45],
                    [1.42, 0.12],
                    [1.42, -0.4],
                    [1.32, -1.0],
                    [1.12, -1.55],
                    [0.9, -1.95],
                    [0.55, -2.2],
                    [0.28, -2.15],
                    [0.18, -1.65],
                    [0.16, 1.45],
                ],
            };
        case 'sport':
            // Low GT coupe — long hood, tucked cabin, tapered rear (hero player car)
            return {
                width: 1.92,
                wheelZ: 1.38,
                wheelR: 0.46,
                profile: [
                    [0.18, 2.35],
                    [0.38, 2.48],
                    [0.62, 2.4],
                    [0.82, 2.05],
                    [0.92, 1.45],
                    [0.98, 0.95],
                    [1.08, 0.55],
                    [1.32, 0.28],
                    [1.48, 0.1],
                    [1.48, -0.35],
                    [1.4, -0.85],
                    [1.22, -1.35],
                    [1.02, -1.75],
                    [0.78, -2.05],
                    [0.48, -2.22],
                    [0.26, -2.12],
                    [0.16, -1.55],
                    [0.14, 0.85],
                    [0.15, 1.65],
                ],
            };
        default: {
            const _exhaustive = variant;
            return _exhaustive;
        }
    }
}
export function car(a, x, z, color, opts = {}) {
    const variant = opts.variant || 'sport';
    const key = 'r9:' + variant + ':' + color + ':' + !!opts.hood + ':' + !!opts.lights + ':' + !!opts.brake;
    let b = carCache.get(key);
    if (!b) {
        b = [];
        const { profile, width, wheelZ, wheelR } = carSilhouette(variant);
        const glassTint = '#1e3a4c';
        const glassSky = '#8ec8e0';
        const glassHi = '#eef6fc';
        const chrome = '#d8dee2';
        const dark = '#1a2228';
        // Body extrusion
        prism(b, profile, width, color);
        // Rocker / undertray
        box(b, 0, 0.22, 0, width * 0.92, 0.18, wheelZ * 2.55, shade(color, 0.62));
        // Front splitter + rear diffuser lip
        box(b, 0, 0.16, wheelZ + 0.85, width * 0.78, 0.06, 0.28, dark);
        box(b, 0, 0.18, -(wheelZ + 0.85), width * 0.72, 0.08, 0.32, dark);
        // Front grille
        box(b, 0, 0.52, wheelZ + 0.95, width * 0.55, 0.28, 0.08, dark);
        box(b, 0, 0.52, wheelZ + 1.0, width * 0.42, 0.16, 0.04, chrome);
        // Chrome bumper strip
        box(b, 0, 0.42, wheelZ + 1.05, width * 0.7, 0.05, 0.06, chrome);
        box(b, 0, 0.4, -(wheelZ + 0.95), width * 0.65, 0.05, 0.06, chrome);
        // Door character line + side chrome
        for (const side of [-1, 1]) {
            b.push({
                c: shade(color, 1.16),
                v: [
                    v(side * (width / 2 + 0.01), 0.62, wheelZ * 0.85),
                    v(side * (width / 2 + 0.02), 0.68, wheelZ * 0.8),
                    v(side * (width / 2 + 0.02), 0.68, -wheelZ * 0.75),
                    v(side * (width / 2 + 0.01), 0.62, -wheelZ * 0.8),
                ],
            });
            b.push({
                c: '#f2f6fa',
                v: [
                    v(side * (width / 2 + 0.025), 0.72, 0.55),
                    v(side * (width / 2 + 0.03), 0.78, 0.5),
                    v(side * (width / 2 + 0.03), 0.78, -0.15),
                    v(side * (width / 2 + 0.025), 0.72, -0.1),
                ],
            });
            // Mirror
            box(b, side * (width / 2 + 0.08), 1.05, 0.55, 0.12, 0.08, 0.22, shade(color, 0.88));
            box(b, side * (width / 2 + 0.12), 1.05, 0.55, 0.04, 0.1, 0.14, glassTint);
        }
        // Hood / roof / trunk gloss
        glossStripe(b, 0.88, wheelZ * 0.15, wheelZ + 0.7, width * 0.78, color, 0.035);
        glossStripe(b, variant === 'van' ? 1.72 : 1.42, -0.55, 0.45, width * 0.55, color, 0.03);
        glossStripe(b, 0.92, -(wheelZ + 0.7), -wheelZ * 0.2, width * 0.7, color, 0.03);
        // Cabin roof rail
        const roofY = variant === 'van' ? 1.85 : variant === 'truck' ? 1.55 : 1.42;
        box(b, 0, roofY, -0.05, width * 0.78, 0.1, variant === 'van' ? 1.9 : 1.45, shade(color, 0.9));
        for (const side of [-1, 1]) {
            box(b, side * width * 0.4, roofY - 0.22, 0.45, 0.08, 0.4, 0.12, shade(color, 0.92));
            box(b, side * width * 0.4, roofY - 0.22, -0.75, 0.08, 0.38, 0.12, shade(color, 0.92));
        }
        // Glass — large readable panes
        const cabinTop = roofY + 0.02;
        const windBot = 0.95;
        glassPane(b, [v(-width * 0.36, cabinTop, 0.2), v(width * 0.36, cabinTop, 0.2), v(width * 0.4, windBot, 0.95), v(-width * 0.4, windBot, 0.95)], glassTint, glassSky, glassHi);
        glassPane(b, [
            v(-width * 0.36, cabinTop, -0.4),
            v(width * 0.36, cabinTop, -0.4),
            v(width * 0.4, windBot, -1.15),
            v(-width * 0.4, windBot, -1.15),
        ], glassTint, glassSky, glassHi);
        b.push({
            c: '#bee0f0',
            v: [
                v(-width * 0.28, cabinTop - 0.12, -0.55),
                v(width * 0.28, cabinTop - 0.12, -0.55),
                v(width * 0.3, cabinTop - 0.28, -0.9),
                v(-width * 0.3, cabinTop - 0.28, -0.9),
            ],
        });
        for (const side of [-1, 1]) {
            glassPane(b, [
                v(side * width * 0.48, cabinTop - 0.05, 0.4),
                v(side * width * 0.48, cabinTop - 0.05, -0.7),
                v(side * width * 0.48, windBot + 0.05, -0.85),
                v(side * width * 0.48, windBot + 0.05, 0.55),
            ], glassTint, glassSky, glassHi);
        }
        // Lights
        for (const side of [-1, 1]) {
            column(b, side * width * 0.32, 0.58, wheelZ + 1.05, 0.14, 0.14, opts.lights ? '#fff8d0' : '#e8e4c8', 6);
            column(b, side * width * 0.32, 0.58, -(wheelZ + 1.0), 0.14, 0.14, opts.brake ? '#ff3a28' : '#e04030', 6);
        }
        // Wheels in arches
        for (const side of [-1, 1]) {
            wheelAssembly(b, side * (width / 2 - 0.02), wheelR * 0.92, wheelZ, wheelR, 0.32);
            wheelAssembly(b, side * (width / 2 - 0.02), wheelR * 0.92, -wheelZ, wheelR, 0.32);
        }
        if (variant === 'truck') {
            box(b, 0, 1.05, -1.35, width * 0.88, 0.12, 1.6, shade(color, 0.75));
            box(b, 0, 0.7, -1.35, width * 0.82, 0.55, 1.5, shade(color, 0.82));
        }
        if (opts.hood) {
            box(b, 0, 0.88, 1.15, width * 0.72, 0.05, 1.0, dark);
            box(b, 0, 1.02, 1.2, 0.65, 0.16, 0.5, '#8e989d');
            const panel = [];
            box(panel, 0, 1.0, 1.35, width * 0.8, 0.06, 1.0, color);
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
                    if (f.wheel.z > 0.5 && Math.abs(steer) > 0.01) {
                        const lx = p.x;
                        const lz = p.z - f.wheel.z;
                        p = v(Math.cos(steer) * lx + Math.sin(steer) * lz, p.y, f.wheel.z - Math.sin(steer) * lx + Math.cos(steer) * lz);
                    }
                }
                const xx = p.x * Math.cos(roll) - p.y * Math.sin(roll);
                const yy = p.y * Math.cos(roll) + p.x * Math.sin(roll);
                return v(x + xx * Math.cos(angle) + p.z * Math.sin(angle), yy, z - xx * Math.sin(angle) + p.z * Math.cos(angle));
            }),
        });
    }
}
export function renderer(c, w, h, cam, depthTest = false) {
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
    function coord(p) {
        const x = p.x - cam.pos.x;
        const y = p.y - cam.pos.y;
        const z = p.z - cam.pos.z;
        return v(x * r.x + y * r.y + z * r.z, x * u.x + y * u.y + z * u.z, x * f.x + y * f.y + z * f.z);
    }
    function project(p) {
        const q = coord(p);
        return { x: w / 2 + (q.x * cam.fov) / q.z, y: h / 2 - (q.y * cam.fov) / q.z, z: q.z };
    }
    return {
        project,
        draw(a, ordered = false) {
            const faces = a
                .map((face) => {
                const q = face.v.map(coord);
                const out = [];
                for (let i = 0; i < q.length; i++) {
                    const A = q[i];
                    const B = q[(i + 1) % q.length];
                    if (A.z >= 0.2)
                        out.push(A);
                    if (A.z >= 0.2 !== B.z >= 0.2) {
                        const t = (0.2 - A.z) / (B.z - A.z);
                        out.push(v(A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, 0.2));
                    }
                }
                return { f: face, q: out, depth: out.reduce((sum, p) => sum + p.z, 0) / out.length };
            })
                .filter((o) => o.q.length > 2);
            if (!ordered)
                faces.sort((A, B) => B.depth - A.depth);
            for (const { f: face, q } of faces) {
                if (image && depth) {
                    const pts = q.map((p) => ({ x: w / 2 + (p.x * cam.fov) / p.z, y: h / 2 - (p.y * cam.fov) / p.z, iz: 1 / p.z }));
                    const rgb = parseInt(face.c.slice(1), 16);
                    for (let j = 1; j < pts.length - 1; j++) {
                        const A = pts[0];
                        const B = pts[j];
                        const C = pts[j + 1];
                        const den = (B.y - C.y) * (A.x - C.x) + (C.x - B.x) * (A.y - C.y);
                        if (Math.abs(den) < 0.001)
                            continue;
                        const x0 = Math.max(0, Math.floor(Math.min(A.x, B.x, C.x)));
                        const x1 = Math.min(w - 1, Math.ceil(Math.max(A.x, B.x, C.x)));
                        const y0 = Math.max(0, Math.floor(Math.min(A.y, B.y, C.y)));
                        const y1 = Math.min(h - 1, Math.ceil(Math.max(A.y, B.y, C.y)));
                        for (let y = y0; y <= y1; y++) {
                            for (let x = x0; x <= x1; x++) {
                                const aa = ((B.y - C.y) * (x + 0.5 - C.x) + (C.x - B.x) * (y + 0.5 - C.y)) / den;
                                const bb = ((C.y - A.y) * (x + 0.5 - C.x) + (A.x - C.x) * (y + 0.5 - C.y)) / den;
                                const dd = 1 - aa - bb;
                                if (aa < -0.0001 || bb < -0.0001 || dd < -0.0001)
                                    continue;
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
                }
                else {
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
            if (image)
                c.putImageData(image, 0, 0);
        },
    };
}
export function quad(a, x1, z1, x2, z2, width, color, y = 0.01) {
    a.push({
        c: color,
        v: [v(x1 - width / 2, y, z1), v(x1 + width / 2, y, z1), v(x2 + width / 2, y, z2), v(x2 - width / 2, y, z2)],
    });
}
