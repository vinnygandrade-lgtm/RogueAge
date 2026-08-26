// ==========================================
// UI - PAPERDOLL (VISUAL DO PERSONAGEM E NEON)
// ==========================================

import type {
  EquipInstance,
  ItemCatalogBase,
  PaperdollCharSelectData,
  PaperdollConfig,
  PaperdollFeetScan,
  PaperdollLayerRole,
  PaperdollLayoutNorm,
  PaperdollRefreshOptions,
} from '../types/game';

type PaperdollHostEl = HTMLElement & { _pdFootShadowBound?: boolean };
type PaperdollStackEl = HTMLElement & { _pdFootLayoutKey?: string };
type ProfileJewelEquip = { enchant?: number | string; enchantJewel?: number | string };

/** Pixel 1×1 transparente — evita ícone de imagem quebrada no mobile */
const PAPERDOLL_BLANK_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const LEGACY_LAYER_IDS: Record<PaperdollLayerRole, string> = {
  base: 'char-base-layer',
  armor: 'char-armor-layer',
  weapon: 'char-weapon-layer',
  weaponGrip: 'char-weapon-grip-layer',
  weaponGlow: 'char-weapon-glow',
  weaponSheen: 'char-weapon-sheen',
  hands: 'char-hands-layer',
};

function setPaperdollLayerVisible(layer: HTMLImageElement | null, visible: boolean): void {
  if (!layer) return;
  if (visible) {
    layer.removeAttribute('hidden');
    layer.style.display = 'block';
  } else {
    layer.setAttribute('hidden', '');
    layer.style.display = 'none';
    if (layer.src !== PAPERDOLL_BLANK_SRC) {
      layer.src = PAPERDOLL_BLANK_SRC;
    }
    delete layer.dataset.pdSrcChain;
  }
}

function _isPaperdollBlankLayer(imgEl: HTMLImageElement | null): boolean {
  if (!imgEl || !imgEl.src) return true;
  if (imgEl.hasAttribute('hidden')) return true;
  if (imgEl.src === PAPERDOLL_BLANK_SRC) return true;
  if (/^data:image\/gif/i.test(imgEl.src) && (imgEl.naturalWidth || 0) <= 1) return true;
  return false;
}

function isHumanPaperdollFighter(): boolean {
  if (
    typeof window.presetUsesPaperdollHands === 'function' &&
    typeof window.resolvePaperdollPresetId === 'function'
  ) {
    return window.presetUsesPaperdollHands(window.resolvePaperdollPresetId());
  }
  if (typeof window.resolvePaperdollPresetId === 'function') {
    const id = window.resolvePaperdollPresetId();
    return id === 'human_fighter' || id === 'human_fighter_female';
  }
  const classeLimpa =
    typeof window.charClass !== 'undefined' ? String(window.charClass).toLowerCase().trim() : '';
  const isMage =
    classeLimpa.includes('mage') ||
    classeLimpa.includes('wizard') ||
    classeLimpa.includes('necromancer') ||
    classeLimpa.includes('soultaker') ||
    classeLimpa.includes('cleric');
  return typeof window.charRace !== 'undefined' && window.charRace === 'Human' && !isMage;
}

/** Tenta src em cadeia; onAllFail quando nenhum URL carrega. Skip se a cadeia já está activa. */
function setPaperdollLayerSrcChain(
  layer: HTMLImageElement | null,
  srcList: string[],
  onAllFail?: () => void,
): void {
  if (!layer || !srcList || !srcList.length) {
    if (onAllFail) onAllFail();
    return;
  }
  const chainKey = srcList.join('\n');
  if (
    layer.dataset.pdSrcChain === chainKey &&
    !_isPaperdollBlankLayer(layer) &&
    layer.complete &&
    (layer.naturalWidth || 0) > 1
  ) {
    return;
  }
  layer.dataset.pdSrcChain = chainKey;
  let idx = 0;
  layer.onload = () => {
    layer.onerror = null;
    _handlePaperdollLayerLoad(layer);
    const role = layer.getAttribute('data-pd-layer');
    if (role !== 'weapon' && layer.id !== 'char-weapon-layer' && layer.id !== 'char-select-weapon-layer') {
      return;
    }
    const root = layer.closest('.l2-paperdoll') as
      | (HTMLElement & { _pdLastWeaponItem?: EquipInstance | null })
      | null;
    if (root && Object.prototype.hasOwnProperty.call(root, '_pdLastWeaponItem')) {
      _applyPaperdollWeaponGlow(root, _getPaperdollLayer(root, 'weapon'), root._pdLastWeaponItem ?? null);
      return;
    }
    if (
      (root?.classList.contains('l2-paperdoll--profile') || layer.id === 'char-weapon-layer') &&
      typeof window.atualizarBrilhoArma === 'function'
    ) {
      window.atualizarBrilhoArma();
    }
  };
  layer.onerror = () => {
    idx += 1;
    if (idx < srcList.length) {
      layer.src = srcList[idx]!;
      return;
    }
    layer.onerror = null;
    delete layer.dataset.pdSrcChain;
    if (onAllFail) onAllFail();
  };
  layer.src = srcList[0]!;
}

/** id do catálogo para sprites em assets/equips/ (instâncias ItemSecurity usam item.base.id) */
function resolveEquipCatalogId(
  equip: EquipInstance | ItemCatalogBase | null | undefined,
): string {
  if (!equip) return '';
  if (typeof (equip as EquipInstance).uid === 'string' && (equip as EquipInstance).base) {
    const base = (equip as EquipInstance).base;
    return base.id != null ? String(base.id) : '';
  }
  return (equip as ItemCatalogBase).id != null ? String((equip as ItemCatalogBase).id) : '';
}

function _getPaperdollLayer(
  root: Element | null | undefined,
  role: PaperdollLayerRole,
): HTMLImageElement | null {
  if (root) {
    const el = root.querySelector('[data-pd-layer="' + role + '"]');
    return el instanceof HTMLImageElement ? el : null;
  }
  const legacyId = LEGACY_LAYER_IDS[role];
  const el = legacyId ? document.getElementById(legacyId) : null;
  return el instanceof HTMLImageElement ? el : null;
}

function _isPaperdollRenderableLayer(layer: Element | null): layer is HTMLImageElement {
  if (!layer) return false;
  const role = layer.getAttribute('data-pd-layer');
  return (
    role === 'base' ||
    role === 'armor' ||
    role === 'weapon' ||
    role === 'weaponGrip' ||
    role === 'hands'
  );
}

/** weaponGlow usa placeholder 1×1 + CSS na weapon layer — não validar como canvas 1080×984 */
function _handlePaperdollLayerLoad(layer: HTMLImageElement | null): void {
  if (!layer || _isPaperdollBlankLayer(layer)) return;
  if (!_isPaperdollRenderableLayer(layer)) return;
  _validatePaperdollLayerCanvas(layer, layer.id, { hideOnFail: true });
  schedulePaperdollFootShadowSyncWithRetries();
}

type PaperdollWeaponGlowEl = HTMLImageElement & { _pdGlowSig?: string };
type PaperdollAuraImgEl = HTMLImageElement & { _pdAuraSig?: string };

/**
 * Option 1 (fixed): SVG filter on a weapon-silhouette copy.
 * SourceAlpha → gaussian blur → flood with tier colour. Blur stdDeviation steps per level.
 * CSS mask+blur on the same node was clipped (looked like zero effect).
 */
function _setSvgAuraParams(lvl: number, color: string): void {
  const blurWide = document.getElementById('pd-aura-blur-wide');
  const blurMid = document.getElementById('pd-aura-blur-mid');
  const blurCore = document.getElementById('pd-aura-blur-core');
  const floodWide = document.getElementById('pd-aura-flood-wide');
  const floodMid = document.getElementById('pd-aura-flood-mid');
  const floodCore = document.getElementById('pd-aura-flood-core');

  if (lvl >= 25) {
    if (blurWide) blurWide.setAttribute('stdDeviation', '26');
    if (blurMid) blurMid.setAttribute('stdDeviation', '14');
    if (blurCore) blurCore.setAttribute('stdDeviation', '4.2');
    if (floodWide) {
      floodWide.setAttribute('flood-color', '#ff2a2a');
      floodWide.setAttribute('flood-opacity', '0.78');
    }
    if (floodMid) {
      floodMid.setAttribute('flood-color', '#ff8a1a');
      floodMid.setAttribute('flood-opacity', '0.95');
    }
    if (floodCore) {
      floodCore.setAttribute('flood-color', '#ffffff');
      floodCore.setAttribute('flood-opacity', '1');
    }
    _setSvgSheenParams(lvl, color);
    return;
  }

  const step = Math.max(0, Math.min(20, Math.floor(lvl) - 4));
  // +4 → tight; +24 → wide. Each +1 adds a clear blur step.
  const wide = 4 + step * 1.15; // 4 → 27
  const mid = 2 + step * 0.65; // 2 → 15
  const core = 1 + step * 0.2; // 1 → 5
  const opWide = Math.min(0.7, 0.28 + step * 0.02);
  const opMid = Math.min(0.92, 0.5 + step * 0.02);
  const opCore = Math.min(0.98, 0.7 + step * 0.012);
  const coreColor = paperdollWeaponGlowCore(color);

  if (blurWide) blurWide.setAttribute('stdDeviation', wide.toFixed(2));
  if (blurMid) blurMid.setAttribute('stdDeviation', mid.toFixed(2));
  if (blurCore) blurCore.setAttribute('stdDeviation', core.toFixed(2));
  if (floodWide) {
    floodWide.setAttribute('flood-color', color);
    floodWide.setAttribute('flood-opacity', opWide.toFixed(3));
  }
  if (floodMid) {
    floodMid.setAttribute('flood-color', color);
    floodMid.setAttribute('flood-opacity', opMid.toFixed(3));
  }
  if (floodCore) {
    floodCore.setAttribute('flood-color', coreColor);
    floodCore.setAttribute('flood-opacity', opCore.toFixed(3));
  }
  _setSvgSheenParams(lvl, color);
}

function _setSvgSheenParams(lvl: number, color: string): void {
  const flood = document.getElementById('pd-sheen-flood');
  const floodHot = document.getElementById('pd-sheen-flood-hot');
  const blurHot = document.getElementById('pd-sheen-blur-hot');
  const core = paperdollWeaponGlowCore(color);
  if (lvl >= 25) {
    if (flood) {
      flood.setAttribute('flood-color', '#ff3b3b');
      flood.setAttribute('flood-opacity', '0.88');
    }
    if (floodHot) {
      floodHot.setAttribute('flood-color', '#ffffff');
      floodHot.setAttribute('flood-opacity', '0.62');
    }
    if (blurHot) blurHot.setAttribute('stdDeviation', '1.35');
    return;
  }
  const step = Math.max(0, Math.min(20, Math.floor(lvl) - 4));
  const opFill = Math.min(0.74, 0.42 + step * 0.016);
  const opHot = Math.min(0.48, 0.22 + step * 0.012);
  if (flood) {
    flood.setAttribute('flood-color', color);
    flood.setAttribute('flood-opacity', opFill.toFixed(3));
  }
  if (floodHot) {
    floodHot.setAttribute('flood-color', core);
    floodHot.setAttribute('flood-opacity', opHot.toFixed(3));
  }
  if (blurHot) blurHot.setAttribute('stdDeviation', (0.6 + step * 0.025).toFixed(2));
}

const PAPERDOLL_SPARK_SLOTS = 14;

type PaperdollWeaponFx = {
  sheen: HTMLImageElement | null;
  sparks: HTMLElement | null;
};

function _getPaperdollWeaponFx(root: Element | null | undefined): PaperdollWeaponFx {
  if (!root) return { sheen: null, sparks: null };
  const sheenEl = root.querySelector('[data-pd-layer="weaponSheen"]');
  const sparksEl = root.querySelector('[data-pd-weapon-sparks]');
  return {
    sheen: sheenEl instanceof HTMLImageElement ? sheenEl : null,
    sparks: sparksEl instanceof HTMLElement ? sparksEl : null,
  };
}

function _ensurePaperdollWeaponFx(root: Element | null | undefined): PaperdollWeaponFx {
  if (!root) return { sheen: null, sparks: null };
  const stack = root.querySelector('.paperdoll-character-stack');
  if (!(stack instanceof HTMLElement)) return { sheen: null, sparks: null };

  const existingSheen = stack.querySelector('[data-pd-layer="weaponSheen"]');
  let sheen: HTMLImageElement;
  if (existingSheen instanceof HTMLImageElement) {
    sheen = existingSheen;
  } else {
    sheen = document.createElement('img');
    sheen.setAttribute('data-pd-layer', 'weaponSheen');
    sheen.className = 'char-layer paperdoll-weapon-sheen-img';
    sheen.alt = '';
    sheen.hidden = true;
    sheen.src = PAPERDOLL_BLANK_SRC;
    const weapon = stack.querySelector('[data-pd-layer="weapon"]');
    if (weapon) weapon.insertAdjacentElement('afterend', sheen);
    else stack.appendChild(sheen);
  }

  const existingSparks = stack.querySelector('[data-pd-weapon-sparks]');
  let sparks: HTMLElement;
  if (existingSparks instanceof HTMLElement) {
    sparks = existingSparks;
  } else {
    sparks = document.createElement('div');
    sparks.setAttribute('data-pd-weapon-sparks', '');
    sparks.className = 'paperdoll-weapon-sparks';
    sparks.setAttribute('aria-hidden', 'true');
    sparks.hidden = true;
    for (let i = 0; i < PAPERDOLL_SPARK_SLOTS; i++) {
      sparks.appendChild(document.createElement('span'));
    }
    stack.appendChild(sparks);
  }
  while (sparks.childElementCount < PAPERDOLL_SPARK_SLOTS) {
    sparks.appendChild(document.createElement('span'));
  }

  return { sheen, sparks };
}

function _clearPaperdollWeaponAura(
  weaponLayer: PaperdollWeaponGlowEl | null,
  glowLayer: PaperdollAuraImgEl | null,
  weaponItem: EquipInstance | null | undefined,
  root?: Element | null,
): void {
  if (weaponLayer) {
    weaponLayer._pdGlowSig = '';
    weaponLayer.classList.remove('weapon-glow-divino', 'weapon-glow-aura');
    if (typeof window.syncPaperdollFistWeaponLayerClass === 'function') {
      window.syncPaperdollFistWeaponLayerClass(weaponLayer, weaponItem ?? null);
    }
    weaponLayer.style.filter = 'none';
    weaponLayer.style.animation = 'none';
    weaponLayer.style.opacity = '1';
  }
  if (glowLayer) {
    glowLayer._pdAuraSig = '';
    glowLayer.classList.remove(
      'paperdoll-weapon-glow-img--on',
      'paperdoll-weapon-glow-img--pulse-mid',
      'paperdoll-weapon-glow-img--pulse-high',
      'paperdoll-weapon-glow-img--divino',
      'char-layer--fist',
    );
    glowLayer.style.filter = 'none';
    glowLayer.style.animation = 'none';
    glowLayer.style.opacity = '';
    setPaperdollLayerVisible(glowLayer, false);
  }
  const host =
    root ||
    glowLayer?.closest('.l2-paperdoll') ||
    weaponLayer?.closest('.l2-paperdoll') ||
    null;
  const fx = _getPaperdollWeaponFx(host);
  if (fx.sheen) {
    fx.sheen.classList.remove(
      'paperdoll-weapon-sheen-img--on',
      'paperdoll-weapon-glow-img--pulse-mid',
      'paperdoll-weapon-glow-img--pulse-high',
      'paperdoll-weapon-glow-img--divino',
      'char-layer--fist',
    );
    fx.sheen.style.filter = 'none';
    fx.sheen.style.animation = 'none';
    fx.sheen.style.opacity = '';
    setPaperdollLayerVisible(fx.sheen, false);
  }
  if (fx.sparks) {
    fx.sparks.hidden = true;
    fx.sparks.setAttribute('hidden', '');
    fx.sparks.classList.remove(
      'paperdoll-weapon-sparks--mid',
      'paperdoll-weapon-sparks--high',
      'paperdoll-weapon-sparks--divino',
    );
  }
}

function _syncGlowImgToWeapon(
  weaponLayer: HTMLImageElement,
  glowLayer: HTMLImageElement,
): boolean {
  if (_isPaperdollBlankLayer(weaponLayer) || !weaponLayer.complete || (weaponLayer.naturalWidth || 0) <= 1) {
    return false;
  }
  const src = weaponLayer.currentSrc || weaponLayer.src;
  if (!src || src === PAPERDOLL_BLANK_SRC) return false;
  if (glowLayer.getAttribute('src') !== src && glowLayer.src !== src) {
    glowLayer.onerror = null;
    glowLayer.onload = null;
    glowLayer.src = src;
  }
  glowLayer.dataset.pdSrcChain = weaponLayer.dataset.pdSrcChain || src;
  setPaperdollLayerVisible(glowLayer, true);
  if (weaponLayer.classList.contains('char-layer--fist')) {
    glowLayer.classList.add('char-layer--fist');
  } else {
    glowLayer.classList.remove('char-layer--fist');
  }
  return true;
}

function _applyPaperdollWeaponGlow(
  root: Element | null,
  weaponLayer: HTMLImageElement | null,
  weaponItem: EquipInstance | null | undefined,
): void {
  const weapon = weaponLayer as PaperdollWeaponGlowEl | null;
  const glow = _getPaperdollLayer(root, 'weaponGlow') as PaperdollAuraImgEl | null;
  const fx = _ensurePaperdollWeaponFx(root);

  // Remove leftover CSS-mask host from earlier attempt (if present in old DOM).
  const legacyMask = root ? root.querySelector('[data-pd-weapon-aura]') : null;
  if (legacyMask instanceof HTMLElement) {
    legacyMask.hidden = true;
  }

  if (!weapon || !weaponItem) {
    _clearPaperdollWeaponAura(weapon, glow, weaponItem ?? null, root);
    return;
  }

  const _we = weaponItem.enchant;
  let lvl =
    _we !== undefined && _we !== null && (_we as unknown) !== ''
      ? Number(_we)
      : 0;
  if (!Number.isFinite(lvl) || lvl < 0) lvl = 0;
  lvl = Math.floor(lvl);

  if (lvl < 4) {
    _clearPaperdollWeaponAura(weapon, glow, weaponItem, root);
    return;
  }

  const color = window.getEnchantTierGlowColor(lvl);
  const srcHint = weapon.currentSrc || weapon.src || '';
  const glowSig = 'svg-v5|' + lvl + '|' + color + '|' + srcHint;

  if (
    weapon._pdGlowSig === glowSig &&
    glow &&
    glow._pdAuraSig === glowSig &&
    !glow.hasAttribute('hidden') &&
    !_isPaperdollBlankLayer(glow)
  ) {
    weapon.style.filter = 'none';
    weapon.style.opacity = '1';
    weapon.style.animation = 'none';
    _setPaperdollEnchantPulseClasses(glow, lvl, 'paperdoll-weapon-glow-img--on');
    if (fx.sheen) {
      _setPaperdollEnchantPulseClasses(fx.sheen, lvl, 'paperdoll-weapon-sheen-img--on');
    }
    _setPaperdollWeaponSparks(fx.sparks, weapon, lvl, color);
    return;
  }

  weapon._pdGlowSig = glowSig;
  weapon.classList.remove('weapon-glow-divino', 'weapon-glow-aura');
  weapon.style.filter = 'none';
  weapon.style.animation = 'none';
  weapon.style.opacity = '1';
  if (typeof window.syncPaperdollFistWeaponLayerClass === 'function') {
    window.syncPaperdollFistWeaponLayerClass(weapon, weaponItem);
  }

  if (!glow) return;

  if (!_syncGlowImgToWeapon(weapon, glow)) {
    _clearPaperdollWeaponAura(null, glow, weaponItem, root);
    weapon._pdGlowSig = '';
    return;
  }

  _setSvgAuraParams(lvl, color);
  glow._pdAuraSig = glowSig;
  // Rear bloom stays behind the sharp PNG; sheen copy paints the core ON the blade.
  // +25: CSS owns filter (hue cycle + SVG). Lower tiers keep a static url() filter.
  glow.style.filter = lvl >= 25 ? '' : 'url(#pd-weapon-enchant-aura)';
  _setPaperdollEnchantPulseClasses(glow, lvl, 'paperdoll-weapon-glow-img--on');

  if (fx.sheen && _syncGlowImgToWeapon(weapon, fx.sheen)) {
    fx.sheen.style.filter = lvl >= 25 ? '' : 'url(#pd-weapon-enchant-sheen)';
    _setPaperdollEnchantPulseClasses(fx.sheen, lvl, 'paperdoll-weapon-sheen-img--on');
  }
  _setPaperdollWeaponSparks(fx.sparks, weapon, lvl, color);
}

function _setPaperdollEnchantPulseClasses(el: HTMLElement, lvl: number, onClass: string): void {
  el.classList.remove(
    'paperdoll-weapon-glow-img--on',
    'paperdoll-weapon-sheen-img--on',
    'paperdoll-weapon-glow-img--pulse-mid',
    'paperdoll-weapon-glow-img--pulse-high',
    'paperdoll-weapon-glow-img--divino',
  );
  el.classList.add(onClass);
  if (lvl >= 25) {
    el.classList.add('paperdoll-weapon-glow-img--divino');
  } else if (lvl >= 16) {
    el.classList.add('paperdoll-weapon-glow-img--pulse-high');
  } else if (lvl >= 10) {
    el.classList.add('paperdoll-weapon-glow-img--pulse-mid');
  }
  el.style.animation = '';
  el.style.opacity = '';
}

function _sparkCountForEnchant(lvl: number): number {
  if (lvl >= 25) return 14;
  if (lvl >= 20) return 12;
  if (lvl >= 16) return 10;
  if (lvl >= 10) return 8;
  return 5;
}

type WeaponSparkPoint = { x: number; y: number };

const _pdWeaponSparkCache: Record<string, WeaponSparkPoint[]> = {};

const _PD_WEAPON_SPARK_FALLBACK: WeaponSparkPoint[] = [
  { x: 0.22, y: 0.62 },
  { x: 0.27, y: 0.56 },
  { x: 0.18, y: 0.68 },
  { x: 0.31, y: 0.5 },
  { x: 0.24, y: 0.58 },
  { x: 0.16, y: 0.72 },
  { x: 0.29, y: 0.54 },
  { x: 0.2, y: 0.64 },
  { x: 0.33, y: 0.46 },
  { x: 0.26, y: 0.6 },
  { x: 0.19, y: 0.7 },
  { x: 0.28, y: 0.52 },
  { x: 0.23, y: 0.66 },
  { x: 0.3, y: 0.48 },
];

/** Sample opaque edge pixels of the weapon overlay so sparks sit on the blade, not the sky. */
function _scanWeaponSparkPoints(imgEl: HTMLImageElement, want: number): WeaponSparkPoint[] {
  const need = Math.max(1, Math.min(PAPERDOLL_SPARK_SLOTS, want));
  const cacheKey =
    (imgEl.currentSrc || imgEl.src) +
    '|' +
    imgEl.naturalWidth +
    'x' +
    imgEl.naturalHeight +
    '|spk-' +
    need;
  const hit = _pdWeaponSparkCache[cacheKey];
  if (hit && hit.length) return hit;

  if (!imgEl.complete || (imgEl.naturalWidth || 0) <= 1) {
    return _PD_WEAPON_SPARK_FALLBACK.slice(0, need);
  }

  const nw = imgEl.naturalWidth;
  const nh = imgEl.naturalHeight;
  const maxW = 220;
  const cw = nw > maxW ? maxW : nw;
  const ch = Math.max(1, Math.round(nh * (cw / nw)));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return _PD_WEAPON_SPARK_FALLBACK.slice(0, need);
  try {
    ctx.drawImage(imgEl, 0, 0, cw, ch);
  } catch {
    return _PD_WEAPON_SPARK_FALLBACK.slice(0, need);
  }

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    return _PD_WEAPON_SPARK_FALLBACK.slice(0, need);
  }

  const alphaMin = 40;
  const edges: WeaponSparkPoint[] = [];
  const interior: WeaponSparkPoint[] = [];
  const step = Math.max(1, Math.floor(Math.min(cw, ch) / 90));
  for (let y = 1; y < ch - 1; y += step) {
    for (let x = 1; x < cw - 1; x += step) {
      const a = data[(y * cw + x) * 4 + 3]!;
      if (a < alphaMin) continue;
      const n = data[((y - 1) * cw + x) * 4 + 3]!;
      const s = data[((y + 1) * cw + x) * 4 + 3]!;
      const w = data[(y * cw + (x - 1)) * 4 + 3]!;
      const e = data[(y * cw + (x + 1)) * 4 + 3]!;
      const pt = { x: (x + 0.5) / cw, y: (y + 0.5) / ch };
      if (n < alphaMin || s < alphaMin || w < alphaMin || e < alphaMin) {
        edges.push(pt);
      } else {
        interior.push(pt);
      }
    }
  }

  const pool = edges.length >= need ? edges : edges.concat(interior);
  if (!pool.length) return _PD_WEAPON_SPARK_FALLBACK.slice(0, need);

  pool.sort((a, b) => a.x + a.y - (b.x + b.y));
  const picked: WeaponSparkPoint[] = [];
  const last = pool.length - 1;
  for (let i = 0; i < need; i++) {
    const idx = need === 1 ? 0 : Math.round((i * last) / (need - 1));
    picked.push(pool[idx]!);
  }
  _pdWeaponSparkCache[cacheKey] = picked;
  return picked;
}

function _setPaperdollWeaponSparks(
  sparks: HTMLElement | null,
  weaponLayer: HTMLImageElement | null,
  lvl: number,
  color: string,
): void {
  if (!sparks) return;
  sparks.classList.remove(
    'paperdoll-weapon-sparks--mid',
    'paperdoll-weapon-sparks--high',
    'paperdoll-weapon-sparks--divino',
  );
  sparks.style.setProperty('--pd-enchant-glow', color);
  sparks.style.setProperty('--pd-enchant-core', paperdollWeaponGlowCore(color));
  if (lvl >= 25) {
    sparks.classList.add('paperdoll-weapon-sparks--divino');
  } else if (lvl >= 16) {
    sparks.classList.add('paperdoll-weapon-sparks--high');
  } else if (lvl >= 10) {
    sparks.classList.add('paperdoll-weapon-sparks--mid');
  }

  const want = _sparkCountForEnchant(lvl);
  const points =
    weaponLayer && !_isPaperdollBlankLayer(weaponLayer)
      ? _scanWeaponSparkPoints(weaponLayer, want)
      : _PD_WEAPON_SPARK_FALLBACK.slice(0, want);

  const spans = sparks.querySelectorAll('span');
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i] as HTMLElement;
    const p = points[i];
    if (!p) {
      span.style.display = 'none';
      continue;
    }
    span.style.display = 'block';
    span.style.left = (p.x * 100).toFixed(2) + '%';
    span.style.top = (p.y * 100).toFixed(2) + '%';
    span.style.setProperty('--spark-rot', String(-58 + ((i * 47) % 86)) + 'deg');
    span.style.animationDelay = (i * (lvl >= 25 ? 0.12 : 0.18)).toFixed(2) + 's';
    span.style.animationDuration =
      lvl >= 25
        ? (1.15 + (i % 5) * 0.16).toFixed(2) + 's'
        : (1.7 + (i % 5) * 0.28).toFixed(2) + 's';
  }

  sparks.hidden = false;
  sparks.removeAttribute('hidden');
}

type PaperdollRootEl = HTMLElement & {
  _pdRefreshSig?: string;
  _pdLastWeaponItem?: EquipInstance | null;
};

function _paperdollRefreshSignature(
  presetId: string,
  armEquip: EquipInstance | ItemCatalogBase | null | undefined,
  armaEquip: EquipInstance | ItemCatalogBase | null | undefined,
): string {
  const armId = resolveEquipCatalogId(armEquip);
  const armEnc =
    armEquip && typeof (armEquip as EquipInstance).enchant !== 'undefined'
      ? String((armEquip as EquipInstance).enchant ?? 0)
      : '0';
  const wId = resolveEquipCatalogId(armaEquip);
  const wEnc =
    armaEquip && typeof (armaEquip as EquipInstance).enchant !== 'undefined'
      ? String((armaEquip as EquipInstance).enchant ?? 0)
      : '0';
  const aug =
    typeof window.isAugmented !== 'undefined' && window.isAugmented ? '1' : '0';
  return [presetId, armId, armEnc, wId, wEnc, aug].join('|');
}

function _refreshPaperdollRoot(
  root: Element | null,
  options: PaperdollRefreshOptions = {},
): void {
  const presetId =
    options.presetId ||
    (typeof window.resolvePaperdollPresetId === 'function'
      ? window.resolvePaperdollPresetId()
      : 'human_fighter');
  const armEquip = options.armaduraEquipada;
  const armaEquip = options.armaEquipadaBase;
  const syncProfileGlows = options.syncProfileGlows !== false;
  const syncWeaponGlow = options.syncWeaponGlow !== false;
  const force = options.force === true;

  const host = root instanceof HTMLElement ? (root as PaperdollRootEl) : null;
  const refreshSig = _paperdollRefreshSignature(String(presetId), armEquip, armaEquip);
  if (!force && host && host._pdRefreshSig === refreshSig) {
    // Still refresh glow (cheap) so algorithm tweaks apply without changing equip.
    if (syncWeaponGlow) {
      _applyPaperdollWeaponGlow(root, _getPaperdollLayer(root, 'weapon'), armaEquip);
    }
    if (syncProfileGlows && typeof window.syncProfileEquipmentSlotGlows === 'function') {
      window.syncProfileEquipmentSlotGlows();
    }
    return;
  }
  if (host) host._pdRefreshSig = refreshSig;
  if (host) host._pdLastWeaponItem = armaEquip ?? null;

  if (root && typeof window.applyPaperdollConfig === 'function') {
    window.applyPaperdollConfig(root as HTMLElement, undefined, { presetId: String(presetId) });
  } else if (typeof window.applyPaperdollConfigAll === 'function') {
    window.applyPaperdollConfigAll();
  }

  const layerBase = _getPaperdollLayer(root, 'base');
  if (layerBase) {
    const bodyList =
      typeof window.getPaperdollBodySrcList === 'function'
        ? window.getPaperdollBodySrcList(String(presetId))
        : ['assets/chars/base_fighter.png'];
    layerBase.onerror = null;
    setPaperdollLayerSrcChain(layerBase, bodyList, () => {
      console.warn('[paperdoll] Falta body.png 1080×984 em assets/paperdolls/' + presetId + '/');
      setPaperdollLayerVisible(layerBase, false);
    });
    setPaperdollLayerVisible(layerBase, true);
  }

  const layerArmor = _getPaperdollLayer(root, 'armor');
  const armorCatalogId = resolveEquipCatalogId(armEquip);
  if (armEquip && armorCatalogId && layerArmor) {
    const armorList =
      typeof window.getPaperdollEquipSrcList === 'function'
        ? window.getPaperdollEquipSrcList(String(presetId), armorCatalogId)
        : ['assets/equips/' + armorCatalogId + '.png'];
    layerArmor.onerror = null;
    setPaperdollLayerSrcChain(layerArmor, armorList, () => {
      console.warn(
        '[paperdoll] Armadura equipada (id="' +
          armorCatalogId +
          '") sem PNG no preset. ' +
          'Coloca assets/paperdolls/' +
          presetId +
          '/equips/' +
          armorCatalogId +
          '.png (1080×984).',
      );
      setPaperdollLayerVisible(layerArmor, false);
    });
    setPaperdollLayerVisible(layerArmor, true);
  } else if (layerArmor) {
    setPaperdollLayerVisible(layerArmor, false);
  }

  const layerWeapon = _getPaperdollLayer(root, 'weapon');
  const layerWeaponGrip = _getPaperdollLayer(root, 'weaponGrip');
  const layerGlow = _getPaperdollLayer(root, 'weaponGlow');
  let weaponReady = false;
  let weaponCatalogId = '';

  if (armaEquip && layerWeapon) {
    const wCat = armaEquip.base;
    const imgStr = wCat.img && String(wCat.img).trim();
    weaponCatalogId = wCat.id ? String(wCat.id) : '';
    const weaponList: string[] = [];
    if (typeof window.getPaperdollEquipSrcList === 'function' && weaponCatalogId) {
      weaponList.push(...window.getPaperdollEquipSrcList(String(presetId), weaponCatalogId));
    } else if (weaponCatalogId) {
      weaponList.push('assets/equips/' + weaponCatalogId + '.png');
    }
    if (imgStr) {
      weaponList.push(imgStr);
    }
    if (weaponList.length) {
      layerWeapon.onerror = null;
      setPaperdollLayerSrcChain(layerWeapon, weaponList, () => {
        setPaperdollLayerVisible(layerWeapon, false);
      });
      setPaperdollLayerVisible(layerWeapon, true);
      weaponReady = !layerWeapon.hasAttribute('hidden');
      if (typeof window.syncPaperdollFistWeaponLayerClass === 'function') {
        window.syncPaperdollFistWeaponLayerClass(layerWeapon, armaEquip);
      }
    } else {
      setPaperdollLayerVisible(layerWeapon, false);
      if (typeof window.syncPaperdollFistWeaponLayerClass === 'function') {
        window.syncPaperdollFistWeaponLayerClass(layerWeapon, null);
      }
    }
  } else if (layerWeapon) {
    setPaperdollLayerVisible(layerWeapon, false);
    if (typeof window.syncPaperdollFistWeaponLayerClass === 'function') {
      window.syncPaperdollFistWeaponLayerClass(layerWeapon, null);
    }
  }

  if (layerWeaponGrip) {
    if (weaponReady && weaponCatalogId) {
      const gripList =
        typeof window.getPaperdollWeaponGripSrcList === 'function'
          ? window.getPaperdollWeaponGripSrcList(String(presetId), weaponCatalogId)
          : [];
      if (gripList.length) {
        layerWeaponGrip.onerror = null;
        setPaperdollLayerSrcChain(layerWeaponGrip, gripList, () => {
          setPaperdollLayerVisible(layerWeaponGrip, false);
        });
        setPaperdollLayerVisible(layerWeaponGrip, true);
      } else {
        layerWeaponGrip.onerror = null;
        setPaperdollLayerVisible(layerWeaponGrip, false);
      }
    } else {
      layerWeaponGrip.onerror = null;
      setPaperdollLayerVisible(layerWeaponGrip, false);
    }
  }

  if (layerGlow) {
    setPaperdollLayerVisible(layerGlow, false);
  }
  const rebuildFx = _getPaperdollWeaponFx(root);
  if (rebuildFx.sheen) {
    setPaperdollLayerVisible(rebuildFx.sheen, false);
  }
  if (rebuildFx.sparks) {
    rebuildFx.sparks.hidden = true;
    rebuildFx.sparks.setAttribute('hidden', '');
  }

  const layerHands = _getPaperdollLayer(root, 'hands');
  if (layerHands) {
    const armorHandsId = resolveEquipCatalogId(armEquip);
    let handsList: string[] = [];
    let handsFailHint = '';

    if (weaponReady && armorHandsId) {
      handsList =
        typeof window.getPaperdollArmorHandsSrcList === 'function'
          ? window.getPaperdollArmorHandsSrcList(String(presetId), armorHandsId)
          : [];
      handsFailHint =
        'Coloca assets/paperdolls/' +
        presetId +
        '/equips/' +
        armorHandsId +
        '_hands.png (1080×984).';
    } else if (
      weaponReady &&
      !armorHandsId &&
      typeof window.paperdollPresetHasBareHands === 'function' &&
      window.paperdollPresetHasBareHands(String(presetId))
    ) {
      handsList =
        typeof window.getPaperdollBareHandsSrcList === 'function'
          ? window.getPaperdollBareHandsSrcList(String(presetId))
          : [];
      handsFailHint =
        'Coloca assets/paperdolls/' + presetId + '/hands.png (1080×984) — mãos nuas sem armadura.';
    }

    if (handsList.length) {
      layerHands.onerror = null;
      setPaperdollLayerSrcChain(layerHands, handsList, () => {
        console.warn('[paperdoll] Camada de mãos indisponível. ' + handsFailHint);
        setPaperdollLayerVisible(layerHands, false);
      });
      setPaperdollLayerVisible(layerHands, true);
    } else {
      layerHands.onerror = null;
      setPaperdollLayerVisible(layerHands, false);
    }
  }

  if (syncWeaponGlow) {
    _applyPaperdollWeaponGlow(root, layerWeapon, armaEquip);
  }

  if (syncProfileGlows && typeof window.syncProfileEquipmentSlotGlows === 'function') {
    window.syncProfileEquipmentSlotGlows();
  }

  bindPaperdollFootShadowListeners();
  schedulePaperdollFootShadowSyncWithRetries();
}

function getGlowClass(lvl: number): string {
  if (lvl >= 25) return 'glow-25';
  if (lvl == 24) return 'glow-24';
  if (lvl == 23) return 'glow-23';
  if (lvl == 22) return 'glow-22';
  if (lvl == 21) return 'glow-21';
  if (lvl == 20) return 'glow-20';
  if (lvl >= 16) return 'glow-yellow';
  if (lvl >= 11) return 'glow-green';
  if (lvl >= 7) return 'glow-red';
  if (lvl >= 4) return 'glow-blue';
  return '';
}

/** Slot/bag glow class for enchant tier (same palette as paperdoll). */
window.getEnchantGlowClass = function (lvl: number | string): string {
  let l = parseInt(String(lvl), 10);
  if (!Number.isFinite(l) || l < 0) l = 0;
  return getGlowClass(l);
};

/** Cor do tier do encantamento (paperdoll + slots do perfil). */
window.getEnchantTierGlowColor = function (lvl: number | string): string {
  let l = parseInt(String(lvl), 10);
  if (!Number.isFinite(l) || l < 0) l = 0;
  let color = '#e2e8f0';
  if (l >= 4 && l <= 6) color = '#1d4ed8';
  else if (l >= 7 && l <= 10) color = '#991b1b';
  else if (l >= 11 && l <= 15) color = '#4ade80';
  else if (l >= 16 && l <= 19) color = '#facc15';
  else if (l === 20) color = '#fb923c';
  else if (l === 21) color = '#c084fc';
  else if (l === 22) color = '#22d3ee';
  else if (l === 23) color = '#f472b6';
  else if (l === 24) color = '#f8fafc';
  else if (l >= 25) color = '#facc15';
  return color;
};

/** Duração de um ciclo do pulso (igual à arma do paperdoll). */
window.getEnchantPulseSpeedSeconds = function (lvl: number | string): number {
  let l = parseInt(String(lvl), 10);
  if (!Number.isFinite(l) || l < 0) l = 0;
  let speed = 2.4 - l * 0.08;
  if (speed < 0.4) speed = 0.4;
  return speed;
};

function _parseEnchantLevelForProfile(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

let _PROFILE_SLOT_GLOW_SIG = '';

function _stripLegacySlotGlowClasses(el: HTMLElement): void {
  if (!el || !el.classList) return;
  el.classList.remove(
    'glow-blue',
    'glow-red',
    'glow-green',
    'glow-yellow',
    'glow-20',
    'glow-21',
    'glow-22',
    'glow-23',
    'glow-24',
    'glow-25',
  );
}

function clearProfileSlotEnchantGlow(el: HTMLElement | null): void {
  if (!el) return;
  _stripLegacySlotGlowClasses(el);
  el.classList.remove('profile-slot-enchant-glow', 'profile-slot-enchant-divino');
  el.style.animation = 'none';
  el.style.removeProperty('--profile-slot-glow');
  el.style.removeProperty('--profile-slot-core');
  el.style.removeProperty('--profile-slot-soft');
  el.style.removeProperty('--profile-slot-mul');
  el.style.removeProperty('--profile-slot-speed');
}

function applyProfileSlotEnchantGlow(el: HTMLElement | null, lvl: number): void {
  clearProfileSlotEnchantGlow(el);
  if (!el) return;
  const l = _parseEnchantLevelForProfile(lvl);
  if (l < 4) return;
  const sp = window.getEnchantPulseSpeedSeconds(l);
  el.style.setProperty('--profile-slot-speed', sp + 's');
  if (l >= 25) {
    el.classList.add('profile-slot-enchant-divino');
    return;
  }
  const color = window.getEnchantTierGlowColor(l);
  let tierLinear = (l - 4) / 20;
  if (tierLinear < 0) tierLinear = 0;
  if (tierLinear > 1) tierLinear = 1;
  // Match weapon curve: low enchant subtle, high enchant clearly larger aura.
  const intensity = 0.45 + 1.55 * Math.pow(tierLinear, 0.85);
  el.classList.add('profile-slot-enchant-glow');
  el.style.setProperty('--profile-slot-glow', color);
  el.style.setProperty('--profile-slot-core', paperdollWeaponGlowCore(color));
  el.style.setProperty('--profile-slot-soft', paperdollWeaponGlowSoft(color, 0.35 + 0.45 * Math.min(1, intensity / 2)));
  el.style.setProperty('--profile-slot-mul', String(intensity));
}

/** Slots do perfil: cada um brilha só pelo seu próprio encantamento. */
window.syncProfileEquipmentSlotGlows = function (): void {
  const w = typeof window !== 'undefined' ? window : ({} as Window);
  let wEnc = 0;
  if (typeof w.armaEquipadaBase !== 'undefined' && w.armaEquipadaBase) {
    wEnc = _parseEnchantLevelForProfile(w.armaEquipadaBase.enchant);
  } else if (typeof w.enchant !== 'undefined') {
    wEnc = _parseEnchantLevelForProfile(w.enchant);
  }
  let aEnc = 0;
  if (typeof w.armaduraEquipada !== 'undefined' && w.armaduraEquipada) {
    aEnc = _parseEnchantLevelForProfile(w.armaduraEquipada.enchant);
  } else if (typeof w.enchantArmor !== 'undefined') {
    aEnc = _parseEnchantLevelForProfile(w.enchantArmor);
  }
  function jewelEnc(full: ProfileJewelEquip | null | undefined): number {
    if (!full) return 0;
    let v: unknown = full.enchant;
    if (v === undefined || v === null || v === '') v = full.enchantJewel;
    return _parseEnchantLevelForProfile(v);
  }
  const n = jewelEnc(w.colarEquipado as ProfileJewelEquip | undefined);
  const e1 = jewelEnc(w.brincoEquipado1 as ProfileJewelEquip | undefined);
  const e2 = jewelEnc(w.brincoEquipado2 as ProfileJewelEquip | undefined);
  const r1 = jewelEnc(w.anelEquipado1 as ProfileJewelEquip | undefined);
  const r2 = jewelEnc(w.anelEquipado2 as ProfileJewelEquip | undefined);
  const sig =
    'v3|' +
    (typeof w.charName === 'string' ? w.charName : '') +
    '|' +
    [wEnc, aEnc, n, e1, e2, r1, r2].join('|');
  if (sig === _PROFILE_SLOT_GLOW_SIG) {
    if (typeof w.syncProfileHarmonyBadge === 'function') w.syncProfileHarmonyBadge();
    return;
  }
  _PROFILE_SLOT_GLOW_SIG = sig;

  applyProfileSlotEnchantGlow(document.getElementById('profile-slot-weapon'), wEnc);
  applyProfileSlotEnchantGlow(document.getElementById('slot-armor-perfil'), aEnc);
  applyProfileSlotEnchantGlow(document.getElementById('slot-neck-perfil'), n);
  applyProfileSlotEnchantGlow(document.getElementById('slot-ear1-perfil'), e1);
  applyProfileSlotEnchantGlow(document.getElementById('slot-ear2-perfil'), e2);
  applyProfileSlotEnchantGlow(document.getElementById('slot-ring1-perfil'), r1);
  applyProfileSlotEnchantGlow(document.getElementById('slot-ring2-perfil'), r2);

  if (typeof w.syncProfileHarmonyBadge === 'function') w.syncProfileHarmonyBadge();
};

/** Card Harmony no perfil: brilha só aqui (tier do enchant mais baixo); toque abre o modal. */
window.syncProfileHarmonyBadge = function (): void {
  const el = document.getElementById('profile-harmony-badge');
  if (!el) return;
  const titleEl = document.getElementById('profile-harmony-title');
  const subEl = document.getElementById('profile-harmony-sub');

  let complete = false;
  let active = false;
  let level = 0;
  let pct = 0;
  try {
    if (typeof window.resolveEquipHarmony === 'function') {
      const h = window.resolveEquipHarmony();
      complete = !!(h && h.complete);
      active = !!(h && h.active && h.pct > 0);
      level = Math.max(0, Math.floor(Number(h?.level) || 0));
      pct = Math.max(0, Math.floor(Number(h?.pct) || 0));
    }
  } catch {
    /* ignore */
  }

  el.classList.remove(
    'profile-harmony-card--on',
    'profile-harmony-card--idle',
    'profile-harmony-badge--glow',
    'profile-slot-enchant-glow',
    'profile-slot-enchant-divino',
  );
  el.style.removeProperty('--profile-slot-glow');
  el.style.removeProperty('--profile-slot-core');
  el.style.removeProperty('--profile-slot-soft');
  el.style.removeProperty('--profile-slot-mul');
  el.style.removeProperty('--profile-slot-speed');
  el.style.removeProperty('--harmony-glow');
  el.style.animation = 'none';

  const tFn = typeof window.t === 'function' ? window.t : null;
  const L = (k: string, fb: string, params?: Record<string, string | number>) => {
    if (!tFn) return fb;
    try {
      const v = tFn('game.inventoryUi.harmony.' + k, params || {});
      if (v && v !== 'game.inventoryUi.harmony.' + k) return v;
    } catch {
      /* ignore */
    }
    return fb;
  };

  el.hidden = false;
  const hint = L('hint', 'Tap for details.');
  el.setAttribute('title', hint);
  el.setAttribute('aria-label', hint);

  if (active && pct > 0) {
    el.classList.add('profile-harmony-card--on');
    if (titleEl) titleEl.textContent = L('cardActiveTitle', '+{level} active', { level: String(level) });
    if (subEl) subEl.textContent = L('cardActiveSub', '+{pct}% to combat stats · tap to learn more', { pct: String(pct) });

    const sp = typeof window.getEnchantPulseSpeedSeconds === 'function'
      ? window.getEnchantPulseSpeedSeconds(level)
      : 2;
    el.style.setProperty('--profile-slot-speed', sp + 's');
    if (level >= 25) {
      el.classList.add('profile-slot-enchant-divino');
      return;
    }
    const color = typeof window.getEnchantTierGlowColor === 'function'
      ? window.getEnchantTierGlowColor(level)
      : '#1d4ed8';
    let tierLinear = (level - 4) / 20;
    if (tierLinear < 0) tierLinear = Math.max(0, level / 4) * 0.35;
    if (tierLinear > 1) tierLinear = 1;
    const intensity = level < 4
      ? 0.55 + 0.1 * level
      : 0.7 + 0.85 * Math.pow(tierLinear, 1.18);
    el.classList.add('profile-slot-enchant-glow');
    el.style.setProperty('--harmony-glow', color);
    el.style.setProperty('--profile-slot-glow', color);
    el.style.setProperty('--profile-slot-core', paperdollWeaponGlowCore(color));
    el.style.setProperty('--profile-slot-soft', paperdollWeaponGlowSoft(color, 0.4 + 0.3 * Math.min(1, intensity - 0.4)));
    el.style.setProperty('--profile-slot-mul', String(intensity));
    return;
  }

  el.classList.add('profile-harmony-card--idle');
  el.style.setProperty('--harmony-glow', '#64748b');
  if (complete && level === 0) {
    if (titleEl) titleEl.textContent = L('cardZeroTitle', 'Set complete · +0');
    if (subEl) subEl.textContent = L('cardZeroSub', 'Enchant every piece to at least +1 · tap to learn');
  } else {
    if (titleEl) titleEl.textContent = L('cardIdleTitle', 'Not active yet');
    if (subEl) subEl.textContent = L('cardIdleSub', 'Equip a full set to awaken Harmony · tap to learn');
  }
};

let _pdFootShadowRaf = 0;
const _pdFeetScanCache: Record<string, PaperdollFeetScan> = Object.create(null) as Record<
  string,
  PaperdollFeetScan
>;

function _paperdollCfg(): PaperdollConfig {
  return typeof window.PAPERDOLL_CONFIG !== 'undefined' && window.PAPERDOLL_CONFIG
    ? window.PAPERDOLL_CONFIG
    : ({} as PaperdollConfig);
}

const _pdLayerWarned = new Set<string>();

/** Valida 1080×984; corpo inválido fica oculto (evita mago_m 1000² gigante no palco). */
function _validatePaperdollLayerCanvas(
  imgEl: HTMLImageElement | null,
  label: string,
  opts?: { hideOnFail?: boolean },
): boolean {
  if (!imgEl || !imgEl.complete || _isPaperdollBlankLayer(imgEl)) return false;
  if (!_isPaperdollRenderableLayer(imgEl)) return true;
  const art = _paperdollCfg().art;
  if (!art || !art.masterWidth) return true;
  const nw = imgEl.naturalWidth;
  const nh = imgEl.naturalHeight;
  if (!nw || !nh) return false;
  const ok =
    typeof window.isPaperdollMasterCanvasSize === 'function'
      ? window.isPaperdollMasterCanvasSize(nw, nh)
      : nw === art.masterWidth && nh === art.masterHeight;
  if (ok) return true;
  const preset =
    typeof window.resolvePaperdollPresetId === 'function' ? window.resolvePaperdollPresetId() : '?';
  const warnKey = preset + '|' + (label || imgEl.id || 'layer') + '|' + nw + 'x' + nh;
  if (!_pdLayerWarned.has(warnKey)) {
    _pdLayerWarned.add(warnKey);
    console.warn(
      '[paperdoll] ' +
        (label || imgEl.id || 'layer') +
        ' (' +
        preset +
        '): precisa ' +
        art.masterWidth +
        '×' +
        art.masterHeight +
        ', veio ' +
        nw +
        '×' +
        nh +
        '. Coloca PNG em assets/paperdolls/' +
        preset +
        '/ — ' +
        (imgEl.src || ''),
    );
  }
  if (opts && opts.hideOnFail) setPaperdollLayerVisible(imgEl, false);
  return false;
}

function _invalidateFeetScanCacheForImg(img: HTMLImageElement): void {
  if (!img || !img.src) return;
  const src = img.src;
  Object.keys(_pdFeetScanCache).forEach((key) => {
    if (key.indexOf(src) === 0) delete _pdFeetScanCache[key];
  });
}

/** Pés = faixa opaca inferior do PNG (independente de padding transparente no arquivo) */
function _scanPaperdollFeetAlpha(imgEl: HTMLImageElement | null): PaperdollFeetScan | null {
  if (!imgEl || !imgEl.complete || !imgEl.naturalWidth) return null;
  const cacheKey =
    imgEl.src + '|' + imgEl.naturalWidth + 'x' + imgEl.naturalHeight + '|canvas-v5';
  if (_pdFeetScanCache[cacheKey]) return _pdFeetScanCache[cacheKey]!;

  const nw = imgEl.naturalWidth;
  const nh = imgEl.naturalHeight;
  const cfg = _paperdollCfg();
  const maxW = cfg.feetScanMaxWidth || 280;
  const cw = nw > maxW ? maxW : nw;
  const ch = Math.max(1, Math.round(nh * (cw / nw)));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(imgEl, 0, 0, cw, ch);
  } catch {
    return null;
  }

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    return null;
  }

  const alphaMin = cfg.feetAlphaMin || 28;
  let bottomY = -1;
  for (let y = ch - 1; y >= 0; y--) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3]! >= alphaMin) {
        bottomY = y;
        break;
      }
    }
    if (bottomY >= 0) break;
  }
  if (bottomY < 0) return null;

  const bandRatio = cfg.feetBandHeightRatio != null ? cfg.feetBandHeightRatio : 0.028;
  const bandH = Math.max(1, Math.round(ch * bandRatio));
  const bandTop = Math.max(0, bottomY - bandH + 1);
  let minX = cw;
  let maxX = -1;
  for (let y = bandTop; y <= bottomY; y++) {
    for (let x = 0; x < cw; x++) {
      if (data[(y * cw + x) * 4 + 3]! >= alphaMin) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < minX) return null;

  const solesY = bandTop + (bottomY - bandTop) * 0.55;
  const footBottomNorm = solesY / ch;
  const scan: PaperdollFeetScan = {
    footBottomNorm,
    footLeftNorm: minX / cw,
    footRightNorm: (maxX + 1) / cw,
    feetFromBottomNorm: 1 - footBottomNorm,
    footCenterNorm: (minX / cw + (maxX + 1) / cw) * 0.5,
    footWidthNorm: (maxX + 1) / cw - minX / cw,
  };
  _pdFeetScanCache[cacheKey] = scan;
  return scan;
}

function _isPaperdollFeetLayer(imgEl: Element | null): imgEl is HTMLImageElement {
  if (!imgEl || !(imgEl instanceof HTMLImageElement) || imgEl.hasAttribute('hidden')) return false;
  const role = imgEl.getAttribute('data-pd-layer');
  if (role !== 'base' && role !== 'armor') {
    if (imgEl.id !== 'char-base-layer' && imgEl.id !== 'char-armor-layer') return false;
  }
  if (_isPaperdollBlankLayer(imgEl)) return false;
  return true;
}

function _findPaperdollFootShadowEl(stack: Element | null): HTMLElement | null {
  if (!stack) return null;
  const el = stack.querySelector('.paperdoll-foot-shadow');
  return el instanceof HTMLElement ? el : null;
}

function _paperdollShadowHalfHeightNorm(cfg?: PaperdollConfig): number {
  const c = cfg || _paperdollCfg();
  if (c.footShadowHeightNorm != null) return c.footShadowHeightNorm * 0.5;
  const mh = (c.art && c.art.masterHeight) || 984;
  const h = c.footShadowHeightPx != null ? c.footShadowHeightPx : 14;
  return (h / mh) * 0.5;
}

function _paperdollLayoutFromBase(stack: Element | null): PaperdollLayoutNorm | null {
  const base = stack?.querySelector('[data-pd-layer="base"], #char-base-layer, .char-base-layer');
  if (!(base instanceof HTMLImageElement) || !_isPaperdollFeetLayer(base)) return null;
  const scan = _scanPaperdollFeetAlpha(base);
  const cfg = _paperdollCfg();
  const mw = (cfg.art && cfg.art.masterWidth) || 1080;
  const mh = (cfg.art && cfg.art.masterHeight) || 984;
  const a = cfg.artAnchors;
  if (scan && scan.feetFromBottomNorm != null) {
    return {
      feetFromBottomNorm: scan.feetFromBottomNorm,
      footCenterNorm: scan.footCenterNorm,
      footWidthNorm: scan.footWidthNorm,
    };
  }
  const feetY = a?.feetY != null ? a.feetY : mh;
  return {
    feetFromBottomNorm: (mh - feetY) / mh,
    footCenterNorm: (a?.feetX != null ? a.feetX : mw * 0.5) / mw,
    footWidthNorm: 0.2,
  };
}

function _paperdollLayoutKey(base: HTMLImageElement | null, layout: PaperdollLayoutNorm): string {
  if (!base || !layout) return '';
  return (
    (base.src || '') +
    '|' +
    layout.feetFromBottomNorm.toFixed(5) +
    '|' +
    layout.footCenterNorm.toFixed(5) +
    '|' +
    layout.footWidthNorm.toFixed(5)
  );
}

/** Posição só com normas do canvas 1080×984 — sombra em %; personagem fixo no stack (sem translate de alinhamento). */
function _applyPaperdollStackLayout(stack: PaperdollStackEl, layout: PaperdollLayoutNorm): void {
  if (!stack || !layout) return;
  const cfg = _paperdollCfg();
  const mw = (cfg.art && cfg.art.masterWidth) || 1080;
  const widthBoost = cfg.footShadowWidthBoost != null ? cfg.footShadowWidthBoost : 1.02;
  const widthPadNorm = (cfg.footShadowWidthPadPx != null ? cfg.footShadowWidthPadPx : 8) / mw;
  const bias = cfg.footShadowGroundBiasNorm != null ? cfg.footShadowGroundBiasNorm : 0;
  let wPct = (layout.footWidthNorm * widthBoost + widthPadNorm) * 100;
  const centerPct = layout.footCenterNorm * 100;
  const bottomPct = (layout.feetFromBottomNorm - _paperdollShadowHalfHeightNorm(cfg) + bias) * 100;
  _paintPaperdollFootShadow(stack, wPct, centerPct, bottomPct);
}

/** Oval nos pés — % do stack (padrão v1: PAPERDOLL_CONFIG + PAPERDOLL_FOOT_SHADOW_STANDARD) */
function _paintPaperdollFootShadow(
  stack: Element,
  wPct: number,
  centerPct: number,
  bottomPct: number,
): void {
  const footEl = _findPaperdollFootShadowEl(stack);
  if (!footEl || !stack) return;

  const cfg = _paperdollCfg();
  const wMin = cfg.footShadowWidthMinPct != null ? cfg.footShadowWidthMinPct : 18;
  const wMax = cfg.footShadowWidthMaxPct != null ? cfg.footShadowWidthMaxPct : 52;
  wPct = Math.max(wMin, Math.min(wMax, wPct));
  centerPct = Math.max(12, Math.min(88, centerPct));
  bottomPct = Math.max(0, Math.min(48, bottomPct));

  footEl.classList.add('paperdoll-foot-shadow--live');
  footEl.style.display = 'block';
  footEl.style.visibility = 'visible';
  footEl.style.opacity = '1';
  footEl.style.width = wPct.toFixed(3) + '%';
  footEl.style.left = centerPct.toFixed(3) + '%';
  footEl.style.bottom = bottomPct.toFixed(3) + '%';
}

function _hasVisiblePaperdollFeetSource(stack: Element | null): boolean {
  if (!stack) return false;
  const base = stack.querySelector('[data-pd-layer="base"], #char-base-layer, .char-base-layer');
  if (!(base instanceof HTMLImageElement) || base.hasAttribute('hidden')) return false;
  if (_isPaperdollBlankLayer(base)) return false;
  return true;
}

function _applyPaperdollFootShadowDefault(stack: PaperdollStackEl): void {
  const layout = _paperdollLayoutFromBase(stack);
  if (layout) _applyPaperdollStackLayout(stack, layout);
}

function _resetPaperdollFootShadow(stack: PaperdollStackEl | null): void {
  if (stack) stack._pdFootLayoutKey = '';
  const footEl = _findPaperdollFootShadowEl(stack);
  if (!footEl) return;
  footEl.classList.remove('paperdoll-foot-shadow--live');
  footEl.style.display = '';
  footEl.style.opacity = '';
  footEl.style.width = '';
  footEl.style.left = '';
  footEl.style.bottom = '';
  footEl.style.transform = '';
}

function bindPaperdollFootShadowListeners(): void {
  const roots = document.querySelectorAll('.l2-paperdoll');
  for (let r = 0; r < roots.length; r++) {
    const root = roots[r] as PaperdollHostEl | null;
    if (!root || root._pdFootShadowBound) continue;
    root._pdFootShadowBound = true;

    const layers = root.querySelectorAll('.char-layer');
    for (let i = 0; i < layers.length; i++) {
      layers[i]!.addEventListener('load', function (this: HTMLImageElement) {
        if (_isPaperdollFeetLayer(this)) {
          _invalidateFeetScanCacheForImg(this);
        }
        _handlePaperdollLayerLoad(this);
      });
    }
  }
}

/** Sombra nos pés via normas do canvas — só recalcula quando muda o body/equip. */
window.syncPaperdollFootShadow = function (): void {
  const stacks = document.querySelectorAll('.l2-paperdoll .paperdoll-character-stack');
  for (let s = 0; s < stacks.length; s++) {
    const stack = stacks[s] as PaperdollStackEl | null;
    if (!stack) continue;
    const host = stack.closest('.l2-paperdoll');
    // Mini class-transfer slots use fixed CSS layout — skip foot-scan reflow.
    if (host && host.classList.contains('l2-paperdoll--class-transfer')) continue;
    if (!_hasVisiblePaperdollFeetSource(stack)) {
      _resetPaperdollFootShadow(stack);
      continue;
    }
    const base = stack.querySelector('[data-pd-layer="base"], #char-base-layer, .char-base-layer');
    const layout = _paperdollLayoutFromBase(stack);
    if (!layout) {
      _applyPaperdollFootShadowDefault(stack);
      continue;
    }
    const layoutKey = _paperdollLayoutKey(base instanceof HTMLImageElement ? base : null, layout);
    if (stack._pdFootLayoutKey === layoutKey) continue;
    stack._pdFootLayoutKey = layoutKey;
    _applyPaperdollStackLayout(stack, layout);
  }
};

function schedulePaperdollFootShadowSync(): void {
  if (_pdFootShadowRaf) cancelAnimationFrame(_pdFootShadowRaf);
  _pdFootShadowRaf = requestAnimationFrame(() => {
    _pdFootShadowRaf = requestAnimationFrame(() => {
      _pdFootShadowRaf = 0;
      if (typeof window.syncPaperdollFootShadow === 'function') {
        window.syncPaperdollFootShadow();
      }
    });
  });
}

function schedulePaperdollFootShadowSyncWithRetries(): void {
  schedulePaperdollFootShadowSync();
  setTimeout(schedulePaperdollFootShadowSync, 100);
  setTimeout(schedulePaperdollFootShadowSync, 400);
}

window.schedulePaperdollFootShadowSyncWithRetries = schedulePaperdollFootShadowSyncWithRetries;

window.atualizarVisualPaperdoll = function (): void {
  const root = document.querySelector('.l2-paperdoll--profile');
  _refreshPaperdollRoot(root, {
    presetId:
      typeof window.resolvePaperdollPresetId === 'function'
        ? window.resolvePaperdollPresetId()
        : 'human_fighter',
    armaduraEquipada: window.armaduraEquipada,
    armaEquipadaBase: window.armaEquipadaBase,
    syncProfileGlows: true,
    syncWeaponGlow: true,
  });
};

function _coercePaperdollEquip(
  item: EquipInstance | ItemCatalogBase | null | undefined,
  kind: 'armor' | 'weapon',
): EquipInstance | ItemCatalogBase | null {
  if (item == null) return null;
  let eq: unknown = item;
  if (typeof window.coerceInspectEquipItem === 'function') {
    eq = window.coerceInspectEquipItem(eq, kind);
  }
  if (eq && typeof window.enrichEquipBaseFromCatalogIfNeeded === 'function') {
    eq = window.enrichEquipBaseFromCatalogIfNeeded(eq);
  }
  return (eq as EquipInstance | ItemCatalogBase) || null;
}

function _refreshPaperdollFromCharData(
  root: Element | null,
  charData: PaperdollCharSelectData | null | undefined,
  opts?: { force?: boolean },
): void {
  if (!root || !charData) return;

  const race = charData.charRace || 'Human';
  const charClass = charData.charClass || '';
  const gender = charData.charGender || 'Male';
  const presetId =
    typeof window.resolvePaperdollPresetIdFor === 'function'
      ? window.resolvePaperdollPresetIdFor(race, charClass, gender)
      : 'human_fighter';

  _refreshPaperdollRoot(root, {
    presetId,
    armaduraEquipada: _coercePaperdollEquip(charData.armaduraEquipada ?? null, 'armor') as EquipInstance | null,
    armaEquipadaBase: _coercePaperdollEquip(charData.armaEquipadaBase ?? null, 'weapon') as EquipInstance | null,
    syncProfileGlows: false,
    syncWeaponGlow: true,
    force: opts?.force === true,
  });

  if (typeof window.schedulePaperdollFootShadowSyncWithRetries === 'function') {
    window.schedulePaperdollFootShadowSyncWithRetries();
  }
}

window.atualizarPaperdollCharSelect = function (charData: PaperdollCharSelectData): void {
  const root = document.querySelector('.char-hero-showcase .l2-paperdoll--char-select');
  _refreshPaperdollFromCharData(root, charData, { force: true });
};

/** Dress any `.l2-paperdoll` root (inspect modal / zoom) with race+class+gender and gear. */
window.atualizarPaperdollInspect = function (
  rootOrSelector: Element | string | null | undefined,
  charData: PaperdollCharSelectData,
): void {
  const root =
    typeof rootOrSelector === 'string'
      ? document.querySelector(rootOrSelector)
      : rootOrSelector || null;
  _refreshPaperdollFromCharData(root, charData, { force: true });
};

function bindPaperdollFootShadowVisibilityObserver(): void {
  if (window._pdFootShadowVisBound) return;
  window._pdFootShadowVisBound = true;
  const perfil = document.getElementById('tela-perfil');
  if (!perfil || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver(
    (entries) => {
      for (let i = 0; i < entries.length; i++) {
        if (entries[i]!.isIntersecting) schedulePaperdollFootShadowSyncWithRetries();
      }
    },
    { threshold: 0.05 },
  );
  io.observe(perfil);
}

(function initPaperdollFootShadowBoot() {
  function boot(): void {
    bindPaperdollFootShadowListeners();
    bindPaperdollFootShadowVisibilityObserver();
    schedulePaperdollFootShadowSyncWithRetries();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

function paperdollWeaponGlowSoft(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return 'rgba(242, 230, 213, ' + alpha + ')';
  return (
    'rgba(' +
    parseInt(m[1]!, 16) +
    ',' +
    parseInt(m[2]!, 16) +
    ',' +
    parseInt(m[3]!, 16) +
    ',' +
    alpha +
    ')'
  );
}

/** Hot edge for weapon aura — same hue, lifted toward white for readable weight. */
function paperdollWeaponGlowCore(hex: string): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return '#fff8e7';
  const r = parseInt(m[1]!, 16);
  const g = parseInt(m[2]!, 16);
  const b = parseInt(m[3]!, 16);
  const lift = 0.42;
  const toHex = (n: number) => {
    const v = Math.max(0, Math.min(255, Math.round(n + (255 - n) * lift)));
    return v.toString(16).padStart(2, '0');
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

window.atualizarBrilhoArma = function (): void {
  const root = document.querySelector('.l2-paperdoll--profile');
  _applyPaperdollWeaponGlow(
    root,
    _getPaperdollLayer(root, 'weapon'),
    typeof window.armaEquipadaBase !== 'undefined' ? window.armaEquipadaBase : null,
  );
};

export {};
