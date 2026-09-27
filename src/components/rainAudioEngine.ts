/**
 * Heavy Rain & Deep Thunder on Tin Roof Sound Engine
 * Emulates the exact audio characteristics of YouTube video: sfn3lnBolFo
 * (Heavy rain pelt on tin roof with deep rolling thunder growls)
 */

export class TinRoofRainEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isRunning = false;
  private dropIntervalId: number | null = null;
  private thunderIntervalId: number | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private volumeLevel = 0.7; // Clear and rich volume

  /**
   * Generates a stereo pink & brown noise buffer for heavy rainfall on tin roof.
   */
  private createHeavyRainBuffer(ctx: AudioContext, duration = 8): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.14;
        b6 = white * 0.115926;
        data[i] = pink;
      }

      // Smooth loop boundaries
      const fadeSamples = Math.floor(sampleRate * 0.4);
      for (let i = 0; i < fadeSamples; i++) {
        const t = i / fadeSamples;
        data[i] = data[i] * t + data[bufferSize - fadeSamples + i] * (1 - t);
      }
    }

    return buffer;
  }

  /**
   * Spawns a raindrop hitting corrugated tin roof (metallic click + resonance).
   */
  private spawnTinDrop() {
    if (!this.ctx || this.ctx.state === 'closed' || !this.masterGain || !this.isRunning) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const tinResonance = this.ctx.createBiquadFilter();

      // Tin roof metallic resonance frequencies: 1100Hz - 3200Hz with high Q
      const freq = 1200 + Math.random() * 2000;
      osc.type = 'triangle'; // Triangular wave produces metallic harmonics
      osc.frequency.setValueAtTime(freq * 1.3, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.03);

      tinResonance.type = 'bandpass';
      tinResonance.frequency.setValueAtTime(freq, now);
      tinResonance.Q.setValueAtTime(12 + Math.random() * 10, now); // Sharp metallic Q

      const dropVol = 0.04 + Math.random() * 0.08;
      dropGain.gain.setValueAtTime(0.0001, now);
      dropGain.gain.exponentialRampToValueAtTime(dropVol, now + 0.002);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime((Math.random() - 0.5) * 1.8, now);
        osc.connect(tinResonance);
        tinResonance.connect(dropGain);
        dropGain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(tinResonance);
        tinResonance.connect(dropGain);
        dropGain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Triggers a realistic deep rolling thunder growl (low frequency rumble).
   */
  public triggerThunderGrowl() {
    if (!this.ctx || this.ctx.state === 'closed' || !this.masterGain || !this.isRunning) return;

    try {
      const now = this.ctx.currentTime;
      const sampleRate = this.ctx.sampleRate;
      const thunderDuration = 5 + Math.random() * 3;
      const thunderBufferSize = Math.floor(sampleRate * thunderDuration);
      const thunderBuffer = this.ctx.createBuffer(1, thunderBufferSize, sampleRate);
      const data = thunderBuffer.getChannelData(0);

      // Brown noise for thunder rumble
      let lastOut = 0.0;
      for (let i = 0; i < thunderBufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const thunderSource = this.ctx.createBufferSource();
      thunderSource.buffer = thunderBuffer;

      const thunderFilter = this.ctx.createBiquadFilter();
      thunderFilter.type = 'lowpass';
      thunderFilter.frequency.setValueAtTime(85, now);
      thunderFilter.frequency.linearRampToValueAtTime(140, now + 1.5);
      thunderFilter.frequency.linearRampToValueAtTime(60, now + thunderDuration);

      const thunderGain = this.ctx.createGain();
      thunderGain.gain.setValueAtTime(0.0001, now);
      thunderGain.gain.exponentialRampToValueAtTime(0.22, now + 1.2);
      thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + thunderDuration);

      thunderSource.connect(thunderFilter);
      thunderFilter.connect(thunderGain);
      thunderGain.connect(this.masterGain);

      thunderSource.start(now);
      thunderSource.stop(now + thunderDuration + 0.1);
    } catch {}
  }

  /**
   * Starts the tin roof rain sound.
   */
  public async start(): Promise<boolean> {
    if (this.isRunning && this.ctx && this.ctx.state === 'running') {
      return true;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return false;

      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      const ctx = this.ctx;
      this.isRunning = true;

      // Master Gain Node
      if (!this.masterGain) {
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(this.volumeLevel, ctx.currentTime + 1.0);
        this.masterGain.connect(ctx.destination);
      } else {
        this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, ctx.currentTime);
        this.masterGain.gain.exponentialRampToValueAtTime(this.volumeLevel, ctx.currentTime + 0.8);
      }

      // Continuous Heavy Rain Body
      const buffer = this.createHeavyRainBuffer(ctx, 8);
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = buffer;
      this.noiseSource.loop = true;

      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(320, ctx.currentTime);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(4500, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.48, ctx.currentTime);

      // Natural swell
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.09, ctx.currentTime);
      this.lfo.connect(lfoGain);
      lfoGain.connect(rainGain.gain);
      this.lfo.start();

      this.noiseSource.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(rainGain);
      rainGain.connect(this.masterGain);
      this.noiseSource.start();

      // Periodic tin roof drops (dense drops)
      if (this.dropIntervalId !== null) clearInterval(this.dropIntervalId);
      this.dropIntervalId = window.setInterval(() => {
        const count = 2 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          this.spawnTinDrop();
        }
      }, 40);

      // Periodic thunder growls (every 22 seconds)
      if (this.thunderIntervalId !== null) clearInterval(this.thunderIntervalId);
      this.thunderIntervalId = window.setInterval(() => {
        this.triggerThunderGrowl();
      }, 22000);

      // Trigger first thunder after 4 seconds
      window.setTimeout(() => {
        this.triggerThunderGrowl();
      }, 4000);

      return true;
    } catch {
      return false;
    }
  }

  public stop() {
    this.isRunning = false;

    if (this.dropIntervalId !== null) {
      clearInterval(this.dropIntervalId);
      this.dropIntervalId = null;
    }
    if (this.thunderIntervalId !== null) {
      clearInterval(this.thunderIntervalId);
      this.thunderIntervalId = null;
    }

    if (this.ctx && this.masterGain && this.ctx.state !== 'closed') {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        window.setTimeout(() => {
          if (this.noiseSource) {
            try {
              this.noiseSource.stop();
              this.noiseSource.disconnect();
            } catch {}
            this.noiseSource = null;
          }
          if (this.lfo) {
            try {
              this.lfo.stop();
              this.lfo.disconnect();
            } catch {}
            this.lfo = null;
          }
        }, 450);
      } catch {}
    }
  }

  public setVolume(vol: number) {
    this.volumeLevel = Math.max(0.05, Math.min(1.0, vol));
    if (this.ctx && this.masterGain && this.isRunning) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volumeLevel, now + 0.15);
    }
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public async resumeOnGesture(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }
}

export const tinRoofRainEngine = new TinRoofRainEngine();
