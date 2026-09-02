# Mob combat animation (hunt sprites)

**Produto:** RogueAge · **Ecrã:** Expedição / floresta (`#mobs-container`)  
**Código:** `src/combat/mob_sprite.ts` + swaps em `src/combat/combat.ts`  
**Stills actuais:** `assets/mobs/<idImg>_idle.png` · `_atk.png` · `_die.png`

O motor **já** troca três poses. O feel ao vivo no telemóvel é **CSS no still** (respiração + lunge). WebP animado continua opcional — drop-in, sem GIF.

## Feel ao vivo (CSS, lote 1)

Os PNG `_idle` / `_atk` / `_die` são a arte. O cliente anima o **invólucro** (`.mob-hunt-sprite-shell`), não o ficheiro:

| Estado | O que se vê |
|--------|-------------|
| Idle | Respiração lenta (~1.4 s, 1–2 px). Desliga se houver WebP em loop. |
| Ataque | Still `_atk` + lunge na direcção do jogador (~420 ms) + flash branco. Classe `mob-hunt-sprite-shell--lunge`. |
| Morte | Still `_die` + `.mob-desintegrando` (já existia). Sem respiração. |

`prefers-reduced-motion: reduce` → sem breathe/lunge; o probe de WebP também fica desligado.

## Formato WebP (opcional)

| | |
|--|--|
| Entrega no repo | **WebP animado** com o **mesmo basename** do still |
| Fallback | PNG still que já existe (o cliente mostra PNG até o WebP provar que carrega) |
| **Proibido** | GIF, APNG, spritesheet CSS, MP4 |
| Canvas | **256×256** px, quadrado, um personagem centrado |
| Fundo | **transparência** preferida; se copiar o still actual, o mesmo fundo preto é aceitável no lote 1 |
| Display | Portrait ~**72 px** de altura; landscape até ~**200 px** — testa a 72 px |

### Loops

| Pose | Loop | Duração | Frames (alvo) |
|------|------|---------|----------------|
| `idle` | **sim** (ciclo contínuo) | ~600–800 ms o ciclo | 4 |
| `atk` | **não** (uma vez) | **~420 ms** (alinhado a `MOB_ATK_POSE_MS`) | 5 @ ~12 fps |
| `die` | **não**; **segurar o último frame** | ~500 ms até o corpo no chão | 6 @ ~12 fps |

O CSS de morte (`.mob-desintegrando`, ~700 ms) corre **ao mesmo tempo** que `_die`. O último frame tem de ser um corpo caído **legível** — o glow não substitui a pose.

Peso: **&lt; 40 KB** por ficheiro se possível; tecto **80 KB**. Vários mobs no ecrã.

`prefers-reduced-motion: reduce` → o cliente **não** carrega WebP; fica no PNG.

## Nomes (lote 1 — No-Grade)

Só estes três até o feel estar certo. Depois replica o mesmo contrato a D–S.

| `idImg` | Still hoje | WebP a dropar |
|---------|------------|----------------|
| `spider` | 256×256 | `spider_idle.webp` `spider_atk.webp` `spider_die.webp` |
| `wolf` | 120×120 PNG | mesmos três `.webp` a **256×256** (não fiques preso ao 120) |
| `goblin` | 120×120 PNG | idem |

Caminho: `assets/mobs/`. Não mudes `idImg` no catálogo.

## Motion (lote 1)

Mesma silhueta e paleta dos PNG. Pixel / retro RPG, **não** 3D nem cinematic.

**Pés / contacto:** âncora de chão **igual em todos os frames do mesmo mob** (como o paperdoll). Sem “saltar” o pivot.

### Spider (`spider`)
- **Idle:** respiração — abdómen sobe/desce 1–2 px, patas da frente a mexer pouco.
- **Atk:** estica as quelíceras / lunge para a câmara (o jogador). Frame 3 = impacto.
- **Die:** patas fecham para dentro, corpo colapsa; último frame = amontoado no chão.

### Wolf (`wolf`)
- **Idle:** peso a mudar de pata, focinho um tick.
- **Atk:** dentada / avanço curto. Frame 3–4 = impacto.
- **Die:** cai de lado; último frame = deitado.

### Goblin (`goblin`)
- **Idle:** shift de peso, arma/braço a oscilar.
- **Atk:** golpe por cima ou estocada (o que o still `_atk` já sugerir). Frame 3 = impacto.
- **Die:** joelho no chão depois corpo; último frame = no chão.

**Teste de estilo (No-Grade, 2026-09-01):** stills PNG **256×256** com **transparência**, cel-shade + outline a casar com o paperdoll e a trilha `battle_ng`. Goblin verde-oliva, lobo pardo e aranha terracota da trilha, luz de cima-esquerda. O CSS de `.mob-hunt-sprite-wrap::before` continua a ser a sombra de contacto — **não** pintar elipse no PNG. **Sem aura CSS** — variantes (`magic` / `poison` / `bleed` / `magic_poison` / `magic_bleed`) usam stills `<id>_<variant>_<pose>.png` com fallback ao base. Stills antigos em `assets/mobs/_archive/`. Magenta masters em `assets/mobs/_incoming/`. Lote 1 completo: `spider` / `wolf` / `goblin`.

## Cliente (já feito)

1. Spawn / re-render: PNG idle → probe WebP → troca se 200.  
2. Swing do mob: `_atk` ~420 ms → volta a `_idle` (token anti-corrida).  
3. Morte: `_die` e **não** volta a idle; o card sai com o dissolve.  
4. Hit no mob **não** reconstrói o DOM do card (senão o idle loop recomeça a cada golpe).

## Fora deste lote

Bosses (`db_bosses`), Olympiad, guerra de clãs — **não** usam este resolver. Não misturar.

**D-grade (2026-09-01):** `zombie` / `skeleton` / `bat` no mesmo contrato 256×256 + variantes. Luz do **pátio** — lua no canto superior direito de `battle_d`; highlights à direita do still, sombra à esquerda (o CSS de contacto já cai para a esquerda). Sem elipse no PNG. Magenta masters em `_incoming/`.

C / B / A / S: mesmos nomes `_idle` / `_atk` / `_die` quando o lote D estiver aprovado no telefone.
