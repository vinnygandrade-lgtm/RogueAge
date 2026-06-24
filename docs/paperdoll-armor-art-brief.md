# Paperdoll — brief visual dos sets de armadura (por grade)

**Autoridade de IDs/nomes:** `js/db_items.js` → `catalogoArmaduras`.  
**Contrato técnico:** `docs/paperdoll-art-spec.md`, `assets/paperdolls/README.md`.  
**Regras de identidade:** `.cursor/rules/l2mini-project-rules.mdc` §11 — nomes e visual **próprios** (inspirado no género MMORPG clássico, sem copiar sets oficiais de terceiros).

Guia para desenhar overlays **1080×984** em `assets/paperdolls/<preset>/equips/<id>.png` + par **`equips/<id>_hands.png`**.

---

## Regras gerais de paperdoll

- Mesmo corpo base, **mesmos pés (540, 984)** em todas as camadas do preset.
- Três linhas por grade: **Heavy** (guerreiro/tanque), **Light** (ágil/crit), **Robe** (mago/clérigo).
- **Heavy:** ombros largos, peitoral grosso — silhueta mais “larga” a cada grade.
- **Light:** cintura marcada, menos placa, couro/placas pontuais.
- **Robe:** túnica/manto, menos metal, mais tecido e símbolos arcanos.
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
| `a16` | Imperial Crusader | Heavy | Armadura imperial: prata/branco + ouro, emblema **original** do mundo L2 Mini (não IP de terceiros). Peitoral esculpido, hint de capa, gorjal alto. **Máxima massa.** **Mãos:** gauntlets imperiais com filigrana. |
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
