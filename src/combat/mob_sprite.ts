/**
 * Hunt-mob combat poses.
 *
 * Still PNG is the fallback (`assets/mobs/<id>_<pose>.png`).
 * Drop an animated WebP with the same basename to upgrade in place.
 * GIF is not supported — see docs/mob-combat-anim.md.
 */

export type MobSpritePose = 'idle' | 'atk' | 'die';

type ResolvedMobSprite = { url: string; animated: boolean };

/** Attack pose hold — CSS lunge + `_atk` still. Keep in sync with `mobHuntLunge`. */
export const MOB_ATK_POSE_MS = 420;

const cache = new Map<string, ResolvedMobSprite>();
const inflight = new Map<string, Promise<ResolvedMobSprite>>();
const atkTokens = new WeakMap<HTMLImageElement, number>();

function cacheKey(idImg: string, pose: MobSpritePose): string {
  return `${idImg}:${pose}`;
}

export function mobSpritePngUrl(idImg: string, pose: MobSpritePose): string {
  return `assets/mobs/${idImg}_${pose}.png`;
}

export function mobSpriteWebpUrl(idImg: string, pose: MobSpritePose): string {
  return `assets/mobs/${idImg}_${pose}.webp`;
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

export function resolveMobSprite(idImg: string, pose: MobSpritePose): Promise<ResolvedMobSprite> {
  const key = cacheKey(idImg, pose);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = (async () => {
    const webp = mobSpriteWebpUrl(idImg, pose);
    const ok = prefersReducedMotion() ? false : await probeUrl(webp);
    const resolved: ResolvedMobSprite = ok
      ? { url: webp, animated: true }
      : { url: mobSpritePngUrl(idImg, pose), animated: false };
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

/** Show the still immediately; swap to WebP when the probe succeeds. */
export function bindMobSpriteImg(
  img: HTMLImageElement | null,
  idImg: string,
  pose: MobSpritePose,
): void {
  if (!img || !idImg) return;
  img.setAttribute('data-mob-img', idImg);
  img.setAttribute('data-mob-pose', pose);
  const hit = cache.get(cacheKey(idImg, pose));
  if (hit) {
    applyResolvedSprite(img, hit);
    return;
  }
  img.setAttribute('data-mob-animated', '0');
  const png = mobSpritePngUrl(idImg, pose);
  if (img.getAttribute('src') !== png) img.src = png;
  void resolveMobSprite(idImg, pose).then((resolved) => {
    if (img.getAttribute('data-mob-img') !== idImg) return;
    if (img.getAttribute('data-mob-pose') !== pose) return;
    applyResolvedSprite(img, resolved);
  });
}

export function warmupMobSprites(idImg: string): void {
  if (!idImg) return;
  void resolveMobSprite(idImg, 'idle');
  void resolveMobSprite(idImg, 'atk');
  void resolveMobSprite(idImg, 'die');
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
