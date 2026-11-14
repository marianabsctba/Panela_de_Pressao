// Catálogo do jogo: ingredientes, cortes clássicos e recipientes.
// Nada aqui depende do Three.js, para rodar nos testes do Node.

export const CORTES = {
  brunoise: { nome: 'Brunoise', desc: 'cubinhos de 3 mm, precisão de relojoeiro', golpes: 10, vel: 1.6, zona: 0.15 },
  ciseler: { nome: 'Ciseler', desc: 'picado fino de cebola e échalote, sem esmagar', golpes: 8, vel: 1.5, zona: 0.16 },
  julienne: { nome: 'Julienne', desc: 'palitos de 3 mm por 5 cm', golpes: 8, vel: 1.5, zona: 0.15 },
  batonnet: { nome: 'Bâtonnet', desc: 'bastões de 6 mm, base da batata frita', golpes: 6, vel: 1.3, zona: 0.18 },
  mirepoix: { nome: 'Mirepoix', desc: 'cubos rústicos de 1,5 cm para fundos e molhos', golpes: 4, vel: 1.1, zona: 0.22 },
  paysanne: { nome: 'Paysanne', desc: 'lâminas finas e quadradas', golpes: 7, vel: 1.4, zona: 0.17 },
  emincer: { nome: 'Émincer', desc: 'fatias finas e regulares', golpes: 6, vel: 1.3, zona: 0.18 },
  chiffonade: { nome: 'Chiffonade', desc: 'folhas enroladas em tiras finíssimas', golpes: 7, vel: 1.5, zona: 0.15 },
  hacher: { nome: 'Hacher', desc: 'picado fino de ervas e alho', golpes: 8, vel: 1.6, zona: 0.16 },
  concasse: { nome: 'Concassé', desc: 'tomate pelado, sem semente, em cubos', golpes: 6, vel: 1.3, zona: 0.17 },
  tourner: { nome: 'Tourner', desc: 'tornear em barril de 7 faces iguais', golpes: 7, vel: 2.1, zona: 0.09 },
  esmagar: { nome: 'Mignonnette', desc: 'grãos esmagados com o fundo da panela', golpes: 4, vel: 1.0, zona: 0.24 },
  aparar: { nome: 'Parer', desc: 'aparar nervo, membrana e excesso', golpes: 4, vel: 1.1, zona: 0.2 },
  filetar: { nome: 'Lever les filets', desc: 'filetar e tirar espinhas', golpes: 6, vel: 1.4, zona: 0.16 },
  separar: { nome: 'Separar o ovo', desc: 'gema para um lado, clara para o outro', golpes: 2, vel: 1.2, zona: 0.2 },
};

// cat: legume, tuberculo, tomate, folha, erva, fruta, bovino, ave, peixe, fruto_mar,
//      ovo, gema, clara, liquido, gordura, seco, tempero, grao, alcool, gelo
// forma: usada pelo visual. cor/corInterna: hex.
const I = (nome, cat, secao, cor, forma, extra = {}) => ({ nome, cat, secao, cor, forma, ...extra });

const ALL = ['brunoise', 'ciseler', 'julienne', 'mirepoix', 'paysanne', 'emincer'];

export const INGREDIENTES = {
  // Hortifrúti
  cebola: I('Cebola', 'legume', 'Hortifrúti', 0xc9a36a, 'esfera', { corInterna: 0xf1ead2, cortes: ['brunoise', 'ciseler', 'julienne', 'mirepoix', 'emincer'], preco: 2 }),
  cebola_roxa: I('Cebola roxa', 'legume', 'Hortifrúti', 0x7a2f5a, 'esfera', { corInterna: 0xe7c9dc, cortes: ['brunoise', 'ciseler', 'julienne', 'emincer'], preco: 3 }),
  echalote: I('Échalote', 'legume', 'Hortifrúti', 0xa86a4a, 'esfera_peq', { corInterna: 0xeed7d2, cortes: ['ciseler', 'brunoise', 'emincer'], preco: 9 }),
  alho: I('Alho', 'legume', 'Hortifrúti', 0xf0e8d8, 'esfera_peq', { corInterna: 0xf5efd9, cortes: ['hacher', 'emincer'], preco: 2 }),
  alho_poro: I('Alho-poró', 'legume', 'Hortifrúti', 0xb8d68a, 'alongado', { corInterna: 0xe9f2d0, cortes: ['julienne', 'emincer', 'paysanne', 'brunoise', 'mirepoix'], preco: 6 }),
  cenoura: I('Cenoura', 'legume', 'Hortifrúti', 0xe8731f, 'cone', { corInterna: 0xf08a33, cortes: ['brunoise', 'julienne', 'mirepoix', 'paysanne', 'emincer', 'tourner', 'batonnet'], preco: 2 }),
  salsao: I('Salsão', 'legume', 'Hortifrúti', 0x9cc46a, 'alongado', { corInterna: 0xc9e39b, cortes: ['brunoise', 'mirepoix', 'emincer', 'julienne'], preco: 4 }),
  batata: I('Batata asterix', 'tuberculo', 'Hortifrúti', 0xb98a5a, 'oval', { corInterna: 0xf3e2a8, cortes: ['batonnet', 'tourner', 'brunoise', 'mirepoix', 'emincer', 'paysanne'], preco: 2 }),
  tomate: I('Tomate italiano', 'tomate', 'Hortifrúti', 0xd8231c, 'esfera', { corInterna: 0xe0402e, cortes: ['concasse', 'emincer', 'brunoise'], preco: 3 }),
  abobrinha: I('Abobrinha', 'legume', 'Hortifrúti', 0x3f7a2a, 'alongado', { corInterna: 0xe3edbf, cortes: ['brunoise', 'julienne', 'paysanne', 'emincer', 'tourner'], preco: 3 }),
  berinjela: I('Berinjela', 'legume', 'Hortifrúti', 0x3a1838, 'alongado', { corInterna: 0xe9e2c2, cortes: ['brunoise', 'mirepoix', 'emincer'], preco: 4 }),
  pimentao: I('Pimentão vermelho', 'legume', 'Hortifrúti', 0xc81d12, 'esfera', { corInterna: 0xd92b1d, cortes: ['brunoise', 'julienne', 'emincer'], preco: 4 }),
  cogumelo: I('Cogumelo Paris', 'legume', 'Hortifrúti', 0xe9dfcf, 'cogumelo', { corInterna: 0xf1e8d8, cortes: ['emincer', 'brunoise', 'mirepoix', 'tourner'], preco: 8 }),
  aspargo: I('Aspargo verde', 'legume', 'Hortifrúti', 0x5d8f3a, 'alongado_fino', { corInterna: 0xb5d78a, cortes: ['emincer', 'aparar'], preco: 14 }),
  espinafre: I('Espinafre', 'folha', 'Hortifrúti', 0x2f6b24, 'folhas', { cortes: ['chiffonade'], preco: 4 }),
  alface: I('Alface americana', 'folha', 'Hortifrúti', 0x8fc45a, 'folhas', { cortes: ['chiffonade'], preco: 3 }),
  rucula: I('Rúcula', 'folha', 'Hortifrúti', 0x3d7f2a, 'folhas', { cortes: ['chiffonade'], preco: 4 }),
  manjericao: I('Manjericão', 'erva', 'Hortifrúti', 0x2e8a2e, 'ramo', { cortes: ['chiffonade', 'hacher'], preco: 3 }),
  salsinha: I('Salsinha', 'erva', 'Hortifrúti', 0x2f8f3a, 'ramo', { cortes: ['hacher', 'chiffonade'], preco: 2 }),
  cebolinha: I('Ciboulette', 'erva', 'Hortifrúti', 0x3c9a3c, 'ramo', { cortes: ['hacher', 'emincer'], preco: 3 }),
  estragao: I('Estragão', 'erva', 'Hortifrúti', 0x4f8f3a, 'ramo', { cortes: ['hacher', 'chiffonade'], preco: 11 }),
  tomilho: I('Tomilho', 'erva', 'Hortifrúti', 0x5b7a3a, 'ramo', { cortes: ['hacher'], preco: 4 }),
  alecrim: I('Alecrim', 'erva', 'Hortifrúti', 0x4a6b3a, 'ramo', { cortes: ['hacher'], preco: 3 }),
  louro: I('Louro', 'erva', 'Hortifrúti', 0x6b8a3a, 'ramo', { cortes: [], preco: 2 }),
  limao: I('Limão siciliano', 'fruta', 'Hortifrúti', 0xf2d93b, 'oval', { corInterna: 0xf7ec90, cortes: ['emincer'], acido: true, preco: 4 }),
  laranja: I('Laranja', 'fruta', 'Hortifrúti', 0xf08a1c, 'esfera', { corInterna: 0xf5a34a, cortes: ['emincer'], acido: true, preco: 2 }),
  maca: I('Maçã verde', 'fruta', 'Hortifrúti', 0x8fc43a, 'esfera', { corInterna: 0xf3f0c8, cortes: ['brunoise', 'emincer', 'julienne', 'tourner'], preco: 3 }),
  pera: I('Pera', 'fruta', 'Hortifrúti', 0xc9c45a, 'oval', { corInterna: 0xf3f0d8, cortes: ['brunoise', 'emincer', 'tourner'], preco: 4 }),
  morango: I('Morango', 'fruta', 'Hortifrúti', 0xd8152a, 'esfera_peq', { corInterna: 0xe8505a, cortes: ['emincer', 'brunoise'], doce: true, preco: 6 }),
  framboesa: I('Framboesa', 'fruta', 'Hortifrúti', 0xc0183f, 'esfera_peq', { corInterna: 0xd03050, cortes: [], doce: true, preco: 18 }),
  banana: I('Banana-prata', 'fruta', 'Hortifrúti', 0xf2d24a, 'alongado', { corInterna: 0xf6ecc0, cortes: ['emincer'], doce: true, preco: 1 }),

  // Açougue e peixaria (refrigerados)
  file_mignon: I('Filé mignon', 'bovino', 'Açougue', 0x9a1f22, 'bife', { geladeira: true, cortes: ['aparar'], preco: 89 }),
  entrecote: I('Entrecôte', 'bovino', 'Açougue', 0xa02a28, 'bife', { geladeira: true, cortes: ['aparar'], preco: 69 }),
  magret: I('Magret de pato', 'ave_rosada', 'Açougue', 0x8a2430, 'bife', { geladeira: true, cortes: ['aparar'], preco: 79 }),
  peito_frango: I('Peito de frango', 'ave', 'Açougue', 0xf0c0b0, 'bife', { geladeira: true, cortes: ['aparar', 'emincer'], preco: 19 }),
  carre_cordeiro: I('Carré de cordeiro', 'bovino', 'Açougue', 0xb03a3a, 'bife', { geladeira: true, cortes: ['aparar'], preco: 120 }),
  lardons: I('Bacon em lardons', 'bovino_gordo', 'Açougue', 0xd88a8a, 'bife', { geladeira: true, cortes: ['emincer'], preco: 22 }),
  salmao: I('Salmão', 'peixe', 'Peixaria', 0xf27f4a, 'filé', { geladeira: true, cortes: ['aparar', 'filetar'], preco: 75 }),
  robalo: I('Robalo inteiro', 'peixe', 'Peixaria', 0xb8c0c8, 'peixe', { geladeira: true, cortes: ['filetar'], preco: 68 }),
  camarao: I('Camarão rosa', 'fruto_mar', 'Peixaria', 0xe6a090, 'camarao', { geladeira: true, cortes: ['aparar'], preco: 59 }),
  vieira: I('Vieiras', 'fruto_mar', 'Peixaria', 0xf3e6d2, 'vieira', { geladeira: true, cortes: [], preco: 140 }),

  // Laticínios e ovos
  ovo: I('Ovo caipira', 'ovo', 'Laticínios', 0xf4e6cf, 'ovo', { geladeira: true, cortes: ['separar'], preco: 1 }),
  gema: I('Gema', 'gema', 'Laticínios', 0xf2a51c, 'gema', { geladeira: true, cortes: [], preco: 0 }),
  clara: I('Clara', 'clara', 'Laticínios', 0xf4f0e0, 'gema', { geladeira: true, cortes: [], liquido: true, preco: 0 }),
  leite: I('Leite integral', 'liquido', 'Laticínios', 0xfafaf5, 'caixa', { geladeira: true, liquido: true, aquoso: true, volume: 1, preco: 5 }),
  creme: I('Creme de leite fresco', 'liquido', 'Laticínios', 0xfaf4e4, 'caixa', { geladeira: true, liquido: true, aquoso: true, volume: 0.8, preco: 14 }),
  manteiga: I('Manteiga sem sal', 'gordura', 'Laticínios', 0xf6e08a, 'tablete', { geladeira: true, preco: 12 }),
  gruyere: I('Gruyère', 'queijo', 'Laticínios', 0xf0d27a, 'queijo', { geladeira: true, cortes: ['emincer', 'brunoise'], preco: 45 }),
  parmesao: I('Parmesão', 'queijo', 'Laticínios', 0xf2dc96, 'queijo', { geladeira: true, cortes: ['emincer', 'brunoise'], preco: 40 }),

  // Mercearia
  farinha: I('Farinha de trigo', 'seco', 'Mercearia', 0xf7f3ea, 'saco', { preco: 4 }),
  acucar: I('Açúcar', 'seco', 'Mercearia', 0xfbfbfb, 'saco', { doce: true, preco: 4 }),
  mostarda: I('Mostarda Dijon', 'condimento', 'Mercearia', 0xd8b02a, 'pote', { preco: 16 }),
  vinagre: I('Vinagre de vinho branco', 'liquido', 'Mercearia', 0xf6f0d0, 'garrafa', { liquido: true, aquoso: true, acido: true, volume: 0.3, preco: 9 }),
  azeite: I('Azeite extravirgem', 'gordura', 'Mercearia', 0xb7a32a, 'garrafa', { liquido: true, preco: 35 }),
  oleo: I('Óleo de girassol', 'gordura', 'Mercearia', 0xe8c84a, 'garrafa', { liquido: true, preco: 9 }),
  pimenta_grao: I('Pimenta-do-reino em grão', 'grao', 'Mercearia', 0x2a2420, 'pote', { cortes: ['esmagar'], preco: 12 }),
  extrato_tomate: I('Extrato de tomate', 'condimento', 'Mercearia', 0xa8201a, 'pote', { preco: 6 }),
  fava_baunilha: I('Fava de baunilha', 'tempero_doce', 'Mercearia', 0x2a1a10, 'fava', { preco: 38 }),
  chocolate: I('Chocolate 70%', 'doce', 'Mercearia', 0x3a2016, 'tablete', { doce: true, preco: 22 }),
  fundo_claro: I('Fundo claro de vitela', 'liquido', 'Mercearia', 0xd8b878, 'pote_grande', { liquido: true, aquoso: true, volume: 1, preco: 30 }),
  fundo_escuro: I('Fundo escuro de vitela', 'liquido', 'Mercearia', 0x6a3a1a, 'pote_grande', { liquido: true, aquoso: true, volume: 1, preco: 34 }),
  fumet: I('Fumet de peixe', 'liquido', 'Mercearia', 0xe8dcb0, 'pote_grande', { liquido: true, aquoso: true, volume: 1, preco: 28 }),
  vinho_branco: I('Vinho branco seco', 'liquido', 'Adega', 0xf3e9a8, 'garrafa', { liquido: true, aquoso: true, acido: true, volume: 0.5, preco: 60 }),
  vinho_tinto: I('Vinho tinto', 'liquido', 'Adega', 0x5a0e1e, 'garrafa', { liquido: true, aquoso: true, volume: 0.5, preco: 70 }),
  conhaque: I('Conhaque', 'alcool', 'Adega', 0xa8641a, 'garrafa', { liquido: true, volume: 0.25, preco: 120 }),
  grand_marnier: I('Licor de laranja', 'alcool', 'Adega', 0xd07a1a, 'garrafa', { liquido: true, volume: 0.25, doce: true, preco: 150 }),

  // Despensa fixa da bancada (não aparece no mercado)
  sal: I('Flor de sal', 'tempero', 'Despensa', 0xffffff, 'saleiro', { infinito: true, despensa: true }),
  pimenta: I('Pimenta-do-reino moída', 'tempero', 'Despensa', 0x2b2b2b, 'saleiro', { infinito: true, despensa: true }),
  noz_moscada: I('Noz-moscada', 'tempero', 'Despensa', 0x7a4a2a, 'saleiro', { infinito: true, despensa: true }),
  agua: I('Água', 'liquido', 'Despensa', 0xbfe3ff, 'nenhuma', { liquido: true, aquoso: true, volume: 1, despensa: true }),
  gelo: I('Gelo', 'gelo', 'Despensa', 0xe8f6ff, 'gelo', { despensa: true }),
};

// Itens que já vêm em toda bancada, ao lado do fogão.
export const DESPENSA_BANCADA = ['sal', 'pimenta', 'noz_moscada', 'manteiga', 'azeite', 'oleo', 'farinha', 'acucar'];

// Ferramentas que ficam na bancada do jogador.
export const FERRAMENTAS = {
  fouet: { nome: 'Fouet (batedor de arame)', mexer: 2.6 },
  colher: { nome: 'Colher de pau', mexer: 1.0 },
  pinca: { nome: 'Pinça de cozinha', mexer: 0.6 },
};

// Preparações que nascem das regras da cozinha.
export const PREPAROS = {
  roux: { nome: 'Roux', cor: 0xf0dca0, liquido: false },
  bechamel: { nome: 'Molho bechamel', cor: 0xf8f3e3, liquido: true },
  veloute: { nome: 'Molho velouté', cor: 0xf0e2bc, liquido: true },
  espanhola: { nome: 'Molho espanhol', cor: 0x5a2e14, liquido: true },
  holandesa: { nome: 'Molho holandês', cor: 0xf6d25a, liquido: true },
  molho_tomate: { nome: 'Molho de tomate', cor: 0xb8281a, liquido: true },
  maionese: { nome: 'Maionese', cor: 0xf6eab0, liquido: true },
  vinagrete: { nome: 'Vinagrete', cor: 0xd8c860, liquido: true },
  beurre_blanc: { nome: 'Beurre blanc', cor: 0xf4ecc8, liquido: true },
  molho_au_poivre: { nome: 'Molho au poivre', cor: 0xc8a880, liquido: true },
  creme_anglaise: { nome: 'Crème anglaise', cor: 0xf6e4a0, liquido: true, doce: true },
  caramelo: { nome: 'Caramelo', cor: 0xb8641a, liquido: true, doce: true },
  coulis: { nome: 'Coulis de frutas', cor: 0xc8183a, liquido: true, doce: true },
  creme_legumes: { nome: 'Creme de legumes', cor: 0xd8c060, liquido: true },
  pure: { nome: 'Pommes purée', cor: 0xf6e8b0, liquido: false },
  ovos_batidos: { nome: 'Ovos batidos', cor: 0xf6c838, liquido: false, poca: true },
  omelete: { nome: 'Omelete à française', cor: 0xf6d050, liquido: false },
  manteiga_clarificada: { nome: 'Manteiga clarificada', cor: 0xf6cc3a, liquido: true, gordura: true },
  molho_talhado: { nome: 'Molho talhado', cor: 0xd8c878, liquido: true },
  gororoba: { nome: 'Gororoba de liquidificador', cor: 0x8a7a4a, liquido: true },
};

export const RECIPIENTES = {
  frigideira: { nome: 'Frigideira de aço carbono', k: 0.16, fogo: true, seca: true, cap: 4, pegavel: true },
  sauteuse: { nome: 'Sauteuse', k: 0.12, fogo: true, seca: true, cap: 6, pegavel: true },
  panela: { nome: 'Panela de inox', k: 0.08, fogo: true, cap: 9, pegavel: true },
  assadeira: { nome: 'Assadeira', k: 0.06, forno: true, seca: true, cap: 6, pegavel: true },
  bowl: { nome: 'Bowl de inox', k: 0.05, cap: 9, pegavel: true },
  prato: { nome: 'Prato de serviço', k: 0.03, cap: 12, pegavel: true, prato: true },
  liquidificador: { nome: 'Liquidificador industrial', k: 0.02, cap: 6, fixo: true },
  fritadeira: { nome: 'Fritadeira', k: 0.05, cap: 4, fixo: true, oleo: true },
};

export const AMBIENTE = 22;
