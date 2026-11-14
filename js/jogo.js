// Panela de Pressão 4D: montagem da cena, fluxo do programa e interface.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { construirEstudio, posBancada, BANCADA_JOGADOR, MESA } from './estudio.js';
import { Humano, carregarModelos } from './humanos.js';
import { Cozinha } from './cozinha.js';
import { Jogador } from './jogador.js';
import { Efeitos, Som, Voz } from './efeitos.js';
import { PROVAS, JURADOS, avaliar, simularNpc, eliminar, NOMES_MOLHO, PONTOS_ALVO } from './provas.js';
import * as TX from './textos.js';
import { CORTES, INGREDIENTES, PREPAROS } from './dados.js';
import { malhaFerramenta } from './objetos.js';
import { definirAnisotropia } from './materiais.js';
import { Corte3D } from './corte3d.js';
import { Mexer3D } from './mexer3d.js';
import * as K from './culinaria.js';

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const RAPIDO = Q.has('rapido');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (l) => l[Math.floor(Math.random() * l.length)];
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const pref = (k, v) => { try { const x = localStorage.getItem('pp4d_' + k); return x ?? v; } catch (e) { return v; } };
const salvarPref = (k, v) => { try { localStorage.setItem('pp4d_' + k, v); } catch (e) { /* sem armazenamento */ } };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

window.addEventListener('error', (e) => { $('erro').classList.remove('oculto'); $('erro-txt').textContent = e.message; });

const FRASES_CARREGANDO = ['Afiando as facas...', 'Clarificando a manteiga...', 'Ensinando o Jacuzzi a sorrir (falhou)...', 'Polindo o frango dourado...', 'Contando as pernas do troféu...', 'Calibrando o olfatômetro...'];

// ---------- Estado ----------
const estado = {
  fase: 'carregando', pausado: false, tempo: 0, relogio: 0, prova: null, ctx: {}, cesta: [], overlay: false,
  dialogo: null, corte: null, nome: 'Chef', podeAdiantar: false, avisosDados: new Set(), aromaExtra: null, melhorNota: 0, rodadas: 0,
};
const esperas = [];
const esperar = (s) => new Promise((r) => esperas.push({ t: estado.tempo + s, r }));

let renderer, cena, camera, composer, bloom, estudio, cozinha, jogador, efeitos, som, voz, corte3d, mexer3d;
const personagens = {};
const npcs = [];
let participantes = [];
const alvosExtras = [];
let mira = null;

async function passo(p, txt) {
  $('barra-progresso').style.width = p + '%';
  $('frase-carregando').textContent = txt || pick(FRASES_CARREGANDO);
  await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
}

// ---------- Montagem ----------
async function iniciar() {
  const qual = pref('qualidade', 'media');
  $('qualidade').value = qual;
  $('voz').checked = pref('voz', '1') === '1';
  $('som').checked = pref('som', '1') === '1';
  await passo(5, 'Ligando o fogão...');
  const canvas = $('tela3d');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, qual === 'alta' ? 2 : qual === 'media' ? 1.25 : 1));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = qual !== 'baixa';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  definirAnisotropia(Math.min(8, renderer.capabilities.getMaxAnisotropy()));

  cena = new THREE.Scene();
  cena.background = new THREE.Color(0x020818);
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.4;
  camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.03, 120);
  cena.add(camera);

  await passo(20, 'Montando o estúdio azul e dourado...');
  estudio = construirEstudio(cena, qual);
  await passo(45, 'Chamando os participantes...');
  let carregados = 0;
  await carregarModelos([...TX.PARTICIPANTES.map((p) => p.id), 'jacuzzi', 'risotto', 'fumaca', 'patrao'], () => { carregados++; $('barra-progresso').style.width = (45 + carregados) + '%'; });
  await passo(65, 'Vestindo os aventais...');
  efeitos = new Efeitos(cena);
  som = new Som(); voz = new Voz();
  criarElenco();
  await passo(75, 'Organizando a sua bancada...');
  const bj = estudio.bancadas[BANCADA_JOGADOR];
  cozinha = new Cozinha(bj, cena, efeitos, som, msg);
  jogador = new Jogador(camera, canvas, estudio.colisores);
  cozinha.maoGrupo = jogador.mao;
  jogador.aoMudarTrava = aoMudarTrava;

  composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { type: THREE.HalfFloatType, samples: qual === 'baixa' ? 0 : 4 }));
  composer.addPass(new RenderPass(cena, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.2, 0.5, 0.96);
  if (qual !== 'baixa') composer.addPass(bloom);
  composer.addPass(new OutputPass());
  corte3d = new Corte3D(renderer, camera, cena, som);
  mexer3d = new Mexer3D(renderer, camera, cena);
  window.addEventListener('resize', ajustarTamanho);
  await passo(90, 'Compilando os sabores...');
  renderer.compile(cena, camera);
  await passo(100, 'Pronto. Que comece o sofrimento.');
  configurarEntrada();
  $('carregando').classList.add('oculto');
  $('menu').classList.remove('oculto');
  estado.fase = 'menu';
  if (Q.has('auto')) comecar();
  renderer.setAnimationLoop(laco);
}

function criarElenco() {
  const idxs = [...Array(16).keys()].filter((i) => i !== BANCADA_JOGADOR);
  participantes = [{ id: 'voce', nome: 'Você', jogador: true, vivo: true, bancada: BANCADA_JOGADOR, notas: [] }];
  TX.PARTICIPANTES.forEach((p, i) => {
    const h = new Humano({ ...p.corpo, id: p.id });
    const npc = { ...p, vivo: true, bancada: idxs[i], humano: h, notas: [], modo: 'bancada', tA: rnd(0, 3) };
    const b = posBancada(npc.bancada);
    h.raiz.position.set(b.x, 0, b.z + 1.1);
    h.raiz.rotation.y = Math.PI; h.rumo = Math.PI;
    const faca = malhaFerramenta(Math.random() > 0.5 ? 'faca' : 'colher'); faca.rotation.set(0, Math.PI / 2, Math.PI / 2);
    h.segurar(faca);
    h.raiz.userData.ent = { tipo: 'humano', p: npc };
    cena.add(h.raiz); alvosExtras.push(h.raiz);
    npcs.push(npc); participantes.push(npc);
  });
  const posJ = { jacuzzi: [-2.2, -12.4], risotto: [0, -12.4], fumaca: [2.2, -12.4], patrao: [-6, -10.95] };
  for (const id of ['jacuzzi', 'risotto', 'fumaca', 'patrao']) {
    const h = new Humano({ ...TX.JURADOS_INFO[id].corpo, id });
    h.raiz.position.set(posJ[id][0], 0, posJ[id][1]);
    h.rumo = 0;
    h.estado = id === 'jacuzzi' ? 'bracos_cruzados' : 'parado';
    h.base = h.estado; h.casa = posJ[id];
    h.raiz.userData.ent = { tipo: 'humano', jurado: id };
    cena.add(h.raiz); alvosExtras.push(h.raiz);
    personagens[id] = h;
  }
}

// ---------- Mensagens e diálogo ----------
function msg(texto, tipo = '') {
  if (!texto) return;
  const d = document.createElement('div');
  d.className = 'msg ' + tipo; d.textContent = texto;
  const log = $('log');
  log.appendChild(d);
  while (log.children.length > 5) log.removeChild(log.firstChild);
  setTimeout(() => d.remove(), 6500);
}
let avisoT = null;
function aviso(texto, seg = 2.6) {
  const a = $('aviso'); a.textContent = texto; a.classList.add('mostra');
  clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('mostra'), seg * 1000);
}
const NOMES = { patrao: TX.APRESENTADORA, jacuzzi: 'Érick Jacuzzi', risotto: 'Helena Risotto', fumaca: 'Henrique Fumaça' };

function dialogo(quem, texto) {
  return new Promise((res) => {
    estado.dialogo = { quem, texto, mostrado: 0, res };
    $('dialogo').classList.remove('oculto');
    $('dlg-nome').textContent = NOMES[quem] || quem;
    $('dlg-texto').textContent = '';
    voz.falar(texto, quem);
    const h = personagens[quem];
    if (h) { h.estado = 'falando'; }
  });
}
function avancarDialogo() {
  const d = estado.dialogo;
  if (!d) return;
  if (d.mostrado < d.texto.length) { d.mostrado = d.texto.length; $('dlg-texto').textContent = d.texto; return; }
  estado.dialogo = null;
  $('dialogo').classList.add('oculto');
  const h = personagens[d.quem]; if (h) h.estado = h.base || 'parado';
  voz.parar();
  d.res();
}
async function falas(lista, n = '') { for (const [q, t] of lista) await dialogo(q, TX.preencher(t, n)); }

// ---------- Sobreposições ----------
let overlayResolve = null;
function mostrarOverlay(id, html) {
  estado.overlay = true;
  jogador.soltar();
  const el = $(id);
  if (html !== undefined) (el.querySelector('.caixa-menu') || el).innerHTML = html;
  el.classList.remove('oculto');
  return new Promise((res) => {
    overlayResolve = () => { overlayResolve = null; res(); };
    el.querySelectorAll('[data-seguir]').forEach((b) => b.addEventListener('click', () => overlayResolve && overlayResolve(), { once: true }));
  });
}
function fecharOverlay(id) { $(id).classList.add('oculto'); estado.overlay = false; jogador.travar(); }

function aoMudarTrava(travado) {
  if (!travado && !estado.overlay && ['anuncio', 'mercado', 'cozinha', 'maos', 'julgamento', 'eliminacao'].includes(estado.fase)) {
    if (estado.corte?.fase === 'close' || mexer3d.ativo) return;
    if (estado.corte) fecharCorte();
    estado.pausado = true; voz.parar();
    $('pausa').classList.remove('oculto');
  }
}

// ---------- Entrada ----------
function jogando() { return !estado.pausado && !estado.overlay && jogador.travado; }

function configurarEntrada() {
  $('btn-jogar').addEventListener('click', () => comecar(false));
  $('btn-continuar-jogo').addEventListener('click', () => comecar(true));
  mostrarContinuar();
  $('btn-como').addEventListener('click', () => { $('menu').classList.add('oculto'); $('como').classList.remove('oculto'); });
  $('btn-voltar').addEventListener('click', () => { $('como').classList.add('oculto'); (estado.fase === 'menu' ? $('menu') : $('pausa')).classList.remove('oculto'); });
  $('btn-continuar').addEventListener('click', () => { $('pausa').classList.add('oculto'); estado.pausado = false; jogador.travar(); });
  $('btn-ajuda').addEventListener('click', () => { $('pausa').classList.add('oculto'); $('como').classList.remove('oculto'); });
  $('qualidade').addEventListener('change', (e) => { salvarPref('qualidade', e.target.value); location.reload(); });
  $('voz').addEventListener('change', (e) => { voz.ligada = e.target.checked; salvarPref('voz', e.target.checked ? '1' : '0'); });
  $('som').addEventListener('change', (e) => { som.ligado = e.target.checked; salvarPref('som', e.target.checked ? '1' : '0'); });

  window.addEventListener('keydown', (e) => {
    if (estado.overlay && overlayResolve && (e.code === 'Enter' || e.code === 'NumpadEnter')) { overlayResolve(); return; }
    if (estado.corte?.fase === 'close') { if (e.code === 'Escape') fecharCorte(); return; }
    if (mexer3d.ativo) { teclaMexer(e); return; }
    if (estado.dialogo && jogador.travado) { if (['Enter', 'Space', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); avancarDialogo(); } return; }
    if (!jogando()) return;
    if (estado.corte) { teclaCorte(e); return; }
    if (e.code === 'Space') e.preventDefault();
    if (e.repeat) return;
    const ent = mira?.ent;
    switch (e.code) {
      case 'KeyE': {
        const para = podeCozinhar() && cozinha.podeVerter(ent);
        if (para) { estado.verter = { para, ent, ponto: mira?.ponto, t: 0 }; break; }
        acaoE(); break;
      }
      case 'KeyR': if (podeCozinhar()) abrirMexer(ent); break;
      case 'KeyF': if (podeCozinhar()) cozinha.acaoF(ent); break;
      case 'KeyT': if (podeCozinhar()) cozinha.provar(ent); break;
      case 'KeyG': if (podeCozinhar()) cozinha.tirarUm(cozinha.recDe(ent)); break;
      case 'KeyZ': ajustar(-1); break;
      case 'KeyX': ajustar(1); break;
      case 'Space': if (podeCozinhar()) abrirCorte(); break;
      case 'Enter': case 'NumpadEnter':
        if (estado.fase === 'mercado') { estado.relogio = 0; msg('Compras encerradas. Correndo pra bancada!'); }
        else if (estado.fase === 'cozinha' && estado.podeAdiantar) { estado.relogio = Math.min(estado.relogio, 3); estado.podeAdiantar = false; }
        break;
      case 'Backspace': if (estado.fase === 'mercado' && estado.cesta.length) { const id = estado.cesta.pop(); msg(`Devolveu ${INGREDIENTES[id].nome.toLowerCase()} pra prateleira.`); } break;
      case 'KeyM': voz.ligada = !voz.ligada; $('voz').checked = voz.ligada; msg(voz.ligada ? 'Vozes ligadas.' : 'Vozes desligadas. Paz.'); break;
      default: break;
    }
  });
  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !jogador?.travado) return;
    if (estado.dialogo) { avancarDialogo(); return; }
    if (!jogando()) return;
    if (estado.corte?.fase === 'jogo') { golpeCorte(); return; }
    if (estado.corte) return;
    acaoE();
  });
  window.addEventListener('wheel', (e) => {
    if (mexer3d.ativo) { cozinha.ajustar(mexer3d.rec, e.deltaY < 0 ? 1 : -1); return; }
    if (jogando() && !estado.corte) ajustar(e.deltaY < 0 ? 1 : -1);
  }, { passive: true });
  window.addEventListener('keyup', (e) => {
    if (e.code !== 'KeyE' || !estado.verter) return;
    const v = estado.verter; estado.verter = null; cozinha.pararFilete();
    if (v.t < 0.3) cozinha.interagir(v.ent, v.ponto, estado.fase);
    else msg('Despejou aos poucos, como manda a técnica.', 'bom');
  });
}

const podeCozinhar = () => estado.fase === 'cozinha' || (estado.fase === 'maos' && false);

function ajustar(d) {
  if (!podeCozinhar()) return;
  const ent = mira?.ent;
  const alvo = ent?.tipo === 'recipiente' && ent !== cozinha.frit && ent.onde?.tipo !== 'boca' ? null : ent;
  cozinha.ajustar(alvo, d);
}

function acaoE() {
  const ent = mira?.ent;
  if (ent?.tipo === 'produto') return pegarProduto(ent.id);
  if (ent?.tipo === 'humano') return conversar(ent);
  if (ent?.tipo === 'camara') return msg(pick(['A câmara fria está trancada. Quem chora lá dentro é a produção.', 'Lá dentro só tem gelo e lágrimas de temporadas passadas.', 'Trancada. A chave está com o Jacuzzi, e ele não divide.']));
  if (ent?.tipo === 'trofeu') return msg(pick(['O Frango Dourado de Três Pernas te encara. Ele sabe que você quer.', 'Não toque. A terceira perna é amaldiçoada.', 'É mais pesado do que parece e mais feio do que a foto.']));
  if (estado.fase === 'mercado') return msg('Agora é hora de mercado, não de cozinhar. Corre pras prateleiras!');
  if (!podeCozinhar()) {
    if (ent?.tipo === 'passe' || ent) msg('Espere a prova começar. A apresentadora está trabalhando.');
    return;
  }
  cozinha.interagir(ent, mira?.ponto, estado.fase);
}

function pegarProduto(id) {
  const d = INGREDIENTES[id];
  if (estado.fase !== 'mercado') return msg('O mercado está fechado. Nem adianta fazer biquinho pro ' + d.nome.toLowerCase() + '.');
  if (estado.cesta.length >= 15) return msg('Cesta cheia (15 itens). A cesta não é sua bolsa de grife.', 'ruim');
  estado.cesta.push(id);
  som.bip(660, 0.06, 'sine', 0.15);
  msg('Na cesta: ' + d.nome + (d.preco > 100 ? '. Ostentação.' : '.'));
}

function conversar(ent) {
  if (ent.jurado) {
    const l = { jacuzzi: ['Não me olhe assim. Vai cozinhar.', 'Eu não tenho tempo pra conversa. Eu tenho fome e desconfiança.'], risotto: ['Respira. A cozinha sente quando a gente está nervoso.', 'Não. Eu não vou fazer risoto pra você.'], fumaca: ['E aí, parceiro! Foco, hein. Foco e fogo.', 'Tá me olhando por quê? Tá queimando alguma coisa?'], patrao: ['Por favor, siga as instruções da produção. E do bom senso.', 'Sorria. A câmera 2 está em você.'] };
    return msg(`${NOMES[ent.jurado]}: ${pick(l[ent.jurado])}`, 'npc');
  }
  msg(`${ent.p.nome}: ${pick(TX.NPC_FALAS)}`, 'npc');
}

// ---------- Mexer em close ----------
function abrirMexer(ent) {
  const rec = cozinha.recDe(ent) || (cozinha.mao?.tipo === 'recipiente' ? cozinha.mao : null);
  if (!rec || !rec.obj) return msg('Mire numa panela, frigideira ou bowl pra mexer.');
  if (!rec.conteudo.length) return msg('Mexer panela vazia é só exercício de ombro.');
  if (rec === cozinha.mao) return msg('Ponha a panela na bancada ou no fogo pra mexer direito.');
  const H = cozinha.mao;
  const ferr = H?.tipo === 'ferramenta' ? H.id : null;
  if (!ferr) msg('Mexendo sem colher nem fouet. O Jacuzzi está anotando.');
  document.body.classList.add('modo-mexer');
  $('corte').classList.remove('oculto'); $('corte-menu').classList.add('oculto'); $('corte-jogo').classList.remove('oculto');
  document.querySelector('#corte .corte-barra').style.display = '';
  $('corte-info').textContent = 'Faça círculos com o mouse. Roda: fogo. F: virar ou flambar. R ou Esc: voltar.';
  const rapido = rec.conteudo.some((c) => ['gema', 'ovo', 'holandesa', 'maionese', 'creme_anglaise', 'beurre_blanc', 'ovos_batidos'].includes(c.id));
  estado.faixaMexer = rapido ? [1.1, 2.6] : [0.4, 1.6];
  mexer3d.iniciar(rec, rec.obj, ferr === 'pinca' ? 'colher' : ferr, cozinha.forcaMexer(), (forca, dt) => K.mexer(rec, forca, dt), () => {
    document.body.classList.remove('modo-mexer');
    $('corte').classList.add('oculto');
    jogador.travar();
  });
}
function teclaMexer(e) {
  if (e.code === 'KeyR' || e.code === 'Escape') { mexer3d.sair(); return; }
  if (e.code === 'KeyF') cozinha.acaoF(mexer3d.rec);
  if (e.code === 'KeyT') cozinha.provar(mexer3d.rec);
  if (e.code === 'KeyZ' || e.code === 'KeyX') cozinha.ajustar(mexer3d.rec, e.code === 'KeyX' ? 1 : -1);
}
function atualizarPainelMexer() {
  const r = mexer3d.rec, rps = mexer3d.rps, [a, b] = estado.faixaMexer;
  const fogo = r.onde?.tipo === 'boca' ? ' · fogo ' + r.onde.ent.nivel + '/10' : '';
  $('corte-tit').textContent = 'Mexendo ' + r.nome.toLowerCase() + ' · ' + Math.round(r.temp) + '°C' + fogo + ' · ' + rps.toFixed(1) + ' voltas/s';
  const z = $('corte-zona'); z.style.left = (a / 3 * 100) + '%'; z.style.width = ((b - a) / 3 * 100) + '%';
  $('corte-agulha').style.left = Math.min(100, rps / 3 * 100) + '%';
  const inf = $('info'); inf.innerHTML = cozinha.descrever(r).info; inf.style.display = 'block';
}

// ---------- Corte ----------
function abrirCorte() {
  const r = cozinha.cortesDe(mira?.ent);
  if (!r) return msg('Mire na tábua com um ingrediente em cima.');
  if (!r.cortes.length) return msg(r.comida.corte ? 'Já está cortado. Cortar de novo vira purê de tábua.' : 'Esse ingrediente não tem corte clássico. Nem tudo na vida precisa ser cortado.');
  estado.corte = { fase: 'menu', comida: r.comida, cortes: r.cortes };
  $('corte').classList.remove('oculto'); $('corte-jogo').classList.add('oculto'); $('corte-menu').classList.remove('oculto');
  $('corte-menu').innerHTML = `<div style="margin-bottom:6px;font-weight:700">Cortar ${esc(r.comida.nome.toLowerCase())}:</div>` + r.cortes.map((c, i) => `<div class="op"><b>${i + 1}</b>${CORTES[c].nome} <small>· ${CORTES[c].desc}</small></div>`).join('') + '<div class="op"><small>Esc cancela</small></div>';
}
function teclaCorte(e) {
  const c = estado.corte;
  if (e.code === 'Escape' || e.code === 'KeyQ') return fecharCorte();
  if (c.fase === 'menu') {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= c.cortes.length) iniciarCorte(c.cortes[n - 1]);
  } else if (e.code === 'Space' && !e.repeat) { e.preventDefault(); golpeCorte(); }
}
function iniciarCorte(corte) {
  const c = estado.corte;
  const d = CORTES[corte];
  const n = Math.max(3, Math.min(9, d.golpes));
  Object.assign(c, { fase: 'close', corte, d, n });
  $('corte-menu').classList.add('oculto'); $('corte-jogo').classList.remove('oculto');
  document.querySelector('#corte .corte-barra').style.display = 'none';
  $('corte-info').textContent = 'Clique e arraste de cima pra baixo sobre a guia clara. Esc cancela.';
  document.body.classList.add('modo-close');
  corte3d.iniciar(c.comida.obj, n, d.nome, '', (q) => {
    document.body.classList.remove('modo-close');
    if (q !== null && q !== undefined) cozinha.aplicarCorte(c.comida, corte, Math.min(1, q * 1.05));
    else msg('Corte cancelado. A faca volta pro bloco, a cenoura respira aliviada.');
    fecharCorte();
    jogador.travar();
  }, (t) => msg(t));
}
function fecharCorte() {
  const c = estado.corte;
  estado.corte = null;
  $('corte').classList.add('oculto');
  if (c?.fase === 'close' && corte3d.ativo) corte3d.encerrar(null);
  document.body.classList.remove('modo-close');
}

// ---------- Laço principal ----------
let tamAtual = '';
function ajustarTamanho() {
  const w = window.innerWidth || document.documentElement.clientWidth, h = window.innerHeight || document.documentElement.clientHeight;
  if (!w || !h || tamAtual === w + 'x' + h) return;
  tamAtual = w + 'x' + h;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setSize(w, h); composer.setSize(w, h);
}
let ultimo = performance.now();
let tMenu = 0;
let segAnterior = -1;
function laco() {
  const agora = performance.now();
  const dt = Math.min(0.05, (agora - ultimo) / 1000);
  ultimo = agora;
  ajustarTamanho();
  jogador.braco.visible = false;
  jogador.mao.visible = estado.fase !== 'menu' && estado.fase !== 'carregando';
  if (estado.fase === 'menu' || estado.fase === 'carregando') {
    tMenu += dt * 0.06;
    camera.position.set(Math.sin(tMenu) * 15, 6.5, 6 + Math.cos(tMenu) * 9);
    camera.lookAt(0, 1, -2);
  } else if (!estado.pausado) atualizar(dt);
  for (const h of Object.values(personagens)) h.update(dt);
  for (const n of npcs) if (n.modo !== 'fora') n.humano.update(dt);
  efeitos.update(dt);
  composer.render();
}

function atualizar(dt) {
  dt *= estado.escala || 1;
  estado.tempo += dt;
  for (let i = esperas.length - 1; i >= 0; i--) if (estado.tempo >= esperas[i].t) { esperas[i].r(); esperas.splice(i, 1); }
  const mover = jogando() && !estado.corte;
  if (mexer3d.update(dt)) atualizarPainelMexer();
  else if (corte3d.update(dt)) { if (estado.corte?.fase === 'close') $('corte-tit').textContent = `${estado.corte.d.nome}: corte ${Math.min(corte3d.feitos + 1, estado.corte.n)} de ${estado.corte.n}`; } else jogador.update(dt, mover);
  mira = jogando() ? jogador.mirar([...cozinha.alvos, ...estudio.interativos, ...alvosExtras]) : null;
  const cozinhando = estado.fase === 'cozinha' || estado.fase === 'maos';
  jogador.mexendo = false;
  if (estado.verter) {
    estado.verter.t += dt;
    if (estado.fase !== 'cozinha' || !cozinha.mao) { estado.verter = null; cozinha.pararFilete(); }
    else if (estado.verter.t >= 0.3 && cozinha.verter(estado.verter.para, dt) <= 0) { estado.verter = null; cozinha.pararFilete(); msg('Não sobrou líquido pra despejar.'); }
  }
  if (cozinhando) cozinha.update(dt, estado.tempo, camera.position);
  if (estado.dialogo) {
    const d = estado.dialogo;
    if (d.mostrado < d.texto.length) { d.mostrado = Math.min(d.texto.length, d.mostrado + dt * 60); $('dlg-texto').textContent = d.texto.slice(0, Math.floor(d.mostrado)); }
  }
  if (estado.corte?.fase === 'jogo') { estado.corte.t += dt; $('corte-agulha').style.left = ((0.5 + 0.5 * Math.sin(estado.corte.t * estado.corte.d.vel * 2.4)) * 100) + '%'; }
  // Relógio
  if ((estado.fase === 'mercado' || estado.fase === 'cozinha') && !estado.dialogo) {
    const antes = estado.relogio;
    estado.relogio -= dt;
    if (estado.fase === 'cozinha') {
      for (const s of [300, 120, 60, 30]) if (antes > s && estado.relogio <= s && !estado.avisosDados.has(s)) { estado.avisosDados.add(s); msg(TX.APRESENTADORA + ': ' + TX.AVISOS_TEMPO[s]); voz.falar(TX.AVISOS_TEMPO[s], 'patrao'); }
      if (estado.relogio <= 10 && Math.ceil(antes) !== Math.ceil(estado.relogio) && estado.relogio > 0) som.tique(true);
      cozinhaNpcs(dt);
    }
    if (estado.relogio <= 0 && estado.fimRelogio) { const f = estado.fimRelogio; estado.fimRelogio = null; estado.relogio = 0; f(); }
  }
  atualizarHud();
}

// ---------- HUD ----------
const FASES = { anuncio: 'Apresentação', mercado: 'Mercado', cozinha: 'Na cozinha', maos: 'Mãos pra cima', julgamento: 'Julgamento', eliminacao: 'Eliminação', final: 'Grande final' };
function atualizarHud() {
  const p = estado.prova;
  $('hud-titulo').textContent = p ? p.titulo : TX.NOME_JOGO;
  const vivos = participantes.filter((x) => x.vivo).length;
  $('hud-fase').textContent = `${FASES[estado.fase] || ''} · ${vivos} na disputa` + (estado.ctx.alvoMolho && p?.id === 'molho' ? ` · molho ${NOMES_MOLHO[estado.ctx.alvoMolho]}` : '') + (estado.ctx.alvoPonto && p?.id === 'steak' ? ` · ponto ${PONTOS_ALVO[estado.ctx.alvoPonto].nome}` : '');
  const seg = Math.ceil(estado.relogio);
  const rel = $('hud-relogio');
  rel.textContent = fmt(estado.relogio);
  rel.classList.toggle('alerta', (estado.fase === 'cozinha' && estado.relogio < 60) || (estado.fase === 'mercado' && estado.relogio < 30));
  if (seg !== segAnterior) { segAnterior = seg; estudio.desenharRelogio(fmt(estado.relogio), estado.relogio < 60 && estado.fase === 'cozinha'); }
  // Alvo
  let nome = '', dicas = '', info = '';
  const ent = mira?.ent;
  if (ent?.tipo === 'produto') { const d = INGREDIENTES[ent.id]; nome = d.nome; dicas = estado.fase === 'mercado' ? 'E: pôr na cesta' : 'Mercado fechado'; }
  else if (ent?.tipo === 'humano') { nome = ent.jurado ? NOMES[ent.jurado] : `${ent.p.nome}, ${ent.p.idade}`; dicas = ent.jurado ? (JURADOS.find((j) => j.id === ent.jurado)?.papel || 'apresentadora com padrão de qualidade') : ent.p.bio; }
  else if (ent?.tipo === 'camara') nome = 'Câmara fria';
  else if (ent?.tipo === 'trofeu') { nome = TX.TROFEU; dicas = 'O prêmio. Não pergunte.'; }
  else if (ent) ({ nome, dicas, info } = cozinha.descrever(ent));
  $('alvo-nome').textContent = nome; $('alvo-dicas').textContent = dicas;
  $('mira').classList.toggle('ativa', !!nome);
  const inf = $('info'); if (info) { inf.innerHTML = info; inf.style.display = 'block'; } else inf.style.display = 'none';
  $('mao').innerHTML = cozinha.descreverMao();
  // Olfatômetro
  let a = (estado.fase === 'cozinha' || estado.fase === 'maos') ? cozinha.aroma() : null;
  if (estado.aromaExtra && estado.tempo < estado.aromaExtra.ate && (!a || estado.aromaExtra.nivel > a.nivel)) a = estado.aromaExtra;
  if (estado.fase === 'mercado') a = { txt: 'Hortifrúti, ansiedade e desinfetante', nivel: 0.3, tipo: 'neutro' };
  $('olf-txt').textContent = a ? a.txt : 'Cheiro de estúdio novo e ar-condicionado';
  const nv = $('olf-nivel'); nv.style.width = Math.round((a ? a.nivel : 0.08) * 100) + '%';
  nv.style.background = !a ? '#6a7ab0' : a.tipo === 'ruim' ? '#ff5a4a' : a.tipo === 'bom' ? 'linear-gradient(90deg,#6ae08a,#f6c94a)' : '#7aa8ff';
  // Cesta
  if (estado.fase === 'mercado') {
    $('cesta').classList.remove('oculto');
    const cont = {}; for (const id of estado.cesta) cont[id] = (cont[id] || 0) + 1;
    $('cesta').innerHTML = `<h4>CESTA ${estado.cesta.length}/15</h4>` + (Object.keys(cont).map((id) => `${cont[id]}× ${esc(INGREDIENTES[id].nome)}`).join('<br>') || '<i>vazia, como o seu plano</i>') + '<br><small style="color:#a8b4e0">Enter encerra · Backspace devolve</small>';
  } else $('cesta').classList.add('oculto');
}

// ---------- NPCs ----------
const ACOES_NPC = [{ dx: -0.9, anim: 'mexendo' }, { dx: 0, anim: 'picando' }, { dx: 0, anim: 'picando' }, { dx: 1.2, anim: 'mexendo' }, { dx: -0.6, anim: 'provando' }, { dx: 0.5, anim: 'parado' }];
let proxEvento = 20, proxVisita = 60;
function cozinhaNpcs(dt) {
  for (const n of npcs) {
    if (!n.vivo || n.modo !== 'bancada') continue;
    const h = n.humano, b = posBancada(n.bancada);
    n.tA -= dt;
    if (n.tA <= 0 && !h.caminho.length) {
      const op = pick(ACOES_NPC);
      n.tA = rnd(4, 9);
      h.estado = 'parado';
      h.irPara([[b.x + op.dx, b.z + 1.1]], 1.2).then(() => { h.estado = op.anim; h.rumo = Math.PI; });
    }
  }
  proxEvento -= dt;
  if (proxEvento <= 0) {
    proxEvento = rnd(16, 30);
    const vivos = npcs.filter((n) => n.vivo);
    if (vivos.length) {
      const n = pick(vivos);
      const t = TX.preencher(pick(TX.NPC_EVENTOS), n.nome);
      msg(t, 'npc');
      const b = posBancada(n.bancada);
      if (/fogo|flamb/.test(t)) { estado.aromaExtra = { txt: `Fumaça vindo da bancada de ${n.nome}`, nivel: 0.9, tipo: 'ruim', ate: estado.tempo + 6 }; n.fogoAte = estado.tempo + 3; n.fogoPos = new THREE.Vector3(b.x - 0.9, 0.95, b.z); }
      if (/chorando/.test(t)) { n.humano.estado = 'chorando'; n.tA = 7; }
    }
  }
  for (const n of npcs) if (n.fogoAte && estado.tempo < n.fogoAte) efeitos.chama(n.fogoPos, 1.6);
  proxVisita -= dt;
  if (proxVisita <= 0 && estado.relogio > 40) { proxVisita = rnd(75, 110); visitaJurado(); }
}

const VISITAS = {
  jacuzzi: ['Você provou isso? Prova! Cozinheiro que não prova é turista.', 'Cadê o sal? Eu não vi você pôr sal. Eu vejo tudo.', 'Por que essa bancada está assim? Isso é uma bancada ou uma feira?'],
  risotto: ['Respira. Organiza a bancada. Mise en place é paz.', 'Que cheiro bom. Ou ruim. Ainda não decidi.', 'Qual é a sua ideia de prato? Me conta com calma.'],
  fumaca: ['E aí, parceiro, qual é o plano? Tem plano?', 'Fogo alto não é pressa, é desespero.', 'Tô de olho nesse ponto, hein.'],
};
async function visitaJurado() {
  const id = pick(['jacuzzi', 'risotto', 'fumaca']);
  const h = personagens[id];
  if (h.ocupado) return;
  h.ocupado = true;
  const b = posBancada(BANCADA_JOGADOR);
  const lado = h.casa[0] < 0 ? -3.9 : 3.9;
  await h.irPara([[lado, -12.4], [lado, -9.6], [b.x + rnd(-0.8, 0.8), -6.8]], 1.5);
  h.olharPara(b.x, b.z);
  let fala = pick(VISITAS[id]);
  const recs = cozinha.recipientes;
  if (recs.some((r) => r.conteudo.some((c) => c.def.queimado))) fala = pick(TX.FALAS.queimado[id]);
  else if (!cozinha.p.bocas.some((x) => x.nivel > 0 && x.rec?.conteudo.length) && !cozinha.p.forno.temp && !cozinha.frit.ajuste) fala = id === 'fumaca' ? 'Mano, nada no fogo até agora? O relógio não para pra você pensar.' : id === 'jacuzzi' ? 'Nada no fogo! Você está esperando o quê? Inspiração divina?' : 'Ainda nada no fogo... tudo bem ter calma. Mas não tanta.';
  if (estado.fase === 'cozinha') { h.estado = 'falando'; msg(`${NOMES[id]}: ${fala}`, 'npc'); voz.falar(fala, id); }
  await esperar(5);
  h.estado = h.base || 'parado';
  await h.irPara([[lado, -9.6], [lado, -12.4], h.casa], 1.5);
  h.rumo = 0; h.ocupado = false;
}

function caminhoMercado(n) {
  const b = posBancada(n.bancada), cz = b.z + 1.1;
  const corr = pick([17.5, 20.6, 24.4]), x = rnd(-7.5, 7.5), s = x < 0 ? -1 : 1;
  const ida = [[b.x, cz], [rnd(-0.7, 0.7), cz], [rnd(-0.9, 0.9), 14.2], [rnd(-1.5, 1.5), 16.3]];
  if (corr === 17.5) ida.push([x, 17.5]); else ida.push([s * 9.6, 17.4], [s * 9.6, corr], [x, corr]);
  return ida;
}
async function rotinaMercado(n) {
  const h = n.humano;
  await esperar(rnd(0, 1.2));
  if (estado.fase !== 'mercado') return;
  const ida = caminhoMercado(n);
  h.estado = 'parado';
  await h.irPara(ida, rnd(2.8, 3.6));
  if (estado.fase !== 'mercado') return;
  h.estado = 'provando'; h.rumo = ida[ida.length - 1][1] > 19 ? (Math.random() > 0.5 ? 0 : Math.PI) : 0;
  await esperar(rnd(3, 8));
  if (estado.fase !== 'mercado') return;
  h.estado = 'parado';
  await h.irPara([...ida].reverse(), rnd(2.6, 3.4));
  h.rumo = Math.PI;
}
function npcsParaBancada() {
  for (const n of npcs) {
    if (!n.vivo) continue;
    const b = posBancada(n.bancada), h = n.humano;
    h.caminho = []; h.resolverCaminho = null;
    h.raiz.position.set(b.x, 0, b.z + 1.1); h.raiz.rotation.y = Math.PI; h.rumo = Math.PI; h.estado = 'parado'; n.tA = rnd(0, 3);
  }
}

// ---------- Fluxo do programa ----------
// ---------- Progresso salvo ----------
const CHAVE_SAVE = 'pp4d_jogo';
function lerSave() { try { const j = JSON.parse(localStorage.getItem(CHAVE_SAVE) || 'null'); return j && j.versao === 1 ? j : null; } catch (e) { return null; } }
function gravarSave(proxima) {
  const dado = { versao: 1, nome: estado.nome, proxima, fora: npcs.filter((n) => !n.vivo).map((n) => n.id), notas: Object.fromEntries(participantes.map((p) => [p.id, p.notas])), melhorNota: estado.melhorNota, quando: Date.now() };
  try { localStorage.setItem(CHAVE_SAVE, JSON.stringify(dado)); msg('Progresso salvo. Pode fechar a aba sem culpa.', 'bom'); } catch (e) { /* navegador sem armazenamento */ }
}
function apagarSave() { try { localStorage.removeItem(CHAVE_SAVE); } catch (e) { /* nada */ } }
function aplicarSave(sv) {
  estado.nome = sv.nome; estado.melhorNota = sv.melhorNota || 0;
  for (const p of participantes) if (sv.notas?.[p.id]) p.notas = sv.notas[p.id];
  for (const n of npcs) if (sv.fora.includes(n.id)) {
    n.vivo = false; n.modo = 'fora'; n.humano.raiz.visible = false;
    const i = alvosExtras.indexOf(n.humano.raiz); if (i >= 0) alvosExtras.splice(i, 1);
  }
}
function mostrarContinuar() {
  const sv = lerSave();
  const b = $('btn-continuar-jogo');
  if (!sv) { b.classList.add('oculto'); $('btn-jogar').textContent = 'Entrar na cozinha'; return; }
  b.classList.remove('oculto');
  b.textContent = 'Continuar: ' + ((PROVAS[sv.proxima]?.titulo || 'próxima prova').split(':')[0]) + ' (' + sv.nome + ')';
  $('btn-jogar').textContent = 'Nova temporada (apaga o progresso)';
}

async function comecar(continuar = false) {
  const sv = continuar === true ? lerSave() : null;
  if (!sv) apagarSave();
  estado.nome = sv ? sv.nome : (($('nome-jogador').value || '').trim() || 'Chef sem nome');
  if (sv) aplicarSave(sv);
  participantes[0].nome = estado.nome;
  voz.ligada = $('voz').checked; som.ligado = $('som').checked;
  som.iniciar();
  $('menu').classList.add('oculto'); $('hud').classList.remove('oculto');
  posicionarNaBancada();
  jogador.travar();
  estado.fase = 'anuncio';
  try { await programa(sv ? sv.proxima : null); } catch (e) { console.error(e); $('erro').classList.remove('oculto'); $('erro-txt').textContent = e.message; }
}

function posicionarNaBancada() {
  const b = posBancada(BANCADA_JOGADOR);
  jogador.posicionar(b.x, b.z + 1.05, 0);
}

async function cortina(f) {
  $('cortina').classList.add('fecha'); await new Promise((r) => setTimeout(r, 520));
  f(); await new Promise((r) => setTimeout(r, 150));
  $('cortina').classList.remove('fecha');
}

async function programa(inicio = null) {
  if (inicio === null && !Q.has('pular')) await falas(TX.ROTEIRO.abertura);
  if (inicio !== null) await dialogo('patrao', 'Que bom te ver de volta, ' + estado.nome + '. A cozinha não esqueceu de você. Os jurados também não, infelizmente.');
  for (let i = inicio ?? (Q.has('prova') ? +Q.get('prova') : 0); i < PROVAS.length; i++) {
    const prova = PROVAS[i];
    estado.prova = prova; estado.ctx = {}; estado.rodadas = i + 1;
    await anunciar(prova);
    await faseMercado(prova);
    await faseCozinha(prova);
    const r = await julgar(prova);
    if (prova.id === 'final') return final(r);
    const saiu = await eliminacao(prova, r);
    if (saiu) return fim(false, r);
    gravarSave(i + 1);
    await cortina(() => { cozinha.preparar(); posicionarNaBancada(); npcsParaBancada(); });
  }
}

async function anunciar(prova) {
  estado.fase = 'anuncio'; estado.relogio = 0;
  personagens.patrao.olharPara(camera.position.x, camera.position.z);
  if (prova.id === 'final') await falas(TX.ROTEIRO.final);
  await dialogo('patrao', `${prova.titulo}. ${prova.resumo}`);
  if (prova.id === 'molho') {
    estado.ctx.alvoMolho = pick(Object.keys(NOMES_MOLHO));
    som.tensao();
    await dialogo('patrao', `O sorteio da noite... Molho ${NOMES_MOLHO[estado.ctx.alvoMolho]}! Que Escoffier tenha piedade de vocês.`);
  }
  if (prova.id === 'steak') {
    estado.ctx.alvoPonto = pick(Object.keys(PONTOS_ALVO));
    await dialogo('fumaca', `E o ponto que eu quero é ${PONTOS_ALVO[estado.ctx.alvoPonto].nome}. Núcleo entre ${PONTOS_ALVO[estado.ctx.alvoPonto].min} e ${PONTOS_ALVO[estado.ctx.alvoPonto].max} graus. Quem errar, eu devolvo.`);
  }
  const js = ['jacuzzi', 'risotto', 'fumaca'].sort(() => Math.random() - 0.5);
  await dialogo(js[0], prova.dicas[0]);
  await dialogo(js[1], prova.dicas[1]);
  await falas(TX.ROTEIRO.mercado);
}

function esperarRelogio() { return new Promise((r) => { estado.fimRelogio = r; }); }

async function faseMercado(prova) {
  estado.fase = 'mercado';
  estado.cesta = [];
  estado.relogio = RAPIDO ? 30 : prova.tempoMercado;
  aviso('MERCADO! ' + fmt(estado.relogio));
  setTimeout(() => estado.fase === 'mercado' && aviso('Mire num produto e aperte E ou clique', 3.5), 2800);
  msg('Mire o ponto branco num caixote ou embalagem e aperte E (ou clique) pra pôr na cesta. Backspace devolve o último, Enter encerra as compras.', 'bom');
  som.sino();
  for (const n of npcs) if (n.vivo) { n.modo = 'mercado'; rotinaMercado(n); }
  setTimeout(() => estado.fase === 'mercado' && msg(TX.APRESENTADORA + ': ' + pick(TX.MERCADO_FRASES)), 40000);
  await esperarRelogio();
  estado.fase = 'transicao';
  aviso('ACABOU O MERCADO!');
  som.sino();
  await cortina(() => {
    posicionarNaBancada();
    npcsParaBancada();
    for (const n of npcs) n.modo = 'bancada';
    cozinha.receberCompras(estado.cesta);
  });
  if (!estado.cesta.length) msg('Você voltou do mercado sem nada. A despensa da bancada vai ter que dar conta.', 'ruim');
  else msg(`Suas compras estão no carrinho ao lado da bancada (${estado.cesta.length} itens).`, 'bom');
}

async function faseCozinha(prova) {
  estado.fase = 'anuncio';
  await falas(TX.ROTEIRO.cozinhaInicio);
  estado.fase = 'cozinha';
  estado.avisosDados = new Set();
  estado.podeAdiantar = false;
  estado.relogio = RAPIDO ? 150 : prova.tempoCozinha;
  proxEvento = 15; proxVisita = rnd(50, 70);
  const limite = prova.pratos || 1;
  cozinha.onEntregar = (prato) => {
    if (cozinha.entregues.length >= limite) { msg(limite > 1 ? `Você já entregou ${limite} pratos.` : 'Você já entregou. Não tem segunda chance, isso não é delivery.', 'ruim'); return false; }
    som.sino();
    const resta = limite - cozinha.entregues.length - 1;
    msg(resta > 0 ? `Prato entregue! Faltam ${resta}.` : 'Prato entregue! Os jurados já estão de olho.', 'bom');
    if (resta === 0) { estado.podeAdiantar = true; aviso('ENTREGUE! Enter adianta o relógio', 3); }
    return true;
  };
  aviso('VALENDO! ' + fmt(estado.relogio));
  som.sino();
  await esperarRelogio();
  estado.fase = 'maos';
  aviso('MÃOS PRA CIMA!', 3);
  som.sino(); voz.falar('Mãos pra cima!', 'patrao');
  for (const n of npcs) if (n.vivo) { n.humano.caminho = []; n.humano.estado = 'comemorando'; }
  if (!cozinha.entregues.length) {
    const pratos = cozinha.recipientes.filter((r) => r.rtipo === 'prato' && r.conteudo.length && r.onde?.tipo !== 'passe');
    if (pratos.length) { estado.ctx.semTempo = true; cozinha.entregues.push(...pratos.slice(0, limite)); msg('A produção recolheu o que estava no prato. Do jeito que estava.', 'ruim'); }
  }
  await esperar(2.5);
  for (const n of npcs) if (n.vivo) n.humano.estado = 'parado';
}

function falaJurado(jid, res, nota, usadas) {
  const tags = nota >= 6.5 ? [...res.elogios, ...res.problemas] : [...res.problemas, ...res.elogios];
  for (const t of tags) {
    if (usadas.has(t)) continue;
    if (t.startsWith('faltou:')) {
      usadas.add(t);
      const o = t.slice(7).toLowerCase();
      return { jacuzzi: `Cadê ${o}? A prova pedia! Você leu a prova ou só olhou as figuras?`, risotto: `Senti falta de ${o}. O prato ficou incompleto.`, fumaca: `Mano, faltou ${o}. Era pra ter.` }[jid];
    }
    const l = TX.FALAS[t]?.[jid];
    if (l) { usadas.add(t); return pick(l); }
  }
  return pick(TX.GENERICAS[nota >= 7.5 ? 'alta' : nota >= 5 ? 'media' : 'baixa'][jid]);
}

async function julgar(prova) {
  estado.fase = 'julgamento';
  await falas(TX.ROTEIRO.julgamento);
  const res = avaliar(prova, cozinha.entregues, estado.ctx);
  participantes[0].notas.push(res.total);
  estado.melhorNota = Math.max(estado.melhorNota, res.total);
  const resultados = [{ id: 'voce', nome: estado.nome, nota: res.total }];
  for (const n of npcs) if (n.vivo) { const s = simularNpc(n, prova); n.notas.push(s.nota); n.ultimo = s; resultados.push({ id: n.id, nome: n.nome, nota: s.nota, evento: s.evento }); }

  const comps = res.componentes.map((c) => `<div class="comp"><span>${esc(c.nome)}</span><span>${Math.round(c.nota * 100)}%</span></div>`).join('');
  const usadas = new Set();
  const cards = [];
  let html = `<h2>${esc(prova.titulo)}</h2><p class="sub">O prato de ${esc(estado.nome)} diante dos jurados</p>${comps}<div class="jurados" id="cards"></div><div class="total" id="total-nota"></div><button class="btn ouro" data-seguir>Ver o ranking (Enter)</button>`;
  const prom = mostrarOverlay('avaliacao', html);
  const cont = $('cards');
  for (const j of res.jurados) {
    const fala = falaJurado(j.id, res, j.nota, usadas);
    const d = document.createElement('div'); d.className = 'jurado';
    d.innerHTML = `<div class="nome">${esc(j.nome)}</div><div class="nota">${j.nota.toFixed(1)}</div><div class="fala">“${esc(fala)}”</div>`;
    cont.appendChild(d); cards.push(d);
    personagens[j.id].estado = 'falando';
    voz.falar(fala, j.id);
    await new Promise((r) => setTimeout(r, Math.min(6500, 1500 + fala.length * 55)));
    personagens[j.id].estado = personagens[j.id].base || 'parado';
  }
  $('total-nota').textContent = `${res.total} pontos`;
  if (res.total >= 80) som.aplauso();
  await prom;
  $('avaliacao').classList.add('oculto');

  // Ranking
  resultados.sort((a, b) => b.nota - a.nota);
  const saem = prova.id === 'final' ? [] : eliminar(resultados, prova.eliminar);
  const linhas = resultados.map((r, i) => {
    const n = npcs.find((x) => x.id === r.id);
    const prato = n ? pick(TX.PRATOS_NPC[prova.id]) : 'o seu prato';
    const ev = r.evento === 'desastre' ? ' (desastre ao vivo)' : r.evento === 'brilhou' ? ' (brilhou)' : '';
    return `<tr class="${r.id === 'voce' ? 'voce' : ''} ${saem.includes(r.id) ? 'fora' : ''}"><td>${i + 1}º</td><td>${esc(r.nome)}${ev}</td><td><small>${esc(prato)}</small></td><td class="n">${r.nota}</td></tr>`;
  }).join('');
  await mostrarOverlay('avaliacao', `<h2>Ranking da prova</h2><p class="sub">${prova.id === 'final' ? 'Quem levanta o frango?' : `Os ${prova.eliminar} últimos estão na berlinda.`}</p><table class="rank">${linhas}</table><button class="btn ouro" data-seguir>Continuar (Enter)</button>`);
  fecharOverlay('avaliacao');
  return { res, resultados, saem };
}

async function eliminacao(prova, r) {
  estado.fase = 'eliminacao';
  await dialogo('patrao', 'Chegou o momento mais difícil da noite. Pelo menos pra vocês. Pra mim é só mais uma quarta-feira.');
  const saiNpc = r.saem.filter((id) => id !== 'voce');
  for (const id of saiNpc) {
    const n = npcs.find((x) => x.id === id);
    await dialogo('patrao', TX.preencher(pick(TX.ELIMINACAO.npc), n.nome));
    n.vivo = false; n.modo = 'saindo';
    sairDoEstudio(n);
  }
  if (r.saem.includes('voce')) {
    som.tensao();
    await dialogo('patrao', `E, por fim... ${estado.nome}. ${TX.ELIMINACAO.jogador[0]}`);
    return true;
  }
  const pos = r.resultados.findIndex((x) => x.id === 'voce') + 1;
  await dialogo('patrao', `${estado.nome}, ${pos === 1 ? 'você teve a melhor nota da prova. Não fica se achando.' : `você ficou em ${pos}º.`} ${TX.ELIMINACAO.salvo}`);
  return false;
}

async function sairDoEstudio(n) {
  const h = n.humano, b = posBancada(n.bancada);
  h.estado = 'chorando';
  await esperar(1.5);
  await h.irPara([[b.x, b.z + 1.1], [b.x, 12.9], [-19.6, 12.9], [-20.4, 11]], 1.3);
  h.raiz.visible = false; n.modo = 'fora';
  const i = alvosExtras.indexOf(h.raiz); if (i >= 0) alvosExtras.splice(i, 1);
}

async function final(r) {
  const venceu = r.resultados[0].id === 'voce';
  estado.fase = 'final';
  for (const n of npcs) if (n.vivo) n.humano.estado = 'aplaudindo';
  if (venceu) {
    await falas(TX.FINAL.vitoria);
    await cortina(() => { jogador.posicionar(0, -9.7, 0); jogador.pitch = -0.2; estudio.trofeu.position.set(0, 0.995, -11.25); });
    efeitos.confetes(new THREE.Vector3(0, 0, -10.5));
    som.aplauso(5);
    for (const id of ['jacuzzi', 'risotto', 'fumaca', 'patrao']) personagens[id].estado = 'aplaudindo';
    await esperar(4);
    return fim(true, r);
  }
  const vencedor = r.resultados[0];
  await falas(TX.FINAL.derrota, vencedor.nome);
  const n = npcs.find((x) => x.id === vencedor.id);
  if (n) { n.humano.estado = 'comemorando'; efeitos.confetes(n.humano.raiz.position.clone()); som.aplauso(4); }
  await esperar(3);
  return fim(false, r, r.resultados.findIndex((x) => x.id === 'voce') + 1);
}

async function fim(venceu, r, posFinal) {
  estado.fase = 'fim';
  apagarSave();
  const notas = participantes[0].notas;
  const media = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : 0;
  const tit = venceu ? 'O título é seu' : posFinal === 2 ? 'Vice-campeonato' : 'Eliminação';
  const frase = venceu ? `${estado.nome} leva pra casa o ${TX.TROFEU}. Ninguém sabe onde guardar. Ninguém sabe por que três pernas. Mas é seu.`
    : posFinal ? `Você chegou à final e ficou em ${posFinal}º. O frango dourado foi pra ${esc(r.resultados[0].nome)}. Dói, mas dá audiência.`
      : `Você sobreviveu a ${estado.rodadas - 1} prova(s). A cozinha agradece a visita. As panelas, nem tanto.`;
  $('fim-conteudo').innerHTML = `<h2>${tit}</h2><p>${frase}</p><div class="comp"><span>Provas disputadas</span><span>${estado.rodadas}</span></div><div class="comp"><span>Melhor nota</span><span>${estado.melhorNota}</span></div><div class="comp"><span>Média</span><span>${media}</span></div><button class="btn ouro" onclick="location.reload()">Jogar de novo</button>`;
  estado.overlay = true; jogador.soltar();
  $('fim').classList.remove('oculto');
}

// Ganchos de depuração e teste
window.__pp = { estado, get cozinha() { return cozinha; }, get mexer3d() { return mexer3d; }, get jogador() { return jogador; }, get mira() { return mira; }, npcs, personagens, pular: () => { estado.relogio = 0.1; }, avancar: () => { if (estado.dialogo) { estado.dialogo.mostrado = 1e9; avancarDialogo(); return true; } if (overlayResolve) { overlayResolve(); return true; } return false; }, pegar: (id) => pegarProduto(id), acaoE: () => acaoE() };

iniciar().catch((e) => { console.error(e); $('erro').classList.remove('oculto'); $('erro-txt').textContent = e.message; });
