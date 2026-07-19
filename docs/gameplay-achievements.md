# Gameplay Achievements (Journey)

Lifetime goals that unlock **chat titles** by grade (NG → S). UI: MENU → Progress → **Achievements** → tab **Journey** (`#ach-panel-journey` in `#janela-level-rewards`).

## Rules

- **25 achievements**, each with **6 tiers** mapped to item grades (`No-Grade` … `S`).
- UI shows **one active tier per achievement** — card border/background color matches the current grade (starts gray NG).
- **Claim** the title when the threshold is met; the card then advances to the **next grade** with a harder target and new color.
- When all 6 tiers are claimed, the card shows **MASTERED** (S styling).
- **Equipped title** grants unique flat stat bonuses (stronger at higher grades). See `src/game/gameplay_title_bonuses.ts`.

## Persistence

- `gameplayAchievements: { stats, unlockedTitles, equippedTitleId }` on character save.
- `L2MINI_SAVE_VERSION` **15** — migration seeds empty block for older saves.
- APIs: `getGameplayAchievementsSavePayload` / `aplicarGameplayAchievementsFromSave` in `core_persistence.ts`.

## Progress hooks

- `registrarProgressoConquista(tipoEvento, valor)` — called from `registrarProgressoMissao` (daily/weekly mission event types), elite champion kills in `endgame_pursuits.ts`, and Olympiad victories (`matar_olympiad` + `vencer_olympiad`) in `olympiad_engine.ts`.
- `elite_champion_kill` also syncs from `endgameData.lifetimeChampionKills` on hub/titles open.

## Catalog

Authoritative list: `src/game/gameplay_achievements_catalog.ts` — stat keys, thresholds, `titleId` per grade.

| Achievement id | Stat key | Theme |
|----------------|----------|--------|
| mob_slayer | matar_monstros | Combat farm |
| champion_bane | matar_champions | Golden champions |
| adena_magnate | ganhar_adena | Adena earned |
| coin_hoarder | coletar_coins | Ancient Coins |
| enchant_seeker | tentar_enchant | Enchant attempts |
| forge_hand | craft_item | Crafting |
| skill_weaver | usar_skills | Skill casts |
| arena_legend | vencer_olympiad | Olympiad wins |
| arena_reaper | matar_olympiad | Olympiad kills |
| boss_breaker | derrotar_daily_boss | Daily raid bosses |
| battle_alchemist | usar_pocoes | Potions |
| mint_scholar | tentar_mint | Mint press |
| elite_nemesis | elite_champion_kill | Ascension elite kills |
| pathfinder | expedition_complete | Expedition extract |
| enchant_master | enchant_success | Successful enchants |
| rune_binder | augment_weapon | Weapon augments |
| exchange_mogul | market_trade | Rogue Exchange buy/sell |
| war_banner | clan_war_win | Clan War victory |
| level_climber | subir_nivel | Levels gained |
| spoils_hunter | spoil_kill | Spoil kills |
| postmaster | resgatar_correio | Mailbox claims |
| deep_march | expedition_journey | Expedition journey steps |
| mission_ace | missao_resgatada | Daily/weekly mission claims |
| duelist_spirit | olympiad_duel | Any Olympiad duel |
| world_raider | derrotar_raid_mundo | World raid bosses |

## Code

- Catalog: `src/game/gameplay_achievements_catalog.ts`
- Title stat bonuses: `src/game/gameplay_title_bonuses.ts`
- Motor/UI: `src/ui/ui_gameplay_achievements.ts`
- Level hub shell: `src/ui/ui_level_rewards.ts` + `index.html` tabs
- Chat: `src/ui/ui_chat.ts` (`getEquippedChatTitle`, send via `ascensionTitle` payload)
- Chat i18n: `src/ui/chat_title_resolver.ts` — persist `gpa:<titleId>` or `asc:<tier>` in `ascension_title`; each client resolves with `t()` at display. Legacy plain-text badges still render.
- i18n: `game.gameplayAchievements.*` + `game.achievements.tabJourney` in `locales_bundle.ts`
- Styles: `css/index-extras.css`, landscape in `css/shell-landscape.css`, profile button in `css/paperdoll-profile.css`

## Related

- Level board (tab **Levels**): `docs/level-achievements.md`
