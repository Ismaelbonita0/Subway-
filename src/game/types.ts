import * as THREE from 'three';

export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export type PowerupType = 'hoverboard' | 'jetpack' | 'sneakers' | 'magnet' | 'multiplier';

export interface ActivePowerup {
  type: PowerupType;
  duration: number;
  timeLeft: number;
}

export type ObstacleType = 
  | 'train_moving' 
  | 'train_static' 
  | 'hurdle_low' 
  | 'barrier_high' 
  | 'ramp_signal';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  lane: number; // -1: left, 0: center, 1: right
  z: number;
  length: number;
  height: number;
  width: number;
  speed: number; // for moving trains (> 0 moving towards player)
  canRunOnTop: boolean;
  mesh: THREE.Group;
  colliderBox: THREE.Box3;
}

export interface Collectible {
  id: string;
  type: 'coin' | PowerupType;
  lane: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  collected: boolean;
  mesh: THREE.Object3D;
}

export interface ParticleEffect {
  mesh: THREE.Points | THREE.Mesh;
  velocities: THREE.Vector3[];
  lifetime: number;
  maxLifetime: number;
  update: (delta: number) => boolean; // return false to remove
}

export interface GameStats {
  score: number;
  coins: number;
  distance: number;
  multiplier: number;
  highScore: number;
  totalCoins: number;
  hoverboardsOwned: number;
}

export interface GameSettings {
  graphicsPreset: 'ultra' | 'balanced' | 'performance';
  targetFps: 60 | 120;
  soundEnabled: boolean;
  musicEnabled: boolean;
  touchSensitivity: number; // 0.8 to 1.5
  showOnScreenControls: boolean;
  hapticFeedback: boolean;
}

export interface CharacterSkin {
  id: string;
  name: string;
  hoodieColor: string;
  pantsColor: string;
  sneakerColor: string;
  accentColor: string;
  unlocked: boolean;
  cost: number;
}

export interface HoverboardSkin {
  id: string;
  name: string;
  deckColor: string;
  neonGlowColor: string;
  trailColor: string;
  speedBonus: number;
  unlocked: boolean;
  cost: number;
}
