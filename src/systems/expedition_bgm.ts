/**
 * Looping BGM for active Forest Expedition runs (by hunt zone / grade).
 */

const EXPEDITION_BGM_BY_ZONE: Record<string, string> = {
  'No-Grade': 'assets/music/expedition_ng.mp3',
};

const BGM_VOLUME = 0.32;

let bgmAudio: HTMLAudioElement | null = null;
let bgmTrackSrc: string | null = null;

function resolveExpeditionBgm(zoneId: string): string | null {
  const key = zoneId != null && String(zoneId).length ? String(zoneId) : 'No-Grade';
  return EXPEDITION_BGM_BY_ZONE[key] ?? null;
}

function ensureBgmAudio(src: string): HTMLAudioElement {
  if (bgmAudio && bgmTrackSrc === src) return bgmAudio;
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
    bgmTrackSrc = null;
  }
  bgmAudio = new Audio(src);
  bgmAudio.loop = true;
  bgmAudio.volume = BGM_VOLUME;
  bgmTrackSrc = src;
  return bgmAudio;
}

/** Play / pause expedition BGM from current run state. */
export function syncExpeditionBgm(active: boolean, suspended: boolean, zoneId: string): void {
  const src = active && !suspended ? resolveExpeditionBgm(zoneId) : null;
  if (!src) {
    stopExpeditionBgm(true);
    return;
  }
  const clip = ensureBgmAudio(src);
  if (clip.paused) clip.play().catch(() => {});
}

/** Stop expedition BGM (`reset` rewinds for the next run). */
export function stopExpeditionBgm(reset = true): void {
  if (!bgmAudio) return;
  bgmAudio.pause();
  if (reset) {
    bgmAudio.currentTime = 0;
    bgmTrackSrc = null;
  }
}

export {};
