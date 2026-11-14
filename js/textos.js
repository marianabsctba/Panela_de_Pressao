// Roteiro, elenco e veneno. Personagens fictícios e satíricos.

export const NOME_JOGO = 'Panela de Pressão 4D';
export const APRESENTADORA = 'Ana Paula Patrão';
export const TROFEU = 'Frango Dourado de Três Pernas';

export const PARTICIPANTES = [
  { id: 'kleber', nome: 'Kléber', idade: 38, bio: 'coach quântico de churrasco', habilidade: 0.48, forte: 'steak', fraca: 'omelete', corpo: { f: false, pele: 0xc58c64, cabelo: 'curto', corCabelo: 0x2a1c12, altura: 1.80, largura: 1.15, barba: true } },
  { id: 'jessica', nome: 'Jéssica Thayane', idade: 24, bio: 'influenciadora de air fryer', habilidade: 0.42, forte: 'omelete', fraca: 'molho', corpo: { f: true, pele: 0xe2b48c, cabelo: 'longo', corCabelo: 0xd8b060, altura: 1.63, largura: 0.95 } },
  { id: 'arlindo', nome: 'Seu Arlindo', idade: 67, bio: 'aposentado que cozinha pra família de 40', habilidade: 0.66, forte: 'molho', fraca: 'faca', corpo: { f: false, pele: 0x8a5a3c, cabelo: 'grisalho', corCabelo: 0xcfcfcf, altura: 1.70, largura: 1.1, oculos: true, bigode: true } },
  { id: 'bruna', nome: 'Bruna', idade: 29, bio: 'nutricionista com medo de manteiga', habilidade: 0.55, forte: 'faca', fraca: 'steak', corpo: { f: true, pele: 0xf0c8a8, cabelo: 'rabo', corCabelo: 0x4a2a18, altura: 1.66, largura: 0.92 } },
  { id: 'thigas', nome: 'Thiago "Thigas"', idade: 31, bio: 'sommelier de energético', habilidade: 0.38, forte: 'final', fraca: 'molho', corpo: { f: false, pele: 0xe8bc96, cabelo: 'topete', corCabelo: 0x1a1a1a, altura: 1.78, largura: 1.0 } },
  { id: 'neide', nome: 'Dona Neide', idade: 59, bio: 'rainha absoluta do pavê', habilidade: 0.62, forte: 'final', fraca: 'faca', corpo: { f: true, pele: 0xb07a54, cabelo: 'coque', corCabelo: 0x6a6a6a, altura: 1.58, largura: 1.12, oculos: true } },
  { id: 'ravi', nome: 'Ravi', idade: 27, bio: 'dev que faz sous-vide com Arduino', habilidade: 0.6, forte: 'steak', fraca: 'omelete', corpo: { f: false, pele: 0x9a6a48, cabelo: 'cacheado', corCabelo: 0x1a1210, altura: 1.75, largura: 0.95, oculos: true } },
  { id: 'patricia', nome: 'Patrícia', idade: 45, bio: 'advogada que cita o Código Civil enquanto refoga', habilidade: 0.7, forte: 'molho', fraca: 'steak', corpo: { f: true, pele: 0xf2cdb0, cabelo: 'chanel', corCabelo: 0x3a2214, altura: 1.68, largura: 0.96 } },
  { id: 'wesley', nome: 'Wesley', idade: 22, bio: 'ex-entregador que conhece todo restaurante pelo lado de fora', habilidade: 0.5, forte: 'faca', fraca: 'final', corpo: { f: false, pele: 0x6a4228, cabelo: 'raspado', corCabelo: 0x0a0a0a, altura: 1.74, largura: 1.0 } },
  { id: 'marcelle', nome: 'Marcelle', idade: 36, bio: 'chef autoral que nunca terminou um prato', habilidade: 0.64, forte: 'final', fraca: 'omelete', corpo: { f: true, pele: 0xd8a884, cabelo: 'longo', corCabelo: 0x8a2a1a, altura: 1.72, largura: 0.93 } },
  { id: 'gilmar', nome: 'Gilmar', idade: 50, bio: 'caminhoneiro do arroz carreteiro', habilidade: 0.52, forte: 'steak', fraca: 'molho', corpo: { f: false, pele: 0xc08860, cabelo: 'careca', corCabelo: 0x3a2a1a, altura: 1.76, largura: 1.25, bigode: true } },
  { id: 'yasmin', nome: 'Yasmin', idade: 26, bio: 'estudante de gastronomia do 2º semestre que já se acha Escoffier', habilidade: 0.68, forte: 'faca', fraca: 'final', corpo: { f: true, pele: 0x7a4a30, cabelo: 'afro', corCabelo: 0x1a1010, altura: 1.65, largura: 0.94 } },
  { id: 'otavio', nome: 'Otávio', idade: 41, bio: 'herdeiro que nunca lavou um prato', habilidade: 0.4, forte: 'final', fraca: 'faca', corpo: { f: false, pele: 0xf4d4b8, cabelo: 'lateral', corCabelo: 0xc8a868, altura: 1.83, largura: 1.02 } },
  { id: 'raquel', nome: 'Raquel', idade: 33, bio: 'enfermeira que corta com precisão cirúrgica', habilidade: 0.72, forte: 'faca', fraca: 'molho', corpo: { f: true, pele: 0xe0ac88, cabelo: 'coque', corCabelo: 0x2a1a10, altura: 1.62, largura: 0.95 } },
  { id: 'juninho', nome: 'Juninho', idade: 19, bio: 'menino do vídeo viral do ovo frito', habilidade: 0.5, forte: 'omelete', fraca: 'steak', corpo: { f: false, pele: 0xe6b890, cabelo: 'franja', corCabelo: 0x5a3a1a, altura: 1.70, largura: 0.9 } },
];

export const JURADOS_INFO = {
  jacuzzi: { corpo: { f: false, pele: 0xf0c8a8, cabelo: 'grisalho', corCabelo: 0xb8b0a8, altura: 1.82, largura: 1.18, roupa: 'dolma_preta', barriga: true } },
  risotto: { corpo: { f: true, pele: 0xf2d0b4, cabelo: 'preso', corCabelo: 0x5a3a22, altura: 1.67, largura: 0.9, roupa: 'dolma_branca' } },
  fumaca: { corpo: { f: false, pele: 0xd8a882, cabelo: 'careca', corCabelo: 0x2a2a2a, altura: 1.80, largura: 1.12, roupa: 'camiseta_preta', barba: true, tatuagem: true } },
  patrao: { corpo: { f: true, pele: 0xf0caa8, cabelo: 'chanel', corCabelo: 0x5a3a24, altura: 1.70, largura: 0.9, roupa: 'blazer' } },
};

export const ROTEIRO = {
  abertura: [
    ['patrao', 'Boa noite. Começa agora mais uma temporada do Panela de Pressão, o único reality de culinária em quatro dimensões.'],
    ['patrao', 'A quarta dimensão, como vocês sabem, é o cheiro. Sim, a produção instalou um olfatômetro. Não, não pedimos autorização da vigilância sanitária.'],
    ['patrao', 'Dezesseis cozinheiros amadores. Uma cozinha profissional. Três jurados que já fizeram gente chorar dentro da câmara fria.'],
    ['jacuzzi', 'Boa noite. Eu quero técnica. Eu quero sal. Se alguém me servir bechamel com grumo, eu volto pra França nadando.'],
    ['risotto', 'Eu quero equilíbrio. Delicadeza. E, por favor, ninguém me traga risoto. Eu sei o meu nome. Não precisa.'],
    ['fumaca', 'Eu quero ponto. Carne crua eu devolvo, carne passada eu devolvo na sua cara. Com carinho.'],
    ['patrao', 'O prêmio? O inigualável, o inexplicável, o ' + 'Frango Dourado de Três Pernas' + '. Ninguém sabe quem esculpiu. Ninguém sabe por que três pernas. Mas ele é seu, se vencer.'],
  ],
  mercado: [
    ['patrao', 'Vocês têm três minutos no mercado. Três. Não é passeio no shopping, não é feira orgânica de domingo. Corram.'],
  ],
  cozinhaInicio: [
    ['patrao', 'Tempo no relógio. Cozinhem como se a mãe de vocês estivesse assistindo. Porque ela está, e está com vergonha.'],
  ],
  julgamento: [
    ['patrao', 'Mãos pra cima! Acabou o tempo. Agora é a hora em que a autoestima de vocês encontra os jurados.'],
  ],
  final: [
    ['patrao', 'Chegamos à final. Três cozinheiros, três tempos, um frango dourado com uma perna a mais do que a natureza permite.'],
  ],
};

export const AVISOS_TEMPO = {
  300: 'Cinco minutos! Quem ainda não começou, começa a rezar.',
  120: 'Dois minutos! Montagem, gente. Prato bonito não se monta sozinho.',
  60: 'Um minuto! Isso não é hora de descobrir que o forno estava desligado.',
  30: 'Trinta segundos! Empratem!',
};

export const MERCADO_FRASES = [
  'Pega logo, não é museu.',
  'O tempo está correndo e você namorando um tomate.',
  'Isso é uma fava de baunilha de 38 reais. Use com responsabilidade.',
  'A cesta não é a sua bolsa de grife. Tem limite.',
];

// Falas dos jurados por problema ou elogio detectado.
export const FALAS = {
  prato_vazio: {
    jacuzzi: ['Você me entregou um prato vazio. É conceito? É protesto? É vergonha.'],
    risotto: ['O vazio tem sua poesia. Mas não tem sabor.'],
    fumaca: ['Mano. Não tem nada aqui. Nem a dignidade.'],
  },
  sem_sal: {
    jacuzzi: ['Cadê o sal? CADÊ O SAL? O sal custa centavos e você economizou na minha cara!', 'Sem sal. Na França isso é motivo de deportação.'],
    risotto: ['Falta sal. Falta vida. Falta um pouco de tudo, na verdade.'],
    fumaca: ['Tá insosso, parceiro. Parece comida de hospital em greve.'],
  },
  pouco_sal: {
    jacuzzi: ['Tímido no sal. Tímido é bom em festa, não em panela.'],
    risotto: ['Poderia ter um pouco mais de sal pra acordar os sabores.'],
    fumaca: ['Faltou uma pitadinha. Quase, quase.'],
  },
  salgado: {
    jacuzzi: ['Salgado! Você temperou ou derrubou o saleiro?'],
    risotto: ['O sal gritou mais alto que o resto. Não é uma conversa, é um monólogo.'],
    fumaca: ['Tá salgado, mano. Minha pressão subiu só de olhar.'],
  },
  mar: {
    jacuzzi: ['Isso é água do mar com decoração!'],
    risotto: ['Eu senti o oceano. Não era a intenção, eu acho.'],
    fumaca: ['Vou precisar de três litros de água e um cardiologista.'],
  },
  tempero_certo: {
    jacuzzi: ['O sal está correto. Eu não vou dizer que gostei. Mas está correto.'],
    risotto: ['Tempero muito bem colocado, com mão leve.'],
    fumaca: ['Tempero na medida. Respeito.'],
  },
  queimado: {
    jacuzzi: ['Queimado! Isso é carvão! Você quer fazer churrasco no meu paladar?'],
    risotto: ['Tem um amargor aqui que não é escolha. É acidente.'],
    fumaca: ['Queimou, irmão. Deu pra sentir do outro lado do estúdio. O olfatômetro apitou.'],
  },
  carne_crua: {
    jacuzzi: ['Crua! Esse boi ainda tem opinião política!'],
    risotto: ['Está crua demais pro ponto que foi pedido.'],
    fumaca: ['Tá crua. Um bom veterinário ainda salva.'],
  },
  carne_passada: {
    jacuzzi: ['Passou do ponto. Isso é sola de sapato. Eu tenho sapato melhor em casa.'],
    risotto: ['Perdeu a suculência no caminho. Uma pena.'],
    fumaca: ['Passou, mano. Pedi rosado, veio cinza. Cinza é cor de parede, não de carne.'],
  },
  ponto_certo: {
    jacuzzi: ['O ponto está perfeito. Não se acostume.'],
    risotto: ['Ponto preciso, rosado, uniforme. Lindo.'],
    fumaca: ['Ó o ponto disso! Agora sim. Agora você é cozinheiro.'],
  },
  frango_cru: {
    jacuzzi: ['Frango cru! Você quer me matar ao vivo?'],
    risotto: ['Frango cru não é ousadia, é risco sanitário.'],
    fumaca: ['Frango cru, mano. Isso é crime. Chama o advogado.'],
  },
  crosta: {
    jacuzzi: ['A crosta está bonita. Maillard trabalhou, ao contrário de você no mercado.'],
    risotto: ['Que selagem bonita, dourada por igual.'],
    fumaca: ['Crosta braba. Isso aqui tem crocância de verdade.'],
  },
  sem_crosta: {
    jacuzzi: ['Essa carne não foi selada, foi cozida no vapor da sua insegurança.'],
    risotto: ['Faltou cor. Faltou a reação de Maillard.'],
    fumaca: ['Cadê a crosta? Frigideira tem que estar quente, parça.'],
  },
  um_lado: {
    jacuzzi: ['Um lado dourado e o outro pálido. Você esqueceu de virar ou foi estilo?'],
    risotto: ['Desigual. Um lado conta uma história, o outro não.'],
    fumaca: ['Só um lado selado. Vira a carne, mano, ela tem dois lados igual toda história.'],
  },
  arrose: {
    jacuzzi: ['Regou com manteiga. Arroser. Isso é técnica, finalmente!'],
    risotto: ['Aquele perfume de manteiga regada. Lindo.'],
    fumaca: ['Banho de manteiga. É assim que se trata uma carne.'],
  },
  sal_antes: {
    jacuzzi: ['Salgou antes de selar. Como manda o figurino.'],
  },
  grumos: {
    jacuzzi: ['Grumos! Tem grumo nesse molho! Você usou fouet ou uma vassoura?'],
    risotto: ['A textura tem pedrinhas. Não é a pedra que eu queria.'],
    fumaca: ['Tem grumo aqui, mano. Parece mingau de quartel.'],
  },
  farinha_crua: {
    jacuzzi: ['Gosto de farinha crua! O roux precisa cozinhar! Cozinhar! Verbo transitivo!'],
    risotto: ['Ficou um gosto de farinha no fundo. O roux pedia mais tempo.'],
    fumaca: ['Gosto de cola de papel. Cozinha esse roux, irmão.'],
  },
  bechamel_escuro: {
    jacuzzi: ['Bechamel bege. Bechamel é BRANCO. Branco igual à sua cara agora.'],
    risotto: ['O roux passou do branco. A bechamel ficou bronzeada.'],
  },
  roux_escuro: { jacuzzi: ['Esse velouté levou roux escuro. Velouté não é espanhol, chef!'] },
  noz_moscada: {
    jacuzzi: ['Noz-moscada na bechamel. Alguém aqui leu um livro.'],
    risotto: ['Esse toque de noz-moscada, discreto. Muito bem.'],
  },
  nappe: {
    jacuzzi: ['Está nappe. Cobre a colher. Correto.'],
    risotto: ['Textura aveludada, cobre a colher como seda.'],
    fumaca: ['Textura linda, mano. Cola na colher que é uma beleza.'],
  },
  ralo: {
    jacuzzi: ['Isso é molho ou é chá? Está ralo!'],
    risotto: ['Ficou ralo, escorre sem pedir licença.'],
    fumaca: ['Ralinho, parça. Reduzir era o verbo.'],
  },
  grosso: {
    jacuzzi: ['Isso não é molho, é massa corrida! Dá pra rebocar parede!'],
    risotto: ['Espesso demais. Perdeu a leveza.'],
    fumaca: ['Tá grosso igual reboco, mano.'],
  },
  talhado: {
    jacuzzi: ['Talhou! Talhou! Você fez ovo mexido com manteiga e chamou de molho!'],
    risotto: ['A emulsão se rompeu. A gordura e a gema se separaram, como um casal cansado.'],
    fumaca: ['Talhou, irmão. Fogo alto em emulsão é pedir pra sofrer.'],
  },
  clarificada: { jacuzzi: ['Manteiga clarificada na holandesa. Ah, alguém prestou atenção na aula.'] },
  frio: {
    jacuzzi: ['Está frio! Frio! Isso foi feito ontem?'],
    risotto: ['Chegou frio. A temperatura também é ingrediente.'],
    fumaca: ['Tá gelado, mano. Igual meu coração quando vejo gente sem avental.'],
  },
  molho_errado: {
    jacuzzi: ['Eu pedi um molho e você me trouxe outro. Você não lê? Não escuta? Não sente?'],
    risotto: ['Muito interessante. Pena que não era o molho do sorteio.'],
    fumaca: ['Mano, o sorteio foi outro. Até o Wesley acertou.'],
  },
  sem_molho: {
    jacuzzi: ['Prova de molho sem molho. É uma ideia. Uma ideia ruim.'],
    fumaca: ['Cadê o molho, parceiro? Era a única coisa que tinha que ter.'],
  },
  pele: {
    jacuzzi: ['Concassé com pele! O tomate não foi branqueado! Escoffier está se revirando!'],
    risotto: ['A pele do tomate ficou ali, teimosa. Água fervendo, gelo, e ela sairia sozinha.'],
  },
  concasse: { risotto: ['Concassé perfeito, sem pele e sem semente. Delicado.'] },
  branqueado: {
    jacuzzi: ['Branqueou e deu choque térmico. Bom. Muito bom. Não conte pra ninguém que eu disse.'],
    risotto: ['A cor viva de quem passou pelo gelo. Lindo.'],
  },
  omelete_bronzeada: {
    jacuzzi: ['Omelete francesa NÃO TEM COR! Isso aqui voltou de Cancún bronzeada!'],
    risotto: ['Ela dourou. A omelete francesa é pálida, como um poeta.'],
    fumaca: ['Tá dourada, mano. Não é panqueca de lanchonete.'],
  },
  omelete_corada: { jacuzzi: ['Um pouco de cor. Pouco, mas eu vi. Eu sempre vejo.'] },
  omelete_seca: {
    jacuzzi: ['Seca! Baveuse é cremosa por dentro! Isso aqui é esponja de lavar louça!'],
    fumaca: ['Ressecou, irmão. Passou do ponto e não voltou.'],
  },
  omelete_crua: { jacuzzi: ['Está crua por dentro. Baveuse não é sopa!'] },
  baveuse: {
    jacuzzi: ['Baveuse. Cremosa por dentro. Exatamente. EXATAMENTE.'],
    risotto: ['Por dentro, um creme. Por fora, um lençol. Perfeita.'],
    fumaca: ['Molinha por dentro. Que omelete, mano.'],
  },
  sem_cor: { risotto: ['Sem nenhuma cor. Pálida e elegante, como deve ser.'] },
  fines_herbes: { risotto: ['As ervas finas trouxeram frescor. Lindo.'] },
  mexido: { jacuzzi: ['Isso é ovo mexido! Mexido! Eu pedi omelete, não café da manhã de hotel!'] },
  sem_omelete: { fumaca: ['Cadê a omelete, mano? Era só ovo. Só ovo.'] },
  sem_manteiga: { jacuzzi: ['Omelete sem manteiga? Você tem algum problema com a França?'] },
  alcool_cru: {
    jacuzzi: ['Não flambou o conhaque! Gosto de álcool cru! Isso é posto de gasolina!'],
    fumaca: ['Tá com gosto de cachaça de rodoviária, parça. Flamba isso.'],
  },
  flambado: {
    fumaca: ['Flambou bonito. Quase pegou fogo no meu bigode, mas valeu.'],
    risotto: ['O flambé trouxe profundidade, sem amargor.'],
  },
  mignonnette: { jacuzzi: ['Pimenta esmagada, não moída. Mignonnette. Correto.'] },
  sem_poivre: { jacuzzi: ['Steak au poivre sem poivre. É só steak. E nem tão steak assim.'] },
  sem_carne: { fumaca: ['Mano, cadê o steak? A prova tinha nome e sobrenome.'] },
  sem_frites: { fumaca: ['Sem fritas, irmão? Isso é crime contra a Bélgica.'] },
  frita_murcha: {
    jacuzzi: ['Batata frita murcha. Isso é triste. Triste!'],
    fumaca: ['Murchou, mano. Batata frita tem que fazer barulho.'],
  },
  encharcada: { fumaca: ['Batata encharcada de óleo. Dá pra acender lamparina.'] },
  crua_dentro: { jacuzzi: ['Batata crua por dentro! Por fora bonita, por dentro um tijolo!'] },
  crocante: { fumaca: ['Crocante! Ouviu esse barulho? Isso é música.'] },
  dupla_fritura: { jacuzzi: ['Fritura em dois tempos. Alguém aqui respeita a batata.'] },
  gomoso: {
    jacuzzi: ['Você bateu batata no liquidificador! Isso é cola! COLA!'],
    risotto: ['O purê ficou elástico. A batata não perdoa o liquidificador.'],
    fumaca: ['Dá pra colar papel de parede com isso, irmão.'],
  },
  pure_liso: { risotto: ['Purê liso, amanteigado, sedoso.'] },
  faca_precisa: {
    jacuzzi: ['Os cortes estão regulares. Eu medi com os olhos. Meus olhos são régua.'],
    risotto: ['Cortes precisos, iguais, bonitos de ver.'],
    fumaca: ['Faca afiada e mão firme. Respeito, mano.'],
  },
  faca_cega: {
    jacuzzi: ['Isso é brunoise? Isso é um acidente com uma cenoura!'],
    risotto: ['Os cortes estão irregulares. Cada pedaço tem um tamanho, uma personalidade.'],
    fumaca: ['Cortou com a faca ou com os dentes, parceiro?'],
  },
  cozinhou_corte: { jacuzzi: ['Era prova de corte e você cozinhou! Por quê? Por quê?'] },
  ingrediente_cru: {
    jacuzzi: ['Tem ingrediente cru jogado no prato. Isso é prato ou é despensa?'],
    fumaca: ['Farinha crua no prato, mano? Isso é cena de crime?'],
  },
  buffet: {
    risotto: ['Muita coisa no prato. Parece um buffet por quilo.'],
    fumaca: ['Tem mais coisa aqui que na minha geladeira.'],
  },
  sobras: { risotto: ['Tem coisa que não precisava estar aqui. Menos é mais.'] },
  papa: { jacuzzi: ['Legume cozido até virar papinha. É pra bebê?'] },
  seco: { fumaca: ['Ressecou, mano. Tá mais seco que o sertão em agosto.'] },
  borracha: { fumaca: ['Camarão borracha. Dá pra apagar o quadro com ele.'] },
  cru: { fumaca: ['Tá cru, mano. Isso aqui ainda nada.'] },
  ovo_cru: { jacuzzi: ['Ovo cru no prato! Você quer me dar salmonela de sobremesa?'] },
  roux_puro: { jacuzzi: ['Você me entregou roux puro. Isso é o começo do molho, não o molho!'] },
  gororoba: { fumaca: ['O que é isso, irmão? Tem nome? Tem CPF?'] },
  gaspacho: { risotto: ['Ficou com gosto de legume cru batido. Um gaspacho por acidente.'] },
  repertorio: {
    jacuzzi: ['Muitas técnicas num menu só. Você estudou. Eu odeio admitir, mas estudou.'],
    risotto: ['Um repertório bonito, cada técnica no lugar certo.'],
  },
  preguica: { jacuzzi: ['Maionese no liquidificador. Preguiça! O fouet está ali chorando!'] },
  emulsao_mao: { jacuzzi: ['Emulsão no fouet, na mão. Braço de cozinheiro de verdade.'] },
  baunilha: { risotto: ['Fava de baunilha de verdade. Dá pra sentir a diferença.'] },
  mao_pra_cima: { fumaca: ['Entregou no grito do tempo. Coração na boca, hein?'] },
};

export const GENERICAS = {
  alta: {
    jacuzzi: ['Isso aqui... isso aqui é bom. Não chore, eu odeio quando choram.', 'Eu serviria isso no meu restaurante. Na mesa dos fundos, mas serviria.'],
    risotto: ['Um prato que conversa comigo. Tem equilíbrio e tem alma.', 'Delicado, preciso, generoso. Que lindo.'],
    fumaca: ['Mano. Que prato. Vou pedir bis e não vou dividir.', 'Isso aqui é comida de verdade, parceiro. Tô feliz.'],
  },
  media: {
    jacuzzi: ['Está correto. Correto não ganha troféu.', 'Não é uma vergonha. Mas não é um orgulho.'],
    risotto: ['Tem coisas boas aqui, mas falta harmonia entre elas.', 'Promissor. Ainda não chegou lá.'],
    fumaca: ['Tá ok, mano. Ok é a nota do meio da nota.', 'Comeria. Não pediria de novo, mas comeria.'],
  },
  baixa: {
    jacuzzi: ['Você tem vergonha? Porque a panela tem!', 'Isso aqui é uma ofensa pra cozinha francesa, pra brasileira e pra qualquer cozinha com azulejo.'],
    risotto: ['Eu não sei o que você quis dizer com esse prato. Acho que nem o prato sabe.', 'Faltou tudo. Inclusive coragem pra entregar.'],
    fumaca: ['Mano, eu gosto de você. Do prato, não.', 'Isso aqui tá triste, irmão. Triste igual segunda-feira chuvosa.'],
  },
};

export const NPC_EVENTOS = [
  '{n} pôs fogo no pano de prato. Os bombeiros da produção já têm o nome {n} decorado.',
  '{n} está chorando dentro da câmara fria. De novo.',
  '{n} cortou o dedo e pediu um curativo dourado, pra combinar com o estúdio.',
  '{n} derrubou um litro de creme de leite no chão. A câmera 3 escorregou.',
  '{n} está mexendo o molho com o cabo da colher. O Jacuzzi viu.',
  '{n} perguntou se pode usar air fryer. Não pode.',
  '{n} está flambando sem necessidade nenhuma. Só pelo espetáculo.',
  '{n} esqueceu o forno ligado vazio. O forno está feliz, pelo menos.',
  '{n} tirou uma selfie com a frigideira. A Helena suspirou.',
  '{n} está provando tudo com a mesma colher. O Fumaça anotou.',
  '{n} gritou "SIM, CHEF!" pra ninguém.',
  '{n} jura que essa técnica é "da avó". A avó não foi consultada.',
];

export const NPC_FALAS = [
  'Não posso conversar, meu roux está numa fase delicada.',
  'Você viu onde foi parar a minha échalote? Ela tinha nome.',
  'Eu vim pelo troféu. Ninguém vem pelo troféu. Mas eu vim.',
  'Se eu sair hoje, saio com honra. E com uma fava de baunilha no bolso.',
  'O Jacuzzi olhou pra mim. Eu senti na alma.',
  'Isso é holandesa ou eu estou alucinando de calor?',
  'Sai da minha bancada, eu tenho TOC com mise en place.',
  'Ouvi dizer que o frango dourado é amaldiçoado.',
];

export const PRATOS_NPC = {
  faca: ['uma brunoise de tamanhos variados, quase arte abstrata', 'uma julienne linda e um tomate com pele', 'cortes perfeitos, e uma batata torneada com 9 faces', 'uma chiffonade que parece grama cortada'],
  molho: ['um molho com grumos do tamanho de um dado', 'um molho liso e aveludado, raiva dos rivais', 'um molho que talhou no último minuto', 'um molho tão grosso que segurou a colher em pé'],
  omelete: ['uma omelete bronzeada de praia', 'uma omelete baveuse perfeita', 'um ovo mexido que jurou ser omelete', 'uma omelete enrolada com ervas finas'],
  steak: ['um steak bleu, quase mugindo', 'um steak no ponto com fritas murchas', 'um au poivre sem flambar, com gosto de posto', 'um steak perfeito com fritas crocantes'],
  final: ['um menu ambicioso e uma sobremesa esquecida', 'três pratos coerentes e muito bem executados', 'uma entrada linda e um principal cru', 'um crème anglaise de dar inveja'],
};

export const ELIMINACAO = {
  npc: [
    '{n}, infelizmente, hoje você deixa o Panela de Pressão. Pode tirar o avental. Devagar, que ele é alugado.',
    '{n}, sua jornada termina aqui. Leve com você a experiência, as lições e nenhum frango dourado.',
    '{n}, por favor, deixe a bancada. E a fava de baunilha que está no seu bolso também.',
  ],
  jogador: [
    'Você deixa o Panela de Pressão hoje. A cozinha agradece a visita. As panelas, nem tanto.',
  ],
  salvo: 'Você segue na competição. Respira. Mas não relaxa.',
};

export const FINAL = {
  vitoria: [
    ['patrao', 'Depois de cinco provas, muitos grumos e um incêndio controlado...'],
    ['patrao', 'Quem leva o título do Panela de Pressão 4D é... VOCÊ!'],
    ['jacuzzi', 'Eu vou dizer uma vez só e nunca mais: parabéns. Agora vai embora antes que eu mude de ideia.'],
    ['risotto', 'Você cozinhou com alma. E com sal. Mais com sal.'],
    ['fumaca', 'Vem cá, me dá um abraço. Sem avental, que tá todo sujo de holandesa.'],
    ['patrao', 'Receba o Frango Dourado de Três Pernas. Ele é pesado, é estranho e é seu. Não pergunte sobre a terceira perna.'],
  ],
  derrota: [
    ['patrao', 'Quem leva o título do Panela de Pressão 4D é... {n}!'],
    ['patrao', 'Você chegou à final, o que já é mais do que o forno da bancada 9 conseguiu. Parabéns pelo vice.'],
    ['fumaca', 'Mano, segunda temporada tá aí. Volta.'],
  ],
};

export function sortear(lista, rng = Math.random) {
  return lista[Math.floor(rng() * lista.length)];
}
export const preencher = (t, n) => t.replaceAll('{n}', n);
