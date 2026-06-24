# L2 Mini — Balanceamento oficial (referência)

Documento de produto para **não regressar** decisões já aplicadas no código. Ao alterar stats, crítico, equipamento ou pools mágicos, **cruzar com esta lista** e atualizar este ficheiro na mesma PR quando a regra mudar.

**Última revisão (conteúdo espelhado no repo):** progressão por nível, cap de crítico, classes mágicas, modifiers de classe, catálogo de equipamento (incl. punhos D/B/A), joias (MP em brincos).

---

## 1. Progressão por nível

Definido em `js/core_globals.js` como `window.L2MINI_STAT_PER_LEVEL` (usado em `calcularStatusGlobais` e bots Olympiad):

| Campo   | Valor |
|---------|-------|
| `hp`    | 7     |
| `mp`    | 2     |
| `pAtk`  | 1     |
| `mAtk`  | 1     |
| `pDef`  | 1.2   |
| `mDef`  | 1     |
| `atkSpdMs` | 0 (cadência via `mod.spd` e bónus de equipamento) |

---

## 2. Crítico (oficial)

- **Teto global:** `window.L2MINI_CRIT_RATE_CAP` (**70**%).  
- **Função:** `window.applyCritRateCap(value)` — usada em:
  - `js/core_stats.js` (valor final em `playerStats.critRate`)
  - `js/skills_engine.js` (Mortal Strike / Deadly Blow: `critRate + 12`, depois cap)
  - `js/olympiad_bots.js` (`critRate` dos bots)
- **UI:** `playerStatBreakdown.critParts` inclui `rawBeforeCap` e `cap`; modal de stats detalhados mostra nota quando a soma ultrapassa o teto (i18n `game.inventoryUi.detail.lblCritCapApplied` em **en** + **pt-BR**).
- **Auto-ataque físico:** `js/combat_math.js` usa `playerStats.critRate` (já capado). Magos (`isClasseMagica`) não seguem a mesma ramo de crítico no auto-ataque.

**Filosofia:** classes rápidas têm **mais** `mod.crit` que tanques, mas **nunca** crítico garantido só por stacking (classe + Vesper + joias). Valores altos de `mod.crit` nas classes foram **reduzidos** em relação ao histórico (ex.: Adventurer, Ghost Sentinel, Sagittarius, etc.) — ver `js/classes.js`.

**Equipamento endgame (crítico em item):** bónus `bonusCrit` mais contidos em itens S elite / loja, alinhados ao teto (ex.: Vesper Light/Shaper/Thrower, Angel Slayer, Draconic Bow) — ver `js/db_items.js`.

---

## 3. Linha mágica vs física (`isClasseMagica`)

Definido em `js/core_globals.js` (Set + IIFE). Determina **pool** de HP/MP/dano base da **raça** (mage vs fighter), CP (0.4 vs 0.6 + ajustes Orc/Dwarf), e ramos de UI/combate ligados a mago.

**Inclui:** magos, curas, invocadores, shamans orcs (lista completa no ficheiro). **Exclui** dance/song típicos na linha física (ex.: Sword Muse / Swordsinger) conforme comentário no código.

**Modifiers de classe** afinados para papéis (ex.: Soultaker/Archmage def/hp, Cardinal, Storm Screamer, etc.) — ver `js/classes.js` (bloco anterior+esta doc).

---

## 4. Armaduras (três tipos)

Catálogo: `js/db_items.js` → `catalogoArmaduras`.

| Tipo   | P.Def típico | Foco principal |
|--------|--------------|----------------|
| Heavy  | Maior        | `bonusHp`      |
| Light  | Médio        | `bonusSpd`, `bonusCrit` |
| Robe   | Menor        | `bonusMp`, `bonusMDef` |

**Vesper (craft S):** Heavy (tanque/bruiser), Light (DPS ágil), Robe (MP + `mAtk` + cast). Crítico da Light Vesper **não** deve voltar a valores que anulem o cap global sem reavaliação explícita.

---

## 5. Armas — escada por tipo

Catálogo: `js/db_items.js` → `catalogoArmas`.

- **Progressão coerente** por grade dentro de cada família (espada, adaga, arco, maça híbrida, staff).
- **Punhos (Fist) — oficial:** existem degraus **D, C, B, A e S** na loja (`wpn_d_iron_knuckle`, `wpn_c_knuckle`, `wpn_b_spiked_grapple`, `wpn_a_steel_typhoon`, `wpn_s_tyrants_fist` + Vesper Fighter). Não remover estes degraus — eram buraco de progressão para Monk/Tyrant.

---

## 6. Joias

Catálogo: `js/db_items.js` → `catalogoJoias`.

- **Brincos (MP oficial, alinhado a conjuradores + robe):**  
  - C Aquastone ear: **+38 MP** (não rebaixar sem revisar magos).  
  - A Majestic ear: **+115 MP**.  
  - S Tateossian ear: **+205 MP**.  
- Joias partilham **pAtk/mAtk** simétricos no topo — aceite para “generic ladder”; alterações futuras podem especializar por slot com critério explícito.

---

## 7. Fórmula de dano (jogador → alvo)

Referência: `js/combat_math.js` — asintótica `(Atk × 1100) / (350 + Def)`, piso de dano % do Atk, mago usa `mAtk`/`mDef` onde aplicável.

---

## 8. Como manter este doc

1. Qualquer mudança a `L2MINI_STAT_PER_LEVEL`, `L2MINI_CRIT_RATE_CAP`, lista `isClasseMagica`, ou rebalance grande em `classes.js` / `db_items.js` → **atualizar esta secção** e mencionar no commit.  
2. Após editar `locales_bundle.js`, correr `node --check js/i18n/locales_bundle.js`.  
3. Este ficheiro é a **fonte de verdade de produto** para balance; o código é a **fonte de verdade mecânica** — devem coincidir.

---

*Balanceamento declarado oficial pelo projeto L2 Mini. Preservar em git para não perder histórico.*
