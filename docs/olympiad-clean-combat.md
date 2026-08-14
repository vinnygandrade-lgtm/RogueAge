# Olympiad — clean combat rules

Product contract for competitive arena vs PvE power fantasy.

## Rules

| Mode | Grand Master blessings | Soulshot / Spiritshot | Vitals |
|------|--------------------------|------------------------|--------|
| Forest / farm | Yes | Yes | HP / MP |
| Expedition / world bosses | Yes | Yes | HP / MP |
| **Olympiad** | **No** | **No** | HP / MP |

Skills and equipment still apply in Olympiad. Temporary skill combat buffs cast *during* the duel (e.g. Frenzy) remain allowed — “no buff” means town/long buffs (Blessing Build) and ammo shots, not class skills.

## Client enforcement

- **Shots:** `combat_math.ts` / `skills_engine.ts` skip auto-shot when `#tela-olympiad-arena` is shown.
- **Blessings + expedition run %:** `OlympiadEngine.areCleanArenaRulesActive()` + `_cleanCombatLatch` during VERSUS preview and duel; `core_stats.ts` skips Blessing Build effects and `ExpeditionEngine.applyRunBuffsToPlayerStats`.
- **Opponent snapshot:** `applyRealPlayerStatsFromCloudRow` nulls `blessingBuild` and uses the clean latch before `calcularStatusGlobaisFromData`.
- **Exit:** `endCleanCombatStats()` on cancel preview / failed challenge / `finalizarDuelo` restores town stats (blessings return if timer still active).

## Related

- Engine: `src/systems/olympiad_engine.ts`
- Stats: `src/core/core_stats.ts`
- Player-facing copy: `olympiad.rule3Desc` in `src/i18n/locales_bundle.ts`
