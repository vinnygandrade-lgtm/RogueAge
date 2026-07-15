# Missions Hub (Daily + Weekly)

Client engagement system in `src/ui/ui_daily_missions.ts`. Modal `#janela-missoes-diarias` (body sibling of `#modal-overlay`, §5 pattern) with **Daily** / **Weekly** tabs.

## Persistence (localStorage only)

| Key | Payload |
|-----|---------|
| `l2mini_daily_<char>` | `DailyMissionsSaveData` — calendar day `YYYY-MM-DD`, 3 missions, bonus flag |
| `l2mini_weekly_<char>` | `WeeklyMissionsSaveData` — ISO week `YYYY-Www` (UTC, same idea as Ascension), 3 missions, bonus flag |

Not in character JSONB / cloud save. Multi-device progress will diverge until a future RPC/save migration (§9 debt, same as legacy dailies).

## Selection

- Pool of ~13 templates in three groups: **farm** / **economy** / **challenge**.
- Each period picks **1 per group** (seeded by `charName` + day or week key).
- Weekly uses higher target scale (~5×) and reward scale (~2.75×). Rewards are Adena, shots, enchant scrolls and potions — **never Ancient Coins** (AC is craft-only).
- Mission cards and the final bonus strip show **reward icons** (shared helper `src/ui/ui_reward_icons.ts` — same catalog paths as inventory/achievements).

## Skip (reroll)

- Once per active mission slot (`skippedOnce`).
- Replaces with another pool ID from the **same group** not already in the set.
- Progress of the old mission is lost; no reward for the skipped one.
- Confirm via `l2Confirm`.

## Progress hooks

`registrarProgressoMissao` / alias `registrarProgressoMissaoDiaria` updates **daily and weekly** in parallel.

| Event `tipo` | Sources |
|--------------|---------|
| `matar_monstros`, `matar_champions`, `ganhar_adena`, `coletar_coins` | combat / olympiad |
| `tentar_mint`, `craft_item` | `ui_craft.ts` |
| `tentar_enchant` | `ui_enchant.ts` (on attempt start) |
| `usar_pocoes` | `core.ts` |
| `usar_skills` | `skills_engine.ts` |
| `vencer_olympiad` | `olympiad_engine.ts` |
| `derrotar_daily_boss` | `raid_engine.ts` |

## UI entry

MENU → PROGRESS → Missions → `abrirMissoes()` / `abrirMissoesDiarias()`.

Badge `#nav-notif-missions` counts claimable daily + weekly missions and unclaimed final bonuses.
