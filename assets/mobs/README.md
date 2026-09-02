# Hunt mob sprites

Combat poses for expedition / forest (`#mobs-container`).

Live motion is **CSS on the three stills** (idle breathe, attack lunge + flash). WebP is an optional drop-in later.

| Pose | Still (ships today) | Optional animated drop-in |
|------|---------------------|---------------------------|
| Idle | `<id>_idle.png` | `<id>_idle.webp` (loop) |
| Attack | `<id>_atk.png` | `<id>_atk.webp` (**play once**) |
| Death | `<id>_die.png` | `<id>_die.webp` (**play once**, hold last frame) |

**No GIF.** Brief: `docs/mob-combat-anim.md`. Client: `src/combat/mob_sprite.ts`.

Costume variants (goblin / wolf / spider / zombie / skeleton / bat): `<id>_<variant>_<pose>.png` where variant is `magic`, `poison`, `bleed`, `magic_poison`, or `magic_bleed`. Missing files fall back to the species still. Working magenta masters live in `_incoming/` (not shipped).

D-grade stills follow courtyard moonlight (key from the top-right). No-Grade stills follow trail sun (key from the top-left). The CSS foot ellipse is the contact shadow — do not paint one in the PNG.
