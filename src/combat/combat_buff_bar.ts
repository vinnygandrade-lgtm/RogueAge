/**
 * L2-style player effect strip in hunt combat: icon row, remaining time above each.
 * Host: `#player-combat-buffs` (overlay on `#expedition-combat-stage`).
 */

const HOST_ID = 'player-combat-buffs';
const URGENT_MS = 10_000;

function tFn(key: string, fallback: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : fallback;
}

function hostEl(): HTMLElement | null {
  return document.getElementById(HOST_ID);
}

export function formatCombatBuffRemain(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function paintTime(el: HTMLElement, expiresAt: number): boolean {
  const remain = expiresAt - Date.now();
  if (remain <= 0) {
    el.remove();
    return false;
  }
  const timeEl = el.querySelector('.combat-buff-icon__time');
  if (timeEl) timeEl.textContent = formatCombatBuffRemain(remain);
  el.classList.toggle('combat-buff-icon--urgent', remain <= URGENT_MS);
  el.dataset.buffExpires = String(expiresAt);
  return true;
}

export function upsertCombatBuffIcon(opts: {
  id: string;
  iconHtml: string;
  expiresAt: number;
  title: string;
  extraClass?: string;
}): void {
  const host = hostEl();
  if (!host || !opts.id || opts.expiresAt <= Date.now()) return;

  let el = document.getElementById(opts.id) as HTMLElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = opts.id;
    el.className = ['combat-buff-icon', opts.extraClass].filter(Boolean).join(' ');
    el.innerHTML =
      `<span class="combat-buff-icon__time"></span>` +
      `<span class="combat-buff-icon__art">${opts.iconHtml}</span>`;
    host.appendChild(el);
  } else if (opts.extraClass && !el.classList.contains(opts.extraClass)) {
    el.classList.add(opts.extraClass);
  }
  el.title = opts.title;
  el.setAttribute('aria-label', `${opts.title} ${formatCombatBuffRemain(opts.expiresAt - Date.now())}`);
  paintTime(el, opts.expiresAt);
}

export function atualizarIconesBuffPlayer(nome: string, duracaoMs: number, iconeHtml: string): void {
  if (!nome || !(duracaoMs > 0)) return;
  const safe = String(nome).replace(/\s+/g, '-');
  upsertCombatBuffIcon({
    id: `buff-${safe}`,
    iconHtml: iconeHtml || '',
    expiresAt: Date.now() + duracaoMs,
    title: nome,
  });
}

function olympiadCleanArena(): boolean {
  const oly = (window as Window & {
    OlympiadEngine?: { areCleanArenaRulesActive?: () => boolean };
  }).OlympiadEngine;
  return typeof oly?.areCleanArenaRulesActive === 'function' && !!oly.areCleanArenaRulesActive();
}

function syncBlessingIcons(): void {
  const host = hostEl();
  if (!host) return;
  const existing = host.querySelectorAll<HTMLElement>('[data-blessing-buff]');

  if (olympiadCleanArena()) {
    existing.forEach((el) => el.remove());
    return;
  }

  const eng = window.BlessingEngine;
  const active =
    eng && typeof eng.getActiveBlessingBuild === 'function' ? eng.getActiveBlessingBuild() : null;
  const remainMs =
    eng && typeof eng.getBlessingBuildRemainingMs === 'function'
      ? Number(eng.getBlessingBuildRemainingMs()) || 0
      : 0;
  const ids = remainMs > 0 && active && Array.isArray(active.ids) ? active.ids.filter(Boolean) : [];
  const keep = new Set<string>();
  const expiresAt = Date.now() + remainMs;

  ids.forEach((id) => {
    const def = typeof window.getBlessingDef === 'function' ? window.getBlessingDef(id) : null;
    const glyph = (def && def.glyph) || '?';
    const color = (def && def.color) || '#fbbf24';
    const src =
      typeof window.getBlessingIconSrc === 'function'
        ? window.getBlessingIconSrc(id)
        : `assets/blessings/${id}.png`;
    const iconId = `buff-bless-${id}`;
    keep.add(iconId);
    upsertCombatBuffIcon({
      id: iconId,
      iconHtml:
        `<span class="bless-icon bless-icon--hud" style="--bless:${color}">` +
        `<span class="bless-icon__fallback" aria-hidden="true">${glyph}</span>` +
        `<img class="bless-icon__img" src="${src}" alt="" draggable="false" ` +
        `onload="this.classList.add('is-ready')" onerror="this.remove()">` +
        `</span>`,
      expiresAt,
      title: def?.nameKey ? tFn(def.nameKey, String(id)) : String(id),
      extraClass: 'combat-buff-icon--bless',
    });
    const el = document.getElementById(iconId);
    if (el) el.dataset.blessingBuff = String(id);
  });

  existing.forEach((el) => {
    if (!keep.has(el.id)) el.remove();
  });
}

export function tickCombatBuffBar(): void {
  const host = hostEl();
  if (!host) return;
  host.setAttribute(
    'aria-label',
    tFn('game.combat.activeEffectsAria', 'Active effects'),
  );
  host.querySelectorAll<HTMLElement>('[data-buff-expires]').forEach((el) => {
    paintTime(el, Number(el.dataset.buffExpires) || 0);
  });
  syncBlessingIcons();
}

window.atualizarIconesBuffPlayer = atualizarIconesBuffPlayer;
window.tickCombatBuffBar = tickCombatBuffBar;
window.upsertCombatBuffIcon = upsertCombatBuffIcon;
