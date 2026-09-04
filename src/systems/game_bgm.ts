/**
 * Game BGM director — one looping bed at a time.
 * Login / character select → login theme.
 * In-world hub (town, world, bag…) → hub theme.
 * Live expedition → zone hunt bed (existing NG / D tracks).
 */
import { registerGlobal } from '../runtime/register-global';

type BgmCue = 'login' | 'hub' | `expedition:${string}`;

type BgmSpec = {
  src: string;
  volume: number;
};

const LOGIN_BGM: BgmSpec = {
  src: 'assets/music/login.mp3',
  volume: 0.44,
};

const HUB_BGM: BgmSpec = {
  src: 'assets/music/hub.mp3',
  volume: 0.38,
};

const EXPEDITION_BGM: Record<string, BgmSpec> = {
  'No-Grade': { src: 'assets/music/expedition_ng.mp3', volume: 0.32 },
  D: { src: 'assets/music/expedition_d.mp3', volume: 0.62 },
};

const FADE_MS = 520;

let bgmAudio: HTMLAudioElement | null = null;
let bgmSrc: string | null = null;
let unlocked = false;
let fadeTimer: ReturnType<typeof setInterval> | null = null;
let gestureArmed = false;

function playerMusicGain(): number {
  if (typeof window.AudioPrefs?.getMusicVolume === 'function') {
    const g = window.AudioPrefs.getMusicVolume();
    return typeof g === 'number' && Number.isFinite(g) ? Math.max(0, Math.min(1, g)) : 1;
  }
  return 1;
}

function musicEnabled(): boolean {
  return typeof window.AudioPrefs?.isMusicEnabled === 'function'
    ? window.AudioPrefs.isMusicEnabled()
    : true;
}

function activeScreenId(): string {
  const el = document.querySelector('.screen.active-screen');
  return el instanceof HTMLElement ? el.id : '';
}

function resolveCue(): { cue: BgmCue; spec: BgmSpec } | null {
  const exp = window.ExpeditionEngine?.state;
  if (exp?.active && !exp.suspended) {
    const zone = String(exp.zoneId || 'No-Grade');
    const spec = EXPEDITION_BGM[zone];
    return spec ? { cue: `expedition:${zone}`, spec } : null;
  }
  if (activeScreenId() === 'screen-game') {
    return { cue: 'hub', spec: HUB_BGM };
  }
  return { cue: 'login', spec: LOGIN_BGM };
}

function targetVolume(spec: BgmSpec): number {
  return Math.min(1, spec.volume * playerMusicGain());
}

function clearFade(): void {
  if (fadeTimer) {
    clearInterval(fadeTimer);
    fadeTimer = null;
  }
}

function fadeAudioTo(clip: HTMLAudioElement, to: number, ms: number, onDone?: () => void): void {
  clearFade();
  const from = clip.volume;
  const steps = Math.max(6, Math.floor(ms / 40));
  let i = 0;
  fadeTimer = setInterval(() => {
    i += 1;
    const t = Math.min(1, i / steps);
    clip.volume = Math.max(0, Math.min(1, from + (to - from) * t));
    if (t >= 1) {
      clearFade();
      onDone?.();
    }
  }, 40);
}

function ensureClip(spec: BgmSpec): HTMLAudioElement {
  if (bgmAudio && bgmSrc === spec.src) {
    return bgmAudio;
  }
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
    bgmSrc = null;
  }
  const clip = new Audio(spec.src);
  clip.loop = true;
  clip.preload = 'auto';
  clip.volume = 0;
  bgmAudio = clip;
  bgmSrc = spec.src;
  return clip;
}

function pauseCurrent(reset: boolean): void {
  clearFade();
  if (!bgmAudio) return;
  bgmAudio.pause();
  if (reset) {
    try {
      bgmAudio.currentTime = 0;
    } catch {
      /* ignore */
    }
    bgmSrc = null;
    bgmAudio = null;
  }
}

function startSpec(spec: BgmSpec): void {
  const clip = ensureClip(spec);
  const dest = targetVolume(spec);
  if (clip.paused) {
    clip.volume = 0;
    const kick = clip.play();
    if (kick && typeof kick.catch === 'function') {
      kick.catch(() => {
        unlocked = false;
      });
    }
  }
  fadeAudioTo(clip, dest, FADE_MS);
}

function playSpec(spec: BgmSpec): void {
  if (bgmAudio && bgmSrc && bgmSrc !== spec.src && !bgmAudio.paused) {
    const outgoing = bgmAudio;
    fadeAudioTo(outgoing, 0, FADE_MS, () => {
      if (bgmAudio === outgoing) {
        outgoing.pause();
        bgmAudio = null;
        bgmSrc = null;
      }
      startSpec(spec);
    });
    return;
  }
  startSpec(spec);
}

function armUnlockGesture(): void {
  if (gestureArmed) return;
  gestureArmed = true;
  const unlock = () => {
    unlocked = true;
    syncGameBgm();
  };
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
  window.addEventListener('keydown', unlock, { once: true, capture: true });
}

/** Pick and play the bed for the current screen / expedition state. */
export function syncGameBgm(): void {
  armUnlockGesture();
  if (!musicEnabled()) {
    pauseCurrent(false);
    return;
  }
  const resolved = resolveCue();
  if (!resolved) {
    pauseCurrent(true);
    return;
  }
  if (!unlocked && bgmAudio && bgmSrc === resolved.spec.src && !bgmAudio.paused) {
    bgmAudio.volume = targetVolume(resolved.spec);
    return;
  }
  if (!unlocked) {
    // Prime the element so the first tap can start immediately.
    ensureClip(resolved.spec);
    return;
  }
  playSpec(resolved.spec);
}

export function stopGameBgm(reset = true): void {
  pauseCurrent(reset);
}

/** @deprecated expedition_engine still calls this name — director decides the bed. */
export function syncExpeditionBgm(_active: boolean, _suspended: boolean, _zoneId: string): void {
  syncGameBgm();
}

export function stopExpeditionBgm(reset = true): void {
  stopGameBgm(reset);
}

registerGlobal('syncGameBgm', syncGameBgm);
armUnlockGesture();

export {};
