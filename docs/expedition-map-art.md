# Expedition trail map — brief (mobile portrait)

**Produto:** RogueAge · **Tela:** Expedição (`#tela-expedition`)  
**Estado:** pintura locked `assets/expedition/map_bg.jpg` (Sep 2026, `assets/world/_incoming/expedition-map-a.png`) — mesma língua da cidade / D2 (cel-shade limpo, dusk `#241710`, bronze, banners vermelhas com chevron dourado).  
**Fluxo:** World → Deepgrove → Enter → este mapa → toque na zona → Enter → `abrirDetalhesZona(<grade>)`.  
**Canvas:** **1080×1620**. Display no jogo: scale **3×** → ~**360×540 px**.  
**Bake (só o fundo):** `node tools/bake_expedition_map.mjs`.  
**Recortes:** manuais — drop `assets/expedition/_incoming/<id>.png` + `npm run export:expedition`. Sem recorte, o cliente esconde a `<img>` e usa o oval de selecção.

Não iterar a tela de personagem (`assets/ui/char_select_gate.webp`).

## Portas

| ID | Zona | Grade |
|----|------|-------|
| `ng` | Talking Island | No-Grade |
| `d` | Ruins of Despair | D |
| `c` | Death Pass | C |
| `b` | Dragon Valley | B |
| `a` | Tower of Insolence | A |
| `s` | Imperial Tomb | S |

O arco decorativo no meio-direita **não** é hotspot.

## Recorte

1. Abrir `assets/expedition/map_bg.jpg` (ou `_incoming/expedition-map-a.png` no World incoming).
2. Ficar só com a silhueta da zona, **mesmos pixels / pose**. Resto = transparente.
3. PNG **1080×1620** com alpha em `assets/expedition/_incoming/<id>.png`.
4. `npm run export:expedition`
5. Hard-refresh no cliente (Vite não vigia `assets/`).

Cliente: `src/ui/ui_expedition_map.ts` · palco `#expedition-map-stack` · CSS `css/expedition-map.css`.
