// Humanos com modelos CC0 (Quaternius, Universal Base Characters) e animações
// da Universal Animation Library. A roupa é pintada no shader por região do esqueleto.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE = { corpos: {}, cabelos: {}, clipes: {} };
const CABELOS = ['hair_buns', 'hair_buzzed', 'hair_buzzedfemale', 'hair_long', 'hair_simpleparted', 'hair_beard'];
const CORES_CAMISA = [0x8a1c2a, 0x2a6a4a, 0xe8e2d8, 0x3a3a46, 0xc89a2a, 0x5a2a6a, 0x2a4a8a, 0x8a5a2a, 0xd86a3a, 0x4a4a4a, 0x6a8a9a, 0xa83a5a];

// Estado da animação para cada clipe
const CLIPE = {
  parado: 'Idle_Loop', falando: 'Idle_Talking_Loop', andando: 'Walk_Loop', correndo: 'Jog_Fwd_Loop', disparada: 'Sprint_Loop',
  picando: 'Interact', mexendo: 'PickUp_Table', provando: 'Idle_Torch_Loop', comemorando: 'Dance_Loop', aplaudindo: 'Spell_Simple_Idle_Loop',
  chorando: 'Hit_Head', bracos_cruzados: 'Idle_Loop',
};
const VEL_CLIPE = { picando: 1.5, mexendo: 0.9, chorando: 0.7 };

function regiaoDoOsso(nome) {
  if (/^(Head|neck_01)$/.test(nome) || /hand_|index_|middle_|pinky_|ring_|thumb_/.test(nome)) return 0;
  if (/lowerarm/.test(nome)) return 4;
  if (/thigh|calf|pelvis/.test(nome)) return 2;
  if (/foot|ball/.test(nome)) return 3;
  return 1;
}

function prepararCorpo(gltf, tipo) {
  const cena = gltf.scene;
  cena.updateMatrixWorld(true);
  let corpo = null;
  cena.traverse((o) => { if (o.isSkinnedMesh && /Superhero/.test(o.material.name)) corpo = o; if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  const g = corpo.geometry;
  const bones = corpo.skeleton.bones;
  const J = g.attributes.skinIndex, W = g.attributes.skinWeight, P = g.attributes.position, N = g.attributes.normal;
  const caixa = new THREE.Box3().setFromObject(cena);
  const H = caixa.max.y - caixa.min.y;
  const reg = new Float32Array(P.count), ave = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) {
    let m = 0, osso = 0;
    for (let k = 0; k < 4; k++) { const w = W.getComponent(i, k); if (w > m) { m = w; osso = J.getComponent(i, k); } }
    reg[i] = regiaoDoOsso(bones[osso].name);
    const y = (P.getY(i) - caixa.min.y) / H, x = Math.abs(P.getX(i)) / H, nz = N.getZ(i);
    const frente = nz > 0.15 && P.getZ(i) > 0;
    if (frente && (reg[i] === 1 || reg[i] === 2) && ((y > 0.3 && y < 0.56 && x < 0.13) || (y >= 0.56 && y < 0.71 && x < 0.085))) ave[i] = 1;
  }
  g.setAttribute('regiao', new THREE.BufferAttribute(reg, 1));
  g.setAttribute('avental', new THREE.BufferAttribute(ave, 1));
  const camisa = gerarCamisa(corpo);
  const head = cena.getObjectByName('Head');
  const pelvis = cena.getObjectByName('pelvis');
  return { cena, corpo, camisa, altura: H, cabecaInv: head.matrixWorld.clone().invert(), pelvisInv: pelvis.matrixWorld.clone().invert(), tipo };
}

// Camisa/dólmã: casca suave medida do próprio tronco, com folga, presa aos ossos da coluna.
function gerarCamisa(corpo) {
  const g = corpo.geometry, bones = corpo.skeleton.bones;
  g.computeBoundingBox();
  const y0 = g.boundingBox.min.y, H = g.boundingBox.max.y - g.boundingBox.min.y;
  const P = g.attributes.position, J = g.attributes.skinIndex, W = g.attributes.skinWeight;
  const ANG = 40, FAT = 18, yIni = y0 + H * 0.5, yFim = y0 + H * 0.815;
  const raios = Array.from({ length: FAT }, () => new Float32Array(ANG));
  const centros = new Float32Array(FAT), cont = new Float32Array(FAT);
  const ehTronco = (n) => /^(spine_0[123]|clavicle_[lr]|pelvis)$/.test(n);
  const pts = [];
  for (let i = 0; i < P.count; i++) {
    let m = 0, o = 0;
    for (let k = 0; k < 4; k++) { const w = W.getComponent(i, k); if (w > m) { m = w; o = J.getComponent(i, k); } }
    if (!ehTronco(bones[o].name)) continue;
    const y = P.getY(i);
    if (y < yIni || y > yFim) continue;
    const f = Math.min(FAT - 1, Math.floor(((y - yIni) / (yFim - yIni)) * FAT));
    pts.push([f, P.getX(i), P.getZ(i)]);
    centros[f] += P.getZ(i); cont[f]++;
  }
  for (let f = 0; f < FAT; f++) centros[f] = cont[f] ? centros[f] / cont[f] : 0;
  for (const [f, x, z] of pts) {
    const a = Math.atan2(x, z - centros[f]);
    const b = ((Math.round((a / (Math.PI * 2)) * ANG) % ANG) + ANG) % ANG;
    raios[f][b] = Math.max(raios[f][b], Math.hypot(x, z - centros[f]));
  }
  // Preenche buracos e suaviza nas duas direções
  for (let f = 0; f < FAT; f++) for (let b = 0; b < ANG; b++) if (!raios[f][b]) {
    let s = 0, n = 0; for (let d = 1; d < ANG / 2 && !n; d++) for (const bb of [b - d, b + d]) { const v = raios[f][(bb + ANG) % ANG]; if (v) { s += v; n++; } }
    raios[f][b] = n ? s / n : 0.12;
  }
  for (let it = 0; it < 4; it++) {
    const nov = raios.map((r) => Float32Array.from(r));
    for (let f = 0; f < FAT; f++) for (let b = 0; b < ANG; b++) {
      const v = [raios[f][(b + 1) % ANG], raios[f][(b + ANG - 1) % ANG], raios[Math.max(0, f - 1)][b], raios[Math.min(FAT - 1, f + 1)][b], raios[f][b] * 2];
      nov[f][b] = v.reduce((a, c) => a + c, 0) / 6;
    }
    for (let f = 0; f < FAT; f++) raios[f] = nov[f];
  }
  const pos = [], idx = [], sI = [], sW = [], fr = [];
  const iOsso = (n) => bones.findIndex((b) => b.name === n);
  const ossos = [iOsso('spine_01'), iOsso('spine_02'), iOsso('spine_03')];
  for (let f = 0; f < FAT; f++) {
    const t = f / (FAT - 1);
    const y = yIni + t * (yFim - yIni);
    const folga = H * (0.022 + (t < 0.15 ? (0.15 - t) * 0.1 : 0));
    for (let b = 0; b <= ANG; b++) {
      const a = (b / ANG) * Math.PI * 2;
      const r = raios[f][b % ANG] + folga;
      pos.push(Math.sin(a) * r, y, centros[f] + Math.cos(a) * r);
      // pesos: de spine_01 (embaixo) a spine_03 (em cima)
      const u = t * 2;
      const w0 = Math.max(0, 1 - u), w2 = Math.max(0, u - 1), w1 = 1 - w0 - w2;
      sI.push(ossos[0], ossos[1], ossos[2], 0); sW.push(w0, w1, w2, 0);
      const frente = Math.cos(a);
      fr.push(frente > 0.55 && t < 0.62 ? 1 : frente > 0.8 && t < 0.85 ? 1 : 0);
    }
  }
  for (let f = 0; f < FAT - 1; f++) for (let b = 0; b < ANG; b++) {
    const a = f * (ANG + 1) + b, c = a + ANG + 1;
    idx.push(a, c, a + 1, a + 1, c, c + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sI, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sW, 4));
  geo.setAttribute('frente', new THREE.Float32BufferAttribute(fr, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export async function carregarModelos(progresso = () => {}) {
  const L = new GLTFLoader();
  const ld = async (u) => { const r = await L.loadAsync('modelos/' + u); progresso(); return r; };
  const [m, f, anim, ...cabs] = await Promise.all([ld('humano_m.gltf'), ld('humano_f.gltf'), ld('animacoes.glb'), ...CABELOS.map((c) => ld(c + '.gltf'))]);
  BASE.corpos.m = prepararCorpo(m, 'm');
  BASE.corpos.f = prepararCorpo(f, 'f');
  for (const a of anim.animations) {
    // Sem translação vertical nem horizontal na raiz: o jogo controla a posição.
    a.tracks = a.tracks.filter((t) => !/^root\.position/.test(t.name));
    BASE.clipes[a.name] = a;
  }
  CABELOS.forEach((nome, i) => {
    const malhas = [];
    cabs[i].scene.updateMatrixWorld(true);
    cabs[i].scene.traverse((o) => { if (o.isMesh) malhas.push(o); });
    BASE.cabelos[nome] = malhas;
  });
}

function materialCorpo(base, o) {
  const m = base.clone();
  const u = {
    uPele: { value: new THREE.Color(o.tomPele) },
    uCamisa: { value: new THREE.Color(o.camisa) }, uCalca: { value: new THREE.Color(o.calca) }, uSapato: { value: new THREE.Color(o.sapato) },
    uAvental: { value: new THREE.Color(0x0b2470) }, uComAvental: { value: o.comAvental ? 1 : 0 }, uMangaLonga: { value: o.mangaLonga ? 1 : 0 }, uTattoo: { value: o.tatuagem ? 1 : 0 },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float regiao; attribute float avental; flat varying float vRegiao; varying float vAvental;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRegiao = regiao; vAvental = avental;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nflat varying float vRegiao; varying float vAvental; uniform vec3 uPele, uCamisa, uCalca, uSapato, uAvental; uniform float uComAvental, uMangaLonga, uTattoo;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float rg = floor(vRegiao + 0.5);
        vec3 pano = uCamisa; float ehPano = 0.0;
        if (rg < 0.5) { diffuseColor.rgb *= uPele; }
        else if (rg < 1.5) { pano = uCamisa; ehPano = 1.0; }
        else if (rg < 2.5) { pano = uCalca; ehPano = 1.0; }
        else if (rg < 3.5) { pano = uSapato; ehPano = 1.0; }
        else { if (uMangaLonga > 0.5) { pano = uCamisa; ehPano = 1.0; } else { diffuseColor.rgb *= uPele;
          if (uTattoo > 0.5) { float t = step(0.62, abs(sin(vMapUv.x * 90.0 + sin(vMapUv.y * 70.0) * 2.0))); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.1, 0.2), t * 0.75); } } }
        if (vAvental > 0.5 && uComAvental > 0.5) { pano = uAvental; ehPano = 1.0; }
        if (ehPano > 0.5) diffuseColor.rgb = pano * (0.92 + 0.08 * diffuseColor.g);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, step(0.5, ehPano));')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nnormal = normalize(mix(normal, nonPerturbedNormal, step(0.5, ehPano) * 0.9));');
  };
  m.customProgramCacheKey = () => 'corpo-roupa';
  m.roughness = 0.55; m.metalness = 0;
  return m;
}

// Tom de pele como multiplicador da textura clara do modelo.
function tom(hex) {
  const c = new THREE.Color(hex), base = new THREE.Color(0xd8a07a);
  return new THREE.Color(Math.min(1.25, c.r / base.r), Math.min(1.25, c.g / base.g), Math.min(1.25, c.b / base.b)).getHex();
}

const ESTILO = {
  f: { longo: 'hair_long', chanel: 'hair_long', rabo: 'hair_buns', coque: 'hair_buns', preso: 'hair_buns', afro: 'hair_buns', cacheado: 'hair_long', raspado: 'hair_buzzedfemale', curto: 'hair_long' },
  m: { curto: 'hair_simpleparted', grisalho: 'hair_simpleparted', lateral: 'hair_simpleparted', topete: 'hair_simpleparted', franja: 'hair_simpleparted', cacheado: 'hair_buzzed', raspado: 'hair_buzzed', careca: null },
};

export class Humano {
  constructor(o = {}) {
    this.o = o;
    this.t = Math.random() * 10;
    this.estado = 'parado';
    this.caminho = [];
    this.vel = 1.4;
    this.resolverCaminho = null;
    this.raiz = new THREE.Group();
    this.raiz.userData.humano = this;
    const base = BASE.corpos[o.f ? 'f' : 'm'];
    const modelo = SkeletonUtils.clone(base.cena);
    const esc = (o.altura || 1.75) / base.altura;
    modelo.scale.set(esc * (o.largura || 1), esc, esc * Math.max(1, (o.largura || 1) * (o.barriga ? 1.12 : 1)));
    this.raiz.add(modelo);
    this.modelo = modelo;
    const roupa = o.roupa || 'avental';
    const camisa = roupa === 'dolma_preta' || roupa === 'camiseta_preta' ? 0x16161a : roupa === 'dolma_branca' ? 0xf4f4f0 : roupa === 'blazer' ? 0x0d2266 : (o.corCamisa ?? CORES_CAMISA[Math.floor(Math.random() * CORES_CAMISA.length)]);
    const calca = roupa === 'blazer' ? 0x0d2266 : roupa === 'camiseta_preta' ? 0x2a3550 : 0x1c1f2a;
    modelo.traverse((x) => {
      if (!x.isMesh) return;
      x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false;
      if (/Superhero/.test(x.material.name)) this.corpoMalha = x;
      if (/Superhero/.test(x.material.name)) x.material = materialCorpo(x.material, { tomPele: tom(o.pele || 0xd8a07a), camisa, calca, sapato: 0x0e0e10, comAvental: roupa === 'avental', mangaLonga: ['dolma_preta', 'dolma_branca', 'blazer'].includes(roupa), tatuagem: o.tatuagem });
      else if (/Hair/.test(x.material.name)) { x.material = x.material.clone(); x.material.color = new THREE.Color(o.corCabelo ?? 0x2a1a10).multiplyScalar(2.2); }
    });
    // Camisa de verdade por cima do tronco
    const matCam = new THREE.MeshStandardMaterial({ color: camisa, roughness: 0.85 });
    const comAvental = roupa === 'avental';
    matCam.onBeforeCompile = (sh) => {
      sh.uniforms.uAv = { value: new THREE.Color(0x0b2470) }; sh.uniforms.uComAv = { value: comAvental ? 1 : 0 };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float frente; varying float vFrente;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFrente = frente;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFrente; uniform vec3 uAv; uniform float uComAv;').replace('#include <color_fragment>', '#include <color_fragment>\nif (vFrente > 0.5 && uComAv > 0.5) diffuseColor.rgb = uAv;');
    };
    matCam.customProgramCacheKey = () => 'camisa';
    const cam = new THREE.SkinnedMesh(base.camisa, matCam);
    cam.castShadow = true; cam.receiveShadow = true; cam.frustumCulled = false;
    this.corpoMalha.parent.add(cam);
    cam.position.copy(this.corpoMalha.position); cam.quaternion.copy(this.corpoMalha.quaternion); cam.scale.copy(this.corpoMalha.scale);
    cam.bind(this.corpoMalha.skeleton, this.corpoMalha.bindMatrix);
    // Cabelo e barba presos no osso da cabeça
    const head = modelo.getObjectByName('Head');
    this.cabecaOsso = head;
    const estilos = [];
    const e = ESTILO[o.f ? 'f' : 'm'][o.cabelo || 'curto'];
    if (e !== null) estilos.push(e || (o.f ? 'hair_long' : 'hair_simpleparted'));
    if (o.barba || o.bigode) estilos.push('hair_beard');
    for (const nome of estilos) {
      for (const malha of BASE.cabelos[nome]) {
        const geo = malha.geometry.clone();
        geo.applyMatrix4(malha.matrixWorld);
        geo.applyMatrix4(base.cabecaInv);
        const mat = malha.material.clone();
        mat.color = new THREE.Color(o.corCabelo ?? 0x2a1a10).multiplyScalar(2.2);
        const mm = new THREE.Mesh(geo, mat);
        mm.castShadow = true;
        head.add(mm);
      }
    }
    if (o.oculos) this.oculos(head, base);
    if (roupa === 'blazer') {
      const H = base.altura;
      const saia = new THREE.CylinderGeometry(0.135, 0.2, H * 0.24, 32, 1, true);
      saia.scale(1, 1, 0.78); saia.translate(0, H * 0.43, 0.005); saia.applyMatrix4(base.pelvisInv);
      const ms = new THREE.Mesh(saia, new THREE.MeshStandardMaterial({ color: 0x0d2266, roughness: 0.7, side: THREE.DoubleSide }));
      ms.castShadow = true;
      modelo.getObjectByName('pelvis').add(ms);
    }
    // Animação
    this.mixer = new THREE.AnimationMixer(modelo);
    this.acoes = {};
    this.atual = null;
    this.tocar('parado', 0);
    this.mixer.update(Math.random() * 3);
  }

  oculos(head, base) {
    const g = new THREE.Group();
    const arm = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.3, metalness: 0.5 });
    for (const l of [1, -1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.0025, 6, 24), arm); t.position.set(l * 0.033, 0, 0); g.add(t); }
    const ponte = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.003), arm); g.add(ponte);
    // Posição dos olhos no espaço do modelo, levada para o espaço do osso da cabeça
    const olhos = new THREE.Vector3(0, base.altura * 0.925, 0.085);
    const m = new THREE.Matrix4().makeTranslation(olhos.x, olhos.y, olhos.z).premultiply(base.cabecaInv);
    g.applyMatrix4(m);
    head.add(g);
  }

  tocar(estado, fade = 0.3) {
    const nome = CLIPE[estado] || CLIPE.parado;
    const clipe = BASE.clipes[nome];
    if (!clipe) return;
    let a = this.acoes[nome];
    if (!a) { a = this.mixer.clipAction(clipe); this.acoes[nome] = a; }
    a.timeScale = VEL_CLIPE[estado] || 1;
    if (this.atual === a) return;
    a.reset().setEffectiveWeight(1).play();
    if (this.atual && fade > 0) this.atual.crossFadeTo(a, fade, false);
    else if (this.atual) this.atual.stop();
    this.atual = a;
  }

  segurar(obj) {
    if (this.prop) this.prop.parent?.remove(this.prop);
    this.prop = obj;
    const mao = this.modelo.getObjectByName('hand_r');
    if (obj && mao) {
      const s = 1 / this.modelo.scale.y;
      obj.scale.setScalar(s);
      obj.position.set(0.0, 0.08 * s, 0.02 * s);
      obj.rotation.set(0, 0, Math.PI / 2);
      mao.add(obj);
    }
  }

  irPara(pontos, vel = 1.4) {
    this.caminho = pontos.map((p) => new THREE.Vector2(p.x ?? p[0], p.z ?? p[1]));
    this.vel = vel;
    return new Promise((res) => { this.resolverCaminho = res; });
  }
  olharPara(x, z) { this.rumo = Math.atan2(x - this.raiz.position.x, z - this.raiz.position.z); }

  update(dt) {
    this.t += dt;
    const r = this.raiz;
    if (this.caminho.length) {
      const alvo = this.caminho[0];
      const dx = alvo.x - r.position.x, dz = alvo.y - r.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.08) {
        this.caminho.shift();
        if (!this.caminho.length && this.resolverCaminho) { const f = this.resolverCaminho; this.resolverCaminho = null; f(); }
      } else {
        const passo = Math.min(d, this.vel * dt);
        r.position.x += (dx / d) * passo; r.position.z += (dz / d) * passo;
        this.rumo = Math.atan2(dx, dz);
      }
    }
    if (this.rumo !== undefined) {
      let dif = this.rumo - r.rotation.y;
      dif = Math.atan2(Math.sin(dif), Math.cos(dif));
      r.rotation.y += dif * Math.min(1, dt * 8);
    }
    const andando = this.caminho.length > 0;
    const est = andando ? (this.vel > 3.3 ? 'disparada' : this.vel > 2.2 ? 'correndo' : 'andando') : this.estado;
    this.tocar(est);
    if (andando && this.atual) this.atual.timeScale = est === 'andando' ? this.vel / 1.3 : est === 'correndo' ? this.vel / 3.0 : this.vel / 5.0;
    this.mixer.update(dt);
  }
}
