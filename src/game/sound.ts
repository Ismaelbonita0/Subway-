// Procedural Web Audio API sound synthesizer for ultra-low latency & zero external dependencies

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicVolume: number = 0.4;
  private sfxVolume: number = 0.7;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Coin collected: harmonic bell ding with rising pitch for streaks
  public playCoin(combo: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const baseFreq = 880; // A5
    const freq = baseFreq * Math.pow(1.06, (combo % 12));
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.08);

    oscHarmonic.type = 'triangle';
    oscHarmonic.frequency.setValueAtTime(freq * 2, now);

    gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    oscHarmonic.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    oscHarmonic.start(now);
    osc.stop(now + 0.22);
    oscHarmonic.stop(now + 0.22);
  }

  // Jump sound: fast upward whoosh
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(460, now + 0.16);

    gain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Super sneakers jump: powerful spring bounce
  public playSuperJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(90, now);
    osc2.frequency.exponentialRampToValueAtTime(360, now + 0.25);

    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.28);
    osc2.stop(now + 0.28);
  }

  // Roll / Slide sound: scrape & friction
  public playRoll() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.18);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Lane switch whoosh
  public playDodge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

    gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Hoverboard deployed: futuristic magnetic charge
  public playHoverboard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.2);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(880, now + 0.2);

    gain.gain.setValueAtTime(0.35 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // Powerup collection: triumphant ascending triad
  public playPowerup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  // Passing train horn with doppler effect
  public playTrainHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Two-tone industrial train horn
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(311.13, now); // Eb4
    osc1.frequency.exponentialRampToValueAtTime(293.66, now + 0.5); // D4 doppler drop

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(392.00, now); // G4
    osc2.frequency.exponentialRampToValueAtTime(369.99, now + 0.5); // F#4 doppler drop

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22 * this.sfxVolume, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  }

  // Crash sound: heavy impact + low sub bass crunch
  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Noise impact
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Sub drop boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    subGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.45);
  }

  // High-energy procedural drum & bass synth music
  public startMusic(tempoBpm: number = 138) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.musicInterval) {
      clearInterval(this.musicInterval);
    }

    const stepDurationMs = (60 / tempoBpm / 4) * 1000; // 16th notes
    const bassNotes = [55, 55, 65.4, 73.4, 55, 55, 82.4, 73.4]; // A1, C2, D2, E2

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const step = this.musicStep % 16;
      const now = this.ctx.currentTime;

      // Kick on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.type = 'sine';
        kick.frequency.setValueAtTime(150, now);
        kick.frequency.exponentialRampToValueAtTime(45, now + 0.08);

        kickGain.gain.setValueAtTime(0.28 * this.musicVolume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        kick.connect(kickGain);
        kickGain.connect(this.ctx.destination);
        kick.start(now);
        kick.stop(now + 0.1);
      }

      // Snare on 4, 12
      if (step === 4 || step === 12) {
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
        }
        const snare = this.ctx.createBufferSource();
        snare.buffer = buffer;
        const sFilter = this.ctx.createBiquadFilter();
        sFilter.type = 'highpass';
        sFilter.frequency.value = 1000;

        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.18 * this.musicVolume, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        snare.connect(sFilter);
        sFilter.connect(sGain);
        sGain.connect(this.ctx.destination);
        snare.start(now);
      }

      // Hi-hat on every off-beat
      if (step % 2 === 1) {
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const hat = this.ctx.createBufferSource();
        hat.buffer = buffer;
        const hFilter = this.ctx.createBiquadFilter();
        hFilter.type = 'highpass';
        hFilter.frequency.value = 7000;

        const hGain = this.ctx.createGain();
        hGain.gain.setValueAtTime(0.08 * this.musicVolume, now);
        hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        hat.connect(hFilter);
        hFilter.connect(hGain);
        hGain.connect(this.ctx.destination);
        hat.start(now);
      }

      // Bassline on specific steps
      if (step % 2 === 0) {
        const bassNoteIdx = Math.floor(step / 2) % bassNotes.length;
        const bassFreq = bassNotes[bassNoteIdx];
        const bass = this.ctx.createOscillator();
        const bassFilter = this.ctx.createBiquadFilter();
        const bGain = this.ctx.createGain();

        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(bassFreq, now);

        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(400, now);

        bGain.gain.setValueAtTime(0.15 * this.musicVolume, now);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        bass.connect(bassFilter);
        bassFilter.connect(bGain);
        bGain.connect(this.ctx.destination);

        bass.start(now);
        bass.stop(now + 0.15);
      }

      this.musicStep++;
    }, stepDurationMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sounds = new SoundEngine();
