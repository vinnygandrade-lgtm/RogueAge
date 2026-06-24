# Joias — prompts de ícone (256×256)

Só **ícone de bolsa / loja / slots do perfil** — **sem** layer no paperdoll.  
**IDs e stats:** `js/db_items.js` (`catalogoJoias`, `catalogJewelIconPath`).  
**Pasta:** `assets/joias/<id>.png` — ver `assets/joias/README.md`.

## Especificação global (todas as grades)

| Regra | Valor |
|-------|--------|
| Tamanho export | **256×256 px**, PNG, **1:1** |
| Fundo do painel | Quadrado cinza neutro com cantos ligeiramente arredondados (igual série NG) |
| Moldura | Ornamental bronze/castanho envelhecido (`#241710` / `#735939`) — **mesmo set** que moedas e `set_*` em `assets/itens/` |
| Estilo | Ilustração fantasy MMO semi-realista, contorno preto legível, sombreamento simples |
| Cópias | **1 ficheiro global** por joia (não duplicar por preset/raça) |

**Progressão visual por grade** (alinhado a `js/grade_ui.js`):

| Grade | Tom sugerido no objeto / gema |
|-------|-------------------------------|
| NG | Madeira, cobre, resina âmbar — rústico |
| **D** | **Prata envelhecida, filigrana élfica, gema azul-aço `#6eb5d4`** |
| C | Pedra aquática / jade claro |
| B | Black ore, obsidiana |
| A | Ouro pálido, rubi |
| S | Platina, cristal arcano rosa |

---

## No-Grade (feito)

| ID | Ficheiro | Nome |
|----|----------|------|
| `j_ng_neck` | `j_ng_neck.png` | Wooden Necklace |
| `j_ng_ear` | `j_ng_ear.png` | Wooden Earring |
| `j_ng_ring` | `j_ng_ring.png` | Wooden Ring |

Referência visual: madeira entalhada + cobre/bronze mate, sem brilho mágico forte.

---

## D-Grade — Elven (3 ícones)

**Ficheiros a gerar:**

| ID | Ficheiro | Nome (catálogo) | Slot |
|----|----------|-----------------|------|
| `j_d_neck` | `j_d_neck.png` | Elven Necklace | neck |
| `j_d_ear` | `j_d_ear.png` | Elven Earring | ear |
| `j_d_ring` | `j_d_ring.png` | Elven Ring | ring |

**Linha visual D:** artesanato élfico — prata ou mithril fosco, arabescos de folha/vinha finos, **uma gema principal azul-aço** (`#6eb5d4`, opaca com brilho interno suave). Evolução clara face às joias NG de madeira; ainda humilde (primeiro tier “metálico”), sem ouro nem glow arcano forte.

### `j_d_neck` — Elven Necklace

**Objeto:** colar de prata envelhecida com corrente fina de elos ovais entrelacedos (não corda de cânhamo).

**Pingente:** medalhão em forma de **folha estilizada** (bordos suaves, veio central gravado); no centro da folha, **gema redonda** azul-aço `#6eb5d4`, facetada mas pequena; filigrana de vinha nos cantos do medalhão.

**Detalhes:** fecho simples atrás sugerido por um elo maior; prata com patina fria (sombras azuladas discretas); **sem** runas luminosas; contorno preto como NG.

**Prompt (EN, gerador de imagem):**  
Game item icon 256x256, square, ornate bronze frame border, neutral gray inner panel, fantasy MMORPG jewelry icon, elven silver necklace, fine oval link chain, stylized silver leaf pendant with delicate vine filigree, small round steel-blue gemstone #6eb5d4 center, aged matte silver patina, clean black outlines, cel shading, no paperdoll, no character, transparent outside frame — **export object centered in panel like wooden necklace game icon style**.

---

### `j_d_ear` — Elven Earring

**Objeto:** par sugerido como **um** brinco em vista (o jogo duplica L/R no equip).

**Forma:** argola fina de prata + pendente em **gota alongada** (lágrima élfica), não disco de madeira.

**Superfície:** gota com entalhe em espiral suave (não X tribal de madeira); filete de filigrana na borda; **micro-gema** azul-aço no topo da gota ou incrustada no centro.

**Gancho:** arco de prata delicado, mais fino que o cobre NG; leve brilho satinado, sem neon.

**Prompt (EN):**  
Game item icon 256x256, square, ornate bronze frame border, gray panel, fantasy MMORPG earring icon, single elven silver earring, thin silver hoop, elongated teardrop pendant with soft spiral engraving and leaf filigree edge, tiny steel-blue gem accent #6eb5d4, matte aged silver, bold black outline, cel shading, centered, matching wooden earring icon composition style.

---

### `j_d_ring` — Elven Ring

**Objeto:** anel de banda **média** (não tão grosso quanto o wooden ring NG).

**Material:** prata com faixa central ligeiramente mais clara; exterior com **gravação contínua de folhas minúsculas** em fila (padrão repetido, elegante).

**Gema:** **uma pedra redonda** azul-aço cravada no topo da banda (visível em 3/4 como o anel NG); chaton de prata com quatro garras baixas.

**Interior:** banda lisa polida (contraste prata escura / clara como madeira clara no NG).

**Prompt (EN):**  
Game item icon 256x256, square, ornate bronze frame border, gray panel, fantasy MMORPG ring icon, elven silver ring three-quarter view, medium band with continuous tiny leaf engravings, round steel-blue gemstone #6eb5d4 in silver four-prong setting on top, satin aged silver, clean black outlines, cel shading, same angle and icon style as carved wooden ring game asset.

---

## Checklist após export

1. Guardar em `assets/joias/` com o **id** exato (`j_d_neck.png`, etc.).
2. Confirmar **256×256** e moldura alinhada aos ícones NG.
3. Loja **D** → aba Joias → os três itens devem mostrar ícone (filtro `grade === 'D'` em `ui_shop.js`).
4. Equipar no perfil → slots neck / ear L-R / ring L-R.
