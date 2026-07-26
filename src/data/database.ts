/**
 * Migrado: js/database.js
 */

import type { GameSoundKey, ItemCatalogBase, RaceInitialStats } from '../types/game';

// ==========================================
// BANCO DE DADOS E VARIÁVEIS DO JOGADOR
// ==========================================

/** UI + combat cues — new assets live under assets/sounds/ (legacy under assets/sons/). */
const SOUND_SRC: Partial<Record<GameSoundKey, string>> = {
  enchant: 'assets/sons/sucesso.wav',
  lvlup: 'assets/sounds/levelup.mp3',
  critical: 'assets/sounds/critical.mp3',
  teleport: 'assets/sounds/teleport.mp3',
  soulshot: 'assets/sounds/soulshot.mp3',
};

const BLADE_SWING_SRC = [
  'assets/sounds/espada1.mp3',
  'assets/sounds/espada2.mp3',
  'assets/sounds/espada3.mp3',
  'assets/sounds/espada4.mp3',
] as const;

/** Sword, long sword, dagger, sabre — not bow/mace/fist/staff. */
const CUTTING_WEAPON_TIPOS = new Set(['Sword', 'Dagger']);

function resolveEquippedWeaponTipo(): string | null {
  const wpn = window.armaEquipadaBase;
  if (!wpn) return null;
  const base = (wpn.base || wpn) as ItemCatalogBase;
  if (base?.tipo) return String(base.tipo);
  const id = base?.id != null ? String(base.id) : '';
  if (!id || !Array.isArray(window.catalogoArmas)) return null;
  const hit = window.catalogoArmas.find((a) => String(a.id) === id);
  return hit?.tipo ? String(hit.tipo) : null;
}

function isCuttingWeaponEquipped(): boolean {
  const tipo = resolveEquippedWeaponTipo();
  return !!tipo && CUTTING_WEAPON_TIPOS.has(tipo);
}

let gameAudioUnlocked = false;

function sfxVolume(nome: GameSoundKey): number {
  if (nome === 'critical') return 0.85;
  if (nome === 'teleport') return 0.9;
  if (nome === 'soulshot') return 0.8;
  return 1;
}

/** Mobile browsers block Audio created at boot — unlock on first tap/key. */
function unlockGameAudio(): void {
  if (gameAudioUnlocked) return;
  gameAudioUnlocked = true;
  const primerSrc = SOUND_SRC.soulshot || SOUND_SRC.critical;
  if (!primerSrc) return;
  try {
    const primer = new Audio(primerSrc);
    primer.volume = 0.01;
    primer.play()
      .then(() => {
        primer.pause();
        primer.currentTime = 0;
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
}

function bindGameAudioUnlock(): void {
  if (typeof document === 'undefined') return;
  const once = { once: true, capture: true } as AddEventListenerOptions;
  const onUnlock = () => unlockGameAudio();
  document.addEventListener('pointerdown', onUnlock, once);
  document.addEventListener('keydown', onUnlock, once);
  document.addEventListener('touchstart', onUnlock, once);
}

bindGameAudioUnlock();

function battleSfxAllowed(): boolean {
  if (typeof window.AudioPrefs?.isBattleSfxEnabled === 'function') {
    return window.AudioPrefs.isBattleSfxEnabled();
  }
  return true;
}

/**
 * Play a one-shot SFX. Fresh `Audio` per call so mobile autoplay works after
 * the first user gesture and crit + soulshot can overlap.
 */
function tocarSom(nome: GameSoundKey): void {
  const src = SOUND_SRC[nome];
  if (!src) return;
  const isBattle =
    typeof window.AudioPrefs?.isBattleSoundKey === 'function'
      ? window.AudioPrefs.isBattleSoundKey(nome)
      : nome === 'critical' || nome === 'soulshot' || nome === 'teleport';
  if (isBattle && !battleSfxAllowed()) return;
  unlockGameAudio();
  try {
    const clip = new Audio(src);
    clip.volume = sfxVolume(nome);
    clip.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

function tocarSomCritico(): void {
  tocarSom('critical');
}

/** Random blade swing for basic attack (Sword / Dagger only). */
function tocarSomEspada(): void {
  if (!isCuttingWeaponEquipped()) return;
  if (!battleSfxAllowed()) return;
  unlockGameAudio();
  const src = BLADE_SWING_SRC[Math.floor(Math.random() * BLADE_SWING_SRC.length)];
  try {
    const clip = new Audio(src);
    clip.volume = 0.78;
    clip.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// Banco de Dados de Status Iniciais por Raça
// atkSpeedFighter / atkSpeedMage = milissegundos entre ataques básicos (valor maior = mais lento).
// Balance early game (~nível 1): magos/linha mágica ~5s; físicos mais rápidos ~3.4–4.4s antes de mod.spd da classe.
window.statusIniciais = {
  Human: {
    hpFighter: 100,
    mpFighter: 40,
    hpMage: 80,
    mpMage: 80,
    danoFighter: 10,
    danoMage: 6,
    atkSpeedFighter: 3800,
    atkSpeedMage: 5000,
    critico: 5,
  },
  Elf: {
    hpFighter: 90,
    mpFighter: 50,
    hpMage: 70,
    mpMage: 100,
    danoFighter: 8,
    danoMage: 8,
    atkSpeedFighter: 3400,
    atkSpeedMage: 4500,
    critico: 10,
  },
  'Dark Elf': {
    hpFighter: 85,
    mpFighter: 45,
    hpMage: 65,
    mpMage: 95,
    danoFighter: 12,
    danoMage: 12,
    atkSpeedFighter: 3600,
    atkSpeedMage: 4700,
    critico: 15,
  },
  Orc: {
    hpFighter: 130,
    mpFighter: 30,
    hpMage: 110,
    mpMage: 60,
    danoFighter: 11,
    danoMage: 5,
    atkSpeedFighter: 4400,
    atkSpeedMage: 5200,
    critico: 3,
  },
  Dwarf: {
    hpFighter: 120,
    mpFighter: 40,
    hpMage: 120,
    mpMage: 40,
    danoFighter: 9,
    danoMage: 4,
    atkSpeedFighter: 4000,
    atkSpeedMage: 4900,
    critico: 4,
  },
} satisfies Record<string, RaceInitialStats>;

// Nota: As variáveis do personagem (charName, etc) foram movidas para js/core_globals.js
// para centralização e segurança de escopo.

window.tocarSom = tocarSom;
window.tocarSomCritico = tocarSomCritico;
window.tocarSomEspada = tocarSomEspada;
window.unlockGameAudio = unlockGameAudio;

export {};
