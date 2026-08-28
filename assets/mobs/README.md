# Hunt mob sprites

Combat poses for expedition / forest (`#mobs-container`).

Live motion is **CSS on the three stills** (idle breathe, attack lunge + flash). WebP is an optional drop-in later.

| Pose | Still (ships today) | Optional animated drop-in |
|------|---------------------|---------------------------|
| Idle | `<id>_idle.png` | `<id>_idle.webp` (loop) |
| Attack | `<id>_atk.png` | `<id>_atk.webp` (**play once**) |
| Death | `<id>_die.png` | `<id>_die.webp` (**play once**, hold last frame) |

**No GIF.** Brief: `docs/mob-combat-anim.md`. Client: `src/combat/mob_sprite.ts`.
