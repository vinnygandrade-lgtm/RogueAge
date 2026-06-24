# Paperdoll — características das armas (para prompts de imagem)

Só a **descrição visual** de cada arma — detalhada para colares no teu prompt.  
Combina com corpo, mãos (`hands.png` ou `_hands`), estilo, etc.  
**IDs:** `js/db_items.js` → `catalogoArmas` · **Spec:** `docs/paperdoll-art-spec.md`

**Paperdoll (palco):** `assets/paperdolls/<preset>/equips/<id>.png` + `equips/<id>_grip.png` — **1080×984**.  
**Ícone (bolsa/loja/slots):** `assets/armas/<id>.png` — **256×256** (ficheiro **diferente**; ver `assets/armas/README.md`).

**Tipos no jogo:** Sword · Dagger · Bow · Mace · Magic Sword (staff/varinha) · Fist (punhos/garras equipados).

**Progressão visual geral:**

| Grade | Metal / material | Ornamento | Energia mágica |
|-------|------------------|-----------|----------------|
| NG | madeira, ferro barato, bronze | mínimo | quase zero |
| D | ferro fosco, aço inicial | rebites, couro | runas pequenas (staff) |
| C | aço claro, filetes bronze | sulcos de campanha | cristal pequeno (staff) |
| B | aço escuro, angular | sulcos agressivos, carmesim | glow fraco (staff) |
| A | prata/polish, ouro, cristal | filigrana, gemas | glow médio |
| S | lendário branco/ouro ou obsidiana | brasões, capas na empunhadura | glow forte |
| Vesper | ouro + gemas + luz | máximo craft épico | energia visível (SA) |

---

## No-Grade

### `wpn_ng_trainee_blade` — Wooden Sword (partida fighter)

**Grade / tipo:** No-Grade · Sword · **arma inicial de todo fighter** (preco 0)

**Paleta:** madeira clara `#C4A574`; couro marrom `#6B4423` no punho; corda/couro bege na empunhadura; zero metal polido.

**Silhueta:** espada curta-média de recruta; lâmina larga simples; perfil reto; peso visual leve.

**Lâmina:** madeira compacta ou madeira reforçada com listras; bordas sem afiar brilhante; superfície com veios; ponta arredondada ou levemente chisel; **sem** fuller metálico; 60–70 cm visual no overlay.

**Guarda:** cruzeta plana de madeira ou ferro enferrujado fino; braços curtos simétricos.

**Cabo / punho:** couro enrolado simples; sem pommel metálico — botão de madeira; fitas desgastadas.

**Empunhadura (paperdoll):** mão direita no punho, lâmina descendo ligeiramente para baixo-esquerda ou vertical; punho alinhado ao centro das mãos da camada `_hands`.

**Acabamento:** treino de quartel; marcas de uso; mate total.

---

### `wpn_ng_trainee_focus` — Basic Staff (partida mage)

**Grade / tipo:** No-Grade · Magic Sword (staff) · **arma inicial de todo mage** (preco 0)

**Paleta:** madeira castanha `#8B6914`; couro escuro no grip; sem cristal — topo de madeira ou metal oxidado.

**Silhueta:** bastão reto longo; mais alto que personagem no overlay (extensão acima da cabeça); esguio.

**Haste:** madeira torneada simples; nós naturais discretos; diâmetro médio constante.

**Topo / foco:** bloco de madeira ou ferragem de bronze fosco; **sem** orb brilhante; runa gravada rasa opcional (original).

**Base:** ponta de madeira com capa de ferro gasto ou borracha de couro.

**Empunhadura:** uma ou duas mãos no terço inferior; bastão vertical ou inclinado 10°; alinhado às mãos do mage preset.

**Acabamento:** acólito de estrada; zero glow; mate.

---

### `wpn_ng_longsword` — Long Sword

**Grade / tipo:** No-Grade · Sword · compra loja NG

**Paleta:** aço cinza claro `#A8A8A8`; couro marrom; bronze nos rebites.

**Lâmina:** espada longa de uma mão NG; aço fosco; fuller central raso; bordas retas; ponta triangular moderada; 75–85 cm.

**Guarda:** cruzeta de ferro simples; braços iguais; sem decoração.

**Cabo:** couro trançado marrom; pommel redondo de ferro pequeno.

**Acabamento:** primeira espada “de metal de verdade” comprada; limpa mas sem luxo.

---

### `wpn_ng_dagger` — Shining Knife

**Grade / tipo:** No-Grade · Dagger · ladino/arqueiro

**Paleta:** aço claro polido `#D0D0D0`; cabo couro preto; pequeno brilho na lâmina.

**Silhueta:** adaga curta estreita; perfil rápido; guarda mínima.

**Lâmina:** 25–35 cm; dupla aresta sugerida; brilho “shining” localizado no terço superior; fio fino.

**Guarda:** cruzeta estreita ou guarda-dedos curva pequena.

**Cabo:** cilíndrico fino; couro preto; pommel pequeno.

**Empunhadura:** punho reverso ou martelo; lâmina ao lado da coxa ou para cima-discreto.

---

### `wpn_ng_bow` — Training Bow

**Grade / tipo:** No-Grade · Bow

**Paleta:** madeira clara `#DEB887`; corda bege; couro nos nocks.

**Silhueta:** arco curto de treino; curvatura simétrica moderada; sem metal nas limbs.

**Corpo:** madeira laminada simples; grip central envolto em couro; limbs iguais.

**Corda:** corda grossa de cânhamo; ligeiramente frouxa visualmente (descanso).

**Empunhadura (paperdoll):** arco vertical ao lado do corpo — mão esquerda no grip, direita solta ou no string; ou arco inclinado no ombro (escolher um padrão e manter em todos os bows).

**Acabamento:** campo de treino; sem ornamentos.

---

### `wpn_ng_mace` — Apprentice Mace

**Grade / tipo:** No-Grade · Mace · híbrido físico/magic leve

**Paleta:** ferro cinza; cabo madeira; bronze no topo.

**Silhueta:** maça leve de aprendiz; cabeça pequena; cabo médio.

**Cabeça:** bloco de ferro com **três ou quatro aletas** ou cravo simples; sem spikes longos.

**Cabo:** madeira reta; couro no grip; 50–60 cm total.

**Detalhe mágico:** runa mínima gravada na cabeça (opcional); sem glow.

---

### `wpn_ng_magic` — Magic Staff

**Grade / tipo:** No-Grade · Magic Sword (staff) · mage loja NG

**Paleta:** madeira escura `#5C4033`; bronze no anel do topo; cristal opaco cinza-claro minúsculo.

**Haste:** madeira escura reta; anéis de bronze a cada terço.

**Topo:** garra de bronze segurando cristal **pequeno** opaco; brilho interno quase nulo.

**Empunhadura:** duas mãos possíveis; staff vertical.

**Acabamento:** superior ao Basic Staff; primeiro staff “comprado”.

---

## D-Grade

### `wpn_d_elven_sword` — Elven Long Sword

**Grade / tipo:** D · Sword

**Paleta:** aço prateado claro; cabo couro verde-escuro ou castanho; filete prateado fino.

**Lâmina:** longsword elegante; curva leve na ponta; fuller profundo; linhas fluidas “elven” **genéricas** (não IP).

**Guarda:** cruzeta com leve curva para cima nas extremidades; prata fosca.

**Cabo:** couro fino; pommel em lágrima prateado.

**Acabamento:** primeira lâmina refinada D-grade; arranhões leves.

---

### `wpn_d_heavy_sword` — Heavy Sword

**Grade / tipo:** D · Sword · perfil pesado

**Paleta:** aço escuro fosco `#606060`; couro marrom grosso; rebites visíveis.

**Lâmina:** **larga e espessa**; bordas paralelas longas; ponta menos aguda; peso visual alto.

**Guarda:** cruzeta grossa retangular; ferro brutally simples.

**Cabo:** longo para duas mãos opcional; couro grosso; pommel pesado quadrado.

---

### `wpn_d_stiletto` — Stiletto

**Grade / tipo:** D · Dagger · crítico

**Paleta:** aço polido `#B0B0B0`; cabo escuro; guarda mínima prateada.

**Lâmina:** **muito estreita** e longa para adaga; perfil triangular fino; ponta needle-like; brilho agudo.

**Cabo:** cilíndrico estreito; anéis de metal; pommel redondo pequeno.

**Acabamento:** assassino D-grade; limpo, letal.

---

### `wpn_d_hunters_bow` — Hunter Bow

**Grade / tipo:** D · Bow

**Paleta:** madeira escura `#4A3728`; couro grip marrom; ferragens ferro nos nocks.

**Silhueta:** arco longo de caçador; curvatura mais profunda que NG; limbs mais longos.

**Corpo:** laminado escuro; grip reforçado couro duplo; seta **não** encaixada (só arco).

**Detalhe:** pequenas marcas de entalhe nas limbs; corda mais fina tensa.

---

### `wpn_d_iron_knuckle` — Iron Knuckle

**Grade / tipo:** D · Fist · orc/brawler

**Paleta:** ferro cinza `#707070`; couro preto nos dedos; rebites.

**Silhueta:** **punho americano** de ferro sobre mãos; não cobre corpo inteiro — só punhos/garras.

**Placas:** segmentos de ferro nos nós; barra transversal nos metacarpais; abertura para dedos.

**Detalhe:** spikes curtos opcionais nos nós; couro visível entre placas.

**Paperdoll:** overlay sobre `_hands`; punhos fechados de combate.

---

### `wpn_d_war_hammer` — War Hammer

**Grade / tipo:** D · Mace

**Paleta:** ferro fosco; cabo madeira escura; bronze no joint cabeça-cabo.

**Cabeça:** martelo de guerra **retangular** ou bloco com face plana + spine; uma face maior para impacto.

**Cabo:** 70 cm; grip couro; contra-peso pequeno no pommel.

**Detalhe híbrido:** runa lateral discreta (matk theme).

---

### `wpn_d_wizard_staff` — Wizard Staff

**Grade / tipo:** D · Magic Sword (staff)

**Paleta:** madeira negra `#2F2F2F`; prata nos anéis; cristal azul pálido pequeno.

**Haste:** reta; anéis prateados; entalhes de runas rasas.

**Topo:** cristal azul **facetado médio**; setting prateado; glow interno **suave**.

**Acabamento:** mage D-grade; mais imponente que NG Magic Staff.

---

## C-Grade

### `wpn_c_stormbringer` — Stormbringer

**Grade / tipo:** C · Sword · ícone da linha C

**Paleta:** aço claro `#C8C8D0`; bronze `#CD7F32` no guarda; couro escuro.

**Lâmina:** longsword C clássica; fuller largo; **sulco central profundo**; bordas limpas; ponta definida; 90 cm visual.

**Guarda:** cruzeta com **braços curvados** para frente; bronze nas extremidades.

**Cabo:** couro preto trançado; pommel bronze redondo.

**Acabamento:** veterano de campanha; brilho metálico moderado; nome evoca “tempestade” — sulcos dinâmicos na lâmina, **sem** runas de raio literal copiadas.

---

### `wpn_c_sabre` — Tempered Sabre

**Grade / tipo:** C · Sword · curva

**Paleta:** aço temperado `#B8B8C0`; cabo couro caramelo; guarda bronze.

**Lâmina:** **curvatura sabre** uniforme; fio convexo; single edge sugerida; leve brilho temperado.

**Guarda:** D-guard ou cruzeta inclinada elegante.

**Cabo:** curvo levemente; pommel redondo.

---

### `wpn_c_dark_screamer` — Dark Screamer

**Grade / tipo:** C · Dagger · assassino C

**Paleta:** aço escuro `#404048`; cabo preto; accent carmesim `#6B1F1F` no cabo ou guarda.

**Lâmina:** adaga longa sinistra; curva **S** leve; fio brilhante contrastando com dorso escuro; sulco sangue opcional (discreto).

**Guarda:** guardas curvos assimétricos; perfil predador.

**Acabamento:** “screamer” = linhas agressivas na lâmina; sombrio.

---

### `wpn_c_akat_bow` — Akat Long Bow

**Grade / tipo:** C · Bow · longbow C

**Paleta:** madeira escura laminada; couro preto grip; ferragens bronze.

**Silhueta:** arco **longo** quase reto nos centros; curva forte nas extremidades; maior que D Hunter.

**Limbs:** laminadas visíveis (camadas); nocks reforçados metal.

**Cord:** fina, tensa; aspecto de alto draw weight.

---

### `wpn_c_knuckle` — Battle Knuckle

**Grade / tipo:** C · Fist

**Paleta:** aço claro; couro preto; rebites bronze.

**Silhueta:** punho de batalha **mais massivo** que D Iron Knuckle; placas sobrepostas.

**Detalhe:** spikes médios nos nós; faixa de bronze no punho; perfil agressivo.

---

### `wpn_c_sorcerer_staff` — Sorcerer Staff

**Grade / tipo:** C · Magic Sword (staff)

**Paleta:** madeira roxo-escuro `#3D2B4F`; prata; cristal violeta `#8B5CF6`.

**Haste:** torneada; runas prateadas entalhadas em espiral.

**Topo:** cristal violeta **médio-grande**; glow interno médio; coroa prateada de quatro pontas **original**.

**Acabamento:** mago de campo C; sheen satinado na haste.

---

## B-Grade

### `wpn_b_damascus` — Sword of Damascus

**Grade / tipo:** B · Sword · tanque DPS B

**Paleta:** aço **escuro** `#2A2A2E`; padrão damasco **sugerido** (ondas sutis no metal); couro preto; filete carmesim mínimo.

**Lâmina:** broadsword pesada; bordas quase paralelas; damascus pattern no terço superior; ponta chisel.

**Guarda:** cruzeta angular grossa; aço escuro.

**Cabo:** couro preto; pommel pesado octogonal.

**Acabamento:** raid B; ameaçador; brilho controlado nas ondas.

---

### `wpn_b_samurai` — Samurai Longsword

**Grade / tipo:** B · Sword · estética katana **genérica** (não copiar IP)

**Paleta:** aço polido alto `#E0E0E8`; tsuka (cabo) verde-escuro ou preto com **menuki** genéricos; tsuba circular escura.

**Lâmina:** curva única elegante; fio claro; habaki dourado-bronze; sem kanji copiados.

**Guarda (tsuba):** disco simples com recorte geométrico original.

**Cabo:** tsuka longo; cord wrap padrão cruzado; kashira preta.

---

### `wpn_b_kris` — Kris

**Grade / tipo:** B · Dagger · crítico B

**Paleta:** aço escuro; cabo madeira esculpida; accent ouro envelhecido.

**Lâmina:** **lâmina ondulada kris** (flame wave) — 3–5 lobos; perfil icónico; brilho no fio.

**Cabo:** madeira esculpida com cap de metal; guarda mínima.

**Acabamento:** ritual blade genérica; ondas simétricas.

---

### `wpn_b_hakens_bow` — Haken Bow

**Grade / tipo:** B · Bow

**Paleta:** madeira negra; metal escuro nos limbs tips; couro grip vermelho escuro.

**Silhueta:** arco composto **sugerido** (limbs com curvatura composta); mais compacto que longbow; tecnológico para B-tier.

**Detalhe:** hooks/haken = pequenos ganchos metálicos nas extremidades (visual); corda escura.

---

### `wpn_b_spiked_grapple` — Spiked Grapple

**Grade / tipo:** B · Fist

**Paleta:** aço escuro; couro preto; spikes prateados.

**Silhueta:** grapple/spiked knuckles **grandes**; garras ou spikes **longos** entre dedos.

**Placas:** ferro angular; spikes 1–2 cm visuais nos nós; punho reforçado com bracelete integrado.

---

### `wpn_b_demon_splinter` — Demon Splinter

**Grade / tipo:** B · Mace · híbrido

**Paleta:** obsidian `#1A1A1A`; ferro; accent púrpura escuro `#4A148C`.

**Cabeça:** forma **fragmento** angular — como estilhaço de demónio; faces irregulares; arestas vivas; runa púrpura incrustada.

**Cabo:** metal revestido couro; pesado.

**Acabamento:** sombrio raid; splinter = geometria quebrada.

---

### `wpn_b_parasword` — Parasword

**Grade / tipo:** B · Magic Sword · espada arcana mage B

**Paleta:** prata `#C0C0C0`; azul arcana `#2563EB`; cabo azul escuro.

**Silhueta:** espada de mago — lâmina **estreita** com runas; guarda cruzada fina; perfil spellblade.

**Lâmina:** canal de runas azul glow suave; fio prata; ponta fina.

**Cabo:** couro azul; pommel com cristal plano.

---

## A-Grade

### `wpn_a_tallum` — Tallum Blade

**Grade / tipo:** A · Sword

**Paleta:** aço azul-acinzentado `#6B7B8C`; prata; couro azul royal no cabo.

**Lâmina:** longsword A elegante; fuller com **inlay prateado**; bordas azuladas (heat tint subtle).

**Guarda:** cruzeta prateada com curvas nobres; gemas pequenas azuis nos terminais.

**Cabo:** couro azul; pommel prateado gem-set.

**Acabamento:** nobre A-grade; polido alto.

---

### `wpn_a_dragon_slayer` — Dragon Slayer

**Grade / tipo:** A · Sword · **greatsword** pesada

**Paleta:** aço claro massivo; couro marrom; bronze escuro; accent rubro nos sulcos.

**Silhueta:** **espada enorme** two-hand; lâmina muito larga e longa; peso visual máximo sword A.

**Lâmina:** 120+ cm visual; fuller duplo; sulcos diagonais; ponta wide.

**Guarda:** cruzeta massiva; ferro grosso.

**Cabo:** longo two-hand; couro envolto; pommel pesado.

---

### `wpn_a_soul_separator` — Soul Separator

**Grade / tipo:** A · Dagger · crítico A

**Paleta:** aço negro `#1E1E24`; prata no fio; cabo púrpura ou preto; cristal pequeno no pommel.

**Lâmina:** adaga longa sinistra A; fio prateado brilhante vs dorso negro; runas finas no fuller.

**Guarda:** assimétrica afiada; aspecto soul/reaper **genérico** (sem IP).

**Acabamento:** premium assassino; glow mínimo no fio.

---

### `wpn_a_carniage_bow` — Carnage Bow

**Grade / tipo:** A · Bow · heavy bow A

**Paleta:** madeira escura quase preta; metal prateado; couro vermelho escuro grip; accent carmesim nos limbs tips.

**Silhueta:** arco **massivo**; limbs grossos; curvatura agressiva; aspecto siege bow.

**Detalhe:** entalhes “carnage” = sulcos vermelhos escuros nas limbs; ferragens reforçadas.

---

### `wpn_a_steel_typhoon` — Steel Typhoon

**Grade / tipo:** A · Fist

**Paleta:** aço polido `#D8D8E0`; couro preto; accent ciano ou prata nos vents.

**Silhueta:** punhos A **streamlined** — placas aerodinâmicas; perfil “typhoon” = linhas espirais ou vents nas placas.

**Detalhe:** garras curtas curvas; bracelete até antebraço; alta tecnologia fantasy.

---

### `wpn_a_forgotten_blade` — Forgotten Blade

**Grade / tipo:** A · Mace · híbrido

**Paleta:** aço envelhecido `#8A8A90`; ouro desbotado; runas desgastadas.

**Cabeça:** maça-lâmina híbrida — face de martelo + **lâmina curta** lateral ou coroa de lâminas; aspecto relic.

**Cabo:** metal com couro; inscrições apagadas.

**Acabamento:** “forgotten” = patina, runas quase apagadas.

---

### `wpn_a_arcana_mace` — Arcana Mace

**Grade / tipo:** A · Magic Sword (staff/mace mage A)

**Paleta:** prata; violeta `#7C3AED`; cristal grande violeta.

**Forma:** bastão-maça arcano — topo com **orb violeta** em gaiola prateada; haste torneada com runas; entre staff e mace (bloco orbital no topo).

**Glow:** médio-forte violeta no orb; runas luminosas.

---

## S-Grade

### `wpn_s_infinity_sword` — Infinity Sword

**Grade / tipo:** S · Sword · lendário S

**Paleta:** prata branca `#F0F0F5`; ouro `#D4AF37`; glow branco-azul suave no fuller.

**Lâmina:** longsword S imponente; fuller com **luz interna** infinita (símbolo ∞ **original** gravado no centro, não logo comercial); bordas limpas.

**Guarda:** filigrana ouro; cruzeta alta; gemas claras.

**Cabo:** couro branco; pommel ouro com gem.

**Acabamento:** herói lendário; brilho nobre.

---

### `wpn_s_draconic` — Draconic Bow

**Grade / tipo:** S · Bow · lendário S

**Paleta:** escamas verde-bronze `#5A7A6A`; ouro; rubro escuro nos grips.

**Silhueta:** arco **dracônico** — limbs como **escamas/bone** curvadas; aspecto monstruoso elegante.

**Detalhe:** garras de dragão nos limb tips; corda prateada; grip couro com escamas.

**Acabamento:** escamas iridescentes; premium S bow.

---

### `wpn_s_angelslayer` — Angel Slayer

**Grade / tipo:** S · Dagger · crítico S supremo

**Paleta:** prata pura; branco; accent dourado; glow leve no fio.

**Lâmina:** adaga S longa; fio quase branco brilhante; runas sutis “slayer” **genéricas**; perfil angelic-dark contrast (sem IP).

**Guarda:** cruzeta fina prateada ornamental.

**Cabo:** branco/prata; pommel gem clara.

---

### `wpn_s_dragon_hammer` — Dragon Hammer

**Grade / tipo:** S · Mace · tanque S

**Paleta:** ferro escuro; ouro; escamas dragão nos flancos da cabeça; rubro nos olhos do dragão esculpido.

**Cabeça:** martelo **enorme** com **crânio ou cabeça de dragão** estilizada em relevo lateral; faces de impacto planas.

**Cabo:** metal com couro; counterweight ouro.

**Acabamento:** titanic; S-grade mass.

---

### `wpn_s_imperial_staff` — Imperial Staff

**Grade / tipo:** S · Magic Sword (staff) · mage S

**Paleta:** branco marfim; ouro; cristal imperial grande azul ou dourado.

**Haste:** torneada marfim/branco com filigrana ouro; anéis gem-set.

**Topo:** **cristal imperial grande** multifacetado; coroa ouro; glow forte azul-dourado.

**Acabamento:** staff de imperador arcano; máximo prestígio mage S.

---

### `wpn_s_tyrants_fist` — Tyrant Fist

**Grade / tipo:** S · Fist · orc/brawler S

**Paleta:** obsidiana `#0D0D0D`; ouro; accent rubro `#8B0000`.

**Silhueta:** punhos S **massivos** — perfil tyrant = placas grossas, garras longas douradas, braceletes até cotovelo.

**Detalhe:** spikes dourados; runas de domínio gravadas; glow rubro fraco nos nós.

**Acabamento:** brutal lendário; maior fist não-Vesper.

---

## S-Grade Vesper (craft épico)

### `wpn_s_vesper_cutter` — Vesper Cutter (Sword)

**Grade / tipo:** S Vesper · Sword · craft épico

**Paleta:** prata branca; ouro `#FFD700`; gemas safira; luz branca-azul nas ranhuras.

**Lâmina:** espada Vesper **mais espessa** que Infinity; filigrana dourada densa; ranhuras luminosas; gemas no fuller.

**Guarda:** ouro e prata em camadas; brasão Vesper **original** (sol partido estilizado).

**Cabo:** couro branco; pommel gema grande.

**Energia SA:** linhas de luz branca sugerindo haste/health — **sem** texto UI.

---

### `wpn_s_vesper_shaper` — Vesper Shaper (Dagger)

**Grade / tipo:** S Vesper · Dagger

**Paleta:** aço negro `#121212`; ouro; púrpura abyssal `#4B0082`; glow púrpura no fio.

**Lâmina:** adaga Vesper fina; fio com **trilho luminoso púrpura**; ondas assimétricas shaper/sculpt.

**Guarda:** angular ouro-negro; gemas pequenas.

**Energia SA:** aura púrpura contida na lâmina; focus/haste visual.

---

### `wpn_s_vesper_thrower` — Vesper Thrower (Bow)

**Grade / tipo:** S Vesper · Bow

**Paleta:** metal prateado; ouro; energia ciano `#00FFFF` nas limbs; couro branco grip.

**Silhueta:** arco Vesper **futurista-fantasy** — limbs com trilhos de energia; forma aerodinâmica.

**Detalhe:** corda ou **feixe de luz** como string; nocks brilhantes; gem central no grip.

**Energia SA:** foco = ponta de flecha ghost glow opcional (sem flecha sólida).

---

### `wpn_s_vesper_fighter` — Vesper Fighter (Fist)

**Grade / tipo:** S Vesper · Fist · orc

**Paleta:** escamas bronze-escuro; ouro; garras douradas longas; glow laranja nos vents.

**Silhueta:** **garras de fera** integradas — beast claws Vesper; mais orgânico que Tyrant Fist; perfil predador royal.

**Detalhe:** três garras longas por punho; dorso escamado; bracelete ouro.

**Energia SA:** vents brilhantes haste/health.

---

### `wpn_s_vesper_avenger` — Vesper Avenger (Mace)

**Grade / tipo:** S Vesper · Mace · dwarf lord

**Paleta:** aço branco; ouro massivo; rubi grande; bronze escuro.

**Cabeça:** martelo Vesper **colossal** — block rectangular com **gema rubi** incrustada face frontal; runas douradas; faces de impacto chanfradas.

**Cabo:** metal ouro-branco; grip couro; pommel pesado gem.

**Energia SA:** glow rubi pulsante suave na gema.

---

### `wpn_s_vesper_buster` — Vesper Buster (Magic Sword / staff)

**Grade / tipo:** S Vesper · Magic Sword · mage ultimate

**Paleta:** violeta profundo `#2D0A31`; ouro; ciano e magenta nas fissuras; cristal central grande.

**Forma:** staff-buster híbrido — topo **explosivo** de cristal partido com energia a jorrar; haste violeta com filigrana ouro; gaiola aberta no foco.

**Glow:** intenso ciano/magenta nas fissuras; acumen/mana visual.

**Acabamento:** ultimate arcane Vesper; mais energia que Imperial Staff.

---

## Regras paperdoll (todas as armas)

**Duas camadas por arma (1080×984, mesmo preset):**

| Ficheiro | Conteúdo | Enchant |
|----------|----------|---------|
| `equips/<id>.png` | Lâmina, haste superior, topo de staff, arco, etc. | **Sim** (+4) |
| `equips/<id>_grip.png` | Cabo, punho, couro na empunhadura, guarda junto à mão | **Não** |

Stack: corpo → armadura → **lâmina** → **cabo** → mãos. O brilho de enchant fica só na lâmina para não “sujar” as mãos.

**Empunhadura padrão human fighter (espada / adaga / maça):** mão direita no punho; lâmina para baixo-esquerda ~15° ou vertical; punho/cabo em `_grip.png`; lâmina sem punho em `<id>.png`.

**Staff:** terço inferior (couro/grip) em `_grip.png`; haste + topo em `<id>.png`. Eixo vertical; topo pode ultrapassar cabeça.

**Bow:** padrão único por projeto — recomendado **vertical** ao lado direito do corpo, mão esquerda no grip; manter igual em todos os tiers.

**Fist:** tipo `Fist` no catálogo → `#char-weapon-layer` recebe `char-layer--fist` (**z-index 6**, acima de `_hands` / grip). Sem `_grip.png`. Desenhar punho/gauntlet completo no `equips/<id>.png`; `_hands` fica por baixo (antebraço/luva). Pode ser **um punho** no PNG e duplicar na edição.

**Armas de partida (prioridade arte human):**

| ID | Preset típico |
|----|----------------|
| `wpn_ng_trainee_blade` | `human_fighter` |
| `wpn_ng_trainee_focus` | `human_mage` |

---

## Progressão rápida por tipo (referência)

| Tipo | NG → Vesper (forma) |
|------|---------------------|
| **Sword** | madeira → ferro → storm → damascus dark → tallum → infinity glow → vesper filigrana+luz |
| **Dagger** | knife brilhante → stiletto → dark screamer → kris ondulada → soul separator → angel slayer → vesper shaper púrpura |
| **Bow** | training madeira → hunter long → akat → haken composto → carnage heavy → draconic scale → vesper energy |
| **Mace** | apprentice → war hammer → demon splinter → forgotten → dragon hammer → vesper avenger rubi |
| **Staff** | basic wood → wizard → sorcerer → parasword blade → arcana orb → imperial → vesper buster fissuras |
| **Fist** | iron knuckle → battle → spiked grapple → steel typhoon → tyrant fist → vesper fighter claws |
