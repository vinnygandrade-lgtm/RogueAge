# Gameplay Achievements (Journey)

Lifetime goals that unlock **chat titles** by grade (NG → S). UI: MENU → Progress → **Achievements** → tab **Journey** (`#ach-panel-journey` in `#janela-level-rewards`).

## Rules

- **13 achievements**, each with **6 tiers** mapped to item grades (`No-Grade` … `S`).
- UI shows **one active tier per achievement** — card border/background color matches the current grade (starts gray NG).
- **Claim** the title when the threshold is met; the card then advances to the **next grade** with a harder target and new color.
- When all 6 tiers are claimed, the card shows **MASTERED** (S styling).

## Persistence

- `gameplayAchievements: { stats, unlockedTitles, equippedTitleId }` on character save.
- `L2MINI_SAVE_VERSION` **15** — migration seeds empty block for older saves.
- APIs: `getGameplayAchievementsSavePayload` / `aplicarGameplayAchievementsFromSave` in `core_persistence.ts`.

## Progress hooks

- `registrarProgressoConquista(tipoEvento, valor)` — called from `registrarProgressoMissao` (daily/weekly mission event types), elite champion kills in `endgame_pursuits.ts`, and Olympiad victories (`matar_olympiad` + `vencer_olympiad`) in `olympiad_engine.ts`.
- `elite_champion_kill` also syncs from `endgameData.lifetimeChampionKills` on hub/titles open.

## Catalog

Authoritative list: `src/game/gameplay_achievements_catalog.ts` — stat keys, thresholds, `titleId` per grade.

| Achievement id | Stat key | Examples (S tier) |
|----------------|----------|---------------------|
| mob_slayer | matar_monstros | 5,000,000 kills |
| champion_bane | matar_champions | 15,000 champions |
| adena_magnate | ganhar_adena | 1B Adena earned |
| coin_hoarder | coletar_coins | 25,000 Ancient Coins |
| enchant_seeker | tentar_enchant | 25,000 enchant attempts |
| forge_hand | craft_item | 15,000 crafts |
| skill_weaver | usar_skills | 3,000,000 skill uses |
| arena_legend | vencer_olympiad | 2,500 Olympiad wins |
| arena_reaper | matar_olympiad | 7,500 Olympiad kills |
| boss_breaker | derrotar_daily_boss | 1,200 daily bosses |
| battle_alchemist | usar_pocoes | 1,000,000 potions |
| mint_scholar | tentar_mint | 5,000 mint attempts |
| elite_nemesis | elite_champion_kill | 2,000 elite champion kills |

## Code

- Catalog: `src/game/gameplay_achievements_catalog.ts`
- Motor/UI: `src/ui/ui_gameplay_achievements.ts`
- Level hub shell: `src/ui/ui_level_rewards.ts` + `index.html` tabs
- Chat: `src/ui/ui_chat.ts` (`getEquippedChatTitle`, send via `ascensionTitle` payload)
- Chat i18n: `src/ui/chat_title_resolver.ts` — persist `gpa:<titleId>` or `asc:<tier>` in `ascension_title`; each client resolves with `t()` at display. Legacy plain-text badges still render.
- i18n: `game.gameplayAchievements.*` + `game.achievements.tabJourney` in `locales_bundle.ts`
- Styles: `css/index-extras.css`, landscape in `css/shell-landscape.css`, profile button in `css/paperdoll-profile.css`

## Related

- Level board (tab **Levels**): `docs/level-achievements.md`
