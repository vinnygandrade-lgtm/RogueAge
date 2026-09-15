# World map art

Locked painting **D2** (Sep 2026). Cutouts are **manual**.

| File | Size | Notes |
|------|------|--------|
| `map_bg.jpg` | **1080×1620** | D2 vale + foreground gate. |
| `map_bg.vale-blky7o.bak.jpg` | **1080×1620** | Previous busy-vale lock (24 Aug 2026). |
| `town.png` | **1080×1620** alpha | Manual city cutout — Enter opens the plaza. No Town tab in the dock. |
| `olympiad.png` | **1080×1620** alpha | Manual Crown Ring cutout — Enter opens Grand Olympiad. |
| `clanwar.png` | **1080×1620** alpha | Manual war-camp cutout — Enter opens Clan War (leader). |
| `daily.png` | **1080×1620** alpha | Manual bone-field cutout — Enter opens the daily boss. |
| `forest.png` | **1080×1620** alpha | Manual Deepgrove cutout — Enter opens the expedition trail. |
| `raid.png` | **1080×1620** alpha | Manual Maw cave cutout — Enter opens the world raid lobby. |
| `_archive/` | — | Old vale cutouts (do not load on D2). |

**How to land a cutout**

1. Open `map_bg.jpg` (or `_incoming/world-map-d2.png`).
2. Keep only that landmark, same pixels / pose. Rest = transparent.
3. Save **1080×1620** PNG as `assets/world/_incoming/<id>.png`  
   ids: `town` · `forest` · `daily` · `clanwar` · `olympiad` · `raid`
4. `npm run export:world`
5. Hard-refresh World in the client.

Bake (background only): `node tools/bake_world_d2.mjs`.

Brief: `docs/world-map-art-prompt.md`.
