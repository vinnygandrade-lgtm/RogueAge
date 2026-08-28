# World Map — brief de arte (mobile portrait)

**Produto:** RogueAge · **Aba:** World (`#tela-world`)  
**Estado:** arte **locked** em `assets/world/map_bg.jpg` (24 Aug 2026, `Gemini_Generated_Image_blky7oblky7oblky.jpg`) — vale **cheio** (povo, caravanas, luta na arena, dragão na caverna). Palco `#praca-world` + toques (select → Enter) + overlay de vida (brilho / fumo / vaga-lumes). Camadas `assets/world/<id>.png` entram **uma a uma**. Grades de caça só no modal `#janela-world-zones`.  
**Canvas:** **1080×1620** (igual à Praça da Cidade). Display no jogo: scale **3×** → ~**360×540 px**.  
**Ler no telemóvel:** se um marco não se reconhece a ~120 px de altura no canvas, no jogo some.

**Gameplay (portas existentes — o desenho não escolhe o grade):**

| ID | Visual | Abre |
|----|--------|------|
| `forest` | floresta / trilha | Expedição → postcards em `#janela-world-zones` → `abrirDetalhesZona(<grade>)`; **6 grades só no modal** |
| `daily` | campo de ossos | Boss diário (`abrirJanelaDailyBoss`) |
| `olympiad` | coliseu | Grand Olympiad (`abrirOlympiad`) |
| `raid` | caverna | Raid mundial (`abrirLobbyRaid`) |
| `clanwar` | acampamento / colina das bandeiras | Guerra de Clãs (`ClanWarEngine.abrirLobby`) — **toque só o líder**; o marco **pinta para todos** |

**Fora do mapa v1:** Ascensão, nomes de zona (Talking Island, Death Pass, etc.).

---

## 1. Ideia em uma frase

O jogador **acaba de sair da cidade** e vê um vale **habitado e gasto** ao entardecer: à esquerda o sítio onde se farm, à direita o desafio do dia, no terraço oeste o acampamento de guerra, mais acima a arena de PvP, ao fundo o buraco que ninguém quer.  
Entre os cinco destinos o chão **não é relva lisa** — rio, ponte, ruína, fumo, carroça, bichos.  
Não é mapa de pergaminho. Não é rua. É **paisagem de campanha densa**, tipo ecrã de viagem de MMO clássico.

**Regra de densidade:** os **5 destinos** são os únicos “heróis” (maiores, cor própria). Tudo o resto é **roupa** — mais pequeno, sem placa, sem parecer um sexto sítio para tocar.  
**Guerra ≠ exército no vale:** o acampamento é **um** campo compacto com bandeiras. Proibido encher o meio do vale com milhares de tropas.

---

## 2. Canvas, câmera, grelha

| | |
|--|--|
| Tamanho | **1080 × 1620 px** (eixo Y: 0 = topo do céu, 1620 = fundo do ecrã) |
| Origem | canto **superior esquerdo** |
| Formato | JPG alto ou PNG **opaco** — **uma** imagem |
| Estilo | pintura digital semi-realista, dusk da praça: pedra `#241710`, bronze `#735939` |

**Câmara (fixa — não improvisar):**

- Estás num **outeiro a sul**, ~8 m acima do caminho.
- Olhas **para norte**, inclinação **25–35°** para baixo.
- Ligeiro grande-angular. O caminho em baixo é o chão mais perto da câmara.
- **Proibido:** rua ao nível dos olhos, vista de satélite, grelha isométrica, mapa plano com ícones.

**Faixas reservadas (não violar):**

```
Y = 0 ────────────────────────────────── topo
Y = 0–160      CÉU / cume  — sem boca de caverna, sem coliseu
Y = 160–520    MONTANHA    — só a caverna (raid) vive aqui
Y = 480–780    OUTEIRO     — coliseu à DIR; **acampamento de guerra** no terraço OESTE (não tapar a boca da caverna)
Y = 720–1180   VALE MÉDIO  — floresta ESQ + ossos DIR, mesma profundidade
Y = 1180–1480  PRIMEIRO PLANO — caminho, marco, telhados da cidade
Y = 1480–1620  POV          — sem casas; PODE ter sulcos, poça, ervas, pedras
Y = 1620 ─────────────────────────────── fundo
```

**Colunas (não deixar os 5 marcos no mesmo X):**

```
X = 0          270         540         810        1080
     │ guerra +  │  caverna │  coliseu  │  ossos  │
     │ floresta  │  280–620 │  520–900  │ 680–1040│
     │ 70–360    │          │           │         │
     │  (camp Y  │          │           │         │
     │   ~500–760│          │           │         │
     │  forest   │          │           │         │
     │   below)  │          │           │         │
```

Há overlap de propósito (profundidade). O que **não** pode: floresta a tapar o acampamento **nem** a boca da caverna; ossos a tapar o oval do coliseu; cidade a subir acima de Y=1480; acampamento a tapar o brilho da Maw.

---

## 3. Mapa de profundidade (px)

```
 Y=0     índigo → âmbar  (céu, sem objectos)
 Y=160   cume de montanha azul-preto
              ╭────── CAVERNA raid ──────╮
              │  centro boca 454, 356    │
              │  elipse ~380 × 220       │
 Y=500   ╭─ GUERRA ─╮      ╰──────────────────────────╯
         │ 198, 628 │              COLISEU
         │ palissada│         oval centro 691, 616
 Y=760   ╰──────────╯         anel ~340 × 200
 Y=780   ────────────────────────────────
     FLORESTA                    OSSOS
     trilha 346, 940             cratera 821, 907
     copa ~520 × 480             campo ~380 × 320
 Y=1180  ────────────────────────────────
              caminho + marco 540, 1380
              telhados cidade 200–880, 1280–1460
 Y=1480  ════ terra vazia (POV) ═════════
 Y=1620
```

---

## 4. Tabela mestra de posições

Todas as caixas são **eixos alinhados ao canvas** (aprox. da massa visível). O hotspot de toque futuro usa o **centro**.

| ID | Nome de arte (interno, não pintar) | Centro X,Y | Caixa (x1,y1)–(x2,y2) | Largura × altura | Cor de acento |
|----|------------------------------------|------------|------------------------|------------------|---------------|
| *(céu)* | — | — | 0,0 – 1080,160 | 1080 × 160 | índigo `#1e1b4b` → âmbar `#b45309` |
| `raid` | **The Maw** / A Boca | **454, 356** | 280, 200 – 660, 480 | ~380 × 280 | âmbar doente `#d97706` / umber |
| `clanwar` | **Banner Hill** / Colina das Bandeiras | **198, 628** | 70, 500 – 360, 760 | ~290 × 260 | carmesim `#7f1d1d` + bronze |
| `olympiad` | **Crown Ring** / Anel da Coroa | **691, 616** | 530, 500 – 880, 760 | ~350 × 260 | bronze `#735939` |
| `forest` | **Deepgrove** / Bosque Fundo | **346, 940** | 40, 720 – 560, 1200 | **~520 × 480** | verde-azulado `#134e4a` |
| `daily` | **Ashen Field** / Campo Cinza | **821, 907** | 640, 740 – 1040, 1100 | ~400 × 360 | osso `#e7e5e4` + ferrugem `#9a3412` |
| *(cidade)* | fragmento da praça | 540, 1380 | 80, 1240 – 1000, 1480 | caminho largo | lanternas bronze |
| *(POV)* | chão do jogador | — | 0, 1480 – 1080, 1620 | 1080 × 140 | terra / pedra, **vazio** |

**Hierarquia de tamanho (obrigatória):**  
`forest` > `daily` ≥ `raid` (boca) > `clanwar` ≈ `olympiad` (mais longe / mais compacto).  
Se o coliseu ou o acampamento ficar do tamanho da floresta, a perspectiva está errada.

---

## 5. Estradas (ligar os sítios sem texto)

Um **único** caminho sai da cidade e **bifurca no marco**.

| Troço | Traçado (aprox.) | Aspecto |
|-------|------------------|---------|
| Saída da cidade | de (540, 1580) sobe até o marco (540, 1380) | terra batida + lajes gastas, 90–120 px de largo em primeiro plano |
| Marco / forquilha | pedra alta em **540, 1380** | menir simples, **sem runas legíveis**, sombra para a direita |
| → Floresta | curva para a esquerda: (540,1380) → (400,1180) → (320,1000) | some na boca da trilha, entre as duas pedras |
| → Ossos | curva para a direita: (540,1380) → (700,1160) → (800,980) | mais pálido, pó, sem relva |
| → Coliseu | via clara que sobe o outeiro: (620,1200) → (680,900) → (700,720) | saibro claro, estreita com a distância (~40 px no outeiro) |
| → Guerra | esporão oeste: (400,1180) → (280,900) → (220,720) | terra + estacas, sobe ao terraço; **não** atravessa a copa da floresta |
| → Caverna | trilho de cabra escuro: (400,900) → (420,640) → (450,480) | pedra nua, some nas faldas, **não** é estrada real |

Sem placas, sem postes com setas, sem “km”. A estrada **é** a seta.

---

## 6. Roupa do vale (o que faltava — mapa “cheio”)

Versões vazias = relva + 4 ícones. O gerador precisa de uma **lista obrigatória**. Nada disto é hotspot. Cada peça < **80–120 px** no lado maior (excepto o rio, que é uma linha).

### 6.1 Espinha do vale — água

Um **rio** único, da montanha até perto da cidade. Quebra o verde vazio ao meio.

| Troço | Px (aprox.) | Aspecto |
|-------|-------------|---------|
| Queda na falda | nasce ~X 220, Y 420, à **esquerda** da boca da caverna | fita branca estreita, sem tapar a Maw |
| Meandro no vale | (260,620) → (420,800) → (500,1000) → (560,1180) | 12–25 px de largo, reflexo dusk, neblina baixa |
| Ponte de pedra | **arco em 510, 1120** | 1 vão, musgo, sem guarda com letras |
| Perto da cidade | some à direita do caminho ~X 620, Y 1320 ou passa sob lajes | juncos, pedras no leito |

### 6.2 Lista obrigatória (pintar **todas**)

Conta 14. Se faltarem 4+, o mapa ainda está vazio.

| # | Peça | Onde (centro aprox.) | Parece |
|---|------|----------------------|--------|
| 1 | **Moínho de água** | 210, 1280 | roda no rio, telhado escuro, **sem** nome |
| 2 | **Pomar / socalcos** | 160–320, 1180–1320 | 8–12 árvores baixas em linha, muro de pedra |
| 3 | **Carroça partida** | 600, 1320 | no bordo do caminho, lona rasgada, **sem** letras |
| 4 | **Círculo de pedras pequeno** | 480, 1240 | 5 menires baixos junto ao marco — satélite, não segundo destino |
| 5 | **Torre de vigia de madeira** | 120, 980 | palissada + torre 1 piso, tocha, orla da floresta |
| 6 | **Fumo de acampamento** | 200, 820 | **uma** coluna fina a sair das copas (gente lá dentro, não se vê aldeia) |
| 7 | **Tronco + veado ou lobo** | 280, 1100 | silhueta <40 px, orla da mata |
| 8 | **Ermida em ruína** | 500, 860 | paredes sem telhado, 1 arco, entre floresta e outeiro do coliseu |
| 9 | **Ponte** | 510, 1120 | ver 6.1 |
| 10 | **Estábulos + pátio de treino** | 820, 720 | 2 telhados baixos **colados** ao coliseu, cerca, manequim de palha — anexos, não arena 2 |
| 11 | **Pedreira** | 900, 640 | corte na encosta do outeiro, blocos, grua de madeira minúscula |
| 12 | **Aríete / torre de cerco partida** | 920, 1000 | madeira carbonizada no campo de ossos, escala de adereço |
| 13 | **Árvores mortas + ossos a subir** | 400, 500 | “cicatriz” até à caverna: troncos queimados, costelas, sem segundo dragão |
| 14 | **Bando de corvos / gansos** | céu Y 180–280, X 700–900 | 6–12 silhuetas, liga ossos ↔ coliseu |

**Mais textura (espalhar, sem contar como destino):** sebes, muros de pastor, tocos, marco quilométrico **liso**, poças no caminho, relva alta, flores secas, musgo nas pedras, nuvens com volume, névoa em camadas no rio, 2–3 figurinhas anónimas (<25 px) na estrada do coliseu.

### 6.3 O que continua proibido (mesmo com o vale cheio)

- **Sexto destino** do tamanho da floresta ou do coliseu (castelo, segunda cidade, porto, pirâmide).
- **6 acampamentos** com cara de zona de caça / bandeiras de grade (o de guerra é **um** só).
- Placas, pins, bússola escrita, números.
- **Exército a encher o vale**, feira, dragão no céu.
- Segundo rio, segunda floresta à direita, segunda boca de caverna.

---

## 7. Fichas de cada sítio

### 7.1 POV + cidade (Y 1240–1620) — não é hotspot

**Função:** “saíste da Praça.” Mesma hora e materiais da town square.

**Obrigatório**

- Faixa **Y 1480–1620**: caminho com **sulcos de roda**, poça a reflectir o céu, ervas altas nas bermas, pedras soltas. **Sem** casa a tapar o POV. A carroça (#3) fica em Y~1320, **acima** desta faixa.
- Fragmento de muralha **baixa** (Y ~1280–1460): **6–8** telhados de telha escura em degraus, chaminés com fumo fino, **uma** torre de portão (~X 500–580, cume ≤ Y 1240).
- 4–5 lanternas de bronze. Moínho (#1) e pomar (#2) no flanco **oeste** da cidade.
- Marco de pedra na forquilha: **540, 1380**, altura ~90–110 px, basalto, sem letras. Círculo satélite (#4) atrás dele.

**Proibido**

- A praça inteira, os 5 NPCs, tendas de mercado, segundo castelo.
- Viajante com cara visível / herói / Clarissa retrato. (Silhueta minúscula **atrás** do marco, <40 px, só se não roubar o olho.)

**Luz:** lanternas âmbar fracas; o céu ainda manda. Vignette suave no bordo inferior.

---

### 7.2 Floresta — `forest` / Expedição

**Centro do toque:** boca da trilha **(346, 940)** — as **duas pedras** da entrada, não o meio da copa.

**Massa:** a maior do quadro. Cobre grosso modo X 40–560, Y 720–1200.

**Características**

- Bosque temperado **escuro**: pinheiros + carvalhos, copas fechadas, névoa verde-azul entre troncos.
- **Boca da trilha** bem desenhada: duas menires (1,8× a altura de um humano naquela profundidade), um ao X~300 e outro ao X~390, base em Y~1000–1040.
- 2–3 trilhos que **somem** para o interior (sugerir “quanto mais fundo, pior”) — **zero** acampamentos nomeados, zero bandeiras de grade.
- Musgo, raízes, fetos, cogumelos baixos, um tronco caído **não** no meio da hitbox.
- Torre de vigia (#5) na orla oeste; fumo (#6) a furar as copas; bicho (#7) na orla sul.
- Sensação: bosque **vivo e antigo**, não um bloco verde liso.

**Acento de luz:** verde-azulado `#0f766e` / `#134e4a` nas copas; a boca da trilha um pouco mais clara (claro no escuro = alvo de toque).

**Proibido**

- Clareira solarosa tipo screensaver; aldeia élfica; cogumelos gigantes de cartoon; placas “NG / D / S”; segunda floresta à direita (isso rouba os ossos).

**Escala no canvas:** a copa deve ser o bloco mais largo do vale. Altura visual da massa ~480 px.

---

### 7.3 Campo de ossos — `daily` / Boss diário

**Centro do toque:** cratera / anel **(821, 907)**.

**Massa:** X 640–1040, Y 740–1100. **Mesma profundidade** que a boca da floresta (pés do campo ~Y 1080–1120).

**Características**

- Terra **aberta**: relva seca, fendas, cinza. **Horizonte de céu visível acima do campo** (Y ~700–740 sem copas). Se árvores fecharem o topo, vira clareira — **rejeitar**.
- Anel de pedras ou cratera rasa (~180–220 px de diâmetro no canvas) — “arena do dia”.
- Adereços (espalhados, não um monte no centro):
  - 3–5 costelas / espinhaças **de besta**, marfim sujo `#e7e5e4`
  - 1–2 escudos rachados, bronze/ferro, **só geometria**
  - bandeiras partidas: pano bordeaux/cinza, manchas geométricas, **sem letras**
  - cinza de fogueira, 2–4 corvos no chão + o bando no céu (#14)
  - aríete/torre de cerco partida (#12) no bordo **este** do campo
  - elmos amolgados, lanças partidas cravadas no chão (5–8, pequenas)
- Não há corpo humano reconhecível em primeiro plano (resto de **batalha**, não gore de close-up).
- O campo tem de parecer **usado** — se for só terra lisa + 2 ossos, está vazio.

**Acento:** osso quente + ferrugem `#9a3412`; pó no ar; sol baixo a rasar o chão.

**Proibido**

- Floresta a cercar; cemitério com cruzes; tanques modernos; crânio humano gigante “logo”; segundo coliseu de ossos.

---

### 7.4 Coliseu — `olympiad` / Olimpíada

**Centro do toque:** miolo de areia do oval **(691, 616)**.

**Massa:** X 530–880, Y 500–760, assente num **outeiro** (a base do outeiro pode descer até ~Y 800).

**Características**

- Oval de pedra **lê-se como anel** mesmo a 360 px de ecrã: aro claro + interior em sombra + rasto de **areia ocre** no fundo.
- Arcos / vomitórios visíveis no lado virado à câmara (3–5 arcos).
- Bancadas vazias — **sem** multidão (o hub é “o sítio”, não o evento ao vivo).
- Crestos **geométricos** em bronze nas ameias (losango, triângulo, anel). Zero letras, zero águias de IP.
- Estado: **gasto mas orgulhoso**, não ruína desabada (não confundir com o campo de ossos).
- Escala: **menor** que a floresta porque está mais longe. Diâmetro do oval no canvas ~320–360 px.
- Anexos obrigatórios (#10): estábulos + pátio de treino no flanco **este**, mais baixos que o oval.
- Pedreira (#11) na encosta abaixo/à direita — explica a pedra do anel.

**Acento:** sol baixo a **lamber o bordo oeste** do anel (bronze `#735939` / ouro velho `#b45309`).

**Proibido**

- Coliseu de Roma fotoreal (arcos demasiado famosos); arena de neon; estádio moderno; bandeiras com palavras; gladiadores em pose de loading.

---

### 7.5 Caverna — `raid` / Boss mundial

**Centro do toque:** centro da boca **(454, 356)**.

**Massa da boca:** elipse ~ X 280–660, Y 220–480. A **montanha** pode encher X 0–1080 acima de Y 160, mas a **boca** fica **abaixo de Y=160**.

**Características**

- Parede de montanha azul-preto / ardósia, nítida contra o céu.
- Boca **enorme**, irregular, mais larga que alta (~1.6∶1), como uma ferida na rocha — não uma porta de masmorra com ombreiras talhadas.
- Brilho **âmbar-umber doente** no fundo (`#b45309` → `#431407`): sugere algo telúrico / wyrm da terra **lá dentro**.
- No máximo: **sombra** vaga de corno ou lomba **dentro** do brilho. **Nenhum** dragão completo, asa, cabeça no céu, ou monstro reconhecível de outro jogo.
- Fumarada / calor a sair da boca; sem lava de cartoon a escorrer pela floresta.
- Cicatriz (#13): árvores mortas e ossos a **subir** a falda até à boca — o vale “aponta” para o raid.
- Queda de água (# rio) à **esquerda** da boca, fina, não a tapar o brilho.

**Acento:** o único laranja “errado” do quadro — assusta. O resto do dusk é mais nobre.

**Proibido**

- Dragão a voar; nome ou runas; dentes de pedra tipo logo; segunda caverna; boca cortada pelo topo do frame.

---

### 7.6 Acampamento de guerra — `clanwar` / Guerra de Clãs

**Centro do toque:** pátio / fogueira do terraço **(198, 628)** — o miolo do acampamento, não a ponta das bandeiras.

**Massa:** X 70–360, Y 500–760. Terraço **oeste**, **acima** da copa da floresta e **à esquerda** da boca da caverna. Não sobe acima de Y=500 (senão compete com a Maw).

**Porquê aqui:** o card de Guerra já é no Mundo; no mapa precisa de um sítio **legível e separado** do campo de ossos (isso é o boss diário). Ossos = batalha velha. Este terraço = **guerra organizada, viva**.

**Características**

- Palissada de madeira + terra batida num **degrau de encosta** (não um segundo castelo de pedra).
- **3–5 bandeiras** altas, pano carmesim/bordeaux, **só geometria** (losango, faixa, anel). Zero letras, zero brasões de IP.
- 3–4 tendas de lona escura, uma fogueira, um **ariete ou torre de cerco intacta** (contraste com o aríete **partido** nos ossos, #12).
- Escala: **compacto** — ~290 × 260 no canvas. Menor que a floresta e que o campo de ossos. Parecido com o coliseu em “peso”, não em forma.
- 4–8 figurinhas anónimas (&lt;20 px) junto às tendas — **acampamento**, não falange de 200 homens.
- Luz própria: carmesim `#7f1d1d` + bronze nas hastes; fumo de fogueira **baixo** (não confundir com a coluna fina nas copas, #6).

**Acento:** o único vermelho “de guerra” do quadro. O campo de ossos fica ferrugem/osso, não o mesmo vermelho.

**Proibido**

- Segundo castelo / muralha de cidade; porto; pirâmide.
- Exército a descer o vale inteiro; 6 acampamentos; bandeiras com palavras.
- Sobrepor a boca da caverna ou tapar o oval do coliseu.
- Fazer o acampamento do tamanho da floresta.

**Código (quando existir o mapa):** o marco **vê-se sempre**. O hotspot só chama `ClanWarEngine.abrirLobby()` se o jogador for **líder de clã** (igual ao card `#card-clan-war-world` hoje). Membro / sem clã: toque pode mostrar um `l2Alert` curto — não esconder o sítio.

---

## 8. Luz, tempo, paleta

**Hora:** fim de tarde / dusk — a mesma da praça. Sol **baixo à direita** (oeste do vale):  
ossos e bordo do coliseu apanham o raso; floresta fica de sotavento (mais fria); caverna ilumina-se **por dentro**.

| Zona | Tinta local | Não usar |
|------|-------------|----------|
| Céu | índigo `#1e1b4b` → âmbar `#b45309` | neon, rosa cyber |
| Floresta | teal `#134e4a`, musgo `#3f6212` | verde lima, floresta de fadas |
| Ossos | marfim `#e7e5e4`, ferrugem `#9a3412` | sangue escarlate a encharcar o vale |
| Coliseu | bronze `#735939`, areia `#d6c4a1` | mármore branco de stock photo |
| Caverna | umber `#431407`, âmbar `#d97706` | lava neon, roxo de void |
| Guerra | carmesim `#7f1d1d`, bronze `#735939` | neon, bandeiras com texto |
| Cidade | iguais à praça `#241710` / bronze | pedra clara de mediterrâneo turístico |

Contraste de **silhueta** alto: cada marco tem um recorte óbvio contra o vizinho.

---

## 9. Prompt MASTER (copiar inteiro)

Versão **densa**. Se o vale sair liso, falta este bloco DRESSING.

```
Vertical fantasy MMORPG world-hub landscape, ONE complete richly detailed painted illustration, exact 2:3 portrait 1080x1620 pixels, mobile WORLD travel screen, original world RogueAge, semi-realistic digital painting, dark fantasy classic MMO, stone brown #241710, aged bronze #735939, cinematic late dusk, DENSE lived-in campaign valley NOT empty grass, NOT parchment map, NO UI, NO readable text, NO logos, NO watermark, NO letters on banners stones or crests.

CAMERA: viewer stands on a south ridge about 8 meters above a road, looking NORTH into a single valley, 25-35 degree downward tilt, slight wide-angle. NOT street-level, NOT top-down, NOT isometric grid, NOT satellite.

HARD SAFE BANDS:
- Top 160 pixels (Y=0-160): dusk sky with VOLUME CLOUDS and a flock of 8-12 bird silhouettes, mountain peaks allowed, NO cave mouth.
- Bottom 140 pixels (Y=1480-1620): worn dirt-and-stone road toward the viewer with deep CART RUTS, a dusk-reflecting puddle, tall weeds, loose stones. NO houses in this band.

DENSE TOWN FRAGMENT (Y=1240-1480): 6-8 dark tile roofs stepped up a low wall, smoking chimneys, ONE gate tower tip below Y=1240, 4-5 bronze lanterns. Waystone at X=540 Y=1380 (~100px, no letters). Behind it a tiny 5-stone circle. West of town: WATERMILL with wheel on the river (X=210 Y=1280) and terraced ORCHARD 8-12 small trees (X=160-320). Broken covered wagon on the road verge at X=600 Y=1320, torn cloth, no letters.

RIVER SPINE (mandatory): thin waterfall left of the cave ~X=220 Y=420, then a meandering river (12-25px wide) through (260,620) (420,800) (500,1000) to a STONE PACKHORSE BRIDGE at X=510 Y=1120, then past the town. Low mist on the water. Reeds and wet rocks.

FIVE HERO LANDMARKS (largest shapes, readable at 360px) PLUS dressing around them. No empty lawns between them.

1) EXPEDITION FOREST — Deepgrove. LARGEST mass. Trail-mouth touch-center X=346 Y=940. Mass X=40-560 Y=720-1200.
   Dark pines and oaks, teal mist, ferns, mushrooms, fallen log off the hitbox, TWO standing stones at the mouth (X=300 and 390, Y~1020). Paths fade deeper. West forest edge: wooden WATCHTOWER + palisade + torch (X=120 Y=980). ONE thin campfire SMOKE column through the canopy (X=200 Y=820). South edge: tiny deer or wolf silhouette (X=280 Y=1100). No named camps, no grade flags, no village. Forest canopy stays BELOW the war camp terrace (below Y=720).

2) DAILY BATTLEFIELD — Ashen Field. Same depth as the trailhead. Crater center X=821 Y=907. Mass X=640-1040 Y=740-1100.
   OPEN SKY above the field. Packed dressing: beast ribcages, cracked geometric shields, snapped banners with geometric stains only, ash, stuck broken spears, dented helms, 2-4 ground crows. East edge: wrecked wooden SIEGE RAM / broken siege tower (X=920 Y=1000). No letters, no close-up human gore, no second forest wall.

3) CLAN WAR CAMP — Banner Hill. Compact western terrace. Touch-center X=198 Y=628. Mass X=70-360 Y=500-760, entirely BELOW the cave mouth, ABOVE the forest canopy.
   Wooden palisade on a hillside shelf, 3-5 tall crimson banners with geometric stains only (no letters), 3-4 dark tents, one campfire, ONE intact siege ram or siege tower. 4-8 ant-sized figures at the tents — a camp, NOT a marching army filling the valley. Crimson #7f1d1d + bronze. Distinct from the wrecked ram on the bone field.

4) GRAND COLISEUM — Crown Ring. Smaller (farther). Sand-oval center X=691 Y=616. Mass X=530-880 Y=500-760.
   Weathered oval, 3-5 arches, empty stands, bronze geometric crests, ochre sand. East flank STABLES + straw training dummy yard (X=820 Y=720) lower than the oval. Hill cut: small STONE QUARRY with timber crane (X=900 Y=640). Proud, not ruined, not the Roman Colosseum.

5) RAID CAVE — The Maw. Mouth center X=454 Y=356, ellipse X=280-660 Y=220-480, entirely BELOW Y=160.
   Blue-black mountain, huge irregular maw, sickly amber-umber inner glow, at most a vague horned shadow inside. NO full dragon. Scorch SCAR climbing the slope: dead trees and bones from ~X=400 Y=500 up to the mouth. Thin waterfall stays LEFT of the glow and ABOVE the war camp.

BETWEEN LANDMARKS (mandatory, smaller than heroes): ruined roofless chapel with one arch at X=500 Y=860 (between forest and coliseum hill). Layered valley mist. Shepherd walls, hedges, stumps. 2-3 anonymous ant-sized travelers on the coliseum road. No sixth fortress, no second city, no army flooding the valley.

ROADS from the waystone: left into the forest mouth; west spur climbing to the war camp (400,1180) (280,900) (220,720); right dusty path to the crater; pale climbing road to the coliseum; dark goat-path toward the cave. No signposts.

LIGHTING: one dusk; local pools — forest teal, bones rust, war-camp crimson, coliseum bronze, cave hellish amber. High silhouette contrast. Every patch of ground has texture: grass clumps, dirt, rock, moss — NO large flat green empty fields.

STYLE: painterly semi-realistic, richly detailed MMORPG travel vista, RogueAge original, dusk town-square palette.

NEGATIVE: empty grass valley, sparse landscape, only four objects, missing war camp, blurry, low-res, horizontal, labeled map, compass letters, UI pins, six named villages, extra cities, marching army filling the valley, full dragon in the sky, copied famous coliseum, neon, sci-fi, anime chibi, isometric grid, white void, parchment boardgame, readable numbers, second forest on the right, cave mouth cropped by the top edge.
```

---

## 10. Prompts de correcção (inpaint no **mesmo** canvas)

Não gerar 4 imagens soltas para colar.

**Floresta fraca / pequena**

```
Same 1080x1620 dusk valley. Enlarge mid-left Deepgrove forest so the mass is about X=40-560 Y=720-1200.
Trail mouth with two standing stones at X=346 Y=940. Teal mist, no signs, no extra village. Keep other landmarks.
```

**Ossos parecem clareira**

```
Same painting. Mid-right Ashen Field must have OPEN sky above it, no tree wall.
Crater center X=821 Y=907, beast ribs, rust earth, geometric broken banners, no letters.
```

**Coliseu não lê como oval**

```
Same painting. Strengthen the Crown Ring oval at X=691 Y=616, about 350px wide,
sand interior + shadowed stands + bronze geometric crests only, smaller than the forest.
```

**Caverna cortada ou com dragão**

```
Same painting. Place The Maw cave mouth entirely below Y=160, center X=454 Y=356,
irregular dark opening with amber inner glow, no full dragon, no text.
```

**Vale vazio / só relva**

```
Same 1080x1620 dusk valley, KEEP the five hero landmarks in place (forest, bones, war camp, coliseum, cave).
Fill empty grass with dense dressing, all smaller than the forest and coliseum:
meandering river and stone bridge at 510,1120, watermill 210,1280, orchard west of town,
broken wagon 600,1320, wooden watchtower 120,980, thin canopy smoke 200,820,
ruined chapel 500,860, coliseum stables 820,720, quarry 900,640,
wrecked siege ram 920,1000, dead-tree scorch scar toward the cave, flock of birds,
ruts and puddle on the foreground road. No sixth city, no text, no extra forest on the right.
```

**Acampamento de guerra em falta / parece o campo de ossos**

```
Same 1080x1620 dusk valley. Add Banner Hill clan-war camp on the WEST terrace,
touch-center X=198 Y=628, mass about X=70-360 Y=500-760.
Wooden palisade, 3-5 crimson geometric banners (no letters), tents, one intact siege tower.
Keep it smaller than the forest. Do not cover the cave mouth. Distinct from the wrecked ram on the bone field.
```

---

## 11. Referência de layout (não vai para o jogo)

```
1080x1620 vertical lineup plate, five landmarks with empty bottom road:
large forest trailhead mid-left (center 346,940), bone crater mid-right (821,907),
compact war camp on west terrace (198,628), stone oval coliseum on a hill (691,616),
dark glowing cave in the mountain (454,356), waystone at 540,1380, dusk, NO labels, NO UI, RogueAge original
```

---

## 12. Export e pasta

| Regra | Valor |
|-------|--------|
| Resolução | **1080 × 1620** exactos |
| Ficheiro | `assets/world/map_bg.jpg` (ou PNG opaco) |
| Layers | **nenhuma** na v1 |
| Texto no PNG | **zero** |

```
assets/world/
  map_bg.jpg
```

---

## 13. Checklist de aprovação

1. Exactamente 1080×1620?  
2. Thumbnail ~360 px de largura: dá para apontar floresta / ossos / guerra / coliseu / caverna sem zoom?  
3. Floresta é a **maior** massa?  
4. Ossos com **céu aberto** por cima?  
5. Coliseu lê-se como **oval** (anel + areia)?  
6. Boca da caverna **toda** abaixo de Y=160?  
7. Acampamento de guerra no terraço oeste (**198, 628**), com bandeiras, **sem** tapar a Maw?  
8. Y 1480–1620 sem casas, mas com sulcos/poça/ervas (não um rectângulo liso)?  
9. Dá para contar **rio + ponte + moínho + torre + fumo + ruína + carroça** sem esforço?  
10. Zero letras, pins, nomes de zona, 6 acampamentos, sexto castelo, exército a encher o vale?  
11. Sem dragão completo / monstro de IP?  
12. Dusk + pedra/bronze da praça (não pergaminho amarelo)?  
13. Os cinco centros caem ±40 px de: floresta **346,940** · ossos **821,907** · guerra **198,628** · coliseu **691,616** · caverna **454,356**?  
14. Nenhum adereço é do tamanho da floresta ou do coliseu?

---

## 14. Código (cliente)

Palco: `#praca-world` / `#world-map-stack` (`css/world-map.css`, `src/ui/ui_world_map.ts`).  
Toque = **selecionar**; **Enter** abre o destino (mesmo padrão da praça).

| Hotspot | Visual | Enter |
|---------|--------|-------|
| `forest` | Deepgrove | modal `#janela-world-zones` (postcards `battle_<slug>.webp`) → `abrirDetalhesZona(<grade>)` — o mapa **não** escolhe o grade |
| `daily` | Ashen Field | `abrirJanelaDailyBoss()` |
| `clanwar` | Banner Hill | `ClanWarEngine.abrirLobby()` — **só líder**; sem clã / membro vê `l2Alert` |
| `olympiad` | Crown Ring | `abrirOlympiad()` |
| `raid` | The Maw | `abrirLobbyRaid()` |

Placas i18n (`game.world.map.*`, en + pt-BR). Dock de expedição estacionada vive no modal da floresta; badge `ACTIVE` no hotspot `forest`.

**Camadas (como a praça):** `assets/world/map_bg.jpg` + recortes `assets/world/<id>.png` no mesmo canvas 1080×1620. Live: `forest`, `clanwar`, `daily`, `olympiad`, `raid`. O cliente só pede PNGs listados em `WORLD_LAYER_FILES` (`src/ui/ui_world_map.ts`). Sem ficheiro, a `<img>` fica `hidden`. Export: `npm run export:world`. Drop em `assets/world/_incoming/<id>.png`.

---

## 15. Camada Expedição (`forest.png`) — primeira a entrar

Mesmo fluxo da praça: o **fundo já está locked**; esta PNG é só o recorte de Deepgrove, na **mesma pose**.

| | |
|--|--|
| Ficheiro live | `assets/world/forest.png` |
| Drop bruto | `assets/world/_incoming/forest.png` |
| Canvas | **1080×1620**, PNG, **alpha** fora da silhueta |
| Alinhamento | pixels = `map_bg.jpg` — **não** recentrar, **não** escalar só a floresta no meio do canvas |
| Toque | `.world-map-actor--forest` → Enter → `#janela-world-zones` |

**O que entra no recorte**

- A massa de pinheiros de Deepgrove (esquerda / vale médio).
- Moínho / trilha **na orla da floresta**, se fizer parte do bosque.
- Copas que se sobrepõem ao rio **só do lado da floresta**.

**O que fica de fora (outras camadas / bg)**

- Acampamento vermelho / paliçada / fogueira (**Banner Hill** → `clanwar.png` mais tarde).
- Cume, cascata e boca da caverna (**The Maw**).
- Cratera de ossos, coliseu, aldeia, caminho POV.

**Como cortar (Photoshop / Photopea / GIMP)**

1. Abrir `assets/world/map_bg.jpg`.  
2. Duplicar → apagar tudo **excepto** o bosque (borracha / máscara). Fundo = transparente.  
3. Exportar PNG **1080×1620** (não cortar o canvas ao bounding box da floresta).  
4. Guardar em `_incoming/forest.png` → `npm run export:world` → hard-refresh no Mundo.

**Prompt se gerares o recorte à parte** (colar com o `map_bg` como referência de pose):

```
Same camera and exact 1080x1620 composition as the locked RogueAge world-valley painting. Isolated cutout layer of ONLY the Deepgrove pine forest on the left-middle of the valley, same tree silhouettes and dusk lighting, everything else fully transparent. Include the forest watermill on the grove edge if it sits in the trees. Do NOT include the red palisade war camp, the bone crater, the coliseum, the mountain cave, the village, or the foreground dirt road. No UI, no text, no watermark.
```

Quando o PNG live existir, o cliente mostra a camada e o toque em Deepgrove acende o aura teal da silhueta (como o NPC na praça) — **sem** o rectângulo de hotspot da versão sem camada. Afinar a caixa `%` em `.world-map-actor--forest` se o recorte não bater.

---

## 16. Camada Guerra (`clanwar.png`)

Mesmo canvas/pose que `map_bg.jpg`. Aura vermelha no toque. Enter só o líder do clã (membros vêem `l2Alert`).

| | |
|--|--|
| Ficheiro live | `assets/world/clanwar.png` |
| Drop bruto | `assets/world/_incoming/clanwar.png` |
| Toque | `.world-map-actor--clanwar` → `ClanWarEngine.abrirLobby()` |

**O que entra:** paliçada, tendas, bandeiras, fogueira e o outeiro vermelho de Banner Hill (terraço oeste).  
**O que fica de fora:** pinheiros de Deepgrove, cratera de ossos, coliseu, caverna, aldeia, caminho POV.

**Prompt:**

```
Same camera and exact 1080x1620 composition as the locked RogueAge world-valley painting. Isolated cutout layer of ONLY the Banner Hill war camp on the west terrace: red palisade, tents, flags, campfire, same dusk lighting, everything else fully transparent. Do NOT include the Deepgrove pine forest, the bone crater, the coliseum, the mountain cave, the village, or the foreground dirt road. No UI, no text, no watermark.
```

---

## 17. Camada Boss diário (`daily.png`)

Mesmo canvas/pose que `map_bg.jpg`. Aura clara (osso) no toque. Enter abre `abrirJanelaDailyBoss()`.

| | |
|--|--|
| Ficheiro live | `assets/world/daily.png` |
| Drop bruto | `assets/world/_incoming/daily.png` |
| Toque | `.world-map-actor--daily` |

**O que entra:** cratera, ossos, restos e figuras **dentro** do campo de Ashen Field (direita / vale médio).  
**O que fica de fora:** coliseu, floresta, acampamento vermelho, caverna, aldeia, caminho POV.

**Prompt:**

```
Same camera and exact 1080x1620 composition as the locked RogueAge world-valley painting. Isolated cutout layer of ONLY the Ashen Field bone crater on the right-middle of the valley: ribcage, skull, dusty pit, same dusk lighting, everything else fully transparent. Do NOT include the coliseum, the Deepgrove forest, the red palisade war camp, the mountain cave, the village, or the foreground dirt road. No UI, no text, no watermark.
```

---

## 18. Camada Olimpíada (`olympiad.png`)

Mesmo canvas/pose que `map_bg.jpg`. Aura bronze no toque. Enter abre `abrirOlympiad()`.

| | |
|--|--|
| Ficheiro live | `assets/world/olympiad.png` |
| Drop bruto | `assets/world/_incoming/olympiad.png` |
| Toque | `.world-map-actor--olympiad` |

**O que entra:** oval do coliseu, bancadas, luta no centro (Crown Ring).  
**O que fica de fora:** cratera de ossos, floresta, acampamento, caverna, aldeia, caminho POV.

**Prompt:**

```
Same camera and exact 1080x1620 composition as the locked RogueAge world-valley painting. Isolated cutout layer of ONLY the Crown Ring coliseum on the right of the valley: stone oval, crowd, fight in the pit, same dusk lighting, everything else fully transparent. Do NOT include the bone crater, the Deepgrove forest, the red palisade war camp, the mountain cave, the village, or the foreground dirt road. No UI, no text, no watermark.
```

---

## 19. Camada Raid (`raid.png`)

Mesmo canvas/pose que `map_bg.jpg`. Aura laranja no toque. Enter abre `abrirLobbyRaid()`.

| | |
|--|--|
| Ficheiro live | `assets/world/raid.png` |
| Drop bruto | `assets/world/_incoming/raid.png` |
| Toque | `.world-map-actor--raid` (boca da caverna; o recorte pode incluir o cume) |

**O que entra:** boca da Maw, brilho interior, dragão em silhueta; cume e cascata se fizerem parte da montanha.  
**O que fica de fora:** floresta, acampamento, ossos, coliseu, aldeia, caminho POV.

**Prompt:**

```
Same camera and exact 1080x1620 composition as the locked RogueAge world-valley painting. Isolated cutout layer of ONLY The Maw mountain cave at the top of the valley: cave mouth, inner glow, dragon silhouette, adjoining peaks and waterfall if they belong to the same mass, same dusk lighting, everything else fully transparent. Do NOT include the Deepgrove forest, the red palisade war camp, the bone crater, the coliseum, the village, or the foreground dirt road. No UI, no text, no watermark.
```

