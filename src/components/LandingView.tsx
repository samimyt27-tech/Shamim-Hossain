import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, ArrowDown } from 'lucide-react';

interface LandingViewProps {
  onStart: () => void;
  isExiting: boolean;
}

export const LandingView: React.FC<LandingViewProps> = ({ onStart, isExiting }) => {
  // Coordinate offsets for the runaway "NO" button
  const [noOffset, setNoOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dodgeCount, setDodgeCount] = useState<number>(0);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const lastDodgeTimeRef = useRef<number>(0);
  const lastQuadrantRef = useRef<number>(0);

  // Playful dodge responses
  const noLabels = [
    'No 🙈',
    'No 😜',
    'Nope! 🏃',
    'Not here! 💨',
    'Catch me! 🏃‍♀️',
    'Try again! 🤭',
    'Never! 💖',
    'No 😅',
  ];

  // Function to dodge the "NO" button away from cursor/finger
  // PC: 3 inches span (radius = 3 * 96px / 2 = 144px)
  // Phone: 2 inches span (radius = 2 * 96px / 2 = 96px)
  // Omnidirectional: Visibly visits all 4 quadrants (Top-Right, Bottom-Left, Top-Left, Bottom-Right)
  const dodge = useCallback((cursorX?: number, cursorY?: number) => {
    const now = Date.now();
    // 70ms throttle allows agile reaction without frame jitter
    if (now - lastDodgeTimeRef.current < 70) {
      return;
    }
    lastDodgeTimeRef.current = now;

    setNoOffset((prev) => {
      const isPC = typeof window !== 'undefined' && window.innerWidth >= 768;
      const maxDist = isPC ? 144 : 96; // 3 inches on PC, 2 inches on phone
      const minDist = isPC ? 75 : 50;

      // 4 Quadrants:
      // 0: Top-Right (X > 0, Y < 0) - ডানের উপরে
      // 1: Bottom-Left (X < 0, Y > 0) - বামের নিচে
      // 2: Top-Left (X < 0, Y < 0) - বামের উপরে
      // 3: Bottom-Right (X > 0, Y > 0) - ডানের নিচে
      const quadrantAngles = [
        -Math.PI * 0.25, // Top-Right (~ -45°)
        Math.PI * 0.75,  // Bottom-Left (~ +135°)
        -Math.PI * 0.75, // Top-Left (~ -135°)
        Math.PI * 0.25,  // Bottom-Right (~ +45°)
      ];

      let targetX = 0;
      let targetY = 0;
      let chosenQuadrant = (lastQuadrantRef.current + 1) % 4;

      if (cursorX !== undefined && cursorY !== undefined && noButtonRef.current) {
        const rect = noButtonRef.current.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        // Origin of button resting position (offset = 0, 0)
        const originX = btnCenterX - prev.x;
        const originY = btnCenterY - prev.y;

        const currentDistToCursor = Math.hypot(cursorX - btnCenterX, cursorY - btnCenterY);

        // Generate candidate positions across all 4 quadrants
        interface Candidate {
          x: number;
          y: number;
          distToCursor: number;
          quadrant: number;
        }

        const candidates: Candidate[] = [];

        for (let q = 0; q < 4; q++) {
          // Add slight natural variation around quadrant center
          const angleVariance = (Math.random() - 0.5) * 0.45;
          const angle = quadrantAngles[q] + angleVariance;
          const dist = minDist + Math.random() * (maxDist - minDist);

          const cx = Math.round(Math.cos(angle) * dist);
          const cy = Math.round(Math.sin(angle) * dist);

          const newCenterCandidateX = originX + cx;
          const newCenterCandidateY = originY + cy;
          const dCursor = Math.hypot(cursorX - newCenterCandidateX, cursorY - newCenterCandidateY);

          candidates.push({
            x: cx,
            y: cy,
            distToCursor: dCursor,
            quadrant: q,
          });
        }

        // Filter candidates that strictly move AWAY from cursor and don't stall in same spot
        const safeCandidates = candidates.filter((c) => {
          const movedFromPrev = Math.hypot(c.x - prev.x, c.y - prev.y) > (isPC ? 50 : 35);
          const increasedDistance = c.distToCursor > currentDistToCursor + 25;
          return movedFromPrev && increasedDistance;
        });

        if (safeCandidates.length > 0) {
          // Prefer a quadrant different from previous quadrant to cycle directions
          const differentQuadrantCandidates = safeCandidates.filter(
            (c) => c.quadrant !== lastQuadrantRef.current
          );
          const pickFrom = differentQuadrantCandidates.length > 0 ? differentQuadrantCandidates : safeCandidates;
          
          // Pick the best safe dodge (sorted by furthest from cursor or natural variation)
          pickFrom.sort((a, b) => b.distToCursor - a.distToCursor);
          const chosen = pickFrom[Math.floor(Math.random() * Math.min(2, pickFrom.length))];
          targetX = chosen.x;
          targetY = chosen.y;
          chosenQuadrant = chosen.quadrant;
        } else {
          // Fallback: direct flee vector opposite to cursor
          const fleeAngle = Math.atan2(btnCenterY - cursorY, btnCenterX - cursorX);
          const pushDist = minDist + Math.random() * (maxDist - minDist);
          targetX = Math.round(Math.cos(fleeAngle) * pushDist);
          targetY = Math.round(Math.sin(fleeAngle) * pushDist);
          chosenQuadrant = (lastQuadrantRef.current + 1) % 4;
        }
      } else {
        // Random touch: rotate to next quadrant
        chosenQuadrant = (lastQuadrantRef.current + 1 + Math.floor(Math.random() * 2)) % 4;
        const angle = quadrantAngles[chosenQuadrant] + (Math.random() - 0.5) * 0.4;
        const dist = minDist + Math.random() * (maxDist - minDist);
        targetX = Math.round(Math.cos(angle) * dist);
        targetY = Math.round(Math.sin(angle) * dist);
      }

      // Strict circular boundary clamp (3 inches on PC = 144px, 2 inches on phone = 96px)
      const currentRadius = Math.hypot(targetX, targetY);
      if (currentRadius > maxDist) {
        targetX = Math.round((targetX / currentRadius) * maxDist);
        targetY = Math.round((targetY / currentRadius) * maxDist);
      }

      lastQuadrantRef.current = chosenQuadrant;
      return { x: targetX, y: targetY };
    });

    setDodgeCount((c) => c + 1);
  }, []);

  // Proximity detection for desktop cursor: 90px on PC, 65px on touch/tablet
  const handlePointerMoveNear = (e: React.PointerEvent) => {
    if (!noButtonRef.current) return;
    const rect = noButtonRef.current.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;
    const distance = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);

    const isPC = typeof window !== 'undefined' && window.innerWidth >= 768;
    const triggerDistance = isPC ? 90 : 65;

    // If cursor approaches trigger boundary, dodge immediately!
    if (distance < triggerDistance) {
      dodge(e.clientX, e.clientY);
    }
  };

  const currentNoLabel = noLabels[dodgeCount % noLabels.length];

  return (
    <motion.div
      id="landing-screen-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.97 : 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      onPointerMove={handlePointerMoveNear}
      className={`fixed inset-0 z-30 flex flex-col items-center justify-center px-4 select-none overflow-hidden ${
        isExiting ? 'pointer-events-none' : 'pointer-events-auto'
      }`}
    >
      {/* Soft atmospheric ambient light rings */}
      <div className="absolute w-[320px] sm:w-[480px] md:w-[600px] h-[320px] sm:h-[480px] md:h-[600px] rounded-full bg-radial from-rose-900/30 via-pink-950/15 to-transparent blur-3xl pointer-events-none animate-romantic-pulse" />

      {/* Floating subtle spark particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 w-1.5 h-1.5 rounded-full bg-pink-300/40 blur-[1px] animate-gentle-float" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-rose-400/35 blur-[1px] animate-gentle-float [animation-delay:1.5s]" />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-amber-200/40 blur-[0.5px] animate-gentle-float [animation-delay:3s]" />
        <div className="absolute bottom-1/4 right-1/5 w-1.5 h-1.5 rounded-full bg-pink-200/30 blur-[1px] animate-gentle-float [animation-delay:4.5s]" />
      </div>

      {/* Main Center Content (Beautifully responsive for both Phone and PC) */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md md:max-w-xl mx-auto w-full px-4">
        
        {/* Soft Romantic Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="flex items-center gap-2 mb-3 sm:mb-4"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-300/70" />
          <span className="font-serif-romantic italic text-sm sm:text-base md:text-lg text-rose-200/80 tracking-wider">
            A question straight from my heart…
          </span>
          <Sparkles className="w-3.5 h-3.5 text-rose-300/70" />
        </motion.div>

        {/* The Main Question: "Do You Love Me?" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-8 md:mb-10 flex flex-col items-center"
        >
          <h1 className="font-serif-romantic text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide text-rose-50 drop-shadow-[0_4px_24px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2.5 sm:gap-3">
            <span>Do You Love Me?</span>
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-rose-400 fill-rose-500/80 animate-pulse inline-block" />
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-sans-clean tracking-[0.2em] uppercase text-rose-300/75">
            Choose your answer ♥
          </p>
        </motion.div>

        {/* Interactive Buttons Container */}
        <div className="relative w-full max-w-[290px] sm:max-w-sm md:max-w-md flex items-center justify-center gap-5 sm:gap-8 min-h-[100px] sm:min-h-[120px] md:min-h-[130px] py-2">
          
          {/* 1. Fixed "YES" Button - Stable, Glowing & Clickable */}
          <motion.button
            id="btn-love-yes"
            type="button"
            onClick={onStart}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-romantic-btn relative px-7 py-3.5 sm:px-9 sm:py-4 md:px-11 md:py-4.5 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400/50 shadow-[0_0_30px_rgba(244,63,94,0.45)] flex items-center gap-2.5 z-10"
          >
            <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300 fill-rose-400/70 animate-bounce" />
            <span className="font-serif-romantic text-xl sm:text-2xl md:text-3xl font-medium tracking-wider text-rose-50 drop-shadow-[0_2px_10px_rgba(244,63,94,0.6)]">
              YES
            </span>
          </motion.button>

          {/* 2. Runaway "NO" Button - Unclickable, Dodges with silky spring physics */}
          <motion.button
            ref={noButtonRef}
            id="btn-love-no"
            type="button"
            tabIndex={-1}
            animate={{
              x: noOffset.x,
              y: noOffset.y,
              rotate: noOffset.x * 0.035,
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
              mass: 0.45,
            }}
            onPointerEnter={(e) => dodge(e.clientX, e.clientY)}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dodge(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.touches.length > 0) {
                dodge(e.touches[0].clientX, e.touches[0].clientY);
              } else {
                dodge();
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dodge();
            }}
            className="relative px-5 py-3 sm:px-7 sm:py-3.5 md:px-8 md:py-4 rounded-full cursor-not-allowed select-none bg-zinc-900/70 border border-rose-950/70 backdrop-blur-md shadow-md text-rose-300/75 hover:text-rose-200 transition-colors focus:outline-none z-20 whitespace-nowrap will-change-transform"
            style={{ touchAction: 'none' }}
          >
            <span className="font-sans-clean text-xs sm:text-sm md:text-base font-medium tracking-wide">
              {currentNoLabel}
            </span>
          </motion.button>
        </div>

        {/* Guided Indicator Below YES button */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.7 }}
          className="mt-5 sm:mt-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
          onClick={onStart}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-300 rotate-180 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          </motion.div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs md:text-sm font-sans-clean font-medium tracking-widest text-rose-300/85 uppercase">
            <span>Click YES to begin</span>
            <span className="text-rose-400 text-xs sm:text-sm">♥</span>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};
