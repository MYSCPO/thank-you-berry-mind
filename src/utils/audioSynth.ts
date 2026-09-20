// Serene audio manager with support for Real Acoustic Singing Bowl MP3, Nature Sounds (Waves & Wind), Custom User Audio & Chimes
// Zero synthetic robotic speech (TTS removed per user request)

const CUSTOM_AUDIO_STORAGE_KEY = 'thankyouberry_custom_bowl_audio';
export const DEFAULT_SINGING_BOWL_PATH = '/assets/singing_bowl.mp3';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bowlAudioElement: HTMLAudioElement | null = null;
  
  // Ambient nature sound nodes
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private lfoGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private currentAmbientType: 'waves' | 'wind' | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Save user uploaded singing bowl recording (base64 Data URL or file URL)
   */
  setCustomAudio(dataUrl: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CUSTOM_AUDIO_STORAGE_KEY, dataUrl);
    } catch (e) {
      console.warn('LocalStorage save error for audio:', e);
    }
  }

  getCustomAudio(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(CUSTOM_AUDIO_STORAGE_KEY) || '';
  }

  removeCustomAudio() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CUSTOM_AUDIO_STORAGE_KEY);
  }

  /**
   * Play the built-in real acoustic singing bowl recording (/assets/singing_bowl.mp3),
   * or user-uploaded audio if they provided one.
   * Falls back smoothly to synthetic chime if audio cannot be loaded.
   */
  playSingingBowl() {
    const customSrc = this.getCustomAudio();
    const audioSrc = customSrc || DEFAULT_SINGING_BOWL_PATH;

    try {
      if (!this.bowlAudioElement) {
        this.bowlAudioElement = new Audio();
      }
      this.bowlAudioElement.src = audioSrc;
      this.bowlAudioElement.currentTime = 0;
      this.bowlAudioElement.volume = 0.9;
      const playPromise = this.bowlAudioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('Audio play error, falling back to gentle chime:', err);
          this.playGentleChime();
        });
      }
    } catch (e) {
      console.warn('Error loading singing bowl audio:', e);
      this.playGentleChime();
    }
  }

  // Alias for backwards compatibility
  playCustomOrChime() {
    this.playSingingBowl();
  }

  /**
   * Very soft, warm harmonic chime (natural warm bell tone fallback)
   */
  playGentleChime(freq = 330) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const partials = [
      { f: freq * 1.0, g: 0.35, decay: 4.0 },
      { f: freq * 2.0, g: 0.15, decay: 3.0 },
      { f: freq * 3.01, g: 0.08, decay: 2.2 }
    ];

    partials.forEach(({ f, g, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(g, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  /**
   * Soft piano chord
   */
  playPianoChord() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chordFrequencies = [174.61, 220.0, 261.63, 329.63, 392.0];

    chordFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const noteDelay = now + idx * 0.04;
      const noteDuration = 3.5;

      gainNode.gain.setValueAtTime(0.0001, noteDelay);
      gainNode.gain.linearRampToValueAtTime(0.2 / (idx * 0.3 + 1), noteDelay + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, noteDelay + noteDuration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(noteDelay);
      osc.stop(noteDelay + noteDuration);
    });
  }

  /**
   * Start tranquil ambient nature sound: 'waves' (파도소리) or 'wind' (바람소리)
   * Uses pink/brown noise with low-pass cyclic filtration
   */
  startAmbient(type: 'waves' | 'wind') {
    const ctx = this.getContext();
    if (!ctx) return;

    // If already playing this ambient type, keep playing
    if (this.currentAmbientType === type && this.ambientSource) {
      return;
    }

    this.stopAmbient();
    this.currentAmbientType = type;

    try {
      const bufferSize = ctx.sampleRate * 4; // 4 seconds noise loop
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate gentle Pink / Brown noise for natural organic texture
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Low pass filter on noise generator
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }

      this.ambientSource = ctx.createBufferSource();
      this.ambientSource.buffer = noiseBuffer;
      this.ambientSource.loop = true;

      // Filter
      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';

      // Gain
      this.ambientGain = ctx.createGain();
      const now = ctx.currentTime;
      this.ambientGain.gain.setValueAtTime(0.001, now);

      if (type === 'waves') {
        // Slow tidal wave swell: LFO modulation between 180Hz and 550Hz every 7 seconds
        this.ambientFilter.frequency.setValueAtTime(260, now);
        this.ambientFilter.Q.setValueAtTime(1.8, now);

        // LFO for periodic wave tide
        this.lfoOsc = ctx.createOscillator();
        this.lfoOsc.frequency.setValueAtTime(0.14, now); // ~7.1s wave rhythm
        this.lfoGain = ctx.createGain();
        this.lfoGain.gain.setValueAtTime(180, now);

        this.lfoOsc.connect(this.lfoGain);
        this.lfoGain.connect(this.ambientFilter.frequency);
        this.lfoOsc.start(now);

        // Gentle swell in volume
        this.ambientGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
      } else {
        // Gentle whispering breeze (wind)
        this.ambientFilter.frequency.setValueAtTime(380, now);
        this.ambientFilter.Q.setValueAtTime(1.2, now);

        // Soft random-like drift
        this.lfoOsc = ctx.createOscillator();
        this.lfoOsc.frequency.setValueAtTime(0.2, now);
        this.lfoGain = ctx.createGain();
        this.lfoGain.gain.setValueAtTime(90, now);

        this.lfoOsc.connect(this.lfoGain);
        this.lfoGain.connect(this.ambientFilter.frequency);
        this.lfoOsc.start(now);

        this.ambientGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
      }

      this.ambientSource.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);

      this.ambientSource.start(now);
    } catch (e) {
      console.warn('Ambient sound init error:', e);
    }
  }

  /**
   * Stop ambient sound with smooth fade out
   */
  stopAmbient() {
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);
        setTimeout(() => {
          try {
            this.ambientSource?.stop();
            this.ambientSource?.disconnect();
            this.lfoOsc?.stop();
            this.lfoOsc?.disconnect();
          } catch (e) {
            // ignore cleanup errors
          }
          this.ambientSource = null;
          this.ambientGain = null;
          this.ambientFilter = null;
          this.lfoOsc = null;
          this.lfoGain = null;
          this.currentAmbientType = null;
        }, 500);
      } catch (e) {
        this.ambientSource = null;
        this.currentAmbientType = null;
      }
    } else {
      this.currentAmbientType = null;
    }
  }

  // Stop any playing sound
  stopAll() {
    this.stopAmbient();
    if (this.bowlAudioElement) {
      this.bowlAudioElement.pause();
      this.bowlAudioElement.currentTime = 0;
    }
  }
}

export const soundEngine = new SoundEngine();
