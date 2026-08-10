# Stat budget (world permanent) — no soft-caps

**Targets** for the best permanent world build (race + class + +25 gear + title + blessing + augment + harmony):

| Stat | Target |
|------|--------|
| Crit Rate | ~50% |
| Evasion investment | ~40 |
| Casting Speed % | ~50% |
| Attack Speed interval | ~220 ms |

**Out of budget:** temporary skill buffs (may exceed briefly); Expedition run cards (card values).

## Design levers (implemented)

1. **Secondary rates do not scale with enchant** — `bonusCrit` / `bonusDodge` / `bonusSpd` / `bonusCastSpeed` on armor and jewels use catalog flat values. Enchant still scales HP / Atk / Def / MP.
2. **Harmony** boosts HP/MP/Atk/Def only — not Crit / Dodge / Cast / AtkSpeed.
3. **Catalog + class + title + blessing + augment** retuned so a full Precision / Arcane / AA stack lands near the targets without formula soft-caps.
4. **Timer floor only:** AtkSpeed never below 50 ms (engine sanity). Soft-cap helpers remain in `core_globals` as unused/legacy.

## Crit ~50 slice (max dagger / Precision path)

| Source | Budget |
|--------|--------|
| Race | 5–15 |
| Class | ≤12 |
| Weapon | ≤8 |
| Armor (Light) | ≤6 |
| Jewels (5 slots) | ≤10 |
| Title | ≤3 |
| Blessing Focus | ≤3 |
| Augment | ≤4 |
| **Sum (Dark Elf max)** | **~50–55** |

## Dodge ~40 slice

| Source | Budget |
|--------|--------|
| Class | ≤10 |
| Level (~85) | ≤5 (`0.06`/lvl) |
| Armor | ≤8 |
| Jewels | ≤12 |
| Blessing Guidance | ≤3 |
| **Sum** | **~38–40** |

## Cast ~50 slice

| Source | Budget |
|--------|--------|
| Robe | ≤12 |
| Staff / Magic Sword | ≤8 |
| Jewels Arcane | ≤16 |
| Title | ≤6 |
| Blessing Acumen | ≤4 |
| **Sum** | **~46–50** |

## AtkSpeed ~220 ms

Interval = `(raceBase × class.spd × blessingHaste) − ΣbonusSpd`.  
Class `spd` no longer halves Adventurer (0.72). Full AA gear `bonusSpd` totals ~900–1100 so Elf/Adventurer lands near ~220–280 ms without a soft floor.
