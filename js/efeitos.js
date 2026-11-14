// Partículas (vapor, fumaça, fogo, confete) e som sintetizado com WebAudio.
import * as THREE from 'three';

function spriteRadial() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

class Sistema {
  constructor(cena, max, aditivo) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.cor = new Float32Array(max * 3); this.tam = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.vida = new Float32Array(max); this.vidaMax = new Float32Array(max); this.tam0 = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.cor, 3));
    g.setAttribute('tam', new THREE.BufferAttribute(this.tam, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { mapa: { value: spriteRadial() }, escala: { value: 600 } },
      vertexShader: 'attribute float tam; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=tam*600./-mv.z; gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform sampler2D mapa; varying vec3 vC; void main(){ vec4 t=texture2D(mapa, gl_PointCoord); if(t.a<0.02) discard; gl_FragColor=vec4(vC, t.a*0.55); }',
      transparent: true, depthWrite: false, vertexColors: true, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.pontos = new THREE.Points(g, mat);
    this.pontos.frustumCulled = false;
    cena.add(this.pontos);
    this.geo = g;
  }
  emitir(p, v, c, tam, vida) {
    let i = this.n < this.max ? this.n++ : Math.floor(Math.random() * this.max);
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3); this.cor.set([c.r, c.g, c.b], i * 3);
    this.tam0[i] = tam; this.vida[i] = vida; this.vidaMax[i] = vida;
  }
  update(dt, gravidade = 0, cresce = 1) {
    for (let i = 0; i < this.n; i++) {
      if (this.vida[i] <= 0) { this.tam[i] = 0; continue; }
      this.vida[i] -= dt;
      this.vel[i * 3 + 1] -= gravidade * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.vida[i] / this.vidaMax[i];
      this.tam[i] = this.tam0[i] * (cresce > 1 ? 1 + (1 - f) * (cresce - 1) : f);
      if (this.vida[i] <= 0) this.tam[i] = 0;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.tam.needsUpdate = true; this.geo.attributes.color.needsUpdate = true;
  }
}

const COR = { vapor: new THREE.Color(0.95, 0.96, 1), fumaca: new THREE.Color(0.25, 0.24, 0.24), fumacaClara: new THREE.Color(0.6, 0.6, 0.62), fogo: new THREE.Color(1, 0.55, 0.12), fogoAzul: new THREE.Color(0.3, 0.5, 1) };

export class Efeitos {
  constructor(cena) {
    this.fumo = new Sistema(cena, 1400, false);
    this.fogo = new Sistema(cena, 600, true);
    this.confete = [];
    this.cena = cena;
    this.v = new THREE.Vector3();
  }
  vapor(p, forca = 1) {
    if (Math.random() > 0.35 * forca) return;
    this.fumo.emitir(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.12, 0.05, (Math.random() - 0.5) * 0.12)), this.v.set((Math.random() - 0.5) * 0.05, 0.25 + Math.random() * 0.2, (Math.random() - 0.5) * 0.05), COR.vapor, 0.05, 1.6);
  }
  fumaca(p, forca = 1, escura = true) {
    if (Math.random() > 0.5 * forca) return;
    this.fumo.emitir(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.04, (Math.random() - 0.5) * 0.1)), this.v.set((Math.random() - 0.5) * 0.08, 0.35 + Math.random() * 0.25, (Math.random() - 0.5) * 0.08), escura ? COR.fumaca : COR.fumacaClara, 0.07, 2.4);
  }
  chama(p, alto = 1) {
    for (let i = 0; i < 3; i++) this.fogo.emitir(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.18, 0.02, (Math.random() - 0.5) * 0.18)), this.v.set((Math.random() - 0.5) * 0.2, (0.8 + Math.random()) * alto, (Math.random() - 0.5) * 0.2), Math.random() > 0.2 ? COR.fogo : COR.fogoAzul, 0.08, 0.5 + Math.random() * 0.4);
  }
  confetes(centro, n = 400) {
    const geo = new THREE.PlaneGeometry(0.05, 0.03);
    const mats = [0xffd36a, 0xe3b33c, 0x2a6aff, 0xffffff].map((c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide }));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mats[i % 4]);
      m.position.set(centro.x + (Math.random() - 0.5) * 8, centro.y + 3 + Math.random() * 3, centro.z + (Math.random() - 0.5) * 6);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, -0.4 - Math.random() * 0.5, (Math.random() - 0.5) * 0.4);
      m.userData.r = new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0);
      this.cena.add(m); this.confete.push(m);
    }
  }
  update(dt) {
    this.fumo.update(dt, -0.05, 3);
    this.fogo.update(dt, -0.4, 1);
    for (const m of this.confete) {
      if (m.position.y < 0.01) continue;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.r.x * dt; m.rotation.y += m.userData.r.y * dt;
    }
  }
}

// ---------- Som ----------
export class Som {
  constructor() { this.ctx = null; this.ligado = true; }
  iniciar() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const n = this.ctx.sampleRate * 2;
      this.ruido = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = this.ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.mestre = this.ctx.createGain(); this.mestre.gain.value = 0.6; this.mestre.connect(this.ctx.destination);
      this.chiado = this.laco(2400, 0.9, 'highpass');
      this.borbulha = this.laco(400, 2, 'lowpass');
      this.motor = this.laco(900, 1.5, 'bandpass');
    } catch (e) { this.ctx = null; }
  }
  laco(freq, q, tipo) {
    const s = this.ctx.createBufferSource(); s.buffer = this.ruido; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(this.mestre); s.start();
    return g;
  }
  nivel(laco, v) { if (this.ctx && laco) laco.gain.setTargetAtTime(this.ligado ? v : 0, this.ctx.currentTime, 0.15); }
  bip(freq = 880, dur = 0.08, tipo = 'sine', vol = 0.25) {
    if (!this.ctx || !this.ligado) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tipo; o.frequency.value = freq; g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.mestre); o.start(); o.stop(this.ctx.currentTime + dur);
  }
  corte() { this.estalo(3200, 0.04, 0.5); }
  estalo(freq, dur, vol) {
    if (!this.ctx || !this.ligado) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.ruido;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(this.mestre); s.start(); s.stop(this.ctx.currentTime + dur);
  }
  fogo() { this.estalo(300, 1.2, 0.8); this.estalo(900, 0.8, 0.4); }
  sino() { [1318, 1760].forEach((f, i) => setTimeout(() => this.bip(f, 0.7, 'triangle', 0.3), i * 90)); }
  tique(alto) { this.bip(alto ? 1200 : 700, 0.05, 'square', 0.12); }
  aplauso(dur = 2.5) {
    if (!this.ctx || !this.ligado) return;
    for (let i = 0; i < 60; i++) setTimeout(() => this.estalo(1500 + Math.random() * 2000, 0.03, 0.15 + Math.random() * 0.2), Math.random() * dur * 1000);
  }
  tensao() {
    if (!this.ctx || !this.ligado) return;
    [110, 116.5].forEach((f) => { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 0.8); g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3); const fl = this.ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 600; o.connect(fl); fl.connect(g); g.connect(this.mestre); o.start(); o.stop(this.ctx.currentTime + 3.1); });
  }
}

// Voz da apresentadora e dos jurados (speechSynthesis do navegador, se houver voz em português).
export class Voz {
  constructor() { this.ligada = true; this.vozes = []; if ('speechSynthesis' in window) { const c = () => { this.vozes = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pt')); }; c(); speechSynthesis.onvoiceschanged = c; } }
  falar(texto, quem) {
    if (!this.ligada || !('speechSynthesis' in window) || !this.vozes.length) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto.replace(/[*_]/g, ''));
    u.lang = 'pt-BR';
    const fem = this.vozes.filter((v) => /female|maria|francisca|luciana|vit[oó]ria|thalita|leila|feminin/i.test(v.name));
    const mas = this.vozes.filter((v) => /male|daniel|ant[oô]nio|felipe|donato|masculin/i.test(v.name) && !/female/i.test(v.name));
    if (quem === 'patrao' || quem === 'risotto') u.voice = fem[0] || this.vozes[0];
    else u.voice = mas[0] || this.vozes[0];
    u.rate = quem === 'jacuzzi' ? 1.08 : quem === 'fumaca' ? 1.0 : 1.02;
    u.pitch = quem === 'jacuzzi' ? 0.85 : quem === 'fumaca' ? 0.7 : quem === 'risotto' ? 1.15 : 1.0;
    speechSynthesis.speak(u);
  }
  parar() { if ('speechSynthesis' in window) speechSynthesis.cancel(); }
}
