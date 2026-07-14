# UI Shell — moldura oficial

Contrato de layout para o jogo parecer **o mesmo** em telemóveis diferentes (proporção e largura máxima), sem altura fixa em pixels que quebre em notch / barra de gestos.

Suporta **dois modos efectivos**: **portrait** (telemóvel) e **landscape** (PC / ecrã largo).

## Implementação

| Ficheiro | Papel |
|----------|--------|
| `css/base.css` | Tokens `:root` (`--l2-shell-max-width`, safe areas, paddings, modais; refs landscape) |
| `css/shell.css` | Cálculo de `--l2-shell-w` / `--l2-shell-h` em `.game-container` (portrait / contain) |
| `css/shell-landscape.css` | Overrides sob `html[data-l2-layout="landscape"]` — **carregar por último** no `index.html` (depois de auth-flow / inventory-grid) |
| `css/layout.css` | Estrutura interna (viewport, hotbar, tabs) |
| `css/index-extras.css` | Expedição base, floresta, modais extra |
| `css/expedition-portrait-fit.css` | Expedição — caber no shell portrait (depois de `index-extras`) |
| `src/ui/ui_layout_mode.ts` | Preferência `auto` / `portrait` / `landscape` + `data-l2-layout` |

## Números oficiais

### Portrait (default)

| Token | Valor | Uso |
|-------|--------|-----|
| `--l2-shell-max-width` | **450px** | Largura máxima do jogo no browser / preview portrait |
| `--l2-design-canvas-width` × height | **390 × 844** | Referência Figma / arte (não forçar no runtime) |
| `--l2-aspect-w` : `--l2-aspect-h` | **9 : 19.5** | Proporção portrait da moldura (iPhone-like) |
| `--l2-screen-padding-x` / `y` | 14px / 12px | `.screen-content` |
| `--l2-modal-max-width` | 420px | `.store-window` e modais largos |
| `--l2-modal-narrow-max-width` | 380px | `.l2-modal` (alert/confirm) |
| `--l2-panel-narrow-max-width` | 320px | Login, criação de personagem |

### Landscape (`html[data-l2-layout="landscape"]`)

Referência: **cliente MMO clássico em janela** (mesmo jogo, mesa de PC).

| Token / regra | Valor | Uso |
|---------------|--------|-----|
| Modo shell | **fill** | Janela completa |
| `--l2-shell-max-width` | **1920px** | Valor numérico para `min()` em modais |
| `--l2-landscape-stage` | **1080px** | Largura máx. do painel de conteúdo (centrado) |
| `--l2-landscape-card` | **200px** | Largura fixa de NPC cards (grelha centrada) |
| `--l2-pd-profile-w` / max-h | **520px / 480px** (base) | Paperdoll perfil — **mesmas regras de arte** (360∶328), sem stretch |
| `--l2-landscape-side` | **380px** (base) | Coluna lateral do perfil (Atributos de Combate) |
| `--l2-landscape-chat-w` / `h` | **420×240** (base) | Chat **janela flutuante** canto inferior esquerdo (estilo MMO clássico) |

**Tiers responsivos (landscape):** `≥1600px` sobe perfil/chat (`560/520`, side `400`, chat `460×260`); `≤1440px` **ou** altura `≤800px` desce (`460/420`, side `340`, chat `360×190`) e o `#tela-perfil` ganha `padding-left` = largura do chat para o dock não cobrir o paperdoll/botões; `≤1100px` e `≤980px` mantêm os fallbacks existentes.

**Grelha in-game:** HUD → viewport → hotbar → tabs. Chat **não** entra no grid — é painel absoluto no canto inferior esquerdo, acima da hotbar. Hotbar slots **52px** centrados. **Nunca** `width: 100%` no paperdoll.

**HUD (landscape):** uma única faixa equilibrada — cluster esquerdo (avatar → nome → barras), **XP flexível a preencher o meio** (`flex: 1`), cluster direito (pill de moedas horizontais + status online). **Não** voltar a fixar a XP em largura pequena com `margin-left: auto` — era isso que deixava um buraco vazio no meio da barra.

**Perfil (tela inicial, landscape):** `#tela-perfil.screen-content` centra verticalmente (`justify-content: center`); `.profile-scroll-pane` é grid 2 colunas — paperdoll (col 1) + card de stats (col 2, `align-self: stretch`, grid interno `space-evenly`, nota de rodapé com `margin-top: auto`) — e os botões de ação (Spellbook / Apuração / Save) numa **linha horizontal centrada** sob as duas colunas.

**Arenas full-bleed (Olympiad / Raid / Clan War):** em landscape **não** aplicar `--l2-landscape-stage` nem `margin-inline: auto` no `#tela-*` absoluto — isso deixa a coluna colada à esquerda. A arena ocupa **100%** do shell; o conteúdo do lobby (season, tabs, scroll) centra com `max-width` ~960px por dentro.

**Enchant / Augment (landscape):** `#janela-enchant` / `#janela-augment` usam modal largo (~980px) com layout de oficina — grelha de equipamento | preview + botões | grelha de scrolls/pedras (`display: contents` no `.enchant-split`). Em ≤1100px o anvil central desce para 190px. Sub-modais `#janela-augment-acao` / `#janela-augment-resultado` ~420px.

**Lojas NPC (landscape):** `#janela-loja` / `#janela-venda` ~1000px em balcão — grelha de catálogo (esquerda) | painel de detalhes + checkout + Comprar/Back em fila (direita). Tabs de armas/armadura/joias só no mega-loja de equipamentos (escondidas no grocer). Menus `#menu-equipment` / `#menu-grocer` um pouco mais largos; `#menu-equipment-grades` em grelha 3×2 de grades sob o diálogo (sem `display:!important`, para o JS poder esconder).

**World hub (landscape):** `#tela-world .world-container` ~1240–1320px em grelha `title | gatekeeper + adventure`. Zonas da Clarissa como “bilhetes” (nome + pill de custo) em 2 colunas; aventuras em board 2×2 com cards altos. Em ≤1440px / altura baixa: `padding-left` para o chat; em ≤1100px empilha as colunas.

**Marketplace (landscape):** `#menu-social-market` balcão centrado ~1180–1220px (não o stage 1080 genérico). Tabs a largura total; aba Buy em grelha `search | filters` numa linha + lista densa; Sell com label + “Register” na mesma fila; modais `#janela-market-registrar` (~760px, item | preço) e `#janela-market-seletor` (~820px, grelha 8 cols). Com o mercado aberto, o chat vira dock de vidro (mais transparente + blur) no canto — sem empurrar o balcão; em ≤1100px empilha toolbar e registo.

**Expedition battle BG:** portrait `assets/zones/battle_<slug>.webp` (1080×2340); PC `battle_<slug>_wide.webp` (1920×1080). Cliente em `src/ui/ui_forest_battle_bg.ts` — landscape tenta wide, senão crop do portrait; evento `l2-layout-change` refresca a meio do combate. Ver `assets/zones/README.md`.

**Town Square (landscape):** `#praca-cidade` balcão centrado ~1180–1240px (grelha 3 cols + Master | Craft banner). Cards maiores; menus NPC ~820–900px. Com `#tela-cidade` aberta, chat em dock de vidro (como o mercado). Em ≤1100px a grelha passa a 2 cols.

## Preferência do jogador

- Settings → **Layout**: `Auto` / `Mobile` (portrait) / `PC` (landscape).
- Device: `localStorage` chave `l2mini_layout`.
- Personagem: campo `uiLayoutMode` no save (`auto` \| `portrait` \| `landscape`).
- **Auto:** landscape se largura útil ≥ **900px** e (orientação landscape **ou** ratio largura/altura ≥ **1.2**); senão portrait.
- Runtime aplica `data-l2-layout="portrait|landscape"` no `<html>` e escuta `resize` / `orientationchange`.

## Comportamento no telemóvel

### Portrait (telefone / touch)

1. Modo **`fill`** (`css/shell.css`): o shell ocupa **100%** da área útil do `body` (já descontadas safe areas).
2. **Sem** letterbox por proporção 9∶19.5 — o layout interno (flex + scroll) adapta-se à altura real do aparelho.
3. Media: `(orientation: portrait) and (max-width: 768px)` ou touch `(pointer: coarse)` em portrait até 900px.
4. Se `data-l2-layout="landscape"` estiver activo, **não** usar fill — `shell-landscape.css` força contain 16∶9.

### Desktop / landscape / preview centrado

1. Com `data-l2-layout="landscape"`: modo **`fill`** — o shell ocupa **100%** da área útil (sem letterbox 16∶9).
2. Com portrait no desktop (force Mobile / janela estreita): modo **`contain`** 9∶19.5 / max 450px, centrado.
3. `body` usa `viewport-fit=cover` + `env(safe-area-inset-*)` para notch e home indicator.
4. Landscape HUD: chat lateral; grelhas de cidade/world com mais colunas; login em duas colunas.

### HUD landscape (PC client)

Sob `data-l2-layout="landscape"` e `#screen-game` (classe `game-ingame` no `.game-container`):

- Shell full-width; `#screen-game` continua **flex** (não grid — evita partir a largura).
- Tabs reordenadas para baixo via `order`.
- **Chat** = janela flutuante canto inferior esquerdo (420×260).
- Hotbar centrada; inventário/perfil com tamanhos ideais.

Social / Olimpíada / Guerra / Expedição: usáveis na moldura larga; stack interno vertical (sem redesign dedicado no v1).

## Regras para novos ecrãs / modais

- Conteúdo **dentro** de `.game-container`: `width: 100%`, scroll com `flex: 1` + `min-height: 0` (ver `layout.css`).
- Modais com `abrirModal`: `max-width` via `--l2-modal-max-width`, não valores soltos em px.
- Não definir `height: 800px` fixo no shell; usar `% do shell ou `dvh` com teto `85dvh` em modais.
- Arte full-screen (paperdoll 1080×984, ícones 256×256) é **asset**, não tamanho de ecrã.
- Overrides landscape: preferir seletores sob `html[data-l2-layout="landscape"]` em `shell-landscape.css` (ou ficheiro de ecrã), não alterar tokens portrait globais.

## Expedição (portrait fit)

A expedição roguelike usa layout próprio em **`css/expedition-portrait-fit.css`** (depois de `index-extras.css`):

- **Run / jornada:** vitals numa linha; chat oculto; **hotbar dentro do painel** (entre caminhos e Extract), não no hub inicial.
- **Combate:** hotbar acima dos botões de combate, no mesmo painel da floresta.
- **Hub:** painel full-width com scroll interior.

Não alterar tokens `--l2-shell-*` para remendar expedição — ajustar só este ficheiro.

## Ajuste fino

Para moldura portrait um pouco mais alta/baixa, alterar só `--l2-aspect-h` (ex. `20` ou `19`) em `base.css` e validar perfil + combate + mercado.

Para landscape, ajustar `--l2-landscape-*` em `base.css` e os overrides em `shell-landscape.css`.
