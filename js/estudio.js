// Estúdio azul e dourado, mesa dos jurados, mercadinho e iluminação.
import * as THREE from 'three';
import { M, cor, texturaTexto } from './materiais.js';
import { caixaR, torno, malha, Lote } from './geo.js';
import { construirBancada } from './bancada.js';
import { malhaDecor, trofeu } from './objetos.js';
import { INGREDIENTES } from './dados.js';

export const COLUNAS = [-13.5, -4.5, 4.5, 13.5];
export const LINHAS = [-5.5, -0.5, 4.5, 9.5];
export const LIMITES = { x: [-20.6, 20.6], z: [-15.6, 14.6] };
export const MERCADO = { x: [-11.6, 11.6], z: [15.4, 26.6], porta: [-3.5, 3.5] };
export const MESA = { x: 0, z: -11.5 };
export const BANCADA_JOGADOR = 1;

export function posBancada(i) { return { x: COLUNAS[i % 4], z: LINHAS[Math.floor(i / 4)] }; }

const caixaColisao = (x, z, w, d) => ({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

export function construirEstudio(cena, qualidade) {
  const lote = new Lote();
  const colisores = [];
  const interativos = [];
  const raiz = new THREE.Group();
  cena.add(raiz);
  const L = (obj) => lote.absorver(obj);
  const mk = (geo, mat, x, y, z, rot) => { const m = malha(geo, mat, x, y, z); if (rot) m.rotation.set(...rot); return m; };

  // Piso, teto e paredes
  const piso = mk(new THREE.PlaneGeometry(42, 31), M('piso'), 0, 0, -0.5, [-Math.PI / 2, 0, 0]);
  piso.receiveShadow = true; piso.castShadow = false; raiz.add(piso);
  const pisoM = mk(new THREE.PlaneGeometry(24, 12), M('piso'), 0, 0.001, 21, [-Math.PI / 2, 0, 0]); pisoM.castShadow = false; raiz.add(pisoM);
  raiz.add(mk(new THREE.PlaneGeometry(42, 31), M('teto'), 0, 9, -0.5, [Math.PI / 2, 0, 0]));
  raiz.add(mk(new THREE.PlaneGeometry(24, 12), M('teto'), 0, 5, 21, [Math.PI / 2, 0, 0]));
  const parede = (w, h, x, y, z, ry) => { const m = mk(new THREE.PlaneGeometry(w, h), M('parede'), x, y, z, [0, ry, 0]); m.castShadow = false; raiz.add(m); };
  parede(42, 9, 0, 4.5, -16, 0);
  parede(31, 9, -21, 4.5, -0.5, Math.PI / 2);
  parede(31, 9, 21, 4.5, -0.5, -Math.PI / 2);
  parede(17.5, 9, -12.25, 4.5, 15, Math.PI);
  parede(17.5, 9, 12.25, 4.5, 15, Math.PI);
  parede(7, 4, 0, 7, 15, Math.PI);
  parede(24, 5, 0, 2.5, 27, Math.PI);
  parede(12, 5, -12, 2.5, 21, Math.PI / 2);
  parede(12, 5, 12, 2.5, 21, -Math.PI / 2);
  colisores.push(caixaColisao(-12.25, 15, 17.5, 0.4), caixaColisao(12.25, 15, 17.5, 0.4));
  // Rodapé e frisos dourados
  for (const [w, x, z, ry] of [[42, 0, -15.95, 0], [31, -20.95, -0.5, Math.PI / 2], [31, 20.95, -0.5, Math.PI / 2], [17.5, -12.25, 14.95, 0], [17.5, 12.25, 14.95, 0]]) {
    L(mk(new THREE.BoxGeometry(w, 0.18, 0.06), M('ouro'), x, 0.09, z, [0, ry, 0]));
    L(mk(new THREE.BoxGeometry(w, 0.08, 0.08), M('ouro'), x, 6.2, z, [0, ry, 0]));
  }
  // Pilastras douradas só nos cantos, para não tampar telão e placas
  for (const [x, z] of [[-20.7, -15.7], [20.7, -15.7], [-20.7, 14.7], [20.7, 14.7]]) L(mk(new THREE.CylinderGeometry(0.28, 0.32, 9, 24), M('ouroFosco'), x, 4.5, z));

  // Treliça do teto com refletores
  for (let x = -18; x <= 18; x += 6) L(mk(new THREE.BoxGeometry(0.18, 0.18, 30), M('inoxEscuro'), x, 7.6, -0.5));
  for (let z = -14; z <= 13; z += 4.5) L(mk(new THREE.BoxGeometry(40, 0.18, 0.18), M('inoxEscuro'), 0, 7.6, z));
  for (let x = -15; x <= 15; x += 6) for (let z = -12; z <= 12; z += 4.5) {
    L(mk(new THREE.CylinderGeometry(0.16, 0.22, 0.4, 16), M('plasticoPreto'), x, 7.3, z));
    L(mk(new THREE.CircleGeometry(0.17, 20), M('luzQuente'), x, 7.09, z, [Math.PI / 2, 0, 0]));
  }

  // Telão com o logo e relógio
  const logoTex = texturaTexto(['PANELA DE PRESSÃO', '4D · o reality com cheiro'], { w: 2048, h: 512, fundo: '#061a4a', cor: '#f6c94a', sombra: '#ffb420', borda: '#e3b33c', bordaL: 14 });
  const logo = mk(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshStandardMaterial({ map: logoTex, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.55, roughness: 0.4 }), 0, 4.6, -15.9);
  raiz.add(logo);
  for (const [w, h, x, y] of [[14.4, 0.08, 0, 6.4], [14.4, 0.08, 0, 2.8], [0.08, 3.6, -7.2, 4.6], [0.08, 3.6, 7.2, 4.6]]) raiz.add(mk(new THREE.BoxGeometry(w, h, 0.08), M('ouroNeon'), x, y, -15.88));
  const relCanvas = document.createElement('canvas'); relCanvas.width = 512; relCanvas.height = 160;
  const relTex = new THREE.CanvasTexture(relCanvas); relTex.colorSpace = THREE.SRGBColorSpace;
  const relogio = mk(new THREE.PlaneGeometry(3.6, 1.12), new THREE.MeshBasicMaterial({ map: relTex }), 0, 7.4, -15.9);
  raiz.add(relogio);
  L(mk(new THREE.BoxGeometry(3.8, 1.3, 0.1), M('ouro'), 0, 7.4, -15.96));
  function desenharRelogio(txt, alerta) {
    const g = relCanvas.getContext('2d');
    g.fillStyle = '#020818'; g.fillRect(0, 0, 512, 160);
    g.fillStyle = alerta ? '#ff4a3a' : '#f6c94a';
    g.font = '700 120px "JetBrains Mono", Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 256, 86);
    relTex.needsUpdate = true;
  }
  desenharRelogio('00:00');
  // Telas laterais
  for (const x of [-13, 13]) {
    const t = texturaTexto(['COZINHE', 'COMO SE O JACUZZI', 'ESTIVESSE OLHANDO'], { w: 1024, h: 512, fundo: '#0b2470', cor: '#f6c94a' });
    raiz.add(mk(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4 }), x, 4.4, -15.9));
  }

  // Mesa dos jurados (o passe)
  const mesa = new THREE.Group(); mesa.position.set(MESA.x, 0, MESA.z);
  mesa.add(mk(caixaR(6.4, 0.07, 1.2, 0.02), M('marmore'), 0, 0.96, 0));
  mesa.add(mk(caixaR(6.2, 0.9, 1.0, 0.03), M('azulLaca'), 0, 0.46, -0.05));
  for (const y of [0.15, 0.85]) mesa.add(mk(new THREE.BoxGeometry(6.22, 0.03, 1.02), M('ouro'), 0, y, -0.05));
  const plaqMesa = texturaTexto(['JURADOS'], { w: 512, h: 128, fundo: '#0b2470', cor: '#f6c94a' });
  mesa.add(mk(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshStandardMaterial({ map: plaqMesa, emissive: 0xffffff, emissiveMap: plaqMesa, emissiveIntensity: 0.3 }), 0, 0.5, 0.455));
  for (const x of [-2, 0, 2]) {
    mesa.add(mk(new THREE.CylinderGeometry(0.035, 0.035, 0.004, 20), M('ouro'), x, 0.997, 0.2));
    const tac = mk(torno([[0, 0], [0.03, 0], [0.008, 0.01], [0.006, 0.11], [0.035, 0.18], [0.04, 0.24], [0.037, 0.24], [0.03, 0.18], [0, 0.14]], 24), M('vidro'), x + 0.4, 0.995, -0.2);
    mesa.add(tac);
  }
  L(mesa);
  colisores.push(caixaColisao(MESA.x, MESA.z, 6.6, 1.4));
  interativos.push((() => { const h = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 1.2), new THREE.MeshBasicMaterial({ visible: false })); h.position.set(MESA.x, 1.05, MESA.z); h.userData.ent = { tipo: 'passe' }; return h; })());
  // Tapete vermelho, ops, azul
  L(mk(caixaR(9, 0.01, 4, 0.004), M('veludoAzul'), 0, 0.005, -12.5));

  // Púlpito da apresentadora
  const pulpito = new THREE.Group(); pulpito.position.set(-6, 0, -10.2);
  pulpito.add(mk(torno([[0, 0], [0.35, 0], [0.34, 0.06], [0.22, 0.12], [0.18, 1.0], [0.3, 1.08], [0.32, 1.12], [0, 1.12]], 40), M('azulLaca')));
  pulpito.add(mk(new THREE.TorusGeometry(0.31, 0.015, 8, 40), M('ouro'), 0, 1.1, 0, [Math.PI / 2, 0, 0]));
  L(pulpito);
  colisores.push(caixaColisao(-6, -10.2, 0.8, 0.8));

  // Pedestal do troféu
  const ped = new THREE.Group(); ped.position.set(6, 0, -10.6);
  ped.add(mk(new THREE.CylinderGeometry(0.42, 0.48, 1.1, 40), M('veludoAzul'), 0, 0.55, 0));
  for (const y of [0.02, 1.1]) ped.add(mk(new THREE.TorusGeometry(0.46, 0.025, 8, 40), M('ouro'), 0, y, 0, [Math.PI / 2, 0, 0]));
  L(ped);
  const tro = trofeu(); tro.position.set(6, 1.12, -10.6); tro.scale.setScalar(1.1); raiz.add(tro);
  const cupula = mk(new THREE.SphereGeometry(0.62, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), M('vidro'), 6, 1.12, -10.6); raiz.add(cupula);
  colisores.push(caixaColisao(6, -10.6, 1.1, 1.1));
  interativos.push((() => { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 1.9, 12), new THREE.MeshBasicMaterial({ visible: false })); h.position.set(6, 1, -10.6); h.userData.ent = { tipo: 'trofeu' }; return h; })());

  // Câmaras frias e adega nas laterais
  for (let i = 0; i < 4; i++) {
    for (const lado of [-1, 1]) {
      const x = lado * 20.35, z = -11 + i * 2.2;
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -lado * Math.PI / 2;
      g.add(mk(caixaR(1.9, 2.4, 0.9, 0.03), M('inox'), 0, 1.2, 0));
      g.add(mk(new THREE.BoxGeometry(1.7, 2.0, 0.02), M('luzFria'), 0, 1.25, 0.43));
      for (let s = 0; s < 4; s++) for (let k = 0; k < 5; k++) g.add(mk(caixaR(0.24, 0.22, 0.25, 0.02), cor([0xd8231c, 0xf2d93b, 0x3f7a2a, 0xf4e6cf, 0x9a1f22][(k + s + i) % 5], 0.6), -0.65 + k * 0.32, 0.45 + s * 0.5, 0.25));
      g.add(mk(new THREE.BoxGeometry(1.75, 2.05, 0.01), M('vidroGeladeira'), 0, 1.25, 0.46));
      g.add(mk(new THREE.BoxGeometry(0.03, 0.9, 0.04), M('ouro'), 0.8, 1.3, 0.5));
      L(g);
      colisores.push(caixaColisao(x, z, 1.0, 2.0));
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.4, 1.9), new THREE.MeshBasicMaterial({ visible: false }));
      h.position.set(x, 1.2, z); h.userData.ent = { tipo: 'camara' }; interativos.push(h);
    }
  }
  const placaCamara = (txt, x, ry) => { const t = texturaTexto(txt, { w: 1024, h: 160, fundo: '#061a4a', cor: '#f6c94a' }); raiz.add(mk(new THREE.PlaneGeometry(6, 0.9), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4 }), x, 3.3, -7.7, [0, ry, 0])); };
  placaCamara('CÂMARA FRIA (onde se chora)', -20.9, Math.PI / 2);
  placaCamara('ADEGA E LATICÍNIOS', 20.9, -Math.PI / 2);

  // Porta de saída dos eliminados
  const saida = texturaTexto(['SAÍDA'], { w: 512, h: 160, fundo: '#061a4a', cor: '#5ad8ff' });
  raiz.add(mk(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshStandardMaterial({ map: saida, emissive: 0xffffff, emissiveMap: saida, emissiveIntensity: 0.9 }), -20.9, 3.0, 11, [0, Math.PI / 2, 0]));
  L(mk(new THREE.BoxGeometry(0.1, 2.6, 1.8), M('vidroPreto'), -20.95, 1.3, 11));
  L(mk(new THREE.BoxGeometry(0.14, 2.7, 0.1), M('ouro'), -20.9, 1.35, 10.1)); L(mk(new THREE.BoxGeometry(0.14, 2.7, 0.1), M('ouro'), -20.9, 1.35, 11.9));

  // Bancadas
  const bancadas = [];
  for (let i = 0; i < 16; i++) {
    const p = posBancada(i);
    const b = construirBancada(i + 1, i === BANCADA_JOGADOR);
    b.grupo.position.set(p.x, 0, p.z);
    b.pos = p; b.idx = i;
    if (i === BANCADA_JOGADOR) {
      const est = new THREE.Group(); est.position.copy(b.grupo.position);
      // partes estáticas da bancada do jogador também vão pro lote, menos botões e janela
      b.botoes.forEach((x) => { x.parent.remove(x); est.add(x); });
      b.janela.parent.remove(b.janela); est.add(b.janela);
      L(b.grupo);
      b.grupo = est; raiz.add(est);
    } else L(b.grupo);
    colisores.push(caixaColisao(p.x, p.z, 3.1, 1.2), caixaColisao(p.x - 1.95, p.z, 0.75, 0.55), caixaColisao(p.x + 1.78, p.z + 0.5, 0.35, 0.35));
    bancadas.push(b);
  }

  // Mercadinho
  const mercado = construirMercado(L, mk, raiz, interativos, colisores);

  raiz.add(lote.construir(true));

  // Iluminação
  const hemi = new THREE.HemisphereLight(0xc8d4ff, 0x0a1030, 0.9); cena.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff0dc, 2.4);
  sol.position.set(7, 22, 10); sol.target.position.set(0, 0, 0);
  sol.castShadow = qualidade !== 'baixa';
  sol.shadow.mapSize.set(qualidade === 'alta' ? 4096 : 2048, qualidade === 'alta' ? 4096 : 2048);
  Object.assign(sol.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 60 });
  sol.shadow.bias = -0.0003; sol.shadow.normalBias = 0.03;
  cena.add(sol, sol.target);
  const pontos = [[0, 4.5, -10.5, 0xffd890, 60, 14], [-10, 7, 2, 0xfff2e0, 80, 22], [10, 7, 2, 0xfff2e0, 80, 22], [0, 7, 8, 0xfff2e0, 60, 20], [-5, 4.6, 21, 0xf0f6ff, 35, 14], [5, 4.6, 21, 0xf0f6ff, 35, 14]];
  for (const [x, y, z, c, i, d] of pontos) { const l = new THREE.PointLight(c, i, d, 1.6); l.position.set(x, y, z); cena.add(l); }
  const spot = new THREE.SpotLight(0xffe2a0, 80, 12, 0.32, 0.5, 1.5); spot.position.set(6, 6.5, -8); spot.target = tro; cena.add(spot);

  return { colisores, interativos, bancadas, mercado, desenharRelogio, trofeu: tro };
}

const SECOES_GONDOLA = ['Hortifrúti', 'Mercearia', 'Adega'];

function construirMercado(L, mk, raiz, interativos, colisores) {
  const slots = [];
  // Letreiro da porta
  const t = texturaTexto(['MERCADINHO', '3 minutos e nenhum a mais'], { w: 1024, h: 256, fundo: '#061a4a', cor: '#f6c94a', borda: '#f6c94a' });
  raiz.add(mk(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 }), 0, 4.3, 14.9, [0, Math.PI, 0]));
  raiz.add(mk(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6 }), 0, 4.3, 15.1));
  // Gôndolas
  for (const gz of [18.8, 22.4]) {
    const g = new THREE.Group(); g.position.set(0, 0, gz);
    g.add(mk(caixaR(16.4, 0.16, 1.0, 0.02), M('azulLaca'), 0, 0.08, 0));
    g.add(mk(new THREE.BoxGeometry(16.2, 1.7, 0.06), M('inoxEscuro'), 0, 0.95, 0));
    for (const y of [0.72, 1.22]) for (const s of [-1, 1]) {
      g.add(mk(caixaR(16.2, 0.03, 0.44, 0.008), cor(0xd8dce4, 0.65, 0.1), 0, y, s * 0.25));
      g.add(mk(new THREE.BoxGeometry(16.2, 0.04, 0.012), M('ouro'), 0, y - 0.01, s * 0.475));
      for (let i = 0; i < 10; i++) slots.push({ x: -7.29 + i * 1.62, y: y + 0.015, z: gz + s * 0.25, face: s, gondola: gz });
    }
    g.add(mk(new THREE.BoxGeometry(16.4, 0.06, 1.0), M('ouro'), 0, 1.84, 0));
    L(g);
    colisores.push(caixaColisao(0, gz, 16.6, 1.1));
  }
  // Refrigeradores no fundo
  const frio = [];
  for (let i = 0; i < 2; i++) for (let k = 0; k < 12; k++) frio.push({ x: -9.9 + k * 1.8, y: 0.86 + i * 0.55, z: 26.25, face: -1 });
  const ref = new THREE.Group(); ref.position.set(0, 0, 26.4);
  ref.add(mk(caixaR(22.4, 2.2, 0.9, 0.03), M('inox'), 0, 1.1, 0));
  ref.add(mk(new THREE.BoxGeometry(22, 1.6, 0.02), M('luzFria'), 0, 1.2, -0.3));
  for (const y of [0.84, 1.39]) ref.add(mk(new THREE.BoxGeometry(22, 0.025, 0.5), cor(0xd8dce4, 0.65, 0.1), 0, y, -0.2));
  ref.add(mk(new THREE.BoxGeometry(22.4, 0.05, 0.05), M('ouro'), 0, 2.2, -0.46));
  L(ref);
  colisores.push(caixaColisao(0, 26.4, 22.6, 1.0));
  // Distribui os produtos
  const ids = Object.keys(INGREDIENTES).filter((id) => !INGREDIENTES[id].despensa && INGREDIENTES[id].preco > 0 || ['manteiga', 'farinha', 'acucar', 'azeite', 'oleo'].includes(id));
  const refrigerados = ids.filter((id) => INGREDIENTES[id].geladeira);
  const demais = ids.filter((id) => !INGREDIENTES[id].geladeira).sort((a, b) => SECOES_GONDOLA.indexOf(INGREDIENTES[a].secao) - SECOES_GONDOLA.indexOf(INGREDIENTES[b].secao));
  const colocar = (id, s) => {
    const d = INGREDIENTES[id];
    const embalado = ['caixa', 'saco', 'garrafa', 'pote', 'pote_grande', 'tablete', 'queijo'].includes(d.forma);
    if (!embalado) {
      // Caixote de madeira (hortifrúti) ou bandeja de inox (refrigerados)
      const mat = d.geladeira ? M('inox') : M('madeira');
      const cx = new THREE.Group(); cx.position.set(s.x, s.y, s.z);
      cx.add(mk(new THREE.BoxGeometry(0.66, 0.015, 0.38), mat, 0, 0.008, 0));
      for (const [w, dd, x, z] of [[0.66, 0.015, 0, 0.18], [0.66, 0.015, 0, -0.18], [0.015, 0.38, 0.32, 0], [0.015, 0.38, -0.32, 0]]) cx.add(mk(new THREE.BoxGeometry(w, d.geladeira ? 0.03 : 0.09, dd), mat, x, d.geladeira ? 0.015 : 0.045, z));
      L(cx);
      const esc = ['folhas', 'ramo', 'esfera_peq', 'alongado_fino', 'camarao', 'vieira', 'gema'].includes(d.forma) ? 1.35 : 1.15;
      const pos = [[-0.21, -0.08], [0, -0.09], [0.21, -0.08], [-0.21, 0.08], [0, 0.08], [0.21, 0.08], [-0.1, 0], [0.11, 0]];
      pos.forEach(([x, z], k) => {
        const m = malhaDecor(id);
        m.scale.setScalar(esc);
        m.position.set(s.x + x + (Math.random() - 0.5) * 0.03, s.y + 0.016 + (k >= 6 ? 0.05 * esc : 0), s.z + z * (d.forma === 'bife' || d.forma === 'filé' || d.forma === 'peixe' ? 0.7 : 1));
        m.rotation.y = Math.random() * Math.PI * 2;
        L(m);
      });
    } else {
      for (let k = 0; k < 4; k++) {
        const m = malhaDecor(id);
        m.position.set(s.x + (k - 1.5) * 0.15, s.y, s.z + (k % 2) * 0.06 * -s.face);
        m.rotation.y = s.face > 0 ? Math.PI : 0;
        L(m);
      }
    }
    const etq = texturaTexto([d.nome, 'R$ ' + d.preco + ',00'], { w: 512, h: 160, fundo: '#f6efe0', cor: '#0b1f5c', tam: 64, fonte: 'Inter, sans-serif' });
    const pm = mk(new THREE.PlaneGeometry(0.46, 0.14), new THREE.MeshStandardMaterial({ map: etq, roughness: 0.6 }), s.x, s.y - 0.06, s.z + s.face * 0.23, [0, s.face > 0 ? 0 : Math.PI, 0]);
    pm.castShadow = false;
    raiz.add(pm);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.36, 0.42), new THREE.MeshBasicMaterial({ visible: false }));
    h.position.set(s.x, s.y + 0.12, s.z);
    h.userData.ent = { tipo: 'produto', id };
    interativos.push(h);
  };
  refrigerados.forEach((id, i) => colocar(id, frio[i]));
  demais.forEach((id, i) => colocar(id, slots[i]));
  // Placas de seção
  const secao = (txt, x, z) => { const tx = texturaTexto(txt, { w: 768, h: 160, fundo: '#0b2470', cor: '#f6c94a' }); raiz.add(mk(new THREE.PlaneGeometry(3, 0.6), new THREE.MeshStandardMaterial({ map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.5 }), x, 3.2, z, [0, Math.PI, 0])); };
  secao('HORTIFRÚTI', -4, 18.8); secao('MERCEARIA E ADEGA', 4, 22.4); secao('AÇOUGUE · PEIXARIA · LATICÍNIOS', 0, 25.9);
  return { produtos: ids };
}
