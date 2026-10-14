import type { EnvironmentId, GameMode, VehicleTypeId, WeatherId } from './config.js';

export type TrafficCar = {
  id: number;
  d: number;
  x: number;
  targetX: number;
  color: string;
  passed: boolean;
  type: VehicleTypeId;
  speed: number;
  state: 'cruise' | 'follow' | 'change' | 'merge';
  changeTimer: number;
  width: number;
  length: number;
};

export type RunState = {
  yaw: number;
  slip: number;
  d: number;
  x: number;
  vx: number;
  speed: number;
  steer: number;
  time: number;
  score: number;
  hits: number;
  combo: number;
  comboTimer: number;
  inv: number;
  fork: number;
  branch: boolean;
  branchTime: number;
  exitHold: number;
  exit: number;
  camX: number;
  camY: number;
  camZ: number;
  fovBoost: number;
  shake: number;
  ended: boolean;
  mode: GameMode;
  weather: WeatherId;
  environment: EnvironmentId;
  biomeBlend: number;
  regionId: number;
  discovered: number[];
  missionId: string | null;
  missionProgress: number;
  missionTarget: number;
  cleanTimer: number;
  traffic: TrafficCar[];
  nextTrafficId: number;
};

export type CatalogItem = { id: number; title: string; url: string; reader: string };
export type CatalogGroup = { name: string; items: CatalogItem[] };

export type TouringConfig = {
  lang: string;
  home: string;
  sections: CatalogGroup[];
  version: string;
  scores: string;
  run: string;
  scoreVersion?: number;
  score_version?: number;
};

export type PersistProgress = {
  v: number;
  bestScore: number;
  bestDistance: number;
  bestCombo: number;
  missions: string[];
  regions: number[];
  unlocks: string[];
  color: string;
  quality: string;
  audioMaster: number;
  audioSfx: number;
  audioMusic: number;
  muted: boolean;
  reduceMotion: boolean;
};

export type PersistRun = {
  v: number;
  expires: number;
  state: RunState;
  garage: number;
  view: number;
  color: string;
  camera: number;
  lights: boolean;
  environment: EnvironmentId;
};
