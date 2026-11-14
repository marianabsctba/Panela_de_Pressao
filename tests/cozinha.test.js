import test from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../js/culinaria.js';
import { avaliar, PROVAS, simularNpc, eliminar } from '../js/provas.js';

const rodar = (r, seg, alvo, mexer = 0) => {
  const ev = [];
  for (let t = 0; t < seg; t += 0.1) {
    if (mexer) K.mexer(r, mexer, 0.1);
    ev.push(...K.passo(r, 0.1, alvo));
  }
  return ev;
};
const prov = (id) => PROVAS.find((p) => p.id === id);
const fixo = () => 0.5;

test('steak selado e virado chega ao ponto com crosta', () => {
  const f = K.novoRecipiente('frigideira');
  const carne = K.novaComida('file_mignon');
  K.temperar(carne, 'sal'); K.temperar(carne, 'sal');
  K.adicionar(f, carne);
  rodar(f, 50, K.alvoBoca(8));
  K.virar(f);
  let t = 0;
  while (carne.tN < 57 && t < 200) { rodar(f, 1, K.alvoBoca(8)); t++; }
  assert.ok(carne.tN >= 56 && carne.tN < 63, 'núcleo ' + carne.tN);
  assert.ok(carne.dA > 0.5 && carne.dB > 0.3, `crosta ${carne.dA}/${carne.dB}`);
  assert.ok(!carne.def.queimado);
  assert.ok(carne.salAntes);
});

test('esquecer o steak no fogo alto queima', () => {
  const f = K.novoRecipiente('frigideira');
  const carne = K.novaComida('entrecote');
  K.adicionar(f, carne);
  const ev = rodar(f, 140, K.alvoBoca(10));
  assert.ok(carne.def.queimado);
  assert.ok(ev.some((e) => e.tipo === 'queimou'));
});

test('roux e bechamel', () => {
  const p = K.novoRecipiente('panela');
  K.adicionar(p, K.novaComida('manteiga'));
  K.adicionar(p, K.novaComida('farinha'));
  rodar(p, 40, K.alvoBoca(5), 1);
  const roux = p.conteudo.find((c) => c.id === 'roux');
  assert.ok(roux, 'roux formou');
  K.adicionar(p, K.novaComida('leite'));
  K.temperar(p, 'sal'); K.temperar(p, 'noz_moscada');
  rodar(p, 90, K.alvoBoca(5), 1);
  const b = p.conteudo.find((c) => c.id === 'bechamel');
  assert.ok(b, 'bechamel formou: ' + p.conteudo.map((c) => c.id));
  K.temperar(p, 'sal');
  const prato = K.novoRecipiente('prato');
  K.transferir(p, prato);
  const res = avaliar(prov('molho'), [prato], { alvoMolho: 'bechamel' }, fixo);
  assert.ok(res.total > 55, 'nota ' + res.total + ' ' + res.problemas);
});

test('holandesa forma no fogo baixo com fouet e talha no fogo alto', () => {
  const s = K.novoRecipiente('sauteuse');
  ['gema', 'gema', 'manteiga', 'limao'].forEach((id) => K.adicionar(s, K.novaComida(id)));
  rodar(s, 60, K.alvoBoca(2), 2.6);
  assert.ok(s.conteudo.some((c) => c.id === 'holandesa'), s.conteudo.map((c) => c.id + ':' + c.tN.toFixed(0)).join());
  const ev = rodar(s, 80, K.alvoBoca(8), 2.6);
  assert.ok(ev.some((e) => e.tipo === 'talhou'));
});

test('omelete francesa sem cor', () => {
  const b = K.novoRecipiente('bowl');
  for (let i = 0; i < 3; i++) K.adicionar(b, K.novaComida('ovo'));
  rodar(b, 6, 22, 2.6);
  assert.ok(b.conteudo.some((c) => c.id === 'ovos_batidos'));
  K.temperar(b, 'sal');
  const f = K.novoRecipiente('frigideira');
  K.adicionar(f, K.novaComida('manteiga'));
  K.transferir(b, f);
  const ovos = f.conteudo.find((c) => c.id === 'ovos_batidos');
  let t = 0;
  while (ovos.coag < 0.6 && t < 300) { rodar(f, 1, K.alvoBoca(5), 1.2); t++; }
  const r = K.virar(f);
  assert.equal(r.acao, 'enrolou');
  const prato = K.novoRecipiente('prato');
  K.transferir(f, prato);
  const res = avaliar(prov('omelete'), [prato], {}, fixo);
  assert.ok(res.total >= 60, 'nota ' + res.total + ' ' + res.problemas);
  assert.ok(!res.problemas.includes('omelete_bronzeada'));
});

test('batata frita em duas etapas fica crocante', () => {
  const fr = K.novoRecipiente('fritadeira');
  const bat = K.novaComida('batata');
  K.cortar(bat, 'batonnet', 0.9);
  K.adicionar(fr, bat);
  rodar(fr, 90, 155);
  rodar(fr, 50, 185);
  assert.ok(bat.cozido > 0.6, 'cozido ' + bat.cozido);
  assert.ok(bat.croc > 0.5, 'croc ' + bat.croc);
  assert.ok(bat.priFrit > 20);
});

test('tomate concassé exige branquear e chocar', () => {
  const t1 = K.novaComida('tomate');
  K.cortar(t1, 'concasse', 0.9);
  assert.ok(t1.def.pele);
  const p = K.novoRecipiente('panela');
  K.adicionar(p, K.novaComida('agua')); K.adicionar(p, K.novaComida('agua'));
  const t2 = K.novaComida('tomate');
  K.adicionar(p, t2);
  rodar(p, 60, K.alvoBoca(10));
  assert.ok(t2.fervido);
  const b = K.novoRecipiente('bowl');
  K.adicionar(b, K.novaComida('gelo'));
  K.remover(p, t2); K.adicionar(b, t2);
  rodar(b, 120, 22);
  assert.ok(t2.chocado, 'tN ' + t2.tN);
  K.cortar(t2, 'concasse', 0.9);
  assert.ok(!t2.def.pele);
});

test('molho au poivre flambado', () => {
  const f = K.novoRecipiente('frigideira');
  const pim = K.novaComida('pimenta_grao'); K.cortar(pim, 'esmagar', 0.8);
  K.adicionar(f, pim); K.adicionar(f, K.novaComida('conhaque'));
  rodar(f, 15, K.alvoBoca(6));
  assert.equal(K.virar(f).acao, 'flambou');
  K.adicionar(f, K.novaComida('creme'));
  rodar(f, 30, K.alvoBoca(5), 1);
  const m = f.conteudo.find((c) => c.id === 'molho_au_poivre');
  assert.ok(m && m.flambado && m.mignonnette);
});

test('prova de faca premia cortes certos', () => {
  const prato = K.novoRecipiente('prato');
  const add = (id, corte) => { const c = K.novaComida(id); K.cortar(c, corte, 0.9); K.adicionar(prato, c); };
  add('cenoura', 'brunoise'); add('alho_poro', 'julienne'); add('manjericao', 'chiffonade'); add('batata', 'tourner');
  const tom = K.novaComida('tomate'); tom.fervido = tom.chocado = true; K.cortar(tom, 'concasse', 0.9); K.adicionar(prato, tom);
  const bom = avaliar(prov('faca'), [prato], {}, fixo);
  const vazio = avaliar(prov('faca'), [K.novoRecipiente('prato')], {}, fixo);
  assert.ok(bom.total > 70, 'bom ' + bom.total);
  assert.ok(vazio.total < 15, 'vazio ' + vazio.total);
});

test('npc e eliminação', () => {
  const n = simularNpc({ habilidade: 0.6 }, prov('faca'), fixo);
  assert.ok(n.nota > 30 && n.nota < 90);
  assert.deepEqual(eliminar([{ id: 'a', nota: 50 }, { id: 'b', nota: 10 }, { id: 'c', nota: 90 }], 1), ['b']);
});
