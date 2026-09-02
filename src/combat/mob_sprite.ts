/**
 * Hunt-mob combat poses.
 *
 * Still PNG: `assets/mobs/<id>_<pose>.png` or `assets/mobs/<id>_<variant>_<pose>.png`.
 * Drop an animated WebP with the same basename to upgrade in place.
 * GIF is not supported — see docs/mob-combat-anim.md.
 */

export type MobSpritePose = 'idle' | 'atk' | 'die';

/** Costume stem after species id — empty = base still. */
export type MobSpriteVariant =
  | ''
  | 'magic'
  | 'poison'
  | 'bleed'
  | 'magic_poison'
  | 'magic_bleed';

type ResolvedMobSprite = { url: string; animated: boolean };

/** Bump when replacing hunt stills so phones drop the old PNG cache. */
const MOB_SPRITE_REV = '20260901h';

/** Attack pose hold — CSS lunge + `_atk` still. Keep in sync with `mobHuntLunge`. */
export const MOB_ATK_POSE_MS = 420;

const cache = new Map<string, ResolvedMobSprite>();
const inflight = new Map<string, Promise<ResolvedMobSprite>>();
const atkTokens = new WeakMap<HTMLImageElement, number>();

export function mobSpriteVariantKey(tipo?: string, threat?: string): MobSpriteVariant {
  const magic = tipo === 'magico';
  if (magic && threat === 'poison') return 'magic_poison';
  if (magic && threat === 'bleed') return 'magic_bleed';
  if (magic) return 'magic';
  if (threat === 'poison') return 'poison';
  if (threat === 'bleed') return 'bleed';
  return '';
}

/** Prefer specific costume art, then threat, then magic, then the species still. */
export function mobSpriteStemCandidates(idImg: string, variant: string): string[] {
  const id = String(idImg || '').trim();
  if (!id) return [];
  const stems: string[] = [];
  const push = (s: string) => {
    if (s && !stems.includes(s)) stems.push(s);
  };
  if (variant === 'magic_poison') {
    push(`${id}_magic_poison`);
    push(`${id}_poison`);
    push(`${id}_magic`);
  } else if (variant === 'magic_bleed') {
    push(`${id}_magic_bleed`);
    push(`${id}_bleed`);
    push(`${id}_magic`);
  } else if (variant) {
    push(`${id}_${variant}`);
  }
  push(id);
  return stems;
}

function cacheKey(stem: string, pose: MobSpritePose): string {
  return `${stem}:${pose}`;
}

export function mobSpritePngUrl(stem: string, pose: MobSpritePose): string {
  return `assets/mobs/${stem}_${pose}.png?v=${MOB_SPRITE_REV}`;
}

export function mobSpriteWebpUrl(stem: string, pose: MobSpritePose): string {
  return `assets/mobs/${stem}_${pose}.webp?v=${MOB_SPRITE_REV}`;
}

function prefersReducedMotion(): boolean {
  try {
    return typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function probeUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function variantFromImg(img: HTMLImageElement, fallback: string): string {
  const v = img.getAttribute('data-mob-variant');
  return v != null && v !== '' ? v : fallback;
}

export async function resolveMobSprite(
  idImg: string,
  pose: MobSpritePose,
  variant: string = '',
): Promise<ResolvedMobSprite> {
  const stems = mobSpriteStemCandidates(idImg, variant);
  const key = `${stems.join('|')}:${pose}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = (async () => {
    const skipWebp = prefersReducedMotion();
    for (const stem of stems) {
      if (!skipWebp) {
        const webp = mobSpriteWebpUrl(stem, pose);
        if (await probeUrl(webp)) {
          const resolved: ResolvedMobSprite = { url: webp, animated: true };
          cache.set(key, resolved);
          inflight.delete(key);
          return resolved;
        }
      }
      const png = mobSpritePngUrl(stem, pose);
      if (await probeUrl(png)) {
        const resolved: ResolvedMobSprite = { url: png, animated: false };
        cache.set(key, resolved);
        inflight.delete(key);
        return resolved;
      }
    }
    const fallbackStem = stems[stems.length - 1] || idImg;
    const resolved: ResolvedMobSprite = {
      url: mobSpritePngUrl(fallbackStem, pose),
      animated: false,
    };
    cache.set(key, resolved);
    inflight.delete(key);
    return resolved;
  })();
  inflight.set(key, job);
  return job;
}

function applyResolvedSprite(img: HTMLImageElement, resolved: ResolvedMobSprite): void {
  img.setAttribute('data-mob-animated', resolved.animated ? '1' : '0');
  if (img.getAttribute('src') !== resolved.url) img.src = resolved.url;
}

function spriteShell(img: HTMLImageElement): HTMLElement | null {
  return img.closest('.mob-hunt-sprite-shell');
}

function setShellLunge(img: HTMLImageElement, on: boolean): void {
  const shell = spriteShell(img);
  if (!shell) return;
  shell.classList.remove('mob-hunt-sprite-shell--lunge');
  if (!on) return;
  void shell.offsetWidth;
  shell.classList.add('mob-hunt-sprite-shell--lunge');
}

/** Show the still immediately; swap to variant / WebP when the probe succeeds. */
export function bindMobSpriteImg(
  img: HTMLImageElement | null,
  idImg: string,
  pose: MobSpritePose,
  variant?: string,
): void {
  if (!img || !idImg) return;
  const v = variant != null ? variant : variantFromImg(img, '');
  img.setAttribute('data-mob-img', idImg);
  img.setAttribute('data-mob-variant', v);
  img.setAttribute('data-mob-pose', pose);
  const stems = mobSpriteStemCandidates(idImg, v);
  const key = `${stems.join('|')}:${pose}`;
  const hit = cache.get(key);
  if (hit) {
    applyResolvedSprite(img, hit);
    return;
  }
  img.setAttribute('data-mob-animated', '0');
  const preview = mobSpritePngUrl(stems[0] || idImg, pose);
  if (img.getAttribute('src') !== preview) img.src = preview;
  void resolveMobSprite(idImg, pose, v).then((resolved) => {
    if (img.getAttribute('data-mob-img') !== idImg) return;
    if (img.getAttribute('data-mob-pose') !== pose) return;
    if (variantFromImg(img, v) !== v) return;
    applyResolvedSprite(img, resolved);
  });
}

export function warmupMobSprites(idImg: string, variant: string = ''): void {
  if (!idImg) return;
  void resolveMobSprite(idImg, 'idle', variant);
  void resolveMobSprite(idImg, 'atk', variant);
  void resolveMobSprite(idImg, 'die', variant);
}

export function playMobAttackPose(img: HTMLImageElement | null, idImg: string): void {
  if (!img || !idImg) return;
  const token = (atkTokens.get(img) || 0) + 1;
  atkTokens.set(img, token);
  bindMobSpriteImg(img, idImg, 'atk');
  setShellLunge(img, true);
  window.setTimeout(() => {
    if (atkTokens.get(img) !== token) return;
    if (img.getAttribute('data-mob-pose') !== 'atk') return;
    setShellLunge(img, false);
    bindMobSpriteImg(img, idImg, 'idle');
  }, MOB_ATK_POSE_MS);
}

export function playMobDeathPose(img: HTMLImageElement | null, idImg: string): void {
  if (!img || !idImg) return;
  atkTokens.set(img, (atkTokens.get(img) || 0) + 1);
  setShellLunge(img, false);
  bindMobSpriteImg(img, idImg, 'die');
}
