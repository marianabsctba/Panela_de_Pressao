// Bancada profissional. A do jogador é interativa; as dos NPCs viram malha estática.
import * as THREE from 'three';
import { M, cor, texturaTexto } from './materiais.js';
import { caixaR, torno, malha } from './geo.js';
import { malhaRecipiente, malhaFerramenta, malhaDecor } from './objetos.js';
import { DESPENSA_BANCADA } from './dados.js';

export const BOCAS = [[-1.12, -0.2], [-0.63, -0.2], [-1.12, 0.2], [-0.63, 0.2]];
export const TOPO = 0.9;
const invisivel = new THREE.MeshBasicMaterial({ visible: false });

function hit(w, h, d, x, y, z, ent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), invisivel);
  m.position.set(x, y, z);
  m.userData.ent = ent;
  return m;
}

export function construirBancada(numero, interativa) {
  const g = new THREE.Group();
  const add = (geo, mat, x, y, z, rot) => { const m = malha(geo, mat, x, y, z); if (rot) m.rotation.set(...rot); g.add(m); return m; };
  add(caixaR(3.0, 0.84, 1.1, 0.03), M('inox'), 0, 0.45, 0);
  add(caixaR(3.06, 0.045, 1.16, 0.012), M('inoxTampo'), 0, TOPO - 0.0225, 0);
  add(new THREE.BoxGeometry(3.0, 0.06, 1.06), M('plasticoPreto'), 0, 0.03, 0);
  add(new THREE.BoxGeometry(2.9, 0.68, 0.012), M('azulLaca'), 0, 0.46, -0.556);
  for (const y of [0.13, 0.79]) add(new THREE.BoxGeometry(2.9, 0.02, 0.016), M('ouro'), 0, y, -0.558);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: texturaTexto(String(numero), { w: 256, h: 128, fundo: '#0b1f5c', cor: '#f3c74a', borda: '#f3c74a', tam: 90 }), roughness: 0.4, metalness: 0.3 }));
  placa.position.set(0, 0.46, -0.564); placa.rotation.y = Math.PI; g.add(placa);

  // Fogão
  add(new THREE.BoxGeometry(0.95, 0.008, 0.82), M('vidroPreto'), -0.875, TOPO + 0.004, 0);
  for (const [bx, bz] of BOCAS) {
    add(new THREE.TorusGeometry(0.1, 0.007, 8, 32), M('ferro'), bx, TOPO + 0.03, bz, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.21, 0.012, 0.012), M('ferro'), bx, TOPO + 0.03, bz, [0, i * Math.PI / 4, 0]);
    add(new THREE.CylinderGeometry(0.038, 0.045, 0.02, 24), M('ferro'), bx, TOPO + 0.014, bz);
  }
  // Botões do fogão e do forno (lado do chef)
  const botoes = [];
  [-1.25, -1.05, -0.85, -0.65, -0.42].forEach((bx) => {
    const b = add(new THREE.CylinderGeometry(0.024, 0.026, 0.03, 20), M('plasticoPreto'), bx, 0.8, 0.565, [Math.PI / 2, 0, 0]);
    add(new THREE.BoxGeometry(0.006, 0.03, 0.006), M('ouro'), bx, 0.81, 0.582);
    botoes.push(b);
  });
  // Forno
  add(caixaR(0.86, 0.56, 0.02, 0.01), M('inoxPolido'), -0.875, 0.42, 0.56);
  const janela = add(new THREE.BoxGeometry(0.62, 0.3, 0.005), M('vidroPreto'), -0.875, 0.4, 0.572);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.6, 14), M('ouro'), -0.875, 0.66, 0.6, [0, 0, Math.PI / 2]);
  for (const l of [1, -1]) add(new THREE.BoxGeometry(0.02, 0.02, 0.04), M('ouro'), -0.875 + l * 0.27, 0.66, 0.585);
  // Tábua e faca
  add(caixaR(0.56, 0.025, 0.38, 0.01), M('tabua'), 0, TOPO + 0.0125, 0.14);
  const faca = malhaFerramenta('faca'); faca.position.set(0.02, TOPO, -0.14); faca.rotation.y = 0.1; g.add(faca);
  // Pia
  add(new THREE.BoxGeometry(0.46, 0.006, 0.36), M('inoxEscuro'), 1.2, TOPO + 0.003, -0.24);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.007, 16), M('ferro'), 1.2, TOPO + 0.007, -0.24);
  add(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 14), M('inoxPolido'), 1.2, TOPO + 0.16, -0.45);
  add(new THREE.TorusGeometry(0.09, 0.012, 10, 24, Math.PI), M('inoxPolido'), 1.2, TOPO + 0.32, -0.36, [0, Math.PI / 2, 0]);
  // Balde de gelo
  add(torno([[0, 0], [0.07, 0], [0.085, 0.13], [0.08, 0.13], [0.066, 0.006], [0, 0.006]], 32), M('inoxPolido'), 0.82, TOPO, -0.3);
  for (let i = 0; i < 7; i++) add(caixaR(0.03, 0.03, 0.03, 0.005, 1), M('vidroGeladeira'), 0.82 + Math.sin(i) * 0.03, TOPO + 0.1 + (i % 2) * 0.02, -0.3 + Math.cos(i * 2) * 0.03, [i, i, 0]);
  // Prateleira suspensa (despensa)
  for (const l of [1, -1]) add(new THREE.CylinderGeometry(0.016, 0.016, 0.65, 14), M('ouro'), l * 1.45, TOPO + 0.325, -0.5);
  add(caixaR(2.96, 0.025, 0.24, 0.006), M('inoxPolido'), 0, 1.42, -0.45);
  add(new THREE.BoxGeometry(2.8, 0.01, 0.03), M('luzQuente'), 0, 1.403, -0.4);
  // Carrinho auxiliar
  for (const y of [0.45, TOPO]) add(caixaR(0.72, 0.025, 0.52, 0.006), M('inoxPolido'), -1.95, y - 0.012, 0);
  for (const [x, z] of [[-2.28, -0.23], [-1.62, -0.23], [-2.28, 0.23], [-1.62, 0.23]]) add(new THREE.CylinderGeometry(0.014, 0.014, TOPO, 10), M('inox'), x, TOPO / 2, z);
  // Lixeira
  add(new THREE.CylinderGeometry(0.16, 0.15, 0.56, 28), M('inox'), 1.78, 0.28, 0.5);
  add(new THREE.CylinderGeometry(0.165, 0.165, 0.03, 28), M('plasticoPreto'), 1.78, 0.575, 0.5);

  const r = { grupo: g, numero, botoes, janela };
  if (!interativa) {
    // Utensílios decorativos estáticos
    const deco = [['panela', BOCAS[0]], ['frigideira', BOCAS[3]], ['sauteuse', BOCAS[1]]];
    for (const [t, [x, z]] of deco) { const m = malhaRecipiente(t); m.position.set(x, TOPO + 0.036, z); m.rotation.y = t === 'frigideira' ? 0.5 : 0; m.traverse((o) => { if (o.isMesh && o === m.userData.liq) o.visible = false; }); m.remove(m.userData.liq); g.add(m); }
    for (const [t, x, z] of [['liquidificador', 0.5, -0.3], ['fritadeira', 1.2, 0.28], ['bowl', 0.55, 0.2]]) { const m = malhaRecipiente(t); m.remove(m.userData.liq); m.position.set(x, TOPO, z); g.add(m); }
    const p = malhaRecipiente('prato'); p.remove(p.userData.liq); p.position.set(0.9, 1.4325, -0.45); g.add(p);
    DESPENSA_BANCADA.forEach((id, i) => { const m = malhaDecor(id); m.position.set(-1.3 + i * 0.22, 1.4325, -0.45); g.add(m); });
  }
  return r;
}

// Peças interativas da bancada do jogador (posições locais à bancada).
export function pecasInterativas(b) {
  const e = { bocas: [], hits: [] };
  BOCAS.forEach(([x, z], i) => {
    const ent = { tipo: 'boca', idx: i, nivel: 0, rec: null, pos: new THREE.Vector3(x, TOPO + 0.036, z) };
    const h = hit(0.3, 0.08, 0.3, x, TOPO + 0.04, z, ent);
    const chama = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 24), M('chamaAzul').clone());
    chama.rotation.x = Math.PI / 2; chama.position.set(x, TOPO + 0.03, z); chama.visible = false;
    ent.chama = chama; ent.botao = b.botoes[i];
    e.bocas.push(ent); e.hits.push(h, chama);
  });
  e.forno = { tipo: 'forno', temp: 0, rec: null, pos: new THREE.Vector3(-0.875, 0.28, 0.1), botao: b.botoes[4], janela: b.janela };
  e.hits.push(hit(0.86, 0.56, 0.06, -0.875, 0.42, 0.56, e.forno));
  e.tabua = { tipo: 'tabua', comida: null, pos: new THREE.Vector3(0, TOPO + 0.025, 0.14) };
  e.hits.push(hit(0.56, 0.05, 0.38, 0, TOPO + 0.025, 0.14, e.tabua));
  e.pia = { tipo: 'pia' };
  e.hits.push(hit(0.46, 0.4, 0.4, 1.2, TOPO + 0.12, -0.25, e.pia));
  e.gelo = { tipo: 'gelo' };
  e.hits.push(hit(0.18, 0.16, 0.18, 0.82, TOPO + 0.08, -0.3, e.gelo));
  e.lixo = { tipo: 'lixo' };
  e.hits.push(hit(0.34, 0.6, 0.34, 1.78, 0.3, 0.5, e.lixo));
  e.superficies = [
    { tipo: 'superficie', nome: 'bancada', y: TOPO, min: [-1.5, -0.55], max: [1.5, 0.55] },
    { tipo: 'superficie', nome: 'prateleira', y: 1.4325, min: [-1.48, -0.57], max: [1.48, -0.33] },
    { tipo: 'superficie', nome: 'carrinho', y: TOPO, min: [-2.31, -0.26], max: [-1.59, 0.26] },
    { tipo: 'superficie', nome: 'carrinho de baixo', y: 0.45, min: [-2.31, -0.26], max: [-1.59, 0.26] },
  ];
  for (const s of e.superficies) {
    const w = s.max[0] - s.min[0], d = s.max[1] - s.min[1];
    e.hits.push(hit(w, 0.02, d, (s.min[0] + s.max[0]) / 2, s.y - 0.01, (s.min[1] + s.max[1]) / 2, s));
  }
  e.despensa = DESPENSA_BANCADA.map((id, i) => ({ tipo: 'despensa', id, pos: new THREE.Vector3(-1.3 + i * 0.22, 1.4325, -0.45) }));
  return e;
}
