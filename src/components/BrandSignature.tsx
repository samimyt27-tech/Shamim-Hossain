import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export const BrandSignature: React.FC = () => {
  return (
    <motion.aside
      id="brand-signature-ksg"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30 select-none pointer-events-auto"
      style={{ width: '192px' }} // Exact 2 inches on 96DPI displays
      aria-label="Creator Signature KSG"
    >
      <div className="relative group w-full py-1.5 px-3 rounded-full bg-gradient-to-r from-rose-950/40 via-pink-950/30 to-rose-950/40 border border-rose-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.6),0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-400/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.35)] transition-all duration-500 flex items-center justify-center gap-2 overflow-hidden">
        {/* Subtle romantic gloss highlight line */}
        <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
        
        {/* Shimmer sweep effect */}
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-rose-400/10 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        <Sparkles className="w-3.5 h-3.5 text-rose-300/80 animate-pulse shrink-0 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" />

        <span className="font-serif-romantic text-base sm:text-lg font-semibold tracking-[0.35em] text-transparent bg-clip-text bg-gradient-to-r from-rose-100 via-pink-100 to-rose-200 drop-shadow-[0_2px_10px_rgba(244,63,94,0.4)] pl-1">
          KSG
        </span>

        <span className="w-1.5 h-1.5 rounded-full bg-rose-400/70 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
      </div>
    </motion.aside>
  );
};
