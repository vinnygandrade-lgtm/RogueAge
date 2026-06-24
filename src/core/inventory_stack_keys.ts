/**
 * Chaves canónicas de stacks na bolsa (id vs nome do catálogo).
 * Loja/enchant usam `nome`; loot/raid usam `id` — unificar em `nome` quando existir.
 */
import type { InventarioStack } from '../types/game';

type StackCatalogRow = { id?: string; nome?: string; img?: string; tipo?: string };

function stackCatalogs(): StackCatalogRow[][] {
  const out: StackCatalogRow[][] = [];
  if (Array.isArray(window.catalogoMateriais)) out.push(window.catalogoMateriais as StackCatalogRow[]);
  if (Array.isArray(window.catalogoConsumiveis)) out.push(window.catalogoConsumiveis as StackCatalogRow[]);
  if (Array.isArray(window.catalogoScrolls)) out.push(window.catalogoScrolls as StackCatalogRow[]);
  return out;
}

function findStackCatalogEntry(raw: string | null | undefined): StackCatalogRow | null {
  const key = String(raw || '').trim();
  if (!key) return null;
  for (const cat of stackCatalogs()) {
    const byId = cat.find((x) => x.id === key);
    if (byId) return byId;
    const byNome = cat.find((x) => x.nome === key);
    if (byNome) return byNome;
  }
  return null;
}

/** Chave persistida na bolsa — preferir `nome` do catálogo (paridade loja/enchant). */
function resolveInventarioStackKey(raw: string | null | undefined): string {
  const key = String(raw || '').trim();
  if (!key) return '';
  const entry = findStackCatalogEntry(key);
  if (entry?.nome) return entry.nome;
  if (entry?.id) return entry.id;
  return key;
}

function stackAliasKeys(raw: string | null | undefined): string[] {
  const key = String(raw || '').trim();
  if (!key) return [];
  const entry = findStackCatalogEntry(key);
  const aliases = new Set<string>([key]);
  if (entry?.id) aliases.add(entry.id);
  if (entry?.nome) aliases.add(entry.nome);
  const canonical = resolveInventarioStackKey(key);
  if (canonical) aliases.add(canonical);
  return [...aliases];
}

function collectStackQtyFromAliases(inv: InventarioStack, raw: string): number {
  let total = 0;
  stackAliasKeys(raw).forEach((alias) => {
    const q = Number(inv[alias]) || 0;
    if (q > 0) total += q;
  });
  return total;
}

function removeStackAliasKeys(inv: InventarioStack, raw: string, except?: string): void {
  stackAliasKeys(raw).forEach((alias) => {
    if (except && alias === except) return;
    delete inv[alias];
  });
}

/** Funde stacks duplicados (id + nome) numa única chave canónica. */
function normalizarInventarioStackKeys(inv: InventarioStack | null | undefined): void {
  if (!inv || typeof inv !== 'object' || Array.isArray(inv)) return;
  const merged: Record<string, number> = {};
  Object.keys(inv).forEach((key) => {
    const qtd = Number(inv[key]) || 0;
    if (qtd <= 0) return;
    const canonical = resolveInventarioStackKey(key);
    if (!canonical) return;
    merged[canonical] = (merged[canonical] || 0) + qtd;
  });
  Object.keys(inv).forEach((key) => {
    delete inv[key];
  });
  Object.keys(merged).forEach((key) => {
    if (merged[key] > 0) inv[key] = merged[key];
  });
}

function remapInventarioRecentStackAliases(): void {
  if (!Array.isArray(window.inventarioRecentLog)) return;
  window.inventarioRecentLog.forEach((row) => {
    if (!row || row.k !== 's' || !row.id) return;
    row.id = resolveInventarioStackKey(row.id);
  });
}

window.InventoryStackKeys = {
  findStackCatalogEntry,
  resolveInventarioStackKey,
  stackAliasKeys,
  collectStackQtyFromAliases,
  removeStackAliasKeys,
  normalizarInventarioStackKeys,
  remapInventarioRecentStackAliases,
};

export {
  findStackCatalogEntry,
  resolveInventarioStackKey,
  normalizarInventarioStackKeys,
  remapInventarioRecentStackAliases,
};
