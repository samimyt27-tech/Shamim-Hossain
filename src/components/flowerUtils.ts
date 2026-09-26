import * as THREE from 'three';

/**
 * Generates a high-definition procedural texture for a real Red Rose (রক্ত গোলাপ):
 * Rich crimson velvet base, radiating micro-capillary veins, delicate cellular papillae,
 * and translucent ruby edge highlights.
 */
export function createRosePetalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Base deep velvet red gradient (from dark burgundy base to vibrant crimson body and soft ruby tip)
    const bgGrad = ctx.createLinearGradient(0, 1024, 0, 0);
    bgGrad.addColorStop(0.0, '#380009'); // Deepest dark burgundy at insertion claw
    bgGrad.addColorStop(0.2, '#5c0012'); // Rich wine red
    bgGrad.addColorStop(0.5, '#99001e'); // Deep royal crimson
    bgGrad.addColorStop(0.78, '#c90d2e'); // Classic vibrant rose red
    bgGrad.addColorStop(0.92, '#e6183d'); // Soft glowing ruby highlight
    bgGrad.addColorStop(1.0, '#fa4465'); // Translucent petal edge rim
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Radial vignette for natural organic curvature and velvet depth
    const radialShadow = ctx.createRadialGradient(512, 600, 100, 512, 600, 520);
    radialShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    radialShadow.addColorStop(0.7, 'rgba(40, 0, 8, 0.15)');
    radialShadow.addColorStop(1, 'rgba(15, 0, 3, 0.45)');
    ctx.fillStyle = radialShadow;
    ctx.fillRect(0, 0, 1024, 1024);

    // 3. Delicate longitudinal micro-veins radiating from the claw
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const numVeins = 90;
    for (let i = 0; i < numVeins; i++) {
      const u = i / numVeins;
      const targetX = 80 + u * 864;
      const startX = 512 + (Math.random() - 0.5) * 60;

      ctx.beginPath();
      ctx.moveTo(startX, 1024);

      const cp1x = startX + (targetX - startX) * 0.35 + (Math.random() - 0.5) * 40;
      const cp1y = 720 + (Math.random() - 0.5) * 60;
      const cp2x = startX + (targetX - startX) * 0.75 + (Math.random() - 0.5) * 35;
      const cp2y = 340 + (Math.random() - 0.5) * 50;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, targetX, 40 + Math.random() * 80);

      ctx.lineWidth = 0.8 + Math.random() * 1.4;
      ctx.strokeStyle = `rgba(255, 180, 200, ${0.07 + Math.random() * 0.1})`;
      ctx.stroke();
    }
    ctx.restore();

    // 4. Velvet Micro-Papillae Texture (Subtle cellular velvet grain)
    ctx.save();
    ctx.globalAlpha = 0.04;
    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const grain = (Math.random() - 0.5) * 45;
      data[i] = Math.min(255, Math.max(0, data[i] + grain));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 0.6));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 0.6));
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.restore();

    // 5. Delicate outer rim highlight (gives the petal its translucent edge)
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const edgeGrad = ctx.createRadialGradient(512, 380, 260, 512, 380, 520);
    edgeGrad.addColorStop(0, 'rgba(255, 100, 130, 0)');
    edgeGrad.addColorStop(0.85, 'rgba(255, 80, 110, 0.12)');
    edgeGrad.addColorStop(1, 'rgba(255, 120, 150, 0.35)');
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a velvet roughness map to give realistic matte light absorption with soft grazing highlights
 */
export function createRoseRoughnessMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base roughness: high roughness (~0.75) for velvet matte, lower (~0.5) at the rolled edges
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createRadialGradient(256, 200, 80, 256, 200, 260);
    grad.addColorStop(0, '#c8c8c8');
    grad.addColorStop(0.8, '#a0a0a0');
    grad.addColorStop(1, '#808080'); // Slightly smoother on outer reflexed margins
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates an authentic Rose Petal geometry with:
 * - Natural inverted spade/heart silhouette
 * - Realistic deep hemispherical cupping
 * - Distinct backward reflexed top tip (apex curl)
 * - Outward curled lateral margins (the signature rose petal fold)
 * - Delicate undulating edge ruffles
 */
export function createRosePetalGeometry(
  width: number,
  height: number,
  cupDepth: number = 0.42,
  curlTip: number = 0.36,
  lateralRoll: number = 0.22,
  ruffleAmount: number = 0.05
): THREE.BufferGeometry {
  const segmentsX = 28;
  const segmentsY = 32;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  // Authentic Red Rose Color Tones (deep velvet ruby red gradient)
  const baseColor = new THREE.Color(0x3d010b);   // Deepest dark burgundy base
  const midColor = new THREE.Color(0x94001d);    // Royal crimson
  const outerColor = new THREE.Color(0xc90d2e);  // Rich rose red
  const edgeColor = new THREE.Color(0xf43f5e);   // Luminous rose edge
  const rimColor = new THREE.Color(0xfb7185);    // Soft highlight rim

  for (let j = 0; j <= segmentsY; j++) {
    const v = j / segmentsY; // 0 (insertion base) to 1 (top petal edge)

    // True rose petal contour function:
    // Narrow claw base (v=0), expanding smoothly to a broad round belly at v ~ 0.65,
    // tapering with a soft heart-shaped apex at v = 1.0
    let widthFactor = 0;
    if (v < 0.25) {
      widthFactor = Math.pow(v / 0.25, 0.8) * 0.48;
    } else {
      const rel = (v - 0.25) / 0.75;
      widthFactor = 0.48 + Math.sin(rel * Math.PI) * 0.58;
    }

    for (let i = 0; i <= segmentsX; i++) {
      const u = i / segmentsX - 0.5; // -0.5 to +0.5 across the petal
      const absU = Math.abs(u) * 2.0; // 0 at center spine, 1 at lateral edges

      // Subtle rose apex heart notch: slight dip in height at center apex
      const apexNotch = v > 0.85 ? -0.04 * (1.0 - Math.pow(absU, 2)) * Math.sin((v - 0.85) / 0.15 * Math.PI) : 0;

      const x = u * 2.0 * width * widthFactor;
      const y = (v + apexNotch) * height;

      // Authentic 3D Rose Petal Curvature Mathematics:
      // 1. Spherical Bowl Cupping (curves inward towards flower center)
      const cup = -cupDepth * Math.sin(Math.pow(v, 0.75) * Math.PI) * (1.0 - Math.pow(absU, 1.8) * 0.45);

      // 2. Apex Reflex: The top lip curls backward away from center
      const reflex = curlTip * Math.pow(v, 2.6) * (1.0 - Math.pow(absU, 1.5) * 0.35);

      // 3. Lateral Margin Roll: The side edges roll backwards, creating the classic rose petal flare!
      const sideRoll = lateralRoll * Math.pow(absU, 2.2) * Math.sin(v * Math.PI);

      // 4. Natural organic edge ruffle (fine wavy undulating petals)
      const edgeRuffle = ruffleAmount * Math.sin(absU * Math.PI) * Math.sin(v * 14.0 + u * 6.0) * Math.pow(v, 0.6);

      // 5. Center crease spine (subtle natural fold along center)
      const spineGroove = -0.02 * (1.0 - absU) * Math.sin(v * Math.PI);

      const z = cup + reflex + sideRoll + edgeRuffle + spineGroove;

      vertices.push(x, y, z);
      uvs.push(u + 0.5, v);

      // Vertex color blending for authentic red rose gradient
      const color = new THREE.Color();
      if (v < 0.3) {
        color.lerpColors(baseColor, midColor, v / 0.3);
      } else if (v < 0.75) {
        color.lerpColors(midColor, outerColor, (v - 0.3) / 0.45);
      } else {
        color.lerpColors(outerColor, edgeColor, (v - 0.75) / 0.25);
      }

      // Edge translucent highlight
      if (absU > 0.7) {
        color.lerp(rimColor, (absU - 0.7) * 0.75);
      }

      colors.push(color.r, color.g, color.b);
    }
  }

  // Quad grid triangulation
  for (let j = 0; j < segmentsY; j++) {
    for (let i = 0; i < segmentsX; i++) {
      const a = i + (segmentsX + 1) * j;
      const b = i + (segmentsX + 1) * (j + 1);
      const c = i + 1 + (segmentsX + 1) * (j + 1);
      const d = i + 1 + (segmentsX + 1) * j;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates authentic lanceolate rose sepals with pinnatifid lobes
 */
export function createRoseSepalGeometry(width: number = 0.28, height: number = 1.25): THREE.BufferGeometry {
  const segmentsX = 14;
  const segmentsY = 24;
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  const baseGreen = new THREE.Color(0x1e3f1e);
  const midGreen = new THREE.Color(0x2d5e2e);
  const tipGreen = new THREE.Color(0x3d703e);

  for (let j = 0; j <= segmentsY; j++) {
    const v = j / segmentsY;
    // Lanceolate shape: wider near base, long pointed taper to tip
    const w = width * Math.sin(Math.pow(1.0 - v, 0.6) * Math.PI * 0.5) * (1.0 - Math.pow(v, 3));

    for (let i = 0; i <= segmentsX; i++) {
      const u = i / segmentsX - 0.5;
      const x = u * 2.0 * w;
      const y = v * height;

      // Realistic downward backward curl of rose sepals
      const curl = 0.45 * Math.pow(v, 2.0);
      const cup = -0.06 * Math.sin(v * Math.PI) * (1.0 - Math.abs(u) * 2.0);
      const z = curl + cup;

      vertices.push(x, y, z);
      uvs.push(u + 0.5, v);

      const color = new THREE.Color();
      if (v < 0.5) {
        color.lerpColors(baseGreen, midGreen, v / 0.5);
      } else {
        color.lerpColors(midGreen, tipGreen, (v - 0.5) / 0.5);
      }
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let j = 0; j < segmentsY; j++) {
    for (let i = 0; i < segmentsX; i++) {
      const a = i + (segmentsX + 1) * j;
      const b = i + (segmentsX + 1) * (j + 1);
      const c = i + 1 + (segmentsX + 1) * (j + 1);
      const d = i + 1 + (segmentsX + 1) * j;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Creates soft glowing round particle texture for stardust and bokeh
 */
export function createGlowTexture(
  size: number = 64,
  innerColor: string = '#ffffff',
  outerColor: string = 'rgba(225, 29, 72, 0)'
): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const center = size / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(0.25, 'rgba(255, 220, 230, 0.9)');
    gradient.addColorStop(0.55, 'rgba(225, 29, 72, 0.35)');
    gradient.addColorStop(1, outerColor);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an HD procedural glowing ruby heart texture (লাভ)
 */
export function createHeartTexture(size: number = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const center = size / 2;

    // 1. Soft glowing outer aura
    const aura = ctx.createRadialGradient(center, center, size * 0.1, center, center, size * 0.48);
    aura.addColorStop(0, 'rgba(255, 80, 120, 0.65)');
    aura.addColorStop(0.5, 'rgba(244, 63, 94, 0.28)');
    aura.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, size, size);

    // 2. High-precision romantic heart shape
    ctx.save();
    ctx.translate(center, center - 4);
    const s = size * 0.38;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.25);
    ctx.bezierCurveTo(-s * 0.05, -s * 0.75, -s * 0.85, -s * 0.75, -s * 0.85, -s * 0.15);
    ctx.bezierCurveTo(-s * 0.85, s * 0.35, -s * 0.35, s * 0.65, 0, s * 0.95);
    ctx.bezierCurveTo(s * 0.35, s * 0.65, s * 0.85, s * 0.35, s * 0.85, -s * 0.15);
    ctx.bezierCurveTo(s * 0.85, -s * 0.75, s * 0.05, -s * 0.75, 0, -s * 0.25);
    ctx.closePath();

    // Vibrant jewel ruby gradient
    const heartGrad = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.95);
    heartGrad.addColorStop(0, '#ff4d79');
    heartGrad.addColorStop(0.45, '#e11d48');
    heartGrad.addColorStop(1, '#9f1239');
    ctx.fillStyle = heartGrad;
    ctx.shadowColor = '#ff2d55';
    ctx.shadowBlur = size * 0.14;
    ctx.fill();

    // Specular glint on top-left lobe for 3D depth
    ctx.beginPath();
    ctx.ellipse(-s * 0.38, -s * 0.32, s * 0.2, s * 0.1, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.fill();

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export interface PetalData {
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  layer: number;
  index: number;
  closedRotX: number;
  closedRotY: number;
  closedRotZ: number;
  openRotX: number;
  openRotY: number;
  openRotZ: number;
  staggerDelay: number;
  duration: number;
  flutterSpeed: number;
  flutterAmp: number;
}
