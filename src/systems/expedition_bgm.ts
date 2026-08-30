/**
 * Looping BGM for active Forest Expedition runs (by hunt zone / grade).
 */

const EXPEDITION_BGM_BY_ZONE: Record<string, string> = {
  'No-Grade': 'assets/music/expedition_ng.mp3',
  D: 'assets/music/expedition_d.mp3',
};

const BGM_VOLUME = 0.32;
/** D mix is sparse pads — needs more gain than the NG trail. */
const BGM_VOLUME_BY_ZONE: Record<string, number> = {
  D: 0.62,
};

let bgmAudio: HTMLAudioElement | null = null;
let bgmTrackSrc: string | null = null;

function resolveExpeditionBgm(zoneId: string): string | null {
  const key = zoneId != null && String(zoneId).length ? String(zoneId) : 'No-Grade';
  return EXPEDITION_BGM_BY_ZONE[key] ?? null;
}

function playerMusicGain(): number {
  if (typeof window.AudioPrefs?.getMusicVolume === 'function') {
    const g = window.AudioPrefs.getMusicVolume();
    return typeof g === 'number' && Number.isFinite(g) ? Math.max(0, Math.min(1, g)) : 1;
  }
  return 1;
}

function volumeForZone(zoneId: string): number {
  const v = BGM_VOLUME_BY_ZONE[zoneId];
  const base = typeof v === 'number' && v > 0 ? v : BGM_VOLUME;
  return Math.min(1, base * playerMusicGain());
}

function ensureBgmAudio(src: string, zoneId: string): HTMLAudioElement {
  if (bgmAudio && bgmTrackSrc === src) {
    bgmAudio.volume = volumeForZone(zoneId);
    return bgmAudio;
  }
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
    bgmTrackSrc = null;
  }
  bgmAudio = new Audio(src);
  bgmAudio.loop = true;
  bgmAudio.volume = volumeForZone(zoneId);
  bgmTrackSrc = src;
  return bgmAudio;
}

/** Play / pause expedition BGM from current run state. */
export function syncExpeditionBgm(active: boolean, suspended: boolean, zoneId: string): void {
  const musicOn =
    typeof window.AudioPrefs?.isMusicEnabled === 'function'
      ? window.AudioPrefs.isMusicEnabled()
      : true;
  const src = active && !suspended && musicOn ? resolveExpeditionBgm(zoneId) : null;
  if (!src) {
    // Keep track loaded when only muted — resume without reloading.
    if (active && !suspended && !musicOn) {
      stopExpeditionBgm(false);
      return;
    }
    stopExpeditionBgm(true);
    return;
  }
  const clip = ensureBgmAudio(src, zoneId);
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
