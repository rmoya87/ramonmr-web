/** Centralized tunable constants for RM Touring Lab 2.0 */
export const VERSION = '3.2.2';
export const SCORE_VERSION = 2;

export const FIXED_DT = 1 / 60;
export const MAX_FRAME_DT = 0.1;
export const MAX_PHYSICS_STEPS = 5;

export const PHYSICS = {
  baseSpeed: 105,
  maxSpeed: 300,
  /** Level-1 cruise ceiling; each level adds arcadeTopPerLevel. */
  arcadeTopBase: 168,
  arcadeTopPerLevel: 15.5,
  /** Soft time drip so mid-level still climbs a little. */
  arcadeTopRamp: 0.32,
  exploreTop: 150,
  accelGain: 1.15,
  accelCap: 52,
  brakeDecel: 55,
  shoulderPenalty: 32,
  steerSpeedFactor: 190,
  steerLerp: 18,
  yawLerp: 12,
  vxLerp: 14,
  driftVxLerp: 4,
  slipLerp: 5,
  driftSteerMin: 0.2,
  driftSpeedMin: 100,
  roadHalfWidth: 6.9,
  branchHalfWidth: 1.6,
  shoulderAbsX: 5.65,
  hitSpeedMul: 0.52,
  invulnerability: 2.4,
  startInvulnerability: 3.6,
  workshopInvulnerability: 3.5,
  rainGripMul: 0.85,
} as const;

/** Player hull = the visible hatch (1.86 x 4.3) so contact matches what you see. */
export const COLLISION = {
  length: 4.3,
  width: 1.84,
} as const;

export const TRAFFIC = {
  lanes: [-4, 0, 4] as const,
  /** Dense arcade pack; recycle packs tighter each level. */
  poolArcade: 24,
  poolExplore: 8,
  spawnAheadMin: 48,
  spawnAheadMax: 160,
  recycleBehind: 22,
  minGap: 22,
  safeGap: 12,
  laneChangeCooldown: 1.4,
  overtakeCloseDist: 2.0,
  /**
   * Reachable-gap rule: cars that block all three lanes may never sit inside
   * the same stretch of road this long (centre to centre, metres). Anything
   * tighter is an unpassable wall.
   */
  wallSpan: 30,
  /** Hard floor enforced every step: no car may move into a wall tighter than this. */
  wallHold: 24,
} as const;

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
  distanceMulPerLevel: 0.18,
  /** ~40s/level → level 10 after ~6 minutes of survival. */
  levelSeconds: 40,
} as const;

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
} as const;

export const CAMERA = {
  modes: 1,
  damp: 5.5,
  fovSpeedFactor: 0.14,
  shakeDecay: 5,
} as const;

export const SAVE_KEY = 'rm_touring_v2';
export const SAVE_TTL_MS = 1000 * 60 * 60 * 6;

export type GameMode = 'arcade' | 'explore';
export type UiMode = 'start' | 'road' | 'garage';
export type EnvironmentId =
  | 'coast'
  | 'forest'
  | 'city'
  | 'desert'
  | 'snow'
  | 'night'
  | 'beach'
  | 'auto';
export type QualityProfile = 'low' | 'medium' | 'high' | 'auto';
export type WeatherId = 'clear' | 'cloudy' | 'rain' | 'fog' | 'sunset';

export const VEHICLE_TYPES = {
  sedan: { w: 1.82, l: 4.5, preferred: 95, accel: 10, gap: 16, overtake: 0.35 },
  sport: { w: 1.88, l: 4.4, preferred: 125, accel: 16, gap: 14, overtake: 0.7 },
  van: { w: 2.0, l: 5.3, preferred: 85, accel: 7, gap: 20, overtake: 0.2 },
  truck: { w: 2.45, l: 8.4, preferred: 75, accel: 5, gap: 28, overtake: 0.08 },
  slow: { w: 1.7, l: 3.7, preferred: 60, accel: 4, gap: 18, overtake: 0.05 },
  bus: { w: 2.55, l: 11.5, preferred: 70, accel: 4, gap: 30, overtake: 0.05 },
  moto: { w: 0.85, l: 2.2, preferred: 135, accel: 20, gap: 12, overtake: 0.8 },
} as const;

export type VehicleTypeId = keyof typeof VEHICLE_TYPES;

export const COLORS = {
  red: '#b12f3c',
  blue: '#254d6d',
  ivory: '#d1c9b6',
  graphite: '#3a454a',
  unlockGold: '#c9a24a',
  unlockTeal: '#2a7a6e',
} as const;
