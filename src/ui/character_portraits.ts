/**
 * Character creation / avatar portrait paths — paperdoll body with safe fallbacks.
 */
import { registerGlobalFn } from '../runtime/register-global';

const PORTRAIT_FALLBACK_FIGHTER = [
  'assets/paperdolls/human_fighter/body.png',
  'assets/chars/base_fighter.png',
] as const;

const PORTRAIT_FALLBACK_MAGE = [
  'assets/paperdolls/human_mage/body.png',
  'assets/chars/mago_m.png',
  ...PORTRAIT_FALLBACK_FIGHTER,
] as const;

function normalizeGender(gender: unknown): 'Male' | 'Female' {
  return gender === 'Female' ? 'Female' : 'Male';
}

function isMageClassName(charClass: unknown): boolean {
  if (charClass == null || charClass === '') return false;
  if (typeof window.isClasseMagica === 'function') {
    return window.isClasseMagica(String(charClass));
  }
  const lc = String(charClass).toLowerCase();
  return lc.includes('mage') || lc.includes('shaman') || lc.includes('oracle') || lc.includes('wizard');
}

function dedupePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  return paths.filter((p) => {
    if (!p || seen.has(p)) return false;
    seen.add(p);
    return true;
  });
}

function getCharacterPortraitSrcList(
  race: string,
  gender: unknown,
  charClass?: unknown,
): string[] {
  const g = normalizeGender(gender);
  const mage = isMageClassName(charClass);
  const classForPreset = charClass != null && String(charClass) !== '' ? String(charClass) : 'Fighter';
  const primary: string[] = [];

  if (
    typeof window.getPaperdollBodySrcList === 'function'
    && typeof window.resolvePaperdollPresetIdFor === 'function'
  ) {
    const presetId = window.resolvePaperdollPresetIdFor(race, classForPreset, g);
    primary.push(...window.getPaperdollBodySrcList(presetId));
  }

  const tail = mage ? PORTRAIT_FALLBACK_MAGE : PORTRAIT_FALLBACK_FIGHTER;
  return dedupePaths([...primary, ...tail]);
}

function getCharacterPortraitSrc(
  race: string,
  gender: unknown,
  charClass?: unknown,
): string {
  const list = getCharacterPortraitSrcList(race, gender, charClass);
  return list[0] || PORTRAIT_FALLBACK_FIGHTER[0];
}

function portraitImgOnError(img: HTMLImageElement): void {
  const raw = img.dataset.portraitFallbacks || '';
  const rest = raw.split('|').filter(Boolean);
  if (rest.length === 0) return;
  img.dataset.portraitFallbacks = rest.slice(1).join('|');
  img.src = rest[0];
}

function portraitImgHtml(
  race: string,
  gender: unknown,
  charClass?: unknown,
  style = '',
): string {
  const candidates = getCharacterPortraitSrcList(race, gender, charClass);
  const [src, ...fallbacks] = candidates;
  const fb = fallbacks.join('|');
  const safeStyle = style.replace(/"/g, '&quot;');
  return `<img src="${src}" data-portrait-fallbacks="${fb}" onerror="window._l2PortraitImgOnError(this)" style="${safeStyle}" alt="">`;
}

registerGlobalFn('_l2PortraitImgOnError', portraitImgOnError);
registerGlobalFn('getCharacterPortraitSrc', getCharacterPortraitSrc);
registerGlobalFn('getCharacterPortraitSrcList', getCharacterPortraitSrcList);
registerGlobalFn('portraitImgHtml', portraitImgHtml);

export {};
