# Grelhas de item (bolsa + seletores) — layout aprovado



**Estado:** configuração estável (mobile-first). **Ler este ficheiro antes** de alterar grelhas com `.inventory-grid`, slots ou ícones em `#grid-inventario` ou `#market-seletor-grid`.



## Problema que isto resolve



Colocar `.inv-slot` **directamente** na grelha com filhos só `position: absolute` faz a célula colapsar (altura 0) → ícones **empilhados**. Misturar `aspect-ratio`, `flex` e `::before` no mesmo `.inv-slot` global piora o bug. **Não** voltar a `store-items-grid` + append directo de `.inv-slot` no seletor do leilão.



## Arquitetura (obrigatória)



```

#… .inventory-grid

  └── .inv-grid-cell          ← item da grelha CSS; altura via ::before (padding-top 100%)

        └── .inv-slot           ← visual + clique; position absolute; inset 0

              ├── .inv-icon-frame

              │     └── img.inv-img

              ├── .enchant-label / .inv-qtd / …

```



| Camada | Responsabilidade |

|--------|------------------|

| `.inventory-grid` | `display: grid`, colunas, gap, scroll, safe-area |

| `.inv-grid-cell` | Quadrado na grelha (`::before` 100% largura) |

| `.inv-slot` | Moldura, borda, hover/active (sem `scale` / `z-index` na grelha) |

| `.inv-icon-frame` + `img` | Ícone preenche o quadrado (`object-fit: cover`) |



## Ecrãs cobertos



| Ecrã | Grelha (HTML) | JS |

|------|---------------|-----|

| **Bolsa** | `#grid-inventario.inventory-grid` | `renderizarInventario()` em `ui_inventory.js` |

| **Leilão — escolher item** | `#market-seletor-grid.inventory-grid` | `abrirSeletorItemMarket()` em `ui_market.js` |



Helpers partilhados (definidos em `ui_inventory.js`, usados por ambos):



- **`_l2AppendInvGridSlot(grid, slotClass, innerHtml, onClick, title?)`** — único caminho para criar slot.

- **`_l2InvIconFrameHtml(src, imgClass?)`** — `<div class="inv-icon-frame">` + `<img>` sem `width`/`height` HTML.

- **`_marketResolveStackItemImg(nome)`** — só leilão; resolve ícone de materiais (paridade com a bolsa).



Ícones fonte: **256×256** PNG (`window.L2MINI_ITEM_ICON_PX`, GDD §11.3); o cliente normaliza com `object-fit: cover`.



---



## Bolsa (`#grid-inventario`)



### Ficheiros (autoridade)



| Ficheiro | Papel |

|----------|--------|

| **`css/inventory-grid.css`** | **Única autoridade** de layout da grelha (bolsa + qualquer `.inventory-grid`). Último CSS de inventário no `index.html` (depois de `index-extras.css`). |

| `js/ui_inventory.js` | `renderizarInventario()`, helpers `_l2AppendInvGridSlot` / `_l2InvIconFrameHtml`. |

| `css/screens.css` | Só shell de `#tela-inventario` (flex column). **Sem** regras de `.inventory-grid` / slots. |

| `css/components.css` | Estilos genéricos `.inv-slot` (enchant, loja, paperdoll). **Sem** regras `.inventory-grid .inv-slot`. |



### HTML



```html

<div id="tela-inventario" class="screen-content">

  <h4 class="screen-title--inv">…</h4>

  <div id="grid-inventario" class="inventory-grid"></div>

</div>

```



### CSS — ordem no `index.html`



```html

<link rel="stylesheet" href="css/index-extras.css">

<link rel="stylesheet" href="css/inventory-grid.css">

```



### Shell



- Scroll da lista: **só** em `.inventory-grid`.

- `#tela-inventario`: `overflow: hidden` + flex column.



---



## Leilão — seletor de item (`#market-seletor-grid`)



**Estado:** aprovado (2026-06). Mesmo contrato de célula que a bolsa; shell do modal em flex column.



### Ficheiros (autoridade)



| Ficheiro | Papel |

|----------|--------|

| **`css/inventory-grid.css`** | Grelha (colunas, célula, ícone) — **reutilizar**; não duplicar em `modals.css`. |

| **`css/index-extras.css`** | Shell do modal `#janela-market-seletor` (altura, flex, scroll da grelha, `.market-seletor-empty`). |

| `js/ui_market.js` | `abrirSeletorItemMarket()`, `_marketResolveStackItemImg()`. |

| `index.html` | Modal no **body** (irmão de `#modal-overlay`), padrão §5 — **não** mover para dentro de `#screen-game`. |



### HTML



```html

<div id="janela-market-seletor" class="store-window">

  <div class="store-header">…</div>

  <div id="market-seletor-grid" class="inventory-grid"></div>

  <button type="button" class="btn-l2 btn-market-back" …>BACK</button>

</div>

```



**Proibido:** `class="store-items-grid"` nesta grelha (layout antigo → empilhamento).



### Shell do modal (`index-extras.css`)



- `#janela-market-seletor`: `flex-direction: column`, altura ~70%, `max-height: 85dvh`.

- `#market-seletor-grid.inventory-grid`: `flex: 1 1 auto`, `min-height: 0`, `max-height: none` (scroll **dentro** da grelha).

- `.btn-market-back`: `flex-shrink: 0` abaixo da grelha.



### JS — contrato (`abrirSeletorItemMarket`)



1. Equipamentos: `item.base` para nome/img; badges `enchant-label` / `augment-label`; `_l2AppendInvGridSlot`.

2. Materiais: excluir moedas de bolsa (Adena / Ancient Coin); `_marketResolveStackItemImg` + `inv-qtd`.

3. Bolsa vazia: `<div class="market-seletor-empty">` com `grid-column: 1 / -1` (não usar `.inv-slot`).

4. **Nunca** `createElement('div')` + `className = 'inv-slot'` + `grid.appendChild(div)` directo.



Ordem de scripts: `ui_market.js` carrega antes de `ui_inventory.js`; helpers existem em **runtime** quando o jogador abre o modal.



---



## CSS — tokens (todas as `.inventory-grid`)



| Token | Default | ≤380px |

|-------|---------|--------|

| `--l2-inv-cols` | 5 | 4 |

| `--inv-gap` | clamp(4px…8px) | menor |

| `--inv-pad` | clamp(8px…12px) | menor |



## Regras de ouro (não regredir)



1. **Nunca** append `div.inv-slot` directamente a uma `.inventory-grid` — usar `.inv-grid-cell` via `_l2AppendInvGridSlot`.

2. **Nunca** `aspect-ratio` + `::before` spacer no **mesmo** `.inv-slot` dentro da grelha.

3. **Nunca** `align-self: stretch` nos itens da grelha (estica célula → retângulo).

4. **Nunca** `transform: scale` / `z-index` elevado no hover da grelha (`effects.css` já exclui `.inventory-grid`; manter).

5. **Nunca** `width="256" height="256"` no `<img>` da grelha (quebra layout intrínseco).

6. **Nunca** duplicar layout da grelha em `components.css` / `screens.css` / `modals.css` — editar **`inventory-grid.css`** (+ shell do modal em `index-extras.css` se for leilão).

7. **Leilão:** manter `#market-seletor-grid` com classe **`inventory-grid`**, não `store-items-grid`.



## Mobile



- `touch-action: pan-y` na grelha; `manipulation` no slot.

- `padding-bottom` + `scroll-padding-bottom` com `env(safe-area-inset-bottom)`.

- Feedback táctil: borda dourada em `:active`, sem animação de carta.



## Regressão rápida (QA)



**Bolsa**



1. Ctrl+F5 → **Inventory**.

2. Grelha 5 colunas (4 em telemóvel estreito); **nenhum** ícone sobreposto.

3. Cada célula **quadrada**; ícone preenche o slot.

4. Scroll vertical suave; última fila não escondida pela barra de gestos.

5. Toque abre acção; quantidade/+ enchant legíveis.



**Leilão**



6. **Social → Marketplace → Sell** → tocar no slot `+` (escolher item).

7. Modal com grelha 5 colunas; equipamentos e materiais **sem empilhar**.

8. Ícones quadrados; quantidade nos materiais; +enchant nos equipamentos.

9. Scroll **dentro** da grelha; botão Back fixo em baixo; chat/jogo não cortados pelo modal.



## Histórico



- 2026-06: layout final bolsa com `.inv-grid-cell` + `inventory-grid.css` (empilhamento, retângulos, ícones minúsculos).

- 2026-06: seletor do leilão migrado para o mesmo contrato (`#market-seletor-grid.inventory-grid`, `abrirSeletorItemMarket` + helpers da bolsa).


