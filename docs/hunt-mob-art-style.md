# Hunt mob art style (approved)

**Produto:** RogueAge · stills de caça (`assets/mobs/`)  
**Aprovado:** 2026-09-01 (lote D-grade `zombie` / `skeleton` / `bat` + traço do paperdoll fighter)  
**Cenário C:** 2026-09-04 — `assets/zones/battle_c.webp` (Death Pass, lua cima-direita, até 5 slots)

Usar estas referências em **qualquer** still novo (C–S, variantes, poses). Não voltar ao pintado / 3D / linha fina.

## Ficheiros-âncora

| Papel | Path |
|--------|------|
| Traço (primário) | `assets/paperdolls/human_fighter/body.png` |
| Still D aprovado | `assets/mobs/zombie_idle.png` |
| Still D aprovado | `assets/mobs/skeleton_idle.png` |
| Still D aprovado | `assets/mobs/bat_idle.png` |
| Still NG (mesmo ink) | `assets/mobs/goblin_idle.png` |

Luz de zona (não pintar o cenário no PNG):

| Zona | Fundo de caça | Luz no corpo | Sombra CSS (`.mob-hunt-foot-shadow`) |
|------|----------------|--------------|------------|
| D | `assets/zones/battle_d.webp` — lua **canto superior direito** | highlights à **direita** | mancha nos pés, alongada à **esquerda** |
| No-Grade | `assets/zones/battle_ng.webp` — sol **cima-esquerda** | highlights à **esquerda** | mancha nos pés, alongada à **direita** |
| C | `assets/zones/battle_c.webp` — fenda de céu **cima-direita** | highlights à **direita** | mancha à **esquerda** |
| B | `battle_b.webp` (quando existir) | brasa / calor à esquerda | mancha à **direita** |
| A | `battle_a.webp` (quando existir) | céu da torre à direita | mancha à **esquerda** |
| S | `battle_s.webp` (quando existir) | tocha / câmara à direita | mancha à **esquerda** |

A mancha respira e faz lunge com o sprite. **Não** pintar elipse no PNG.

## Contrato do still

- Canvas **256×256** RGBA no cliente. Master de trabalho: magenta `#FF00FF` em `_incoming/` (não commitar).
- Fundo do PNG: **só** personagem + transparência após chromakey. **Proibido** lua, céu, pátio, trilha, névoa, elipse de contacto, aura, disco de glow.
- Traço: outline **preto grosso** (silhueta + interiores), cel-shade em **blocos** (2–3 tons), preenchimento chapado. Sem airbrush, sem fotoreal, sem 3D.
- Variantes: fato próprio (`magic` / `poison` / `bleed` / híbridos) — cajado, cogumelos, lâmina-gancho — **não** recolor + glow.
- Pose: pés / pontas no **fundo** do quadrado (mesma âncora no idle/atk/die).

Motor e nomes: `docs/mob-combat-anim.md` + `src/combat/mob_sprite.ts`.
