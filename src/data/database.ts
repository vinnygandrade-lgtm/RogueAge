/**
 * Migrado: js/database.js
 */

import type { GameSoundKey, RaceInitialStats } from '../types/game';

// ==========================================
// BANCO DE DADOS E VARIÁVEIS DO JOGADOR
// ==========================================

const sons: Record<GameSoundKey, HTMLAudioElement | null> = {
  ataque: new Audio('assets/sons/hit.wav'),
  enchant: new Audio('assets/sons/sucesso.wav'),
  lvlup: new Audio('assets/sons/levelup.mp3'),
  adenas: null,
  potion: null,
  enchant_success: null,
};

function tocarSom(nome: GameSoundKey): void {
  const clip = sons[nome];
  if (clip) {
    clip.currentTime = 0;
    clip.play().catch(() => {});
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

export {};
