# Incoming world-map cutouts

Drop the **raw** PNG here, then from the repo root:

```
npm run export:world
```

That writes a live **1080×1620** alpha file in `assets/world/<id>.png`.

| Drop file | Landmark | Status |
|-----------|----------|--------|
| `forest.png` | Deepgrove — Expedition | **live** |
| `clanwar.png` | Banner Hill — Clan War | **live** |
| `daily.png` | Ashen Field — Daily Boss | **live** |
| `olympiad.png` | Crown Ring — Olympiad | **live** |
| `raid.png` | The Maw — World Raid | **live** |

The cutout must be the **same pose** as `map_bg.jpg` (full canvas, transparent everywhere except that landmark). Do not recenter. Brief: `docs/world-map-art-prompt.md` §15.
