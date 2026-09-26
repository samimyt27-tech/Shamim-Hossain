export type ExperiencePhase = 
  | 'landing'       // Initial landing view with button
  | 'transitioning' // Fade out landing, background darkens, particles begin (1-2s)
  | 'bud_appearing' // Flower appears as closed bud
  | 'blooming'      // Petals opening one by one
  | 'bloomed'       // Fully open, glowing center, upward stardust
  | 'revealing'     // Text message fading in
  | 'completed';    // Poem revealed, made with love, continuous cinematic ambiance

export interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulseSpeed: number;
  hue: number;
}
