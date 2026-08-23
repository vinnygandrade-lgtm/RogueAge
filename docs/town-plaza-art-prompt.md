# Town Square — brief de arte (mobile portrait)

**Produto:** RogueAge · **Aba:** Town (`#praca-cidade`)  
**Cliente (live):** palco em `#town-plaza-stack` + `css/town-plaza.css`. Arte no repo: **1080×1620** (`assets/town/plaza_bg.jpg` + layers `crafting` / `equipment` / `grocer` / `enchanter` / `classmaster`). Export: `tools/export_town_plaza_art.mjs`.  
**Gameplay:** toque no NPC → `abrirNpc('equipment' | 'grocer' | 'enchanter' | 'classmaster' | 'crafting')` — hubs existentes não mudam

---

## Prompt único (gerar 1 imagem → recortar layers)

Workflow: gerar **uma** imagem completa abaixo → recortar fundo + cada NPC para PNG **1080×1620** (personagens com transparência) → stack no cliente.

### PROMPT MASTER (copiar inteiro)

```
Vertical fantasy MMORPG town square hub, single complete illustration, 2:3 portrait aspect ratio 1080x1620 pixels, mobile game city screen, original world RogueAge, semi-realistic digital painting, dark fantasy classic MMO aesthetic, rich stone browns #241710 and aged bronze #735939, cinematic dusk lighting, no UI, no readable text, no logos, no watermark.

CAMERA: low eye-level from plaza entrance, viewer standing on empty cobblestone at the bottom looking up into the square, slight wide-angle, NOT isometric, NOT top-down.

COMPOSITION — five original NPCs, all clearly separated silhouettes, no overlapping bodies, natural depth staging:

FOREGROUND CENTER (closest, largest figure): Forge-Master Kael Dravik — massive orc master smith, muscular artisan, dark green-brown skin, black hair topknot with bronze rings, heavy rune-etched leather apron, bare tattooed forearms, raising epic hammer over a luminous iron anvil on stone block, sparks flying, intense amber-orange light from below, feet wide on cobblestone, height visually largest ~500px scale, center bottom X=50%.

MID-LEFT: Brann Coalforge — stocky human armorer man ~45, soot on forearms, short iron-grey beard, heavy leather apron over dark chain shirt, hammer on belt, hand on hip, beside built-in stone forge with orange ember glow in wall niche, 3/4 view facing toward center, feet on cobblestone Y=mid-low left X=17%.

MID-RIGHT: Lirien Valebrook — elegant elf consumables merchant, auburn braid, green embroidered vest and travel cloak, belt with colored potion vials, holding small glowing red potion vial, beside wooden market stall with green canvas awning crates and herbs, 3/4 view facing toward center, feet on cobblestone Y=mid-low right X=83%, same depth as armorer.

BACK-LEFT (elevated on low stone platform): Archivist Vex Mir — tall lean human enchanter ~50, silver hair, indigo hooded robe with purple arcane embroidery, fingerless gloves, hands hovering over glowing purple rune circle on pedestal, mysterious calm face, purple magical under-glow, feet on platform Y=upper-mid left X=30%.

BACK-RIGHT (elevated on central stone staircase top step): High Warden Soren — imposing human grand master ~55, short white beard, ceremonial white and gold tabard over polished plate cuirass, gold cape clasp, one hand raised in blessing other holding closed ancient codex, golden divine rim light from above, authority and warmth, feet on upper step Y=upper-mid right X=68%.

ENVIRONMENT: medieval cobblestone plaza consistent perspective, bottom 120 pixels mostly empty pavement for player viewpoint, dusk sky gradient deep blue-purple to warm amber, stone archway or gate tower centered in far background, faded generic banners with geometric crests only, torch light on walls.

PROPS integrated in scene: left forge niche with tools and coal bucket, right market stall structure, center-back wide marble stairs 4 steps with gold trim, left-back circular rune pedestal with purple crystals, foreground center master anvil with scratch marks.

LIGHTING: golden hour ambient plus localized color pools — orange forge left, soft green market right, purple enchanter glow, gold spotlight on grand master and central anvil, cool sky fill, each NPC in own light accent so all five stand out clearly.

STYLE: painterly semi-realistic, sharp readable silhouettes for mobile, high detail faces and costumes, cohesive single scene, fantasy MMORPG town hub, original characters not based on any existing game IP.

NEGATIVE: blurry, low resolution, horizontal landscape, cropped heads, crowded extra people, modern objects, sci-fi, neon cyberpunk, anime chibi, cartoon proportions, readable letters or numbers, UI buttons, frame border, duplicate clones, characters merging together, bird eye view, white void background.
```

### Pós-geração (recorte para stack)

1. Redimensionar/crop export final para **1080×1620** exactos.  
2. **plaza_bg.png** — duplicar imagem e apagar os 5 personagens (inpaint ou manual).  
3. **npcs/*.png** — cada personagem num canvas **1080×1620** transparente, colado na **mesma posição** da imagem original (não recentrar).  
4. Validar pés/chão alinhados entre bg e layers.

---

**Pastas alvo (quando implementar no cliente):**

```
assets/town/
  plaza_bg.png                 1080×1620 — cenário SEM personagens
  npcs/
    equipment.png              1080×1620 — transparente, armorer na posição
    grocer.png
    enchanter.png
    classmaster.png
    crafting.png
```

Cada PNG de NPC = **canvas inteiro**; só o personagem visível; resto **alpha 0**.

---

## Regras globais de export

| Regra | Valor |
|-------|--------|
| Resolução mestre | **1080 × 1620 px** |
| Formato | PNG |
| Fundo (bg) | Opaco |
| Fundo (NPC layers) | Transparente fora da silhueta |
| Estilo | Fantasy MMORPG semi-realista, pintura digital, **identidade original RogueAge** |
| Proibido | Logos, texto legível, UI, IPs de terceiros |
| Chão | Pedra medieval consistente; **mesma perspectiva** em bg + todos os NPCs |
| Zona reservada | **0–120 px** do fundo = calçada vazia (POV do jogador); **sem** NPCs |
| Zona céu | **0–200 px** do topo = arco/céu; **sem** rostos colados ao topo |

**Display no jogo:** scale **3×** → ~**360×540 px** no telemóvel.

---

## Mapa de profundidade (vista frontal — jogador em baixo)

```
                    ╭──── arco / torre / bandeiras ────╮
                   ╱                                     ╲
              ENCHANTER                            CLASS MASTER
              (plataforma)                         (degraus)
                   ✦ roxo                              ✦ dourado
                     
        ARMORER                                    GROCER
        (forja) 🟠                                 (barraca) 🟢
                     
                         MASTER CRAFTER
                      (big anvil, faíscas) 🟡
    ═══════════════════════════════════════════════════════
              calçada vazia — reservada (jogador)
```

---

## Posições exactas (centro do torso / pés)

| ID jogo | Função | Nome arte (original) | X % | X px | Pés Y px | Altura figura | Profundidade |
|---------|--------|----------------------|-----|------|----------|---------------|--------------|
| `equipment` | Loja equip. | **Brann Coalforge** | 17% | 184 | 1240 | ~420 px | Meio-esquerda |
| `grocer` | Consumíveis | **Lirien Valebrook** | 83% | 896 | 1240 | ~420 px | Meio-direita |
| `enchanter` | Enchant | **Archivist Vex Mir** | 30% | 324 | 980 | ~400 px | Fundo-esquerda (plataforma +40 px) |
| `classmaster` | Class / buffs | **High Warden Soren** | 68% | 734 | 920 | ~400 px | Fundo-direita (topo degraus) |
| `crafting` | Craft épico | **Forge-Master Kael Dravik** | 50% | 540 | 1540 | **~500–520 px** | **Primeiro plano centro** |

**Notas de composição**

- **Kael (craft)** = maior figura; único no centro frontal; máximo destaque.
- **Soren (class)** = recuado mas **elevado** nos degraus; luz dourada de cima.
- **Brann** e **Lirien** = mesma linha de profundidade (pés Y 1240); simetria suave, não espelhada.
- **Vex** = entre Brann e Soren em profundidade; glow roxo isola-o dos ferreiros.

---

## Prompt 1 — Cenário (`plaza_bg.png`)

**Ficheiro:** fundo opaco, **zero personagens**, **zero texto**.

```
Vertical fantasy MMORPG town square environment, 2:3 portrait composition 1080x1620,
mobile game hub background, original world not based on any existing game.

CAMERA: low eye-level from plaza entrance, viewer standing on empty cobblestone at bottom,
looking up into a grand medieval market square. Slight wide-angle warmth, not isometric.

TOP (sky zone): dusk sky gradient deep blue-purple to warm amber near horizon,
stone archway or gate tower centered upper background, faded banners with generic geometric crests
(no readable text), torch brackets on walls, subtle fog depth.

MID-GROUND LEFT: blacksmith workshop niche — stone wall, built-in forge with orange ember glow
inside arch, hanging tools silhouette, coal bucket, NO person.

MID-GROUND RIGHT: wooden market stall structure — green canvas awning, crates, barrels,
glass bottles on shelves, herb bundles, NO person.

CENTER-BACK: wide stone staircase (4 steps) rising to a small platform,
marble or light granite, gold trim accents, empty throne-like lectern or banner pole,
spot for authority figure — EMPTY.

LEFT-BACK PLATFORM: low circular stone pedestal with faint carved rune circle,
purple crystal shards embedded in rock — EMPTY, ready for enchanter.

FOREGROUND CENTER: large master anvil on stone block, heavy iron, scratch marks,
warm amber spotlight from below-left, few sparks frozen in air but subtle — NO smith.

GROUND: consistent medieval cobblestone throughout, wet reflections minimal,
lower 120px mostly empty pavement leading toward viewer, dark vignette at very bottom edge.

LIGHTING: cinematic golden hour + localized color pools —
orange forge left, green market tint right, purple rune pedestal soft glow,
gold spotlight on central anvil, cool fill from sky.

STYLE: semi-realistic digital painting, RogueAge dark fantasy MMO,
rich browns #241710 bronze #735939 stone grey, high detail architecture,
painterly but readable at mobile size, no characters, no UI, no watermark.

NEGATIVE: people, characters, crowds, modern objects, cars, sci-fi, neon,
readable letters, logo, copyright character, blurry, low resolution, horizontal landscape crop.
```

---

## Prompt 2 — Armorer / Equipment (`npcs/equipment.png`)

**Posição:** X ~184, pés Y ~1240, altura ~420 px, virado ligeiramente para centro-direita (3/4 view).

```
Single character cutout on FULL 1080x1620 transparent PNG canvas,
fantasy MMORPG equipment merchant NPC for mobile town square.

CHARACTER — "Brann Coalforge":
stocky human armorer age 45, broad shoulders, soot on forearms,
short iron-grey beard, practical undercut hair, confident calm expression,
heavy leather apron over dark chain shirt, belt with small hammer and tongs,
one hand on hip other resting on hammer handle, sturdy boots,
weathered but professional, NOT cartoon, NOT anime chibi.

POSE: standing beside forge (forge is in background layer — do NOT draw full forge wall),
feet planted on cobblestone, weight on back foot, 3/4 view facing slightly right toward plaza center.

PLACEMENT ON CANVAS (critical):
character feet bottom at Y=1240px from top, horizontal center of body at X=184px,
full body visible head to toe, occupies ~420px height,
leave entire rest of canvas fully transparent.

LIGHTING: warm orange rim light from left (forge glow), soft fill from sky.

STYLE: semi-realistic digital painting matching RogueAge town background,
same perspective and scale as environment, sharp silhouette for mobile tap target.

NEGATIVE: background scenery, forge brick wall, text, multiple people, sword swing pose,
floating, wrong scale giant, cropped head, white background instead of transparent.
```

---

## Prompt 3 — Grocer / Consumables (`npcs/grocer.png`)

**Posição:** X ~896, pés Y ~1240, espelho suave do armorer (3/4 view para centro-esquerda).

```
Single character cutout FULL 1080x1620 transparent PNG,
fantasy MMORPG consumables grocer NPC.

CHARACTER — "Lirien Valebrook":
androgynous-leaning feminine elf merchant age apparent 30s, kind sharp eyes,
auburn hair in practical braid, light travel cloak over green embroidered vest,
satchel of herbs, belt with small glass potion vials (red blue green),
holding one glowing minor health vial up casually, merchant smile,
slender graceful posture, leather boots.

POSE: 3/4 view facing slightly left toward plaza center,
beside market stall (stall structure is background only — do not draw full awning structure),
feet at cobblestone.

PLACEMENT: feet bottom Y=1240px, body center X=896px, height ~420px, rest transparent.

LIGHTING: soft green-gold market awning bounce from right, neutral sky fill.

STYLE: RogueAge semi-realistic MMO NPC, readable silhouette, mobile game hub.

NEGATIVE: background stall wood, text labels on bottles, multiple characters, cartoon proportions,
wrong placement, opaque background.
```

---

## Prompt 4 — Enchanter (`npcs/enchanter.png`)

**Posição:** X ~324, pés Y ~980 (plataforma elevada ~40 px acima do chão da praça).

```
Single character cutout FULL 1080x1620 transparent PNG,
fantasy MMORPG enchanter NPC.

CHARACTER — "Archivist Vex Mir":
tall lean human mage age 50, pale skin, short silver hair, half-hood dark indigo robe
with purple arcane embroidery, long sleeves, fingerless gloves,
both hands hovering over faint purple rune glow at waist level,
mysterious calm expression, slight forward lean, arcane scholar aura.

POSE: standing on raised stone platform (platform in bg — draw only boot contact shadow),
3/4 view toward center-right, robes mid-calf, not obscuring face.

PLACEMENT: feet bottom Y=980px, body center X=324px, height ~400px, rest transparent.

LIGHTING: strong purple under-glow from runes, cool top light, face readable.

STYLE: RogueAge enchanter, distinct from cleric or warlock — refinement and study,
semi-realistic painting.

NEGATIVE: full platform draw, background wall, green fire, sword, armor plate knight,
text spell names, chibi, wrong Y position.
```

---

## Prompt 5 — Class Master (`npcs/classmaster.png`)

**Posição:** X ~734, pés Y ~920 (topo dos degraus centrais).

```
Single character cutout FULL 1080x1620 transparent PNG,
fantasy MMORPG grand master class trainer NPC.

CHARACTER — "High Warden Soren":
imposing human warrior-scholar age 55, tall broad posture, short white beard,
 ceremonial white and gold tabard over polished plate cuirass (no full helm),
cape clasp gold, one hand raised in blessing gesture other holding closed codex,
authority and warmth, mentor energy, battle scars subtle on jaw.

POSE: standing on upper step of central staircase (steps in bg layer),
3/4 view facing slightly left-down toward viewer, commanding but welcoming.

PLACEMENT: feet bottom Y=920px, body center X=734px, height ~400px, rest transparent.

LIGHTING: golden divine rim from above-back, soft white fill on face, hero spotlight.

STYLE: RogueAge grand master — NOT paladin charge pose, trainer dignity,
semi-realistic MMO hub NPC.

NEGATIVE: staircase architecture draw, army behind, wings, angel, text on book,
multiple people, transparent errors, tiny figure.
```

---

## Prompt 6 — Master Crafter / Craft (`npcs/crafting.png`)

**Posição:** X ~540, pés Y ~1540, **maior figura ~500–520 px**, centro frontal.

```
Single character cutout FULL 1080x1620 transparent PNG,
fantasy MMORPG master crafter NPC — LARGEST figure in town scene.

CHARACTER — "Forge-Master Kael Dravik":
massive orc or half-orc master smith age 40, muscular but artisan precision,
dark green-brown skin, black hair topknot with bronze rings,
heavy rune-etched leather apron, bare tattooed forearms,
raising epic hammer mid-strike above luminous anvil (anvil base in bg — only show interaction),
determined focused expression, sparks on arms and hammer,
legendary craftsman presence, closest to camera.

POSE: dynamic but stable crafting stance, 3/4 or slight front view,
feet wide on foreground cobblestone, dominates lower center of frame.

PLACEMENT: feet bottom Y=1540px, body center X=540px, height 500-520px (tallest NPC),
head below top 200px sky zone, rest of canvas transparent.

LIGHTING: intense amber-orange from anvil below, strong rim light, highest contrast NPC.

STYLE: RogueAge epic craft tier visual, semi-realistic, mobile-readable silhouette,
must feel closer/larger than other four NPCs.

NEGATIVE: full anvil block draw, background forge room, tiny scale equal to others,
text runes readable, cartoon orc meme, weapon sell pose instead of craft.
```

---

## Prompt auxiliar — layout reference (opcional, só guia)

Gerar **uma** imagem de referência composta (não vai para o jogo) para validar posições antes dos cutouts finais:

```
1080x1620 vertical fantasy town square lineup reference sheet,
five original MMORPG NPCs in exact positions: large orc smith center front,
armorer left mid, elf grocer right mid, purple enchanter back left on platform,
gold grand master back right on stairs, empty cobblestone bottom 120px,
dusk lighting, semi-realistic, line-up for mobile game hub, no text labels
```

Usar só para **aprovar composição**; entregar ao jogo **sempre** bg + 5 layers separadas.

---

## Checklist pós-geração

1. Todos os PNGs **1080×1620** exactos?
2. NPC layers com **transparência** real (não branco/cor sólida)?
3. Pés alinhados às Y da tabela (±15 px)?
4. Kael visivelmente **maior** que Brann/Lirien?
5. Zona inferior **120 px** sem personagens?
6. Mesmo estilo/paleta entre bg e personagens?
7. Sem texto legível em nenhum asset?

---

## Ligação ao código (referência futura)

| Ficheiro | `abrirNpc()` |
|----------|--------------|
| `equipment.png` | `'equipment'` |
| `grocer.png` | `'grocer'` |
| `enchanter.png` | `'enchanter'` |
| `classmaster.png` | `'classmaster'` |
| `crafting.png` | `'crafting'` |

Hit zones HTML (~80×120 px display mínimo) por cima das silhuetas; labels via i18n (`game.town.role*`).
