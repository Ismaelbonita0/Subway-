import * as THREE from 'three';
import { 
  GameState, 
  GameStats, 
  GameSettings, 
  Obstacle, 
  Collectible, 
  PowerupType, 
  ActivePowerup, 
  CharacterSkin, 
  HoverboardSkin 
} from './types';
import { 
  LANE_WIDTH, 
  TRACK_LANES, 
  createTrainMesh, 
  createHurdleLow, 
  createBarrierHigh, 
  createRampMesh, 
  createCoinMesh, 
  createPowerupMesh, 
  createCharacterModel,
  CharacterRig 
} from './models';
import { TrackManager, createCitySkylineBillboard } from './environment';
import { ParticleSystem } from './particles';
import { sounds } from './sound';

export interface EngineCallbacks {
  onStatsUpdate: (stats: GameStats) => void;
  onPowerupUpdate: (activePowerups: ActivePowerup[]) => void;
  onGameOver: (finalStats: GameStats) => void;
  onReviveSuccess: () => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private trackManager: TrackManager;
  private particleSystem: ParticleSystem;
  private characterRig: CharacterRig;
  private cityBillboard: THREE.Mesh | null = null;

  // Lights
  private dirLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight: THREE.HemisphereLight;

  // State
  private state: GameState = 'menu';
  private stats: GameStats = {
    score: 0,
    coins: 0,
    distance: 0,
    multiplier: 1,
    highScore: 0,
    totalCoins: 0,
    hoverboardsOwned: 3,
  };
  private settings: GameSettings = {
    graphicsPreset: 'ultra',
    targetFps: 60,
    soundEnabled: true,
    musicEnabled: true,
    touchSensitivity: 1.0,
    showOnScreenControls: false,
    hapticFeedback: true,
  };

  // Player physics
  private playerLane: number = 0; // -1, 0, 1
  private playerPos = new THREE.Vector3(0, 0, 0);
  private playerVelocityY: number = 0;
  private isGrounded: boolean = true;
  private isRolling: boolean = false;
  private rollTimer: number = 0;
  private rollDuration: number = 0.75;
  private groundY: number = 0; // 0 on tracks, or 3.3 on train roofs

  // Speed
  private baseSpeed: number = 22.0; // m/s
  private currentSpeed: number = 22.0;
  private maxSpeed: number = 44.0;
  private speedMultiplier: number = 1.0;

  // Active powerups
  private activePowerups: Map<PowerupType, { duration: number; timeLeft: number }> = new Map();
  private invulnerableTimer: number = 0;

  // Obstacles & Collectibles
  private obstacles: Obstacle[] = [];
  private collectibles: Collectible[] = [];
  private nextSpawnZ: number = 50;

  // Camera shake & effects
  private cameraShakeIntensity: number = 0;
  private cameraRoll: number = 0;
  private coinCombo: number = 0;
  private lastCoinTime: number = 0;

  // Animation frame
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  // Input handling
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private lastTapTime: number = 0;

  // Callbacks
  private callbacks: EngineCallbacks;

  // Selected skins
  private currentSkin: CharacterSkin = {
    id: 'street_runner',
    name: 'Street Runner',
    hoodieColor: '#2563eb',
    pantsColor: '#1e293b',
    sneakerColor: '#f59e0b',
    accentColor: '#06b6d4',
    unlocked: true,
    cost: 0,
  };

  private currentBoardSkin: HoverboardSkin = {
    id: 'cyber_cyan',
    name: 'Cyber MagLev',
    deckColor: '#0f172a',
    neonGlowColor: '#06b6d4',
    trailColor: '#38bdf8',
    speedBonus: 1.05,
    unlocked: true,
    cost: 0,
  };

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Load saved stats
    this.loadStats();

    // Three.js Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070913);
    this.scene.fog = new THREE.FogExp2(0x070913, 0.009);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.1, 400);
    this.camera.position.set(0, 4.2, -8.5);

    // High performance WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      stencil: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Lighting
    this.ambientLight = new THREE.AmbientLight(0x2d3748, 1.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 1.1);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
    this.dirLight.position.set(25, 45, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.camera.left = -20;
    this.dirLight.shadow.camera.right = 20;
    this.dirLight.shadow.camera.top = 20;
    this.dirLight.shadow.camera.bottom = -20;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Background city skyline billboard
    try {
      this.cityBillboard = createCitySkylineBillboard('/src/assets/images/metro_skyline_night_1791556970274.jpg');
      this.scene.add(this.cityBillboard);
    } catch {
      // Fallback
    }

    // Infinite track manager
    this.trackManager = new TrackManager(this.scene);

    // Particle system
    this.particleSystem = new ParticleSystem(this.scene);

    // Player character rig
    this.characterRig = createCharacterModel(this.currentSkin);
    this.scene.add(this.characterRig.group);

    // Bind event listeners
    this.bindEvents();

    // Start loop
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loadStats() {
    try {
      const saved = localStorage.getItem('subway_ultra_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats.highScore = parsed.highScore || 0;
        this.stats.totalCoins = parsed.totalCoins || 0;
        this.stats.hoverboardsOwned = parsed.hoverboardsOwned ?? 3;
      }
    } catch {
      // Ignore
    }
  }

  private saveStats() {
    try {
      localStorage.setItem('subway_ultra_stats', JSON.stringify({
        highScore: this.stats.highScore,
        totalCoins: this.stats.totalCoins,
        hoverboardsOwned: this.stats.hoverboardsOwned,
      }));
    } catch {
      // Ignore
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);

    // Mobile touch events
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd, { passive: false });

    // WebGL context handlers
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    });

    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state !== 'playing') {
      if (e.code === 'Space' && this.state === 'menu') {
        this.startGame();
      }
      return;
    }

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLane(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveLane(1);
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.jump();
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.roll();
        break;
      case 'KeyB':
        this.activateHoverboard();
        break;
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = performance.now();
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const duration = performance.now() - this.touchStartTime;

    const now = performance.now();

    // Check for double tap to summon hoverboard!
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && duration < 250) {
      if (now - this.lastTapTime < 320) {
        // Double tap!
        this.activateHoverboard();
        this.lastTapTime = 0;
        return;
      }
      this.lastTapTime = now;
      return;
    }

    // Swipe gesture threshold (scaled by touch sensitivity)
    const threshold = 35 / this.settings.touchSensitivity;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (Math.abs(dx) > threshold) {
        if (dx < 0) {
          this.moveLane(-1);
        } else {
          this.moveLane(1);
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(dy) > threshold) {
        if (dy < 0) {
          // Swipe UP: Jump
          this.jump();
        } else {
          // Swipe DOWN: Roll / Fast-dive
          this.roll();
        }
      }
    }
  };

  // Public control methods for on-screen buttons
  public moveLane(direction: -1 | 1) {
    if (this.state !== 'playing') return;
    const targetLane = this.playerLane + direction;
    if (targetLane >= -1 && targetLane <= 1) {
      this.playerLane = targetLane;
      this.cameraRoll = -direction * 0.055; // dynamic camera tilt
      sounds.playDodge();
      this.triggerHaptic(15);
    }
  }

  public jump() {
    if (this.state !== 'playing') return;
    
    // Check if on ground or on train roof
    if (this.isGrounded) {
      const hasSneakers = this.activePowerups.has('sneakers');
      this.playerVelocityY = hasSneakers ? 21.0 : 15.5;
      this.isGrounded = false;
      this.isRolling = false; // jump cancels roll
      
      if (hasSneakers) {
        sounds.playSuperJump();
      } else {
        sounds.playJump();
      }
      this.triggerHaptic(25);
    }
  }

  public roll() {
    if (this.state !== 'playing') return;

    if (!this.isGrounded) {
      // Classic Subway Surfers dive cancel: instant fast fall!
      this.playerVelocityY = -34.0;
    }

    this.isRolling = true;
    this.rollTimer = this.rollDuration;
    sounds.playRoll();
    this.triggerHaptic(20);
    this.particleSystem.emitDust(this.playerPos);
  }

  public activateHoverboard() {
    if (this.state !== 'playing') return;
    if (this.activePowerups.has('hoverboard')) return;

    if (this.stats.hoverboardsOwned <= 0) return;

    this.stats.hoverboardsOwned--;
    this.saveStats();

    this.activePowerups.set('hoverboard', {
      duration: 30,
      timeLeft: 30,
    });

    sounds.playHoverboard();
    this.triggerHaptic([30, 50, 30]);
    this.callbacks.onStatsUpdate({ ...this.stats });
    this.notifyPowerups();
  }

  private triggerHaptic(pattern: number | number[]) {
    if (this.settings.hapticFeedback && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore
      }
    }
  }

  // Game lifecycle
  public startGame() {
    this.state = 'playing';
    this.stats.score = 0;
    this.stats.coins = 0;
    this.stats.distance = 0;
    this.stats.multiplier = 1;
    this.coinCombo = 0;

    this.playerLane = 0;
    this.playerPos.set(0, 0, 0);
    this.playerVelocityY = 0;
    this.isGrounded = true;
    this.isRolling = false;
    this.groundY = 0;

    this.currentSpeed = this.baseSpeed;
    this.activePowerups.clear();
    this.clearObstaclesAndCollectibles();
    this.nextSpawnZ = 45;

    if (this.settings.musicEnabled) {
      sounds.startMusic(140);
    }

    this.callbacks.onStatsUpdate({ ...this.stats });
    this.notifyPowerups();
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      sounds.stopMusic();
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      if (this.settings.musicEnabled) {
        sounds.startMusic(140);
      }
    }
  }

  public revive() {
    if (this.state !== 'gameover') return;
    this.state = 'playing';
    this.invulnerableTimer = 3.0; // 3 seconds invulnerability

    // Push player slightly forward and clear immediate obstacles
    this.playerPos.z += 10;
    this.playerPos.y = 0;
    this.groundY = 0;
    this.isGrounded = true;
    this.playerVelocityY = 0;
    this.isRolling = false;

    // Remove any obstacle within 30m ahead
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.z < this.playerPos.z + 35 && obs.z > this.playerPos.z - 10) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    if (this.settings.musicEnabled) {
      sounds.startMusic(140);
    }

    this.callbacks.onReviveSuccess();
    this.notifyPowerups();
  }

  private triggerGameOver() {
    this.state = 'gameover';
    sounds.playCrash();
    sounds.stopMusic();
    this.cameraShakeIntensity = 1.2;
    this.triggerHaptic([100, 50, 100]);

    this.particleSystem.emitCrashSparks(this.playerPos.clone().add(new THREE.Vector3(0, 1.2, 1.0)));

    // Update high scores and total coins
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = Math.floor(this.stats.score);
    }
    this.stats.totalCoins += this.stats.coins;
    this.saveStats();

    this.callbacks.onGameOver({ ...this.stats });
  }

  private clearObstaclesAndCollectibles() {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.obstacles = [];

    for (const c of this.collectibles) {
      this.scene.remove(c.mesh);
    }
    this.collectibles = [];
  }

  // Spawning procedural chunks
  private spawnPattern(z: number) {
    const laneChoices = [-1, 0, 1];
    const patternType = Math.floor(Math.random() * 6);

    switch (patternType) {
      case 0: {
        // High speed oncoming moving train in one lane + coins in other lanes
        const trainLane = laneChoices[Math.floor(Math.random() * 3)];
        this.spawnMovingTrain(trainLane, z + 50);

        // Hurdles or coins in other lanes
        laneChoices.filter(l => l !== trainLane).forEach((l, idx) => {
          if (idx === 0) {
            this.spawnHurdle(l, z + 20);
            this.spawnCoinArc(l, z + 12, 5);
          } else {
            this.spawnCoinArc(l, z + 10, 8);
            if (Math.random() < 0.25) {
              this.spawnPowerup(l, z + 35);
            }
          }
        });
        break;
      }
      case 1: {
        // Static train with entrance ramp! Player can run on top of train
        const trainLane = laneChoices[Math.floor(Math.random() * 3)];
        this.spawnStaticTrainWithRamp(trainLane, z);

        // Adjacent barrier
        const otherLane = trainLane === 0 ? 1 : 0;
        this.spawnHighBarrier(otherLane, z + 15);
        break;
      }
      case 2: {
        // Double hurdle sequence test
        const freeLane = laneChoices[Math.floor(Math.random() * 3)];
        laneChoices.forEach(l => {
          if (l !== freeLane) {
            if (Math.random() > 0.5) {
              this.spawnHurdle(l, z + 15);
            } else {
              this.spawnHighBarrier(l, z + 15);
            }
          } else {
            this.spawnCoinArc(l, z + 10, 6);
          }
        });
        break;
      }
      case 3: {
        // Two static trains side by side! Middle or side path open
        const blockedLanes = Math.random() > 0.5 ? [-1, 1] : [-1, 0];
        blockedLanes.forEach(l => {
          this.spawnStaticTrain(l, z);
        });
        const openLane = laneChoices.find(l => !blockedLanes.includes(l)) || 0;
        this.spawnCoinArc(openLane, z + 5, 8);
        if (Math.random() < 0.35) {
          this.spawnPowerup(openLane, z + 25);
        }
        break;
      }
      case 4: {
        // Fast succession of low hurdles and high roll barriers
        this.spawnHurdle(0, z + 10);
        this.spawnHighBarrier(0, z + 28);
        this.spawnCoinArc(0, z + 15, 6);

        this.spawnHurdle(-1, z + 20);
        this.spawnHurdle(1, z + 20);
        break;
      }
      case 5: {
        // Moving train on left, static train on right, coin highway in center!
        this.spawnMovingTrain(-1, z + 45);
        this.spawnStaticTrain(1, z);
        this.spawnCoinArc(0, z + 5, 10);
        if (Math.random() < 0.4) {
          this.spawnPowerup(0, z + 30);
        }
        break;
      }
    }
  }

  private spawnMovingTrain(lane: number, z: number) {
    const mesh = createTrainMesh(true, 0xef4444);
    mesh.position.set(lane * LANE_WIDTH, 0, z);
    this.scene.add(mesh);

    const length = 18.0;
    const obs: Obstacle = {
      id: 'train_move_' + Math.random(),
      type: 'train_moving',
      lane,
      z,
      length,
      height: 3.3,
      width: 2.9,
      speed: 15.0, // moving towards player
      canRunOnTop: true,
      mesh,
      colliderBox: new THREE.Box3(),
    };
    this.obstacles.push(obs);

    // Play horn if fairly close
    sounds.playTrainHorn();
  }

  private spawnStaticTrain(lane: number, z: number) {
    const mesh = createTrainMesh(false, 0x2563eb);
    mesh.position.set(lane * LANE_WIDTH, 0, z);
    this.scene.add(mesh);

    const length = 18.0;
    const obs: Obstacle = {
      id: 'train_stat_' + Math.random(),
      type: 'train_static',
      lane,
      z,
      length,
      height: 3.3,
      width: 2.9,
      speed: 0,
      canRunOnTop: true,
      mesh,
      colliderBox: new THREE.Box3(),
    };
    this.obstacles.push(obs);

    // Spawn coins on top of the static train!
    for (let c = 0; c < 6; c++) {
      this.spawnCoin(lane, lane * LANE_WIDTH, 3.8, z - 7.0 + c * 2.5);
    }
  }

  private spawnStaticTrainWithRamp(lane: number, z: number) {
    // Ramp right in front of train
    const rampMesh = createRampMesh();
    rampMesh.position.set(lane * LANE_WIDTH, 0, z - 7.0);
    this.scene.add(rampMesh);

    const rampObs: Obstacle = {
      id: 'ramp_' + Math.random(),
      type: 'ramp_signal',
      lane,
      z: z - 7.0,
      length: 7.0,
      height: 3.2,
      width: 2.8,
      speed: 0,
      canRunOnTop: true,
      mesh: rampMesh,
      colliderBox: new THREE.Box3(),
    };
    this.obstacles.push(rampObs);

    // Train behind ramp
    this.spawnStaticTrain(lane, z + 6.0);
  }

  private spawnHurdle(lane: number, z: number) {
    const mesh = createHurdleLow();
    mesh.position.set(lane * LANE_WIDTH, 0, z);
    this.scene.add(mesh);

    const obs: Obstacle = {
      id: 'hurdle_' + Math.random(),
      type: 'hurdle_low',
      lane,
      z,
      length: 0.5,
      height: 1.25,
      width: 3.2,
      speed: 0,
      canRunOnTop: false,
      mesh,
      colliderBox: new THREE.Box3(),
    };
    this.obstacles.push(obs);
  }

  private spawnHighBarrier(lane: number, z: number) {
    const mesh = createBarrierHigh();
    mesh.position.set(lane * LANE_WIDTH, 0, z);
    this.scene.add(mesh);

    const obs: Obstacle = {
      id: 'barrier_' + Math.random(),
      type: 'barrier_high',
      lane,
      z,
      length: 0.5,
      height: 3.2,
      width: 3.3,
      speed: 0,
      canRunOnTop: false,
      mesh,
      colliderBox: new THREE.Box3(),
    };
    this.obstacles.push(obs);
  }

  private spawnCoin(lane: number, x: number, y: number, z: number) {
    const mesh = createCoinMesh();
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    this.collectibles.push({
      id: 'coin_' + Math.random(),
      type: 'coin',
      lane,
      x,
      y,
      z,
      radius: 0.6,
      collected: false,
      mesh,
    });
  }

  private spawnCoinArc(lane: number, startZ: number, count: number = 6) {
    const laneX = lane * LANE_WIDTH;
    for (let i = 0; i < count; i++) {
      const z = startZ + i * 2.2;
      const arcY = 0.8 + Math.sin((i / (count - 1)) * Math.PI) * 1.5;
      this.spawnCoin(lane, laneX, arcY, z);
    }
  }

  private spawnPowerup(lane: number, z: number) {
    const types: PowerupType[] = ['hoverboard', 'magnet', 'jetpack', 'sneakers', 'multiplier'];
    const selectedType = types[Math.floor(Math.random() * types.length)];

    const mesh = createPowerupMesh(selectedType);
    mesh.position.set(lane * LANE_WIDTH, 1.4, z);
    this.scene.add(mesh);

    this.collectibles.push({
      id: 'powerup_' + Math.random(),
      type: selectedType,
      lane,
      x: lane * LANE_WIDTH,
      y: 1.4,
      z,
      radius: 0.9,
      collected: false,
      mesh,
    });
  }

  private notifyPowerups() {
    const list: ActivePowerup[] = [];
    this.activePowerups.forEach((val, type) => {
      list.push({ type, duration: val.duration, timeLeft: val.timeLeft });
    });
    this.callbacks.onPowerupUpdate(list);
  }

  // Update Loop
  private loop = (time: number) => {
    this.animationFrameId = requestAnimationFrame(this.loop);

    const delta = Math.min((time - this.lastTime) / 1000, 0.05); // cap delta to prevent tunneling
    this.lastTime = time;

    if (this.state === 'playing') {
      this.updatePhysics(delta, time);
      this.updateObstaclesAndCollectibles(delta);
      this.updatePowerups(delta);
      this.updateScore(delta);
    }

    // Camera follow & shake
    this.updateCamera(delta);

    // Particle updates
    this.particleSystem.update(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private updatePhysics(delta: number, time: number) {
    // Forward progression
    const hasJetpack = this.activePowerups.has('jetpack');
    const effectiveSpeed = hasJetpack ? this.currentSpeed * 1.4 : this.currentSpeed;
    this.playerPos.z += effectiveSpeed * delta;
    this.stats.distance = Math.floor(this.playerPos.z);

    // Gradual speed ramping up over distance
    if (this.currentSpeed < this.maxSpeed) {
      this.currentSpeed += delta * 0.12;
    }

    // Smooth horizontal lane transition (spring / lerp)
    const targetX = this.playerLane * LANE_WIDTH;
    this.playerPos.x = THREE.MathUtils.lerp(this.playerPos.x, targetX, 16.0 * delta);

    // Vertical Physics / Jump & Gravity
    if (hasJetpack) {
      // Jetpack hovers smoothly in sky
      const targetJetpackY = 8.5;
      this.playerPos.y = THREE.MathUtils.lerp(this.playerPos.y, targetJetpackY, 8.0 * delta);
      this.isGrounded = false;

      // Emit jetpack thruster flame particles
      const leftNozzle = this.playerPos.clone().add(new THREE.Vector3(-0.3, 0.5, -0.4));
      const rightNozzle = this.playerPos.clone().add(new THREE.Vector3(0.3, 0.5, -0.4));
      this.particleSystem.emitJetpackFlames(leftNozzle, rightNozzle);

      // Jetpack continuous sky coin spawning
      if (Math.random() < 0.25) {
        this.spawnCoin(this.playerLane, this.playerPos.x, 8.5, this.playerPos.z + 20);
      }
    } else {
      const gravity = -38.0;
      this.playerVelocityY += gravity * delta;
      this.playerPos.y += this.playerVelocityY * delta;

      // Check ground collision with current ground level (track = 0, train roof = 3.3)
      if (this.playerPos.y <= this.groundY) {
        this.playerPos.y = this.groundY;
        this.playerVelocityY = 0;
        this.isGrounded = true;

        // Dust when landing
        if (this.isRolling) {
          this.particleSystem.emitDust(this.playerPos);
        }
      } else {
        this.isGrounded = false;
      }
    }

    // Rolling timer
    if (this.isRolling) {
      this.rollTimer -= delta;
      if (this.rollTimer <= 0) {
        this.isRolling = false;
      }
    }

    // Invulnerability decay
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      // Flashing opacity
      this.characterRig.group.visible = Math.floor(time * 15) % 2 === 0;
    } else {
      this.characterRig.group.visible = true;
    }

    // Sync character model position
    this.characterRig.group.position.copy(this.playerPos);

    // Hoverboard particles
    if (this.activePowerups.has('hoverboard')) {
      const leftTrail = this.playerPos.clone().add(new THREE.Vector3(-0.4, 0.2, -0.8));
      const rightTrail = this.playerPos.clone().add(new THREE.Vector3(0.4, 0.2, -0.8));
      this.particleSystem.emitHoverboardTrail(leftTrail, rightTrail);
    }

    // Update character animation rig
    this.characterRig.updateAnimation(
      time * 0.001,
      this.currentSpeed,
      this.isGrounded,
      this.isRolling,
      this.activePowerups.has('hoverboard'),
      hasJetpack
    );

    // Update track chunk recycling
    this.trackManager.update(this.playerPos.z);

    // Keep city billboard following player at the horizon
    if (this.cityBillboard) {
      this.cityBillboard.position.z = this.playerPos.z + 260;
    }

    // Move directional light with player
    this.dirLight.position.set(this.playerPos.x + 25, 45, this.playerPos.z + 30);
    this.dirLight.target.position.set(this.playerPos.x, 0, this.playerPos.z + 20);
    this.dirLight.target.updateMatrixWorld();
  }

  private updateObstaclesAndCollectibles(delta: number) {
    // Check if we need to spawn new patterns ahead
    if (this.nextSpawnZ < this.playerPos.z + 180) {
      this.spawnPattern(this.nextSpawnZ);
      this.nextSpawnZ += 45 + Math.random() * 20;
    }

    // Player bounding box for collisions
    const playerHalfWidth = 0.45;
    const playerHeight = this.isRolling ? 0.75 : 1.9;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.playerPos.x - playerHalfWidth, this.playerPos.y, this.playerPos.z - 0.4),
      new THREE.Vector3(this.playerPos.x + playerHalfWidth, this.playerPos.y + playerHeight, this.playerPos.z + 0.4)
    );

    // Assume ground is 0 unless on top of a train/ramp
    let detectedGround = 0;

    // Update Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];

      // Moving trains advance toward player
      if (obs.speed > 0) {
        obs.z -= obs.speed * delta;
        obs.mesh.position.z = obs.z;
      }

      // Compute bounding box
      const halfW = obs.width * 0.48;
      const halfL = obs.length * 0.5;
      obs.colliderBox.set(
        new THREE.Vector3(obs.mesh.position.x - halfW, 0, obs.z - halfL),
        new THREE.Vector3(obs.mesh.position.x + halfW, obs.height, obs.z + halfL)
      );

      // Check if player is standing on top of this obstacle (train or ramp)
      if (obs.canRunOnTop) {
        const isHorizontallyInside = 
          this.playerPos.x >= obs.mesh.position.x - halfW &&
          this.playerPos.x <= obs.mesh.position.x + halfW &&
          this.playerPos.z >= obs.z - halfL &&
          this.playerPos.z <= obs.z + halfL;

        if (isHorizontallyInside && this.playerPos.y >= obs.height - 0.4) {
          detectedGround = Math.max(detectedGround, obs.height);
        }
      }

      // Check Collision with player
      if (this.invulnerableTimer <= 0 && !this.activePowerups.has('jetpack')) {
        if (playerBox.intersectsBox(obs.colliderBox)) {
          // If player is safely above the obstacle height, don't crash
          const isAbove = this.playerPos.y >= obs.height - 0.2;

          // If obstacle is high barrier and player is rolling underneath, don't crash
          const isRollingUnder = obs.type === 'barrier_high' && this.isRolling && this.playerPos.y < 0.6;

          if (!isAbove && !isRollingUnder) {
            // Collision occurred!
            if (this.activePowerups.has('hoverboard')) {
              // Hoverboard absorbs crash!
              this.activePowerups.delete('hoverboard');
              this.invulnerableTimer = 2.0; // temporary invulnerability
              sounds.playCrash();
              this.particleSystem.emitCrashSparks(this.playerPos);
              this.cameraShakeIntensity = 0.8;
              this.triggerHaptic([60, 40, 60]);

              // Destroy current colliding obstacle
              this.scene.remove(obs.mesh);
              this.obstacles.splice(i, 1);

              this.notifyPowerups();
              continue;
            } else {
              // Fatal crash!
              this.triggerGameOver();
              return;
            }
          }
        }
      }

      // Remove obstacles that are way behind player
      if (obs.z < this.playerPos.z - 35) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    this.groundY = detectedGround;

    // Magnet powerup pull
    const hasMagnet = this.activePowerups.has('magnet');
    const magnetRadius = 14.0;

    // Update Collectibles (Coins and Powerups)
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];

      // Spin animation
      col.mesh.rotation.y += 3.5 * delta;
      col.mesh.rotation.z += 1.0 * delta;

      // Magnet pull towards player
      if (hasMagnet && col.type === 'coin') {
        const dist = Math.hypot(col.x - this.playerPos.x, col.z - this.playerPos.z);
        if (dist < magnetRadius) {
          const pullSpeed = 24.0 * delta;
          col.x = THREE.MathUtils.lerp(col.x, this.playerPos.x, pullSpeed * 0.4);
          col.y = THREE.MathUtils.lerp(col.y, this.playerPos.y + 1.0, pullSpeed * 0.4);
          col.z = THREE.MathUtils.lerp(col.z, this.playerPos.z, pullSpeed * 0.5);
          col.mesh.position.set(col.x, col.y, col.z);
        }
      }

      // Collect distance check
      const pY = this.playerPos.y + 0.9;
      const dx = col.x - this.playerPos.x;
      const dy = col.y - pY;
      const dz = col.z - this.playerPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < (col.radius + 0.6) * (col.radius + 0.6)) {
        // Collected!
        if (col.type === 'coin') {
          const now = performance.now();
          if (now - this.lastCoinTime < 800) {
            this.coinCombo++;
          } else {
            this.coinCombo = 1;
          }
          this.lastCoinTime = now;

          const coinMultiplier = this.activePowerups.has('multiplier') ? 2 : 1;
          this.stats.coins += coinMultiplier;
          this.stats.score += 60 * coinMultiplier * this.stats.multiplier;

          sounds.playCoin(this.coinCombo);
          this.particleSystem.emitCoinBurst(col.mesh.position);
          this.triggerHaptic(12);
        } else {
          // Power-up pickup!
          this.activePowerups.set(col.type as PowerupType, {
            duration: 15,
            timeLeft: 15,
          });
          sounds.playPowerup();
          this.particleSystem.emitCoinBurst(col.mesh.position);
          this.triggerHaptic([30, 30, 30]);
          this.notifyPowerups();
        }

        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
        this.callbacks.onStatsUpdate({ ...this.stats });
        continue;
      }

      // Cleanup passed collectibles
      if (col.z < this.playerPos.z - 20) {
        this.scene.remove(col.mesh);
        this.collectibles.splice(i, 1);
      }
    }
  }

  private updatePowerups(delta: number) {
    let changed = false;
    this.activePowerups.forEach((data, type) => {
      data.timeLeft -= delta;
      if (data.timeLeft <= 0) {
        this.activePowerups.delete(type);
        changed = true;
      }
    });

    if (changed) {
      this.notifyPowerups();
    }
  }

  private updateScore(delta: number) {
    const mult = this.activePowerups.has('multiplier') ? 2 : 1;
    this.stats.score += Math.floor(this.currentSpeed * delta * 5.0 * mult * this.stats.multiplier);
    this.callbacks.onStatsUpdate({ ...this.stats });
  }

  private updateCamera(delta: number) {
    // Smooth camera chase
    const targetCamX = this.playerPos.x * 0.65;
    const hasJetpack = this.activePowerups.has('jetpack');
    const targetCamY = hasJetpack ? 12.0 : this.playerPos.y + 3.8;
    const targetCamZ = this.playerPos.z - 8.2;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, 10.0 * delta);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetCamY, 8.0 * delta);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetCamZ, 14.0 * delta);

    // Look at target ahead of player
    const lookAtTarget = new THREE.Vector3(
      this.playerPos.x * 0.35,
      hasJetpack ? 8.0 : this.playerPos.y + 1.8,
      this.playerPos.z + 14.0
    );

    // Camera shake impact
    if (this.cameraShakeIntensity > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = THREE.MathUtils.lerp(this.cameraShakeIntensity, 0, 8.0 * delta);
    }

    this.camera.lookAt(lookAtTarget);

    // Dynamic FOV widening with speed
    const speedRatio = (this.currentSpeed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed);
    const targetFov = 62 + speedRatio * 12;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 4.0 * delta);

    // Dynamic camera roll tilt when changing lanes
    this.cameraRoll = THREE.MathUtils.lerp(this.cameraRoll, 0, 6.0 * delta);
    this.camera.rotation.z += this.cameraRoll;

    this.camera.updateProjectionMatrix();
  }

  // Settings & Customization
  public setSettings(newSettings: Partial<GameSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    sounds.setMuted(!this.settings.soundEnabled);

    if (this.settings.graphicsPreset === 'performance') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
    } else if (this.settings.graphicsPreset === 'balanced') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.setPixelRatio(1.25);
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public getStats(): GameStats {
    return this.stats;
  }

  public getState(): GameState {
    return this.state;
  }

  public buyHoverboard(cost: number): boolean {
    if (this.stats.totalCoins >= cost) {
      this.stats.totalCoins -= cost;
      this.stats.hoverboardsOwned++;
      this.saveStats();
      this.callbacks.onStatsUpdate({ ...this.stats });
      return true;
    }
    return false;
  }

  public dispose() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    this.renderer.dispose();
  }
}
