# Stat budget (world permanent) — no soft-caps

**Targets** for the best permanent world build (race + class + +25 gear + title + blessing + augment + harmony):

| Stat | Target |
|------|--------|
| Crit Rate | ~50% |
| Evasion investment | ~40 |
| Casting Speed % | ~50% |
| Attack Speed interval | ~250–350 ms (peak Precision + Haste) |

**Out of budget:** temporary skill buffs (may exceed briefly); Expedition run cards (card values).

## Design levers (implemented)

1. **Secondary rates do not scale with enchant** — `bonusCrit` / `bonusDodge` / `bonusSpd` / `bonusCastSpeed` on armor and jewels use catalog flat values. Enchant still scales HP / Atk / Def / MP.
2. **Harmony** boosts HP/MP/Atk/Def only — not Crit / Dodge / Cast / AtkSpeed.
3. **Catalog + class + title + blessing + augment** retuned so a full Precision / Arcane / AA stack lands near the targets without formula soft-caps.
4. **Timer floor only:** AtkSpeed never below 50 ms (engine sanity). Soft-cap helpers remain in `core_globals` as unused/legacy.
5. **Hybrid focus (all lines share stats, weighted):** every armor / jewel line can grant HP, Crit, Spd, Evasion, Cast, etc., but **primary focus stays ~4× the off-role** (~25% secondaries). Heavy/Vitality never reach Precision peaks; Robe/Arcane never steal the Crit/AA cap.

## Role weights (catalog)

| Line | Primary | Secondary (~25% of peer primary) |
|------|---------|----------------------------------|
| Heavy / Vitality | HP, Def, P.Atk | Crit, Spd, Evasion, tiny Cast |
| Light / Precision | Crit, Spd, Evasion | HP, tiny Cast |
| Robe / Arcane | MP, Cast, M.Atk | HP, Crit, Spd, Evasion |

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

Heavy / Vitality / Arcane may add small Crit, but a pure tank stack stays well below this cap (~15–25%).

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

Do **not** raise Arcane/Robe cast primaries when adding physical secondaries.

## AtkSpeed ~250–350 ms

Interval = `(raceBase × class.spd × blessingHaste) − ΣbonusSpd`.

Peak dagger path (Adventurer `spd: 0.50`, Ghost Hunter `0.54`, Wind Rider `0.52`) plus Light / dagger / Precision / Baium:

- **Dark Elf Adventurer + Haste:** ~300–330 ms  
- **Elf Adventurer + Haste:** ~230–250 ms  
- **Same kit without Haste:** ~450–500 ms  
- **Phoenix Knight + Vesper Heavy + Vitality (max):** still slow (~2.5–3.0s) by design — improved vs zero secondary Spd, never near Precision.

Full AA gear `bonusSpd` on the Precision peak stack remains ~1300–1400 (do not inflate Light/Radiant/Baium Spd when buffing Heavy/Vitality).

## Owned gear vs catalog patches

Equipment instances keep a `base` snapshot for UID / identity, but **`enrichEquipBaseFromCatalogIfNeeded` always rebinds `base` from the live catalog by `id` on load** (uid, enchant, augment preserved). Combat `getItemStat` also prefers the live catalog row. Balance retunes therefore apply to gear already in bags and equipped slots — not only newly purchased items.
