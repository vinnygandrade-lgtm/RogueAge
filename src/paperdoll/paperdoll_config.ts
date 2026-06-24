/**
 * Paperdoll — configuração global + pastas por preset
 * Arte mestre: 1080×984 — ver docs/paperdoll-art-spec.md
 */
import type {
  EquipInstance,
  PaperdollConfig,
  PaperdollPresetId,
} from '../types/game';

const PAPERDOLL_ART = {
  masterWidth: 1080,
  masterHeight: 984,
  displayWidth: 360,
  displayHeight: 328,
  scale: 3,
  aspectRatio: '360 / 328',
} as const;

const PAPERDOLL_PRESETS_ROOT = 'assets/paperdolls';

const PAPERDOLL_PRESET_META: Record<
  PaperdollPresetId,
  { race: string; archetype: string; gender: string }
> = {
  human_fighter: { race: 'Human', archetype: 'fighter', gender: 'Male' },
  human_fighter_female: { race: 'Human', archetype: 'fighter', gender: 'Female' },
  human_mage: { race: 'Human', archetype: 'mage', gender: 'Male' },
  human_mage_female: { race: 'Human', archetype: 'mage', gender: 'Female' },
  dark_elf_fighter: { race: 'Dark Elf', archetype: 'fighter', gender: 'Male' },
  dark_elf_fighter_female: { race: 'Dark Elf', archetype: 'fighter', gender: 'Female' },
  dark_elf_mage: { race: 'Dark Elf', archetype: 'mage', gender: 'Male' },
  dark_elf_mage_female: { race: 'Dark Elf', archetype: 'mage', gender: 'Female' },
  elf_fighter: { race: 'Elf', archetype: 'fighter', gender: 'Male' },
  elf_fighter_female: { race: 'Elf', archetype: 'fighter', gender: 'Female' },
  elf_mage: { race: 'Elf', archetype: 'mage', gender: 'Male' },
  elf_mage_female: { race: 'Elf', archetype: 'mage', gender: 'Female' },
  orc_fighter: { race: 'Orc', archetype: 'fighter', gender: 'Male' },
  orc_fighter_female: { race: 'Orc', archetype: 'fighter', gender: 'Female' },
  orc_mage: { race: 'Orc', archetype: 'mage', gender: 'Male' },
  orc_mage_female: { race: 'Orc', archetype: 'mage', gender: 'Female' },
  dwarf_male: { race: 'Dwarf', archetype: 'fighter', gender: 'Male' },
  dwarf_female: { race: 'Dwarf', archetype: 'fighter', gender: 'Female' },
};

const PAPERDOLL_PRESET_LEGACY: Partial<Record<PaperdollPresetId, string>> = {
  dark_elf_fighter: 'dark_elf_male',
  dark_elf_fighter_female: 'dark_elf_female',
  elf_fighter: 'elf_male',
  elf_fighter_female: 'elf_female',
  orc_fighter: 'orc_male',
  orc_fighter_female: 'orc_female',
};

const PAPERDOLL_REQUIRE_MASTER_CANVAS = true;
const PAPERDOLL_FOOT_SHADOW_STANDARD = 'v1' as const;

const PAPERDOLL_CONFIG: PaperdollConfig = {
  art: PAPERDOLL_ART,
  presetsRoot: PAPERDOLL_PRESETS_ROOT,
  defaultPresetId: 'human_fighter',
  globalSceneryFile: 'assets/ui/paperdoll_scenery_profile.png',
  charScale: 1,
  charDropPercent: 0,
  figureWidthPercent: 96,
  sceneryPosY: '22%',
  sceneryShiftY: '0%',
  colGapPx: 8,
  gearCloseInsetPx: 10,
  footShadowTuckPx: 0,
  footShadowHeightPx: 24,
  footShadowHeightNorm: 24 / 984,
  footShadowGroundBiasNorm: 0,
  footShadowWidthBoost: 1.22,
  footShadowWidthPadPx: 28,
  footShadowWidthMinPct: 18,
  footShadowWidthMaxPct: 52,
  footShadowFallbackWidthPct: 30,
  footShadowFallbackHeightPct: (24 / 984) * 100,
  feetScanMaxWidth: 360,
  feetAlphaMin: 28,
  feetBandHeightRatio: 0.05,
  charLayerFillStage: true,
  charLayerHeightPercent: 100,
  charLayerMaxWidth: '100%',
  layerClipInset: '0',
  baseClipInset: '0',
  divinoStrength: 1.22,
  weaponAuraKeyframe: 'pulse-weapon-aura-paperdoll',
  weaponDivinoKeyframe: 'weapon-divino-paperdoll-global',
  artAnchors: {
    feetX: 540,
    feetY: 984,
    stageLeft: 237,
    stageRight: 863,
    stageTop: 80,
    stageBottom: 960,
  },
  layerScreenOffset: {
    base: { x: 0, y: 0 },
    armor: { x: 0, y: 0 },
    weapon: { x: 0, y: 0 },
    weaponGrip: { x: 0, y: 0 },
    hands: { x: 0, y: 0 },
  },
};

function isPaperdollMageClassFor(charClass: unknown): boolean {
  if (typeof window.isClasseMagica !== 'function' || charClass == null || charClass === '') {
    return false;
  }
  return window.isClasseMagica(String(charClass));
}

function isPaperdollMageClass(): boolean {
  if (typeof window.isClasseMagica !== 'function' || typeof window.charClass === 'undefined') {
    return false;
  }
  return window.isClasseMagica(window.charClass);
}

function resolvePaperdollPresetIdFor(
  raceInput?: unknown,
  charClassInput?: unknown,
  genderInput?: unknown,
): PaperdollPresetId {
  const race = raceInput != null ? String(raceInput).trim() : 'Human';
  const gender = genderInput != null ? String(genderInput).trim() : 'Male';
  const isFemale = gender === 'Female';
  const femaleSuffix = isFemale ? '_female' : '';

  if (race === 'Dwarf') {
    return isFemale ? 'dwarf_female' : 'dwarf_male';
  }

  const racePrefix: Record<string, string> = {
    Human: 'human',
    'Dark Elf': 'dark_elf',
    Elf: 'elf',
    Orc: 'orc',
  };
  const prefix = racePrefix[race] ?? 'human';
  const archetype = isPaperdollMageClassFor(charClassInput) ? 'mage' : 'fighter';
  return `${prefix}_${archetype}${femaleSuffix}` as PaperdollPresetId;
}

function resolvePaperdollPresetId(): PaperdollPresetId {
  return resolvePaperdollPresetIdFor(window.charRace, window.charClass, window.charGender);
}

function paperdollPresetLegacyId(presetId: PaperdollPresetId): string | null {
  return PAPERDOLL_PRESET_LEGACY[presetId] ?? null;
}

function getPaperdollPresetRoot(presetId?: PaperdollPresetId | string): string {
  const id = presetId ?? resolvePaperdollPresetId();
  return `${PAPERDOLL_CONFIG.presetsRoot}/${id}/`;
}

function paperdollPresetFile(presetId: PaperdollPresetId | string, relativePath: string): string {
  return getPaperdollPresetRoot(presetId) + relativePath;
}

function paperdollBodySrcCandidates(presetId?: PaperdollPresetId | string): string[] {
  const id = presetId ?? resolvePaperdollPresetId();
  const list = [paperdollPresetFile(id, 'body.png')];
  const legacy = paperdollPresetLegacyId(id as PaperdollPresetId);
  if (legacy && legacy !== id) {
    list.push(paperdollPresetFile(legacy, 'body.png'));
  }
  return list;
}

function getPaperdollBodySrcList(presetId?: PaperdollPresetId | string): string[] {
  return paperdollBodySrcCandidates(presetId);
}

function isPaperdollMasterCanvasSize(width: number, height: number): boolean {
  return width === PAPERDOLL_ART.masterWidth && height === PAPERDOLL_ART.masterHeight;
}

function getPaperdollEquipSrcList(
  presetId: PaperdollPresetId | string | undefined,
  catalogId: string | undefined,
): string[] {
  if (!catalogId) return [];
  const id = presetId ?? resolvePaperdollPresetId();
  const cid = String(catalogId);
  const list = [paperdollPresetFile(id, `equips/${cid}.png`)];
  const legacy = paperdollPresetLegacyId(id as PaperdollPresetId);
  if (legacy && legacy !== id) {
    list.push(paperdollPresetFile(legacy, `equips/${cid}.png`));
  }
  return list;
}

function getPaperdollWeaponGripSrcList(
  presetId: PaperdollPresetId | string | undefined,
  weaponCatalogId: string | undefined,
): string[] {
  if (!weaponCatalogId) return [];
  const id = presetId ?? resolvePaperdollPresetId();
  const cid = String(weaponCatalogId);
  const list = [paperdollPresetFile(id, `equips/${cid}_grip.png`)];
  const legacy = paperdollPresetLegacyId(id as PaperdollPresetId);
  if (legacy && legacy !== id) {
    list.push(paperdollPresetFile(legacy, `equips/${cid}_grip.png`));
  }
  return list;
}

function paperdollPresetHasBareHands(presetId?: PaperdollPresetId | string): boolean {
  const id = presetId ?? resolvePaperdollPresetId();
  return id === 'human_fighter' || id === 'human_fighter_female';
}

function getPaperdollArmorHandsSrcList(
  presetId: PaperdollPresetId | string | undefined,
  armorCatalogId: string | undefined,
): string[] {
  if (!armorCatalogId) return [];
  const id = presetId ?? resolvePaperdollPresetId();
  const cid = String(armorCatalogId);
  const list = [paperdollPresetFile(id, `equips/${cid}_hands.png`)];
  const legacy = paperdollPresetLegacyId(id as PaperdollPresetId);
  if (legacy && legacy !== id) {
    list.push(paperdollPresetFile(legacy, `equips/${cid}_hands.png`));
  }
  return list;
}

function getPaperdollBareHandsSrcList(presetId?: PaperdollPresetId | string): string[] {
  const id = presetId ?? resolvePaperdollPresetId();
  if (!paperdollPresetHasBareHands(id)) return [];
  return [paperdollPresetFile(id, 'hands.png'), 'assets/chars/human_fighter_hands.png'];
}

function getPaperdollHandsSrcList(
  presetId: PaperdollPresetId | string | undefined,
  armorCatalogId?: string,
): string[] {
  if (armorCatalogId) {
    return getPaperdollArmorHandsSrcList(presetId, armorCatalogId);
  }
  return getPaperdollBareHandsSrcList(presetId);
}

function presetUsesHands(presetId?: PaperdollPresetId | string): boolean {
  return paperdollPresetHasBareHands(presetId);
}

function applyPaperdollScenery(root: HTMLElement | null): void {
  if (!root) return;
  root.style.removeProperty('--pd-scenery-url');
}

function applyPaperdollConfig(
  root: HTMLElement | null,
  overrides?: Partial<PaperdollConfig>,
  context?: { presetId?: PaperdollPresetId | string },
): void {
  if (!root) return;
  const c = overrides ? { ...PAPERDOLL_CONFIG, ...overrides } : PAPERDOLL_CONFIG;
  const presetId = context?.presetId ?? resolvePaperdollPresetId();
  root.setAttribute('data-paperdoll-preset', String(presetId));
  applyPaperdollScenery(root);

  root.style.setProperty('--pd-char-scale', String(c.charScale));
  root.style.setProperty('--pd-char-drop', `${c.charDropPercent}%`);
  root.style.setProperty('--pd-figure-w', `${c.figureWidthPercent}%`);
  root.style.setProperty('--pd-scenery-pos-y', c.sceneryPosY);
  root.style.setProperty('--pd-scenery-shift-y', c.sceneryShiftY);
  root.style.setProperty('--pd-col-gap', `${c.colGapPx}px`);
  root.style.setProperty('--pd-gear-close-y', `${c.gearCloseInsetPx}px`);
  root.style.setProperty('--pd-char-layer-h', `${c.charLayerHeightPercent}%`);
  root.style.setProperty('--pd-char-layer-max-w', c.charLayerMaxWidth);
  root.style.setProperty('--pd-layer-clip', c.layerClipInset);
  root.style.setProperty('--pd-base-clip', c.baseClipInset);
  root.style.setProperty('--pd-art-scale', String(c.art.scale));
  const off = c.layerScreenOffset ?? {};
  const lb = off.base ?? { x: 0, y: 0 };
  const la = off.armor ?? { x: 0, y: 0 };
  const lw = off.weapon ?? { x: 0, y: 0 };
  const lwg = off.weaponGrip ?? { x: 0, y: 0 };
  const lh = off.hands ?? { x: 0, y: 0 };
  root.style.setProperty('--pd-off-base-x', `${lb.x ?? 0}px`);
  root.style.setProperty('--pd-off-base-y', `${lb.y ?? 0}px`);
  root.style.setProperty('--pd-off-armor-x', `${la.x ?? 0}px`);
  root.style.setProperty('--pd-off-armor-y', `${la.y ?? 0}px`);
  root.style.setProperty('--pd-off-weapon-x', `${lw.x ?? 0}px`);
  root.style.setProperty('--pd-off-weapon-y', `${lw.y ?? 0}px`);
  root.style.setProperty('--pd-off-weapon-grip-x', `${lwg.x ?? lw.x ?? 0}px`);
  root.style.setProperty('--pd-off-weapon-grip-y', `${lwg.y ?? lw.y ?? 0}px`);
  root.style.setProperty('--pd-off-hands-x', `${lh.x ?? 0}px`);
  root.style.setProperty('--pd-off-hands-y', `${lh.y ?? 0}px`);
  const mh = c.art?.masterHeight ?? 984;
  const stageBottom = c.artAnchors?.stageBottom ?? mh * 0.976;
  const stackBottomPct = ((mh - stageBottom) / mh) * 100;
  root.style.setProperty('--pd-stack-bottom', `${stackBottomPct.toFixed(4)}%`);
  const fbW = c.footShadowFallbackWidthPct ?? 30;
  const fbH = c.footShadowFallbackHeightPct ?? (24 / 984) * 100;
  root.style.setProperty('--pd-foot-shadow-fallback-w', `${fbW.toFixed(3)}%`);
  root.style.setProperty('--pd-foot-shadow-fallback-h', `${fbH.toFixed(4)}%`);
  root.style.removeProperty('--pd-scenery-image');
}

function applyPaperdollConfigAll(): void {
  document.querySelectorAll<HTMLElement>('.l2-paperdoll').forEach((node) => {
    applyPaperdollConfig(node);
  });
}

type ItemCatalogLike = { tipo?: string; base?: { tipo?: string } };

function isPaperdollFistWeaponTipo(tipo: unknown): boolean {
  return String(tipo ?? '').trim().toLowerCase() === 'fist';
}

function isPaperdollFistWeaponItem(item: EquipInstance | ItemCatalogLike | null | undefined): boolean {
  if (!item) return false;
  const base =
    item && typeof item === 'object' && 'base' in item && item.base && typeof item.base === 'object'
      ? item.base
      : item;
  const rec = base as { tipo?: string };
  const top = item as { tipo?: string };
  return isPaperdollFistWeaponTipo(rec.tipo ?? top.tipo);
}

function syncPaperdollFistWeaponLayerClass(
  weaponLayerEl: HTMLElement | null,
  weaponItem: EquipInstance | ItemCatalogLike | null | undefined,
): void {
  if (!weaponLayerEl?.classList) return;
  weaponLayerEl.classList.toggle('char-layer--fist', isPaperdollFistWeaponItem(weaponItem));
}

window.PAPERDOLL_FOOT_SHADOW_STANDARD = PAPERDOLL_FOOT_SHADOW_STANDARD;
window.PAPERDOLL_ART = PAPERDOLL_ART;
window.PAPERDOLL_CONFIG = PAPERDOLL_CONFIG;
window.PAPERDOLL_PRESET_META = PAPERDOLL_PRESET_META;
window.PAPERDOLL_PRESET_LEGACY = PAPERDOLL_PRESET_LEGACY;
window.PAPERDOLL_PRESETS_ROOT = PAPERDOLL_PRESETS_ROOT;
window.paperdollPresetLegacyId = paperdollPresetLegacyId;
window.resolvePaperdollPresetId = resolvePaperdollPresetId;
window.resolvePaperdollPresetIdFor = resolvePaperdollPresetIdFor;
window.getPaperdollPresetRoot = getPaperdollPresetRoot;
window.getPaperdollBodySrcList = getPaperdollBodySrcList;
window.isPaperdollMasterCanvasSize = isPaperdollMasterCanvasSize;
window.PAPERDOLL_REQUIRE_MASTER_CANVAS = PAPERDOLL_REQUIRE_MASTER_CANVAS;
window.getPaperdollEquipSrcList = getPaperdollEquipSrcList;
window.getPaperdollWeaponGripSrcList = getPaperdollWeaponGripSrcList;
window.paperdollPresetHasBareHands = paperdollPresetHasBareHands;
window.getPaperdollArmorHandsSrcList = getPaperdollArmorHandsSrcList;
window.getPaperdollBareHandsSrcList = getPaperdollBareHandsSrcList;
window.getPaperdollHandsSrcList = getPaperdollHandsSrcList;
window.presetUsesPaperdollHands = presetUsesHands;
window.applyPaperdollScenery = applyPaperdollScenery;
window.applyPaperdollConfig = applyPaperdollConfig;
window.applyPaperdollConfigAll = applyPaperdollConfigAll;
window.isPaperdollFistWeaponTipo = isPaperdollFistWeaponTipo;
window.isPaperdollFistWeaponItem = isPaperdollFistWeaponItem;
window.syncPaperdollFistWeaponLayerClass = syncPaperdollFistWeaponLayerClass;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyPaperdollConfigAll);
} else {
  applyPaperdollConfigAll();
}

export {};
