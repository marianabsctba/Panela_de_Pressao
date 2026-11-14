# Panela de Pressão 4D

Reality de culinária em primeira pessoa, no navegador. Dezesseis cozinheiros amadores, três jurados de pavio curto, uma apresentadora com padrão de qualidade e um troféu que ninguém pediu: o Frango Dourado de Três Pernas.

A quarta dimensão é o cheiro. O olfatômetro avisa quando a manteiga vira noisette, quando o alho começa a dourar e quando a sua carreira começa a queimar.

## Como jogar

Abra a página publicada no GitHub Pages ou sirva a pasta localmente:

```bash
py -3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

| Tecla | Ação |
|---|---|
| W A S D, Shift | andar, correr |
| Mouse | olhar |
| E ou clique | pegar, largar, pôr dentro, despejar, entregar |
| R | mexer em close, fazendo círculos com o mouse; com o fouet na mão, bate mais forte |
| E segurado | despejar líquido aos poucos (leite no roux sem empelotar) |
| F | virar, flambar, enrolar a omelete, escorrer na pia |
| T | provar e espetar o termômetro |
| G | tirar um item sólido de dentro da panela |
| Roda do mouse, Z, X | fogo, forno e fritadeira |
| Espaço na tábua | escolher o corte e cortar em close, riscando com o mouse |
| Enter | avançar diálogo, encerrar compras, adiantar o relógio |

## O programa

Cinco provas, com eliminação até sobrar uma pessoa:

1. **Mise en Place da Humilhação:** brunoise, julienne, chiffonade, concassé e batata torneada.
2. **Respeite os Molhos-Mãe:** o sorteio escolhe bechamel, velouté, holandês, tomate ou espanhol.
3. **Omelete à Française:** lisa, sem cor e baveuse por dentro.
4. **Steak au Poivre com Pommes Frites:** ponto sorteado, conhaque flambado, fritura em dois tempos.
5. **Grande Final:** entrada, prato principal e sobremesa.

Cada prova começa com 3 minutos de mercado.

## Técnica de verdade

A cozinha é simulada: cada panela tem temperatura, a água trava em 100 °C, a reação de Maillard começa acima de 140 °C e é calculada por lado da carne, o núcleo da proteína esquenta devagar, o roux escurece com o tempo, as emulsões talham acima de 87 °C, a fritura em dois tempos deixa a batata crocante e o concassé exige branquear e dar choque térmico. Os jurados avaliam técnica, tempero, ponto e apresentação, e comentam exatamente o que aconteceu no seu prato.

A lógica da cozinha tem testes:

```bash
npm test
```

## Estrutura

- `js/culinaria.js`, `js/dados.js`, `js/provas.js`: simulação, catálogo e julgamento (sem dependência do 3D).
- `js/estudio.js`, `js/bancada.js`, `js/objetos.js`, `js/materiais.js`: estúdio, bancadas, utensílios e materiais.
- `js/cozinha.js`, `js/corte3d.js`, `js/jogador.js`: interação em primeira pessoa e corte em close.
- `js/humanos.js`: participantes, jurados e apresentadora.
- `tools/makehuman/`: gerador dos personagens no Blender com MPFB.
- `tools/cdp.mjs`: teste automatizado no Edge headless.

## Créditos

Os personagens, falas e jurados são fictícios e satíricos. O código, os textos e o roteiro são originais.

| Recurso | Autor | Licença |
|---|---|---|
| Corpos, peles, roupas, cabelos, olhos e cílios dos personagens | Comunidade MakeHuman (pacotes de assets) | CC0 |
| Ferramenta de geração MPFB (usada fora do jogo, não distribuída) | Comunidade MakeHuman | GPL |
| Universal Animation Library, convertida para o esqueleto do MPFB | Quaternius | CC0 |
| Three.js | autores do Three.js | MIT |

Fontes: Playfair Display, Inter e JetBrains Mono, pelo Google Fonts (OFL).

## Licença

MIT para o código. Os modelos em `modelos/gente` são derivados de assets CC0.
