# Expedition trail art

Locked painting (Sep 2026). Cutouts are **manual**.

| File | Size | Notes |
|------|------|--------|
| `map_bg.jpg` | **1080×1620** | Trail with six hunting landmarks. |
| `ng.png` | **1080×1620** alpha | Talking Island (No-Grade) — live. |
| `d.png` | **1080×1620** alpha | Ruins of Despair (D) — live. |
| `c.png` | **1080×1620** alpha | Death Pass (C) — live. |
| `b.png` | **1080×1620** alpha | Dragon Valley (B) — live. |
| `a.png` | **1080×1620** alpha | Tower of Insolence (A) — live. |
| `s.png` | **1080×1620** alpha | Imperial Tomb (S) — live. |

**How to land a cutout**

1. Open `map_bg.jpg`.
2. Keep only that landmark, same pixels / pose. Rest = transparent.
3. Save **1080×1620** PNG as `assets/expedition/_incoming/<id>.png`  
   ids: `ng` · `d` · `c` · `b` · `a` · `s`
4. `npm run export:expedition`
5. Hard-refresh Expedition in the client.

Bake (background only): `node tools/bake_expedition_map.mjs`.  
Source master: `assets/world/_incoming/expedition-map-a.png`.

Brief: `docs/expedition-map-art.md`.
