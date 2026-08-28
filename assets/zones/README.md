# Zone battle backgrounds

Scenery behind forest / expedition combat (`#forest-battle-bg`).

## Files (ship WebP only)

| Layout | Filename | Canvas | Notes |
|--------|----------|--------|--------|
| **Portrait** (mobile) | `battle_<slug>.webp` | **1080×2340** | Existing phone art |
| **Landscape** (PC) | `battle_<slug>_wide.webp` | **1920×1080** | 16∶9 composition |

Master PNG can live outside the repo; commit the compressed WebP the client loads.

### Slugs (grade → file)

| Zone grade | Portrait | PC wide |
|------------|----------|---------|
| No-Grade | `battle_ng.webp` | `battle_ng_wide.webp` |
| D | `battle_d.webp` | `battle_d_wide.webp` |
| C | `battle_c.webp` | `battle_c_wide.webp` |
| B | `battle_b.webp` | `battle_b_wide.webp` |
| A | `battle_a.webp` | `battle_a_wide.webp` |
| S | `battle_s.webp` | `battle_s_wide.webp` |

## Client behaviour

- `html[data-l2-layout="landscape"]` → tries `*_wide.webp` first.
- If wide is missing → loads portrait and crops with CSS (`data-battle-bg-aspect="portrait"`).
- Portrait layout → always `battle_<slug>.webp`.
- Layout toggle mid-combat reloads the matching asset (`l2-layout-change`).

Code: `src/ui/ui_forest_battle_bg.ts`.

## Same portrait, three more surfaces

The **portrait** `battle_<slug>.webp` is also the postcard art. Drop the file and these pick it up — no extra crop, no second filename.

| Surface | Where | Crop |
|---------|--------|------|
| World hunting picker | `#janela-world-zones` `.world-zone-card` | **2-col tiles 124px tall**, img `position:absolute` + `object-fit: cover` at `center 36%` (never the full 1080×2340 plate, never a 4∶1 pancake strip) |
| Zone details | `#zona-detalhe-banner` | banner 148px tall, same crop |
| Expedition hub | `#expedition-hub-art` | banner cover, same crop |
| Live combat | `#forest-battle-bg` | full stage |

**Shipped today:** `battle_ng.webp` (+ `battle_ng_wide.webp` for PC). D / C / B / A / S portrait files are expected drop-ins at the names above; until they exist the picker/details/hub show a **Scenery coming soon** pending tile instead of a broken image.

Do **not** reuse No-Grade art for other grades — each zone keeps its own identity.

## Art brief (picker crop)

Cards and banners crop a **wide strip** from the tall portrait — they must **not** display the full 1080×2340 plate (that stretches the picker). Keep the zone landmark / path around **34% from the top**. Sky-only tops and feet-only bottoms get cut off.

## Art brief (wide)

- Same zone identity as the portrait piece (palette, landmarks, mood).
- Compose for **16∶9**: horizon / ground plane in the lower third where mobs + UI sit.
- Keep important scenery away from extreme left/right edges (HUD / chat / hotbar overlap).
- Avoid stretching the portrait file — paint a true wide frame.

## PC mob stage (client)

On landscape, combat CSS (`shell-landscape.css`) places `#mobs-container` bottom-aligned over the path:

- Sprites ~`min(28vh, 200px)` tall with drop-shadow (feet on ground plane).
- Cards ~140–210px wide; BG `background-position: center 58%` biases the path into the combat band.
- Portrait compact sizes stay in `expedition-portrait-fit.css` only.
