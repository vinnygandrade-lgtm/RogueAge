# Paperdoll — arte 1080×984 + pastas por preset

**Regras:** `.cursor/rules/l2mini-project-rules.mdc` — **§5 — Paperdoll**, **§11.3**.  
**Pastas:** `assets/paperdolls/README.md`.  
**Brief visual dos sets (grade × Heavy/Light/Robe):** `docs/paperdoll-armor-art-brief.md`.  
**Prompts detalhados para gerador de imagens (IA):** `docs/paperdoll-armor-image-prompts.md` (armaduras) · `docs/paperdoll-weapon-image-prompts.md` (armas) · `docs/jewel-image-prompts.md` (joias).

## Universal (todas as classes)

| Asset | Caminho | Tamanho |
|-------|---------|---------|
| **Cenário** | `assets/ui/paperdoll_scenery_profile.png` | 1080×984 |
| **Ícones joias** (neck, ear, ring nos slots) | `assets/joias/<jewelId>.png` | **256×256**, **global** — **sem** layer no corpo |
| **Ícones armas** (bolsa, loja, slot perfil) | `assets/armas/<weaponId>.png` | **256×256**, **global** (uma cópia; todas as raças) |

Não duplicar cenário, ícones de joias nem ícones de armas em `assets/paperdolls/<preset>/`.  
Ícones de joias **≠** paperdoll — ver `assets/joias/README.md`.  
Ícones de armas **≠** overlays do paperdoll — ver `assets/armas/README.md`.

## Por preset (só o que muda entre personagens)

```
assets/paperdolls/<preset_id>/
  body.png
  hands.png                    ← fallback genérico (opcional)
  equips/<id>.png              ← armadura ou lâmina/haste da arma (1080×984)
  equips/<id>_hands.png        ← mãos (par de cada armadura; 1080×984)
  equips/<id>_grip.png         ← cabo da arma (par de cada arma; 1080×984; sem enchant)
```

| `preset_id` | Quem |
|-------------|------|
| `human_fighter` | Humano fighter (M) |
| `human_fighter_female` | Humana fighter |
| `human_mage` | Humano mage (M) |
| `human_mage_female` | Humana mage |
| `dark_elf_fighter` / `_female` | Dark Elf fighter M/F |
| `dark_elf_mage` / `_female` | Dark Elf mage M/F |
| `elf_fighter` / `_female` | Elf fighter M/F |
| `elf_mage` / `_female` | Elf mage M/F |
| `orc_fighter` / `_female` | Orc fighter M/F |
| `orc_mage` / `_female` | Orc mage M/F |
| `dwarf_male` / `dwarf_female` | Anão fighter M/F (**sem mage**) |

`resolvePaperdollPresetId()` — raça + `isClasseMagica(charClass)` + género — `js/paperdoll_config.js`. Detalhe: `assets/paperdolls/README.md`.

### Carregamento equip no palco

1. `assets/paperdolls/<preset>/equips/<id>.png`
2. `assets/equips/<id>.png`
3. `img` do catálogo (arma)

Corpo: `body.png` → fallback `assets/chars/…` legado.

### Mãos

| Situação | Ficheiro |
|----------|----------|
| **Armadura + arma** (todos os presets) | `equips/<id_armadura>_hands.png` |
| **Sem armadura + arma** (só human fighter M/F) | `hands.png` na pasta do preset |
| Legado human fighter | `assets/chars/human_fighter_hands.png` |

**`hands.png` não é fallback de armadura** — é mãos nuas do preset quando não há peito equipado. Só em `human_fighter/` e `human_fighter_female/`.

Com armadura, falta de `_hands` **não** cai em `hands.png` (aviso F12).

### Armas de partida (personagem novo)

Atribuídas em `iniciarJogo()` via `createStarterWeaponInstance()` — `L2MINI_STARTER_WEAPON_IDS` em `js/core_globals.js`.

| Linha | ID catálogo | Nome no jogo | Paperdoll overlay |
|-------|-------------|--------------|-------------------|
| **Fighter** (todas raças fighter, incl. Dwarf) | `wpn_ng_trainee_blade` | Wooden Sword | `equips/wpn_ng_trainee_blade.png` |
| **Mage** (Human, Elf, Dark Elf, Orc mage) | `wpn_ng_trainee_focus` | Basic Staff | `equips/wpn_ng_trainee_focus.png` |

- **preco 50** (base) — repurchase barato na loja **No-Grade → Weapons**; escala leve com nível via `EconomyBalance`; **grátis** só no create via `createStarterWeaponInstance`.
- **1080×984**, mesma grelha; empunhadura alinhada às mãos (`hands.png` ou `_hands` da armadura).
- Ícone na bolsa/slots: `assets/armas/<weaponId>.png` (**256×256**) via `catalogWeaponIconPath` em `db_items.js` — separado do overlay do palco.
- Até existir PNG no preset, o cliente tenta `img` do catálogo como fallback (`ui_paperdoll.js`).

**Prioridade human fighter:** `equips/wpn_ng_trainee_blade.png` junto com `hands.png` (sem armadura) ou `_hands` (com armadura).

---

## Grelha 1080×984 (corpo e equips no palco)

Pés **(540, 984)**; silhueta **X 237–863**; chão do cenário **Y 900–960**.

Empilhamento: `.paperdoll-character-stack`, `object-fit: fill`, `charScale: 1`.

---

## Sombra nos pés — padrão v1 (aprovado, não regredir)

**Autoridade numérica:** `PAPERDOLL_CONFIG` + `PAPERDOLL_FOOT_SHADOW_STANDARD === 'v1'` em `js/paperdoll_config.js`.  
**Motor:** `syncPaperdollFootShadow` em `js/ui_paperdoll.js` — posição/largura via **normas do canvas 1080×984** (scan alpha do `body.png`); **sem** `getBoundingClientRect` / realign no zoom.

| Parâmetro | Valor | Notas |
|-----------|-------|--------|
| `footShadowHeightPx` | **24** | Altura do oval (~2,44% do stack) |
| `footShadowWidthBoost` | **1.22** | Largura scan × boost |
| `footShadowWidthPadPx` | **28** | Padding horizontal extra (norma 1080) |
| `footShadowWidthMinPct` / `MaxPct` | **18** / **52** | Clamps JS (% do stack) |
| `footShadowFallbackWidthPct` | **30** | CSS antes de `--live` |
| `feetBandHeightRatio` | **0.05** | Faixa de scan nos pés |
| `artAnchors.stageBottom` | **960** | Chão do cenário → `--pd-stack-bottom` **2,439%** |

**Layout (HTML/CSS):**

- `.paperdoll-foot-shadow` = **primeiro filho** de `.paperdoll-character-stack` (antes das `<img class="char-layer">`).
- **`z-index: 0`** na sombra; camadas do personagem **≥ 1** (sombra **atrás** dos pés).
- Stack: `bottom: var(--pd-stack-bottom)` (% do painel, estável no zoom); camadas **sem** `--pd-feet-align-y`.
- Gradiente/blur: `css/paperdoll-layout.css` (`.paperdoll-foot-shadow`).

Ao mudar o look da sombra: editar **`PAPERDOLL_CONFIG`**, correr `applyPaperdollConfigAll`, atualizar **esta secção** e **§5 — Paperdoll** nas regras.

---

## Código

- `js/paperdoll_config.js` — presets, URLs
- `js/ui_paperdoll.js` — `atualizarVisualPaperdoll`
- `css/paperdoll-layout.css` — cenário via CSS global (`--pd-scenery-url` só se override futuro explícito)
