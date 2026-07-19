/**
 * Status Rankings modal — chip filters + server-sorted ladder (Quick Menu).
 */
import { classEvolutionDisplayName } from '../i18n/polish12_display';
import type { CombatStatMetric, CombatStatRankingRow } from '../types/game';

const MODAL_ID = 'janela-stat-ranking';

let activeMetric: CombatStatMetric = 'p_atk';
let loading = false;

const METRIC_ORDER: CombatStatMetric[] = [
  'p_atk',
  'm_atk',
  'p_def',
  'm_def',
  'crit_rate',
  'max_hp',
  'atk_speed',
  'level',
];

function tn(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function metricLabel(metric: CombatStatMetric): string {
  return tn('game.statRanking.metric.' + metric);
}

function formatMetricValue(metric: CombatStatMetric, value: number): string {
  const n = Math.floor(Number(value) || 0);
  const locale = (typeof window.I18n !== 'undefined' && window.I18n.getLocale)
    ? window.I18n.getLocale()
    : 'en';
  const num = n.toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US');
  if (metric === 'crit_rate') return num + '%';
  if (metric === 'atk_speed') return num + ' ms';
  return num;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setStatus(msg: string): void {
  const el = document.getElementById('stat-ranking-status');
  if (el) el.textContent = msg || '';
}

function updateMetricPill(): void {
  const pill = document.getElementById('stat-ranking-metric-pill');
  if (!pill) return;
  pill.textContent = metricLabel(activeMetric);
  pill.hidden = false;
}

function scrollActiveChipIntoView(): void {
  const host = document.getElementById('stat-ranking-chips');
  const active = host?.querySelector('.stat-ranking-chip--active') as HTMLElement | null;
  if (!host || !active) return;
  // Prefer container scroll so parent overflow doesn't clip neighboring chips.
  const left = active.offsetLeft - (host.clientWidth - active.offsetWidth) / 2;
  try {
    host.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  } catch {
    host.scrollLeft = Math.max(0, left);
  }
}

function renderChips(): void {
  const host = document.getElementById('stat-ranking-chips');
  if (!host) return;
  host.innerHTML = '';
  METRIC_ORDER.forEach((metric) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'stat-ranking-chip' + (metric === activeMetric ? ' stat-ranking-chip--active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', metric === activeMetric ? 'true' : 'false');
    btn.dataset.metric = metric;
    btn.textContent = metricLabel(metric);
    btn.addEventListener('click', () => {
      if (metric === activeMetric || loading) return;
      activeMetric = metric;
      renderChips();
      updateMetricPill();
      void loadRanking(true);
    });
    host.appendChild(btn);
  });
  updateMetricPill();
  requestAnimationFrame(() => scrollActiveChipIntoView());
}

function medalClass(rank: number): string {
  if (rank === 1) return 'stat-ranking-row--gold';
  if (rank === 2) return 'stat-ranking-row--silver';
  if (rank === 3) return 'stat-ranking-row--bronze';
  return '';
}

function rankBadgeHtml(rank: number): string {
  const medal = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
  const cls = medal
    ? `stat-ranking-row__rank stat-ranking-row__rank--${medal}`
    : 'stat-ranking-row__rank';
  return `<span class="${cls}" aria-label="#${rank}"><span class="stat-ranking-row__rank-num">${rank}</span></span>`;
}

function emptyStateHtml(message: string, kind: 'empty' | 'offline' | 'error' | 'loading'): string {
  return (
    `<div class="stat-ranking-empty stat-ranking-empty--${kind}">`
    + `<span class="stat-ranking-empty__icon" aria-hidden="true"></span>`
    + `<p class="stat-ranking-empty__text">${escapeHtml(message)}</p>`
    + `</div>`
  );
}

function renderList(rows: CombatStatRankingRow[]): void {
  const list = document.getElementById('stat-ranking-list');
  if (!list) return;
  list.innerHTML = '';

  if (!rows.length) {
    list.innerHTML = emptyStateHtml(tn('game.statRanking.empty'), 'empty');
    return;
  }

  const localName = (window.charName || '').toLowerCase();
  const youLabel = tn('game.statRanking.youBadge');

  rows.forEach((row) => {
    const rank = Math.floor(Number(row.rank_pos) || 0);
    const name = String(row.char_name || '');
    const isLocal = !!(localName && name.toLowerCase() === localName);
    const classLabel = classEvolutionDisplayName(String(row.char_class || 'Fighter'));
    const lvl = Math.floor(Number(row.level) || 1);
    const valueLabel = formatMetricValue(activeMetric, Number(row.metric_value) || 0);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = [
      'stat-ranking-row',
      medalClass(rank),
      isLocal ? 'stat-ranking-row--local' : '',
    ].filter(Boolean).join(' ');
    btn.setAttribute('role', 'listitem');
    btn.innerHTML =
      rankBadgeHtml(rank)
      + `<span class="stat-ranking-row__meta">`
      + `<span class="stat-ranking-row__name-row">`
      + `<span class="stat-ranking-row__name">${escapeHtml(name)}</span>`
      + (isLocal ? `<span class="stat-ranking-row__you">${escapeHtml(youLabel)}</span>` : '')
      + `</span>`
      + `<span class="stat-ranking-row__sub">${escapeHtml(classLabel)} · Lv ${lvl}</span>`
      + `</span>`
      + `<span class="stat-ranking-row__value-wrap">`
      + `<span class="stat-ranking-row__value">${escapeHtml(valueLabel)}</span>`
      + `</span>`;

    btn.addEventListener('click', () => {
      if (!name) return;
      if (typeof window.abrirPerfilChat === 'function') {
        window.abrirPerfilChat(name, 'player');
      }
    });
    list.appendChild(btn);
  });

  const self = rows.find((r) => (r.char_name || '').toLowerCase() === localName);
  if (self) {
    setStatus(tn('game.statRanking.yourRank', {
      rank: Math.floor(Number(self.rank_pos) || 0),
      metric: metricLabel(activeMetric),
    }));
  } else {
    setStatus(tn('game.statRanking.notOnLadder'));
  }
}

async function loadRanking(force = false): Promise<void> {
  const list = document.getElementById('stat-ranking-list');
  if (!list) return;

  const cloudOk = !!(
    typeof window.SUPABASE_CONFIG !== 'undefined'
    && window.SUPABASE_CONFIG.enabled
    && window.SupabaseAPI
    && typeof window.SupabaseAPI.getUser === 'function'
    && window.SupabaseAPI.getUser()
  );

  if (!cloudOk) {
    setStatus(tn('game.statRanking.offline'));
    list.innerHTML = emptyStateHtml(tn('game.statRanking.offline'), 'offline');
    return;
  }

  loading = true;
  setStatus(tn('game.statRanking.loading'));
  list.innerHTML = emptyStateHtml(tn('game.statRanking.loading'), 'loading');

  if (typeof window.pushCombatStatSnapshot === 'function') {
    try {
      await window.pushCombatStatSnapshot({ force: false });
    } catch { /* noop */ }
  }

  try {
    const result = typeof window.fetchCombatStatRanking === 'function'
      ? await window.fetchCombatStatRanking(activeMetric, 50, { force })
      : null;

    if (!result || !result.success) {
      const err = result?.error || 'fetch_failed';
      if (err === 'offline') {
        setStatus(tn('game.statRanking.offline'));
        list.innerHTML = emptyStateHtml(tn('game.statRanking.offline'), 'offline');
      } else {
        setStatus(tn('game.statRanking.error'));
        list.innerHTML = emptyStateHtml(tn('game.statRanking.error'), 'error');
      }
      return;
    }

    renderList(Array.isArray(result.rows) ? result.rows : []);
  } finally {
    loading = false;
  }
}

export function abrirStatRanking(): void {
  activeMetric = 'p_atk';
  renderChips();
  try {
    const jw = document.getElementById(MODAL_ID);
    if (typeof window.I18n !== 'undefined' && window.I18n.refreshDom && jw) {
      window.I18n.refreshDom(jw);
    }
  } catch { /* noop */ }
  if (typeof window.abrirModal === 'function') window.abrirModal(MODAL_ID, 1600);
  void loadRanking(true);
}

export function fecharStatRanking(): void {
  if (typeof window.fecharModal === 'function') window.fecharModal(MODAL_ID);
}

window.abrirStatRanking = abrirStatRanking;
window.fecharStatRanking = fecharStatRanking;

export {};
