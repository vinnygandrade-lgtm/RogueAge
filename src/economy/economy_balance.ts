/**
 * Curvas Adena / Ancient — loja NPC e loot.
 * Shop inflation (2026): legacy catalog `preco` × shopCatalogInflationMult.
 * Meta NG: armadura + joias (neck+2ear+2ring) ≈ 500k Adena juntos — não só o set de armor.
 * Keep SQL npc_shop_buy_stackable in lockstep (CASE por item_id / bandas de stackables).
 */
import type { ZonalMobTuneEntry } from '../types/game';
const SHOP_LEVEL_COEFF = 0.018;
const SHOP_LEVEL_CAP = 2.35;
const LOOT_LEVEL_COEFF = 0.006;
const LOOT_LEVEL_MAX_BONUS = 0.52;

/** Níveis 1–20: curva mais rápida; a partir de 21 regras normais. */
const NOVICE_LEVEL_CAP = 20;
/** +65% XP no lvl 1 → +0% no lvl 20 (linear). */
const NOVICE_XP_GAIN_BONUS_MAX = 0.65;
/** Barra de lvl: ~32% menos XP no lvl 1 → ~2% menos no lvl 19. */
const NOVICE_XP_REQ_MULT_MIN = 0.68;
/** Adena extra no início (compra de poções / 1ª arma). */
const NOVICE_ADENA_LOOT_BONUS_MAX = 0.28;

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

/** Shop inflation helpers — keep in sync with npc_shop_buy_stackable SQL. */
type ShopInflationOpts = {
  itemId?: string | null;
  grade?: string | null;
};

/**
 * Inflate legacy catalog Adena prices.
 * Ancient Coin SKUs keep face value.
 *
 * Targets @ level 1 (approx):
 * - NG armor 800 → ~300k + full NG jewels → ~200k = ~500k kit
 * - D armor 25k → ~2.1M · C 120k → ~5.8M · B 450k → ~16M · A 1.5M → ~40M · S 5M → ~100M
 * - Soulshot NG 6 → ~288 · D 20 → ~960 (eased vs prior ×80)
 * - Enchant Weapon NG 1120 → ~65k · Armor NG 335 → ~19k
 * - HP/MP potion 58 → ~1.9k
 */
function shopCatalogInflationMult(
  basePrice: number,
  currency?: string | null,
  opts?: ShopInflationOpts | null,
): number {
  const cur = String(currency || 'adena').toLowerCase();
  if (cur === 'ancient' || cur === 'ac') return 1;

  const id = String(opts?.itemId || '').trim().toLowerCase();
  const b = Math.max(0, Number(basePrice) || 0);
  if (b <= 0) return 1;

  // Soulshots / Blessed Spiritshots — eased sink (still meaningful)
  if (id.startsWith('shot_') || id.startsWith('bshot_')) return 48;

  // Potions
  if (id.startsWith('pot_')) return 32;

  // Adena enchant scrolls (blessed stay Ancient / face value)
  if (/^sc_[wa]_/.test(id)) {
    if (id.endsWith('_ng')) return 58;
    if (id.endsWith('_d')) return 48;
    if (id.endsWith('_c')) return 36;
    if (id.endsWith('_b')) return 28;
    if (id.endsWith('_a')) return 20;
    if (id.endsWith('_s')) return 16;
    return 36;
  }

  // Jewels priced so NG full set (neck+2ear+2ring) ≈ 200k with armor ≈ 300k → ~500k kit
  if (id.startsWith('j_ng_')) return 200;
  if (id.startsWith('j_d_')) return 120;
  if (id.startsWith('j_c_')) return 70;
  if (id.startsWith('j_b_')) return 48;
  if (id.startsWith('j_a_')) return 32;
  if (id.startsWith('j_s_') || id.startsWith('j_epic_') || id.startsWith('j_vesper_')) return 22;

  // Equipment + materials by legacy catalog band
  if (b <= 100) return 40; // cheap mats / trainee weapons
  if (b <= 1000) return 375; // NG armor 800 → 300k; NG weapons ~187–232k
  if (b <= 5000) return 160; // D weapons
  if (b <= 30000) return 85; // D armor sets → ~2.1M
  if (b <= 150000) return 48; // C gear
  if (b <= 500000) return 36; // B gear
  if (b <= 2000000) return 27; // A gear
  return 20; // S / recipes
}

function effectiveShopUnitPrice(
  basePrice: number,
  level: number,
  currency?: string | null,
  opts?: ShopInflationOpts | string | null,
): number {
  const b = Math.max(0, Number(basePrice) || 0);
  if (b <= 0) return 0;
  // Back-compat: 4th arg used to be currency-only string in some call sites
  let inflationOpts: ShopInflationOpts | null = null;
  let cur = currency;
  if (opts != null && typeof opts === 'string') {
    // legacy mistaken signature — ignore
  } else if (opts && typeof opts === 'object') {
    inflationOpts = opts;
  }
  const inflated = b * shopCatalogInflationMult(b, cur, inflationOpts);
  return Math.max(1, Math.ceil(inflated * shopLevelPriceMult(level)));
}

function noviceXpGainMult(level: number): number {
  const lv = clampLevel(level);
  if (lv > NOVICE_LEVEL_CAP) return 1;
  if (NOVICE_LEVEL_CAP <= 1) return 1 + NOVICE_XP_GAIN_BONUS_MAX;
  const t = (NOVICE_LEVEL_CAP - lv) / (NOVICE_LEVEL_CAP - 1);
  return 1 + NOVICE_XP_GAIN_BONUS_MAX * t;
}

function noviceXpRequiredMult(level: number): number {
  const lv = clampLevel(level);
  if (lv >= NOVICE_LEVEL_CAP) return 1;
  if (NOVICE_LEVEL_CAP <= 1) return NOVICE_XP_REQ_MULT_MIN;
  const t = (lv - 1) / (NOVICE_LEVEL_CAP - 1);
  return NOVICE_XP_REQ_MULT_MIN + (1 - NOVICE_XP_REQ_MULT_MIN) * t;
}

function noviceAdenaLootBonus(level: number): number {
  const lv = clampLevel(level);
  if (lv > NOVICE_LEVEL_CAP) return 0;
  if (NOVICE_LEVEL_CAP <= 1) return NOVICE_ADENA_LOOT_BONUS_MAX;
  const t = (NOVICE_LEVEL_CAP - lv) / (NOVICE_LEVEL_CAP - 1);
  return NOVICE_ADENA_LOOT_BONUS_MAX * t;
}

function scaleNoviceXpGain(baseXp: number, level: number): number {
  const base = Math.max(0, Math.floor(Number(baseXp) || 0));
  if (base <= 0) return 0;
  return Math.max(1, Math.floor(base * noviceXpGainMult(level)));
}

function scaleNoviceXpRequired(baseRequired: number, level: number): number {
  const base = Math.max(1, Math.floor(Number(baseRequired) || 1));
  return Math.max(1, Math.floor(base * noviceXpRequiredMult(level)));
}

function noviceProgressT(level: number): number {
  const lv = clampLevel(level);
  if (lv > NOVICE_LEVEL_CAP || NOVICE_LEVEL_CAP <= 1) return 0;
  return (NOVICE_LEVEL_CAP - lv) / (NOVICE_LEVEL_CAP - 1);
}

/** Dano que o jogador recebe — mais margem para magos frágeis no início. */
function noviceIncomingDamageMult(level: number, zoneId?: string | null, isChampion?: boolean): number {
  const lv = clampLevel(level);
  if (lv > NOVICE_LEVEL_CAP) return 1;
  const zone = zoneId || 'No-Grade';
  if (zone !== 'No-Grade' && zone !== 'D') return 1;

  let mult = 0.62 + (lv - 1) * (0.38 / (NOVICE_LEVEL_CAP - 1));
  if (zone === 'D') mult = 0.78 + (lv - 1) * (0.22 / (NOVICE_LEVEL_CAP - 1));

  if (isChampion) {
    const champEase = 0.68 + (lv - 1) * (0.32 / (NOVICE_LEVEL_CAP - 1));
    mult *= champEase;
  }
  return mult;
}

/** Overlay de tuning de mobs para novatos (No-Grade principalmente). */
function resolveNoviceMobTune(
  baseTune: ZonalMobTuneEntry,
  level: number,
  zoneId?: string | null,
): ZonalMobTuneEntry {
  const lv = clampLevel(level);
  const zone = zoneId || 'No-Grade';
  if (lv > NOVICE_LEVEL_CAP || zone !== 'No-Grade') return baseTune;

  const t = noviceProgressT(lv);
  const atkEase = 0.68 + (1 - 0.68) * (1 - t);
  const hpEase = 0.88 + (1 - 0.88) * (1 - t);

  const baseChampChance = typeof baseTune.championChance === 'number' ? baseTune.championChance : 0.05;
  const championChance = baseChampChance;

  const baseChampHp = typeof baseTune.championHpMult === 'number' ? baseTune.championHpMult : 10;
  const champStatEase = 0.38 + (1 - 0.38) * (1 - t);
  const championHpMult = 1 + (baseChampHp - 1) * champStatEase;

  const baseChampAtk = typeof baseTune.championAtkMult === 'number' ? baseTune.championAtkMult : 1.5;
  const championAtkMult = 1 + (baseChampAtk - 1) * (0.45 + (1 - 0.45) * (1 - t));

  const packAtkMult = typeof baseTune.packAtkMult === 'number'
    ? Math.min(baseTune.packAtkMult, 0.78 + (1 - 0.78) * (1 - t))
    : undefined;

  return {
    ...baseTune,
    hp: baseTune.hp * hpEase,
    atk: baseTune.atk * atkEase,
    championChance,
    championHpMult,
    championAtkMult,
    ...(packAtkMult != null ? { packAtkMult } : {}),
  };
}

function adenaLootMult(level: number, zonaId?: string | null): number {
  const lv = clampLevel(level);
  const z = zonaId && ZONE_LOOT_BONUS[zonaId] != null ? ZONE_LOOT_BONUS[zonaId] : 0.1;
  const fromLevel = Math.min(LOOT_LEVEL_MAX_BONUS, Math.max(0, lv - 1) * LOOT_LEVEL_COEFF);
  let mult = 1 + fromLevel + z;
  const novice = noviceAdenaLootBonus(lv);
  if (novice > 0) mult *= 1 + novice;
  return mult;
}

function grandMasterBuffPrice(level: number): number {
  const lv = clampLevel(level);
  const base = 28000;
  const extra = Math.floor((lv - 1) * 420);
  return Math.min(220000, base + extra);
}

/** Blessing Build (3 slots, 2h) — priced as a serious town spend vs 500k NG set. */
function grandMasterBlessingBuildPrice(level: number): number {
  const lv = clampLevel(level);
  const base = 48000;
  const extra = Math.floor((lv - 1) * 620);
  return Math.min(320000, base + extra);
}

const MINT_ANCIENT_ADENA_COST = 5_000_000;
const MINT_ANCIENT_SUCCESS_PCT = 10;
const allowAncientCoinWorldDrops: boolean = false;

function isAncientCoinWorldDropEnabled(): boolean {
  return allowAncientCoinWorldDrops === true;
}

window.EconomyBalance = {
  NOVICE_LEVEL_CAP,
  shopLevelPriceMult,
  shopCatalogInflationMult,
  effectiveShopUnitPrice,
  adenaLootMult,
  noviceXpGainMult,
  noviceXpRequiredMult,
  scaleNoviceXpGain,
  scaleNoviceXpRequired,
  noviceIncomingDamageMult,
  resolveNoviceMobTune,
  grandMasterBuffPrice,
  grandMasterBlessingBuildPrice,
  MINT_ANCIENT_ADENA_COST,
  MINT_ANCIENT_SUCCESS_PCT,
  allowAncientCoinWorldDrops,
  isAncientCoinWorldDropEnabled,
};

export {};
