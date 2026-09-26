import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  createRosePetalGeometry,
  createRoseSepalGeometry,
  createRosePetalTexture,
  createRoseRoughnessMap,
  createGlowTexture,
  createHeartTexture,
  PetalData,
} from './flowerUtils';
import { ExperiencePhase } from '../types';

interface FlowerCanvasProps {
  phase: ExperiencePhase;
  onBloomComplete: () => void;
}

export const FlowerCanvas: React.FC<FlowerCanvasProps> = ({ phase, onBloomComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bloomTriggeredRef = useRef<boolean>(false);
  const onBloomCompleteRef = useRef(onBloomComplete);
  onBloomCompleteRef.current = onBloomComplete;

  // Track phase smoothly via ref to eliminate WebGL re-initialization lag
  const phaseRef = useRef<ExperiencePhase>(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060104, 0.038);

    // 2. Camera setup - Optimized for BOTH PC widescreen and phone portrait
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;
    let aspect = width / height;

    const computeCameraZ = (asp: number) => {
      // Calibrated so blooming rose is 100% visible on both narrow phones and wide PC displays
      if (asp < 0.55) return 9.4;
      if (asp < 0.75) return 8.6;
      if (asp < 1.1) return 7.6;
      return 6.8;
    };

    let currentCamZ = computeCameraZ(aspect);
    let currentCamY = aspect < 0.75 ? 0.38 : 0.25;

    const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
    camera.position.set(0, currentCamY, currentCamZ);

    // 3. Renderer setup with realistic filmic tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.appendChild(renderer.domElement);

    // 4. Realistic Organic Rose Lighting
    // Soft diffused overhead sunlight
    const keyLight = new THREE.DirectionalLight(0xfff3f5, 1.9);
    keyLight.position.set(3.5, 7.5, 4.2);
    scene.add(keyLight);

    // Soft warm secondary fill light for velvety crimson shadows
    const fillLight = new THREE.DirectionalLight(0xcc294a, 1.3);
    fillLight.position.set(-4.5, 2.5, 2.5);
    scene.add(fillLight);

    // Backlight / Rim light: creates translucent subsurface scattering illusion through real red rose petals
    const backRimLight = new THREE.DirectionalLight(0xff4d6d, 1.6);
    backRimLight.position.set(0, -1.8, -5.5);
    scene.add(backRimLight);

    // Velvet ambient light for rich deep crimson shadows
    const ambientLight = new THREE.AmbientLight(0x35030e, 1.9);
    scene.add(ambientLight);

    // Glowing warm core light nestled deep inside the rosebud
    const coreLight = new THREE.PointLight(0xff1e4a, 0.6, 7.5, 1.5);
    coreLight.position.set(0, 0.35, 0);
    scene.add(coreLight);

    // 5. Flower Root Group
    const flowerGroup = new THREE.Group();
    flowerGroup.position.set(0, isMobile ? -0.12 : 0.06, 0);
    scene.add(flowerGroup);

    // 6. Natural Organic Rose Stem, Receptacle (Rose Hip) & Thorns
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.22, 0),
      new THREE.Vector3(0.05, -1.1, -0.05),
      new THREE.Vector3(-0.05, -2.3, 0.05),
      new THREE.Vector3(0.04, -3.8, -0.02),
    ]);
    const stemGeom = new THREE.TubeGeometry(stemCurve, 36, 0.08, 14, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x224823,
      roughness: 0.82,
      metalness: 0.0,
    });
    const stemMesh = new THREE.Mesh(stemGeom, stemMat);
    flowerGroup.add(stemMesh);

    // Swollen green receptacle (Hypanthium / Rose Hip) directly under the petals
    const receptacleGeom = new THREE.SphereGeometry(0.24, 20, 20);
    receptacleGeom.scale(1.0, 1.15, 1.0);
    const receptacleMat = new THREE.MeshStandardMaterial({
      color: 0x275329,
      roughness: 0.78,
      metalness: 0.0,
    });
    const receptacleMesh = new THREE.Mesh(receptacleGeom, receptacleMat);
    receptacleMesh.position.set(0, -0.24, 0);
    flowerGroup.add(receptacleMesh);

    // Realistic rose thorns (prickles) along the stem
    const thornGeom = new THREE.ConeGeometry(0.045, 0.22, 8);
    thornGeom.rotateZ(Math.PI * 0.45);
    const thornMat = new THREE.MeshStandardMaterial({
      color: 0x5a2420,
      roughness: 0.8,
      metalness: 0.0,
    });
    const thornPositions = [
      { y: -0.7, angle: 0.4 },
      { y: -1.4, angle: 2.2 },
      { y: -2.1, angle: 4.1 },
      { y: -2.9, angle: 1.2 },
    ];
    thornPositions.forEach((tp) => {
      const pt = stemCurve.getPointAt((-tp.y) / 3.8);
      const thorn = new THREE.Mesh(thornGeom, thornMat);
      thorn.position.set(pt.x + Math.cos(tp.angle) * 0.08, tp.y, pt.z + Math.sin(tp.angle) * 0.08);
      thorn.rotation.y = tp.angle;
      flowerGroup.add(thorn);
    });

    // 5 Characteristic Lanceolate Rose Sepals that reflex backward
    const sepalGeom = createRoseSepalGeometry(0.26, 1.35);
    const sepalMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const sepalPivot = new THREE.Group();
      const angle = (i / 5) * Math.PI * 2 + 0.25;
      sepalPivot.rotation.y = angle;
      const sepalMesh = new THREE.Mesh(sepalGeom, sepalMat);
      sepalMesh.rotation.x = 0.65;
      sepalMesh.position.set(0, -0.22, 0.16);
      sepalPivot.add(sepalMesh);
      flowerGroup.add(sepalPivot);
    }

    // 7. Hidden Deep Golden Pistils & Stamens (Visible as the rose unfolds)
    const stamenGroup = new THREE.Group();
    const stamenCount = isMobile ? 32 : 48;
    const stamenTipMat = new THREE.MeshStandardMaterial({
      color: 0xffe270,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
      roughness: 0.6,
      metalness: 0.0,
    });
    const stamenTipGeom = new THREE.SphereGeometry(0.028, 8, 8);
    const filamentMat = new THREE.LineBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.65 });

    for (let i = 0; i < stamenCount; i++) {
      const radius = 0.04 + Math.random() * 0.18;
      const angle = Math.random() * Math.PI * 2;
      const heightVal = 0.18 + Math.random() * 0.24;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const filamentPoints = [
        new THREE.Vector3(x * 0.3, 0.02, z * 0.3),
        new THREE.Vector3(x, heightVal, z),
      ];
      const filamentGeom = new THREE.BufferGeometry().setFromPoints(filamentPoints);
      const filamentLine = new THREE.Line(filamentGeom, filamentMat);
      stamenGroup.add(filamentLine);

      const tipMesh = new THREE.Mesh(stamenTipGeom, stamenTipMat);
      tipMesh.position.set(x, heightVal, z);
      stamenGroup.add(tipMesh);
    }
    flowerGroup.add(stamenGroup);

    // Glowing warm interior sphere for soft depth
    const glowCoreGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const glowCoreMat = new THREE.MeshBasicMaterial({
      color: 0xff3b62,
      transparent: true,
      opacity: 0.32,
    });
    const glowCore = new THREE.Mesh(glowCoreGeom, glowCoreMat);
    glowCore.position.set(0, 0.24, 0);
    flowerGroup.add(glowCore);

    // 8. Authentic Red Rose Petal System (The Golden Spiral of a Real Rose)
    const petalsData: PetalData[] = [];

    // Real Velvet Red Rose Material: non-metallic, organic light diffusion
    const roseTexture = createRosePetalTexture();
    const roseRoughness = createRoseRoughnessMap();
    const petalMaterial = new THREE.MeshStandardMaterial({
      map: roseTexture,
      roughnessMap: roseRoughness,
      vertexColors: true,
      roughness: 0.68,
      metalness: 0.0, // Strictly non-metallic
      transparent: true,
      opacity: 0.99,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide,
    });

    // 6 Distinct Whorl Layers matching real English Red Roses (Rosa damascena)
    const layerConfigs = [
      // Layer 0: The Spiral Core ("The Eye" - tight conical spiral swirl)
      {
        count: 6,
        width: 0.52,
        height: 1.12,
        cup: 0.48,
        curl: 0.08,
        lateralRoll: 0.05,
        ruffle: 0.02,
        closedTiltX: 0.12,
        openTiltX: 0.28,
        spiralOffset: 0.65, // Spiral swirl angle
        closedRadius: 0.05,
        openRadius: 0.14,
        baseDelay: 1.9,
      },
      // Layer 1: Inner Whorl (wrapping closely around the spiral core)
      {
        count: 7,
        width: 0.74,
        height: 1.38,
        cup: 0.46,
        curl: 0.16,
        lateralRoll: 0.12,
        ruffle: 0.035,
        closedTiltX: 0.22,
        openTiltX: 0.56,
        spiralOffset: 0.45,
        closedRadius: 0.11,
        openRadius: 0.28,
        baseDelay: 1.4,
      },
      // Layer 2: Mid-Inner Whorl (first visible reflexed rose apex tips)
      {
        count: 8,
        width: 0.98,
        height: 1.72,
        cup: 0.42,
        curl: 0.28,
        lateralRoll: 0.2,
        ruffle: 0.05,
        closedTiltX: 0.32,
        openTiltX: 0.88,
        spiralOffset: 0.28,
        closedRadius: 0.18,
        openRadius: 0.48,
        baseDelay: 0.9,
      },
      // Layer 3: Mid Blooming Whorl (wide spade shape with classic rose reflexed margins)
      {
        count: 9,
        width: 1.24,
        height: 2.05,
        cup: 0.36,
        curl: 0.38,
        lateralRoll: 0.26,
        ruffle: 0.065,
        closedTiltX: 0.42,
        openTiltX: 1.22,
        spiralOffset: 0.12,
        closedRadius: 0.25,
        openRadius: 0.72,
        baseDelay: 0.5,
      },
      // Layer 4: Outer Flaring Whorl (rolling backward elegantly)
      {
        count: 9,
        width: 1.44,
        height: 2.32,
        cup: 0.3,
        curl: 0.48,
        lateralRoll: 0.32,
        ruffle: 0.08,
        closedTiltX: 0.5,
        openTiltX: 1.5,
        spiralOffset: 0.0,
        closedRadius: 0.32,
        openRadius: 0.94,
        baseDelay: 0.2,
      },
      // Layer 5: Guard Petals (broad lush petals framing the bottom of the rose)
      {
        count: 9,
        width: 1.62,
        height: 2.48,
        cup: 0.24,
        curl: 0.58,
        lateralRoll: 0.38,
        ruffle: 0.09,
        closedTiltX: 0.58,
        openTiltX: 1.74,
        spiralOffset: 0.0,
        closedRadius: 0.38,
        openRadius: 1.14,
        baseDelay: 0.0, // Outermost guard petals relax first
      },
    ];

    layerConfigs.forEach((config, layerIndex) => {
      const petalGeom = createRosePetalGeometry(
        config.width,
        config.height,
        config.cup,
        config.curl,
        config.lateralRoll,
        config.ruffle
      );

      for (let i = 0; i < config.count; i++) {
        const pivot = new THREE.Group();
        // Golden ratio phyllotaxis angle for authentic rose spiral
        const angle = (i / config.count) * Math.PI * 2 + layerIndex * 0.78 + (i * 0.14);
        pivot.rotation.y = angle;

        const mesh = new THREE.Mesh(petalGeom, petalMaterial);
        // Closed bud starting state
        mesh.rotation.x = config.closedTiltX;
        mesh.position.set(0, 0, config.closedRadius);

        // Natural spiral overlap twist
        mesh.rotation.y = config.spiralOffset;
        mesh.rotation.z = 0.06 * Math.sin(angle);

        pivot.add(mesh);
        flowerGroup.add(pivot);

        petalsData.push({
          pivot,
          mesh,
          layer: layerIndex,
          index: i,
          closedRotX: config.closedTiltX,
          closedRotY: config.spiralOffset,
          closedRotZ: 0.06 * Math.sin(angle),
          openRotX: config.openTiltX,
          openRotY: config.spiralOffset * 0.4 + (Math.random() - 0.5) * 0.06,
          openRotZ: (Math.random() - 0.5) * 0.1,
          staggerDelay: config.baseDelay + i * 0.08 + Math.random() * 0.05,
          duration: 3.0 + Math.random() * 0.4,
          flutterSpeed: 0.9 + Math.random() * 0.7,
          flutterAmp: 0.012 + Math.random() * 0.012,
        });
      }
    });

    // 9. Floating Fairy Stardust Particles
    const stardustCount = isMobile ? 60 : 110;
    const stardustGeom = new THREE.BufferGeometry();
    const stardustPositions = new Float32Array(stardustCount * 3);
    const stardustVelocities: { x: number; y: number; z: number; phase: number; speed: number }[] = [];

    const glowTexture = createGlowTexture(64, '#ffffff', 'rgba(255, 100, 130, 0)');

    for (let i = 0; i < stardustCount; i++) {
      const rad = Math.random() * 0.25;
      const theta = Math.random() * Math.PI * 2;
      const startY = 0.2 + Math.random() * 0.4;
      stardustPositions[i * 3] = Math.cos(theta) * rad;
      stardustPositions[i * 3 + 1] = startY;
      stardustPositions[i * 3 + 2] = Math.sin(theta) * rad;

      stardustVelocities.push({
        x: (Math.random() - 0.5) * 0.005,
        y: 0.007 + Math.random() * 0.011,
        z: (Math.random() - 0.5) * 0.005,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.8,
      });
    }

    stardustGeom.setAttribute('position', new THREE.BufferAttribute(stardustPositions, 3));
    const stardustMat = new THREE.PointsMaterial({
      size: isMobile ? 0.13 : 0.17,
      map: glowTexture,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stardustPoints = new THREE.Points(stardustGeom, stardustMat);
    flowerGroup.add(stardustPoints);

    // 10. Emerging Glowing Hearts System (লাভ) - Emerge directly from the rose core with the light
    const heartTexture = createHeartTexture(128);
    const heartCount = isMobile ? 26 : 38;
    const heartGroup = new THREE.Group();
    flowerGroup.add(heartGroup);

    interface HeartParticleData {
      sprite: THREE.Sprite;
      maxHeight: number;
      spreadRadius: number;
      baseAngle: number;
      spiralSpeed: number;
      swayFreq: number;
      swayPhase: number;
      baseScale: number;
      delay: number;
      lifespan: number;
      age: number;
    }

    const heartsData: HeartParticleData[] = [];
    for (let i = 0; i < heartCount; i++) {
      const spriteMat = new THREE.SpriteMaterial({
        map: heartTexture,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(0, 0.28, 0);
      sprite.scale.set(0.001, 0.001, 0.001);
      heartGroup.add(sprite);

      heartsData.push({
        sprite,
        maxHeight: 2.2 + Math.random() * 1.6,
        spreadRadius: 0.6 + Math.random() * 1.5,
        baseAngle: Math.random() * Math.PI * 2,
        spiralSpeed: (Math.random() - 0.5) * 0.7,
        swayFreq: 1.2 + Math.random() * 1.4,
        swayPhase: Math.random() * Math.PI * 2,
        baseScale: isMobile ? 0.22 + Math.random() * 0.15 : 0.28 + Math.random() * 0.2,
        delay: 0.4 + i * 0.18 + Math.random() * 0.1,
        lifespan: 4.2 + Math.random() * 2.2,
        age: 0,
      });
    }

    // 11. Emerging 3D Floating Rose Petals System (ফুলের পাপড়ি) - Emerge and tumble from the blooming core
    const flyingPetalsCount = isMobile ? 18 : 26;
    const flyingPetalsGroup = new THREE.Group();
    flowerGroup.add(flyingPetalsGroup);

    const miniPetalGeom = createRosePetalGeometry(0.34, 0.52, 0.28, 0.24, 0.16, 0.04);

    interface FlyingPetalData {
      mesh: THREE.Mesh;
      maxHeight: number;
      spreadRadius: number;
      baseAngle: number;
      spiralSpeed: number;
      tumbleSpeedX: number;
      tumbleSpeedY: number;
      tumbleSpeedZ: number;
      swayFreq: number;
      swayPhase: number;
      baseScale: number;
      delay: number;
      lifespan: number;
      age: number;
    }

    const flyingPetalsData: FlyingPetalData[] = [];
    const flyingPetalMaterials: THREE.MeshStandardMaterial[] = [];

    for (let i = 0; i < flyingPetalsCount; i++) {
      const mat = petalMaterial.clone();
      mat.transparent = true;
      mat.opacity = 0.0;
      flyingPetalMaterials.push(mat);

      const mesh = new THREE.Mesh(miniPetalGeom, mat);
      mesh.position.set(0, 0.26, 0);
      mesh.scale.set(0.001, 0.001, 0.001);
      flyingPetalsGroup.add(mesh);

      flyingPetalsData.push({
        mesh,
        maxHeight: 2.1 + Math.random() * 1.7,
        spreadRadius: 0.7 + Math.random() * 1.6,
        baseAngle: Math.random() * Math.PI * 2,
        spiralSpeed: (Math.random() - 0.5) * 0.55,
        tumbleSpeedX: (Math.random() - 0.5) * 0.028,
        tumbleSpeedY: (Math.random() - 0.5) * 0.035,
        tumbleSpeedZ: (Math.random() - 0.5) * 0.025,
        swayFreq: 0.9 + Math.random() * 0.9,
        swayPhase: Math.random() * Math.PI * 2,
        baseScale: isMobile ? 0.45 + Math.random() * 0.22 : 0.58 + Math.random() * 0.28,
        delay: 0.6 + i * 0.24 + Math.random() * 0.15,
        lifespan: 4.8 + Math.random() * 2.5,
        age: 0,
      });
    }

    // 12. Atmospheric Background Bokeh Floating Lights
    const bgParticleCount = isMobile ? 70 : 140;
    const bgParticleGeom = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgParticleCount * 3);
    const bgAnimData: { yOrigin: number; floatSpeed: number; sway: number; phase: number }[] = [];

    const bgGlowTex = createGlowTexture(64, '#ffc0cb', 'rgba(225, 29, 72, 0)');

    for (let i = 0; i < bgParticleCount; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 14;
      const z = (Math.random() - 0.5) * 12 - 2;

      bgPositions[i * 3] = x;
      bgPositions[i * 3 + 1] = y;
      bgPositions[i * 3 + 2] = z;

      bgAnimData.push({
        yOrigin: y,
        floatSpeed: 0.3 + Math.random() * 0.5,
        sway: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }

    bgParticleGeom.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgPointsMat = new THREE.PointsMaterial({
      size: isMobile ? 0.22 : 0.28,
      map: bgGlowTex,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bgPoints = new THREE.Points(bgParticleGeom, bgPointsMat);
    scene.add(bgPoints);

    // 11. Mouse / Touch Parallax Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.25;
    let targetRotY = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;
        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
        targetRotX = Math.max(-0.4, Math.min(0.8, targetRotX));
        prevPointerX = clientX;
        prevPointerY = clientY;
      } else {
        mouseX = (clientX / window.innerWidth) * 2 - 1;
        mouseY = -(clientY / window.innerHeight) * 2 + 1;
      }
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      prevPointerX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevPointerY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    // 12. Animation Clock & State
    const clock = new THREE.Clock();
    let bloomStartTime: number | null = null;
    let animationFrameId: number;

    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    // 13. Render Loop (Seamless 60fps, zero lag on phase transition)
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Read current phase from ref without triggering any re-renders or WebGL teardowns!
      const currentPhase = phaseRef.current;
      const isBloomingPhase = currentPhase !== 'landing' && currentPhase !== 'transitioning';

      if (isBloomingPhase && bloomStartTime === null) {
        bloomStartTime = elapsedTime;
        bloomTriggeredRef.current = true;
      }

      // 13a. Animate Rose Petals Blooming (Natural Rose Unfolding)
      if (bloomStartTime !== null) {
        const timeSinceBloom = elapsedTime - bloomStartTime;
        let allOpened = true;

        petalsData.forEach((petal) => {
          const petalTime = timeSinceBloom - petal.staggerDelay;
          const progress = Math.min(1, Math.max(0, petalTime / petal.duration));
          const eased = easeInOutCubic(progress);

          if (progress < 1) {
            allOpened = false;
          }

          // Delicate natural breathing flutter
          const flutter = Math.sin(elapsedTime * petal.flutterSpeed + petal.index) * petal.flutterAmp * eased;

          petal.mesh.rotation.x = THREE.MathUtils.lerp(petal.closedRotX, petal.openRotX, eased) + flutter;
          petal.mesh.rotation.y = THREE.MathUtils.lerp(petal.closedRotY, petal.openRotY, eased);
          petal.mesh.rotation.z = THREE.MathUtils.lerp(petal.closedRotZ, petal.openRotZ, eased);

          // Natural radial expansion
          const layerConfig = layerConfigs[petal.layer];
          const currentRadius = THREE.MathUtils.lerp(layerConfig.closedRadius, layerConfig.openRadius, eased);
          petal.mesh.position.z = currentRadius;
        });

        // Soft warm core light intensity transition
        const overallBloomProgress = Math.min(1, timeSinceBloom / 4.6);
        coreLight.intensity = THREE.MathUtils.lerp(0.5, 2.5, easeInOutCubic(overallBloomProgress));
        glowCoreMat.opacity = THREE.MathUtils.lerp(0.2, 0.6, overallBloomProgress);
        glowCore.scale.setScalar(THREE.MathUtils.lerp(0.8, 1.25, overallBloomProgress));

        // Upward stardust starts appearing gently
        if (overallBloomProgress > 0.35) {
          const stardustOpacityProgress = Math.min(1, (overallBloomProgress - 0.35) / 0.65);
          stardustMat.opacity = stardustOpacityProgress * 0.85;

          const positions = stardustGeom.attributes.position.array as Float32Array;
          for (let i = 0; i < stardustCount; i++) {
            const vel = stardustVelocities[i];
            positions[i * 3 + 1] += vel.y;
            positions[i * 3] += Math.sin(elapsedTime * vel.speed + vel.phase) * 0.003 + vel.x;
            positions[i * 3 + 2] += Math.cos(elapsedTime * vel.speed + vel.phase) * 0.003 + vel.z;

            if (positions[i * 3 + 1] > 2.8) {
              const rad = Math.random() * 0.28;
              const theta = Math.random() * Math.PI * 2;
              positions[i * 3] = Math.cos(theta) * rad;
              positions[i * 3 + 1] = 0.2 + Math.random() * 0.15;
              positions[i * 3 + 2] = Math.sin(theta) * rad;
            }
          }
          stardustGeom.attributes.position.needsUpdate = true;
        }

        // Emerging Glowing Hearts Animation (লাভ) - Floating up from the glowing core
        heartsData.forEach((heart) => {
          if (timeSinceBloom < heart.delay) {
            heart.sprite.material.opacity = 0;
            return;
          }

          heart.age += 0.016;
          const progress = (heart.age % heart.lifespan) / heart.lifespan;

          // Upward flight from inside the glowing rose blossom (0.28) up to maxHeight
          const currentY = 0.28 + progress * heart.maxHeight;

          // Gentle outward spiral
          const currentAngle = heart.baseAngle + progress * heart.spiralSpeed * Math.PI * 2;
          const currentRadius = THREE.MathUtils.lerp(0.04, heart.spreadRadius, Math.sqrt(progress));
          const swayX = Math.sin(elapsedTime * heart.swayFreq + heart.swayPhase) * 0.09;
          const swayZ = Math.cos(elapsedTime * heart.swayFreq + heart.swayPhase) * 0.09;

          heart.sprite.position.set(
            Math.cos(currentAngle) * currentRadius + swayX,
            currentY,
            Math.sin(currentAngle) * currentRadius + swayZ
          );

          // Opacity lifecycle: emerge softly from light, glow vividly, fade into air
          let opacity = 0;
          if (progress < 0.12) {
            opacity = progress / 0.12;
          } else if (progress > 0.72) {
            opacity = (1 - progress) / 0.28;
          } else {
            opacity = 1.0;
          }

          // Gentle romantic heartbeat pulse
          const pulse = 1 + 0.14 * Math.sin(elapsedTime * 4.5 + heart.swayPhase);
          const scale = heart.baseScale * Math.min(1, progress * 4.2) * pulse;
          heart.sprite.scale.set(scale, scale, 1);
          heart.sprite.material.opacity = opacity * 0.95;
        });

        // Emerging 3D Floating Rose Petals Animation (ফুলের পাপড়ি)
        flyingPetalsData.forEach((petal) => {
          if (timeSinceBloom < petal.delay) {
            (petal.mesh.material as THREE.MeshStandardMaterial).opacity = 0;
            return;
          }

          petal.age += 0.016;
          const progress = (petal.age % petal.lifespan) / petal.lifespan;

          const currentY = 0.26 + progress * petal.maxHeight;
          const currentAngle = petal.baseAngle + progress * petal.spiralSpeed * Math.PI * 2;
          const currentRadius = THREE.MathUtils.lerp(0.06, petal.spreadRadius, Math.sqrt(progress));
          const swayX = Math.sin(elapsedTime * petal.swayFreq + petal.swayPhase) * 0.12;
          const swayZ = Math.cos(elapsedTime * petal.swayFreq + petal.swayPhase) * 0.12;

          petal.mesh.position.set(
            Math.cos(currentAngle) * currentRadius + swayX,
            currentY,
            Math.sin(currentAngle) * currentRadius + swayZ
          );

          // Authentic 3D tumbling rotation
          petal.mesh.rotation.x += petal.tumbleSpeedX;
          petal.mesh.rotation.y += petal.tumbleSpeedY;
          petal.mesh.rotation.z += petal.tumbleSpeedZ;

          let opacity = 0;
          if (progress < 0.15) {
            opacity = progress / 0.15;
          } else if (progress > 0.72) {
            opacity = (1 - progress) / 0.28;
          } else {
            opacity = 0.96;
          }

          const scale = petal.baseScale * Math.min(1, progress * 3.4);
          petal.mesh.scale.setScalar(scale);
          (petal.mesh.material as THREE.MeshStandardMaterial).opacity = opacity;
        });

        // Notify parent when bloom reaches reveal maturity
        if (allOpened && timeSinceBloom > 4.8) {
          onBloomCompleteRef.current();
        }
      }

      // 13b. Continuous Rose Gentle Rotation & Cinematic Camera Orbit
      const isPortrait = aspect < 0.75;
      const targetBaseY = isBloomingPhase
        ? (isPortrait ? 0.52 : 0.24)
        : (isPortrait ? 0.06 : 0.0);

      flowerGroup.rotation.y += 0.003;
      const floatOffset = Math.sin(elapsedTime * 0.75) * 0.035;
      flowerGroup.position.y = THREE.MathUtils.lerp(flowerGroup.position.y, targetBaseY + floatOffset, 0.04);
      flowerGroup.rotation.z = Math.sin(elapsedTime * 0.45) * 0.025;

      // Parallax smooth interpolation
      flowerGroup.rotation.x = THREE.MathUtils.lerp(flowerGroup.rotation.x, targetRotX + mouseY * 0.12, 0.05);
      flowerGroup.rotation.y = THREE.MathUtils.lerp(flowerGroup.rotation.y, flowerGroup.rotation.y + targetRotY * 0.05 + mouseX * 0.004, 0.05);

      // Camera cinematic slow drift
      const camTargetZ = currentCamZ + Math.sin(elapsedTime * 0.22) * 0.15;
      const camTargetX = Math.cos(elapsedTime * 0.16) * 0.18;
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camTargetZ, 0.04);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, camTargetX, 0.04);
      camera.lookAt(0, flowerGroup.position.y + 0.18, 0);

      // 13c. Background Bokeh gentle drift
      const bgPos = bgParticleGeom.attributes.position.array as Float32Array;
      for (let i = 0; i < bgParticleCount; i++) {
        const data = bgAnimData[i];
        bgPos[i * 3 + 1] = data.yOrigin + Math.sin(elapsedTime * data.floatSpeed + data.phase) * data.sway;
      }
      bgParticleGeom.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 14. Responsive Resize (Guarantees perfect framing on BOTH PC and phone screens)
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      aspect = w / h;

      camera.aspect = aspect;
      currentCamZ = computeCameraZ(aspect);
      currentCamY = aspect < 0.75 ? 0.38 : 0.25;
      camera.position.y = currentCamY;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      roseTexture.dispose();
      roseRoughness.dispose();
      petalMaterial.dispose();
      glowTexture.dispose();
      bgGlowTex.dispose();
      heartTexture.dispose();
      miniPetalGeom.dispose();
      flyingPetalMaterials.forEach((m) => m.dispose());
    };
  }, []); // Run ONCE on mount to ensure zero hitching/lag on phase transitions

  return (
    <div
      ref={containerRef}
      id="flower-3d-canvas-container"
      className="absolute inset-0 w-full h-full pointer-events-auto touch-none overflow-hidden"
    />
  );
};
