/**
 * Grand Master Blessing Build UI — pick 3 blessings, apply for 2h.
 * Icons: assets/blessings/<id>.png (glyph fallback until art lands).
 */

import {
  BLESSING_GROUP_ORDER,
  BLESSING_SLOT_COUNT,
  blessingsByGroup,
  composeBlessingEffects,
  getBlessingDef,
  getBlessingIconSrc,
  type BlessingGroup,
  type BlessingId,
} from '../game/blessing_catalog';

let draftSlots: Array<BlessingId | null> = [null, null, null];
let applyBusy = false;

function t(key: string, vars?: Record<string, string | number>): string {
  if (typeof window.t === 'function') {
    const out = window.t(key, vars || {});
    if (out && out !== key) return out;
  }
  return key;
}

function esc(s: unknown): string {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function playerLevel(): number {
  return typeof window.nivel === 'number' && window.nivel > 0 ? window.nivel : 1;
}

function buildPrice(): number {
  const EB = window.EconomyBalance;
  if (EB && typeof EB.grandMasterBlessingBuildPrice === 'function') {
    return EB.grandMasterBlessingBuildPrice(playerLevel());
  }
  if (EB && typeof EB.grandMasterBuffPrice === 'function') {
    return Math.floor(EB.grandMasterBuffPrice(playerLevel()) * 1.4);
  }
  return 750;
}

function draftIds(): BlessingId[] {
  return draftSlots.filter((x): x is BlessingId => !!x);
}

function formatPrice(n: number): string {
  try {
    return n.toLocaleString();
  } catch {
    return String(n);
  }
}

/** Framed icon: PNG on top when ready; glyph underneath as strategic placeholder. */
function blessIconHtml(
  id: string,
  glyph: string,
  color: string,
  sizeClass = '',
): string {
  const src = getBlessingIconSrc(id);
  return (
    `<span class="bless-icon ${sizeClass}" style="--bless:${esc(color)}" data-bless-icon="${esc(id)}">` +
    `<span class="bless-icon__fallback" aria-hidden="true">${esc(glyph)}</span>` +
    `<img class="bless-icon__img" src="${esc(src)}" alt="" draggable="false" ` +
    `onload="this.classList.add('is-ready')" ` +
    `onerror="this.remove()">` +
    `</span>`
  );
}

function previewChipsHtml(ids: BlessingId[]): string {
  if (ids.length === 0) {
    return `<span class="bless-chip bless-chip--muted">${esc(t('game.blessingBuild.previewEmpty'))}</span>`;
  }
  const fx = composeBlessingEffects(ids);
  const chips: string[] = [];
  const push = (key: string, n: number) => {
    chips.push(
      `<span class="bless-chip">${esc(t('game.blessingBuild.preview.' + key, { n }))}</span>`,
    );
  };
  if (fx.pAtkMult !== 1) push('pAtk', Math.round((fx.pAtkMult - 1) * 100));
  if (fx.mAtkMult !== 1) push('mAtk', Math.round((fx.mAtkMult - 1) * 100));
  if (fx.pDefMult !== 1) push('pDef', Math.round((fx.pDefMult - 1) * 100));
  if (fx.mDefMult !== 1) push('mDef', Math.round((fx.mDefMult - 1) * 100));
  if (fx.maxHpMult !== 1) push('hp', Math.round((fx.maxHpMult - 1) * 100));
  if (fx.maxMpMult !== 1) push('mp', Math.round((fx.maxMpMult - 1) * 100));
  if (fx.critAdd) push('crit', fx.critAdd);
  if (fx.castAdd) push('cast', fx.castAdd);
  if (fx.dodgeAdd) push('eva', fx.dodgeAdd);
  if (fx.atkSpeedMult !== 1) push('atkSpd', Math.round((1 - fx.atkSpeedMult) * 100));
  return chips.join('') || `<span class="bless-chip bless-chip--muted">${esc(t('game.blessingBuild.previewEmpty'))}</span>`;
}

function groupTitle(group: BlessingGroup): string {
  return t('game.blessingBuild.groups.' + group);
}

function renderBlessingBuildModal(): void {
  const root = document.getElementById('blessing-build-root');
  if (!root) return;

  const price = buildPrice();
  const selected = draftIds();
  const filled = selected.length;
  const active = window.BlessingEngine?.getActiveBlessingBuild?.() || null;
  const activeLine = active
    ? t('game.blessingBuild.activeHint', {
        names: active.ids
          .map((id) => t('game.blessingBuild.catalog.' + id + '.name'))
          .join(' · '),
      })
    : '';

  const slotsHtml = draftSlots
    .map((id, idx) => {
      if (!id) {
        return (
          `<button type="button" class="bless-slot bless-slot--empty" data-slot="${idx}" aria-label="${esc(t('game.blessingBuild.emptySlot'))}">` +
          `<span class="bless-slot__frame">` +
          `<span class="bless-slot__plus" aria-hidden="true">+</span>` +
          `</span>` +
          `<span class="bless-slot__meta">` +
          `<span class="bless-slot__num">${t('game.blessingBuild.slotLabel', { n: idx + 1 })}</span>` +
          `<span class="bless-slot__hint">${esc(t('game.blessingBuild.tapToFill'))}</span>` +
          `</span>` +
          `</button>`
        );
      }
      const def = getBlessingDef(id);
      const color = def?.color || '#fbbf24';
      const glyph = def?.glyph || '?';
      return (
        `<button type="button" class="bless-slot bless-slot--filled" data-slot="${idx}" style="--bless:${esc(color)}" aria-label="${esc(t('game.blessingBuild.removeSlot'))}">` +
        `<span class="bless-slot__frame">${blessIconHtml(id, glyph, color, 'bless-icon--slot')}</span>` +
        `<span class="bless-slot__meta">` +
        `<span class="bless-slot__name">${esc(t('game.blessingBuild.catalog.' + id + '.name'))}</span>` +
        `<span class="bless-slot__hint">${esc(t('game.blessingBuild.tapToRemove'))}</span>` +
        `</span>` +
        `<span class="bless-slot__x" aria-hidden="true">×</span>` +
        `</button>`
      );
    })
    .join('');

  const groupsHtml = BLESSING_GROUP_ORDER.map((group) => {
    const list = blessingsByGroup(group);
    const cards = list
      .map((b) => {
        const picked = draftSlots.includes(b.id);
        const full = filled >= BLESSING_SLOT_COUNT && !picked;
        const cls =
          'bless-card' +
          (picked ? ' is-picked' : '') +
          (full ? ' is-disabled' : '');
        const pickIdx = draftSlots.indexOf(b.id);
        const badge =
          pickIdx >= 0
            ? `<span class="bless-card__badge">${pickIdx + 1}</span>`
            : '';
        return (
          `<button type="button" class="${cls}" data-bless-id="${esc(b.id)}" style="--bless:${esc(b.color)}" ${full ? 'disabled' : ''}>` +
          badge +
          `<span class="bless-card__icon">${blessIconHtml(b.id, b.glyph, b.color, 'bless-icon--card')}</span>` +
          `<span class="bless-card__text">` +
          `<span class="bless-card__name">${esc(t(b.nameKey))}</span>` +
          `<span class="bless-card__desc">${esc(t(b.descKey))}</span>` +
          `</span>` +
          `</button>`
        );
      })
      .join('');
    return (
      `<section class="bless-group" data-group="${esc(group)}">` +
      `<h4 class="bless-group__title">${esc(groupTitle(group))}</h4>` +
      `<div class="bless-group__grid">${cards}</div>` +
      `</section>`
    );
  }).join('');

  const canApply = filled === BLESSING_SLOT_COUNT && !applyBusy;
  const priceOk = (Number(window.adenas) || 0) >= price;
  const progressCls =
    filled === 0 ? 'is-empty' : filled < BLESSING_SLOT_COUNT ? 'is-partial' : 'is-ready';

  root.innerHTML =
    `<div class="bless-build">` +
    `<div class="bless-build__tray">` +
    `<div class="bless-build__tray-head">` +
    `<div class="bless-build__tray-titles">` +
    `<span class="bless-build__step">${esc(t('game.blessingBuild.stepBuild'))}</span>` +
    `<span class="bless-build__progress ${progressCls}">${esc(
      t('game.blessingBuild.progress', { n: filled, max: BLESSING_SLOT_COUNT }),
    )}</span>` +
    `</div>` +
    `<p class="bless-build__lead">${esc(t('game.blessingBuild.leadShort'))}</p>` +
    `</div>` +
    (activeLine ? `<div class="bless-build__active">${esc(activeLine)}</div>` : '') +
    `<div class="bless-build__slots" id="blessing-build-slots">${slotsHtml}</div>` +
    `<div class="bless-build__preview" id="blessing-build-preview">` +
    `<span class="bless-build__preview-label">${esc(t('game.blessingBuild.previewLabel'))}</span>` +
    `<div class="bless-build__chips">${previewChipsHtml(selected)}</div>` +
    `</div>` +
    `</div>` +
    `<div class="bless-build__pick">` +
    `<span class="bless-build__step">${esc(t('game.blessingBuild.stepPick'))}</span>` +
    groupsHtml +
    `</div>` +
    `<div class="bless-build__price ${priceOk ? '' : 'is-short'}">` +
    `<span class="bless-build__adena-ico" aria-hidden="true">ⓐ</span>` +
    `${esc(t('game.blessingBuild.priceLine', { price: formatPrice(price) }))}` +
    `</div>` +
    `</div>`;

  const applyBtn = document.getElementById('blessing-build-apply') as HTMLButtonElement | null;
  if (applyBtn) {
    applyBtn.disabled = !canApply;
    if (canApply) {
      applyBtn.textContent = t('game.blessingBuild.applyBtn', { price: formatPrice(price) });
    } else if (filled < BLESSING_SLOT_COUNT) {
      applyBtn.textContent = t('game.blessingBuild.applyNeedMore', {
        n: BLESSING_SLOT_COUNT - filled,
      });
    } else {
      applyBtn.textContent = t('game.blessingBuild.applyBtn', { price: formatPrice(price) });
    }
  }

  root.querySelectorAll('[data-bless-id]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).getAttribute('data-bless-id') as BlessingId | null;
      if (!id) return;
      toggleBlessing(id);
    });
  });
  root.querySelectorAll('[data-slot]').forEach((el) => {
    el.addEventListener('click', () => {
      const idx = Number((el as HTMLElement).getAttribute('data-slot'));
      if (!Number.isFinite(idx)) return;
      if (draftSlots[idx]) {
        draftSlots[idx] = null;
        renderBlessingBuildModal();
      }
    });
  });
}

function toggleBlessing(id: BlessingId): void {
  const idx = draftSlots.indexOf(id);
  if (idx >= 0) {
    draftSlots[idx] = null;
    renderBlessingBuildModal();
    return;
  }
  const empty = draftSlots.findIndex((s) => !s);
  if (empty < 0) return;
  draftSlots[empty] = id;
  renderBlessingBuildModal();
}

function abrirBlessingBuild(): void {
  draftSlots = [null, null, null];
  const active = window.BlessingEngine?.getActiveBlessingBuild?.();
  if (active && Array.isArray(active.ids)) {
    draftSlots = [
      (active.ids[0] as BlessingId) || null,
      (active.ids[1] as BlessingId) || null,
      (active.ids[2] as BlessingId) || null,
    ];
  }
  applyBusy = false;
  renderBlessingBuildModal();
  if (typeof window.abrirModal === 'function') {
    window.abrirModal('janela-blessing-build', 1600);
  } else {
    const el = document.getElementById('janela-blessing-build');
    if (el) el.style.display = 'flex';
  }
  try {
    if (typeof window.I18n !== 'undefined' && window.I18n.refreshDom) {
      window.I18n.refreshDom(document.getElementById('janela-blessing-build') || undefined);
    }
  } catch {
    /* ignore */
  }
}

function fecharBlessingBuild(): void {
  if (typeof window.fecharModal === 'function') {
    window.fecharModal('janela-blessing-build');
  } else {
    const el = document.getElementById('janela-blessing-build');
    if (el) el.style.display = 'none';
  }
}

async function confirmarBlessingBuild(): Promise<void> {
  if (applyBusy) return;
  const ids = draftIds();
  if (ids.length !== BLESSING_SLOT_COUNT) {
    if (typeof window.l2Alert === 'function') {
      await window.l2Alert(t('game.blessingBuild.needThree'));
    } else if (typeof window.mostrarAviso === 'function') {
      window.mostrarAviso(t('game.blessingBuild.needThree'));
    }
    return;
  }

  const active = window.BlessingEngine?.isBlessingBuildActive?.();
  if (active && typeof window.l2Confirm === 'function') {
    const ok = await window.l2Confirm(t('game.blessingBuild.replaceConfirm'));
    if (!ok) return;
  }

  applyBusy = true;
  renderBlessingBuildModal();
  try {
    const engine = window.BlessingEngine;
    if (!engine || typeof engine.applyBlessingBuild !== 'function') {
      throw new Error('no engine');
    }
    const result = engine.applyBlessingBuild(ids);
    if (result.ok === false) {
      if (result.error === 'adena') {
        const msg = t('game.blessingBuild.needAdena', {
          amount: formatPrice(result.price || buildPrice()),
        });
        if (typeof window.l2Alert === 'function') await window.l2Alert(msg);
        else if (typeof window.mostrarAviso === 'function') window.mostrarAviso(msg);
      } else if (typeof window.l2Alert === 'function') {
        await window.l2Alert(t('game.blessingBuild.needThree'));
      }
      return;
    }
    if (typeof window.tocarSom === 'function') window.tocarSom('enchant');
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(
        `<span style="color:#fbbf24;font-weight:bold;">${esc(t('game.blessingBuild.appliedLog'))}</span>`,
      );
    }
    fecharBlessingBuild();
    if (typeof window.fecharNpc === 'function') window.fecharNpc();
  } finally {
    applyBusy = false;
  }
}

function refreshBlessingBuildTownCta(): void {
  const priceEl = document.getElementById('blessing-build-cta-price');
  if (priceEl) {
    priceEl.textContent = t('game.town.blessingBuildPrice', { price: formatPrice(buildPrice()) });
  }
  const hintEl = document.getElementById('blessing-build-cta-hint');
  if (hintEl) {
    const active = window.BlessingEngine?.isBlessingBuildActive?.();
    hintEl.textContent = active
      ? t('game.town.blessingBuildHintActive')
      : t('game.town.blessingBuildHint');
  }
}

window.abrirBlessingBuild = abrirBlessingBuild;
window.fecharBlessingBuild = fecharBlessingBuild;
window.confirmarBlessingBuild = confirmarBlessingBuild;
window.refreshBlessingBuildTownCta = refreshBlessingBuildTownCta;

export {};
