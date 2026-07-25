/**
 * Equip Harmony — full set min-enchant % bonus to combat stats.
 * Complete set = weapon + armor + neck + 2 ears + 2 rings (all filled).
 * Bonus % = lowest enchant among those pieces (expedition run enchant included when active).
 */
import type { EquipHarmonyResult, EquipInstance } from '../types/game';

export type { EquipHarmonyResult };

type EnchantSlot = 'weapon' | 'armor' | 'neck' | 'ear1' | 'ear2' | 'ring1' | 'ring2';

const HARMONY_SLOTS: EnchantSlot[] = [
  'weapon',
  'armor',
  'neck',
  'ear1',
  'ear2',
  'ring1',
  'ring2',
];

function expeditionEnchantBonus(slot: EnchantSlot): number {
  try {
    const eng = window.ExpeditionEngine;
    const effectsOn =
      eng && typeof (eng as { isRunEffectsActive?: () => boolean }).isRunEffectsActive === 'function'
        ? !!(eng as { isRunEffectsActive: () => boolean }).isRunEffectsActive()
        : !!(eng?.state?.active && !(eng.state as { suspended?: boolean }).suspended);
    if (effectsOn && typeof eng.getRunEnchantBonus === 'function') {
      return Math.max(0, Number(eng.getRunEnchantBonus(slot)) || 0);
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function parseEnchant(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function jewelEnchant(item: EquipInstance | null | undefined, slot: EnchantSlot): number | null {
  if (!item) return null;
  const raw = item.enchant !== undefined && item.enchant !== null ? item.enchant : item.enchantJewel;
  return Math.min(25, parseEnchant(raw) + expeditionEnchantBonus(slot));
}

function slotEnchant(slot: EnchantSlot): number | null {
  const w = typeof window !== 'undefined' ? window : ({} as Window);
  if (slot === 'weapon') {
    if (!w.armaEquipadaBase) return null;
    return Math.min(
      25,
      parseEnchant(w.armaEquipadaBase.enchant) + expeditionEnchantBonus('weapon'),
    );
  }
  if (slot === 'armor') {
    if (!w.armaduraEquipada) return null;
    return Math.min(
      25,
      parseEnchant(w.armaduraEquipada.enchant) + expeditionEnchantBonus('armor'),
    );
  }
  if (slot === 'neck') return jewelEnchant(w.colarEquipado as EquipInstance | null, 'neck');
  if (slot === 'ear1') return jewelEnchant(w.brincoEquipado1 as EquipInstance | null, 'ear1');
  if (slot === 'ear2') return jewelEnchant(w.brincoEquipado2 as EquipInstance | null, 'ear2');
  if (slot === 'ring1') return jewelEnchant(w.anelEquipado1 as EquipInstance | null, 'ring1');
  return jewelEnchant(w.anelEquipado2 as EquipInstance | null, 'ring2');
}

/** Resolve current Harmony from equipped gear (window slots). */
export function resolveEquipHarmony(): EquipHarmonyResult {
  const pieces = HARMONY_SLOTS.map((slot) => ({
    slot,
    enchant: slotEnchant(slot),
  }));
  const missingSlots = pieces.filter((p) => p.enchant === null).map((p) => p.slot);
  const complete = missingSlots.length === 0;

  if (!complete) {
    return {
      complete: false,
      level: 0,
      pct: 0,
      mult: 1,
      active: false,
      missingSlots,
      pieces,
    };
  }

  const level = Math.min(...pieces.map((p) => p.enchant as number));
  const pct = level >= 1 ? level : 0;
  return {
    complete: true,
    level,
    pct,
    mult: 1 + pct / 100,
    active: pct > 0,
    missingSlots: [],
    pieces,
  };
}

window.resolveEquipHarmony = resolveEquipHarmony;
