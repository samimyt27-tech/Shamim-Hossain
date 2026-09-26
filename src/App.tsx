/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { FlowerCanvas } from './components/FlowerCanvas';
import { LandingView } from './components/LandingView';
import { PoemReveal } from './components/PoemReveal';
import { AudioController } from './components/AudioController';
import { ClickParticleEffect } from './components/ClickParticleEffect';
import { BrandSignature } from './components/BrandSignature';
import { ExperiencePhase } from './types';

export default function App() {
  const [phase, setPhase] = useState<ExperiencePhase>('landing');
  const [soundTriggered, setSoundTriggered] = useState<boolean>(false);

  // Handle user clicking "YES" button on landing screen
  const handleStart = useCallback(() => {
    if (phase !== 'landing') return;

    // 1. Enter transitioning state: landing UI fades out, atmosphere darkens
    setPhase('transitioning');
    setSoundTriggered(true);

    // 2. After 1.2s smooth cinematic delay, start the 3D rose blooming
    window.setTimeout(() => {
      setPhase('blooming');
    }, 1200);
  }, [phase]);

  // Handle callback when 3D rose finishes blooming
  const handleBloomComplete = useCallback(() => {
    setPhase((current) => {
      if (current === 'blooming') {
        return 'revealing';
      }
      return current;
    });
  }, []);

  const isLanding = phase === 'landing';
  const isTransitioning = phase === 'transitioning';
  const isBloomStarted = phase !== 'landing' && phase !== 'transitioning';
  const isPoemVisible = phase === 'revealing' || phase === 'completed';

  return (
    <main
      id="app-container"
      className="fixed inset-0 w-full h-[100dvh] bg-[#060104] text-[#fce7f0] flex flex-col justify-between overflow-hidden select-none"
    >
      {/* 1. Deep atmospheric background gradient across the entire screen (both PC & Mobile) */}
      <div
        className={`fixed inset-0 transition-opacity duration-1000 -z-20 pointer-events-none ${
          isBloomStarted ? 'opacity-95' : 'opacity-85'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, #1a0410 0%, #0d0208 50%, #050103 100%)',
        }}
      />

      {/* 2. Soft atmospheric glowing aura in the center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-4xl h-[70vh] bg-radial from-rose-900/20 via-pink-950/10 to-transparent blur-3xl -z-10 pointer-events-none" />

      {/* 3. Full-Screen Three.js 3D Rose Canvas (Fills entire screen on both PC and Mobile) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <FlowerCanvas
          phase={phase}
          onBloomComplete={handleBloomComplete}
        />
      </div>

      {/* 4. Interactive Click Particle Effect (Hearts, Petals, Sparkles) */}
      <ClickParticleEffect active={isBloomStarted} />

      {/* 5. Landing View (Do You Love Me? - Fixed YES, Runaway NO) */}
      {(isLanding || isTransitioning) && (
        <LandingView
          onStart={handleStart}
          isExiting={isTransitioning}
        />
      )}

      {/* 6. Post-Bloom Content Layer (Bengali Poem in lower portion) */}
      {isBloomStarted && (
        <div className="relative z-10 w-full h-full flex flex-col justify-end pointer-events-none pb-4 sm:pb-8 pt-8 sm:pt-12 px-4">
          <PoemReveal visible={isPoemVisible} />
        </div>
      )}

      {/* 7. Subtle Ambient Audio Controller (Positioned bottom right) */}
      <AudioController autoPlayTrigger={soundTriggered} />

      {/* 8. Stylish Top-Right Corner Brand Signature: KSG (~2 inches) */}
      <BrandSignature />
    </main>
  );
}
