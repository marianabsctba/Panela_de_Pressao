// Simulação da cozinha: temperatura, ponto, emulsões, roux, fritura.
// Lógica pura (sem Three.js) para poder ser testada no Node.
import { INGREDIENTES, PREPAROS, RECIPIENTES, CORTES, AMBIENTE } from './dados.js';

let proximoUid = 1;
export const defDe = (id) => INGREDIENTES[id] || PREPAROS[id];
export const ehPreparo = (c) => !!PREPAROS[c.id] && !INGREDIENTES[c.id];

export function novaComida(id, extra = {}) {
  const d = defDe(id);
  if (!d) throw new Error('Ingrediente desconhecido: ' + id);
  const prep = !!PREPAROS[id] && !INGREDIENTES[id];
  const t0 = d.geladeira ? 4 : AMBIENTE;
  return Object.assign({
    uid: proximoUid++, tipo: 'comida', id, nome: d.nome, cat: prep ? 'preparo' : d.cat,
    corte: null, qCorte: 0,
    tN: t0, tMax: t0, // temperatura de núcleo
    dA: 0, dB: 0, lado: 0, // dourado de cada lado (Maillard)
    cozido: 0, coag: 0, croc: 0, oleo: 0, cremoso: 0,
    sal: 0, pimenta: 0, noz: 0,
    tec: {}, def: {}, bonus: {},
    volume: d.volume ?? 1,
    salAntes: false, dourando: false, fervido: false, chocado: false, flambado: false,
    espessura: 0, grumos: 0, corRoux: 0, noisette: 0, queimando: 0, fumaca: 0,
    priFrit: 0, tempoFrito: 0, transb: 0,
  }, extra);
}

export function novoRecipiente(rtipo, extra = {}) {
  const d = RECIPIENTES[rtipo];
  if (!d) throw new Error('Recipiente desconhecido: ' + rtipo);
  return Object.assign({
    uid: proximoUid++, tipo: 'recipiente', rtipo, nome: d.nome, conteudo: [],
    temp: AMBIENTE, mexida: 0, timers: {}, fervendo: false, sujo: 0,
  }, extra);
}

export const alvoBoca = (nivel) => AMBIENTE + nivel * 24;

export function ehLiquido(c) {
  const d = defDe(c.id);
  return !!d.liquido;
}
export function ehAquoso(c) {
  const d = defDe(c.id);
  if (INGREDIENTES[c.id]) return !!d.aquoso;
  return !!d.liquido && !d.gordura && c.id !== 'caramelo';
}
export const ehDoce = (c) => !!defDe(c.id).doce || (c.cat === 'fruta' && c.flambado);

export function volumeAquoso(r) {
  let v = 0;
  for (const c of r.conteudo) if (ehAquoso(c)) v += c.volume;
  return v;
}

const MULT_CORTE = { brunoise: 4, ciseler: 4, hacher: 4, julienne: 3, emincer: 3, paysanne: 3, chiffonade: 4, concasse: 3, batonnet: 2, mirepoix: 1.6, tourner: 1.4, esmagar: 3, aparar: 1, filetar: 1.3 };
const BASE_NUCLEO = { bovino: 0.0065, bovino_gordo: 0.01, ave: 0.006, ave_rosada: 0.006, peixe: 0.009, fruto_mar: 0.02, legume: 0.02, tuberculo: 0.009, tomate: 0.02, fruta: 0.02, folha: 0.06, erva: 0.06, ovo: 0.03, gema: 0.05, clara: 0.05, queijo: 0.03, preparo: 0.03 };
const BASE_COZIDO = { legume: 0.012, tuberculo: 0.009, tomate: 0.02, fruta: 0.015, folha: 0.05, erva: 0.05 };
const PROTEINAS = ['bovino', 'bovino_gordo', 'ave', 'ave_rosada', 'peixe', 'fruto_mar'];
export const ehProteina = (c) => PROTEINAS.includes(c.cat);
const VEGETAIS = ['legume', 'tuberculo', 'tomate', 'folha', 'erva', 'fruta'];
export const ehVegetal = (c) => VEGETAIS.includes(c.cat);
const EMULSOES = ['holandesa', 'creme_anglaise', 'maionese', 'beurre_blanc'];
const MOLHOS_ROUX = ['bechamel', 'veloute', 'espanhola'];

function multCorte(c) { return c.corte ? (MULT_CORTE[c.corte] || 1) : 1; }

// Um passo de simulação de um recipiente. alvo = temperatura que a fonte de calor quer impor.
export function passo(r, dt, alvo = AMBIENTE) {
  const ev = [];
  const info = RECIPIENTES[r.rtipo];
  let alvoT = alvo;
  const gelo = r.conteudo.find((c) => c.id === 'gelo');
  if (gelo) {
    alvoT = Math.min(alvoT, 1);
    if (alvo > 40) {
      gelo.volume -= dt * 0.06;
      if (gelo.volume <= 0) { remover(r, gelo); r.conteudo.push(novaComida('agua', { tN: 5, volume: 0.6 })); ev.push({ tipo: 'derreteu' }); }
    }
  }
  const volAq = volumeAquoso(r);
  const massa = r.conteudo.reduce((s, c) => s + Math.max(0.2, c.volume || 1), 0);
  const k = info.k / (1 + 0.12 * massa);
  r.temp += (alvoT - r.temp) * (1 - Math.exp(-k * dt));
  const temAgua = volAq > 0.05 && r.rtipo !== 'fritadeira';
  if (temAgua && r.temp > 100) r.temp = 100;
  r.fervendo = temAgua && r.temp >= 99.5 && alvoT > 101;

  if (r.fervendo) {
    const taxa = 0.002 + 0.006 * Math.min(1.6, (alvoT - 100) / 100);
    for (const c of [...r.conteudo]) {
      if (!ehAquoso(c)) continue;
      c.volume -= taxa * dt * (c.volume / volAq);
      if (ehPreparo(c)) c.espessura += dt * 0.01;
      if (c.volume <= 0.03) {
        remover(r, c);
        ev.push({ tipo: 'evaporou', nome: c.nome });
      }
    }
  }
  // Bater forte desfaz o choque de líquido despejado de uma vez sobre o roux
  if (r.choque) r.choque *= Math.exp(-dt * Math.max(0, r.mexida - 2) * 0.3);
  r.mexida *= Math.exp(-dt * 1.2);

  const temGorduraQuente = r.conteudo.some((c) => (c.id === 'manteiga' || c.id === 'manteiga_clarificada') && r.temp > 100);
  for (const c of [...r.conteudo]) atualizarComida(c, r, dt, temAgua, temGorduraQuente, ev);
  aplicarRegras(r, dt, ev);
  return ev;
}

function atualizarComida(c, r, dt, temAgua, gorduraQuente, ev) {
  const info = RECIPIENTES[r.rtipo];
  const T = r.temp;
  const liq = ehLiquido(c);
  const fritando = r.rtipo === 'fritadeira';
  const submerso = fritando || (temAgua && !liq && c.cat !== 'gordura');
  const equaliza = liq || ['roux', 'pure', 'caramelo'].includes(c.id) || ['gordura', 'seco', 'tempero', 'condimento', 'gelo'].includes(c.cat);

  if (c.id === 'gelo') return;
  if (equaliza) {
    c.tN += (T - c.tN) * (1 - Math.exp(-0.25 * dt));
  } else {
    const kN = (BASE_NUCLEO[c.cat] || 0.02) * multCorte(c);
    const alvoN = submerso ? T : (T <= 105 ? T : 105 + (T - 105) * 0.12);
    c.tN += (alvoN - c.tN) * (1 - Math.exp(-kN * dt));
  }
  c.tMax = Math.max(c.tMax, c.tN);

  // Dourado por contato seco (Maillard). Começa a partir de 140 °C.
  const contatoSeco = !submerso && !liq && !equaliza && (info.seca || (r.rtipo === 'panela' && !temAgua)) && T > 140;
  if (contatoSeco) {
    const fator = c.cat === 'preparo' ? 0.7 : (ehProteina(c) ? 1 : 0.85);
    const taxa = ((T - 140) / 80) * 0.02 * fator;
    if (r.rtipo === 'assadeira') {
      c.dA += taxa * 0.5 * dt; c.dB += taxa * 0.5 * dt; c.tec.roti = true;
    } else if ((c.corte && !['aparar', 'filetar'].includes(c.corte)) || r.mexida > 0.8) {
      c.dA += taxa * 0.55 * dt; c.dB += taxa * 0.55 * dt; c.tec.saute = true;
    } else {
      if (c.lado === 0) c.dA += taxa * dt; else c.dB += taxa * dt;
      c.tec.poele = true;
    }
    if (!c.dourando) { c.dourando = true; c.salAntes = c.sal > 0; }
  }
  // Arroser: regar com manteiga espumante (mexer com manteiga quente na frigideira).
  if (gorduraQuente && ehProteina(c) && !submerso && r.mexida > 0.8 && T > 110) {
    c.bonus.arrose = (c.bonus.arrose || 0) + dt;
    const lado2 = c.lado === 0 ? 'dB' : 'dA';
    if (T > 140) c[lado2] += dt * 0.004;
  }

  // Gorduras
  if (c.id === 'manteiga') {
    if (T >= 125 && T < 172) c.noisette += dt * 0.04;
    if (T >= 172) c.queimando += dt; else c.queimando = Math.max(0, c.queimando - dt * 0.3);
    if (c.queimando > 7 && !c.def.queimada) { c.def.queimada = true; ev.push({ tipo: 'manteiga_queimou' }); }
  }
  if ((c.id === 'azeite' || c.id === 'oleo') && T > (c.id === 'azeite' ? 205 : 230)) {
    c.fumaca += dt;
    if (c.fumaca > 6 && !c.def.fumacou) { c.def.fumacou = true; ev.push({ tipo: 'fumacou', nome: c.nome }); }
  }

  // Vegetais amolecem acima de 75 °C no núcleo
  if (ehVegetal(c) && c.tN > 75) {
    c.cozido += dt * (BASE_COZIDO[c.cat] || 0.012) * (0.5 + multCorte(c) / 2) * Math.min(1.5, (c.tN - 75) / 25);
  }
  // Branquear e dar choque térmico
  if (submerso && r.fervendo && ehVegetal(c)) c.fervido = true;
  if (r.conteudo.some((x) => x.id === 'gelo') && c.fervido && c.tN < 14 && !c.chocado) {
    c.chocado = true; c.tec.blanchi = true; ev.push({ tipo: 'chocou', nome: c.nome });
  }
  // Pochê: proteína ou ovo em líquido entre 70 e 95 °C
  if (submerso && !fritando && T >= 70 && T <= 96 && (ehProteina(c) || c.cat === 'ovo')) c.tec.poche = true;

  // Fritura por imersão
  if (fritando) {
    c.tec.frit = true; c.tempoFrito += dt;
    if (T < 150) c.oleo += dt * 0.02;
    if (T >= 140 && T <= 168) c.priFrit += dt;
    if (T >= 168 && (c.cozido > 0.55 || !ehVegetal(c))) c.croc += dt * 0.035 * Math.min(1.6, (T - 160) / 25);
    if (T > 165) { const t = dt * 0.012 * ((T - 150) / 40); c.dA += t; c.dB += t; }
  }

  // Ovos coagulam a partir de 62 °C
  if (['ovo', 'gema', 'clara'].includes(c.cat) || ['ovos_batidos', 'omelete'].includes(c.id)) {
    if (c.tN > 62) c.coag += dt * (c.tN - 60) * 0.0035;
    if (c.id === 'ovos_batidos' && r.rtipo === 'frigideira' && c.coag < 0.6 && r.mexida > 0.5) c.cremoso += dt * 0.15;
  }

  // Roux escurece
  if (c.id === 'roux' && T > 110) {
    c.corRoux += dt * 0.008 * (T - 100) / 50;
    if (c.corRoux > 1.4 && !c.def.queimado) { c.def.queimado = true; ev.push({ tipo: 'queimou', nome: c.nome }); }
  }
  if (c.id === 'caramelo' && T > 195) {
    c.queimando += dt;
    if (c.queimando > 5 && !c.def.queimado) { c.def.queimado = true; ev.push({ tipo: 'queimou', nome: 'Caramelo' }); }
  }
  // Molhos engrossados com roux: espessura e grumos
  if (MOLHOS_ROUX.includes(c.id) && T > 85) {
    c.espessura += dt * 0.012;
    if (r.mexida < 0.4 && c.espessura < 0.7) c.grumos += dt * 0.03;
    if (r.mexida < 0.2 && T > 98) c.dB += dt * 0.01; // pega no fundo
  }
  if (['molho_tomate', 'molho_au_poivre', 'beurre_blanc'].includes(c.id) && T > 85) c.espessura += dt * 0.008;
  // Emulsões talham acima de 87 °C
  if (EMULSOES.includes(c.id) && c.tN > 87) {
    const nome = c.nome;
    transformarEm(r, [c], 'molho_talhado', { origem: c.id });
    ev.push({ tipo: 'talhou', nome });
    return;
  }
  // Leite fervendo sem mexer derrama
  if (c.id === 'leite' && r.fervendo && r.mexida < 0.3) {
    c.transb += dt;
    if (c.transb > 6) { c.transb = 0; c.volume *= 0.5; r.sujo += 1; ev.push({ tipo: 'transbordou' }); }
  }

  if (Math.max(c.dA, c.dB) > 1.5 && !c.def.queimado) { c.def.queimado = true; ev.push({ tipo: 'queimou', nome: c.nome }); }
}

export function remover(r, c) {
  const i = r.conteudo.indexOf(c);
  if (i >= 0) r.conteudo.splice(i, 1);
}

// Substitui itens por uma preparação nova, somando tempero e técnicas.
export function transformarEm(r, itens, id, extra = {}) {
  const novo = novaComida(id);
  let vol = 0;
  for (const c of itens) {
    novo.sal += c.sal; novo.pimenta += c.pimenta; novo.noz += c.noz || 0;
    Object.assign(novo.tec, c.tec);
    if (c.def.queimado || c.def.queimada) novo.def.queimado = true;
    if (c.def.pele) novo.def.pele = true;
    vol += c.volume || 1;
    remover(r, c);
  }
  novo.volume = Math.max(0.4, vol * 0.7);
  novo.tN = r.temp; novo.tMax = r.temp;
  Object.assign(novo, extra);
  r.conteudo.push(novo);
  return novo;
}

// Regras da cozinha clássica. Cada requisito casa com itens distintos.
const eh = (...ids) => (c) => ids.includes(c.id);
const mirepoix = (c) => ['cebola', 'cenoura', 'salsao'].includes(c.id) && c.corte === 'mirepoix';
const tem = (r, f) => r.conteudo.some(f);

export const REGRAS = [
  { id: 'manteiga_clarificada', tempo: 12,
    req: [{ f: (c) => c.id === 'manteiga' && !c.def.queimada }],
    cond: (r) => r.conteudo.length === 1 && r.temp >= 85 && r.temp <= 118 && r.mexida < 0.6 && r.rtipo !== 'frigideira',
    fazer: () => ({}) },
  { id: 'roux', tempo: 3,
    req: [{ f: (c) => (c.id === 'manteiga' || c.id === 'manteiga_clarificada') && !c.def.queimada }, { f: eh('farinha') }],
    cond: (r) => r.temp >= 90 && r.mexida > 0.3,
    fazer: () => ({}) },
  { id: 'bechamel', tempo: 5,
    req: [{ f: eh('roux') }, { f: eh('leite') }],
    cond: (r) => r.temp >= 80 && r.mexida > 0.4,
    fazer: ([roux], r) => ({ corRoux: roux[0].corRoux, grumos: (r.mexida < 1 ? 0.3 : 0) + gastarChoque(r) }) },
  { id: 'veloute', tempo: 5,
    req: [{ f: eh('roux') }, { f: eh('fundo_claro', 'fumet') }],
    cond: (r) => r.temp >= 80 && r.mexida > 0.4,
    fazer: ([roux, fundo], r) => ({ corRoux: roux[0].corRoux, grumos: (r.mexida < 1 ? 0.3 : 0) + gastarChoque(r), base: fundo[0].id }) },
  { id: 'espanhola', tempo: 12,
    req: [{ f: (c) => c.id === 'roux' && c.corRoux >= 0.6 }, { f: eh('fundo_escuro') }, { f: eh('tomate', 'extrato_tomate') }, { f: mirepoix, min: 1, max: 3 }],
    cond: (r) => r.temp >= 90,
    fazer: ([roux, , , mire]) => ({ corRoux: roux[0].corRoux, mirepoix: mire.length }) },
  { id: 'molho_tomate', tempo: 15,
    req: [{ f: (c) => c.id === 'tomate' && !!c.corte, min: 1, max: 4 }, { f: eh('cebola', 'alho', 'echalote'), min: 1, max: 3 }, { f: eh('azeite', 'manteiga'), min: 0, max: 2 }, { f: eh('louro', 'tomilho', 'manjericao'), min: 0, max: 3 }],
    cond: (r) => r.temp >= 90,
    fazer: ([tom, , , ervas]) => ({ concasse: tom.every((t) => t.corte === 'concasse' && !t.def.pele), ervas: ervas.length, def: tom.some((t) => t.def.pele) ? { pele: true } : {} }) },
  { id: 'holandesa', tempo: 6,
    req: [{ f: eh('gema'), min: 1, max: 4 }, { f: eh('manteiga_clarificada', 'manteiga') }, { f: eh('limao', 'vinagre') }],
    cond: (r) => r.temp >= 55 && r.temp <= 82 && r.mexida >= 2,
    fazer: ([gemas, gord]) => ({ clarificada: gord[0].id === 'manteiga_clarificada', gemas: gemas.length }) },
  { id: 'maionese', tempo: 8,
    req: [{ f: eh('gema'), min: 1, max: 3 }, { f: eh('oleo', 'azeite') }, { f: eh('limao', 'vinagre', 'mostarda'), min: 1, max: 3 }],
    cond: (r) => r.temp < 35 && r.mexida >= 2.2,
    fazer: ([, gord, ac]) => ({ comAzeite: gord[0].id === 'azeite', dijon: ac.some((a) => a.id === 'mostarda') }) },
  { id: 'vinagrete', tempo: 3,
    req: [{ f: eh('azeite', 'oleo') }, { f: eh('vinagre', 'limao') }, { f: eh('mostarda'), min: 0, max: 1 }],
    cond: (r) => r.temp < 40 && r.mexida >= 0.8 && !tem(r, eh('gema')),
    fazer: ([, , m]) => ({ dijon: m.length > 0 }) },
  { id: 'beurre_blanc', tempo: 6,
    req: [{ f: eh('echalote') }, { f: eh('vinho_branco', 'vinagre') }, { f: eh('manteiga') }],
    cond: (r) => r.temp >= 60 && r.temp <= 90 && r.mexida >= 1.5,
    fazer: ([ech]) => ({ ciseler: ech[0].corte === 'ciseler' }) },
  { id: 'molho_au_poivre', tempo: 8,
    req: [{ f: eh('pimenta_grao') }, { f: eh('conhaque') }, { f: eh('creme') }, { f: eh('fundo_escuro'), min: 0, max: 1 }, { f: eh('manteiga'), min: 0, max: 1 }],
    cond: (r) => r.temp >= 80,
    fazer: ([pim, con, , fundo, mant]) => ({ flambado: !!con[0].flambado, mignonnette: pim[0].corte === 'esmagar', comFundo: fundo.length > 0, monte: mant.length > 0 }) },
  { id: 'creme_anglaise', tempo: 6,
    req: [{ f: eh('gema'), min: 1, max: 6 }, { f: eh('acucar') }, { f: eh('leite', 'creme') }, { f: eh('fava_baunilha'), min: 0, max: 1 }],
    cond: (r) => r.temp >= 76 && r.temp <= 86 && r.mexida >= 0.8,
    fazer: ([, , , bau]) => ({ baunilha: bau.length > 0 }) },
  { id: 'caramelo', tempo: 4,
    req: [{ f: eh('acucar') }],
    cond: (r) => r.temp >= 165,
    fazer: () => ({}) },
  { id: 'ovos_batidos', tempo: 3,
    req: [{ f: eh('ovo'), min: 1, max: 6 }],
    cond: (r) => r.temp < 50 && r.mexida >= 0.8 && (r.rtipo === 'bowl' || r.rtipo === 'liquidificador'),
    fazer: ([ovos]) => ({ ovos: ovos.length }) },
  { id: 'pure', tempo: 5,
    req: [{ f: (c) => c.id === 'batata' && c.cozido >= 0.85, min: 1, max: 4 }, { f: eh('manteiga') }, { f: eh('leite', 'creme'), min: 0, max: 1 }],
    cond: (r) => r.mexida >= 1 && !tem(r, eh('agua')) && ['panela', 'bowl', 'sauteuse'].includes(r.rtipo),
    fazer: ([bat, , leite]) => ({ comLeite: leite.length > 0, batatas: bat.length }) },
];

function casar(r, regra) {
  const usados = new Set();
  const grupos = [];
  for (const q of regra.req) {
    const min = q.min ?? 1, max = q.max ?? Math.max(1, min);
    const g = [];
    for (const c of r.conteudo) {
      if (g.length >= max) break;
      if (!usados.has(c) && q.f(c)) { g.push(c); usados.add(c); }
    }
    if (g.length < min) return null;
    grupos.push(g);
  }
  return grupos;
}

function gastarChoque(r) { const c = Math.min(0.6, r.choque || 0); r.choque = 0; return c; }

// Molho já formado incorpora o líquido que chega aos poucos (afina o molho)
const ABSORVE = { bechamel: ['leite', 'creme'], veloute: ['fundo_claro', 'fumet'], espanhola: ['fundo_escuro'], molho_au_poivre: ['creme', 'fundo_escuro'], molho_tomate: ['agua'], creme_anglaise: ['leite', 'creme'] };
function absorver(r, dt) {
  for (const m of r.conteudo) {
    const aceita = ABSORVE[m.id];
    if (!aceita) continue;
    const liq = r.conteudo.find((c) => aceita.includes(c.id));
    if (!liq || r.temp < 60 || r.mexida < 0.3) { m.absorvendo = 0; continue; }
    m.absorvendo = (m.absorvendo || 0) + dt;
    if (m.absorvendo < 1.5) continue;
    const total = m.volume + liq.volume;
    m.espessura *= m.volume / total;
    m.sal += liq.sal; m.volume = total; m.absorvendo = 0;
    remover(r, liq);
  }
}

function aplicarRegras(r, dt, ev) {
  absorver(r, dt);
  for (const regra of REGRAS) {
    const g = casar(r, regra);
    if (g && regra.cond(r, g)) {
      r.timers[regra.id] = (r.timers[regra.id] || 0) + dt;
      if (r.timers[regra.id] >= regra.tempo) {
        r.timers[regra.id] = 0;
        const extra = regra.fazer(g, r);
        const defExtra = extra.def; delete extra.def;
        const novo = transformarEm(r, g.flat(), regra.id, extra);
        if (defExtra) Object.assign(novo.def, defExtra);
        if (['holandesa', 'maionese', 'beurre_blanc', 'creme_anglaise', 'vinagrete'].includes(regra.id)) novo.tec.emulsao = true;
        if (MOLHOS_ROUX.includes(regra.id) || regra.id === 'roux') novo.tec.roux = true;
        ev.push({ tipo: 'preparo', id: regra.id, nome: novo.nome });
      }
    } else if (r.timers[regra.id]) {
      r.timers[regra.id] = Math.max(0, r.timers[regra.id] - dt * 2);
    }
  }
}

// ---------- Ações do jogador ----------

// Líquido chegando de uma vez em roux quente vira grumo (a não ser que se bata forte)
function registrarChoque(r, c, vol) {
  if (['leite', 'creme', 'fundo_claro', 'fundo_escuro', 'fumet'].includes(c.id) && r.temp > 80 && r.conteudo.some((x) => x.id === 'roux')) {
    r.choque = (r.choque || 0) + Math.max(0, vol - 0.25) * 1.0;
  }
}

// Despeja até 'quanto' de líquido de 'de' (recipiente ou embalagem) em 'para'. Devolve o volume movido.
export function verterPorcao(de, para, quanto) {
  const fontes = de.tipo === 'recipiente' ? de.conteudo.filter((c) => ehLiquido(c) || (c.id === 'manteiga' && c.tN > 40)) : (ehLiquido(de) ? [de] : []);
  let movido = 0;
  for (const c of fontes) {
    if (movido >= quanto) break;
    const v = Math.min(c.volume, quanto - movido);
    if (v <= 0) continue;
    const frac = v / c.volume;
    let destino = para.conteudo.find((x) => x.id === c.id);
    if (!destino) {
      if (para.conteudo.length >= RECIPIENTES[para.rtipo].cap) break;
      destino = novaComida(c.id, { volume: 0, tN: c.tN, sal: 0, pimenta: 0, tec: { ...c.tec }, def: { ...c.def }, flambado: c.flambado });
      para.conteudo.push(destino);
    }
    destino.tN = (destino.tN * destino.volume + c.tN * v) / (destino.volume + v);
    destino.volume += v;
    destino.sal += c.sal * frac; destino.pimenta += c.pimenta * frac;
    c.sal -= c.sal * frac; c.pimenta -= c.pimenta * frac;
    c.volume -= v;
    if (c.volume <= 1e-3 && de.tipo === 'recipiente') remover(de, c);
    registrarChoque(para, c, v);
    movido += v;
  }
  return movido;
}

export function adicionar(r, c) {
  if (c.cat === 'tempero') return { ok: temperar(r, c.id), tempero: true };
  const cap = RECIPIENTES[r.rtipo].cap;
  if (r.conteudo.length >= cap) return { ok: false, msg: 'Não cabe mais nada aí. Física, chef. Física.' };
  if (r.rtipo === 'fritadeira' && ehLiquido(c)) return { ok: false, msg: 'Líquido na fritadeira quente? Quer conhecer os bombeiros?' };
  registrarChoque(r, c, c.volume || 1);
  r.conteudo.push(c);
  return { ok: true };
}

export function temperar(alvo, id) {
  const itens = alvo.tipo === 'recipiente' ? alvo.conteudo.filter((c) => c.id !== 'gelo') : [alvo];
  if (!itens.length) return false;
  const campo = id === 'sal' ? 'sal' : id === 'pimenta' ? 'pimenta' : 'noz';
  for (const c of itens) c[campo] = (c[campo] || 0) + 1 / itens.length;
  return true;
}

export function mexer(r, forca, dt) {
  r.mexida = Math.min(3.2, r.mexida + forca * dt * 2.2);
}

export function virar(r) {
  const ovos = r.conteudo.find((c) => c.id === 'ovos_batidos');
  if (ovos && r.rtipo === 'frigideira') {
    if (ovos.coag < 0.35) return { acao: 'nada', msg: 'Ainda está líquido. Enrolar sopa não é técnica, é desespero.' };
    const ervas = r.conteudo.filter((c) => c.cat === 'erva' && c.corte === 'hacher');
    const comManteiga = r.conteudo.some((c) => c.id === 'manteiga' || c.id === 'manteiga_clarificada');
    const extra = { coag: ovos.coag, cremoso: ovos.cremoso, dA: ovos.dA, dB: ovos.dB, ervas: ervas.length, comManteiga, ovos: ovos.ovos || 1 };
    const gord = r.conteudo.filter((c) => c.id === 'manteiga' || c.id === 'manteiga_clarificada');
    const om = transformarEm(r, [ovos, ...ervas, ...gord], 'omelete', extra);
    om.tec.enrolado = true;
    return { acao: 'enrolou', msg: 'Omelete enrolada com um tapinha no cabo. Que elegância.' };
  }
  const alc = r.conteudo.find((c) => c.cat === 'alcool' && !c.flambado);
  if (alc) {
    if (r.temp < 100) return { acao: 'nada', msg: 'Frio demais pra pegar fogo. Esquenta essa panela.' };
    alc.flambado = true;
    alc.volume *= 0.5;
    for (const c of r.conteudo) { c.tec.flambe = true; if (c.cat === 'fruta') c.flambado = true; }
    return { acao: 'flambou', msg: 'FLAMBÉ! Labaredas de um metro. A produção pede desculpas ao teto.' };
  }
  const solidos = r.conteudo.filter((c) => !ehLiquido(c) && c.cat !== 'gordura');
  if (!solidos.length) return { acao: 'nada', msg: 'Não tem nada pra virar. Virou só o pulso.' };
  for (const c of solidos) c.lado = 1 - c.lado;
  return { acao: 'virou', msg: solidos.length === 1 ? `Virou ${solidos[0].nome.toLowerCase()}.` : 'Saltou tudo na frigideira, estilo sauté.' };
}

export function cortesPossiveis(c) {
  const d = INGREDIENTES[c.id];
  if (!d || !d.cortes) return [];
  if (c.corte) return [];
  return d.cortes;
}

export function cortar(c, corte, q) {
  const d = INGREDIENTES[c.id];
  const nomeCorte = CORTES[corte]?.nome || corte;
  if (!d?.cortes?.includes(corte)) return { ok: false, msg: `${nomeCorte} em ${c.nome.toLowerCase()}? Nem o Escoffier ousou.` };
  if (c.corte) return { ok: false, msg: 'Já está cortado. Cortar de novo vira purê de tábua.' };
  q = Math.max(0, Math.min(1, q));
  if (corte === 'separar') {
    const gema = novaComida('gema', { tN: c.tN });
    const clara = novaComida('clara', { tN: c.tN });
    if (q < 0.4) gema.def.furada = true;
    return { ok: true, substituir: [gema, clara], msg: q < 0.4 ? 'A gema furou um pouco. Ela vai sobreviver. Você, não sabemos.' : 'Gema separada sem um fio de clara. Bonito.' };
  }
  if (corte === 'concasse' && !(c.fervido && c.chocado)) {
    c.def.pele = true;
  }
  c.corte = corte; c.qCorte = q; c.tec.corte = true;
  let msg = `${nomeCorte} pronta. Precisão ${Math.round(q * 100)}%.`;
  if (c.def.pele) msg += ' Mas concassé com pele? O tomate não foi branqueado nem levou choque térmico.';
  if (q < 0.35) msg += ' Parece que foi cortado com uma colher.';
  return { ok: true, msg };
}

export function liquidificar(r) {
  const itens = r.conteudo.filter((c) => c.id !== 'gelo');
  if (!itens.length) {
    if (r.conteudo.length) return { ok: true, id: null, msg: 'Você bateu gelo puro. Parabéns pela raspadinha de nada.' };
    return { ok: false, msg: 'Liquidificador vazio. Barulho grátis.' };
  }
  const t = (f) => itens.some(f);
  let id = 'gororoba', extra = {}, msg;
  if (t(eh('gema')) && t(eh('oleo', 'azeite'))) {
    id = 'maionese'; extra = { comAzeite: t(eh('azeite')), dijon: t(eh('mostarda')), noLiquidificador: true };
    msg = 'Maionese de liquidificador. Funciona, mas o Jacuzzi chama de preguiça.';
  } else if (t((c) => c.id === 'batata')) {
    id = 'pure'; extra = { gomoso: true };
    msg = 'Batata no liquidificador liberou todo o amido. Você inventou cola escolar.';
  } else if (t((c) => c.cat === 'fruta' && defDe(c.id).doce)) {
    id = 'coulis'; extra = { comAcucar: t(eh('acucar')) };
    msg = 'Coulis batido. Agora passa na peneira, se quiser respeito.';
  } else if (t((c) => ehVegetal(c)) && t((c) => ehAquoso(c))) {
    const crus = itens.filter((c) => ehVegetal(c) && c.cozido < 0.6).length;
    id = 'creme_legumes'; extra = { cru: crus > 0 };
    msg = crus ? 'Legume cru batido com líquido: gaspacho involuntário.' : 'Creme de legumes aveludado.';
  } else {
    msg = 'Você bateu tudo junto. O resultado não tem nome, só boletim de ocorrência.';
  }
  const novo = transformarEm(r, itens, id, extra);
  novo.tec.liquidificado = true;
  return { ok: true, id, msg, item: novo };
}

export function transferir(de, para) {
  const movem = de.conteudo.filter((c) => !(de.rtipo === 'fritadeira' && c.cat === 'gordura'));
  if (!movem.length) return { ok: false, msg: 'Não tem nada pra despejar.' };
  const cap = RECIPIENTES[para.rtipo].cap;
  if (para.conteudo.length + movem.length > cap) return { ok: false, msg: 'Não cabe tudo. Vai transbordar e o Fumaça vai filmar.' };
  for (const c of movem) { remover(de, c); registrarChoque(para, c, c.volume || 1); para.conteudo.push(c); }
  return { ok: true, n: movem.length };
}

export function escorrer(r) {
  const fora = r.conteudo.filter((c) => c.id === 'agua' || c.id === 'gelo');
  if (!fora.length) return { ok: false, msg: 'Não tem água pra escorrer.' };
  for (const c of fora) remover(r, c);
  return { ok: true, msg: 'Escorreu na pia. A água vai pro mar, o sabor fica.' };
}

// ---------- Leitura de estado ----------

export function pontoCarne(c) {
  const t = c.tN;
  if (c.cat === 'bovino' || c.cat === 'bovino_gordo' || c.cat === 'ave_rosada') {
    if (t < 40) return 'cru, ainda mugindo';
    if (t < 46) return 'bleu';
    if (t < 53) return 'saignant (mal passado)';
    if (t < 57) return 'entre saignant e à point';
    if (t < 62) return 'à point (ao ponto)';
    if (t < 68) return 'ao ponto pra bem';
    return 'bien cuit (sola de sapato)';
  }
  if (c.cat === 'ave') {
    if (t < 70) return 'cru, salmonela de brinde';
    if (t < 79) return 'no ponto e suculento';
    return 'seco igual palestra motivacional';
  }
  if (c.cat === 'peixe') {
    if (t < 42) return 'cru (sashimi acidental)';
    if (t < 56) return 'nacarado, perfeito';
    if (t < 63) return 'no ponto';
    return 'seco, desfiando de vergonha';
  }
  if (c.cat === 'fruto_mar') {
    if (t < 50) return 'cru';
    if (t < 68) return 'no ponto';
    return 'borracha de apagar';
  }
  return '';
}

export function nivelSal(s) {
  if (s < 0.3) return 'sem sal';
  if (s < 0.7) return 'pouco sal';
  if (s <= 2.6) return 'sal no ponto';
  if (s <= 4) return 'salgado';
  return 'água do mar';
}

export function descrever(c) {
  const p = [c.nome];
  if (c.corte) p.push((CORTES[c.corte]?.nome || c.corte).toLowerCase());
  if (ehProteina(c)) {
    p.push(`núcleo ${Math.round(c.tN)}°C, ${pontoCarne(c)}`);
    p.push(`crosta ${c.dA.toFixed(1)}/${c.dB.toFixed(1)}`);
  } else if (ehVegetal(c) && c.cozido > 0.05) {
    p.push(c.cozido < 0.5 ? 'crocante' : c.cozido < 1.1 ? 'macio' : 'virando papa');
  }
  if (c.id === 'roux') p.push(c.corRoux < 0.35 ? 'branco' : c.corRoux < 0.75 ? 'blond' : c.corRoux < 1.4 ? 'escuro' : 'carvão');
  if (c.id === 'manteiga' && c.noisette > 0.6 && !c.def.queimada) p.push('noisette');
  if (['ovo', 'ovos_batidos', 'omelete'].includes(c.id) && c.coag > 0.05) p.push(c.coag < 0.5 ? 'líquido' : c.coag < 0.85 ? 'baveuse' : 'seco');
  if (c.tec.frit) p.push(c.croc > 0.6 ? 'crocante' : 'murcho');
  if (MOLHOS_ROUX.includes(c.id) || ['molho_tomate', 'molho_au_poivre'].includes(c.id)) p.push(c.espessura < 0.3 ? 'ralo' : c.espessura < 1.2 ? 'nappe' : 'massa corrida');
  if (c.def.queimado || c.def.queimada) p.push('QUEIMADO');
  if (c.sal > 0.05) p.push(nivelSal(c.sal));
  return p.join(' · ');
}

export function provar(alvo) {
  const itens = alvo.tipo === 'recipiente' ? alvo.conteudo.filter((c) => c.id !== 'gelo' && c.id !== 'agua') : [alvo];
  if (!itens.length) return 'Você provou o vazio. Tem gosto de inox.';
  const c = itens[itens.length - 1];
  const f = [];
  if (c.cat === 'ave' && c.tN < 70) return 'Você provou frango cru. Coragem e insensatez na mesma garfada.';
  if (c.def.queimado || c.def.queimada) f.push('Amargo de queimado. Tem gosto de arrependimento.');
  if (ehProteina(c)) f.push(`Termômetro: ${Math.round(c.tN)}°C, ${pontoCarne(c)}.`);
  const salM = itens.reduce((s, x) => s + x.sal, 0) / itens.length;
  const ns = nivelSal(salM);
  f.push(ns === 'sem sal' ? 'Sem sal. Gosto de isopor molhado.' : ns === 'pouco sal' ? 'Falta sal. O Jacuzzi já está sentindo daqui.' : ns === 'sal no ponto' ? 'Tempero no ponto.' : ns === 'salgado' ? 'Salgado. Você temperou ou chorou em cima?' : 'Isso é água do mar com ingrediente.');
  if (c.id === 'roux' && c.corRoux < 0.05) f.push('Gosto de farinha crua. Cozinha mais o roux.');
  if (c.grumos > 0.35) f.push('Tem grumos. Fouet nele.');
  if (c.id === 'molho_talhado') f.push('Talhou. Virou ovo mexido de luxo.');
  if (c.id === 'molho_au_poivre' && !c.flambado) f.push('Gosto de álcool cru, tipo posto de gasolina.');
  if (c.tN < 40 && (ehPreparo(c) || ehProteina(c)) && !['maionese', 'vinagrete', 'coulis'].includes(c.id)) f.push('Está frio.');
  return f.join(' ');
}

export function aroma(r) {
  const cs = r.conteudo;
  if (!cs.length) return null;
  const q = (f) => cs.find(f);
  if (q((c) => c.def.queimado || Math.max(c.dA, c.dB) > 1.3)) return { txt: 'Queimado: pneu de Kombi em chamas', nivel: 1, tipo: 'ruim' };
  if (q((c) => c.id === 'manteiga' && c.queimando > 2)) return { txt: 'Manteiga queimando: amargor de arrependimento', nivel: 0.8, tipo: 'ruim' };
  if (q((c) => c.fumaca > 1)) return { txt: 'Gordura passando do ponto de fumaça', nivel: 0.8, tipo: 'ruim' };
  if (q((c) => c.tec.flambe && c.cat === 'alcool')) return { txt: 'Álcool flambando: sobrancelhas em risco', nivel: 0.7, tipo: 'bom' };
  if (q((c) => c.id === 'caramelo')) return { txt: 'Caramelo: festa junina de grife', nivel: 0.7, tipo: 'bom' };
  if (q((c) => c.id === 'manteiga' && c.noisette > 0.6)) return { txt: 'Manteiga noisette: avelã tostada, que sonho', nivel: 0.7, tipo: 'bom' };
  if (q((c) => c.id === 'alho' && c.dA > 1)) return { txt: 'Alho queimado: amargo e sem perdão', nivel: 0.8, tipo: 'ruim' };
  if (q((c) => c.id === 'alho' && c.dA > 0.3)) return { txt: 'Alho dourando: o Brasil inteiro sente', nivel: 0.6, tipo: 'bom' };
  if (q((c) => c.id === 'roux' && r.temp > 100)) return { txt: 'Roux tostando: biscoito de vó', nivel: 0.5, tipo: 'bom' };
  if (q((c) => ehProteina(c) && Math.max(c.dA, c.dB) > 0.25)) return { txt: 'Reação de Maillard em andamento', nivel: 0.7, tipo: 'bom' };
  if (q((c) => ['cebola', 'echalote', 'alho_poro'].includes(c.id) && c.cozido > 0.2)) return { txt: 'Cebola suando: cheiro de casa de vó', nivel: 0.5, tipo: 'bom' };
  if (q((c) => c.tec.frit && r.temp > 150)) return { txt: 'Fritura: cheiro de feira de domingo', nivel: 0.5, tipo: 'bom' };
  if (r.fervendo) return { txt: 'Vapor de água. Emocionante.', nivel: 0.2, tipo: 'neutro' };
  return null;
}
