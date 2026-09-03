# Hunt mob art style (approved)

**Produto:** RogueAge · stills de caça (`assets/mobs/`)  
**Aprovado:** 2026-09-01 (lote D-grade `zombie` / `skeleton` / `bat` + traço do paperdoll fighter)

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

| Zona | Fundo de caça | Luz no corpo | Sombra CSS |
|------|----------------|--------------|------------|
| D | `assets/zones/battle_d.webp` — lua **canto superior direito** | highlights à **direita** | elipse à **esquerda** |
| No-Grade | `assets/zones/battle_ng.webp` — sol **cima-esquerda** | highlights à **esquerda** | mancha nos **pés**, alongada à **direita** (respira/lunge com o sprite) |

## Contrato do still

- Canvas **256×256** RGBA no cliente. Master de trabalho: magenta `#FF00FF` em `_incoming/` (não commitar).
- Fundo do PNG: **só** personagem + transparência após chromakey. **Proibido** lua, céu, pátio, trilha, névoa, elipse de contacto, aura, disco de glow.
- Traço: outline **preto grosso** (silhueta + interiores), cel-shade em **blocos** (2–3 tons), preenchimento chapado. Sem airbrush, sem fotoreal, sem 3D.
- Variantes: fato próprio (`magic` / `poison` / `bleed` / híbridos) — cajado, cogumelos, lâmina-gancho — **não** recolor + glow.
- Pose: pés / pontas no **fundo** do quadrado (mesma âncora no idle/atk/die).

Motor e nomes: `docs/mob-combat-anim.md` + `src/combat/mob_sprite.ts`.
