# Combat Stat Ranking (Status Rankings)

Server-sorted ladder of **real player** combat totals. Open from Quick Menu → **Rankings** (`#janela-stat-ranking`).

## Flow

1. After a successful cloud `savePlayer`, `stat_ranking_engine.pushCombatStatSnapshot` upserts totals (throttled ~30s).
2. UI chips pick a metric → RPC `get_combat_stat_ranking` returns top N ordered in Postgres.
3. Tap a row → `abrirPerfilChat` (existing cloud inspection).

## Metrics

`p_atk` · `m_atk` · `p_def` · `m_def` · `crit_rate` · `max_hp` · `atk_speed` · `level`

- Most metrics: **DESC** (higher is better).
- `atk_speed`: **ASC** (lower ms interval = faster).

## SQL / deploy

Script: `supabase_combat_stat_ranking.sql` (also MASTER §5I).

1. Apply in Supabase SQL Editor (table `character_combat_stats` + RPCs + GRANTs).
2. Confirm `GRANT EXECUTE` on `upsert_character_combat_stats` and `get_combat_stat_ranking` for `authenticated`.

## Client

| Piece | Path |
|--------|------|
| Engine | `src/systems/stat_ranking_engine.ts` |
| API | `SupabaseAPI.upsertCombatStatSnapshot` / `getCombatStatRanking` |
| Sync hook | `src/systems/cloud_sync.ts` after successful save |
| UI | `src/ui/ui_stat_ranking.ts` |
| Nav | `navMenuGo('statRanking')` in `ui_nav_menu.ts` |
| i18n | `navMenu.statRanking`, `game.statRanking.*` |

## Honesty (§12.7)

The client sends **already calculated** combat totals (same bridge pattern as Olympiad MMR inputs). SQL checks ownership (`auth.uid()` + `char_name`), clamps values, and sorts — it does **not** recompute stats from equipment on the server in this version.
