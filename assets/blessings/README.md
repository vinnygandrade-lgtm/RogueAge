# Blessing icons (Grand Master Blessing Build)

Drop **256×256 PNG** files here. The client loads them automatically by **stable id**.

These same files can later power matching **Expedition upgrade cards** (shared art language).

## Required filenames

| File | Blessing | Role color (UI accent) |
|------|----------|------------------------|
| `might.png` | Might (P.Atk) | `#f87171` |
| `empower.png` | Empower (M.Atk) | `#60a5fa` |
| `shield.png` | Shield (P.Def) | `#fbbf24` |
| `magic_barrier.png` | Magic Barrier (M.Def) | `#c084fc` |
| `focus.png` | Focus (Crit) | `#fb7185` |
| `haste.png` | Haste (Atk Spd) | `#34d399` |
| `acumen.png` | Acumen (Cast) | `#a78bfa` |
| `guidance.png` | Guidance (Evasion) | `#6ee7b7` |
| `vitality.png` | Vitality (Max HP) | `#4ade80` |
| `clarity.png` | Clarity (Max MP) | `#38bdf8` |
| `poison_ward.png` | Poison Ward (−poison dmg) | `#86efac` |
| `bleed_ward.png` | Bleed Ward (−bleed dmg) | `#fca5a5` |
| `mana_efficiency.png` | Mana Efficiency (−skill MP cost) | `#7dd3fc` |

## Art brief (match RogueAge skill/item language)

- **Format:** square **1∶1**, export **256×256** PNG (same as skill/item icons).
- **Moldura:** ornamental metal/bronze frame coherent with `assets/itens` / `assets/skills` (dark brown `#241710` / bronze `#735939`).
- **Readability:** icon must stay clear at ~40–56px (modal cards + HUD chips).
- **Style:** fantasy MMO semi-realistic; **one clear symbol** per blessing.
- Until a file exists, the UI shows a **glyph fallback** in a framed slot — no broken image.

### Symbol hints (new trio)

| File | Put this in the art |
|------|---------------------|
| `poison_ward.png` | Green/emerald ward — antivenom flask, serpent fang crossed out, or toxic droplet sealed by a protective rune. Cool greens (`#86efac` accent), not murky swamp mud. |
| `bleed_ward.png` | Crimson/rose ward — bandage wrap, sealed blood drop, or hemostatic rune over a wound. Warm reds (`#fca5a5`), still noble/fantasy (not gore-heavy). |
| `mana_efficiency.png` | Cyan arcane efficiency — mana crystal with a “less waste” motif (streamlined droplet, efficiency rune, or twin flasks with one smaller pour). Cool blues (`#7dd3fc`). |

### Symbol hints (existing set)

| File | Symbol idea |
|------|-------------|
| `might.png` | Sword / blade surge |
| `empower.png` | Arcane orb / mage spark |
| `shield.png` | Heater shield |
| `magic_barrier.png` | Hex ward / barrier rune |
| `focus.png` | Crosshair / precision eye |
| `haste.png` | Winged boots / speed streaks |
| `acumen.png` | Open grimoire / cast spark |
| `guidance.png` | Wind swirl / dodge trail |
| `vitality.png` | Heart / life gem |
| `clarity.png` | Mana droplet / blue crystal |

## Code

Paths are built in `src/game/blessing_catalog.ts` via `getBlessingIconSrc(id)` → `assets/blessings/<id>.png`.
