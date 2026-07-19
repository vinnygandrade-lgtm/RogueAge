/**
 * Combat stat ranking — push snapshot after cloud save; fetch ladder by metric.
 * Server sorts; client supplies totals (honest bridge — §12.7).
 */
import type {
  CombatStatMetric,
  CombatStatRankingResult,
  CombatStatRankingRow,
  CombatStatSnapshotPayload,
} from '../types/game';

const UPSERT_THROTTLE_MS = 30_000;
const LIST_CACHE_MS = 45_000;

const METRICS: CombatStatMetric[] = [
  'p_atk',
  'm_atk',
  'p_def',
  'm_def',
  'crit_rate',
  'max_hp',
  'atk_speed',
  'level',
];

let lastUpsertAt = 0;
let upsertInFlight = false;

const listCache = new Map<string, { at: number; result: CombatStatRankingResult }>();

function isCloudReady(): boolean {
  return !!(
    typeof window.SUPABASE_CONFIG !== 'undefined'
    && window.SUPABASE_CONFIG.enabled
    && window.SupabaseAPI
    && window.SupabaseAPI.client
    && typeof window.SupabaseAPI.getUser === 'function'
    && window.SupabaseAPI.getUser()
  );
}

export function getCombatStatMetrics(): CombatStatMetric[] {
  return METRICS.slice();
}

export function buildCombatStatSnapshotFromLocal(): CombatStatSnapshotPayload | null {
  const charName = typeof window.charName === 'string' ? window.charName.trim() : '';
  if (!charName) return null;

  if (typeof window.calcularStatusGlobais === 'function') {
    try {
      window.calcularStatusGlobais();
    } catch { /* noop */ }
  }

  const ps = (window.playerStats || {}) as Record<string, number | undefined>;
  return {
    charName,
    charClass: String(window.charClass || 'Fighter'),
    level: Math.floor(Number(window.nivel) || 1),
    pAtk: Math.floor(Number(ps.pAtk) || 0),
    mAtk: Math.floor(Number(ps.mAtk) || 0),
    pDef: Math.floor(Number(ps.pDef) || 0),
    mDef: Math.floor(Number(ps.mDef) || 0),
    critRate: Math.floor(Number(ps.critRate) || 0),
    maxHp: Math.floor(Number(ps.maxHp) || 0),
    atkSpeed: Math.floor(Number(ps.atkSpeed) || 0),
  };
}

/** Push local combat totals to the ladder (throttled). */
export async function pushCombatStatSnapshot(opts?: { force?: boolean }): Promise<boolean> {
  if (!isCloudReady()) return false;
  if (typeof window.SupabaseAPI.upsertCombatStatSnapshot !== 'function') return false;

  const force = !!(opts && opts.force);
  const now = Date.now();
  if (!force && now - lastUpsertAt < UPSERT_THROTTLE_MS) return false;
  if (upsertInFlight) return false;

  const payload = buildCombatStatSnapshotFromLocal();
  if (!payload) return false;

  upsertInFlight = true;
  try {
    const res = await window.SupabaseAPI.upsertCombatStatSnapshot(payload);
    if (res && res.success !== false) {
      lastUpsertAt = Date.now();
      listCache.clear();
      return true;
    }
    return false;
  } finally {
    upsertInFlight = false;
  }
}

export async function fetchCombatStatRanking(
  metric: CombatStatMetric,
  limit = 50,
  opts?: { force?: boolean },
): Promise<CombatStatRankingResult | null> {
  if (!isCloudReady()) {
    return { success: false, error: 'offline' };
  }
  if (typeof window.SupabaseAPI.getCombatStatRanking !== 'function') {
    return { success: false, error: 'unavailable' };
  }

  const key = metric + ':' + limit;
  const cached = listCache.get(key);
  if (!opts?.force && cached && Date.now() - cached.at < LIST_CACHE_MS) {
    return cached.result;
  }

  const raw = await window.SupabaseAPI.getCombatStatRanking(metric, limit);
  if (!raw) return { success: false, error: 'fetch_failed' };

  const result: CombatStatRankingResult = {
    success: !!raw.success,
    metric: raw.metric || metric,
    rows: Array.isArray(raw.rows) ? (raw.rows as CombatStatRankingRow[]) : [],
    error: raw.error,
  };
  if (result.success) {
    listCache.set(key, { at: Date.now(), result });
  }
  return result;
}

window.pushCombatStatSnapshot = pushCombatStatSnapshot;
window.fetchCombatStatRanking = fetchCombatStatRanking;
window.getCombatStatMetrics = getCombatStatMetrics;
window.buildCombatStatSnapshotFromLocal = buildCombatStatSnapshotFromLocal;

export {};
