import React from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles } from 'lucide-react';

interface PoemRevealProps {
  visible: boolean;
}

export const PoemReveal: React.FC<PoemRevealProps> = ({ visible }) => {
  if (!visible) return null;

  const poemLines = [
    'বড় ভাই/আপু, আগে বিয়েটা করেন! 😌💍',
    'তারপর বউয়ের/জামাইয়ের সাথেই প্রেম কইরেন! ❤️😂',
    'এত লোভ ক্যান, ভাইজান/আপুজান? 😏',
    'বিয়ের আগেই প্রেমের টান! 🤣',
    'আগে বিয়ে, পরে প্রেম— ❤️',
    'বউয়ের/জামাইয়ের সাথে হউক একই ফ্রেম! ❤️📸✨',
  ];

  return (
    <motion.div
      id="poem-reveal-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
      className="pointer-events-auto relative z-20 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 sm:px-6 pt-4 pb-6 sm:pb-8 flex flex-col items-center text-center"
    >
      {/* Soft translucent decorative backdrop shield for clear readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060104]/95 via-[#060104]/80 to-transparent rounded-3xl -z-10 blur-md pointer-events-none" />

      {/* Main Title: "I Love You" */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center mb-1.5 sm:mb-2"
      >
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-300/70" />
          <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] text-rose-300/65 font-sans-clean font-light">
            Forever & Always
          </span>
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-300/70" />
        </div>
        <h1
          id="heading-i-love-you"
          className="font-serif-romantic text-3xl sm:text-4xl md:text-5xl font-light text-rose-50 tracking-wide drop-shadow-[0_2px_18px_rgba(244,63,94,0.45)]"
        >
          I Love You
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif-romantic italic text-sm sm:text-base md:text-lg text-rose-200/85 max-w-sm sm:max-w-md mx-auto mb-3 tracking-wide"
      >
        “Some feelings are too beautiful to be explained…”
      </motion.p>

      {/* Subtle Divider */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="w-16 sm:w-24 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent mb-3 sm:mb-4"
      />

      {/* Bengali Poem - Line by line subtle fade in */}
      <div id="bengali-poem-block" className="flex flex-col items-center space-y-1.5 sm:space-y-2.5 mb-3 sm:mb-4 w-full">
        {poemLines.map((line, idx) => (
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.9 + idx * 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="font-bengali-poem text-sm sm:text-base md:text-lg lg:text-xl text-rose-100/95 font-normal tracking-wide leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]"
          >
            {line}
          </motion.p>
        ))}
      </div>

      {/* Final Section: Glowing Heart & "Made with love ♥" */}
      <motion.div
        id="footer-made-with-love"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.0,
          delay: 0.9 + poemLines.length * 0.55 + 0.3,
          ease: 'easeOut',
        }}
        className="flex flex-col items-center gap-1 pt-1"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-7 h-7 rounded-full bg-rose-500/25 blur-md animate-ping" />
          <Heart className="w-4 h-4 text-rose-400 fill-rose-500/60 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] animate-pulse" />
        </div>
        <span className="font-sans-clean text-[10px] sm:text-xs tracking-[0.2em] uppercase text-rose-300/70 font-light">
          Made with love ♥
        </span>
      </motion.div>
    </motion.div>
  );
};
