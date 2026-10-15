/**
 * Arcade-soft look bible (Out Run–inspired).
 * One short palette, shared materials, soft fog — every draw path should use these.
 */
import { shade } from './mesh.js?v=2.1.0';
export const LOOK = {
    /** Shared road materials — same in every biome */
    asphalt: { day: '#5c646c', night: '#3a424a', wear: '#6a727a', ramp: '#545c64' },
    chalk: '#f0e6cc',
    vergeWarm: '#7a8a62',
    sand: '#d2c090',
    wood: '#8a6e4a',
    bark: '#6e5840',
    foliage: ['#3a6a50', '#4a7a5c', '#2e5844'],
    rock: '#b8a070',
    rockDark: '#9a8458',
    building: '#8a8490',
    buildingRoof: '#5e5864',
    glass: { tint: '#1e3a4c', sky: '#8ec8e0', hi: '#eef6fc' },
    sign: { face: '#2a5a4a', ink: '#fff6e0', post: '#8a9a92' },
    cloud: '#f4f0e8',
    sun: '#ffe2a8',
    shadow: '#0c141c66',
};
/** Mix two #rrggbb colors. */
export function mixHex(a, b, t) {
    if (!a.startsWith('#') || !b.startsWith('#'))
        return a;
    const k = Math.min(1, Math.max(0, t));
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (s, d) => Math.round(s + (d - s) * k);
    const r = ch((pa >> 16) & 255, (pb >> 16) & 255);
    const g = ch((pa >> 8) & 255, (pb >> 8) & 255);
    const bl = ch(pa & 255, pb & 255);
    return '#' + [r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('');
}
/** Soften a material toward horizon haze with distance (arcade depth cue). */
export function fogToward(color, haze, midZ, start = 50, end = 260) {
    const t = Math.min(1, Math.max(0, (midZ - start) / (end - start)));
    if (t <= 0)
        return color;
    return mixHex(color, haze.slice(0, 7), t * 0.55);
}
export function paintAtmosphere(c, w, h, atm, scroll, opts) {
    const horizonY = h * 0.52;
    // Sky → warm horizon (same language every biome)
    const sky = c.createLinearGradient(0, 0, 0, horizonY + h * 0.04);
    sky.addColorStop(0, atm.sky[0]);
    sky.addColorStop(0.55, atm.sky[1]);
    sky.addColorStop(1, atm.sky[2]);
    c.fillStyle = sky;
    c.fillRect(0, 0, w, horizonY + h * 0.04);
    // Ground wash — exact near-ground color so 2D/3D never fight
    const ground = c.createLinearGradient(0, horizonY - h * 0.02, 0, h);
    ground.addColorStop(0, mixHex(atm.sky[2], atm.ground, 0.55));
    ground.addColorStop(0.22, atm.hillNear);
    ground.addColorStop(0.7, atm.ground);
    ground.addColorStop(1, atm.groundDeep);
    c.fillStyle = ground;
    c.fillRect(0, horizonY - h * 0.02, w, h - horizonY + h * 0.02);
    // Soft distant hills (silhouettes only — same foliage/ground family)
    for (let k = 0; k < 3; k++) {
        const cols = [atm.hillFar, atm.hillMid, atm.hillNear];
        c.beginPath();
        const pad = w * 0.2;
        const foot = horizonY + h * (0.02 + k * 0.03);
        c.moveTo(-pad, foot);
        for (let i = 0; i <= 48; i++) {
            const nx = i / 48;
            const x = -pad + nx * (w + pad * 2);
            const roll = Math.sin(nx * 3.2 + k * 1.4 + scroll * 0.0015) * h * 0.028 +
                Math.sin(nx * 1.4 + k) * h * 0.038;
            c.lineTo(x, horizonY - h * (0.14 - k * 0.03) - roll);
        }
        c.lineTo(w + pad, foot);
        c.closePath();
        c.fillStyle = cols[k];
        c.globalAlpha = 0.92;
        c.fill();
    }
    c.globalAlpha = 1;
    // Sun / moon
    if (!atm.night) {
        const sunX = w * 0.78;
        const sunY = h * 0.14;
        const glow = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, h * 0.16);
        glow.addColorStop(0, atm.sun + '99');
        glow.addColorStop(1, atm.sun + '00');
        c.fillStyle = glow;
        c.fillRect(sunX - h * 0.18, sunY - h * 0.18, h * 0.36, h * 0.36);
        c.fillStyle = atm.sun;
        c.beginPath();
        c.arc(sunX, sunY, h * 0.026, 0, Math.PI * 2);
        c.fill();
    }
    else {
        c.fillStyle = '#e8eef4';
        c.beginPath();
        c.arc(w * 0.76, h * 0.15, h * 0.02, 0, Math.PI * 2);
        c.fill();
    }
    // Soft cloud pillows (cream, not grey slabs)
    if (!atm.night && !opts.reduceEffects) {
        c.fillStyle = opts.cloudy ? LOOK.cloud + '99' : LOOK.cloud + '55';
        for (let i = 0; i < 4; i++) {
            const cloudX = ((i * 183 + scroll * 0.05) % (w + 200)) - 100;
            const cloudY = h * (0.09 + (i % 2) * 0.05);
            c.beginPath();
            c.ellipse(cloudX, cloudY, w * 0.08, h * 0.018, 0, 0, Math.PI * 2);
            c.ellipse(cloudX + w * 0.04, cloudY - h * 0.008, w * 0.05, h * 0.014, 0, 0, Math.PI * 2);
            c.ellipse(cloudX - w * 0.035, cloudY + h * 0.004, w * 0.045, h * 0.012, 0, 0, Math.PI * 2);
            c.fill();
        }
    }
    // Horizon haze band — blends sky into ground
    const haze = c.createLinearGradient(0, horizonY - h * 0.12, 0, horizonY + h * 0.08);
    haze.addColorStop(0, '#ffffff00');
    haze.addColorStop(0.45, atm.haze);
    haze.addColorStop(1, '#ffffff00');
    c.fillStyle = haze;
    c.fillRect(0, horizonY - h * 0.12, w, h * 0.2);
    return horizonY;
}
export function depthMist(c, w, h, atm) {
    const mist = c.createLinearGradient(0, h * 0.28, 0, h * 0.52);
    mist.addColorStop(0, atm.night ? '#0a152028' : mixHex(atm.haze.slice(0, 7), '#ffffff', 0.3) + '33');
    mist.addColorStop(1, '#ffffff00');
    c.fillStyle = mist;
    c.fillRect(0, h * 0.26, w, h * 0.26);
}
/** Slight warm grade so UI chrome and world share a mood. */
export function warmGrade(c, w, h, night) {
    if (night) {
        c.fillStyle = '#08142033';
        c.fillRect(0, 0, w, h);
        return;
    }
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffe8c008');
    g.addColorStop(0.55, '#ffffff00');
    g.addColorStop(1, '#c8a06010');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
}
export { shade };
