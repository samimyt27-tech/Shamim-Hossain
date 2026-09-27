import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, CloudRain, Droplets } from 'lucide-react';
import { tinRoofRainEngine } from './rainAudioEngine';

// YouTube Video ID provided by user: https://youtu.be/sfn3lnBolFo
const YOUTUBE_VIDEO_ID = 'sfn3lnBolFo';

interface AudioControllerProps {
  autoPlayTrigger?: boolean;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          events?: Record<string, (event: any) => void>;
        }
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        setVolume: (volume: number) => void;
        getPlayerState: () => number;
        destroy: () => void;
      };
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const AudioController: React.FC<AudioControllerProps> = ({ autoPlayTrigger }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.75);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hasUserInteractedRef = useRef<boolean>(false);

  // Synchronized Play method
  const playAllAudio = useCallback(async () => {
    setIsPlaying(true);

    // 1. Play YouTube Audio if player exists
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      try {
        ytPlayerRef.current.playVideo();
      } catch {}
    }

    // 2. Play high-fidelity tin roof heavy rain engine (immediate zero-latency & acoustic backup)
    try {
      await tinRoofRainEngine.start();
    } catch {}
  }, []);

  // Synchronized Stop/Pause method
  const stopAllAudio = useCallback(() => {
    setIsPlaying(false);

    // Pause YouTube audio
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch {}
    }

    // Pause tin roof audio engine
    tinRoofRainEngine.stop();
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopAllAudio();
    } else {
      playAllAudio();
    }
  };

  // Initialize YouTube IFrame API
  useEffect(() => {
    let isMounted = true;

    const initYTPlayer = () => {
      if (!window.YT || !window.YT.Player || !playerContainerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('yt-hidden-audio-frame', {
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: { target: { playVideo: () => void; setVolume: (v: number) => void } }) => {
              if (!isMounted) return;
              event.target.setVolume(Math.round(volume * 100));
              event.target.playVideo();
            },
            onStateChange: (event: { data: number; target: { playVideo: () => void } }) => {
              if (!isMounted) return;
              if (event.data === 1) {
                // 1 = PLAYING
                setIsPlaying(true);
              } else if (event.data === 0) {
                // 0 = ENDED (loop continuously)
                event.target.playVideo();
              }
            },
          },
        });
      } catch {
        // Fallback to Web Audio tin roof engine
      }
    };

    // Load YouTube API script if not present
    if (!window.YT) {
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        if (isMounted) initYTPlayer();
      };
    } else {
      initYTPlayer();
    }

    // Immediately start audio on mount (auto-on)
    playAllAudio();

    // Global listener to unlock audio on first user touch/click/gesture
    const handleFirstGesture = async () => {
      hasUserInteractedRef.current = true;
      try {
        await tinRoofRainEngine.resumeOnGesture();
      } catch {}

      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        try {
          ytPlayerRef.current.playVideo();
        } catch {}
      }
    };

    const gestures = ['pointerdown', 'touchstart', 'click', 'keydown', 'scroll'];
    gestures.forEach((evt) => {
      window.addEventListener(evt, handleFirstGesture, { once: true, passive: true });
    });

    return () => {
      isMounted = false;
      gestures.forEach((evt) => {
        window.removeEventListener(evt, handleFirstGesture);
      });
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch {}
      }
      tinRoofRainEngine.stop();
    };
  }, [playAllAudio, volume]);

  // Handle external trigger if any
  useEffect(() => {
    if (autoPlayTrigger) {
      playAllAudio();
    }
  }, [autoPlayTrigger, playAllAudio]);

  // Volume slider sync
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    tinRoofRainEngine.setVolume(newVol);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(Math.round(newVol * 100));
      } catch {}
    }
  };

  return (
    <>
      {/* 1. YouTube IFrame Player (Hidden in background, audio only) */}
      <div
        ref={playerContainerRef}
        className="fixed -bottom-[500px] -right-[500px] w-10 h-10 opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <div id="yt-hidden-audio-frame" className="w-full h-full" />
      </div>

      {/* 2. Floating Bottom-Right Audio Controller Bar */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 select-none">
        {/* Volume slider expander */}
        {showVolumeSlider && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-full glass-romantic-btn backdrop-blur-md bg-black/70 border border-rose-500/40 text-rose-200 text-xs shadow-2xl"
            title="টিনের চালে বৃষ্টির সাউন্ড ভলিউম"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-rose-400 cursor-pointer h-1.5 rounded-lg bg-rose-950/70"
              aria-label="Volume slider"
            />
            <span className="text-[10px] font-mono text-rose-300 w-7 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        )}

        {/* Main Audio Toggle Pill - Always shows ON automatically */}
        <button
          id="audio-toggle-btn"
          type="button"
          onClick={toggleSound}
          onContextMenu={(e) => {
            e.preventDefault();
            setShowVolumeSlider((prev) => !prev);
          }}
          title={
            isPlaying
              ? 'টিনের চালে ঝুম বৃষ্টি ও মেঘের গর্জন (চালু আছে | বন্ধ করতে ক্লিক করুন)'
              : 'সাউন্ড বন্ধ আছে (চালু করতে ক্লিক করুন)'
          }
          className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full transition-all duration-300 focus:outline-none shadow-xl active:scale-95 ${
            isPlaying
              ? 'glass-romantic-btn bg-gradient-to-r from-rose-950/80 via-black/85 to-purple-950/80 border border-rose-400/50 text-rose-100 shadow-rose-950/40 hover:border-rose-300'
              : 'bg-black/70 border border-rose-900/50 text-rose-400/70 hover:text-rose-200 hover:border-rose-500/40'
          }`}
        >
          {/* Animated Rain & Thunder Icon */}
          <div className="relative flex items-center justify-center">
            {isPlaying ? (
              <>
                <CloudRain className="w-4 h-4 text-cyan-300 animate-bounce" style={{ animationDuration: '2s' }} />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </>
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400/70" />
            )}
          </div>

          {/* Label indicating tin roof rain audio */}
          <div className="flex flex-col items-start text-left leading-none">
            <span className="text-[11px] font-medium tracking-wide flex items-center gap-1.5">
              {isPlaying ? (
                <>
                  <span className="text-rose-200">টিনের চালে বৃষ্টি</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                    ON
                  </span>
                </>
              ) : (
                <>
                  <span className="text-rose-400/80">সাউন্ড অফ</span>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold uppercase tracking-wider">
                    OFF
                  </span>
                </>
              )}
            </span>
            <span className="text-[9px] text-rose-400/60 font-light mt-0.5">
              Heavy Rain & Thunder
            </span>
          </div>

          {/* Sound waves animation */}
          {isPlaying && (
            <div className="flex items-end gap-0.5 h-3 ml-0.5">
              <span className="w-0.5 bg-rose-300 rounded-full animate-pulse h-2" style={{ animationDelay: '0ms' }}></span>
              <span className="w-0.5 bg-cyan-300 rounded-full animate-pulse h-3" style={{ animationDelay: '150ms' }}></span>
              <span className="w-0.5 bg-rose-400 rounded-full animate-pulse h-1.5" style={{ animationDelay: '300ms' }}></span>
            </div>
          )}
        </button>

        {/* Volume Icon Button */}
        <button
          type="button"
          onClick={() => setShowVolumeSlider((prev) => !prev)}
          title="ভলিউম কম/বেশি করুন"
          className="p-2 rounded-full glass-romantic-btn bg-black/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 hover:border-rose-400/50 transition-all text-xs"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
};
