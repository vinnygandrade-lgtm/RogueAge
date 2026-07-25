# Equip Harmony / Harmonia

Client-side combat bonus from a **complete enchanted set**.

## Rules

- **Complete set (7 slots):** weapon, armor, neck, ear L, ear R, ring L, ring R — all filled.
- Empty slot → no Harmony.
- **Level** = lowest enchant among those pieces (0–25). Expedition run enchant bonuses count when a run is active.
- **Bonus:** `+N%` to combat stats where `N = level` (only if `N >= 1`).
- Applied in `calcularStatusGlobais` (`src/core/core_stats.ts`) via `resolveEquipHarmony` (`src/core/equip_harmony.ts`), after titles and before expedition run buffs / skill combat buffs.

## Affected stats

- Multiplied by `(1 + N/100)`: Max HP, Max MP, Max CP (from new HP), P.Atk, M.Atk, P.Def, M.Def, Crit Rate (then global crit cap).
- Attack interval: `× (1 − N/100)` (faster), floor 250 ms.
- Casting Speed: `+N` percentage points (global cast cap 40%).

## UI

- Profile card `#profile-harmony-badge` (`.profile-harmony-card`) — active / idle states; tap opens `#janela-harmony-info`.
- Only this card uses the enchant-tier glow of level `N` (lowest piece). Gear slots keep their own per-item glow.
- Character stats modal shows a Harmony summary pill + Casting Speed line when applicable.

## i18n

- `game.inventoryUi.harmony.*` (card, modal, slot labels)
- `game.inventoryUi.detail.harmonySummary` / `lblCastSpdHarmony`
