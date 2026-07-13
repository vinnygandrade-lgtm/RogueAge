# Paperdolls por arquétipo (1080×984)

Cada pasta = um **preset** (`raça` + **fighter ou mage** + **género**). O jogo escolhe em `resolvePaperdollPresetId()` (`js/paperdoll_config.js`).

**Brief visual de cada set de armadura (por grade):** `docs/paperdoll-armor-art-brief.md`.  
**Prompts IA (gerador de imagens):** `docs/paperdoll-armor-image-prompts.md` · `docs/paperdoll-weapon-image-prompts.md`.

## Matriz do jogo (18 presets)

| Raça | Fighter ♂ | Fighter ♀ | Mage ♂ | Mage ♀ |
|------|-------------|-----------|--------|--------|
| **Human** | `human_fighter` | `human_fighter_female` | `human_mage` | `human_mage_female` |
| **Dark Elf** | `dark_elf_fighter` | `dark_elf_fighter_female` | `dark_elf_mage` | `dark_elf_mage_female` |
| **Elf** | `elf_fighter` | `elf_fighter_female` | `elf_mage` | `elf_mage_female` |
| **Orc** | `orc_fighter` | `orc_fighter_female` | `orc_mage` | `orc_mage_female` |
| **Dwarf** | `dwarf_male` | `dwarf_female` | — | — |

**Total: 18 pastas canónicas** (5 raças × 4 combinações, menos 2 mage do Dwarf).

**Dwarf:** só classe fighter na criação (`Dwarven Fighter`) — **2 pastas**, sem mage.

**Mago vs fighter:** `isClasseMagica(charClass)` — qualquer evolução mage (Mage, Dark_Mage, Elf_Mage, Orc_Mage, Cleric, …) usa preset `*_mage*`.

**Nomenclatura:** `{raça}_fighter` ou `{raça}_mage` + sufixo `_female` se género Female. Dwarf mantém `dwarf_male` / `dwarf_female`.

**Humana fighter ≠ human fighter:** Female + fighter → pasta **`human_fighter_female/`** (não reutilizar `human_fighter/`).

### Pastas legadas (opcional — só fallback)

Nomes antigos ainda aceites se faltar arte na pasta canónica:

| Canónico | Legado (fallback) |
|----------|-------------------|
| `dark_elf_fighter` | `dark_elf_male` |
| `dark_elf_fighter_female` | `dark_elf_female` |
| `elf_fighter` | `elf_male` |
| `elf_fighter_female` | `elf_female` |
| `orc_fighter` | `orc_male` |
| `orc_fighter_female` | `orc_female` |

**Meta:** arte nova nas **18 canónicas**; apaga legado quando migrares.

Ver `PAPERDOLL_PRESET_LEGACY` em `paperdoll_config.js`.

---

## Universal (NÃO vão nas pastas de preset)

| O quê | Onde |
|--------|------|
| **Cenário** | `assets/ui/paperdoll_scenery_profile.png` (1080×984) |
| **Ícones slots joias** | `assets/joias/<jewelId>.png` — **256×256**, iguais para todos (sem arte no corpo) |

## Estrutura de cada pasta

```
assets/paperdolls/<preset_id>/
  body.png                    ← corpo (obrigatório 1080×984)
  hands.png                   ← só human_fighter / human_fighter_female: mãos nuas sem armadura
  equips/
    <id_armadura>.png         ← overlay armadura 1080×984
    <id_armadura>_hands.png   ← luvas/gauntlets (par da armadura; todos os presets)
    <id_arma>.png             ← lâmina / haste principal (brilho de enchant)
    <id_arma>_grip.png        ← cabo / empunhadura (sem enchant; par de cada arma)
```

**Regra armadura:** cada set tem **`equips/<id>.png`** + **`equips/<id>_hands.png`** (1080×984, mesmos pés).

**Regra arma:** cada arma tem **`equips/<id>.png`** (lâmina/haste — recebe brilho de enchant) + **`equips/<id>_grip.png`** (cabo/empunhadura — **sem** enchant, z-index entre lâmina e mãos). Mesmo ID em todos os presets onde esse corpo pode equipar a arma. Sem `_grip.png` o jogo mostra só a camada principal (legado).

**Fist (punho):** sem `_grip`; `tipo: 'Fist'` → camada da arma **acima das mãos** (`char-layer--fist`, z6). Arte do punho pode incluir gauntlet completo; `_hands` só antebraço/luva por baixo.

**Regra sem armadura:** human fighter com **arma** e **sem** peito → **`hands.png`** na pasta desse preset (`human_fighter` ou `human_fighter_female`). Outras raças/classe: sem camada extra de mãos até terem o seu `hands.png` (futuro).

### Armas de partida (IDs fixos)

| Quem **recebe no create** | ID | Nome |
|-------------|-----|------|
| Fighter (incl. Dwarf) | `wpn_ng_trainee_blade` | Wooden Sword |
| Mage | `wpn_ng_trainee_focus` | Novice Wand |

Lógica: `createStarterWeaponInstance()` em `js/core_globals.js` · equip no boot: `iniciarJogo()` em `js/core.js`.

**Loja:** ambas têm `preco > 0` (50 Adena base) — **qualquer classe** que equipe a arma usa o overlay do **seu preset**, não só quem começa com ela.

| Exemplo | Preset no paperdoll | Ficheiro quando equipa Basic Staff |
|---------|----------------------|-------------------------------------|
| Humana mage | `human_mage_female` | `human_mage_female/equips/wpn_ng_trainee_focus.png` |
| Humano fighter comprou staff | `human_fighter` | `human_fighter/equips/wpn_ng_trainee_focus.png` |
| Humana mage comprou Wooden Sword | `human_mage_female` | `human_mage_female/equips/wpn_ng_trainee_blade.png` |

**Regra de arte:** mesmo **ID** de ficheiro (`wpn_ng_trainee_focus.png`, `wpn_ng_trainee_blade.png`, …) em **cada pasta de preset** onde esse corpo pode aparecer — **18 pastas** no total. O **design** da arma é o mesmo; a **posição no canvas 1080×984** muda conforme `body.png` / mãos daquele preset.

Prioridade prática: human fighter M/F + human mage M/F → depois as outras raças.

## Expansão — armaduras novas (6×6)

**18 sets** em `src/db/armor_jewel_expansion.ts` — cada um precisa de **`equips/<id>.png`** + **`equips/<id>_hands.png`** em cada preset relevante.

| Linha | IDs (exemplo) | Presets prioritários |
|-------|---------------|----------------------|
| Fighter Chain | `arm_ng_f_chain` … `arm_s_f_chain` | `*_fighter` / `*_fighter_female` / dwarf |
| Mage Weave | `arm_ng_m_woven` … `arm_s_m_woven` | `*_mage` / `*_mage_female` |
| Mage Warden | `arm_ng_m_warden` … `arm_s_m_warden` | `*_mage` / `*_mage_female` |

Brief: `docs/paperdoll-armor-art-brief.md` · Prompts IA: `docs/paperdoll-armor-image-prompts.md` § Expansão 6×6.

## Expansão — armas mage (3 linhas × grade)

**Wand + Channel Staff + Scepter** por grade — cada ID: `equips/<id>.png` + `equips/<id>_grip.png`.

| Grade | Wand | Staff | Scepter |
|-------|------|-------|---------|
| NG | `wpn_ng_trainee_focus` | `wpn_ng_magic` | `wpn_ng_m_scepter` |
| D–S | `wpn_*_m_wand` | staffs legados | `wpn_*_m_scepter` |

Lista completa: `docs/paperdoll-weapon-image-prompts.md` § Mage checklist.

## Ícones de armas (bolsa / loja) — globais

**Não** são os PNGs do `equips/`. Um ícone por arma em **`assets/armas/<weaponId>.png`** (256×256) — **todas as raças** usam o mesmo ficheiro. Só o paperdoll repete por preset. Lista NG: `assets/armas/README.md`.

## Equip no palco

1. `assets/paperdolls/<preset>/equips/<id>.png`
2. pasta legada (se existir no mapa LEGACY)
3. `assets/equips/<id>.png`

**Slots UI** (colunas): ícones **256×256** do catálogo — universais.

## body.png

Sem `body.png` 1080×984 o corpo **não aparece** (aviso F12). Cada preset precisa da **sua** pasta — mulher fighter ≠ homem fighter ≠ mago.
