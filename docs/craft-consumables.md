# Craft de consumíveis (poções & shots)

## Objetivo
Com a loja cara, o jogador **converte mats da Expedição** (e um fee de Adena) em consumíveis — sem mexer no craft de equipamento (Vesper / épico).

## Onde
| Peça | Path |
|------|------|
| Receitas | `src/db/db_craft_consumables.ts` → `catalogoReceitas.consumables` em `src/db/db_items.ts` |
| UI | Aba **CONSUMABLES** em `#janela-craft` + botão no NPC Reorin |
| Execução | `src/ui/ui_craft.ts` — `clientAuthority: true` (mesmo com sessão Supabase) |

## Catálogo (resumo)
- **Poções:** HP / Mana ×10 e ×50 (Skin+Bone ou Coal+Charcoal + Adena)
- **Soulshot** NG→S ×100 (Coal / Iron / mats + Adena crescente)
- **B. Spiritshot** NG→S ×100 (Charcoal-heavy mirror)

Equipamentos e mint de Ancient Coin **não** mudam (`special` / `mats`).

## Economia
Fee de Adena ~25–40% do lote na Grocer (pós-inflação), para o craft brilhar sem zerar a loja.

## Autoridade / dívida (§12.7)
`craft_item_secure` ainda só cobre Vesper / épico / mint. Consumíveis correm **no cliente** + `salvarJogo` / sync JSONB. Evolução alvo: RPC idempotente alinhada à loja stackable.

## Teste rápido
1. Extrair Expedição com mats → Town → Reorin → Consumable Craft  
2. Craft HP ×10 e Soulshot (D) ×100  
3. Confirmar stacks na bolsa (`HP Potion`, `Soulshot (D)`)
