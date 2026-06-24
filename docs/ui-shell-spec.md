# UI Shell — moldura oficial

Contrato de layout para o jogo parecer **o mesmo** em telemóveis diferentes (proporção e largura máxima), sem altura fixa em pixels que quebre em notch / barra de gestos.

## Implementação

| Ficheiro | Papel |
|----------|--------|
| `css/base.css` | Tokens `:root` (`--l2-shell-max-width`, safe areas, paddings, modais) |
| `css/shell.css` | Cálculo de `--l2-shell-w` / `--l2-shell-h` em `.game-container` |
| `css/layout.css` | Estrutura interna (viewport, hotbar, tabs) |

## Números oficiais

| Token | Valor | Uso |
|-------|--------|-----|
| `--l2-shell-max-width` | **450px** | Largura máxima do jogo no browser / PC |
| `--l2-design-canvas-width` × height | **390 × 844** | Referência Figma / arte (não forçar no runtime) |
| `--l2-aspect-w` : `--l2-aspect-h` | **9 : 19.5** | Proporção portrait da moldura (iPhone-like) |
| `--l2-screen-padding-x` / `y` | 14px / 12px | `.screen-content` |
| `--l2-modal-max-width` | 420px | `.store-window` e modais largos |
| `--l2-modal-narrow-max-width` | 380px | `.l2-modal` (alert/confirm) |
| `--l2-panel-narrow-max-width` | 320px | Login, criação de personagem |

## Comportamento no telemóvel

### Portrait (telefone / touch)

1. Modo **`fill`** (`css/shell.css`): o shell ocupa **100%** da área útil do `body` (já descontadas safe areas).
2. **Sem** letterbox por proporção 9∶19.5 — o layout interno (flex + scroll) adapta-se à altura real do aparelho.
3. Media: `(orientation: portrait) and (max-width: 768px)` ou touch `(pointer: coarse)` em portrait até 900px.

### Desktop / landscape / preview centrado

1. Modo **`contain`**: largura = `min(450px, largura útil, altura útil × 9/19.5)`.
2. Altura = `min(altura útil, largura × 19.5/9)`.
3. `body` usa `viewport-fit=cover` + `env(safe-area-inset-*)` para notch e home indicator.
4. Ecrãs mais altos que a proporção: jogo **centrado** com margem preta (letterbox).
5. Ecrãs mais baixos: largura encolhe para caber — hotbar e tabs mantêm-se na mesma coluna.

## Regras para novos ecrãs / modais

- Conteúdo **dentro** de `.game-container`: `width: 100%`, scroll com `flex: 1` + `min-height: 0` (ver `layout.css`).
- Modais com `abrirModal`: `max-width` via `--l2-modal-max-width`, não valores soltos em px.
- Não definir `height: 800px` fixo no shell; usar `% do shell ou `dvh` com teto `85dvh` em modais.
- Arte full-screen (paperdoll 1080×984, ícones 256×256) é **asset**, não tamanho de ecrã.

## Ajuste fino

Para moldura um pouco mais alta/baixa, alterar só `--l2-aspect-h` (ex. `20` ou `19`) em `base.css` e validar perfil + combate + mercado.
