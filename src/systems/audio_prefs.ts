/**
 * Client audio preferences (music / battle SFX).
 * Device-local — not part of character save.
 */

export type AudioPrefs = {
  musicEnabled: boolean;
  battleSfxEnabled: boolean;
  /** 0–1 player gain on expedition / map BGM. */
  musicVolume: number;
  /** 0–1 player gain on battle SFX (swings, crit, shots). */
  battleVolume: number;
};

const STORAGE_KEY = 'l2mini_audio_prefs';

const DEFAULT_PREFS: AudioPrefs = {
  musicEnabled: true,
  battleSfxEnabled: true,
  musicVolume: 1,
  battleVolume: 1,
};

function clamp01(n: unknown, fallback: number): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(1, v));
}

/** SFX treated as battle / expedition combat cues. */
const BATTLE_SOUND_KEYS = new Set<string>(['critical', 'soulshot', 'teleport']);

let prefs: AudioPrefs = { ...DEFAULT_PREFS };
let loaded = false;

function readStored(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      musicEnabled: parsed.musicEnabled !== false,
      battleSfxEnabled: parsed.battleSfxEnabled !== false,
      musicVolume: clamp01(parsed.musicVolume, DEFAULT_PREFS.musicVolume),
      battleVolume: clamp01(parsed.battleVolume, DEFAULT_PREFS.battleVolume),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore quota / private mode */
  }
}

function ensureLoaded(): void {
  if (loaded) return;
  prefs = readStored();
  loaded = true;
}

export function getAudioPrefs(): AudioPrefs {
  ensureLoaded();
  return { ...prefs };
}

export function isMusicEnabled(): boolean {
  ensureLoaded();
  return prefs.musicEnabled;
}

export function isBattleSfxEnabled(): boolean {
  ensureLoaded();
  return prefs.battleSfxEnabled;
}

export function getMusicVolume(): number {
  ensureLoaded();
  return prefs.musicVolume;
}

export function getBattleVolume(): number {
  ensureLoaded();
  return prefs.battleVolume;
}

export function setMusicVolume(volume: number): void {
  ensureLoaded();
  prefs.musicVolume = clamp01(volume, prefs.musicVolume);
  persist();
  notifyMusicChanged();
}

export function setBattleVolume(volume: number): void {
  ensureLoaded();
  prefs.battleVolume = clamp01(volume, prefs.battleVolume);
  persist();
}

export function isBattleSoundKey(nome: string): boolean {
  return BATTLE_SOUND_KEYS.has(nome);
}

function notifyMusicChanged(): void {
  try {
    const exp = window.ExpeditionEngine as { syncRunBgm?: () => void } | undefined;
    if (typeof exp?.syncRunBgm === 'function') exp.syncRunBgm();
  } catch {
    /* ignore */
  }
}

export function setMusicEnabled(enabled: boolean): void {
  ensureLoaded();
  prefs.musicEnabled = !!enabled;
  persist();
  notifyMusicChanged();
}

export function setBattleSfxEnabled(enabled: boolean): void {
  ensureLoaded();
  prefs.battleSfxEnabled = !!enabled;
  persist();
}

export function toggleMusicEnabled(): boolean {
  setMusicEnabled(!isMusicEnabled());
  return isMusicEnabled();
}

export function toggleBattleSfxEnabled(): boolean {
  setBattleSfxEnabled(!isBattleSfxEnabled());
  return isBattleSfxEnabled();
}

const AudioPrefsApi = {
  get: getAudioPrefs,
  isMusicEnabled,
  isBattleSfxEnabled,
  isBattleSoundKey,
  getMusicVolume,
  getBattleVolume,
  setMusicEnabled,
  setBattleSfxEnabled,
  setMusicVolume,
  setBattleVolume,
  toggleMusicEnabled,
  toggleBattleSfxEnabled,
};

window.AudioPrefs = AudioPrefsApi;

ensureLoaded();

export {};
