/**
 * Curvas Adena / Ancient — loja NPC e loot (paridade js/economy_balance.js).
 */
const SHOP_LEVEL_COEFF = 0.018;
const SHOP_LEVEL_CAP = 2.35;
const LOOT_LEVEL_COEFF = 0.006;
const LOOT_LEVEL_MAX_BONUS = 0.52;

const ZONE_LOOT_BONUS: Record<string, number> = {
  'No-Grade': 0.12,
  D: 0.18,
  C: 0.24,
  B: 0.3,
  A: 0.36,
  S: 0.42,
};

function clampLevel(level: number): number {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(85, Math.floor(n)));
}

function shopLevelPriceMult(level: number): number {
  const lv = clampLevel(level);
  return Math.min(SHOP_LEVEL_CAP, 1 + Math.max(0, lv - 1) * SHOP_LEVEL_COEFF);
}

function effectiveShopUnitPrice(basePrice: number, level: number): number {
  const b = Math.max(0, Number(basePrice) || 0);
  if (b <= 0) return 0;
  return Math.max(1, Math.ceil(b * shopLevelPriceMult(level)));
}

function adenaLootMult(level: number, zonaId?: string | null): number {
  const lv = clampLevel(level);
  const z = zonaId && ZONE_LOOT_BONUS[zonaId] != null ? ZONE_LOOT_BONUS[zonaId] : 0.1;
  const fromLevel = Math.min(LOOT_LEVEL_MAX_BONUS, Math.max(0, lv - 1) * LOOT_LEVEL_COEFF);
  return 1 + fromLevel + z;
}

function grandMasterBuffPrice(level: number): number {
  const lv = clampLevel(level);
  const base = 500;
  const extra = Math.floor((lv - 1) * 14);
  return Math.min(8500, base + extra);
}

const MINT_ANCIENT_ADENA_COST = 5_000_000;
const MINT_ANCIENT_SUCCESS_PCT = 10;
const allowAncientCoinWorldDrops: boolean = false;

function isAncientCoinWorldDropEnabled(): boolean {
  return allowAncientCoinWorldDrops === true;
}

window.EconomyBalance = {
  shopLevelPriceMult,
  effectiveShopUnitPrice,
  adenaLootMult,
  grandMasterBuffPrice,
  MINT_ANCIENT_ADENA_COST,
  MINT_ANCIENT_SUCCESS_PCT,
  allowAncientCoinWorldDrops,
  isAncientCoinWorldDropEnabled,
};

export {};
