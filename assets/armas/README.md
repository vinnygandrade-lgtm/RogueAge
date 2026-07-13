# Ícones de armas (bolsa / loja / slots)

**256×256** PNG, quadrado, moldura estilo projeto (ver GDD §11.3).

Caminho canónico: **`assets/armas/<id_da_arma>.png`** — o `id` é o mesmo de `catalogoArmas` em `js/db_items.js` (`catalogWeaponIconPath`).

## Global (todas as raças / classes)

**Um ficheiro por arma para todo o jogo** — Humano, Elf, Orc, Dark Elf, Dwarf, fighter ou mage equipam o mesmo ícone na bolsa, loja e slots. **Não** criar pasta por raça nem por preset.

## Separado do paperdoll

| Uso | Pasta | Por raça? | Exemplo |
|-----|--------|-----------|---------|
| **Ícone** (inventário, loja, slot perfil) | `assets/armas/` | **Não** — global | `wpn_ng_trainee_blade.png` |
| **Personagem no palco** | `assets/paperdolls/<preset>/equips/` | **Sim** — 18 presets | `wpn_ng_trainee_blade.png` + `_grip.png` |

Não reutilizar o PNG 1080×984 do paperdoll como ícone.

## NG — armas com arte paperdoll (human_fighter)

Coloca estes quatro ícones aqui:

| Arma | Ficheiro de ícone |
|------|-------------------|
| Wooden Sword | `wpn_ng_trainee_blade.png` |
| Basic Staff | `wpn_ng_trainee_focus.png` |
| Long Sword | `wpn_ng_longsword.png` |
| Shining Knife | `wpn_ng_dagger.png` |

As outras armas NG no catálogo ainda usam placeholders legados até teres ícone próprio.

## Mage — 3 linhas por grade (ícones `assets/armas/`)

Cada ID = **`assets/armas/<id>.png`** (256×256). Paperdoll separado por preset (ver acima).

| Grade | Wand (Focus) | Channel Staff | Scepter (Dominion) |
|-------|--------------|---------------|---------------------|
| NG | `wpn_ng_trainee_focus` ✓ | `wpn_ng_magic` ✓ | `wpn_ng_m_scepter` |
| D | `wpn_d_m_wand` | `wpn_d_wizard_staff` ✓ | `wpn_d_m_scepter` |
| C | `wpn_c_m_wand` | `wpn_c_sorcerer_staff` ✓ | `wpn_c_m_scepter` |
| B | `wpn_b_m_wand` | `wpn_b_parasword` (placeholder) | `wpn_b_m_scepter` |
| A | `wpn_a_m_wand` | `wpn_a_arcana_mace` (placeholder) | `wpn_a_m_scepter` |
| S | `wpn_s_m_wand` | `wpn_s_imperial_staff` (placeholder) | `wpn_s_m_scepter` |

✓ = PNG já no repo. Restantes: criar ícone + paperdoll. Prompts: `docs/paperdoll-weapon-image-prompts.md`.

## C-Grade — ícones (`assets/armas/`)

| Arma | ID | Ficheiro |
|------|-----|----------|
| Stormbringer | `wpn_c_stormbringer` | `wpn_c_stormbringer.png` |
| Tempered Sabre | `wpn_c_sabre` | `wpn_c_sabre.png` |
| Dark Screamer | `wpn_c_dark_screamer` | `wpn_c_dark_screamer.png` |
| Akat Long Bow | `wpn_c_akat_bow` | `wpn_c_akat_bow.png` |
| Battle Knuckle | `wpn_c_knuckle` | `wpn_c_knuckle.png` |
| Sorcerer Staff | `wpn_c_sorcerer_staff` | `wpn_c_sorcerer_staff.png` |

Moldura do ícone: verde grade C (`#7fd4a8` / `#3d8a62` em `css/base.css`). Brief visual: `docs/paperdoll-weapon-image-prompts.md` § C-Grade.
