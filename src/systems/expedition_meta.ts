/**
 * Forest Expedition — between-run ledger (personal bests & tallies).
 * Persists on CharacterSave.expeditionMeta (not cleared on extract).
 */

import type { ExpeditionMetaSave, ExpeditionZoneMeta } from '../types/game';

function emptyZoneMeta(): ExpeditionZoneMeta {
  return {
    bestJourney: 0,
    extracts: 0,
    deaths: 0,
    runsStarted: 0,
    bestExtractAdena: 0,
    lastOutcome: null,
    lastJourney: 0,
    lastAdenaKept: 0,
    lastAt: 0,
  };
}

function emptyMeta(): ExpeditionMetaSave {
  return {
    v: 1,
    totalExtracts: 0,
    totalDeaths: 0,
    totalRunsStarted: 0,
    bestJourneyEver: 0,
    bestExtractAdenaEver: 0,
    byZone: {},
  };
}

let meta: ExpeditionMetaSave = emptyMeta();

function t(key: string, fallback: string, params?: Record<string, string | number>): string {
  if (typeof window.t === 'function') {
    const s = window.t(key, params);
    if (s && s !== key) return s;
  }
  let out = fallback;
  if (params) {
    Object.keys(params).forEach((k) => {
      out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
    });
  }
  return out;
}

function formatAdena(n: number): string {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  try {
    return v.toLocaleString();
  } catch {
    return String(v);
  }
}

function ensureZone(zoneId: string): ExpeditionZoneMeta {
  const id = String(zoneId || 'No-Grade');
  if (!meta.byZone[id]) meta.byZone[id] = emptyZoneMeta();
  return meta.byZone[id];
}

function normalizeMeta(raw: unknown): ExpeditionMetaSave {
  const base = emptyMeta();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ExpeditionMetaSave>;
  base.totalExtracts = Math.max(0, Math.floor(Number(r.totalExtracts) || 0));
  base.totalDeaths = Math.max(0, Math.floor(Number(r.totalDeaths) || 0));
  base.totalRunsStarted = Math.max(0, Math.floor(Number(r.totalRunsStarted) || 0));
  base.bestJourneyEver = Math.max(0, Math.floor(Number(r.bestJourneyEver) || 0));
  base.bestExtractAdenaEver = Math.max(0, Math.floor(Number(r.bestExtractAdenaEver) || 0));
  const by = r.byZone && typeof r.byZone === 'object' ? r.byZone : {};
  Object.keys(by).forEach((zid) => {
    const z = by[zid] as Partial<ExpeditionZoneMeta> | undefined;
    if (!z || typeof z !== 'object') return;
    base.byZone[zid] = {
      bestJourney: Math.max(0, Math.floor(Number(z.bestJourney) || 0)),
      extracts: Math.max(0, Math.floor(Number(z.extracts) || 0)),
      deaths: Math.max(0, Math.floor(Number(z.deaths) || 0)),
      runsStarted: Math.max(0, Math.floor(Number(z.runsStarted) || 0)),
      bestExtractAdena: Math.max(0, Math.floor(Number(z.bestExtractAdena) || 0)),
      lastOutcome: z.lastOutcome === 'extract' || z.lastOutcome === 'death' ? z.lastOutcome : null,
      lastJourney: Math.max(0, Math.floor(Number(z.lastJourney) || 0)),
      lastAdenaKept: Math.max(0, Math.floor(Number(z.lastAdenaKept) || 0)),
      lastAt: Math.max(0, Math.floor(Number(z.lastAt) || 0)),
    };
  });
  return base;
}

export const ExpeditionMeta = {
  getSavePayload(): ExpeditionMetaSave {
    return {
      v: 1,
      totalExtracts: meta.totalExtracts,
      totalDeaths: meta.totalDeaths,
      totalRunsStarted: meta.totalRunsStarted,
      bestJourneyEver: meta.bestJourneyEver,
      bestExtractAdenaEver: meta.bestExtractAdenaEver,
      byZone: { ...Object.fromEntries(Object.entries(meta.byZone).map(([k, z]) => [k, { ...z }])) },
    };
  },

  applyFromSave(raw: unknown): void {
    meta = normalizeMeta(raw);
  },

  resetLocal(): void {
    meta = emptyMeta();
  },

  getZone(zoneId: string): ExpeditionZoneMeta {
    return { ...ensureZone(zoneId) };
  },

  getLifetime(): Omit<ExpeditionMetaSave, 'byZone' | 'v'> {
    return {
      totalExtracts: meta.totalExtracts,
      totalDeaths: meta.totalDeaths,
      totalRunsStarted: meta.totalRunsStarted,
      bestJourneyEver: meta.bestJourneyEver,
      bestExtractAdenaEver: meta.bestExtractAdenaEver,
    };
  },

  recordRunStarted(zoneId: string): void {
    const z = ensureZone(zoneId);
    z.runsStarted += 1;
    meta.totalRunsStarted += 1;
  },

  /**
   * @returns true if this run set a new best journey for the zone
   */
  recordOutcome(opts: {
    zoneId: string;
    journey: number;
    adenaKept: number;
    outcome: 'extract' | 'death';
  }): { newBestJourney: boolean; newBestAdena: boolean } {
    const z = ensureZone(opts.zoneId);
    const journey = Math.max(0, Math.floor(Number(opts.journey) || 0));
    const adena = Math.max(0, Math.floor(Number(opts.adenaKept) || 0));
    const prevBestJ = z.bestJourney;
    const prevBestA = z.bestExtractAdena;

    if (journey > z.bestJourney) z.bestJourney = journey;
    if (journey > meta.bestJourneyEver) meta.bestJourneyEver = journey;

    if (opts.outcome === 'extract') {
      z.extracts += 1;
      meta.totalExtracts += 1;
      if (adena > z.bestExtractAdena) z.bestExtractAdena = adena;
      if (adena > meta.bestExtractAdenaEver) meta.bestExtractAdenaEver = adena;
    } else {
      z.deaths += 1;
      meta.totalDeaths += 1;
    }

    z.lastOutcome = opts.outcome;
    z.lastJourney = journey;
    z.lastAdenaKept = adena;
    z.lastAt = Date.now();

    return {
      newBestJourney: journey > prevBestJ && journey > 0,
      newBestAdena: opts.outcome === 'extract' && adena > prevBestA && adena > 0,
    };
  },

  /** Paint / refresh the trailhead ledger card for the current hunt zone. */
  renderHubLedger(zoneId: string): void {
    const root = document.getElementById('expedition-hub-ledger');
    if (!root) return;

    const z = ensureZone(zoneId);
    const hasHistory = z.runsStarted > 0 || z.extracts > 0 || z.deaths > 0 || z.bestJourney > 0;
    root.hidden = !hasHistory;
    root.setAttribute('aria-hidden', hasHistory ? 'false' : 'true');
    if (!hasHistory) return;

    const life = this.getLifetime();
    const pbEl = document.getElementById('expedition-ledger-pb');
    const extractsEl = document.getElementById('expedition-ledger-extracts');
    const deathsEl = document.getElementById('expedition-ledger-deaths');
    const bagEl = document.getElementById('expedition-ledger-bag');
    const lastEl = document.getElementById('expedition-ledger-last');
    const lifeEl = document.getElementById('expedition-ledger-life');

    if (pbEl) {
      pbEl.textContent = z.bestJourney > 0 ? String(z.bestJourney) : '—';
      const isFreshPb = z.lastJourney > 0 && z.lastJourney === z.bestJourney && z.lastAt > 0
        && (Date.now() - z.lastAt) < 1000 * 60 * 60 * 12;
      pbEl.parentElement?.classList.toggle('expedition-hub-ledger__stat--pb-fresh', !!isFreshPb);
    }
    if (extractsEl) extractsEl.textContent = String(z.extracts);
    if (deathsEl) deathsEl.textContent = String(z.deaths);
    if (bagEl) {
      bagEl.textContent = z.bestExtractAdena > 0 ? formatAdena(z.bestExtractAdena) : '—';
    }

    if (lastEl) {
      if (!z.lastOutcome || !z.lastJourney) {
        lastEl.textContent = t(
          'game.hunt.expedition.ledgerLastEmpty',
          'No finished run on this trail yet.'
        );
      } else if (z.lastOutcome === 'extract') {
        lastEl.textContent = t(
          'game.hunt.expedition.ledgerLastExtract',
          'Last run · Extracted at journey {j} · kept {adena} Adena',
          { j: z.lastJourney, adena: formatAdena(z.lastAdenaKept) }
        );
      } else {
        lastEl.textContent = t(
          'game.hunt.expedition.ledgerLastDeath',
          'Last run · Fell at journey {j} · kept {adena} Adena (half)',
          { j: z.lastJourney, adena: formatAdena(z.lastAdenaKept) }
        );
      }
    }

    if (lifeEl) {
      lifeEl.textContent = t(
        'game.hunt.expedition.ledgerLifeLine',
        'Lifetime · {extracts} extracts · best journey {best} · top bag {adena}',
        {
          extracts: life.totalExtracts,
          best: life.bestJourneyEver > 0 ? life.bestJourneyEver : '—',
          adena: life.bestExtractAdenaEver > 0 ? formatAdena(life.bestExtractAdenaEver) : '—',
        }
      );
    }
  },
};

window.ExpeditionMeta = ExpeditionMeta;
window.getExpeditionMetaSavePayload = () => ExpeditionMeta.getSavePayload();
window.applyExpeditionMetaFromSave = (raw: unknown) => ExpeditionMeta.applyFromSave(raw);

export {};
