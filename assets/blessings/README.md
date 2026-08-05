# Blessing icons (Grand Master Blessing Build)

Drop **256×256 PNG** files in this folder. The client loads them by **exact filename**.

Path: `assets/blessings/<id>.png`

## Global art rules (all icons)

- **Format:** square **1∶1**, export **256×256** PNG
- **Moldura:** ornamental metal/bronze like `assets/itens` / `assets/skills` (dark brown `#241710` / bronze `#735939`)
- **Style:** fantasy MMO semi-realistic; **one clear central symbol**
- **Readability:** must stay clear at ~40–56px (cards + HUD)
- Until the PNG exists, the UI shows a glyph fallback

---

## Complete set (13)

### Offense

#### `might.png` — Might
- **Effect:** +12% P.Atk
- **Accent:** `#f87171`
- **Brief:** Physical power surge — steel sword or blade tip with warm red/orange energy along the edge. Aggressive, readable silhouette of a weapon strike. No full character.

#### `empower.png` — Empower
- **Effect:** +15% M.Atk
- **Accent:** `#60a5fa`
- **Brief:** Arcane offense — glowing mana orb, mage spark, or floating rune crystal in cool blue. Magical “burst” feel, not a physical weapon.

#### `focus.png` — Focus
- **Effect:** +6 Crit investment
- **Accent:** `#fb7185`
- **Brief:** Precision — crosshair, targeting eye, or sharp rose-red gem with a focused center point. Suggests critical aim, not raw strength.

### Defense

#### `shield.png` — Shield
- **Effect:** +12% P.Def
- **Accent:** `#fbbf24`
- **Brief:** Solid heater/kite shield in gold-bronze metal. Defensive, heavy, grounded. Optional subtle glow on the rim.

#### `magic_barrier.png` — Magic Barrier
- **Effect:** +12% M.Def
- **Accent:** `#c084fc`
- **Brief:** Hexagonal ward / barrier rune / translucent violet shield of force. Magical protection, not a metal shield.

#### `guidance.png` — Guidance
- **Effect:** +4 Evasion investment
- **Accent:** `#6ee7b7`
- **Brief:** Dodge / wind trail — swirling wind, afterimage streak, or light-green motion arcs. Suggests slipping past a hit.

#### `poison_ward.png` — Poison Ward
- **Effect:** −12% poison damage taken
- **Accent:** `#86efac`
- **Brief:** Antivenom ward — sealed green flask, serpent fang blocked by a rune, or toxic droplet locked behind a ward. Cool emerald greens; avoid muddy swamp tones.

#### `bleed_ward.png` — Bleed Ward
- **Effect:** −12% bleed damage taken
- **Accent:** `#fca5a5`
- **Brief:** Hemostatic ward — clean bandage wrap, sealed blood drop, or rose-red rune over a wound. Noble fantasy reds; no heavy gore.

### Tempo

#### `haste.png` — Haste
- **Effect:** Faster attack interval (Atk Spd)
- **Accent:** `#34d399`
- **Brief:** Speed — winged boots, motion streaks, or emerald wind around boots/blades. Clear “faster swings” read.

#### `acumen.png` — Acumen
- **Effect:** +8% Casting Speed
- **Accent:** `#a78bfa`
- **Brief:** Faster casting — open grimoire with violet spark, quick-cast rune, or spell pages flipping with energy. Distinct from Haste (this is cast bar, not auto-attack).

### Sustain

#### `vitality.png` — Vitality
- **Effect:** +10% Max HP
- **Accent:** `#4ade80`
- **Brief:** Life — green heart, life gem, or vital leaf/crystal. Warm life energy, not poison green.

#### `clarity.png` — Clarity
- **Effect:** +12% Max MP
- **Accent:** `#38bdf8`
- **Brief:** Mana pool — blue mana droplet, full crystal vial, or calm azure gem. “More mana”, not “cheaper skills”.

#### `mana_efficiency.png` — Mana Efficiency
- **Effect:** −12% skill MP cost
- **Accent:** `#7dd3fc`
- **Brief:** Efficient mana use — cyan crystal with a “less waste” motif (streamlined droplet, efficiency rune, or controlled mana stream). Distinct from Clarity (cost vs pool size).

---

## Code

`src/game/blessing_catalog.ts` → `getBlessingIconSrc(id)` → `assets/blessings/<id>.png`

**Also used by:** Expedition post-fight upgrade cards (`ExpeditionEngine` / `UPGRADE_BLESSING_ICON`) — same PNG path; emoji glyph until the file exists.
