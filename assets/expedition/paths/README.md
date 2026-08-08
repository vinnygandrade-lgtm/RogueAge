# Expedition path icons (journey route cards)

Drop **256×256 PNG** files here. The client loads them by **exact filename**.

Path: `assets/expedition/paths/<type>.png`

Used on:
- Path selection cards (map / “choose a route”)
- Node confirm modal icon

Until a PNG exists, the UI shows the emoji glyph fallback.

## Global art rules

- **Format:** square **1∶1**, export **256×256** PNG
- **Moldura:** ornamental metal/bronze like `assets/itens` / `assets/blessings` (`#241710` / `#735939`)
- **Style:** fantasy MMO semi-realistic; **one clear central symbol**
- **Readability:** must stay clear at ~64–80px on path cards
- **No full characters** — props, creatures silhouette, or scene emblems only

---

## Complete set (11)

### Fight routes

#### `combat.png` — Fight
- **Badge:** UPGRADE
- **Accent:** `#94a3b8`
- **Brief:** Standard trail fight — crossed steel blades, wolf fang / beast claw mark, or a trail skirmish emblem in cool steel-grey. Clear “normal battle”, not boss pomp.

#### `elite.png` — Elite
- **Badge:** UPGRADE
- **Accent:** `#ef4444`
- **Brief:** Champion pull — skull with crimson glow, elite crest, or a marked pack leader icon. More dangerous than Fight; less grand than Boss.

#### `boss.png` — Boss
- **Badge:** BOSS / MILESTONE
- **Accent:** `#f97316`
- **Brief:** Gate boss — towering horned silhouette, sealed gate crystal, or orange infernal crest. Must read as **the** milestone threat; heavier frame glow ok.

### Risk

#### `ambush.png` — Ambush
- **Badge:** RISK
- **Accent:** `#4ade80`
- **Brief:** Brush trap — vines / thorns closing on a trail, yellow eyes in foliage, or a snapped snare. Suggests a **bag gamble** (loot or lose Adena/drops), never HP.

### Safe routes

#### `chest.png` — Chest
- **Badge:** SAFE
- **Accent:** `#facc15`
- **Brief:** Trail treasure — ornate gold chest slightly ajar with warm light. Instant bag loot, no combat.

#### `merchant.png` — Merchant
- **Badge:** SAFE
- **Accent:** `#eab308`
- **Brief:** Wandering trader — packed satchel, caravan lantern, or merchant seal/coin pouch. “Deals for Adena”, not a fight.

#### `forge.png` — Forge
- **Badge:** SAFE
- **Accent:** `#fb923c`
- **Brief:** Field anvil — glowing hammer and anvil spark, orange embers. Temporary enchant boost for the run.

#### `scout.png` — Scout
- **Badge:** SAFE
- **Accent:** `#38bdf8`
- **Brief:** Foresight — spyglass / brass telescope with a blue trail map glow. Intel for the **next** journey.

#### `patrol.png` — Patrol
- **Badge:** SAFE
- **Accent:** `#a3e635`
- **Brief:** Safe march — boot prints on a green trail, or a quiet lantern patrol. XP without gifts/combat.

#### `tracks.png` — Tracks
- **Badge:** SAFE
- **Accent:** `#94a3b8`
- **Brief:** Fresh tracks — animal paw / claw prints in mud with a subtle rune. Reveals trait / may force a path type next.

#### `warhorn.png` — Warhorn (clarim)
- **Badge:** SAFE
- **Accent:** `#c084fc`
- **Brief:** Rally horn — ornate warhorn / clarion with violet sound rings. Pick Assault / Tempo / Iron Rally — not a combat node.

---

## Optional later (rare events)

If you want matching art for rare encounters, use `assets/expedition/events/`:

| File | Event |
|------|--------|
| `shrine.png` | Moon shrine |
| `gambler.png` | Blood wager / luck |
| `cache.png` | Hidden cache |
| `storm.png` | Chaos storm |

(Not wired yet — path cards first.)

---

## Code

`ExpeditionEngine.getPathArtSrc(type)` → `assets/expedition/paths/<type>.png`  
Fallback glyph from `getPathMeta(type).icon`
