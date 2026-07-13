# Paperdoll — características das armas (para prompts de imagem)

Só a **descrição visual** de cada arma — detalhada para colares no teu prompt.  
Combina com corpo, mãos (`hands.png` ou `_hands`), estilo, etc.  
**IDs:** `src/db/db_items.ts` + `src/db/weapon_mage_expansion.ts` · **Spec:** `docs/paperdoll-art-spec.md`

**Paperdoll (palco):** `assets/paperdolls/<preset>/equips/<id>.png` + `equips/<id>_grip.png` — **1080×984**.  
**Ícone (bolsa/loja/slots):** `assets/armas/<id>.png` — **256×256** (ficheiro **diferente**; ver `assets/armas/README.md`).

**Tipos no jogo:** Sword · Dagger · Bow · Mace · **Wand** · **Scepter** · Magic Sword (channel staff) · Fist (punhos/garras equipados).

**Mage — 3 silhuetas por grade (obrigatório distinguir):**

| Linha | Tipo catálogo | Forma | Empunhadura paperdoll |
|-------|---------------|-------|------------------------|
| **Focus · Wand** | `Wand` | Haste **curta** (antebraço–ombro); topo cristal/runas; **uma mão** | Vertical ou 10°; grip curto em `_grip.png` |
| **Channel · Staff** | `Magic Sword` | Bastão **longo** (acima da cabeça); haste fina-média; **duas mãos** | Terço inferior em `_grip.png`; haste+topo em `<id>.png` |
| **Dominion · Scepter** | `Scepter` | Haste **média-grossa**; topo **ornamental** (orb, coroa, bloco rúnico); uma ou duas mãos | Mais “pesado” que wand; mais **curto** que staff |

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

### `wpn_ng_trainee_focus` — Novice Wand (partida mage)

**Grade / tipo:** No-Grade · **Wand** · **arma inicial de todo mage** (preco 0) · linha Focus

**Paleta:** madeira castanha `#8B6914`; couro escuro no grip; bronze oxidado no anel do topo; **sem** cristal brilhante.

**Silhueta:** varinha **curta** — comprimento visual ~antebraço a ombro (muito mais curta que staff); haste fina.

**Haste:** madeira torneada; diâmetro fino constante; anel de bronze simples sob o foco.

**Topo / foco:** pequeno bloco de madeira ou ferragem bronze; runa gravada rasa; **não** orb luminoso.

**Empunhadura:** **uma mão** no punho; varinha vertical ou inclinada ~10°; alinhada à mão direita do mage preset.

**Acabamento:** acólito de estrada; zero glow; mate. **Não** desenhar como bastão longo — distinto de Channel Staff.

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

### `wpn_ng_magic` — Channel Staff

**Grade / tipo:** No-Grade · Magic Sword (channel staff) · mage loja NG · linha Channel

**Paleta:** madeira escura `#5C4033`; bronze no anel do topo; cristal opaco cinza-claro minúsculo.

**Silhueta:** bastão **longo** (extensão acima da cabeça); haste esguia — **claramente mais alto** que Novice Wand.

**Haste:** madeira escura reta; anéis de bronze a cada terço.

**Topo:** garra de bronze segurando cristal **pequeno** opaco; brilho interno quase nulo.

**Empunhadura:** duas mãos possíveis; staff vertical; terço inferior em `_grip.png`.

**Acabamento:** primeiro staff “comprado”; equilibrado entre wand curta e scepter.

---

### `wpn_ng_m_scepter` — Bronze Scepter

**Grade / tipo:** No-Grade · **Scepter** · linha Dominion

**Paleta:** bronze `#CD7F32`; madeira escura no grip; couro marrom.

**Silhueta:** haste **média** (entre wand e staff); diâmetro **mais grosso** que wand; topo **ornamental** (orb bronze ou coroa de runas).

**Topo:** esfera ou bloco bronze com runas; sem glow forte; peso visual “regal”.

**Empunhadura:** uma mão no punho grosso; scepter vertical; `_grip.png` = punho couro enrolado.

**Acabamento:** battle mage NG; distinto da wand fina e do staff alto.

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

### `wpn_d_wizard_staff` — Wizard Channel Staff

**Grade / tipo:** D · Magic Sword (channel staff) · linha Channel

**Paleta:** madeira negra `#2F2F2F`; prata nos anéis; cristal azul pálido pequeno.

**Haste:** reta; anéis prateados; entalhes de runas rasas.

**Topo:** cristal azul **facetado médio**; setting prateado; glow interno **suave**.

**Acabamento:** mage D-grade channel; bastão longo — mais imponente que NG Channel Staff.

---

### `wpn_d_m_wand` — Crystal Wand

**Grade / tipo:** D · **Wand** · linha Focus

**Paleta:** cristal azul pálido `#A8C8E8`; prata no anel; haste madeira negra fina.

**Silhueta:** varinha curta D; cristal facetado **médio** no topo; haste fina.

**Topo:** cristal azul com glow interno suave; setting prateado minimalista.

**Empunhadura:** uma mão; vertical; distinto do staff longo ao lado.

---

### `wpn_d_m_scepter` — Iron Scepter

**Grade / tipo:** D · **Scepter** · linha Dominion

**Paleta:** ferro fosco `#4A4A4A`; bronze nos anéis; couro escuro no grip.

**Silhueta:** haste grossa média; topo bloco de ferro com **coroa de runas** ou orb metálico.

**Topo:** peso visual; sem cristal grande — autoridade física.

**Empunhadura:** punho largo; uma mão; mais curto que wizard staff.

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

### `wpn_c_sorcerer_staff` — Sorcerer Channel Staff

**Grade / tipo:** C · Magic Sword (channel staff) · linha Channel

**Paleta:** madeira roxo-escuro `#3D2B4F`; prata; cristal violeta `#8B5CF6`.

**Haste:** torneada; runas prateadas entalhadas em espiral.

**Topo:** cristal violeta **médio-grande**; glow interno médio; coroa prateada de quatro pontas **original**.

**Acabamento:** mago de campo C; bastão longo channel; sheen satinado na haste.

---

### `wpn_c_m_wand` — Aether Wand

**Grade / tipo:** C · **Wand** · linha Focus

**Paleta:** violeta `#8B5CF6`; prata; haste escura fina.

**Silhueta:** varinha C; cristal violeta médio; haste **curta** — contraste claro com Sorcerer Channel Staff alto.

**Topo:** cristal aether facetado; glow médio; anel prateado.

**Empunhadura:** uma mão; `_grip.png` = punho couro violeta escuro.

---

### `wpn_c_m_scepter` — War Scepter

**Grade / tipo:** C · **Scepter** · linha Dominion

**Paleta:** aço campanha `#8A8A98`; bronze; couro marrom.

**Silhueta:** haste grossa; topo **bloco de guerra** com runas — orb metálico ou coroa de quatro pontas **diferente** do cristal do staff.

**Acabamento:** frontline caster C; mais curto e pesado que channel staff.

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

### `wpn_b_parasword` — Parasword Channel Staff

**Grade / tipo:** B · Magic Sword (channel staff) · linha Channel

**Paleta:** prata `#C0C0C0`; azul arcana `#2563EB`; cabo azul escuro.

**Silhueta:** staff-channel híbrido spellblade — haste com **lâmina estreita integrada** no topo ou lateral; perfil **longo** (channel); runas azul glow.

**Haste / lâmina:** canal de runas azul; fio prata na protrusão blade; mais alto que wand/scepter B.

**Cabo:** couro azul; pommel com cristal plano; terço inferior em `_grip.png`.

---

### `wpn_b_m_wand` — Shadow Wand

**Grade / tipo:** B · **Wand** · linha Focus

**Paleta:** obsidiana `#1A1A22`; carmesim `#6B1F1F` no cristal; prata fosca.

**Silhueta:** varinha B sombria; cristal carmesim pequeno-médio; haste fina curta.

**Topo:** glow fraco carmesim; perfil assassino arcano — **não** espada longa.

---

### `wpn_b_m_scepter` — Rune Scepter

**Grade / tipo:** B · **Scepter** · linha Dominion

**Paleta:** aço escuro; runas carmesim gravadas; ouro fosco no topo.

**Silhueta:** haste média grossa; topo **bloco rúnico** angular; runas brilham fraco.

**Acabamento:** dominion B; peso visual entre parasword (longo) e shadow wand (curto).

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

### `wpn_a_arcana_mace` — Arcana Channel Staff

**Grade / tipo:** A · Magic Sword (channel staff) · linha Channel

**Paleta:** prata; violeta `#7C3AED`; cristal grande violeta.

**Forma:** bastão channel longo — topo com **orb violeta** em gaiola prateada; haste torneada com runas; bloco orbital (entre staff clássico e mace).

**Glow:** médio-forte violeta no orb; runas luminosas; **altura staff** acima da cabeça.

---

### `wpn_a_m_wand` — Star Wand

**Grade / tipo:** A · **Wand** · linha Focus

**Paleta:** prata polida; cristal estrela azul-branco; ouro nos anéis.

**Silhueta:** varinha A nobre; cristal em forma de **estrela** ou cometa no topo; haste curta fina.

**Topo:** glow médio branco-azul; filigrana ouro no anel — distinto do orb grande do channel staff.

---

### `wpn_a_m_scepter` — Titan Scepter

**Grade / tipo:** A · **Scepter** · linha Dominion

**Paleta:** titânio prateado; ouro; gemas no topo.

**Silhueta:** haste grossa A; topo **coroa de titã** — orb em gaiola massiva de metal, não cristal fino de wand.

**Acabamento:** frontline arcanist A; autoridade e peso visual.

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

### `wpn_s_imperial_staff` — Imperial Channel Staff

**Grade / tipo:** S · Magic Sword (channel staff) · linha Channel

**Paleta:** branco marfim; ouro; cristal imperial grande azul ou dourado.

**Haste:** torneada marfim/branco com filigrana ouro; anéis gem-set; bastão **longo** lendário.

**Topo:** **cristal imperial grande** multifacetado; coroa ouro; glow forte azul-dourado.

**Acabamento:** channel staff de imperador arcano; máximo prestígio mage S (loja).

---

### `wpn_s_m_wand` — Eclipse Wand

**Grade / tipo:** S · **Wand** · linha Focus

**Paleta:** negro eclipse `#1A1020`; borda dourada `#D4AF37`; cristal escuro com halo dourado.

**Silhueta:** varinha S; cristal eclipse (escuro com anel luminoso); haste curta ébano/ouro.

**Topo:** glow forte no halo; **curta** — contraste máximo com Imperial Channel Staff.

---

### `wpn_s_m_scepter` — Void Scepter

**Grade / tipo:** S · **Scepter** · linha Dominion

**Paleta:** void violeta `#2D0A31`; prata; energia magenta/ciano nas runas.

**Silhueta:** haste grossa S; topo **bloco void** com fissuras de energia; orb em gaiola fechada.

**Acabamento:** dominion S shop; mais massivo que eclipse wand; mais curto que imperial staff.

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

**Acabamento:** ultimate arcane Vesper channel; mais energia que Imperial Channel Staff.

---

## Mage — checklist paperdoll (18 presets × 3 linhas)

Para **cada** ID mage abaixo, em **cada** preset `*_mage` / `*_mage_female` (e opcionalmente outros presets se o corpo equipar):

| Ficheiro | Conteúdo |
|----------|----------|
| `equips/<id>.png` | Haste superior + topo (wand cristal / staff alto / scepter ornamental) — enchant +4 |
| `equips/<id>_grip.png` | Punho / terço inferior — **sem** enchant |

**IDs por grade (3 cada):**

| Grade | Wand (Focus) | Channel Staff | Scepter (Dominion) |
|-------|--------------|---------------|---------------------|
| NG | `wpn_ng_trainee_focus` | `wpn_ng_magic` | `wpn_ng_m_scepter` |
| D | `wpn_d_m_wand` | `wpn_d_wizard_staff` | `wpn_d_m_scepter` |
| C | `wpn_c_m_wand` | `wpn_c_sorcerer_staff` | `wpn_c_m_scepter` |
| B | `wpn_b_m_wand` | `wpn_b_parasword` | `wpn_b_m_scepter` |
| A | `wpn_a_m_wand` | `wpn_a_arcana_mace` | `wpn_a_m_scepter` |
| S | `wpn_s_m_wand` | `wpn_s_imperial_staff` | `wpn_s_m_scepter` |
| S Vesper | — | `wpn_s_vesper_buster` | — |

**Ícones globais (256×256):** `assets/armas/<id>.png` — um ficheiro por ID, todas as raças.

**Prioridade arte:** `human_mage` + `human_mage_female` → elf/dark_elf/orc mage presets.

**Regra crítica:** na mesma grade, os **três PNGs devem ser claramente distinguíveis** — wand **curta**, staff **alta**, scepter **média grossa**.

---

## Regras paperdoll (todas as armas)

**Duas camadas por arma (1080×984, mesmo preset):**

| Ficheiro | Conteúdo | Enchant |
|----------|----------|---------|
| `equips/<id>.png` | Lâmina, haste superior, topo de staff/wand/scepter, arco, etc. | **Sim** (+4) |
| `equips/<id>_grip.png` | Cabo, punho, couro na empunhadura, guarda junto à mão | **Não** |

Stack: corpo → armadura → **lâmina** → **cabo** → mãos. O brilho de enchant fica só na lâmina/haste superior para não “sujar” as mãos.

**Empunhadura padrão human fighter (espada / adaga / maça):** mão direita no punho; lâmina para baixo-esquerda ~15° ou vertical; punho/cabo em `_grip.png`; lâmina sem punho em `<id>.png`.

**Channel staff:** terço inferior (couro/grip) em `_grip.png`; haste + topo em `<id>.png`. Eixo vertical; topo pode ultrapassar cabeça.

**Wand:** haste **curta**; punho inteiro ou terço inferior em `_grip.png`; cristal/topo em `<id>.png`. Uma mão.

**Scepter:** haste média; punho grosso em `_grip.png`; topo ornamental (orb/coroa) em `<id>.png`. Mais curto que staff.

**Bow:** padrão único por projeto — recomendado **vertical** ao lado direito do corpo, mão esquerda no grip; manter igual em todos os tiers.

**Fist:** tipo `Fist` no catálogo → `#char-weapon-layer` recebe `char-layer--fist` (**z-index 6**, acima de `_hands` / grip). Sem `_grip.png`. Desenhar punho/gauntlet completo no `equips/<id>.png`; `_hands` fica por baixo (antebraço/luva). Pode ser **um punho** no PNG e duplicar na edição.

**Armas de partida (prioridade arte human):**

| ID | Nome | Preset típico |
|----|------|----------------|
| `wpn_ng_trainee_blade` | Wooden Sword | `human_fighter` |
| `wpn_ng_trainee_focus` | Novice Wand | `human_mage` |

---

## Progressão rápida por tipo (referência)

| Tipo | NG → Vesper (forma) |
|------|---------------------|
| **Sword** | madeira → ferro → storm → damascus dark → tallum → infinity glow → vesper filigrana+luz |
| **Dagger** | knife brilhante → stiletto → dark screamer → kris ondulada → soul separator → angel slayer → vesper shaper púrpura |
| **Bow** | training madeira → hunter long → akat → haken composto → carnage heavy → draconic scale → vesper energy |
| **Mace** | apprentice → war hammer → demon splinter → forgotten → dragon hammer → vesper avenger rubi |
| **Staff (channel)** | channel wood → wizard → sorcerer → parasword → arcana → imperial → vesper buster |
| **Wand (focus)** | novice wood → crystal D → aether C → shadow B → star A → eclipse S |
| **Scepter (dominion)** | bronze NG → iron D → war C → rune B → titan A → void S |
| **Fist** | iron knuckle → battle → spiked grapple → steel typhoon → tyrant fist → vesper fighter claws |
