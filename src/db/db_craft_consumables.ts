/**
 * Consumable craft recipes (potions + soul/spirit shots).
 * Stack outputs use inventory `nome` keys (same as shop). Equipment recipes stay in db_items special.
 * Cloud: client-authoritative for now (rec_cons_*); debt → RPC like craft_item_secure (§12.7).
 */

import type { CraftRecipe } from '../types/game';

function pot(
  id: string,
  nome: string,
  img: string,
  desc: string,
  outName: string,
  qty: number,
  ings: CraftRecipe['ingredientes'],
): CraftRecipe {
  return {
    idReceita: id,
    nome,
    img,
    desc,
    taxaSucesso: 100,
    itemResultado: { tipoBase: 'material', idBase: outName, gerado: qty },
    ingredientes: ings,
  };
}

function shot(
  id: string,
  nome: string,
  img: string,
  desc: string,
  outName: string,
  qty: number,
  ings: CraftRecipe['ingredientes'],
): CraftRecipe {
  return pot(id, nome, img, desc, outName, qty, ings);
}

/**
 * Costs scale with zone grade; mats are expedition drops (Skin/Bone/Coal/Charcoal/Iron Ore).
 * Adena fee eased with shop relief (~25–35% of shop batch); mats still the main sink.
 */
export const CATALOGO_RECEITAS_CONSUMIVEIS: CraftRecipe[] = [
  // —— Potions ——
  pot(
    'rec_cons_hp_x10',
    'HP Potion ×10',
    'assets/itens/pot_hp.png',
    'Each bottle heals 5% max HP/sec for 15s. Brew from hide and bone — cheaper than the Grocer when you farm mats.',
    'HP Potion',
    10,
    [
      { id: 'Animal Skin', qtd: 14 },
      { id: 'Animal Bone', qtd: 8 },
      { id: 'Adena', qtd: 600 },
    ],
  ),
  pot(
    'rec_cons_hp_x50',
    'HP Potion ×50',
    'assets/itens/pot_hp.png',
    'Bulk brew for long expeditions. Each bottle: 5% max HP/sec for 15s.',
    'HP Potion',
    50,
    [
      { id: 'Animal Skin', qtd: 60 },
      { id: 'Animal Bone', qtd: 35 },
      { id: 'Adena', qtd: 2600 },
    ],
  ),
  pot(
    'rec_cons_mp_x10',
    'Mana Potion ×10',
    'assets/itens/pot_mp.png',
    'Each bottle restores 5% max MP/sec for 15s. Distill from coal and charcoal.',
    'Mana Potion',
    10,
    [
      { id: 'Coal', qtd: 12 },
      { id: 'Charcoal', qtd: 8 },
      { id: 'Adena', qtd: 600 },
    ],
  ),
  pot(
    'rec_cons_mp_x50',
    'Mana Potion ×50',
    'assets/itens/pot_mp.png',
    'Bulk mana draughts. Each bottle: 5% max MP/sec for 15s.',
    'Mana Potion',
    50,
    [
      { id: 'Coal', qtd: 52 },
      { id: 'Charcoal', qtd: 35 },
      { id: 'Adena', qtd: 2600 },
    ],
  ),

  // —— Soulshot (fighters) ×100 ——
  shot(
    'rec_cons_shot_ng_x100',
    'Soulshot (NG) ×100',
    'assets/itens/soulshot_ng.png',
    'Pack No-Grade soulshots from basic ore and coal.',
    'Soulshot (NG)',
    100,
    [
      { id: 'Coal', qtd: 18 },
      { id: 'Iron Ore', qtd: 10 },
      { id: 'Adena', qtd: 8000 },
    ],
  ),
  shot(
    'rec_cons_shot_d_x100',
    'Soulshot (D) ×100',
    'assets/itens/soulshot_d.png',
    'D-grade soulshots — Ruins mats plus forge fee.',
    'Soulshot (D)',
    100,
    [
      { id: 'Coal', qtd: 28 },
      { id: 'Iron Ore', qtd: 18 },
      { id: 'Animal Bone', qtd: 14 },
      { id: 'Adena', qtd: 28000 },
    ],
  ),
  shot(
    'rec_cons_shot_c_x100',
    'Soulshot (C) ×100',
    'assets/itens/soulshot_c.png',
    'C-grade soulshots. Needs a serious bag of Death Pass mats.',
    'Soulshot (C)',
    100,
    [
      { id: 'Coal', qtd: 42 },
      { id: 'Iron Ore', qtd: 30 },
      { id: 'Charcoal', qtd: 22 },
      { id: 'Adena', qtd: 85000 },
    ],
  ),
  shot(
    'rec_cons_shot_b_x100',
    'Soulshot (B) ×100',
    'assets/itens/soulshot_b.png',
    'B-grade soulshots for Dragon Valley hunters.',
    'Soulshot (B)',
    100,
    [
      { id: 'Coal', qtd: 58 },
      { id: 'Iron Ore', qtd: 42 },
      { id: 'Charcoal', qtd: 36 },
      { id: 'Animal Skin', qtd: 28 },
      { id: 'Adena', qtd: 250000 },
    ],
  ),
  shot(
    'rec_cons_shot_a_x100',
    'Soulshot (A) ×100',
    'assets/itens/soulshot_a.png',
    'A-grade soulshots — Tower-tier material sink.',
    'Soulshot (A)',
    100,
    [
      { id: 'Coal', qtd: 78 },
      { id: 'Iron Ore', qtd: 58 },
      { id: 'Charcoal', qtd: 52 },
      { id: 'Animal Bone', qtd: 40 },
      { id: 'Adena', qtd: 720000 },
    ],
  ),
  shot(
    'rec_cons_shot_s_x100',
    'Soulshot (S) ×100',
    'assets/itens/soulshot_s.png',
    'S-grade soulshots. Expensive forge — still under Grocer list price.',
    'Soulshot (S)',
    100,
    [
      { id: 'Coal', qtd: 110 },
      { id: 'Iron Ore', qtd: 85 },
      { id: 'Charcoal', qtd: 75 },
      { id: 'Animal Bone', qtd: 55 },
      { id: 'Animal Skin', qtd: 40 },
      { id: 'Adena', qtd: 2100000 },
    ],
  ),

  // —— Blessed Spiritshot (mages) ×100 ——
  shot(
    'rec_cons_bshot_ng_x100',
    'B. Spiritshot (NG) ×100',
    'assets/itens/spiritshot_ng.png',
    'No-Grade spiritshots for novice casters.',
    'B. Spiritshot (NG)',
    100,
    [
      { id: 'Charcoal', qtd: 18 },
      { id: 'Iron Ore', qtd: 10 },
      { id: 'Adena', qtd: 8000 },
    ],
  ),
  shot(
    'rec_cons_bshot_d_x100',
    'B. Spiritshot (D) ×100',
    'assets/itens/spiritshot_d.png',
    'D-grade spiritshots from charcoal-heavy mixes.',
    'B. Spiritshot (D)',
    100,
    [
      { id: 'Charcoal', qtd: 28 },
      { id: 'Iron Ore', qtd: 18 },
      { id: 'Animal Skin', qtd: 14 },
      { id: 'Adena', qtd: 28000 },
    ],
  ),
  shot(
    'rec_cons_bshot_c_x100',
    'B. Spiritshot (C) ×100',
    'assets/itens/spiritshot_c.png',
    'C-grade spiritshots for Death Pass mages.',
    'B. Spiritshot (C)',
    100,
    [
      { id: 'Charcoal', qtd: 42 },
      { id: 'Iron Ore', qtd: 30 },
      { id: 'Coal', qtd: 22 },
      { id: 'Adena', qtd: 85000 },
    ],
  ),
  shot(
    'rec_cons_bshot_b_x100',
    'B. Spiritshot (B) ×100',
    'assets/itens/spiritshot_b.png',
    'B-grade spiritshots — heavy charcoal and ore.',
    'B. Spiritshot (B)',
    100,
    [
      { id: 'Charcoal', qtd: 58 },
      { id: 'Iron Ore', qtd: 42 },
      { id: 'Coal', qtd: 36 },
      { id: 'Animal Bone', qtd: 28 },
      { id: 'Adena', qtd: 250000 },
    ],
  ),
  shot(
    'rec_cons_bshot_a_x100',
    'B. Spiritshot (A) ×100',
    'assets/itens/spiritshot_a.png',
    'A-grade spiritshots for Tower casters.',
    'B. Spiritshot (A)',
    100,
    [
      { id: 'Charcoal', qtd: 78 },
      { id: 'Iron Ore', qtd: 58 },
      { id: 'Coal', qtd: 52 },
      { id: 'Animal Skin', qtd: 40 },
      { id: 'Adena', qtd: 720000 },
    ],
  ),
  shot(
    'rec_cons_bshot_s_x100',
    'B. Spiritshot (S) ×100',
    'assets/itens/spiritshot_s.png',
    'S-grade spiritshots. Peak consumable forge.',
    'B. Spiritshot (S)',
    100,
    [
      { id: 'Charcoal', qtd: 110 },
      { id: 'Iron Ore', qtd: 85 },
      { id: 'Coal', qtd: 75 },
      { id: 'Animal Skin', qtd: 55 },
      { id: 'Animal Bone', qtd: 40 },
      { id: 'Adena', qtd: 2100000 },
    ],
  ),
];

export {};
