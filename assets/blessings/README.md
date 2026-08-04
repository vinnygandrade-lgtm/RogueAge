# Blessing icons (Grand Master Blessing Build)

Drop **256×256 PNG** files here. The client loads them automatically by **stable id**.

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

## Art brief (match RogueAge skill/item language)

- **Format:** square **1∶1**, export **256×256** PNG (same as skill/item icons).
- **Moldura:** ornamental metal/bronze frame coherent with `assets/itens` / `assets/skills` (dark brown `#241710` / bronze `#735939`).
- **Readability:** icon must stay clear at ~40–56px (modal cards + HUD chips).
- **Style:** fantasy MMO semi-realistic; one clear symbol per blessing (sword, arcane orb, shield, barrier rune, crosshair, winged boots, open book, wind swirl, heart/life gem, mana droplet).
- Until a file exists, the UI shows a **glyph fallback** in a framed slot — no broken image.

## Code

Paths are built in `src/game/blessing_catalog.ts` via `getBlessingIconSrc(id)` → `assets/blessings/<id>.png`.
