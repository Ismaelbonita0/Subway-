import * as THREE from 'three';
import { CharacterSkin, HoverboardSkin, PowerupType } from './types';

// Track geometry constants
export const LANE_WIDTH = 3.6; // Distance between tracks: -3.6, 0, +3.6
export const TRACK_LANES = [-LANE_WIDTH, 0, LANE_WIDTH];

// Shared materials for high performance batching
const materialsCache = new Map<string, THREE.Material>();

function getMaterial(key: string, creator: () => THREE.Material): THREE.Material {
  if (!materialsCache.has(key)) {
    materialsCache.set(key, creator());
  }
  return materialsCache.get(key)!;
}

// 1. Realistic Subway Train
export function createTrainMesh(isMoving: boolean = false, colorHex: number = 0x2563eb): THREE.Group {
  const group = new THREE.Group();

  // Train dimensions: width: 3.0, height: 3.4, length: 18.0
  const trainLength = 18.0;
  const trainWidth = 2.9;
  const trainHeight = 3.3;

  // Body: brushed stainless steel / painted metal
  const bodyMat = getMaterial('train_body_' + colorHex, () => new THREE.MeshStandardMaterial({
    color: 0x1e222d,
    roughness: 0.35,
    metalness: 0.85,
  }));

  const stripeMat = getMaterial('train_stripe_' + colorHex, () => new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.3,
    metalness: 0.6,
    emissive: colorHex,
    emissiveIntensity: 0.25,
  }));

  const windowMat = getMaterial('train_windows', () => new THREE.MeshStandardMaterial({
    color: 0xffe899,
    emissive: 0xffba38,
    emissiveIntensity: 0.85,
    roughness: 0.1,
    metalness: 0.2,
  }));

  const roofMat = getMaterial('train_roof', () => new THREE.MeshStandardMaterial({
    color: 0x11141c,
    roughness: 0.7,
    metalness: 0.5,
  }));

  const wheelMat = getMaterial('train_wheels', () => new THREE.MeshStandardMaterial({
    color: 0x090b10,
    roughness: 0.5,
    metalness: 0.9,
  }));

  // Main chassis box
  const bodyGeo = new THREE.BoxGeometry(trainWidth, trainHeight * 0.75, trainLength);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = trainHeight * 0.45;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Curved roof
  const roofGeo = new THREE.CylinderGeometry(trainWidth * 0.52, trainWidth * 0.52, trainLength, 16, 1, false, 0, Math.PI);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.z = Math.PI * 0.5;
  roof.rotation.y = Math.PI * 0.5;
  roof.position.y = trainHeight * 0.8;
  group.add(roof);

  // Side Racing Stripes
  const stripeGeo = new THREE.BoxGeometry(trainWidth + 0.05, 0.4, trainLength - 0.2);
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.y = trainHeight * 0.4;
  group.add(stripe);

  // Side Passenger Windows (5 pairs on each side)
  const windowCount = 6;
  const winWidth = 1.4;
  const winHeight = 0.9;
  for (let i = 0; i < windowCount; i++) {
    const zOffset = -trainLength * 0.4 + (i * (trainLength * 0.8 / (windowCount - 1)));
    const winGeo = new THREE.BoxGeometry(trainWidth + 0.08, winHeight, winWidth);
    const winMesh = new THREE.Mesh(winGeo, windowMat);
    winMesh.position.set(0, trainHeight * 0.55, zOffset);
    group.add(winMesh);
  }

  // Front Windshield (cockpit)
  const frontWindshieldGeo = new THREE.BoxGeometry(trainWidth * 0.85, 1.1, 0.3);
  const frontWinMat = getMaterial('front_windshield', () => new THREE.MeshStandardMaterial({
    color: 0x050c18,
    roughness: 0.1,
    metalness: 0.9,
  }));
  const frontWin = new THREE.Mesh(frontWindshieldGeo, frontWinMat);
  // Facing towards +Z (train travels towards player which is in -Z to +Z direction)
  frontWin.position.set(0, trainHeight * 0.58, trainLength * 0.5 + 0.02);
  group.add(frontWin);

  // Dual High-Beam Headlights
  const headlightMat = getMaterial('train_headlights', () => new THREE.MeshBasicMaterial({
    color: 0xffffff,
  }));
  const headLightGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 16);
  
  const leftLight = new THREE.Mesh(headLightGeo, headlightMat);
  leftLight.rotation.x = Math.PI * 0.5;
  leftLight.position.set(-trainWidth * 0.35, trainHeight * 0.28, trainLength * 0.5 + 0.05);
  group.add(leftLight);

  const rightLight = new THREE.Mesh(headLightGeo, headlightMat);
  rightLight.rotation.x = Math.PI * 0.5;
  rightLight.position.set(trainWidth * 0.35, trainHeight * 0.28, trainLength * 0.5 + 0.05);
  group.add(rightLight);

  // If moving, add a forward spotlight that projects light onto the rails!
  if (isMoving) {
    const spot = new THREE.SpotLight(0xfff0c4, 5.0, 45, Math.PI * 0.25, 0.5, 1.2);
    spot.position.set(0, trainHeight * 0.4, trainLength * 0.5);
    spot.target.position.set(0, 0, trainLength * 0.5 + 25);
    group.add(spot);
    group.add(spot.target);
  }

  // Train Cowcatcher / Pilot grill at the front bottom
  const pilotGeo = new THREE.BoxGeometry(trainWidth * 0.92, 0.35, 0.8);
  const pilot = new THREE.Mesh(pilotGeo, roofMat);
  pilot.position.set(0, 0.2, trainLength * 0.5 - 0.2);
  group.add(pilot);

  // Wheel Bogies
  const bogieZ = [-trainLength * 0.38, trainLength * 0.38];
  bogieZ.forEach((bz) => {
    const bogieGeo = new THREE.BoxGeometry(trainWidth * 0.9, 0.4, 3.2);
    const bogie = new THREE.Mesh(bogieGeo, wheelMat);
    bogie.position.set(0, 0.22, bz);
    group.add(bogie);

    // Wheels
    for (let side = -1; side <= 1; side += 2) {
      for (let wz = -1.1; wz <= 1.1; wz += 2.2) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16), wheelMat);
        wheel.rotation.z = Math.PI * 0.5;
        wheel.position.set(side * (trainWidth * 0.45), 0.38, bz + wz);
        group.add(wheel);
      }
    }
  });

  // Roof AC / Pantograph equipment
  const acGeo = new THREE.BoxGeometry(1.6, 0.4, 4.0);
  const ac = new THREE.Mesh(acGeo, roofMat);
  ac.position.set(0, trainHeight + 0.15, 0);
  group.add(ac);

  return group;
}

// 2. Low Hurdle Obstacle (Jump over or roll under)
export function createHurdleLow(): THREE.Group {
  const group = new THREE.Group();
  const width = 3.2;
  const height = 1.25;

  const barMat = getMaterial('hurdle_bar', () => new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.5,
  }));

  const postMat = getMaterial('hurdle_posts', () => new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.4,
    metalness: 0.8,
  }));

  // Posts
  const postGeo = new THREE.CylinderGeometry(0.12, 0.14, height, 12);
  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(-width * 0.45, height * 0.5, 0);
  leftPost.castShadow = true;
  group.add(leftPost);

  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(width * 0.45, height * 0.5, 0);
  rightPost.castShadow = true;
  group.add(rightPost);

  // Horizontal Crossbar with hazard stripes
  const barGeo = new THREE.BoxGeometry(width, 0.35, 0.2);
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.position.set(0, height * 0.75, 0);
  bar.castShadow = true;
  group.add(bar);

  // Warning hazard light in center
  const lightMat = getMaterial('hazard_light', () => new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xef4444,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  }));
  const hazardLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), lightMat);
  hazardLight.position.set(0, height * 0.95, 0);
  group.add(hazardLight);

  return group;
}

// 3. High Barrier (Must roll / slide under!)
export function createBarrierHigh(): THREE.Group {
  const group = new THREE.Group();
  const width = 3.3;
  const totalHeight = 3.2;
  const openingHeight = 1.6; // Clear space under which player slides

  const metalMat = getMaterial('barrier_metal', () => new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.4,
    metalness: 0.6,
  }));

  const frameMat = getMaterial('barrier_frame', () => new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.5,
    metalness: 0.8,
  }));

  // Tall side pillars
  const pillarGeo = new THREE.BoxGeometry(0.25, totalHeight, 0.25);
  const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
  leftPillar.position.set(-width * 0.48, totalHeight * 0.5, 0);
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
  rightPillar.position.set(width * 0.48, totalHeight * 0.5, 0);
  group.add(rightPillar);

  // Heavy upper blockage board
  const boardGeo = new THREE.BoxGeometry(width, totalHeight - openingHeight, 0.22);
  const board = new THREE.Mesh(boardGeo, metalMat);
  board.position.set(0, openingHeight + (totalHeight - openingHeight) * 0.5, 0);
  board.castShadow = true;
  group.add(board);

  // Warning blinking LED beacon
  const redBeacon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.25, 12), getMaterial('beacon_red', () => new THREE.MeshStandardMaterial({
    color: 0xff1100,
    emissive: 0xff0000,
    emissiveIntensity: 1.2,
  })));
  redBeacon.position.set(0, totalHeight + 0.12, 0);
  group.add(redBeacon);

  return group;
}

// 4. Ramp leading onto static train
export function createRampMesh(): THREE.Group {
  const group = new THREE.Group();
  const rampLength = 7.0;
  const rampWidth = 2.8;
  const rampHeight = 3.2;

  const rampMat = getMaterial('ramp_metal', () => new THREE.MeshStandardMaterial({
    color: 0x374151,
    roughness: 0.4,
    metalness: 0.8,
  }));

  const stripeMat = getMaterial('ramp_stripe', () => new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.4,
  }));

  // Inclined ramp slope
  const slopeGeo = new THREE.BoxGeometry(rampWidth, 0.3, rampLength);
  const slope = new THREE.Mesh(slopeGeo, rampMat);
  const angle = Math.atan2(rampHeight, rampLength);
  slope.rotation.x = angle;
  slope.position.set(0, rampHeight * 0.5, rampLength * 0.5);
  slope.castShadow = true;
  slope.receiveShadow = true;
  group.add(slope);

  // Edge guide stripes
  const edgeGeo = new THREE.BoxGeometry(0.15, 0.35, rampLength);
  const leftEdge = new THREE.Mesh(edgeGeo, stripeMat);
  leftEdge.rotation.x = angle;
  leftEdge.position.set(-rampWidth * 0.46, rampHeight * 0.5 + 0.05, rampLength * 0.5);
  group.add(leftEdge);

  const rightEdge = new THREE.Mesh(edgeGeo, stripeMat);
  rightEdge.rotation.x = angle;
  rightEdge.position.set(rampWidth * 0.46, rampHeight * 0.5 + 0.05, rampLength * 0.5);
  group.add(rightEdge);

  return group;
}

// 5. Collectible Coin
export function createCoinMesh(): THREE.Group {
  const group = new THREE.Group();

  const coinMat = getMaterial('coin_gold', () => new THREE.MeshStandardMaterial({
    color: 0xffb703,
    roughness: 0.2,
    metalness: 0.9,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.3,
  }));

  // Cylinder medallion
  const coinGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 20);
  const coin = new THREE.Mesh(coinGeo, coinMat);
  coin.rotation.x = Math.PI * 0.5;
  group.add(coin);

  // Inner star / rim ring
  const ringGeo = new THREE.TorusGeometry(0.38, 0.04, 8, 20);
  const ring = new THREE.Mesh(ringGeo, coinMat);
  group.add(ring);

  return group;
}

// 6. 3D Powerup Pickups
export function createPowerupMesh(type: PowerupType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'hoverboard') {
    // Sleek mini hoverboard
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 1.6), boardMat);
    group.add(deck);

    // Glowing thrusters
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), thrusterMat);
    t1.position.set(-0.25, -0.1, 0.5);
    group.add(t1);
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), thrusterMat);
    t2.position.set(0.25, -0.1, -0.5);
    group.add(t2);
  } else if (type === 'magnet') {
    // Horseshoe magnet
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.7 });
    const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.9 });
    
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.14, 12, 16, Math.PI), redMat);
    arch.rotation.z = Math.PI;
    arch.position.y = 0.2;
    group.add(arch);

    const tip1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), silverMat);
    tip1.position.set(-0.45, -0.1, 0);
    group.add(tip1);

    const tip2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.28), silverMat);
    tip2.position.set(0.45, -0.1, 0);
    group.add(tip2);
  } else if (type === 'jetpack') {
    // Twin rocket jetpack
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.25, metalness: 0.85 });
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: 0xea580c, emissiveIntensity: 0.6 });

    const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.9, 16), jetMat);
    cyl1.position.set(-0.28, 0, 0);
    group.add(cyl1);

    const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.9, 16), jetMat);
    cyl2.position.set(0.28, 0, 0);
    group.add(cyl2);

    const noz1 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 16), nozzleMat);
    noz1.position.set(-0.28, -0.55, 0);
    group.add(noz1);

    const noz2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 16), nozzleMat);
    noz2.position.set(0.28, -0.55, 0);
    group.add(noz2);
  } else if (type === 'sneakers') {
    // Super sneakers with bouncy spring
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.5 });
    const springMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.9 });

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.9), shoeMat);
    shoe.position.y = 0.2;
    group.add(shoe);

    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.35, 12), springMat);
    spring.position.y = -0.15;
    group.add(spring);
  } else if (type === 'multiplier') {
    // 2x Holographic spinning prism
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x9333ea,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.7,
      wireframe: false,
    });
    const cube = new THREE.Mesh(new THREE.OctahedronGeometry(0.55), cubeMat);
    group.add(cube);
  }

  // Floating ambient glow sphere
  const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.12,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  return group;
}

// 7. Dynamic Articulated Runner Character
export interface CharacterRig {
  group: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  hoverboardMesh: THREE.Group;
  jetpackMesh: THREE.Group;
  updateAnimation: (
    time: number, 
    speed: number, 
    isGrounded: boolean, 
    isRolling: boolean, 
    hasHoverboard: boolean, 
    hasJetpack: boolean
  ) => void;
}

export function createCharacterModel(skin: CharacterSkin): CharacterRig {
  const root = new THREE.Group();

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x9a6549, // Warm skin tone
    roughness: 0.6,
    metalness: 0.1,
  });

  const hoodieMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.hoodieColor),
    roughness: 0.5,
    metalness: 0.2,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.pantsColor),
    roughness: 0.6,
    metalness: 0.1,
  });

  const shoeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.sneakerColor),
    roughness: 0.3,
    metalness: 0.3,
  });

  const headphoneMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skin.accentColor),
    emissive: new THREE.Color(skin.accentColor),
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Pelvis / Hips center
  const hips = new THREE.Group();
  hips.position.y = 1.15;
  root.add(hips);

  // Torso / Hoodie
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.85, 0.45);
  const torso = new THREE.Mesh(torsoGeo, hoodieMat);
  torso.position.y = 0.45;
  torso.castShadow = true;
  hips.add(torso);

  // Neck & Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 0.95;
  torso.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.castShadow = true;
  headGroup.add(head);

  // Street Cap
  const capGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.14, 16);
  const cap = new THREE.Mesh(capGeo, hoodieMat);
  cap.position.y = 0.18;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.28), hoodieMat);
  visor.position.set(0, 0.12, 0.28);
  cap.add(visor);
  headGroup.add(cap);

  // Glowing Neon Headphones
  const phoneBand = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 16, Math.PI), headphoneMat);
  phoneBand.rotation.z = Math.PI;
  phoneBand.position.y = 0.1;
  headGroup.add(phoneBand);

  const cupGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
  const leftCup = new THREE.Mesh(cupGeo, headphoneMat);
  leftCup.rotation.z = Math.PI * 0.5;
  leftCup.position.set(-0.3, 0.0, 0);
  headGroup.add(leftCup);

  const rightCup = new THREE.Mesh(cupGeo, headphoneMat);
  rightCup.rotation.z = Math.PI * 0.5;
  rightCup.position.set(0.3, 0.0, 0);
  headGroup.add(rightCup);

  // Arms (shoulders pivot)
  const armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.2);
  
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.48, 0.35, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, hoodieMat);
  leftArmMesh.position.y = -0.32;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  torso.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.48, 0.35, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, hoodieMat);
  rightArmMesh.position.y = -0.32;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);
  torso.add(rightArm);

  // Legs (hip joints pivot)
  const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.24);
  const shoeGeo = new THREE.BoxGeometry(0.26, 0.2, 0.44);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.22, 0, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.42;
  leftLegMesh.castShadow = true;
  leftLeg.add(leftLegMesh);
  const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
  leftShoe.position.set(0, -0.85, 0.1);
  leftLeg.add(leftShoe);
  hips.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.22, 0, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.42;
  rightLegMesh.castShadow = true;
  rightLeg.add(rightLegMesh);
  const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
  rightShoe.position.set(0, -0.85, 0.1);
  rightLeg.add(rightShoe);
  hips.add(rightLeg);

  // Attached Hoverboard (under feet when active)
  const hoverboardMesh = new THREE.Group();
  const hDeckMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.2,
  });
  const hGlowMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.9,
    roughness: 0.1,
  });
  const hDeck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 2.2), hDeckMat);
  hoverboardMesh.add(hDeck);
  const hGlow1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16), hGlowMat);
  hGlow1.position.set(0, -0.08, 0.7);
  hoverboardMesh.add(hGlow1);
  const hGlow2 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16), hGlowMat);
  hGlow2.position.set(0, -0.08, -0.7);
  hoverboardMesh.add(hGlow2);

  hoverboardMesh.position.y = 0.15;
  hoverboardMesh.visible = false;
  root.add(hoverboardMesh);

  // Attached Jetpack (on back)
  const jetpackMesh = new THREE.Group();
  const jpMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const jpThrustMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.75, 12), jpMat);
  c1.position.set(-0.2, 0, -0.3);
  jetpackMesh.add(c1);
  const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.75, 12), jpMat);
  c2.position.set(0.2, 0, -0.3);
  jetpackMesh.add(c2);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12), jpThrustMat);
  nozzle.position.set(-0.2, -0.45, -0.3);
  jetpackMesh.add(nozzle);
  const nozzle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.2, 12), jpThrustMat);
  nozzle2.position.set(0.2, -0.45, -0.3);
  jetpackMesh.add(nozzle2);

  jetpackMesh.position.set(0, 0.45, 0);
  jetpackMesh.visible = false;
  torso.add(jetpackMesh);

  // Animation controller
  const updateAnimation = (
    time: number, 
    speed: number, 
    isGrounded: boolean, 
    isRolling: boolean, 
    hasHoverboard: boolean, 
    hasJetpack: boolean
  ) => {
    hoverboardMesh.visible = hasHoverboard;
    jetpackMesh.visible = hasJetpack;

    if (hasHoverboard) {
      // Surfing pose: body angled 45 degrees sideways, knees slightly bent, arms balanced
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0.45, 0.15);
      hips.position.y = THREE.MathUtils.lerp(hips.position.y, 1.0, 0.2);
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, 0.08, 0.2);
      
      leftArm.rotation.x = -0.5;
      leftArm.rotation.z = -0.4;
      rightArm.rotation.x = 0.5;
      rightArm.rotation.z = 0.4;

      leftLeg.rotation.x = -0.2;
      rightLeg.rotation.x = 0.3;

      // Hoverboard subtle bobbing
      hoverboardMesh.position.y = 0.15 + Math.sin(time * 8) * 0.05;
      hoverboardMesh.rotation.z = Math.sin(time * 6) * 0.04;
      return;
    }

    // Normal facing forward
    root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0, 0.2);

    if (isRolling) {
      // Crouch / Tuck slide animation
      hips.position.y = THREE.MathUtils.lerp(hips.position.y, 0.4, 0.3);
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, 1.1, 0.3);
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      leftLeg.rotation.x = -1.4;
      rightLeg.rotation.x = -1.4;
      return;
    }

    if (!isGrounded || hasJetpack) {
      // In air / jumping / jetpack flying
      hips.position.y = THREE.MathUtils.lerp(hips.position.y, 1.15, 0.2);
      torso.rotation.x = THREE.MathUtils.lerp(torso.rotation.x, -0.15, 0.2);
      leftArm.rotation.x = -1.0;
      rightArm.rotation.x = -1.0;
      leftLeg.rotation.x = 0.4;
      rightLeg.rotation.x = -0.3;
      return;
    }

    // Realistic run cycle
    const runFreq = speed * 0.7; // run stride speed scales with velocity
    const stride = Math.sin(time * runFreq);
    const armStride = Math.cos(time * runFreq);

    hips.position.y = 1.15 + Math.abs(Math.sin(time * runFreq * 2)) * 0.08;
    torso.rotation.x = 0.12; // slight forward athletic lean
    torso.rotation.y = stride * 0.08;

    leftLeg.rotation.x = stride * 0.85;
    rightLeg.rotation.x = -stride * 0.85;

    leftArm.rotation.x = -armStride * 0.9;
    rightArm.rotation.x = armStride * 0.9;
  };

  return {
    group: root,
    torso,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    hoverboardMesh,
    jetpackMesh,
    updateAnimation,
  };
}
