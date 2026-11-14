// Provas, critérios técnicos e notas dos jurados. Lógica pura.
import { PREPAROS } from './dados.js';
import { ehProteina, ehVegetal, ehDoce, ehPreparo, defDe } from './culinaria.js';

export const JURADOS = [
  { id: 'jacuzzi', nome: 'Érick Jacuzzi', papel: 'chef francês de pavio curto', peso: { tecnica: 0.45, tempero: 0.35, ponto: 0.1, apresentacao: 0.1 } },
  { id: 'risotto', nome: 'Helena Risotto', papel: 'chef poeta do equilíbrio', peso: { tecnica: 0.25, tempero: 0.15, ponto: 0.15, apresentacao: 0.45 } },
  { id: 'fumaca', nome: 'Henrique Fumaça', papel: 'chef tatuado de coração mole e boca dura', peso: { tecnica: 0.2, tempero: 0.25, ponto: 0.45, apresentacao: 0.1 } },
];

export const NOMES_MOLHO = { bechamel: 'Bechamel', veloute: 'Velouté', holandesa: 'Holandês', molho_tomate: 'Tomate', espanhola: 'Espanhol' };
export const PONTOS_ALVO = {
  saignant: { nome: 'saignant (mal passado)', min: 49, max: 54 },
  a_point: { nome: 'à point (ao ponto)', min: 56, max: 61 },
};

export const PROVAS = [
  {
    id: 'faca', titulo: 'Prova 1: A Mise en Place da Humilhação', tempoMercado: 180, tempoCozinha: 420, eliminar: 4,
    resumo: 'Num prato: brunoise de cenoura, julienne de alho-poró, chiffonade de manjericão, tomate concassé e uma batata torneada.',
    dicas: ['Tomate concassé de verdade: branqueie na água fervendo, dê choque no gelo e só então corte.', 'O tourner tem 7 faces. Não 6. Não 8. Sete.'],
  },
  {
    id: 'molho', titulo: 'Prova 2: Respeite os Molhos-Mãe', tempoMercado: 180, tempoCozinha: 540, eliminar: 4,
    resumo: 'O sorteio decide qual dos cinco molhos-mãe de Escoffier você vai entregar, num prato, quente e liso.',
    dicas: ['Roux: manteiga e farinha em fogo médio, mexendo. Cozinhe antes de pôr o líquido.', 'Holandesa: gemas, manteiga clarificada e limão, entre 55 e 80 °C, com fouet. Passou de 87, talha.'],
  },
  {
    id: 'omelete', titulo: 'Prova 3: Omelete à Française', tempoMercado: 180, tempoCozinha: 420, eliminar: 3,
    resumo: 'Uma omelete francesa: lisa, sem cor nenhuma, enrolada e baveuse por dentro. Ervas finas são bem-vindas.',
    dicas: ['Bata os ovos no bowl com o fouet. Frigideira com manteiga em fogo médio, mexa sem parar no começo.', 'Aperte F pra enrolar quando estiver firme por fora e cremoso por dentro. Cor dourada é reprovação.'],
  },
  {
    id: 'steak', titulo: 'Prova 4: Steak au Poivre com Pommes Frites', tempoMercado: 180, tempoCozinha: 720, eliminar: 2,
    resumo: 'Um steak no ponto sorteado, com molho au poivre flambado no conhaque e batatas fritas crocantes.',
    dicas: ['Frites em duas etapas: 150 °C pra cozinhar, 180 °C pra dourar.', 'Sal antes de selar, frigideira bem quente, vire na metade e regue com manteiga no fim.'],
  },
  {
    id: 'final', titulo: 'Grande Final: Menu em Três Tempos', tempoMercado: 180, tempoCozinha: 1080, eliminar: 2, pratos: 3,
    resumo: 'Entrada, prato principal e sobremesa. Três pratos entregues no passe. Técnica, ponto e equilíbrio.',
    dicas: ['Sobremesa clássica: crème anglaise à la nappe (gemas, açúcar e leite a 82 °C, mexendo) com frutas.', 'Você pode entregar até três pratos. O que não for entregue não existe.'],
  },
];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const faixa = (v, min, max, folga) => (v >= min && v <= max ? 1 : clamp(1 - (v < min ? min - v : v - max) / folga));

function comidas(prato) {
  return prato ? prato.conteudo.filter((c) => c.id !== 'agua' && c.id !== 'gelo') : [];
}

// Qualidade de um molho ou preparo, de 0 a 1, com problemas e elogios.
export function avaliarPreparo(c, P, E) {
  let q = 0.7;
  const quente = (min) => { if (c.tN < min) { q -= 0.2; P.push('frio'); } };
  switch (c.id) {
    case 'bechamel':
      if (c.corRoux < 0.02) { q -= 0.2; P.push('farinha_crua'); }
      else if (c.corRoux > 0.35) { q -= 0.2; P.push('bechamel_escuro'); } else q += 0.1;
      if (c.noz > 0.2) { q += 0.1; E.push('noz_moscada'); }
      break;
    case 'veloute':
      if (c.corRoux > 0.75) { q -= 0.15; P.push('roux_escuro'); } else q += 0.1;
      if (c.corRoux < 0.02) { q -= 0.2; P.push('farinha_crua'); }
      break;
    case 'espanhola':
      if (c.mirepoix >= 2) { q += 0.1; E.push('mirepoix'); }
      break;
    case 'holandesa':
      if (c.clarificada) { q += 0.15; E.push('clarificada'); }
      if (c.tN < 45) { q -= 0.2; P.push('frio'); } else q += 0.1;
      break;
    case 'molho_tomate':
      if (c.concasse) { q += 0.15; E.push('concasse'); }
      if (c.def.pele) { q -= 0.15; P.push('pele'); }
      if (c.ervas) q += 0.05;
      break;
    case 'molho_au_poivre':
      if (c.flambado) { q += 0.1; E.push('flambado'); } else { q -= 0.25; P.push('alcool_cru'); }
      if (c.mignonnette) { q += 0.08; E.push('mignonnette'); }
      if (c.comFundo) q += 0.05;
      if (c.monte) q += 0.05;
      break;
    case 'creme_anglaise':
      q += 0.1; if (c.baunilha) { q += 0.1; E.push('baunilha'); }
      break;
    case 'maionese':
      if (c.noLiquidificador) { q -= 0.1; P.push('preguica'); } else { q += 0.1; E.push('emulsao_mao'); }
      if (c.dijon) q += 0.05;
      break;
    case 'beurre_blanc': q += 0.15; E.push('beurre_blanc'); break;
    case 'pure':
      if (c.gomoso) { q -= 0.45; P.push('gomoso'); } else { q += 0.1; E.push('pure_liso'); }
      break;
    case 'omelete': return avaliarOmelete(c, P, E);
    case 'molho_talhado': q = 0.1; P.push('talhado'); break;
    case 'gororoba': q = 0.05; P.push('gororoba'); break;
    case 'roux': q = 0.15; P.push('roux_puro'); break;
    case 'ovos_batidos': q = 0.15; P.push('ovo_cru'); break;
    case 'caramelo': q = 0.6; break;
    case 'coulis': q = c.comAcucar ? 0.75 : 0.6; break;
    case 'creme_legumes': q = c.cru ? 0.35 : 0.75; if (c.cru) P.push('gaspacho'); break;
    case 'vinagrete': q = 0.65; break;
    default: break;
  }
  if (['bechamel', 'veloute', 'espanhola', 'molho_tomate', 'molho_au_poivre'].includes(c.id)) {
    const e = faixa(c.espessura, 0.3, 1.2, 0.6);
    q += (e - 0.7) * 0.3;
    if (c.espessura < 0.3) P.push('ralo'); else if (c.espessura > 1.2) P.push('grosso'); else E.push('nappe');
    if (c.grumos > 0.35) { q -= 0.2; P.push('grumos'); }
    quente(55);
  }
  if (c.def.queimado) { q -= 0.4; P.push('queimado'); }
  return clamp(q);
}

function avaliarOmelete(c, P, E) {
  let q = 0.5;
  const bav = faixa(c.coag, 0.5, 0.82, 0.3);
  q += bav * 0.3;
  if (c.coag > 0.9) P.push('omelete_seca'); else if (c.coag < 0.45) P.push('omelete_crua'); else E.push('baveuse');
  const cor = Math.max(c.dA, c.dB);
  if (cor > 0.5) { q -= 0.35; P.push('omelete_bronzeada'); } else if (cor > 0.25) { q -= 0.12; P.push('omelete_corada'); } else { q += 0.12; E.push('sem_cor'); }
  if (c.cremoso > 1) { q += 0.08; E.push('cremosa'); }
  if (c.ervas > 0) { q += 0.08; E.push('fines_herbes'); }
  if (!c.comManteiga) { q -= 0.1; P.push('sem_manteiga'); }
  if (c.def.queimado) { q -= 0.4; P.push('queimado'); }
  return clamp(q);
}

// Qualidade genérica de um componente qualquer.
export function avaliarComponente(c, P, E, alvoPonto) {
  if (ehPreparo(c)) return avaliarPreparo(c, P, E);
  let q = 0.6;
  const d = Math.max(c.dA, c.dB), dmin = Math.min(c.dA, c.dB);
  if (ehProteina(c)) {
    let ponto;
    if (c.cat === 'ave') { ponto = c.tN < 70 ? 0 : faixa(c.tMax, 72, 79, 8); if (c.tN < 70) P.push('frango_cru'); else if (c.tMax > 82) P.push('seco'); }
    else if (c.cat === 'peixe') { ponto = faixa(c.tMax, 46, 58, 8); if (c.tMax < 40) P.push('cru'); else if (c.tMax > 64) P.push('seco'); }
    else if (c.cat === 'fruto_mar') { ponto = faixa(c.tMax, 52, 66, 8); if (c.tMax > 72) P.push('borracha'); if (c.tMax < 48) P.push('cru'); }
    else {
      const a = alvoPonto ? PONTOS_ALVO[alvoPonto] : { min: 50, max: 62 };
      ponto = faixa(c.tN, a.min, a.max, 9);
      if (c.tN < a.min - 4) P.push('carne_crua'); else if (c.tN > a.max + 4) P.push('carne_passada'); else if (alvoPonto) E.push('ponto_certo');
    }
    q = 0.25 + ponto * 0.5;
    if (!c.tec.frit && !c.tec.poche) {
      if (dmin >= 0.5 && d <= 1.3) { q += 0.15; E.push('crosta'); }
      else if (d < 0.3) { q -= 0.1; P.push('sem_crosta'); }
      else if (dmin < 0.3) { q -= 0.05; P.push('um_lado'); }
    }
    if (c.salAntes) { q += 0.05; E.push('sal_antes'); }
    if (c.corte === 'aparar') q += 0.04;
    if ((c.bonus.arrose || 0) > 4) { q += 0.06; E.push('arrose'); }
    if (c.tN < 40 && c.cat !== 'peixe') P.push('frio');
  } else if (ehVegetal(c)) {
    q = 0.5 + (c.corte ? c.qCorte * 0.3 : 0);
    if (c.tec.frit) {
      q = 0.35 + clamp(c.croc) * 0.4;
      if (c.croc < 0.5) P.push('frita_murcha'); else E.push('crocante');
      if (c.oleo > 0.4) { q -= 0.15; P.push('encharcada'); }
      if (c.cozido < 0.5) { q -= 0.15; P.push('crua_dentro'); }
      if (c.priFrit > 20 && c.croc > 0.5) { q += 0.1; E.push('dupla_fritura'); }
    } else if (c.cozido > 1.3) { q -= 0.25; P.push('papa'); }
    else if (c.cozido > 0.35) { q += 0.1; }
    if (c.tec.blanchi) { q += 0.08; E.push('branqueado'); }
  } else if (['gordura', 'seco', 'condimento', 'grao', 'alcool', 'tempero_doce'].includes(c.cat)) {
    q = 0.1; P.push('ingrediente_cru');
  } else if (c.cat === 'ovo') {
    q = c.coag > 0.5 ? 0.45 : 0.15; if (c.coag <= 0.5) P.push('ovo_cru');
  }
  if (c.def.queimado || c.def.queimada) { q *= 0.25; P.push('queimado'); }
  return clamp(q);
}

function notaTempero(lista, P, E) {
  const salgaveis = lista.filter((c) => !ehDoce(c) && !['gordura', 'tempero', 'seco'].includes(c.cat));
  if (!salgaveis.length) return 0.7;
  const s = salgaveis.reduce((a, c) => a + c.sal, 0) / salgaveis.length;
  if (s < 0.3) { P.push('sem_sal'); return 0.15; }
  if (s < 0.7) { P.push('pouco_sal'); return 0.5; }
  if (s > 4) { P.push('mar'); return 0.1; }
  if (s > 2.6) { P.push('salgado'); return 0.45; }
  E.push('tempero_certo');
  const pim = salgaveis.some((c) => c.pimenta > 0.2) ? 0.05 : 0;
  return clamp(0.85 + pim);
}

function notaApresentacao(lista, P, E, esperado) {
  if (!lista.length) return 0;
  let q = 0.6;
  if (lista.some((c) => ehPreparo(c) && defDe(c.id).liquido)) q += 0.1;
  const n = lista.length;
  if (n > 8) { q -= 0.25; P.push('buffet'); }
  else if (n >= 2 && n <= 6) q += 0.1;
  const extras = esperado ? n - esperado : 0;
  if (extras > 2) { q -= 0.05 * (extras - 2); P.push('sobras'); }
  if (lista.some((c) => c.def.queimado)) q -= 0.15;
  return clamp(q);
}

function notasDosJurados(sub, rng) {
  return JURADOS.map((j) => {
    let v = 0;
    for (const k in j.peso) v += j.peso[k] * sub[k];
    const nota = clamp(v * 10 + (rng() - 0.5) * 0.8, 0, 10);
    return { id: j.id, nome: j.nome, nota: Math.round(nota * 10) / 10 };
  });
}

// Avalia a entrega do jogador. pratos = lista de recipientes entregues.
export function avaliar(prova, pratos, ctx = {}, rng = Math.random) {
  const P = [], E = [];
  const sub = { tecnica: 0, tempero: 0, ponto: 0, apresentacao: 0 };
  const lista = pratos.flatMap(comidas);
  const comp = [];

  if (!lista.length) {
    P.push('prato_vazio');
    return fechar(sub, P, E, comp, rng);
  }

  if (prova.id === 'faca') {
    const alvos = [
      ['Brunoise de cenoura', (c) => c.id === 'cenoura' && c.corte === 'brunoise'],
      ['Julienne de alho-poró', (c) => c.id === 'alho_poro' && c.corte === 'julienne'],
      ['Chiffonade de manjericão', (c) => c.id === 'manjericao' && c.corte === 'chiffonade'],
      ['Tomate concassé', (c) => c.id === 'tomate' && c.corte === 'concasse'],
      ['Batata torneada', (c) => c.id === 'batata' && c.corte === 'tourner'],
    ];
    let soma = 0;
    for (const [nome, f] of alvos) {
      const achados = lista.filter(f).sort((a, b) => b.qCorte - a.qCorte);
      const c = achados[0];
      let q = 0;
      if (c) {
        q = 0.35 + 0.65 * c.qCorte;
        if (c.def.pele) { q -= 0.3; P.push('pele'); }
        if (c.id === 'tomate' && c.tec.blanchi) E.push('branqueado');
        if (c.cozido > 0.4) { q -= 0.2; P.push('cozinhou_corte'); }
      } else P.push('faltou:' + nome);
      comp.push({ nome, nota: clamp(q) });
      soma += clamp(q);
    }
    sub.tecnica = soma / alvos.length;
    const media = lista.filter((c) => c.corte).reduce((a, c) => a + c.qCorte, 0) / Math.max(1, lista.filter((c) => c.corte).length);
    if (media > 0.8) E.push('faca_precisa'); else if (media < 0.45) P.push('faca_cega');
    sub.ponto = sub.tecnica;
    sub.tempero = 0.6 + sub.tecnica * 0.3;
    sub.apresentacao = notaApresentacao(lista, P, E, 5);
  } else if (prova.id === 'molho') {
    const alvo = ctx.alvoMolho;
    const molho = lista.find((c) => c.id === alvo);
    let q = 0;
    if (molho) {
      q = avaliarPreparo(molho, P, E);
      comp.push({ nome: PREPAROS[alvo].nome, nota: q });
    } else {
      const outro = lista.find((c) => ehPreparo(c) && defDe(c.id).liquido);
      if (outro) { q = outro.id === 'molho_talhado' ? 0.1 : 0.25; P.push('molho_errado'); comp.push({ nome: outro.nome + ' (pediram outro)', nota: q }); }
      else { P.push('sem_molho'); comp.push({ nome: 'Molho', nota: 0 }); }
    }
    sub.tecnica = q;
    sub.ponto = molho ? clamp(faixa(molho.espessura ?? 0.6, 0.3, 1.2, 0.6) * 0.5 + q * 0.5) : q * 0.6;
    if (alvo === 'holandesa' && molho) sub.ponto = q;
    sub.tempero = notaTempero(molho ? [molho] : lista, P, E);
    sub.apresentacao = notaApresentacao(lista, P, E, 3);
  } else if (prova.id === 'omelete') {
    const om = lista.find((c) => c.id === 'omelete');
    let q;
    if (om) q = avaliarOmelete(om, P, E);
    else {
      const ovos = lista.find((c) => c.id === 'ovos_batidos');
      if (ovos && ovos.coag > 0.5) { q = 0.25; P.push('mexido'); }
      else { q = 0.05; P.push('sem_omelete'); }
    }
    comp.push({ nome: 'Omelete', nota: q });
    sub.tecnica = q;
    sub.ponto = om ? faixa(om.coag, 0.5, 0.82, 0.3) : q;
    sub.tempero = notaTempero(om ? [om] : lista, P, E);
    sub.apresentacao = notaApresentacao(lista, P, E, 2);
  } else if (prova.id === 'steak') {
    const carne = lista.filter((c) => c.cat === 'bovino').sort((a, b) => b.dA + b.dB - a.dA - a.dB)[0];
    const molho = lista.find((c) => c.id === 'molho_au_poivre');
    const frites = lista.filter((c) => c.id === 'batata' && c.tec.frit);
    const qc = carne ? avaliarComponente(carne, P, E, ctx.alvoPonto) : 0;
    if (!carne) P.push('sem_carne');
    const qm = molho ? avaliarPreparo(molho, P, E) : 0;
    if (!molho) P.push('sem_poivre');
    let qf = 0;
    if (frites.length) {
      qf = frites.reduce((a, c) => a + avaliarComponente(c, P, E), 0) / frites.length;
      if (frites.some((c) => c.corte !== 'batonnet')) { qf -= 0.1; P.push('frita_corte'); }
    } else P.push('sem_frites');
    comp.push({ nome: 'Steak', nota: qc }, { nome: 'Molho au poivre', nota: qm }, { nome: 'Pommes frites', nota: clamp(qf) });
    sub.tecnica = clamp(qc * 0.4 + qm * 0.35 + qf * 0.25);
    sub.ponto = carne ? faixa(carne.tN, PONTOS_ALVO[ctx.alvoPonto]?.min ?? 50, PONTOS_ALVO[ctx.alvoPonto]?.max ?? 62, 9) : 0;
    sub.tempero = notaTempero([carne, ...frites].filter(Boolean), P, E);
    sub.apresentacao = notaApresentacao(lista, P, E, 4);
  } else {
    // Final: classifica cada prato e avalia livremente.
    const tempos = { entrada: null, principal: null, sobremesa: null };
    for (const p of pratos) {
      const cs = comidas(p);
      if (!cs.length) continue;
      const tipo = cs.some(ehDoce) && !cs.some(ehProteina) ? 'sobremesa' : cs.some(ehProteina) ? 'principal' : 'entrada';
      const nota = avaliarLivre(cs, P, E);
      if (!tempos[tipo] || tempos[tipo].nota < nota) tempos[tipo] = { nota, cs };
    }
    let soma = 0;
    for (const t of ['entrada', 'principal', 'sobremesa']) {
      const n = tempos[t] ? tempos[t].nota : 0;
      if (!tempos[t]) P.push('faltou:' + t);
      comp.push({ nome: t[0].toUpperCase() + t.slice(1), nota: n });
      soma += n;
    }
    sub.tecnica = soma / 3;
    sub.ponto = soma / 3;
    sub.tempero = notaTempero(lista, P, E);
    sub.apresentacao = notaApresentacao(lista, P, E, 9);
    const tecnicas = new Set(lista.flatMap((c) => Object.keys(c.tec)));
    if (tecnicas.size >= 5) { E.push('repertorio'); sub.tecnica = clamp(sub.tecnica + 0.08); }
  }
  if (ctx.semTempo) P.push('mao_pra_cima');
  return fechar(sub, P, E, comp, rng);
}

export function avaliarLivre(cs, P, E) {
  if (!cs.length) return 0;
  const qs = cs.map((c) => avaliarComponente(c, P, E));
  let q = qs.reduce((a, b) => a + b, 0) / qs.length;
  if (cs.some((c) => ehPreparo(c) && defDe(c.id).liquido && c.id !== 'molho_talhado')) q += 0.08;
  if (cs.some((c) => c.tec.flambe)) { q += 0.04; E.push('flambado'); }
  return clamp(q);
}

function fechar(sub, P, E, comp, rng) {
  const jurados = notasDosJurados(sub, rng);
  const total = Math.round((jurados.reduce((a, j) => a + j.nota, 0) / jurados.length) * 10);
  return { total, sub, problemas: [...new Set(P)], elogios: [...new Set(E)], componentes: comp, jurados };
}

// Simulação da nota de um participante NPC.
export function simularNpc(npc, prova, rng = Math.random) {
  const g = (rng() + rng() + rng() - 1.5) / 1.5;
  let n = npc.habilidade * 0.85 + 0.1 + g * 0.14;
  if (npc.forte === prova.id) n += 0.08;
  if (npc.fraca === prova.id) n -= 0.1;
  let evento = null;
  const r = rng();
  if (r < 0.08) { n *= 0.45; evento = 'desastre'; }
  else if (r > 0.94) { n += 0.12; evento = 'brilhou'; }
  return { nota: Math.round(clamp(n) * 100), evento };
}

// Quem sai: os piores da rodada entre os ainda vivos.
export function eliminar(resultados, quantos) {
  const ord = [...resultados].sort((a, b) => a.nota - b.nota);
  return ord.slice(0, quantos).map((r) => r.id);
}
