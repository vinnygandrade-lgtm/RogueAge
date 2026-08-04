/**
 * Grand Master Blessing Build UI — pick 3 blessings, apply for 2h.
 */

import {
  BLESSING_CATALOG,
  BLESSING_SLOT_COUNT,
  composeBlessingEffects,
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

function effectPreviewLine(ids: BlessingId[]): string {
  if (ids.length === 0) return t('game.blessingBuild.previewEmpty');
  const fx = composeBlessingEffects(ids);
  const parts: string[] = [];
  if (fx.pAtkMult !== 1) parts.push(t('game.blessingBuild.preview.pAtk', { n: Math.round((fx.pAtkMult - 1) * 100) }));
  if (fx.mAtkMult !== 1) parts.push(t('game.blessingBuild.preview.mAtk', { n: Math.round((fx.mAtkMult - 1) * 100) }));
  if (fx.pDefMult !== 1) parts.push(t('game.blessingBuild.preview.pDef', { n: Math.round((fx.pDefMult - 1) * 100) }));
  if (fx.mDefMult !== 1) parts.push(t('game.blessingBuild.preview.mDef', { n: Math.round((fx.mDefMult - 1) * 100) }));
  if (fx.maxHpMult !== 1) parts.push(t('game.blessingBuild.preview.hp', { n: Math.round((fx.maxHpMult - 1) * 100) }));
  if (fx.maxMpMult !== 1) parts.push(t('game.blessingBuild.preview.mp', { n: Math.round((fx.maxMpMult - 1) * 100) }));
  if (fx.critAdd) parts.push(t('game.blessingBuild.preview.crit', { n: fx.critAdd }));
  if (fx.castAdd) parts.push(t('game.blessingBuild.preview.cast', { n: fx.castAdd }));
  if (fx.dodgeAdd) parts.push(t('game.blessingBuild.preview.eva', { n: fx.dodgeAdd }));
  if (fx.atkSpeedMult !== 1) {
    parts.push(t('game.blessingBuild.preview.atkSpd', { n: Math.round((1 - fx.atkSpeedMult) * 100) }));
  }
  return parts.join(' · ') || t('game.blessingBuild.previewEmpty');
}

function renderBlessingBuildModal(): void {
  const root = document.getElementById('blessing-build-root');
  if (!root) return;

  const price = buildPrice();
  const selected = draftIds();
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
          `<span class="bless-slot__num">${idx + 1}</span>` +
          `<span class="bless-slot__hint">${esc(t('game.blessingBuild.tapToFill'))}</span>` +
          `</button>`
        );
      }
      const def = BLESSING_CATALOG.find((b) => b.id === id);
      return (
        `<button type="button" class="bless-slot bless-slot--filled" data-slot="${idx}" style="--bless:${esc(def?.color || '#fbbf24')}" aria-label="${esc(t('game.blessingBuild.removeSlot'))}">` +
        `<span class="bless-slot__glyph">${esc(def?.glyph || '?')}</span>` +
        `<span class="bless-slot__name">${esc(t('game.blessingBuild.catalog.' + id + '.name'))}</span>` +
        `<span class="bless-slot__x" aria-hidden="true">×</span>` +
        `</button>`
      );
    })
    .join('');

  const gridHtml = BLESSING_CATALOG.map((b) => {
    const picked = draftSlots.includes(b.id);
    const full = selected.length >= BLESSING_SLOT_COUNT && !picked;
    const cls =
      'bless-card' +
      (picked ? ' is-picked' : '') +
      (full ? ' is-disabled' : '');
    return (
      `<button type="button" class="${cls}" data-bless-id="${esc(b.id)}" style="--bless:${esc(b.color)}" ${full ? 'disabled' : ''}>` +
      `<span class="bless-card__glyph">${esc(b.glyph)}</span>` +
      `<span class="bless-card__name">${esc(t(b.nameKey))}</span>` +
      `<span class="bless-card__desc">${esc(t(b.descKey))}</span>` +
      `</button>`
    );
  }).join('');

  const canApply = selected.length === BLESSING_SLOT_COUNT && !applyBusy;
  const priceOk = (Number(window.adenas) || 0) >= price;

  root.innerHTML =
    `<div class="bless-build">` +
    `<p class="bless-build__lead">${esc(t('game.blessingBuild.lead'))}</p>` +
    (activeLine ? `<div class="bless-build__active">${esc(activeLine)}</div>` : '') +
    `<div class="bless-build__slots" id="blessing-build-slots">${slotsHtml}</div>` +
    `<div class="bless-build__preview" id="blessing-build-preview">${esc(effectPreviewLine(selected))}</div>` +
    `<div class="bless-build__grid" id="blessing-build-grid">${gridHtml}</div>` +
    `<div class="bless-build__price ${priceOk ? '' : 'is-short'}">${esc(t('game.blessingBuild.priceLine', { price: formatPrice(price) }))}</div>` +
    `</div>`;

  const applyBtn = document.getElementById('blessing-build-apply') as HTMLButtonElement | null;
  if (applyBtn) {
    applyBtn.disabled = !canApply;
    applyBtn.textContent = t('game.blessingBuild.applyBtn', { price: formatPrice(price) });
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
