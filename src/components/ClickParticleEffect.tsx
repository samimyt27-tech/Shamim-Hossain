import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  flutterPhase: number;
  flutterSpeed: number;
  type: 'heart' | 'petal' | 'sparkle' | 'ring';
  color: string;
  secondaryColor?: string;
}

interface ClickParticleEffectProps {
  active: boolean;
}

export const ClickParticleEffect: React.FC<ClickParticleEffectProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Palette of romantic colors
  const heartColors = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6', '#ec4899', '#ffe4e6'];
  const petalColors = [
    { base: '#be123c', tip: '#fbcfe8' },
    { base: '#9f1239', tip: '#f472b6' },
    { base: '#e11d48', tip: '#ffe4e6' },
    { base: '#881337', tip: '#fda4af' },
  ];
  const sparkleColors = ['#fff1f2', '#fef08a', '#fde047', '#f472b6', '#ffffff'];

  // Helper to draw a crisp vector heart
  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(0, topCurveHeight);
    // Left curve
    ctx.bezierCurveTo(-size / 2, -topCurveHeight, -size, size / 3, 0, size);
    // Right curve
    ctx.bezierCurveTo(size, size / 3, size / 2, -topCurveHeight, 0, topCurveHeight);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Helper to draw a realistic curved fluttering rose flower petal
  const drawPetal = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    baseColor: string,
    tipColor: string,
    alpha: number,
    rotation: number,
    flipScale: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(flipScale, 1); // 3D flipping simulation
    ctx.globalAlpha = alpha;

    const gradient = ctx.createRadialGradient(0, size * 0.4, 0, 0, 0, size);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.65, tipColor);
    gradient.addColorStop(1, '#ffffff');

    ctx.fillStyle = gradient;
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, size * 0.7);
    // Left edge
    ctx.bezierCurveTo(-size * 0.65, size * 0.3, -size * 0.55, -size * 0.5, 0, -size * 0.7);
    // Right edge
    ctx.bezierCurveTo(size * 0.55, -size * 0.5, size * 0.65, size * 0.3, 0, size * 0.7);
    ctx.closePath();
    ctx.fill();

    // Subtle petal vein highlight
    ctx.strokeStyle = 'rgba(255, 240, 245, 0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.6);
    ctx.quadraticCurveTo(-size * 0.05, 0, 0, -size * 0.5);
    ctx.stroke();

    ctx.restore();
  };

  // Helper to draw a glowing sparkle star
  const drawSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number, rotation: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.lineTo(size, 0);
      ctx.lineTo(size * 0.22, size * 0.22);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Helper to draw an expanding ripple ring
  const drawRing = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.8)';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  // Spawn a vibrant romantic burst at coordinates (x, y)
  const spawnBurst = (x: number, y: number) => {
    const isMobile = window.innerWidth < 768;
    const heartCount = isMobile ? 5 : 8;
    const petalCount = isMobile ? 6 : 9;
    const sparkleCount = isMobile ? 8 : 14;

    const newParticles: Particle[] = [];

    // 1. Expanding shockwave ripple ring
    newParticles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      alpha: 0.9,
      decay: 0.022,
      rotation: 0,
      rotationSpeed: 0,
      flutterPhase: 0,
      flutterSpeed: 0,
      type: 'ring',
      color: '#fb7185',
    });

    // 2. Hearts bursting outward with buoyant upward drift
    for (let i = 0; i < heartCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.5;
      const color = heartColors[Math.floor(Math.random() * heartColors.length)];

      newParticles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8, // subtle upward float
        size: 10 + Math.random() * 12,
        alpha: 1.0,
        decay: 0.009 + Math.random() * 0.008,
        rotation: (Math.random() - 0.5) * 0.8,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: 2 + Math.random() * 2,
        type: 'heart',
        color,
      });
    }

    // 3. Flower petals fluttering and floating outward
    for (let i = 0; i < petalCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 3.8;
      const palette = petalColors[Math.floor(Math.random() * petalColors.length)];

      newParticles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        size: 12 + Math.random() * 14,
        alpha: 1.0,
        decay: 0.007 + Math.random() * 0.007,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        flutterPhase: Math.random() * Math.PI * 2,
        flutterSpeed: 1.8 + Math.random() * 2.2,
        type: 'petal',
        color: palette.base,
        secondaryColor: palette.tip,
      });
    }

    // 4. Stardust sparkles spraying in all directions
    for (let i = 0; i < sparkleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.8 + Math.random() * 5.2;
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];

      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        alpha: 1.0,
        decay: 0.016 + Math.random() * 0.012,
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        flutterPhase: 0,
        flutterSpeed: 0,
        type: 'sparkle',
        color,
      });
    }

    // Cap maximum active particles for seamless 60fps performance
    const combined = [...particlesRef.current, ...newParticles];
    if (combined.length > 200) {
      particlesRef.current = combined.slice(combined.length - 200);
    } else {
      particlesRef.current = combined;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Global pointer down listener
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!active) return;
      
      // Ignore click on audio mute button or interactive inputs if any
      const target = e.target as HTMLElement | null;
      if (target && target.closest('#audio-toggle-btn')) {
        return;
      }

      if ('touches' in e && e.touches.length > 0) {
        for (let i = 0; i < e.touches.length; i++) {
          spawnBurst(e.touches[i].clientX, e.touches[i].clientY);
        }
      } else if ('clientX' in e) {
        spawnBurst(e.clientX, e.clientY);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);

      const dt = Math.min(32, time - lastTime) / 16.6; // normalized frame delta
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      if (particles.length === 0) return;

      const remainingParticles: Particle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.alpha -= p.decay * dt;
        if (p.alpha <= 0) continue;

        if (p.type === 'ring') {
          p.size += 4.5 * dt;
          drawRing(ctx, p.x, p.y, p.size, p.alpha);
          remainingParticles.push(p);
          continue;
        }

        // Apply physics
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Gentle drag / air resistance
        p.vx *= Math.pow(0.96, dt);
        p.vy *= Math.pow(0.96, dt);

        p.rotation += p.rotationSpeed * dt;
        p.flutterPhase += p.flutterSpeed * 0.04 * dt;

        if (p.type === 'heart') {
          // Floating lift and gentle sway
          p.vy -= 0.035 * dt;
          p.x += Math.sin(p.flutterPhase) * 0.6 * dt;
          drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
        } else if (p.type === 'petal') {
          // Gentle floating gravity and flutter
          p.vy += 0.045 * dt;
          p.x += Math.sin(p.flutterPhase) * 0.9 * dt;
          const flipScale = Math.cos(p.flutterPhase);
          drawPetal(
            ctx,
            p.x,
            p.y,
            p.size,
            p.color,
            p.secondaryColor || '#ffe4e6',
            p.alpha,
            p.rotation,
            flipScale
          );
        } else if (p.type === 'sparkle') {
          // Sparkle drift and twinkle
          p.size *= Math.pow(0.98, dt);
          drawSparkle(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
        }

        remainingParticles.push(p);
      }

      particlesRef.current = remainingParticles;
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', handlePointerDown);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      id="click-particle-effects-canvas"
      className="fixed inset-0 z-30 pointer-events-none w-full h-full"
    />
  );
};
