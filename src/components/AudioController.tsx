import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioControllerProps {
  autoPlayTrigger: boolean;
}

export const AudioController: React.FC<AudioControllerProps> = ({ autoPlayTrigger }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  const startAmbientSound = () => {
    if (isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 3);
      masterGain.connect(ctx.destination);

      // Romantic warm chords: D major 9th / F# minor / A major frequencies
      // D3 (146.83), F#3 (185.00), A3 (220.00), C#4 (277.18), E4 (329.63), A4 (440.00)
      const chordNotes = [146.83, 220.00, 277.18, 329.63, 440.00];

      chordNotes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const noteGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        noteGain.gain.setValueAtTime(0.03, ctx.currentTime);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start();
      });

      // Gentle periodic high chime tone
      const chimes = [554.37, 659.25, 880.00, 1108.73];
      const playRandomChime = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        const now = audioCtxRef.current.currentTime;
        const chimeOsc = audioCtxRef.current.createOscillator();
        const chimeGain = audioCtxRef.current.createGain();

        const chimeFreq = chimes[Math.floor(Math.random() * chimes.length)];
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(chimeFreq, now);

        chimeGain.gain.setValueAtTime(0.0001, now);
        chimeGain.gain.exponentialRampToValueAtTime(0.04, now + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterGain);

        chimeOsc.start(now);
        chimeOsc.stop(now + 4.2);

        timerRef.current = window.setTimeout(playRandomChime, 3500 + Math.random() * 4500);
      };

      playRandomChime();
      setIsPlaying(true);
    } catch {
      // Audio autoplay might be blocked silently
    }
  };

  const stopAmbientSound = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAmbientSound();
    } else {
      startAmbientSound();
    }
  };

  useEffect(() => {
    if (autoPlayTrigger && !isPlaying) {
      startAmbientSound();
    }
  }, [autoPlayTrigger]);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  return (
    <button
      id="audio-toggle-btn"
      type="button"
      onClick={toggleSound}
      title={isPlaying ? 'Mute romantic ambient' : 'Play romantic ambient'}
      className="fixed bottom-4 right-4 z-40 p-3 rounded-full glass-romantic-btn text-rose-200/80 hover:text-rose-100 hover:scale-105 transition-all duration-300 focus:outline-none"
    >
      {isPlaying ? (
        <Volume2 className="w-4 h-4 text-rose-300 animate-pulse" />
      ) : (
        <VolumeX className="w-4 h-4 text-rose-400/60" />
      )}
    </button>
  );
};
