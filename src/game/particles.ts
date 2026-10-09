import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private maxParticles: number = 600;

  private positionsArray: Float32Array;
  private colorsArray: Float32Array;

  constructor(scene: THREE.Scene) {
    this.positionsArray = new Float32Array(this.maxParticles * 3);
    this.colorsArray = new Float32Array(this.maxParticles * 3);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positionsArray, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colorsArray, 3));

    this.material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);
  }

  public emitDust(origin: THREE.Vector3) {
    if (this.particles.length >= this.maxParticles) return;
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        position: new THREE.Vector3(
          origin.x + (Math.random() - 0.5) * 0.4,
          origin.y + 0.1,
          origin.z - 0.2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 1.2,
          -Math.random() * 2.0
        ),
        color: new THREE.Color(0x94a3b8),
        size: 0.18,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.2,
      });
    }
  }

  public emitCoinBurst(origin: THREE.Vector3) {
    for (let i = 0; i < 16; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 4.5;
      this.particles.push({
        position: origin.clone(),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed + 2.0,
          (Math.random() - 0.5) * speed
        ),
        color: new THREE.Color(0xffd700),
        size: 0.35,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
  }

  public emitHoverboardTrail(leftOrigin: THREE.Vector3, rightOrigin: THREE.Vector3) {
    const origins = [leftOrigin, rightOrigin];
    origins.forEach((orig) => {
      if (this.particles.length >= this.maxParticles) return;
      this.particles.push({
        position: orig.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          -0.5,
          -3.5 - Math.random() * 2.0
        ),
        color: new THREE.Color(0x06b6d4),
        size: 0.28,
        life: 0,
        maxLife: 0.3,
      });
    });
  }

  public emitJetpackFlames(leftNozzle: THREE.Vector3, rightNozzle: THREE.Vector3) {
    const nozzles = [leftNozzle, rightNozzle];
    nozzles.forEach((noz) => {
      for (let i = 0; i < 2; i++) {
        if (this.particles.length >= this.maxParticles) break;
        this.particles.push({
          position: noz.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.8,
            -6.0 - Math.random() * 3.0,
            -4.0
          ),
          color: Math.random() > 0.5 ? new THREE.Color(0xf97316) : new THREE.Color(0xfacc15),
          size: 0.35,
          life: 0,
          maxLife: 0.25,
        });
      }
    });
  }

  public emitCrashSparks(origin: THREE.Vector3) {
    for (let i = 0; i < 35; i++) {
      if (this.particles.length >= this.maxParticles) break;
      this.particles.push({
        position: origin.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 12.0,
          Math.random() * 9.0,
          (Math.random() - 0.5) * 12.0
        ),
        color: Math.random() > 0.3 ? new THREE.Color(0xff4500) : new THREE.Color(0xffffff),
        size: 0.4,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  public update(delta: number) {
    let writeIdx = 0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * 0.4 * delta; // slight gravity

      // Fade factor
      const alpha = 1.0 - (p.life / p.maxLife);

      if (writeIdx < this.maxParticles) {
        this.positionsArray[writeIdx * 3] = p.position.x;
        this.positionsArray[writeIdx * 3 + 1] = p.position.y;
        this.positionsArray[writeIdx * 3 + 2] = p.position.z;

        this.colorsArray[writeIdx * 3] = p.color.r * alpha;
        this.colorsArray[writeIdx * 3 + 1] = p.color.g * alpha;
        this.colorsArray[writeIdx * 3 + 2] = p.color.b * alpha;

        writeIdx++;
      }
    }

    // Zero out unused
    for (let i = writeIdx; i < this.maxParticles; i++) {
      this.positionsArray[i * 3] = 0;
      this.positionsArray[i * 3 + 1] = -100;
      this.positionsArray[i * 3 + 2] = 0;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  public clear() {
    this.particles = [];
  }
}
