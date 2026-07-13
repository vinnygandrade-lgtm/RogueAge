# Paperdoll — brief visual dos sets de armadura (por grade)

**Autoridade de IDs/nomes:** `src/db/db_items.ts` → `catalogoArmaduras` (+ `src/db/armor_jewel_expansion.ts`).  
**Contrato técnico:** `docs/paperdoll-art-spec.md`, `assets/paperdolls/README.md`.  
**Regras de identidade:** `.cursor/rules/l2mini-project-rules.mdc` §11 — nomes e visual **próprios** (inspirado no género MMORPG clássico, sem copiar sets oficiais de terceiros).

Guia para desenhar overlays **1080×984** em `assets/paperdolls/<preset>/equips/<id>.png` + par **`equips/<id>_hands.png`**.

---

## Regras gerais de paperdoll

- Mesmo corpo base, **mesmos pés (540, 984)** em todas as camadas do preset.
- **Seis linhas por grade (loja):** 3 **Fighter** (Heavy / Medium / Light) + 3 **Mage** (Heavy Warden / Medium Vestment / Light Weave).
- Campos de catálogo: `armorArchetype` (`fighter`|`mage`), `armorWeight` (`heavy`|`medium`|`light`), `armorStyle` (`Plate`, `Chain`, `Leather`, `Vestment`, `Weave`, `Warden`, …).
- **Fighter Heavy / Light:** ombros largos ou silhueta ágil (como antes).
- **Fighter Medium:** chain mail / half-plate — entre plate e leather.
- **Mage Medium (Robe legado `a3`…`a18`):** vestments / túnica ritual.
- **Mage Light (Weave):** tecido fino, pouca placa, foco em MP/velocidade.
- **Mage Heavy (Warden):** placas rúnicas sobre spellcloth — bulwark arcano.
- **Joias:** 3 conjuntos universais por grade — **Light**, **Medium** (sets `j_*` legados), **Heavy** (`j_*_lt_*`, `j_*_hv_*`).
- Cada armadura = **dois PNGs:** corpo do set + mãos (`_hands`) com luvas/gauntlets coerentes e pose de empunhar arma.

---

## No-Grade — recruta / aldeia

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a1` | Wooden Set | Heavy | Madeira reforçada com couro e ferragens de bronze barato. Peitoral de tábuas, ombreiras simples, sem brilho metálico. Tom marrom/canela — milícia local ou guarda de caravana. **Mãos:** luvas grossas de couro ou mitenes de madeira leve. |
| `a2` | Leather Set | Light | Couro curtido claro, costuras visíveis, colete ou capuz leve. Pouca placa — arqueiro/ladino iniciante. Cinto com bolsas, tornozelos leves. **Mãos:** luvas finas, dedos livres para arco/adaga. |
| `a3` | Devotion Set | Robe | Túnica de acólito: tecido simples (bege/off-white), faixa na cintura, gola alta ou capuz pequeno. Símbolo discreto no peito (runa genérica, identidade própria). **Mãos:** punhos de tecido ou luvas de seda fina. |

**Tom geral:** pobre mas legível; nada reluzente; silhueta ainda “magro” vs grades altos.

---

## D-Grade — primeiro metal de verdade

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a4` | Brigandine Set | Heavy | Placas de ferro sobre gambesão (brigandine). Cinza-aço fosco, rebites visíveis, grevas simples. Ombros quadrados moderados — **primeiro set “soldado”**. **Mãos:** gauntlets de ferro segmentado. |
| `a5` | Manticore Set | Light | Couro escuro com placas nos ombros/joelhos; textura de couro de fera (escamas sutis ou padrão gravado). Vermelho escuro / marrom queimado. Silhueta ágil. **Mãos:** luvas com placas no dorso. |
| `a6` | Knowledge Set | Robe | Manto de erudito: azul profundo ou vinho, bordados geométricos, cinto com pingentes (cristal, chave). **Mãos:** luvas de escriba ou punhos com anéis discretos. |

**Tom geral:** aventureiro de estrada; metal utilitário, pouco decorativo.

---

## C-Grade — veterano de campanha

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a7` | Composite Set | Heavy | Placas sobrepostas: peitoral em camadas, pauldrons largos, cinturão de campanha. Aço claro, detalhes em bronze. **Mais largo que a4.** **Mãos:** gauntlets completos até o antebraço. |
| `a8` | Plated Leather | Light | Couro + placas articuladas ombros/cotovelos/joelhos; peitoral leve de metal. Prata envelhecida + couro preto. Perfil de duelista. **Mãos:** meio-gauntlet elegante. |
| `a9` | Karmian Set | Robe | Robe de mago de campo: roxo/carmesim, faixas douradas/bronze, capa curta. Tecido com leve brilho. **Mãos:** punhos com runas; anéis ou cristal no dorso. |

**Tom geral:** soldado que já sobreviveu a uma guerra; mais volume e simetria.

---

## B-Grade — elite / raid

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a10` | Doom Plate | Heavy | Aço **escuro** (quase negro), ranhuras agressivas. Peitoral massivo, ombreiras pontiagudas, grevas pesadas. Tanque de raid — **silhueta mais larga até aqui**. Filetes vermelho escuro ou púrpura mínimos. **Mãos:** gauntlets pesados. |
| `a11` | Doom Leather | Light | Couro negro, placas angulares de caçador elite. Colete assimétrico leve ou capa curta. Accent carmesim/bronze escuro. **Mãos:** luvas justas, placas nos nós dos dedos. |
| `a12` | Avadon Robe | Robe | Vestes rituais: preto + roxo, capa longa, gola alta. Padrões arcanos simétricos peito/ombros. **Mãos:** luvas longas de tecido encantado. |

**Tom geral:** sombrio, ameaçador; contraste forte com cenário escuro do perfil.

---

## A-Grade — herói / nobreza

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a13` | Dark Crystal | Heavy | Placas negras com **cristais** (azul gelo ou violeta) nas juntas e peitoral — luz interna suave. Forma angular, quase gótica. Ombros altos. **Mãos:** gauntlets com cristais no dorso. |
| `a14` | Majestic Leather | Light | Couro premium (caramelo/dourado) + placas polidas; campeão de arena. Tecido nobre nos ombros (sutil). Brilho metálico visível. **Mãos:** luvas refinadas, punho dourado. |
| `a15` | Tallum Robe | Robe | Manto de arcanista de guerra: azul royal + prata, camadas, ombreiras de tecido armado. Runas maiores, cinto com gemas. **Mãos:** punhos com gemas ou anéis de foco. |

**Tom geral:** nobre e reluzente; primeiro grade com sensação clara de “status”.

---

## S-Grade — lendário

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `a16` | Imperial Crusader | Heavy | Armadura imperial: prata/branco + ouro, emblema **original** do mundo RogueAge (não IP de terceiros). Peitoral esculpido, hint de capa, gorjal alto. **Máxima massa.** **Mãos:** gauntlets imperiais com filigrana. |
| `a17` | Draconic Leather | Light | Couro com escamas dracônicas (verde-bronze ou rubro escuro). Ombreiras com garras estilizadas. Silhueta esguia, brilho nas escamas. **Mãos:** luvas com escamas, garras decorativas curtas. |
| `a18` | Major Arcana | Robe | Vestimenta suprema: branco/ouro ou violeta claro, camadas, runas luminosas grandes. **Mãos:** punhos com luz suave ou cristais. |

**Tom geral:** herói de “capa de trailer”; legível no ícone 256×256 e no paperdoll.

---

## S-Grade Vesper (craft épico)

| ID | Nome | Tipo | Brief visual |
|----|------|------|--------------|
| `arm_s_vesper_heavy` | Vesper Noble Heavy | Heavy | Evolução do Imperial: mais espesso, filigrana dourada, gemas grandes no peitoral. Ouro + branco + bronze escuro. **Claramente acima do a16.** **Mãos:** gauntlets ornamentados. |
| `arm_s_vesper_light` | Vesper Noble Light | Light | Escamas de dragão antigo + metal nobre; linhas aerodinâmicas. Accent dourado ou ciano fraco. **Mãos:** luvas com trilhos metálicos luminosos. |
| `arm_s_vesper_robe` | Vesper Noble Robe | Robe | Robe de alto mago: roxo profundo, fissuras de luz (magenta/ciano). Máximo efeito mágico sem esconder a silhueta. **Mãos:** runas ou energia nos punhos. |

---

## Progressão visual (checklist)

```
NG     → tecido / couro / madeira, pouca placa
D      → ferro fosco, primeiro conjunto militar
C      → placas sobrepostas, simetria de campanha
B      → aço escuro, agressivo, raid
A      → cristal / ouro / nobreza
S      → lendário, emblemas, hints de capa
Vesper → ornamento máximo + gemas / luz
```

| Linha | Evolução de silhueta |
|-------|----------------------|
| **Heavy** | Ombros ↑ e peitoral ↑ a cada grade |
| **Light** | Ombros discretos; detalhe em couro/placa nos pontos certos |
| **Robe** | Túnica ↑; ombreiras de tecido ↑; símbolos ↑, placa ↓ |

---

## Prioridade human fighter (`human_fighter`)

1. **Heavy (principal):** `a1` → `a4` → `a7` → `a10` → `a13` → `a16` → `arm_s_vesper_heavy` — cada um com `_hands`.
2. **Light (Rogue/Hawkeye):** mesma ordem com `a2`, `a5`, `a8`, …
3. **Armas:** ficheiros separados `equips/wpn_….png`; `_hands` devem casar com a empunhadura da espada do tier.

Ao adaptar para **outro preset** (elf, orc, …): mesmos IDs e mesma progressão de grade; muda só proporção/silhueta racial no `body.png` e posição fina do equip na pasta desse preset.

---

## Expansão 6×6 — IDs novos (fighter medium + mage light/heavy)

| Grade | Fighter Medium (`Chain`) | Mage Light (`Weave`) | Mage Heavy (`Warden`) |
|-------|--------------------------|----------------------|------------------------|
| NG | `arm_ng_f_chain` Bronze Chain | `arm_ng_m_woven` Spellweave | `arm_ng_m_warden` Runic Warden |
| D | `arm_d_f_chain` Half-Plate | `arm_d_m_woven` Arcane Loom | `arm_d_m_warden` Sanctum Guard |
| C | `arm_c_f_chain` Campaign Chain | `arm_c_m_woven` Mystic Thread | `arm_c_m_warden` Aegis Rite |
| B | `arm_b_f_chain` Doom Chain | `arm_b_m_woven` Shadow Loom | `arm_b_m_warden` Obsidian Ward |
| A | `arm_a_f_chain` Crystal Chain | `arm_a_m_woven` Starweave | `arm_a_m_warden` Titan Rite |
| S | `arm_s_f_chain` Sentinel Chain | `arm_s_m_woven` Eclipse Weave | `arm_s_m_warden` Void Warden |

**Ícones de bolsa:** `assets/itens/set_<slug>.png` (ver `EXPANSION_ARMOR_ICON_SLUGS` em `armor_jewel_expansion.ts`).  
**Paperdoll:** `assets/paperdolls/<preset>/equips/<id>.png` + `equips/<id>_hands.png` — **18 presets**, mesmo ID em cada pasta.

**Prompts longos (IA):** `docs/paperdoll-armor-image-prompts.md` § Expansão 6×6.

### Silhueta por linha (referência rápida)

| Linha | Silhueta | Entre… |
|-------|----------|--------|
| **Fighter Chain** | Mail + placas parciais; ombros médios; cintura definida | Heavy plate e Light leather da mesma grade |
| **Mage Weave** | Túnica fina, fios/cristais; ombros baixos; sem placa pesada | Vestment (`a3`…) e Warden da mesma grade |
| **Mage Warden** | Placas rúnicas sobre spellcloth; ombros médios-altos; bulwark arcano | Weave (leve) e Vestment (tecido médio) |

---

### No-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_ng_f_chain` | Cota de anéis bronze sobre gambesão bege; placas retangulares nos ombros e peito; rebites visíveis; tom canela/bronze — **entre** Wooden (a1) e Leather (a2). | Meio-gauntlet de couro com anéis no dorso; dedos livres. |
| `arm_ng_m_woven` | Túnica leve com **fios luminosos** discretos no tecido; capuz curto ou gola alta fina; faixa ritual; quase zero metal — **mais ágil** que Devotion (a3). | Punhos de tecido fino; fios brilhantes no pulso; sem placa. |
| `arm_ng_m_warden` | Spellcloth bege com **placas de bronze rúnicas** no peito e ombros; cinto de couro com talismã; bulwark de acólito de batalha — **entre** weave e robe. | Luvas de tecido + placa bronze no dorso; runas gravadas. |

### D-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_d_f_chain` | Half-plate: mail cinza + placas ferro nos ombros/peito; rebites; perfil de soldado híbrido — **entre** Brigandine (a4) e Manticore (a5). | Gauntlets segmentados mail+ferro; couro no interior. |
| `arm_d_m_woven` | Manto de seda azul-vinho com **sigilos bordados**; tecido fluido; cristais minúsculos nas costuras; silhueta esguia. | Luvas de seda com anel de foco; punho bordado. |
| `arm_d_m_warden` | Vestments azul escuro + **placas de ward** ferro nas juntas; runas prateadas no peito; capa curta — tanque arcano D. | Gauntlets de spellcloth com placa de ward no dorso. |

### C-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_c_f_chain` | Mail de campanha aço claro + placas bronze nos ombros; cinturão de couro com fivelas; volume **médio** entre Composite (a7) e Plated Leather (a8). | Gauntlets mail até antebraço; filete bronze. |
| `arm_c_m_woven` | Vestment violeta com **fios de cristal** entretecidos; ombreiras de tecido leve; brilho satinado discreto. | Punhos com cristais minúsculos; tecido longo. |
| `arm_c_m_warden` | Harness rúnico: placas escuras sobre robe carmesim; **aegis** gravado no peito; ombros de ward angulares. | Luvas com placas rúnicas e glow fraco no pulso. |

### B-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_b_f_chain` | Mail aço **negro** + placas angulares; accent carmesim nos elos; silhueta raid **média** entre Doom Plate (a10) e Doom Leather (a11). | Gauntlets escuros segmentados; rebites carmesim. |
| `arm_b_m_woven` | Shadow-silk preto-roxo; fios sombrios no tecido; capa assimétrica curta; **zero placa** — caster rápido B. | Luvas de sombra (tecido escuro); runas mínimas. |
| `arm_b_m_warden` | Placas **obsidiana** sobre spellcloth; runas carmesim; ombros de bulwark; perfil duelista arcano pesado. | Gauntlets obsidiana + spellcloth; glow fraco nas runas. |

### A-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_a_f_chain` | Mail prateado com **elos de cristal**; placas polidas nos ombros; filetes ouro — entre Dark Crystal (a13) e Majestic (a14). | Gauntlets prata com cristais no dorso. |
| `arm_a_m_woven` | Tecido **estrelado** (pontos de luz no weave); azul royal + prata; túnica longa fluida; máximo MP visual. | Punhos com constelações bordadas; cristais nos dedos. |
| `arm_a_m_warden` | Harness titânico: placas prateadas massivas sobre robe branco-ouro; runas grandes; **frontline arcanist**. | Gauntlets titânio rúnico; gemas no knuckle. |

### S-Grade — expansão

| ID | Brief visual | Mãos (_hands) |
|----|--------------|---------------|
| `arm_s_f_chain` | Mail lendário prata-branco + placas imperiais; emblema RogueAge no peito; **entre** Crusader (a16) e Draconic (a17). | Gauntlets imperiais mail+placa; filigrana ouro. |
| `arm_s_m_woven` | Eclipse weave: tecido negro com **fios de eclipse** (borda dourada, centro escuro); capa longa luminosa; silhueta esguia S. | Punhos com anel de eclipse; glow suave nos fios. |
| `arm_s_m_warden` | Placas **void** (negro-violeta) sobre spellcloth; runas luminosas; bulwark máximo mage S — **entre** weave e Major Arcana (a18). | Gauntlets void com energia no pulso; placas nos nós. |

### Checklist paperdoll — armaduras novas

Para **cada** ID acima, em **cada** preset onde o arquétipo equipa:

- [ ] `equips/<id>.png` (1080×984)
- [ ] `equips/<id>_hands.png` (1080×984, par da armadura)

**Prioridade:** `human_mage` / `human_mage_female` (Weave + Warden) · `human_fighter` / `human_fighter_female` (Chain) → depois elf, dark elf, orc.
