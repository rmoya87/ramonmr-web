import type { EnvironmentId, WeatherId } from './config.js';
import type { RunState } from './types.js';

export type BiomeVisual = {
  id: number;
  nameEs: string;
  nameEn: string;
  /** near, mid, far ground — same family, soft arcade greens/sands */
  ground: string[];
  /** top → mid → warm horizon */
  sky: [string, string, string];
  water: string;
  sun: string;
  /** 8-digit hex with alpha preferred */
  haze: string;
};

/**
 * Arcade-soft biome kit: every region shares warm horizons, soft skies,
 * and ground tones that match roadside verge materials.
 */
export const BIOMES: BiomeVisual[] = [
  {
    id: 0,
    nameEs: 'Costa',
    nameEn: 'Coast',
    ground: ['#6a8a5e', '#5a7a54', '#7a9a6c'],
    sky: ['#4a8ab8', '#a8d0e0', '#f0d8b0'],
    water: '#3a8a9a',
    sun: '#ffe2a8',
    haze: '#e8dcc888',
  },
  {
    id: 1,
    nameEs: 'Bosque',
    nameEn: 'Forest',
    ground: ['#4a6a48', '#3a5a3c', '#5a7a54'],
    sky: ['#5a8498', '#b0c8b8', '#e8d8b0'],
    water: '#3a6a68',
    sun: '#ffe8b0',
    haze: '#c8d0b888',
  },
  {
    id: 2,
    nameEs: 'Ciudad',
    nameEn: 'City',
    ground: ['#6a6e68', '#5a5e5a', '#7a7e78'],
    sky: ['#6a88a0', '#c0ccd4', '#e8d8c0'],
    water: '#4a6a78',
    sun: '#ffe0a0',
    haze: '#d0d4c888',
  },
  {
    id: 3,
    nameEs: 'Desierto',
    nameEn: 'Desert',
    ground: ['#c8a86a', '#b89858', '#d8b878'],
    sky: ['#5aa0c8', '#e0c8a0', '#f4e0b8'],
    water: '#5a98a0',
    sun: '#ffd890',
    haze: '#f0e0b888',
  },
  {
    id: 4,
    nameEs: 'Nieve',
    nameEn: 'Snow',
    ground: ['#dde6ee', '#ccd8e2', '#eef3f7'],
    sky: ['#131e31', '#2b3d5c', '#7e8ea6'],
    water: '#4a5e78',
    sun: '#c8d4e8',
    haze: '#8fa2bd88',
  },
];

/** Biome index for a concrete environment; -1 for night/beach (they keep distance variety). */
export function biomeForEnv(env: EnvironmentId): number {
  switch (env) {
    case 'coast': return 0;
    case 'forest': return 1;
    case 'city': return 2;
    case 'desert': return 3;
    case 'snow': return 4;
    default: return -1;
  }
}

export function regionAt(d: number): number {
  return Math.floor(d / 1600) % BIOMES.length;
}

export function stepEnvironment(s: RunState, forced: EnvironmentId, weather: WeatherId): void {
  const target = regionAt(s.d);
  if (!s.discovered.includes(target)) {
    s.discovered = [...s.discovered, target];
  }
  s.regionId = target;
  const local = s.d % 1600;
  s.biomeBlend = local > 1400 ? (local - 1400) / 200 : 0;

  if (forced === 'auto') {
    s.environment = (['coast', 'forest', 'city', 'desert', 'snow'] as EnvironmentId[])[target];
  } else {
    s.environment = forced;
  }
  s.weather = weather;
}

export function effectiveNight(env: EnvironmentId): boolean {
  return env === 'night';
}

export function effectiveBeach(env: EnvironmentId): boolean {
  return env === 'beach' || env === 'coast';
}

export function biomeLabel(id: number, en: boolean): string {
  const b = BIOMES[id] || BIOMES[0];
  return en ? b.nameEn : b.nameEs;
}
