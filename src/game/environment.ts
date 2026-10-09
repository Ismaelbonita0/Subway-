import * as THREE from 'three';
import { LANE_WIDTH, TRACK_LANES } from './models';

export const CHUNK_LENGTH = 60;
export const NUM_CHUNKS = 5; // Total active track length = 300m

export class TrackChunk {
  public group: THREE.Group;
  public zStart: number = 0;

  constructor(scene: THREE.Scene, zStart: number) {
    this.group = new THREE.Group();
    this.zStart = zStart;
    this.buildChunk();
    scene.add(this.group);
  }

  private buildChunk() {
    // 1. Ground ballast bed (dark asphalt / track stones)
    const groundGeo = new THREE.PlaneGeometry(24, CHUNK_LENGTH);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x131722,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI * 0.5;
    ground.position.set(0, 0, CHUNK_LENGTH * 0.5);
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. Concrete side walkways & retaining walls
    const wallGeo = new THREE.BoxGeometry(0.8, 1.8, CHUNK_LENGTH);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x222634,
      roughness: 0.7,
      metalness: 0.2,
    });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-10, 0.9, CHUNK_LENGTH * 0.5);
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(10, 0.9, CHUNK_LENGTH * 0.5);
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // 3. Rails and Sleepers for all 3 lanes
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.95,
    });

    const sleeperMat = new THREE.MeshStandardMaterial({
      color: 0x2d241e,
      roughness: 0.8,
      metalness: 0.1,
    });

    const gauge = 1.45; // Rail track gauge
    const sleeperSpacing = 2.0;
    const numSleepers = Math.floor(CHUNK_LENGTH / sleeperSpacing);

    TRACK_LANES.forEach((laneX) => {
      // Left and right steel rail for this lane
      const railGeo = new THREE.BoxGeometry(0.12, 0.14, CHUNK_LENGTH);
      
      const leftRail = new THREE.Mesh(railGeo, railMat);
      leftRail.position.set(laneX - gauge * 0.5, 0.12, CHUNK_LENGTH * 0.5);
      this.group.add(leftRail);

      const rightRail = new THREE.Mesh(railGeo, railMat);
      rightRail.position.set(laneX + gauge * 0.5, 0.12, CHUNK_LENGTH * 0.5);
      this.group.add(rightRail);

      // Sleepers (ties)
      const sleeperGeo = new THREE.BoxGeometry(gauge + 0.6, 0.12, 0.35);
      for (let s = 0; s < numSleepers; s++) {
        const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
        sleeper.position.set(laneX, 0.06, s * sleeperSpacing + sleeperSpacing * 0.5);
        sleeper.receiveShadow = true;
        this.group.add(sleeper);
      }
    });

    // 4. Overhead Catenary Gantry (every chunk)
    const gantryMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8,
    });

    const gantryGroup = new THREE.Group();
    gantryGroup.position.set(0, 0, CHUNK_LENGTH * 0.5);

    // Left and right vertical posts
    const poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 7.5, 12);
    const leftPole = new THREE.Mesh(poleGeo, gantryMat);
    leftPole.position.set(-8.5, 3.75, 0);
    gantryGroup.add(leftPole);

    const rightPole = new THREE.Mesh(poleGeo, gantryMat);
    rightPole.position.set(8.5, 3.75, 0);
    gantryGroup.add(rightPole);

    // Cross beam
    const beamGeo = new THREE.BoxGeometry(17.5, 0.4, 0.4);
    const beam = new THREE.Mesh(beamGeo, gantryMat);
    beam.position.set(0, 7.0, 0);
    gantryGroup.add(beam);

    // Overhead cables running parallel to tracks
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
    const cableGeo = new THREE.BoxGeometry(0.04, 0.04, CHUNK_LENGTH);
    for (let c = -1; c <= 1; c++) {
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.set(c * LANE_WIDTH, 6.4, CHUNK_LENGTH * 0.5);
      this.group.add(cable);
    }

    // Traffic signal on gantry
    const signalMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.0,
    });
    const signalBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.3), gantryMat);
    signalBox.position.set(0, 6.2, 0);
    gantryGroup.add(signalBox);

    const signalLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), signalMat);
    signalLight.position.set(0, 6.2, 0.2);
    gantryGroup.add(signalLight);

    this.group.add(gantryGroup);
  }

  public setPosition(z: number) {
    this.zStart = z;
    this.group.position.z = z;
  }
}

export class TrackManager {
  public chunks: TrackChunk[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    for (let i = 0; i < NUM_CHUNKS; i++) {
      const chunk = new TrackChunk(this.scene, i * CHUNK_LENGTH);
      chunk.setPosition(i * CHUNK_LENGTH);
      this.chunks.push(chunk);
    }
  }

  public update(playerZ: number) {
    // Check if player has progressed past chunks and recycle them to the horizon
    const chunkHalf = CHUNK_LENGTH * 0.5;
    for (const chunk of this.chunks) {
      if (playerZ > chunk.zStart + CHUNK_LENGTH) {
        // Find maximum zStart of all chunks
        let maxZ = 0;
        for (const c of this.chunks) {
          if (c.zStart > maxZ) maxZ = c.zStart;
        }
        chunk.setPosition(maxZ + CHUNK_LENGTH);
      }
    }
  }
}

// Metropolitan city background billboard
export function createCitySkylineBillboard(imagePath: string): THREE.Mesh {
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load(imagePath);
  texture.colorSpace = THREE.SRGBColorSpace;

  const width = 160;
  const height = 90;
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    fog: false,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 25, 260); // positioned in front at horizon
  return mesh;
}
