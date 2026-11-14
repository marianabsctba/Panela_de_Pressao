// Bancada do jogador: itens no mundo, fontes de calor, interações e visual sincronizado.
import * as THREE from 'three';
import * as K from './culinaria.js';
import { RECIPIENTES, INGREDIENTES, FERRAMENTAS, CORTES } from './dados.js';
import { malhaComida, chaveComida, malhaRecipiente, malhaFerramenta, malhaDecor, arrumarConteudo, atualizarCorComida, interno } from './objetos.js';
import { pecasInterativas, TOPO } from './bancada.js';
import { M } from './materiais.js';

const NIVEIS_FORNO = [0, 120, 140, 160, 180, 200, 220, 250];
const NIVEIS_FRIT = [0, 120, 140, 150, 160, 170, 180, 190, 200];
const VAGAS_CARRINHO = [];
for (const y of [TOPO, 0.45]) for (const z of [-0.12, 0.12]) for (const x of [-2.22, -2.04, -1.86, -1.68]) VAGAS_CARRINHO.push(new THREE.Vector3(x, y, z));

export class Cozinha {
  constructor(bancada, cena, efeitos, som, msg) {
    this.b = bancada; this.cena = cena; this.fx = efeitos; this.som = som; this.msg = msg;
    this.raiz = bancada.grupo;
    this.p = pecasInterativas(bancada);
    this.alvos = [];
    for (const h of this.p.hits) { this.raiz.add(h); this.alvos.push(h); }
    for (const d of this.p.despensa) {
      const m = malhaDecor(d.id); m.position.copy(d.pos); m.userData.ent = d;
      this.raiz.add(m); this.alvos.push(m);
    }
    this.itens = new Set();
    this.mao = null;
    this.maoGrupo = null;
    this.entregues = [];
    this.tVisual = 0;
    this.janelaMat = new THREE.MeshStandardMaterial({ color: 0x1a0800, emissive: 0xff6a1a, emissiveIntensity: 0, roughness: 0.1 });
    this.p.forno.janela.material = this.janelaMat;
    this.preparar();
  }

  // ---------- Criação e posicionamento ----------
  obj(item) {
    if (item.obj) {
      if (item.tipo === 'comida' && item.obj.userData.chave !== chaveComida(item)) {
        const velho = item.obj; const pai = velho.parent;
        const novo = malhaComida(item); novo.position.copy(velho.position); novo.rotation.copy(velho.rotation);
        if (pai) { pai.remove(velho); pai.add(novo); }
        const i = this.alvos.indexOf(velho); if (i >= 0) this.alvos[i] = novo;
        item.obj = novo; novo.userData.ent = item;
      }
      return item.obj;
    }
    const o = item.tipo === 'comida' ? malhaComida(item) : item.tipo === 'recipiente' ? malhaRecipiente(item.rtipo) : malhaFerramenta(item.id);
    o.userData.ent = item;
    item.obj = o;
    return o;
  }

  novo(item) { this.itens.add(item); if (item.tipo === 'recipiente') item.conteudo.forEach((c) => this.itens.add(c)); return item; }
  rec(rtipo) { return this.novo(K.novoRecipiente(rtipo)); }
  ferramenta(id) { return this.novo({ tipo: 'ferramenta', id, nome: FERRAMENTAS[id].nome, uid: 'f' + id + Math.random() }); }

  soltarDeOnde(item) {
    const o = item.onde;
    if (!o) return;
    if (o.tipo === 'boca') o.ent.rec = null;
    else if (o.tipo === 'tabua') this.p.tabua.comida = null;
    else if (o.tipo === 'forno') this.p.forno.rec = null;
    else if (o.tipo === 'rec') K.remover(o.rec, item);
    else if (o.tipo === 'mao') this.mao = null;
    const i = this.alvos.indexOf(item.obj);
    if (i >= 0) this.alvos.splice(i, 1);
    if (item.obj?.parent) item.obj.parent.remove(item.obj);
    item.onde = null;
  }

  colocar(item, onde, pos) {
    this.soltarDeOnde(item);
    const o = this.obj(item);
    item.onde = onde;
    o.rotation.set(0, 0, 0); o.scale.setScalar(1);
    switch (onde.tipo) {
      case 'sup': o.position.copy(pos); o.rotation.y = Math.random() * 0.6 - 0.3; this.raiz.add(o); this.alvos.push(o); break;
      case 'boca': o.position.copy(onde.ent.pos); onde.ent.rec = item; this.raiz.add(o); this.alvos.push(o); break;
      case 'tabua': o.position.copy(this.p.tabua.pos); this.p.tabua.comida = item; this.raiz.add(o); this.alvos.push(o); break;
      case 'forno': o.position.copy(this.p.forno.pos); this.p.forno.rec = item; this.raiz.add(o); break;
      case 'fixo': o.position.copy(pos); this.raiz.add(o); this.alvos.push(o); break;
      case 'mao': this.mao = item; o.position.set(0, item.tipo === 'recipiente' ? -0.06 : 0, 0); if (item.tipo === 'recipiente') o.scale.setScalar(0.7); if (item.tipo === 'ferramenta') o.rotation.y = Math.PI / 2 + 0.3; this.maoGrupo.add(o); break;
      case 'rec': onde.rec.conteudo.includes(item) || onde.rec.conteudo.push(item); this.marcar(onde.rec); break;
      case 'passe': o.position.copy(pos); this.cena.add(o); break;
    }
    if (item.tipo === 'recipiente') this.marcar(item);
  }

  marcar(rec) { rec.sujoVisual = true; }

  limpar() {
    for (const it of [...this.itens]) {
      if (it.obj?.parent) it.obj.parent.remove(it.obj);
      const i = this.alvos.indexOf(it.obj); if (i >= 0) this.alvos.splice(i, 1);
    }
    this.itens.clear();
    this.mao = null;
    for (const b of this.p.bocas) { b.rec = null; b.nivel = 0; }
    this.p.forno.rec = null; this.p.forno.temp = 0; this.p.tabua.comida = null;
  }

  preparar() {
    this.limpar();
    this.entregues = [];
    const P = (x, z, y = TOPO) => new THREE.Vector3(x, y, z);
    this.colocar(this.rec('panela'), { tipo: 'boca', ent: this.p.bocas[0] });
    this.colocar(this.rec('sauteuse'), { tipo: 'boca', ent: this.p.bocas[1] });
    this.colocar(this.rec('frigideira'), { tipo: 'boca', ent: this.p.bocas[2] });
    this.colocar(this.rec('assadeira'), { tipo: 'forno' });
    this.colocar(this.rec('bowl'), { tipo: 'sup' }, P(0.47, 0.32));
    this.colocar(this.rec('bowl'), { tipo: 'sup' }, P(0.78, 0.06));
    [0.52, 0.86, 1.2].forEach((x) => this.colocar(this.rec('prato'), { tipo: 'sup' }, P(x, -0.45, 1.4325)));
    this.colocar(this.ferramenta('fouet'), { tipo: 'sup' }, P(0.3, 0.47, TOPO + 0.005));
    this.colocar(this.ferramenta('colher'), { tipo: 'sup' }, P(-0.15, 0.47, TOPO + 0.005));
    this.liq = this.rec('liquidificador');
    this.colocar(this.liq, { tipo: 'fixo' }, P(0.5, -0.3));
    this.frit = this.rec('fritadeira'); this.frit.ajuste = 0;
    this.colocar(this.frit, { tipo: 'fixo' }, P(1.2, 0.28));
  }

  receberCompras(ids) {
    ids.slice(0, VAGAS_CARRINHO.length).forEach((id, i) => {
      const c = this.novo(K.novaComida(id));
      this.colocar(c, { tipo: 'sup' }, VAGAS_CARRINHO[i].clone());
    });
  }

  get recipientes() { return [...this.itens].filter((i) => i.tipo === 'recipiente'); }

  // ---------- Leitura do alvo ----------
  recDe(ent) {
    if (!ent) return null;
    if (ent.tipo === 'recipiente') return ent;
    if (ent.tipo === 'boca') return ent.rec;
    if (ent.tipo === 'forno') return ent.rec;
    return null;
  }

  pegavel(item) { return item.tipo !== 'recipiente' || RECIPIENTES[item.rtipo].pegavel; }

  // ---------- Interação principal (E / clique) ----------
  interagir(ent, ponto, fase) {
    const H = this.mao;
    if (!ent) { if (H) this.msg('Mire numa bancada, panela ou tábua pra largar.'); return; }
    switch (ent.tipo) {
      case 'despensa': return this.usarDespensa(ent, H);
      case 'superficie': {
        if (!H) return;
        const local = this.raiz.worldToLocal(ponto.clone());
        local.x = THREE.MathUtils.clamp(local.x, ent.min[0] + 0.06, ent.max[0] - 0.06);
        local.z = THREE.MathUtils.clamp(local.z, ent.min[1] + 0.06, ent.max[1] - 0.06);
        local.y = ent.y + (H.tipo === 'ferramenta' ? 0.005 : 0);
        this.colocar(H, { tipo: 'sup' }, local);
        return;
      }
      case 'boca': {
        if (H && H.tipo === 'recipiente' && RECIPIENTES[H.rtipo].fogo && !ent.rec) { this.colocar(H, { tipo: 'boca', ent }); this.som.estalo(600, 0.08, 0.3); return; }
        if (H && H.tipo === 'recipiente' && !RECIPIENTES[H.rtipo].fogo) return this.msg(`${H.nome} não vai ao fogo direto. A não ser que você queira derreter.`, 'ruim');
        if (ent.rec) return this.interagir(ent.rec, ponto, fase);
        if (H) return this.msg('Comida direto na chama? Isso é churrasco de favela gourmet. Ponha numa panela.');
        return this.msg('Use a roda do mouse (ou Z e X) pra acender e regular o fogo.');
      }
      case 'forno': {
        const f = ent;
        if (H && H.tipo === 'recipiente' && H.rtipo === 'assadeira' && !f.rec) { this.colocar(H, { tipo: 'forno' }); return this.msg('Assadeira no forno.'); }
        if (H && H.tipo === 'recipiente' && H.rtipo !== 'assadeira') return this.msg('No forno, só a assadeira. Panela de cabo plástico no forno é crime.');
        if (H && H.tipo === 'comida' && f.rec) return this.porDentro(f.rec, H);
        if (!H && f.rec) { this.colocar(f.rec, { tipo: 'mao' }); return this.msg('Assadeira pra fora. Cuidado que está ' + Math.round(this.mao.temp) + '°C.'); }
        return this.msg(f.rec ? 'Mãos ocupadas.' : 'Forno vazio. A assadeira está em algum lugar da sua vida.');
      }
      case 'tabua': {
        const t = ent;
        if (H && H.tipo === 'comida' && !t.comida) { this.colocar(H, { tipo: 'tabua' }); return this.msg('Na tábua. Aperte Espaço pra cortar.'); }
        if (t.comida) return this.interagir(t.comida, ponto, fase);
        if (H) return this.msg('A tábua é pra ingrediente, não pra ' + H.nome.toLowerCase() + '.');
        return;
      }
      case 'pia': {
        if (H && H.tipo === 'recipiente') {
          if (H.rtipo === 'prato') return this.msg('Água no prato de serviço? Sopa de nada, chef.');
          const r = K.adicionar(H, K.novaComida('agua'));
          if (!r.ok) return this.msg(r.msg, 'ruim');
          this.novo(H.conteudo[H.conteudo.length - 1]); this.marcar(H); this.som.estalo(500, 0.6, 0.25);
          return this.msg('Água da torneira. Aperte F na pia pra escorrer.');
        }
        if (H && H.tipo === 'comida') return this.msg(`Lavou ${H.nome.toLowerCase()}. Parabéns, o mínimo.`);
        return this.msg('Segure uma panela ou bowl pra pegar água.');
      }
      case 'gelo': {
        if (H && H.tipo === 'recipiente' && H.rtipo !== 'prato') {
          const r = K.adicionar(H, K.novaComida('gelo'));
          if (!r.ok) return this.msg(r.msg, 'ruim');
          this.novo(H.conteudo[H.conteudo.length - 1]); this.marcar(H);
          return this.msg('Gelo. Bowl com gelo é choque térmico pronto.');
        }
        return this.msg('Segure um bowl pra pegar gelo.');
      }
      case 'lixo': {
        if (!H) return this.msg('É uma lixeira. Ela não fala.');
        if (H.tipo === 'comida' && H.cat !== 'tempero') { this.descartar(H); return this.msg('Pro lixo. O desperdício foi anotado pelo Fumaça.'); }
        if (H.tipo === 'recipiente') { for (const c of [...H.conteudo]) { K.remover(H, c); this.itens.delete(c); c.obj?.parent?.remove(c.obj); } this.marcar(H); return this.msg('Esvaziou no lixo. Recomeçar também é técnica.'); }
        return this.msg('Não jogue isso fora, é patrimônio da produção.');
      }
      case 'passe': return this.entregar(fase);
      case 'recipiente': return this.usarRecipiente(ent, H);
      case 'comida': case 'ferramenta': {
        if (!H) { if (ent.onde?.tipo === 'rec') return; this.colocar(ent, { tipo: 'mao' }); return; }
        if (ent.tipo === 'comida' && H.tipo === 'comida' && H.cat === 'tempero') { K.temperar(ent, H.id); this.som.estalo(5000, 0.15, 0.2); return this.msg(`Uma pitada de ${H.nome.toLowerCase()} em ${ent.nome.toLowerCase()}.`); }
        if (ent.tipo === 'comida' && H.tipo === 'recipiente') return this.porDentro(H, ent);
        return this.msg('Uma coisa de cada vez. Você tem duas mãos, mas a produção só pagou uma.');
      }
      default: return;
    }
  }

  usarDespensa(d, H) {
    if (H && H.tipo === 'comida' && H.id === d.id) { this.soltarDeOnde(H); this.itens.delete(H); return this.msg(`${H.nome} de volta na prateleira.`); }
    if (H && H.tipo === 'recipiente' && INGREDIENTES[d.id].cat !== 'tempero') {
      const c = this.novo(K.novaComida(d.id));
      return this.porDentro(H, c);
    }
    if (H && H.tipo === 'recipiente') { K.temperar(H, d.id); this.marcar(H); return this.msg(`Pitada de ${INGREDIENTES[d.id].nome.toLowerCase()} em ${H.nome.toLowerCase()}.`); }
    if (H) return this.msg('Mãos ocupadas.');
    const c = this.novo(K.novaComida(d.id));
    this.colocar(c, { tipo: 'mao' });
    if (c.cat === 'tempero') this.msg(`${c.nome} na mão. E num recipiente ou ingrediente dá uma pitada. E na prateleira devolve.`);
  }

  porDentro(rec, c) {
    if (c.cat === 'tempero') { K.temperar(rec, c.id); this.marcar(rec); this.som.estalo(5000, 0.15, 0.2); return this.msg(`Uma pitada de ${c.nome.toLowerCase()} em ${rec.nome.toLowerCase()}.`); }
    const r = K.adicionar(rec, c);
    if (!r.ok) { if (c.onde == null) this.itens.delete(c); return this.msg(r.msg, 'ruim'); }
    K.remover(rec, c);
    this.colocar(c, { tipo: 'rec', rec });
    if (rec.temp > 140 && !K.ehLiquido(c)) this.som.estalo(2500, 0.5, 0.4);
    if (rec.rtipo === 'fritadeira' && rec.temp > 120) this.som.estalo(1800, 1.0, 0.5);
  }

  usarRecipiente(r, H) {
    const fixo = RECIPIENTES[r.rtipo].fixo;
    if (!H) {
      if (r.rtipo === 'liquidificador') {
        const res = K.liquidificar(r);
        if (res.item) this.novo(res.item);
        this.marcar(r); this.batendo = 1.6;
        return this.msg(res.msg, res.ok ? '' : 'ruim');
      }
      if (fixo) return this.tirarUm(r);
      this.colocar(r, { tipo: 'mao' });
      return;
    }
    if (H.tipo === 'comida') return this.porDentro(r, H);
    if (H.tipo === 'ferramenta') return this.msg('Segure R pra mexer com ' + H.nome.split(' ')[0].toLowerCase() + '.');
    if (H.tipo === 'recipiente') {
      if (H.conteudo.length) {
        const t = K.transferir(H, r);
        if (!t.ok) return this.msg(t.msg, 'ruim');
        this.marcar(H); this.marcar(r);
        return this.msg(`Despejou em ${r.nome.toLowerCase()}.`);
      }
      if (r.conteudo.length) {
        const t = K.transferir(r, H);
        if (!t.ok) return this.msg(t.msg, 'ruim');
        this.marcar(H); this.marcar(r);
        return this.msg(`Passou tudo pra ${H.nome.toLowerCase()}.`);
      }
      return this.msg('Os dois estão vazios. Que momento.');
    }
  }

  // ---------- Verter aos poucos ----------
  podeVerter(ent) {
    const H = this.mao;
    if (!H) return null;
    const para = this.recDe(ent);
    if (!para || para === H || RECIPIENTES[para.rtipo].oleo) return null;
    const temLiquido = H.tipo === 'recipiente' ? H.conteudo.some((c) => K.ehLiquido(c)) : (H.tipo === 'comida' && K.ehLiquido(H) && H.cat !== 'tempero');
    return temLiquido ? para : null;
  }

  verter(para, dt) {
    const H = this.mao;
    if (!H) return 0;
    const v = K.verterPorcao(H, para, dt * 0.35);
    this.marcar(para); if (H.tipo === 'recipiente') this.marcar(H);
    if (H.tipo === 'comida' && H.volume <= 1e-3) { this.descartar(H); this.msg('A embalagem acabou. Foi tudo pra panela.'); }
    // Filete de líquido e recipiente inclinado
    if (!this.filete) {
      this.filete = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.007, 1, 10, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.85 }));
      this.filete.castShadow = false; this.cena.add(this.filete);
    }
    const fonte = H.tipo === 'recipiente' ? H.conteudo.find((c) => K.ehLiquido(c)) : H;
    if (v > 0 && fonte && para.obj && H.obj) {
      const a = H.obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.04, 0));
      const b = para.obj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, interno(para.rtipo).fundo + 0.02, 0));
      const meio = a.clone().add(b).multiplyScalar(0.5);
      this.filete.position.copy(meio);
      this.filete.scale.set(1, a.distanceTo(b), 1);
      this.filete.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
      this.filete.material.color.setHex((K.defDe(fonte.id) || {}).cor ?? 0xffffff);
      this.filete.visible = true;
      H.obj.rotation.z = -0.9;
      this.som.nivel(this.som.borbulha, 0.15);
    } else this.pararFilete();
    return v;
  }

  pararFilete() {
    if (this.filete) this.filete.visible = false;
    if (this.mao?.obj) this.mao.obj.rotation.z = 0;
  }

  // G: tira um item sólido de dentro do recipiente para a mão
  tirarUm(r) {
    if (!r) return;
    if (this.mao) return this.msg('Mãos ocupadas.');
    const solidos = r.conteudo.filter((c) => !K.ehLiquido(c) && c.id !== 'gelo');
    const c = solidos.find((x) => K.ehProteina(x)) || solidos[solidos.length - 1];
    if (!c) return this.msg('Não tem nada sólido pra pegar. Líquido se despeja.');
    K.remover(r, c); c.onde = null; this.marcar(r);
    this.colocar(c, { tipo: 'mao' });
  }

  descartar(c) { this.soltarDeOnde(c); this.itens.delete(c); }

  // ---------- Outras ações ----------
  forcaMexer() {
    const H = this.mao;
    if (H?.tipo === 'ferramenta') return FERRAMENTAS[H.id].mexer;
    return 0.7;
  }
  mexer(ent, dt) {
    let r = this.recDe(ent);
    if (!r && this.mao?.tipo === 'recipiente') r = this.mao;
    if (!r || !r.conteudo.length) return false;
    K.mexer(r, this.forcaMexer(), dt);
    if (this.mao?.tipo !== 'ferramenta' && !this._avisouMao) { this._avisouMao = true; this.msg('Mexendo sem colher nem fouet. O Jacuzzi está anotando.'); }
    return true;
  }

  acaoF(ent) {
    if (ent?.tipo === 'pia') {
      if (this.mao?.tipo !== 'recipiente') return this.msg('Segure a panela pra escorrer.');
      const r = K.escorrer(this.mao); this.marcar(this.mao); return this.msg(r.msg, r.ok ? '' : 'ruim');
    }
    const r = this.recDe(ent) || (this.mao?.tipo === 'recipiente' ? this.mao : null);
    if (!r) return this.msg('F vira, flamba e enrola. Mire numa panela.');
    const res = K.virar(r);
    this.marcar(r);
    if (res.acao === 'flambou') { r.fogoAte = this.t + 2.6; this.som.fogo(); }
    if (res.acao === 'enrolou') { const om = r.conteudo.find((c) => c.id === 'omelete'); if (om) this.itens.add(om); }
    this.msg(res.msg, res.acao === 'nada' ? 'ruim' : 'bom');
    return res;
  }

  provar(ent) {
    const alvo = this.recDe(ent) || (ent?.tipo === 'comida' ? ent : null) || (this.mao && this.mao.tipo !== 'ferramenta' ? this.mao : null);
    if (!alvo) return this.msg('Provar o quê? O ar condicionado?');
    this.msg('Provou: ' + K.provar(alvo));
  }

  ajustar(ent, d) {
    if (!ent) return;
    if (ent.tipo === 'recipiente' && ent.onde?.tipo === 'boca') ent = ent.onde.ent;
    if (ent.tipo === 'boca') { ent.nivel = THREE.MathUtils.clamp(ent.nivel + d, 0, 10); this.som.tique(d > 0); return true; }
    if (ent.tipo === 'forno') { const i = THREE.MathUtils.clamp(NIVEIS_FORNO.indexOf(ent.temp) + d, 0, NIVEIS_FORNO.length - 1); ent.temp = NIVEIS_FORNO[i]; this.som.tique(d > 0); return true; }
    if (ent === this.frit) { const i = THREE.MathUtils.clamp(NIVEIS_FRIT.indexOf(ent.ajuste) + d, 0, NIVEIS_FRIT.length - 1); ent.ajuste = NIVEIS_FRIT[i]; this.som.tique(d > 0); return true; }
    return false;
  }

  cortesDe(ent) {
    const c = ent?.tipo === 'tabua' ? ent.comida : ent?.onde?.tipo === 'tabua' ? ent : null;
    if (!c) return null;
    return { comida: c, cortes: K.cortesPossiveis(c) };
  }

  aplicarCorte(c, corte, q) {
    const r = K.cortar(c, corte, q);
    if (r.substituir) {
      this.descartar(c);
      const [gema, clara] = r.substituir;
      this.novo(gema); this.novo(clara);
      this.colocar(gema, { tipo: 'tabua' });
      this.colocar(clara, { tipo: 'sup' }, new THREE.Vector3(0.12, TOPO, -0.02));
    } else if (r.ok) this.obj(c);
    this.msg(r.msg, r.ok ? 'bom' : 'ruim');
    return r;
  }

  entregar(fase) {
    const H = this.mao;
    if (fase !== 'cozinha') return this.msg('Calma. Ainda não é hora de entregar.');
    if (!H || H.tipo !== 'recipiente' || H.rtipo !== 'prato') return this.msg('Traga a comida num prato de serviço. Os jurados não comem da panela. Bom, o Fumaça come.');
    if (!H.conteudo.length) return this.msg('Prato vazio? Ousado. Burro, mas ousado.', 'ruim');
    if (!this.onEntregar || !this.onEntregar(H)) return;
    const n = this.entregues.length;
    this.soltarDeOnde(H);
    this.colocar(H, { tipo: 'passe' }, new THREE.Vector3(-0.6 + n * 0.6, 0.995, -11.15));
    this.entregues.push(H);
  }

  // ---------- Simulação e visual ----------
  update(dt, t, jogadorPos) {
    this.t = t;
    let chiado = 0, ferve = 0;
    for (const r of this.recipientes) {
      if (r.onde?.tipo === 'passe') continue;
      let alvo = 22;
      if (r.onde?.tipo === 'boca') alvo = K.alvoBoca(r.onde.ent.nivel);
      else if (r.onde?.tipo === 'forno') alvo = this.p.forno.temp || 22;
      else if (r === this.frit) alvo = this.frit.ajuste || 22;
      const n0 = r.conteudo.length;
      const ev = K.passo(r, dt, alvo);
      if (r.conteudo.length !== n0 || ev.length) this.marcar(r);
      for (const e of ev) this.evento(e, r);
      for (const c of r.conteudo) { this.itens.add(c); if (c.onde?.rec !== r) c.onde = { tipo: 'rec', rec: r }; }
      // Partículas
      const p = r.obj ? r.obj.getWorldPosition(new THREE.Vector3()) : null;
      if (p && r.onde?.tipo !== 'forno') {
        p.y += interno(r.rtipo).fundo + 0.03;
        const temSolido = r.conteudo.some((c) => !K.ehLiquido(c));
        if (r.fervendo) { this.fx.vapor(p, 1.2); ferve += 1; }
        else if (r.temp > 70 && r.conteudo.some((c) => K.ehAquoso(c))) this.fx.vapor(p, 0.4);
        if (r.temp > 150 && r.conteudo.length && r.rtipo !== 'fritadeira') { this.fx.fumaca(p, (r.temp - 150) / 150, false); chiado += temSolido ? 1 : 0.4; }
        if (r.rtipo === 'fritadeira' && r.temp > 130 && r.conteudo.length) { this.fx.vapor(p.setY(p.y - 0.02), 1); chiado += 1.2; }
        if (r.conteudo.some((c) => c.def.queimado || Math.max(c.dA, c.dB) > 1.3 || c.fumaca > 1)) this.fx.fumaca(p, 1.5, true);
        if (r.fogoAte && t < r.fogoAte) this.fx.chama(p, 1.4);
      }
    }
    // Comida solta esfria devagar; itens consumidos pelas regras saem da lista
    for (const it of this.itens) {
      if (it.tipo !== 'comida') continue;
      if (it.onde?.tipo === 'rec' && !it.onde.rec.conteudo.includes(it)) { this.itens.delete(it); continue; }
      if (it.onde && it.onde.tipo !== 'rec') it.tN += (22 - it.tN) * (1 - Math.exp(-0.004 * dt));
    }
    if (this.batendo > 0) { this.batendo -= dt; this.som.nivel(this.som.motor, 0.5); } else this.som.nivel(this.som.motor, 0);
    const perto = jogadorPos ? Math.max(0, 1 - jogadorPos.distanceTo(this.raiz.position) / 6) : 1;
    this.som.nivel(this.som.chiado, Math.min(0.5, chiado * 0.12) * perto);
    this.som.nivel(this.som.borbulha, Math.min(0.5, ferve * 0.2) * perto);

    // Chamas e botões
    for (const b of this.p.bocas) {
      b.chama.visible = b.nivel > 0;
      if (b.chama.visible) { const s = 0.6 + b.nivel * 0.07; b.chama.scale.set(s, s, 1 + Math.sin(t * 30 + b.idx) * 0.15); b.chama.material.opacity = 0.55 + Math.random() * 0.35; }
      b.botao.rotation.y = -b.nivel * 0.4;
    }
    this.p.forno.botao.rotation.y = -NIVEIS_FORNO.indexOf(this.p.forno.temp) * 0.5;
    this.janelaMat.emissiveIntensity = this.p.forno.temp > 0 ? 0.8 + Math.sin(t * 2) * 0.1 : 0;

    // Visual (a cada 0,15 s)
    this.tVisual -= dt;
    if (this.tVisual <= 0) {
      this.tVisual = 0.15;
      for (const r of this.recipientes) {
        if (!r.obj) continue;
        arrumarConteudo(r, r.obj, (c) => { const o = this.obj(c); o.userData.comida = c; return o; });
        const anc = r.obj.userData.ancora;
        for (const ch of [...anc.children]) if (ch.userData.comida && !r.conteudo.includes(ch.userData.comida)) anc.remove(ch);
      }
      for (const it of this.itens) if (it.tipo === 'comida' && it.obj) atualizarCorComida(it, it.obj);
    }
  }

  evento(e, r) {
    const nomes = { queimou: `${e.nome} queimou! O olfatômetro disparou.`, manteiga_queimou: 'A manteiga passou de noisette pra noire. Amargou.', fumacou: `${e.nome} passou do ponto de fumaça.`, talhou: `${e.nome} TALHOU. Calor demais na emulsão.`, preparo: `Formou: ${e.nome}!`, evaporou: `${e.nome} evaporou. Redução é técnica, sumiço é distração.`, transbordou: 'O leite subiu e derramou no fogão. Clássico.', chocou: `${e.nome} levou choque térmico. Cor fixada.`, derreteu: 'O gelo derreteu. Física, 1. Você, 0.' };
    const tipo = ['queimou', 'manteiga_queimou', 'fumacou', 'talhou', 'transbordou'].includes(e.tipo) ? 'ruim' : e.tipo === 'preparo' || e.tipo === 'chocou' ? 'bom' : '';
    if (nomes[e.tipo]) this.msg(nomes[e.tipo], tipo);
    if (e.tipo === 'preparo') this.som.bip(1046, 0.15, 'triangle', 0.2);
  }

  // Aroma dominante para o olfatômetro
  aroma() {
    let melhor = null;
    for (const r of this.recipientes) {
      if (r.onde?.tipo === 'passe') continue;
      const a = K.aroma(r);
      if (a && (!melhor || a.nivel > melhor.nivel)) melhor = a;
    }
    return melhor;
  }

  // Descrição para o HUD
  descrever(ent) {
    const H = this.mao;
    const d = [];
    const recInfo = (r) => {
      const linhas = [];
      const fonte = r.onde?.tipo === 'boca' ? ` · fogo ${r.onde.ent.nivel}/10` : r.onde?.tipo === 'forno' ? ` · forno ${this.p.forno.temp || 'desligado'}${this.p.forno.temp ? '°C' : ''}` : r === this.frit ? ` · ajuste ${this.frit.ajuste || 'desligada'}${this.frit.ajuste ? '°C' : ''}` : '';
      const t = Math.round(r.temp);
      linhas.push(`<b>${r.nome}</b> · <span class="${t > 60 ? 'quente' : t < 15 ? 'frio' : ''}">${t}°C</span>${r.fervendo ? ' · fervendo' : ''}${fonte}`);
      if (r.mexida > 0.15) linhas.push('mexendo ' + '▮'.repeat(Math.min(8, Math.ceil(r.mexida * 2.5))));
      for (const c of r.conteudo) linhas.push('• ' + (c.id === 'agua' ? `Água (${c.volume.toFixed(1)})` : c.id === 'gelo' ? 'Gelo' : K.descrever(c)));
      if (!r.conteudo.length) linhas.push('<i>vazio</i>');
      return linhas.join('<br>');
    };
    if (!ent) return { nome: '', dicas: '', info: '' };
    let nome = '', dicas = [], info = '';
    switch (ent.tipo) {
      case 'boca': nome = `Boca ${ent.idx + 1} · fogo ${ent.nivel}/10 (${K.alvoBoca(ent.nivel)}°C)`; dicas.push('Roda/Z/X: fogo'); if (ent.rec) { info = recInfo(ent.rec); dicas.push(H ? 'E: pôr dentro' : 'E: pegar', 'R: mexer', 'F: virar/flambar', 'G: tirar um', 'T: provar'); } else if (H?.tipo === 'recipiente') dicas.push('E: pôr no fogo'); break;
      case 'forno': nome = `Forno · ${ent.temp ? ent.temp + '°C' : 'desligado'}`; dicas.push('Roda/Z/X: temperatura'); if (ent.rec) { info = recInfo(ent.rec); dicas.push(H ? 'E: pôr na assadeira' : 'E: tirar a assadeira'); } else if (H?.rtipo === 'assadeira') dicas.push('E: pôr no forno'); break;
      case 'tabua': nome = 'Tábua de corte' + (ent.comida ? ': ' + ent.comida.nome : ''); if (ent.comida) { info = K.descrever(ent.comida); dicas.push('Espaço: cortar', 'E: pegar'); } else if (H?.tipo === 'comida') dicas.push('E: pôr na tábua'); break;
      case 'pia': nome = 'Pia'; dicas.push('E: encher de água', 'F: escorrer'); break;
      case 'gelo': nome = 'Balde de gelo'; dicas.push('E: gelo no recipiente'); break;
      case 'lixo': nome = 'Lixeira'; dicas.push('E: descartar ou esvaziar'); break;
      case 'superficie': nome = ent.nome[0].toUpperCase() + ent.nome.slice(1); if (H) dicas.push('E: largar aqui'); break;
      case 'despensa': nome = INGREDIENTES[ent.id].nome + ' (despensa)'; dicas.push(H?.id === ent.id ? 'E: devolver' : H?.tipo === 'recipiente' ? 'E: pôr no recipiente' : 'E: pegar'); break;
      case 'passe': nome = 'Mesa dos jurados'; dicas.push('E: entregar o prato'); break;
      case 'recipiente': nome = ent.nome; info = recInfo(ent); if (ent === this.liq) dicas.push(H ? 'E: pôr dentro' : 'E: bater'); else if (ent === this.frit) dicas.push('Roda/Z/X: temperatura', H ? 'E: fritar' : 'E: tirar'); else dicas.push(H ? (H.tipo === 'recipiente' ? (H.conteudo.length ? 'E: despejar aqui' : 'E: passar pra mão') : 'E: pôr dentro') : 'E: pegar', 'R: mexer', 'G: tirar um', 'T: provar'); break;
      case 'comida': nome = ent.nome; info = K.descrever(ent); dicas.push(H ? (H.cat === 'tempero' ? 'E: temperar' : H.tipo === 'recipiente' ? 'E: pôr no recipiente' : '') : 'E: pegar', 'T: provar'); break;
      case 'ferramenta': nome = ent.nome; dicas.push(H ? '' : 'E: pegar'); break;
      default: break;
    }
    return { nome, dicas: dicas.filter(Boolean).join('  ·  '), info };
  }

  descreverMao() {
    const H = this.mao;
    if (!H) return '';
    if (H.tipo === 'recipiente') return `Na mão: <b>${H.nome}</b>${H.conteudo.length ? ' com ' + H.conteudo.map((c) => c.nome.toLowerCase()).join(', ') : ' (vazio)'}`;
    if (H.tipo === 'ferramenta') return `Na mão: <b>${H.nome}</b> · R mexe com força ${FERRAMENTAS[H.id].mexer}`;
    return `Na mão: <b>${K.descrever(H)}</b>`;
  }
}
