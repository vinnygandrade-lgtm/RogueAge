/**
 * Ordem de recência na bolsa + categorias para filtros.
 */
import type { InventarioBagFilter, InventarioRecentEntry } from '../types/game';

export type { InventarioBagFilter };

const LOG_CAP = 300;

function currencyKeys(): { adena: string; ancient: string } {
  const k = window.L2MINI_CURRENCY_BAG_KEYS;
  return {
    adena: k?.adena || 'Adena',
    ancient: k?.ancient || 'Ancient Coin',
  };
}

function isCurrencyStack(nome: string): boolean {
  const c = currencyKeys();
  return nome === c.adena || nome === c.ancient;
}

function ensureLog(): InventarioRecentEntry[] {
  if (!Array.isArray(window.inventarioRecentLog)) {
    window.inventarioRecentLog = [];
  }
  return window.inventarioRecentLog;
}

function capLog(log: InventarioRecentEntry[]): void {
  if (log.length > LOG_CAP) log.length = LOG_CAP;
}

function findCatalogStack(nome: string): { tipo?: string } | null {
  if (typeof window.InventoryStackKeys !== 'undefined' && window.InventoryStackKeys.findStackCatalogEntry) {
    const hit = window.InventoryStackKeys.findStackCatalogEntry(nome);
    if (hit) return hit;
  }
  type StackRow = { id?: string; nome?: string; tipo?: string };
  if (typeof window.catalogoMateriais !== 'undefined' && Array.isArray(window.catalogoMateriais)) {
    const m = (window.catalogoMateriais as StackRow[]).find((x) => x.id === nome || x.nome === nome);
    if (m) return m;
  }
  if (typeof window.catalogoConsumiveis !== 'undefined' && Array.isArray(window.catalogoConsumiveis)) {
    const c = (window.catalogoConsumiveis as StackRow[]).find((x) => x.id === nome || x.nome === nome);
    if (c) return c;
  }
  return null;
}

function getTs(k: 'e' | 's', id: string): number {
  const log = ensureLog();
  for (let i = 0; i < log.length; i++) {
    const row = log[i];
    if (row && row.k === k && row.id === id) return row.ts || 0;
  }
  return 0;
}

function touchEntry(k: 'e' | 's', id: string): void {
  if (!id) return;
  if (k === 's' && isCurrencyStack(id)) return;

  const log = ensureLog();
  const now = Date.now();
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i]?.k === k && log[i]?.id === id) log.splice(i, 1);
  }
  log.unshift({ k, id, ts: now });
  capLog(log);
}

function moveEquipToFront(uid: string): void {
  if (!uid || !Array.isArray(window.inventarioEquips)) return;
  const idx = window.inventarioEquips.findIndex((i) => i && i.uid === uid);
  if (idx <= 0) return;
  const item = window.inventarioEquips.splice(idx, 1)[0];
  if (item) window.inventarioEquips.unshift(item);
}

window.InventarioRecent = {
  isCurrencyStack,

  touchEquip(uid: string | null | undefined): void {
    if (!uid) return;
    touchEntry('e', uid);
    moveEquipToFront(uid);
  },

  touchStack(nome: string | null | undefined): void {
    if (!nome || isCurrencyStack(nome)) return;
    touchEntry('s', nome);
  },

  getTs,

  classifyStack(nome: string): 'currency' | 'material' | 'consumable' | 'recipe' | 'scroll' | 'other' {
    if (isCurrencyStack(nome)) return 'currency';
    const cat = findCatalogStack(nome);
    const tipo = String(cat?.tipo || '').toLowerCase();
    if (tipo === 'material') return 'material';
    if (tipo === 'recipe') return 'recipe';
    if (tipo === 'consumable' || tipo === 'consumivel') return 'consumable';
    const lower = nome.toLowerCase();
    if (lower.includes('recipe')) return 'recipe';
    if (lower.includes('potion') || lower.includes('shot') || lower.includes('scroll')) {
      if (lower.includes('scroll') && (lower.includes('enchant') || lower.includes('blessed'))) return 'scroll';
      if (lower.includes('scroll')) return 'scroll';
      return 'consumable';
    }
    if (lower.includes('crystal') || lower.includes('life stone') || lower.includes('gemstone')) return 'other';
    return 'other';
  },

  passesFilter(filter: InventarioBagFilter, kind: 'equip' | 'stack', stackName?: string): boolean {
    if (filter === 'all' || filter === 'recent') return true;
    if (filter === 'equipment') return kind === 'equip';
    if (kind === 'equip') return false;
    const nome = stackName || '';
    if (isCurrencyStack(nome)) return false;
    const cat = this.classifyStack(nome);
    if (filter === 'materials') return cat === 'material';
    if (filter === 'consumables') return cat === 'consumable';
    if (filter === 'recipes') return cat === 'recipe';
    if (filter === 'other') return cat === 'scroll' || cat === 'other';
    return true;
  },

  /** Moedas fixas no topo; depois equip + stacks intercalados por recência. */
  buildDisplayPlan(filter: InventarioBagFilter): Array<
    | { kind: 'currency'; name: string }
    | { kind: 'equip'; index: number; ts: number }
    | { kind: 'stack'; name: string; ts: number }
  > {
    const plan: Array<
      | { kind: 'currency'; name: string }
      | { kind: 'equip'; index: number; ts: number }
      | { kind: 'stack'; name: string; ts: number }
    > = [];

    const c = currencyKeys();
    if (filter === 'recent' || filter === 'all') {
      [c.adena, c.ancient].forEach((name) => {
        const qtd = window.inventario?.[name];
        if (qtd && qtd > 0) plan.push({ kind: 'currency', name });
      });
    }

    const merged: Array<
      | { kind: 'equip'; index: number; ts: number; sortName: string }
      | { kind: 'stack'; name: string; ts: number; sortName: string }
    > = [];

    if (Array.isArray(window.inventarioEquips)) {
      window.inventarioEquips.forEach((equip, index) => {
        if (!equip?.uid) return;
        if (!this.passesFilter(filter, 'equip')) return;
        const base = equip.base && typeof equip.base === 'object' ? equip.base : equip;
        const sortName = String((base as { nome?: string }).nome || equip.uid);
        merged.push({ kind: 'equip', index, ts: getTs('e', equip.uid), sortName });
      });
    }

    const inv = window.inventario || {};
    Object.keys(inv).forEach((nome) => {
      const qtd = inv[nome];
      if (!qtd || qtd <= 0) return;
      if (isCurrencyStack(nome)) return;
      if (!this.passesFilter(filter, 'stack', nome)) return;
      merged.push({ kind: 'stack', name: nome, ts: getTs('s', nome), sortName: nome });
    });

    merged.sort((a, b) => {
      if (b.ts !== a.ts) return b.ts - a.ts;
      return a.sortName.localeCompare(b.sortName);
    });

    merged.forEach((row) => {
      if (row.kind === 'equip') plan.push({ kind: 'equip', index: row.index, ts: row.ts });
      else plan.push({ kind: 'stack', name: row.name, ts: row.ts });
    });

    return plan;
  },

  /** Bootstrap do log a partir da ordem actual (saves antigos). */
  seedFromCurrentInventory(): void {
    const log = ensureLog();
    if (log.length > 0) return;

    const now = Date.now();
    let step = 0;
    if (Array.isArray(window.inventarioEquips)) {
      for (let i = window.inventarioEquips.length - 1; i >= 0; i--) {
        const eq = window.inventarioEquips[i];
        if (eq?.uid) {
          log.push({ k: 'e', id: eq.uid, ts: now - step });
          step++;
        }
      }
    }
    const inv = window.inventario || {};
    Object.keys(inv).forEach((nome) => {
      if (isCurrencyStack(nome)) return;
      if ((inv[nome] || 0) <= 0) return;
      log.push({ k: 's', id: nome, ts: now - step });
      step++;
    });
    capLog(log);
  },

  normalizeLogFromSave(raw: unknown): InventarioRecentEntry[] {
    if (!Array.isArray(raw)) return [];
    const out: InventarioRecentEntry[] = [];
    raw.forEach((row) => {
      if (!row || typeof row !== 'object') return;
      const k = (row as InventarioRecentEntry).k;
      const id = String((row as InventarioRecentEntry).id || '');
      const ts = Number((row as InventarioRecentEntry).ts);
      if ((k === 'e' || k === 's') && id && !Number.isNaN(ts)) {
        out.push({ k, id, ts });
      }
    });
    return out;
  },

  pruneMissing(): void {
    const log = ensureLog();
    const equipUids = new Set(
      (window.inventarioEquips || []).map((e) => e?.uid).filter(Boolean) as string[],
    );
    const inv = window.inventario || {};
    for (let i = log.length - 1; i >= 0; i--) {
      const row = log[i];
      if (!row) continue;
      if (row.k === 'e' && !equipUids.has(row.id)) log.splice(i, 1);
      else if (row.k === 's' && (!inv[row.id] || inv[row.id] <= 0)) log.splice(i, 1);
    }
  },
};

export {};
