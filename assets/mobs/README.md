# Hunt mob sprites

Combat poses for expedition / forest (`#mobs-container`).

Live motion is **CSS on the three stills** (idle breathe, attack lunge + flash). WebP is an optional drop-in later.

| Pose | Still (ships today) | Optional animated drop-in |
|------|---------------------|---------------------------|
| Idle | `<id>_idle.png` | `<id>_idle.webp` (loop) |
| Attack | `<id>_atk.png` | `<id>_atk.webp` (**play once**) |
| Death | `<id>_die.png` | `<id>_die.webp` (**play once**, hold last frame) |

**No GIF.** Motion: `docs/mob-combat-anim.md`. **Style lock:** `docs/hunt-mob-art-style.md` (paperdoll `human_fighter/body.png` + approved `zombie_idle` / `skeleton_idle` / `bat_idle` / `goblin_idle`). Client: `src/combat/mob_sprite.ts`.

Costume variants (goblin / wolf / spider / zombie / skeleton / bat): `<id>_<variant>_<pose>.png` where variant is `magic`, `poison`, `bleed`, `magic_poison`, or `magic_bleed`. Missing files fall back to the species still. Working magenta masters live in `_incoming/` (not shipped).

D-grade stills follow courtyard moonlight (key from the top-right, CSS shadow left). No-Grade stills follow trail sun (key from the top-left). Do not paint a contact shadow in the PNG. NG trial uses a soft foot stain (`.mob-hunt-foot-shadow`) under the feet, stretched right, animated with breathe/lunge.
