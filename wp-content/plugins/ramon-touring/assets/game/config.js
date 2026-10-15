/** Centralized tunable constants for RM Touring Lab 2.0 */
export const VERSION = '3.0.1';
export const SCORE_VERSION = 2;
export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.1;
export const MAX_PHYSICS_STEPS = 5;
export const PHYSICS = {
    baseSpeed: 72,
    maxSpeed: 280,
    arcadeTopBase: 148,
    arcadeTopRamp: 0.48,
    exploreTop: 130,
    accelGain: 0.72,
    accelCap: 28,
    brakeDecel: 46,
    shoulderPenalty: 26,
    steerSpeedFactor: 160,
    steerLerp: 16,
    yawLerp: 10,
    vxLerp: 12,
    driftVxLerp: 3.5,
    slipLerp: 5,
    driftSteerMin: 0.2,
    driftSpeedMin: 95,
    roadHalfWidth: 6.9,
    branchHalfWidth: 1.6,
    shoulderAbsX: 5.65,
    hitSpeedMul: 0.55,
    invulnerability: 2.2,
    startInvulnerability: 4.2,
    workshopInvulnerability: 4,
    rainGripMul: 0.85,
};
export const COLLISION = {
    length: 4,
    width: 1.65,
};
export const TRAFFIC = {
    lanes: [-4, 0, 4],
    poolArcade: 12,
    poolExplore: 6,
    spawnAheadMin: 85,
    spawnAheadMax: 220,
    recycleBehind: 28,
    minGap: 44,
    safeGap: 20,
    laneChangeCooldown: 2.4,
    overtakeCloseDist: 2.0,
};
export const SCORE = {
    pass: 100,
    closePass: 250,
    comboBonusPer: 20,
    comboBonusCap: 400,
    comboExpire: 4,
    missionEasy: 500,
    missionHard: 1500,
    cleanStretch: 500,
    discoverZone: 750,
    distanceMulPerLevel: 0.15,
    levelSeconds: 30,
};
export const EXIT = {
    firstFork: 430,
    nextGap: 650,
    exploreGap: 380,
    captureXMin: 2.6,
    captureLaneTol: 3.4,
    captureQMin: -12,
    captureQMax: 95,
    holdSeconds: 0.28,
    confirmMobile: false,
    approachWarn: 220,
    approachSign: 100,
};
export const CAMERA = {
    modes: 1,
    damp: 4.2,
    fovSpeedFactor: 0.05,
    shakeDecay: 5,
};
export const SAVE_KEY = 'rm_touring_v2';
export const SAVE_TTL_MS = 1000 * 60 * 60 * 6;
export const VEHICLE_TYPES = {
    sedan: { w: 1.7, l: 4.2, preferred: 95, accel: 10, gap: 16, overtake: 0.35 },
    sport: { w: 1.75, l: 4.1, preferred: 125, accel: 16, gap: 14, overtake: 0.7 },
    van: { w: 1.9, l: 5.0, preferred: 85, accel: 7, gap: 20, overtake: 0.2 },
    truck: { w: 2.2, l: 7.5, preferred: 75, accel: 5, gap: 28, overtake: 0.08 },
    slow: { w: 1.65, l: 3.8, preferred: 60, accel: 4, gap: 18, overtake: 0.05 },
};
export const COLORS = {
    red: '#b12f3c',
    blue: '#254d6d',
    ivory: '#d1c9b6',
    graphite: '#3a454a',
    unlockGold: '#c9a24a',
    unlockTeal: '#2a7a6e',
};
