// Humanos realistas gerados com MakeHuman (MPFB, assets CC0) e animados com a
// Universal Animation Library (Quaternius, CC0), convertida para o esqueleto do MPFB.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const BASE = { modelos: {}, clipes: {} };

// Estado da animação para cada clipe
const CLIPE = {
  parado: 'Idle_Loop', falando: 'Idle_Talking_Loop', andando: 'Walk_Loop', correndo: 'Jog_Fwd_Loop', disparada: 'Sprint_Loop',
  picando: 'Interact', mexendo: 'PickUp_Table', provando: 'Idle_Torch_Loop', comemorando: 'Dance_Loop', aplaudindo: 'Spell_Simple_Idle_Loop',
  chorando: 'Hit_Head', bracos_cruzados: 'Idle_Loop',
};
const VEL_CLIPE = { picando: 1.5, mexendo: 0.9, chorando: 0.7 };

export async function carregarModelos(ids, progresso = () => {}) {
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/');
  const L = new GLTFLoader(); L.setDRACOLoader(draco);
  const ld = async (u) => { try { const r = await L.loadAsync(u); progresso(); return r; } catch (e) { progresso(); return null; } };
  const [anim, ...gs] = await Promise.all([ld('modelos/gente/animacoes.glb'), ...ids.map((id) => ld('modelos/gente/' + id + '.glb'))]);
  for (const a of anim.animations) {
    a.tracks = a.tracks.filter((t) => !/^Root.position/.test(t.name));
    BASE.clipes[a.name] = a;
  }
  ids.forEach((id, i) => { if (gs[i]) BASE.modelos[id] = gs[i].scene; });
}

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
    const fonte = BASE.modelos[o.id] || Object.values(BASE.modelos)[0];
    const modelo = SkeletonUtils.clone(fonte);
    this.raiz.add(modelo);
    this.modelo = modelo;
    modelo.traverse((x) => {
      if (!x.isMesh) return;
      x.castShadow = true; x.receiveShadow = true; x.frustumCulled = false;
      const mats = Array.isArray(x.material) ? x.material : [x.material];
      for (const m of mats) {
        if (m.map) m.map.anisotropy = 4;
        const fio = /eyelash|eyebrow|short|long|bob|braid|afro|ponytail/i.test(m.name);
        m.transparent = false; m.depthWrite = true; m.opacity = 1;
        m.alphaTest = fio ? 0.45 : 0;
        if (!fio && /low-poly/i.test(m.name)) m.alphaTest = 0.5;
        if (!fio) m.side = THREE.FrontSide;
      }
      if (o.tintas) for (const [prefixo, cor] of Object.entries(o.tintas)) if (x.name.startsWith(prefixo)) { x.material = x.material.clone(); x.material.color = new THREE.Color(cor); }
    });
    this.mixer = new THREE.AnimationMixer(modelo);
    this.acoes = {};
    this.atual = null;
    this.tocar('parado', 0);
    this.mixer.update(Math.random() * 3);
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
