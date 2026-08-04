/**
 * Grand Master Blessing Build engine.
 * Client-authoritative Adena debit (same debt as legacy packs — §9 / §12.7).
 */

import {
  BLESSING_DURATION_MS,
  BLESSING_SLOT_COUNT,
  composeBlessingEffects,
  isBlessingId,
  type BlessingId,
  type ComposedBlessingEffects,
} from '../game/blessing_catalog';

export interface BlessingBuildState {
  ids: BlessingId[];
  endsAt: number;
}

function t(key: string, vars?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, vars) : key;
}

function normalizeIds(ids: unknown): BlessingId[] {
  if (!Array.isArray(ids)) return [];
  const out: BlessingId[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    if (!isBlessingId(raw) || seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
    if (out.length >= BLESSING_SLOT_COUNT) break;
  }
  return out;
}

export function normalizeBlessingBuild(raw: unknown): BlessingBuildState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as { ids?: unknown; endsAt?: unknown };
  const ids = normalizeIds(o.ids);
  const endsAt = Number(o.endsAt);
  if (ids.length === 0 || !Number.isFinite(endsAt) || endsAt <= 0) return null;
  return { ids, endsAt };
}

export function clearExpiredBlessings(): boolean {
  const cur = window.blessingBuild;
  if (!cur) return false;
  if (Date.now() < (Number(cur.endsAt) || 0)) return false;
  window.blessingBuild = null;
  return true;
}

export function getActiveBlessingBuild(): BlessingBuildState | null {
  clearExpiredBlessings();
  const cur = window.blessingBuild;
  if (!cur || !Array.isArray(cur.ids) || cur.ids.length === 0) return null;
  if (Date.now() >= (Number(cur.endsAt) || 0)) {
    window.blessingBuild = null;
    return null;
  }
  const ids = normalizeIds(cur.ids);
  if (ids.length === 0) return null;
  return { ids, endsAt: Number(cur.endsAt) || 0 };
}

export function getActiveBlessingEffects(): ComposedBlessingEffects {
  const active = getActiveBlessingBuild();
  if (!active) {
    return composeBlessingEffects([]);
  }
  return composeBlessingEffects(active.ids);
}

export function isBlessingBuildActive(): boolean {
  return !!getActiveBlessingBuild();
}

export function getBlessingBuildRemainingMs(): number {
  const active = getActiveBlessingBuild();
  if (!active) return 0;
  return Math.max(0, (Number(active.endsAt) || 0) - Date.now());
}

export type ApplyBlessingResult =
  | { ok: true; endsAt: number; ids: BlessingId[]; price: number }
  | { ok: false; error: 'need_three' | 'adena'; price?: number };

export function applyBlessingBuild(idsInput: unknown): ApplyBlessingResult {
  const ids = normalizeIds(idsInput);
  if (ids.length !== BLESSING_SLOT_COUNT) {
    return { ok: false, error: 'need_three' };
  }

  const EB = window.EconomyBalance;
  const level = typeof window.nivel === 'number' && window.nivel > 0 ? window.nivel : 1;
  const price =
    EB && typeof EB.grandMasterBlessingBuildPrice === 'function'
      ? EB.grandMasterBlessingBuildPrice(level)
      : typeof EB?.grandMasterBuffPrice === 'function'
        ? Math.floor(EB.grandMasterBuffPrice(level) * 1.4)
        : 700;

  if ((Number(window.adenas) || 0) < price) {
    return { ok: false, error: 'adena', price };
  }

  window.adenas = Math.max(0, (Number(window.adenas) || 0) - price);
  // Replace any legacy pack timers.
  window.tempoFimBuffGuerreiro = 0;
  window.tempoFimBuffMistico = 0;

  const endsAt = Date.now() + BLESSING_DURATION_MS;
  window.blessingBuild = { ids: ids.slice(0, BLESSING_SLOT_COUNT), endsAt };

  if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();

  return { ok: true, endsAt, ids, price };
}

export function clearBlessingBuild(): void {
  window.blessingBuild = null;
  window.tempoFimBuffGuerreiro = 0;
  window.tempoFimBuffMistico = 0;
}

window.BlessingEngine = {
  normalizeBlessingBuild,
  clearExpiredBlessings,
  getActiveBlessingBuild,
  getActiveBlessingEffects,
  isBlessingBuildActive,
  getBlessingBuildRemainingMs,
  applyBlessingBuild,
  clearBlessingBuild,
  SLOT_COUNT: BLESSING_SLOT_COUNT,
  DURATION_MS: BLESSING_DURATION_MS,
};

// Quiet unused helper for i18n tooling / future HUD labels.
void t;

export {};
