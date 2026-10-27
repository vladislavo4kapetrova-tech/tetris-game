/**
 * Web Audio API Retro Synthesizer for Tetris Game
 * Pure synthesized sound effects & retro synthwave ambient music
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.musicInterval = null;
    this.musicStep = 0;

    // Load saved settings
    const savedSfx = localStorage.getItem('tetris_sfx');
    if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';

    const savedMusic = localStorage.getItem('tetris_music');
    if (savedMusic !== null) this.musicEnabled = savedMusic === 'true';
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    localStorage.setItem('tetris_sfx', this.sfxEnabled);
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.ensureContext();
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem('tetris_music', this.musicEnabled);
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // --- Sound Effects ---

  playMove() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playRotate() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playDrop() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playHardDrop() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    // Bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playHold() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playLineClear(lines) {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    if (lines >= 4) {
      this.playTetris();
      return;
    }

    const chords = [
      [523.25, 659.25],          // C5, E5
      [523.25, 659.25, 783.99],  // C5, E5, G5
      [659.25, 783.99, 1046.50]  // E5, G5, C6
    ];

    const notes = chords[Math.min(lines - 1, 2)];
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.06);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + index * 0.06);
      osc.stop(this.ctx.currentTime + index * 0.06 + 0.25);
    });
  }

  playTetris() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    // Epic 4-note neon victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + idx * 0.07 + 0.35);
    });
  }

  playLevelUp() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + idx * 0.08);
      osc.stop(this.ctx.currentTime + idx * 0.08 + 0.28);
    });
  }

  playGameOver() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // --- Retro Ambient Synthwave Loop ---

  startMusic() {
    if (this.musicInterval) return;
    this.ensureContext();

    // Classic Korobeiniki / Synthwave inspired progression (E, B, C, D, C, B, A...)
    const bassline = [
      164.81, 164.81, 123.47, 123.47, 130.81, 130.81, 146.83, 146.83,
      130.81, 130.81, 123.47, 123.47, 110.00, 110.00, 110.00, 123.47
    ];

    const melody = [
      659.25, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00, 440.00,
      523.25, 659.25, 587.33, 523.25, 493.88, 523.25, 587.33, 659.25
    ];

    const stepDuration = 220; // ms per beat

    this.musicInterval = setInterval(() => {
      if (!this.musicEnabled || !this.ctx) return;

      const now = this.ctx.currentTime;
      const bFreq = bassline[this.musicStep % bassline.length];
      const mFreq = melody[this.musicStep % melody.length];

      // Bass note
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, now);
      bGain.gain.setValueAtTime(0.05, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      bOsc.connect(bGain);
      bGain.connect(this.ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + 0.18);

      // Melody note
      if (this.musicStep % 2 === 0) {
        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(mFreq, now);
        mGain.gain.setValueAtTime(0.04, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        mOsc.connect(mGain);
        mGain.connect(this.ctx.destination);
        mOsc.start(now);
        mOsc.stop(now + 0.25);
      }

      this.musicStep++;
    }, stepDuration);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

window.soundEngine = new SoundEngine();
