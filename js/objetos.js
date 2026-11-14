// Malhas de ingredientes, recipientes, ferramentas e do troféu.
import * as THREE from 'three';
import { M, cor, texturaTexto } from './materiais.js';
import { torno, tornoSuave, caixaR } from './geo.js';
import { INGREDIENTES, PREPAROS } from './dados.js';
import { ehLiquido, ehProteina } from './culinaria.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const geoCache = new Map();
const rnd = (a, b) => a + Math.random() * (b - a);
const c3 = (h) => new THREE.Color(h);

function mk(geo, mat, x = 0, y = 0, z = 0, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function juntar(lista) {
  return mergeGeometries(lista.map((g) => { const n = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; }), false);
}

// Pilhas de pedaços cortados, geometria única por corte.
function geoCorte(corte, idBase) {
  const k = corte + ':' + (['cenoura', 'abobrinha', 'alho_poro'].includes(idBase) ? idBase : '');
  if (geoCache.has(k)) return geoCache.get(k);
  const partes = [];
  const add = (g, x, y, z, rx = 0, ry = 0, rz = 0) => { g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); partes.push(g); };
  const pilha = (n, f, raio = 0.045) => { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * raio; const h = (1 - r / raio) * raio * 0.45; f(Math.cos(a) * r, h, Math.sin(a) * r, i); } };
  switch (corte) {
    case 'brunoise': case 'ciseler': case 'concasse': case 'hacher': case 'esmagar': {
      const s = corte === 'concasse' ? 0.009 : corte === 'esmagar' ? 0.004 : 0.0055;
      pilha(corte === 'esmagar' ? 50 : 70, (x, y, z) => add(new THREE.BoxGeometry(s, s, s), x, y + s / 2, z, rnd(0, 3), rnd(0, 3), rnd(0, 3)), corte === 'esmagar' ? 0.025 : 0.045);
      break;
    }
    case 'mirepoix': pilha(16, (x, y, z) => add(caixaR(0.017, 0.017, 0.017, 0.002, 1), x, y + 0.008, z, rnd(0, 3), rnd(0, 3), 0), 0.05); break;
    case 'julienne': pilha(28, (x, y, z) => add(new THREE.BoxGeometry(0.003, 0.003, 0.05), x * 0.5, y * 0.6 + 0.002, z * 0.6, 0, rnd(-0.35, 0.35), 0), 0.04); break;
    case 'batonnet': pilha(14, (x, y, z) => add(new THREE.BoxGeometry(0.008, 0.008, 0.065), x * 0.6, y * 0.6 + 0.004, z * 0.5, 0, rnd(-0.3, 0.3), 0), 0.04); break;
    case 'chiffonade': pilha(34, (x, y, z) => add(new THREE.BoxGeometry(0.0025, 0.001, 0.04), x, y * 0.5 + 0.002, z, rnd(-0.3, 0.3), rnd(0, 3), rnd(-0.4, 0.4)), 0.04); break;
    case 'emincer': for (let i = 0; i < 9; i++) add(new THREE.CylinderGeometry(0.02, 0.02, 0.004, 20), (i - 4) * 0.009, 0.012, 0, 0, 0, Math.PI / 2 - 0.35); break;
    case 'paysanne': pilha(14, (x, y, z) => add(new THREE.BoxGeometry(0.014, 0.0025, 0.014), x, y * 0.4 + 0.002, z, rnd(-0.2, 0.2), rnd(0, 3), 0), 0.045); break;
    case 'tourner': add(new THREE.LatheGeometry([[0, -0.028], [0.012, -0.026], [0.019, -0.012], [0.021, 0], [0.019, 0.012], [0.012, 0.026], [0, 0.028]].map(([a, b]) => new THREE.Vector2(a, b)), 7), 0, 0.02, 0, 0, 0, Math.PI / 2); break;
    case 'filetar': add(caixaR(0.16, 0.022, 0.06, 0.01), 0, 0.011, 0); break;
    default: return null;
  }
  const g = juntar(partes);
  geoCache.set(k, g);
  return g;
}

function geoForma(forma, id) {
  const k = 'f:' + forma + ':' + id;
  if (geoCache.has(k)) return geoCache.get(k);
  let g;
  const L = [];
  switch (forma) {
    case 'esfera': {
      const s = new THREE.SphereGeometry(id === 'tomate' ? 0.034 : 0.038, 28, 20);
      s.scale(1, id === 'cebola' || id === 'cebola_roxa' || id === 'tomate' ? 0.86 : 1, 1); s.translate(0, 0.033, 0); L.push(s);
      if (id === 'cebola' || id === 'cebola_roxa') { const t = new THREE.ConeGeometry(0.008, 0.025, 10); t.translate(0, 0.075, 0); L.push(t); }
      break;
    }
    case 'esfera_peq': { const s = new THREE.SphereGeometry(0.02, 20, 14); s.scale(1, id === 'morango' ? 1.25 : 0.9, 1); s.translate(0, 0.02, 0); L.push(s); break; }
    case 'oval': { const s = new THREE.SphereGeometry(0.035, 24, 16); s.scale(1, 0.85, 1.4); s.translate(0, 0.03, 0); L.push(s); break; }
    case 'cone': { const s = new THREE.ConeGeometry(0.018, 0.17, 20); s.rotateZ(Math.PI / 2); s.translate(0, 0.018, 0); L.push(s); break; }
    case 'alongado': { const s = new THREE.CapsuleGeometry(id === 'alho_poro' || id === 'salsao' ? 0.018 : 0.026, id === 'banana' ? 0.13 : 0.17, 8, 20); s.rotateZ(Math.PI / 2); s.translate(0, 0.026, 0); L.push(s); break; }
    case 'alongado_fino': for (let i = 0; i < 5; i++) { const s = new THREE.CapsuleGeometry(0.006, 0.18, 4, 10); s.rotateZ(Math.PI / 2); s.translate(0, 0.008, (i - 2) * 0.013); L.push(s); } break;
    case 'cogumelo': { const a = new THREE.SphereGeometry(0.025, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2); a.scale(1, 0.7, 1); a.translate(0, 0.022, 0); const b = new THREE.CylinderGeometry(0.009, 0.011, 0.025, 12); b.translate(0, 0.012, 0); L.push(a, b); break; }
    case 'folhas': for (let i = 0; i < 6; i++) { const s = new THREE.SphereGeometry(0.035, 12, 8); s.scale(1, 0.35, 0.7); s.rotateY(i); s.rotateX(rnd(-0.4, 0.4)); s.translate(rnd(-0.02, 0.02), 0.015 + i * 0.006, rnd(-0.02, 0.02)); L.push(s); } break;
    case 'ramo': for (let i = 0; i < 5; i++) { const t = new THREE.CylinderGeometry(0.0015, 0.0015, 0.1, 5); t.rotateZ(Math.PI / 2); t.rotateY(rnd(-0.3, 0.3)); t.translate(0, 0.004, 0); L.push(t); for (let j = 0; j < 4; j++) { const f = new THREE.SphereGeometry(0.008, 8, 6); f.scale(1.6, 0.3, 1); f.translate(-0.03 + j * 0.02, 0.006, rnd(-0.015, 0.015)); L.push(f); } } break;
    case 'bife': { const s = caixaR(0.12, 0.032, 0.09, 0.014, 3); s.translate(0, 0.016, 0); L.push(s); break; }
    case 'filé': { const s = caixaR(0.16, 0.03, 0.07, 0.012, 3); s.translate(0, 0.015, 0); L.push(s); break; }
    case 'peixe': { const s = new THREE.SphereGeometry(0.04, 24, 12); s.scale(2.8, 0.7, 0.55); s.translate(0, 0.025, 0); const r = new THREE.ConeGeometry(0.03, 0.06, 4); r.rotateZ(-Math.PI / 2); r.scale(1, 1, 0.3); r.translate(-0.135, 0.025, 0); L.push(s, r); break; }
    case 'camarao': for (let i = 0; i < 3; i++) { const t = new THREE.TorusGeometry(0.022, 0.008, 8, 16, 4.2); t.rotateX(Math.PI / 2); t.translate((i - 1) * 0.035, 0.008, 0); L.push(t); } break;
    case 'vieira': for (let i = 0; i < 3; i++) { const t = new THREE.CylinderGeometry(0.02, 0.021, 0.018, 20); t.translate((i - 1) * 0.045, 0.009, 0); L.push(t); } break;
    case 'ovo': { const s = new THREE.SphereGeometry(0.022, 20, 16); s.scale(1, 1.3, 1); s.translate(0, 0.028, 0); L.push(s); break; }
    case 'gema': { const s = new THREE.SphereGeometry(0.016, 16, 12); s.scale(1, 0.6, 1); s.translate(0, 0.008, 0); L.push(s); break; }
    case 'gelo': for (let i = 0; i < 6; i++) { const b = caixaR(0.025, 0.025, 0.025, 0.004, 1); b.rotateY(rnd(0, 2)); b.translate(rnd(-0.03, 0.03), 0.013 + (i > 3 ? 0.02 : 0), rnd(-0.03, 0.03)); L.push(b); } break;
    case 'fava': { const s = new THREE.CapsuleGeometry(0.003, 0.14, 4, 8); s.rotateZ(Math.PI / 2); s.translate(0, 0.004, 0); L.push(s); break; }
    case 'queijo': { const s = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 20, 1, false, 0, 0.9); s.translate(0, 0.025, 0); L.push(s); break; }
    case 'tablete': { const s = caixaR(0.1, 0.035, 0.05, 0.006); s.translate(0, 0.018, 0); L.push(s); break; }
    default: { const s = new THREE.SphereGeometry(0.03, 16, 12); s.translate(0, 0.03, 0); L.push(s); }
  }
  g = juntar(L);
  geoCache.set(k, g);
  return g;
}

// Embalagens com rótulo.
function embalagem(forma, d) {
  const grupo = new THREE.Group();
  const rot = new THREE.MeshStandardMaterial({ map: texturaTexto([d.nome], { w: 256, h: 128, fundo: '#f6efe0', cor: '#0b1f5c', tam: 30, fonte: 'Inter, sans-serif' }), roughness: 0.6 });
  if (forma === 'caixa' || forma === 'saco') {
    const w = forma === 'caixa' ? 0.07 : 0.1, h = forma === 'caixa' ? 0.15 : 0.16, p = forma === 'caixa' ? 0.07 : 0.06;
    grupo.add(mk(caixaR(w, h, p, forma === 'saco' ? 0.02 : 0.004), forma === 'saco' ? M('caixaPapelao') : cor(0xf6f6f2, 0.5), 0, h / 2, 0));
    const r = mk(new THREE.PlaneGeometry(w * 0.9, h * 0.45), rot, 0, h * 0.5, p / 2 + 0.002); grupo.add(r);
  } else if (forma === 'garrafa') {
    const vidro = cor(d.cor, 0.08, 0.1, { transparent: true, opacity: 0.88 });
    grupo.add(mk(tornoSuave([[0.001, 0], [0.034, 0.002], [0.036, 0.15], [0.03, 0.19], [0.014, 0.22], [0.013, 0.28], [0.015, 0.285], [0.001, 0.29]], 28, 30), vidro, 0, 0, 0));
    const r = mk(new THREE.CylinderGeometry(0.0365, 0.0365, 0.07, 28, 1, true, -1.2, 2.4), rot, 0, 0.09, 0); grupo.add(r);
  } else if (forma === 'pote' || forma === 'pote_grande') {
    const g = forma === 'pote' ? 1 : 1.5;
    grupo.add(mk(new THREE.CylinderGeometry(0.035 * g, 0.035 * g, 0.075 * g, 24), cor(d.cor, 0.4), 0, 0.0375 * g, 0));
    grupo.add(mk(new THREE.CylinderGeometry(0.037 * g, 0.037 * g, 0.015, 24), M('ouro'), 0, 0.075 * g + 0.007, 0));
    grupo.add(mk(new THREE.CylinderGeometry(0.0355 * g, 0.0355 * g, 0.035 * g, 24, 1, true, -1, 2), rot, 0, 0.035 * g, 0));
  } else if (forma === 'saleiro') {
    grupo.add(mk(new THREE.CylinderGeometry(0.022, 0.025, 0.07, 20), cor(d.cor === 0xffffff ? 0xf2f2f2 : d.cor, 0.3), 0, 0.035, 0));
    grupo.add(mk(new THREE.SphereGeometry(0.022, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M('inoxPolido'), 0, 0.07, 0));
  }
  return grupo;
}

export function corComida(c) {
  const d = INGREDIENTES[c.id] || PREPAROS[c.id];
  let base = c3(c.corte && d.corInterna ? d.corInterna : d.cor);
  if (ehProteina(c)) {
    const coz = Math.max(0, Math.min(1, (c.tN - 38) / 32));
    base.lerp(c3(c.cat === 'peixe' ? 0xf6e6d8 : c.cat === 'fruto_mar' ? 0xf28a6a : 0x9a7a6a), coz * 0.8);
  }
  if (c.cat === 'ovo' || c.id === 'ovos_batidos' || c.id === 'omelete' || c.cat === 'gema') base.lerp(c3(0xf8e07a), Math.min(1, c.coag) * 0.5);
  if (c.id === 'roux') base.lerp(c3(0x8a5a2a), Math.min(1, c.corRoux / 1.2));
  if (c.cozido > 0.3 && !ehProteina(c)) base.multiplyScalar(1 - Math.min(0.2, (c.cozido - 0.3) * 0.15));
  const d2 = Math.max(c.dA, c.dB) * 0.6 + Math.min(c.dA, c.dB) * 0.4;
  if (d2 > 0.05) base.lerp(c3(0x8a5226), Math.min(1, d2) * 0.75);
  if (d2 > 1.1 || c.def.queimado || c.def.queimada) base.lerp(c3(0x120a06), Math.min(1, (d2 - 1.0) * 1.5 + (c.def.queimado ? 0.6 : 0)));
  return base;
}

// Malha de uma comida no estado atual. Recria quando o corte muda.
export function malhaComida(c) {
  const d = INGREDIENTES[c.id] || PREPAROS[c.id];
  const g = new THREE.Group();
  g.userData.chave = c.id + ':' + c.corte;
  const mat = new THREE.MeshStandardMaterial({ color: corComida(c), roughness: ehProteina(c) ? 0.45 : 0.55 });
  g.userData.mat = mat;
  if (c.corte && geoCorte(c.corte, c.id)) {
    g.add(mk(geoCorte(c.corte, c.id), mat));
  } else if (PREPAROS[c.id] && !INGREDIENTES[c.id]) {
    if (c.id === 'omelete') g.add(mk(new THREE.CapsuleGeometry(0.03, 0.1, 8, 20), mat, 0, 0.028, 0, [0, 0, Math.PI / 2]));
    else if (c.id === 'pure') { const s = new THREE.SphereGeometry(0.06, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); s.scale(1, 0.6, 1); g.add(mk(s, mat)); }
    else if (c.id === 'roux' || c.id === 'ovos_batidos') g.add(mk(new THREE.CylinderGeometry(0.075, 0.075, 0.008, 28), mat, 0, 0.004, 0));
    else g.add(mk(new THREE.CylinderGeometry(0.06, 0.07, 0.01, 28), mat, 0, 0.005, 0));
  } else if (['caixa', 'saco', 'garrafa', 'pote', 'pote_grande', 'saleiro'].includes(d.forma)) {
    g.add(embalagem(d.forma, d));
  } else if (d.forma === 'nenhuma') {
    g.add(mk(new THREE.SphereGeometry(0.02, 12, 10), M('agua'), 0, 0.02, 0));
  } else {
    const transp = c.id === 'clara' || c.id === 'gelo';
    const m2 = transp ? new THREE.MeshPhysicalMaterial({ color: d.cor, transparent: true, opacity: 0.55, roughness: 0.05 }) : mat;
    if (transp) g.userData.mat = m2;
    g.add(mk(geoForma(d.forma, c.id), m2));
    if (c.id === 'tomate') g.add(mk(new THREE.ConeGeometry(0.012, 0.008, 5), cor(0x2a6a1a, 0.7), 0, 0.064, 0));
    if (c.id === 'cenoura') g.add(mk(new THREE.ConeGeometry(0.012, 0.05, 6), cor(0x2a7a1a, 0.7), 0.105, 0.018, 0, [0, 0, -Math.PI / 2]));
    if (c.id === 'salmao') for (let i = 0; i < 5; i++) g.add(mk(new THREE.BoxGeometry(0.002, 0.031, 0.06), cor(0xf8d8c8, 0.5), -0.06 + i * 0.03, 0.016, 0, [0, 0.3, 0]));
    if (d.forma === 'bife' && c.cat === 'bovino') for (let i = 0; i < 4; i++) g.add(mk(new THREE.BoxGeometry(rnd(0.02, 0.06), 0.0325, 0.002), cor(0xf0d8d0, 0.6), rnd(-0.03, 0.03), 0.016, rnd(-0.03, 0.03), [0, rnd(0, 3), 0]));
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function atualizarCorComida(c, g) {
  const m = g.userData.mat;
  if (m && m.color && c.id !== 'clara' && c.id !== 'gelo') m.color.copy(corComida(c));
}

// ---------- Recipientes ----------
const INTERNO = {
  frigideira: { r: 0.115, fundo: 0.008, alt: 0.045 }, sauteuse: { r: 0.1, fundo: 0.008, alt: 0.07 }, panela: { r: 0.11, fundo: 0.008, alt: 0.14 },
  assadeira: { r: 0.12, fundo: 0.012, alt: 0.04 }, bowl: { r: 0.09, fundo: 0.008, alt: 0.085 }, prato: { r: 0.09, fundo: 0.014, alt: 0.02 },
  liquidificador: { r: 0.07, fundo: 0.2, alt: 0.25 }, fritadeira: { r: 0.12, fundo: 0.24, alt: 0.0 },
};
export const interno = (t) => INTERNO[t];

export function malhaRecipiente(rtipo) {
  const g = new THREE.Group();
  const inox = M('inox'), aco = M('acoCarbono');
  switch (rtipo) {
    case 'frigideira':
      g.add(mk(torno([[0, 0], [0.118, 0], [0.138, 0.02], [0.152, 0.047], [0.146, 0.048], [0.132, 0.022], [0.114, 0.007], [0, 0.007]], 56), aco));
      g.add(mk(new THREE.CylinderGeometry(0.011, 0.013, 0.26, 16), aco, 0.27, 0.06, 0, [0, 0, Math.PI / 2 + 0.2]));
      g.add(mk(new THREE.TorusGeometry(0.012, 0.003, 6, 14), aco, 0.395, 0.087, 0, [Math.PI / 2, 0, 0]));
      break;
    case 'sauteuse':
      g.add(mk(torno([[0, 0], [0.108, 0], [0.112, 0.01], [0.112, 0.072], [0.106, 0.072], [0.106, 0.007], [0, 0.007]], 56), inox));
      g.add(mk(new THREE.CylinderGeometry(0.01, 0.012, 0.22, 14), inox, 0.22, 0.07, 0, [0, 0, Math.PI / 2 + 0.15]));
      break;
    case 'panela':
      g.add(mk(torno([[0, 0], [0.118, 0], [0.122, 0.012], [0.122, 0.142], [0.126, 0.146], [0.116, 0.146], [0.116, 0.007], [0, 0.007]], 56), inox));
      for (const l of [1, -1]) g.add(mk(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI), inox, l * 0.135, 0.115, 0, [Math.PI / 2, 0, l > 0 ? -Math.PI / 2 : Math.PI / 2]));
      break;
    case 'assadeira':
      g.add(mk(caixaR(0.36, 0.012, 0.26, 0.005), M('inoxEscuro'), 0, 0.006, 0));
      for (const [w, d, x, z] of [[0.36, 0.008, 0, 0.126], [0.36, 0.008, 0, -0.126], [0.008, 0.26, 0.176, 0], [0.008, 0.26, -0.176, 0]]) g.add(mk(new THREE.BoxGeometry(w, 0.04, d), M('inoxEscuro'), x, 0.02, z));
      break;
    case 'bowl':
      g.add(mk(tornoSuave([[0.001, 0], [0.05, 0], [0.1, 0.035], [0.132, 0.09], [0.127, 0.091], [0.096, 0.04], [0.047, 0.006], [0.001, 0.006]], 56, 40), M('inoxPolido')));
      break;
    case 'prato':
      g.add(mk(torno([[0, 0], [0.085, 0], [0.095, 0.009], [0.14, 0.019], [0.152, 0.023], [0.148, 0.025], [0.136, 0.022], [0.093, 0.014], [0, 0.014]], 64), M('porcelana')));
      g.add(mk(new THREE.TorusGeometry(0.149, 0.0022, 6, 64), M('ouro'), 0, 0.024, 0, [Math.PI / 2, 0, 0]));
      break;
    case 'liquidificador':
      g.add(mk(caixaR(0.19, 0.17, 0.19, 0.03), M('inoxEscuro'), 0, 0.085, 0));
      g.add(mk(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), M('plasticoPreto'), 0, 0.12, 0.1, [Math.PI / 2, 0, 0]));
      g.add(mk(torno([[0.06, 0.17], [0.07, 0.18], [0.09, 0.43], [0.095, 0.44]], 40), M('vidro'), 0, 0, 0));
      g.add(mk(new THREE.CylinderGeometry(0.098, 0.098, 0.025, 40), M('plasticoPreto'), 0, 0.452, 0));
      g.add(mk(new THREE.BoxGeometry(0.03, 0.18, 0.03), M('plasticoPreto'), 0.105, 0.31, 0));
      break;
    case 'fritadeira':
      g.add(mk(caixaR(0.42, 0.28, 0.4, 0.02), inox, 0, 0.14, 0));
      g.add(mk(new THREE.BoxGeometry(0.34, 0.005, 0.3), M('oleo'), 0, 0.245, 0));
      g.add(mk(new THREE.BoxGeometry(0.3, 0.12, 0.26), cor(0x8a8a8a, 0.4, 0.9, { wireframe: true }), 0, 0.2, 0));
      g.add(mk(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 10), M('plasticoPreto'), 0, 0.31, 0.2, [Math.PI / 2 - 0.5, 0, 0]));
      g.add(mk(new THREE.BoxGeometry(0.12, 0.05, 0.01), M('vidroPreto'), 0, 0.2, 0.202));
      break;
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const ancora = new THREE.Group();
  ancora.position.y = INTERNO[rtipo].fundo;
  g.add(ancora);
  g.userData.ancora = ancora;
  const liq = mk(new THREE.CylinderGeometry(1, 1, 0.004, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, transparent: true, opacity: 0.9, clearcoat: 0.6 }));
  liq.visible = false; liq.castShadow = false;
  g.add(liq);
  g.userData.liq = liq;
  return g;
}

const COR_LIQ = { agua: [0xa8d4ff, 0.45], leite: [0xfbfaf4, 0.95], creme: [0xfaf2de, 0.95], fundo_claro: [0xd8b070, 0.85], fundo_escuro: [0x5a2e12, 0.92], fumet: [0xe6d8a8, 0.8], vinho_branco: [0xf0e090, 0.7], vinho_tinto: [0x5a0e1e, 0.9], vinagre: [0xf6f0d0, 0.6], azeite: [0xb8a020, 0.85], oleo: [0xe8c84a, 0.8], conhaque: [0xa8641a, 0.8], grand_marnier: [0xd07a1a, 0.8], clara: [0xf4f0e0, 0.7], manteiga: [0xf6d860, 0.9] };

// Posiciona o conteúdo e desenha o nível de líquido.
export function arrumarConteudo(r, g, malhaDe) {
  const inn = INTERNO[r.rtipo];
  const anc = g.userData.ancora;
  const liqs = r.conteudo.filter((c) => ehLiquido(c) || (c.id === 'manteiga' && c.tN > 40));
  const solidos = r.conteudo.filter((c) => !liqs.includes(c));
  let vol = 0; const corMix = new THREE.Color(0, 0, 0); let op = 0;
  for (const c of liqs) {
    const [h, o] = COR_LIQ[c.id] || [(PREPAROS[c.id] || INGREDIENTES[c.id]).cor, 0.95];
    const v = Math.max(0.15, c.volume);
    corMix.add(corComida(c).multiplyScalar(v).lerp(c3(h).multiplyScalar(v), PREPAROS[c.id] ? 0 : 0.5)); op += o * v; vol += v;
  }
  const liq = g.userData.liq;
  let nivel = 0;
  if (vol > 0 && r.rtipo !== 'fritadeira') {
    nivel = Math.min(inn.alt * 0.9, 0.006 + vol * (r.rtipo === 'prato' ? 0.004 : r.rtipo === 'liquidificador' ? 0.05 : r.rtipo === 'panela' ? 0.035 : 0.014));
    liq.visible = true;
    const raio = r.rtipo === 'prato' ? 0.07 : inn.r * (r.rtipo === 'bowl' ? 0.75 + nivel * 3 : 1);
    liq.scale.set(raio, 1, raio);
    liq.position.y = inn.fundo + nivel;
    liq.material.color.copy(corMix.multiplyScalar(1 / vol));
    liq.material.opacity = Math.min(0.97, op / vol);
  } else liq.visible = false;
  const n = solidos.length;
  solidos.forEach((c, i) => {
    const m = malhaDe(c);
    if (m.parent !== anc) anc.add(m);
    const a = (i / Math.max(1, n)) * Math.PI * 2 + 0.6, rr = n > 1 ? inn.r * 0.45 : 0;
    m.position.set(Math.cos(a) * rr, r.rtipo === 'fritadeira' ? -0.03 : 0.002, Math.sin(a) * rr);
    m.rotation.set(0, a, c.lado ? Math.PI : 0);
    if (c.lado) m.position.y += 0.03;
    const esc = r.rtipo === 'liquidificador' ? 0.7 : 1;
    m.scale.setScalar(esc);
  });
  for (const c of liqs) { const m = malhaDe(c); if (m.parent) m.parent.remove(m); }
}

// ---------- Ferramentas e decoração ----------
export function malhaFerramenta(id) {
  const g = new THREE.Group();
  if (id === 'fouet') {
    g.add(mk(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 14), M('inoxPolido'), 0, 0.006, 0.0, [0, 0, Math.PI / 2]));
    for (let i = 0; i < 8; i++) { const t = new THREE.TorusGeometry(0.035, 0.0012, 4, 24, Math.PI); const m = mk(t, M('inoxPolido'), -0.06, 0.006, 0, [i * Math.PI / 8, 0, Math.PI / 2]); m.scale.set(1, 2.4, 1); g.add(m); }
  } else if (id === 'colher') {
    g.add(mk(new THREE.CylinderGeometry(0.006, 0.008, 0.24, 10), M('madeira'), 0.03, 0.008, 0, [0, 0, Math.PI / 2]));
    const s = new THREE.SphereGeometry(0.025, 16, 10); s.scale(1.3, 0.35, 1);
    g.add(mk(s, M('madeira'), -0.11, 0.008, 0));
  } else if (id === 'faca') {
    g.add(mk(new THREE.BoxGeometry(0.2, 0.002, 0.04), M('inoxPolido'), -0.06, 0.006, 0));
    g.add(mk(caixaR(0.11, 0.018, 0.022, 0.008), M('plasticoPreto'), 0.1, 0.009, 0));
  } else if (id === 'pinca') {
    for (const l of [1, -1]) g.add(mk(new THREE.BoxGeometry(0.24, 0.004, 0.012), M('inoxPolido'), 0, 0.006, l * 0.008, [0, l * 0.05, 0]));
  }
  return g;
}

// O troféu: frango assado banhado a ouro, com três coxas, numa frigideira-pedestal.
export function trofeu() {
  const g = new THREE.Group();
  const o = M('ouroBrilho'), of = M('ouro');
  g.add(mk(torno([[0, 0], [0.22, 0], [0.22, 0.05], [0.12, 0.1], [0.07, 0.36], [0.12, 0.42], [0, 0.42]], 48), of));
  g.add(mk(torno([[0, 0.42], [0.2, 0.42], [0.25, 0.47], [0.24, 0.48], [0.19, 0.44], [0, 0.44]], 56), o));
  g.add(mk(new THREE.CylinderGeometry(0.02, 0.025, 0.3, 14), of, 0.38, 0.47, 0, [0, 0, Math.PI / 2 + 0.15]));
  const corpo = new THREE.SphereGeometry(0.16, 40, 28); corpo.scale(1.25, 0.82, 1);
  g.add(mk(corpo, o, 0, 0.6, 0));
  const peito = new THREE.SphereGeometry(0.1, 30, 20); peito.scale(1.1, 0.8, 1.2);
  g.add(mk(peito, o, 0.08, 0.66, 0));
  for (const [x, z, ry] of [[-0.12, 0.12, 0.4], [-0.12, -0.12, -0.4], [0.03, 0.17, 1.4]]) {
    const coxa = new THREE.Group(); coxa.position.set(x, 0.58, z); coxa.rotation.set(0, ry, 0.5);
    const c = new THREE.SphereGeometry(0.07, 24, 16); c.scale(1.5, 0.85, 0.85);
    coxa.add(mk(c, o, -0.08, 0, 0));
    coxa.add(mk(new THREE.CylinderGeometry(0.014, 0.018, 0.12, 12), of, -0.2, 0, 0, [0, 0, Math.PI / 2]));
    coxa.add(mk(new THREE.SphereGeometry(0.022, 14, 10), of, -0.26, 0, 0));
    g.add(coxa);
  }
  const plaq = mk(new THREE.PlaneGeometry(0.3, 0.07), new THREE.MeshStandardMaterial({ map: texturaTexto(['FRANGO DOURADO', 'de três pernas'], { w: 512, h: 128, fundo: '#0b1f5c', cor: '#f3c74a', borda: '#f3c74a' }), metalness: 0.3, roughness: 0.4 }), 0, 0.2, 0.135, [-0.25, 0, 0]);
  g.add(plaq);
  g.traverse((x) => { if (x.isMesh) { x.castShadow = true; } });
  return g;
}

// Cópia de vitrine (decoração estática): compartilha materiais entre cópias.
const decorCache = new Map();
export function malhaDecor(id) {
  if (!decorCache.has(id)) {
    const c = { uid: 0, id, corte: null, tN: 20, dA: 0, dB: 0, cozido: 0, coag: 0, corRoux: 0, def: {}, cat: (INGREDIENTES[id] || {}).cat };
    decorCache.set(id, malhaComida(c));
  }
  return decorCache.get(id).clone();
}
