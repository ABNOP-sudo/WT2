const Sfx = {
  ctx: null,
  master: null,
  noise: null,
  engine: null,
  engineOn: false,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    this.startEngine();
  },

  startEngine() {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 55;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 200;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    o.connect(f);
    f.connect(g);
    g.connect(this.master);
    o.start();
    this.engine = { o, g };
  },

  engineUpdate(active, speedRatio) {
    if (!this.engine || !this.ctx) return;
    const t = this.ctx.currentTime;
    const target = active ? 0.045 + speedRatio * 0.05 : 0;
    this.engine.g.gain.setTargetAtTime(target, t, 0.1);
    this.engine.o.frequency.setTargetAtTime(48 + speedRatio * 70, t, 0.15);
  },

  burst(dur, freq, vol, type = 'lowpass', q = 1) {
    if (!this.ctx || vol <= 0.005) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  },

  volFor(dist, base = 0.6) {
    return base * U.clamp(1 - dist / 1500, 0.03, 1);
  },

  shot(dist) { const v = this.volFor(dist, 0.7); this.burst(0.35, 500, v); this.burst(0.1, 2400, v * 0.4, 'highpass'); },
  mgShot(dist) { this.burst(0.07, 1900, this.volFor(dist, 0.22), 'bandpass', 0.8); },
  explosion(dist) {
    const v = this.volFor(dist, 0.85);
    this.burst(0.9, 260, v);
    this.burst(0.45, 90, v * 0.9);
  },
  bigExplosion(dist) {
    const v = this.volFor(dist, 1.0);
    this.burst(1.4, 180, v);
    this.burst(0.8, 70, v);
  },
  ricochet() { this.burst(0.14, 3300, 0.2, 'bandpass', 6); },
  armorHit() { this.burst(0.18, 850, 0.35, 'bandpass', 2); },
  hit() { this.burst(0.15, 1100, 0.25, 'bandpass', 2); },
  uiClick() { this.burst(0.05, 1400, 0.12, 'bandpass', 3); }
};
