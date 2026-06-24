# Ícones de joias (acessórios)

**256×256** PNG, quadrado, moldura estilo projeto (GDD §11.3 — igual a moedas / sets em `assets/itens/`).

## Só ícone — nada no paperdoll

Joias **não** aparecem no corpo do personagem (sem `equips/` por preset). Usam-se apenas em:

- bolsa / inventário  
- loja  
- slots neck / ear / ring no perfil  

## Caminho canónico

**`assets/joias/<id_da_joia>.png`**

O `id` é o mesmo de `catalogoJoias` em `js/db_items.js` (`catalogJewelIconPath`).

## Global (todas as raças / classes)

**Um ficheiro por joia para todo o jogo** — não criar pasta por preset nem por raça.

## NG (loja)

| Joia | Ficheiro |
|------|----------|
| Wooden Necklace | `j_ng_neck.png` |
| Wooden Earring | `j_ng_ear.png` |
| Wooden Ring | `j_ng_ring.png` |

## D (loja)

| Joia | Ficheiro |
|------|----------|
| Elven Necklace | `j_d_neck.png` |
| Elven Earring | `j_d_ear.png` |
| Elven Ring | `j_d_ring.png` |

Prompts de arte: `docs/jewel-image-prompts.md`.

## Separado de `assets/itens/`

| Pasta | Conteúdo |
|-------|----------|
| `assets/itens/` | Sets de armadura, consumíveis, scrolls, materiais, receitas |
| `assets/armas/` | Ícones de armas |
| `assets/joias/` | Ícones de colar, brinco e anel |
| `assets/paperdolls/` | Corpo + armadura + arma no palco (1080×984) |

Ver também `docs/paperdoll-art-spec.md`.
