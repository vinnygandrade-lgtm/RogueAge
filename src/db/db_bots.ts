/**
 * Migrado: db/db_bots.js
 */

import type { BotRankingSeed } from '../types/game';

// ==========================================
// BANCO DE DADOS DE BOTS PARA RANKING E CLÃS
// ==========================================
const dbBotsRanking: BotRankingSeed[] = [
  { nome: 'Varian', classe: 'Duelist', nivel: 80, olympiadPoints: 25000, vitorias: 320, derrotas: 115 },
  { nome: 'TitanGod', classe: 'Titan', nivel: 80, olympiadPoints: 24000, vitorias: 310, derrotas: 100 },
  { nome: 'Guldan', classe: 'Soultaker', nivel: 80, olympiadPoints: 23500, vitorias: 305, derrotas: 125 },
  { nome: 'Slayer', classe: 'Duelist', nivel: 80, olympiadPoints: 22000, vitorias: 300, derrotas: 120 },
  { nome: 'MysticKing', classe: 'Archmage', nivel: 78, olympiadPoints: 21000, vitorias: 280, derrotas: 150 },
  { nome: 'GhostWalker', classe: 'Ghost Hunter', nivel: 78, olympiadPoints: 20500, vitorias: 240, derrotas: 140 },
  { nome: 'Anduin', classe: 'Cardinal', nivel: 79, olympiadPoints: 19500, vitorias: 250, derrotas: 140 },
  { nome: 'Jaina', classe: 'Mystic Muse', nivel: 79, olympiadPoints: 19000, vitorias: 260, derrotas: 145 },
  { nome: 'DarkElf99', classe: 'Phantom Summoner', nivel: 77, olympiadPoints: 18500, vitorias: 250, derrotas: 180 },
  { nome: 'DeathBringer', classe: 'Hell Knight', nivel: 79, olympiadPoints: 17500, vitorias: 220, derrotas: 110 },
  { nome: 'Legolas', classe: 'Spellsinger', nivel: 75, olympiadPoints: 15500, vitorias: 210, derrotas: 190 },
  { nome: 'Tyrande', classe: 'Moonlight Sentinel', nivel: 78, olympiadPoints: 15000, vitorias: 225, derrotas: 150 },
  { nome: 'Ragnar', classe: 'Dreadnought', nivel: 78, olympiadPoints: 14500, vitorias: 210, derrotas: 160 },
  { nome: 'Thrall', classe: 'Dominator', nivel: 78, olympiadPoints: 13500, vitorias: 215, derrotas: 155 },
  { nome: 'Maiev', classe: 'Ghost Hunter', nivel: 78, olympiadPoints: 13000, vitorias: 235, derrotas: 145 },
  { nome: 'Rexxar', classe: 'Titan', nivel: 77, olympiadPoints: 12500, vitorias: 205, derrotas: 145 },
  { nome: 'Khadgar', classe: 'Archmage', nivel: 77, olympiadPoints: 12000, vitorias: 200, derrotas: 140 },
  { nome: 'Uther', classe: 'Phoenix Knight', nivel: 77, olympiadPoints: 11500, vitorias: 190, derrotas: 150 },
  { nome: 'Illidan', classe: 'Abyss Walker', nivel: 77, olympiadPoints: 11000, vitorias: 195, derrotas: 140 },
  { nome: 'Gandalf', classe: 'Archmage', nivel: 79, olympiadPoints: 10500, vitorias: 230, derrotas: 150 },
  { nome: 'Arthas', classe: 'Paladin', nivel: 76, olympiadPoints: 9500, vitorias: 180, derrotas: 130 },
  { nome: 'OrcSmash', classe: 'Dominator', nivel: 76, olympiadPoints: 9000, vitorias: 190, derrotas: 160 },
  { nome: 'SaintEva', classe: "Eva's Saint", nivel: 76, olympiadPoints: 8500, vitorias: 180, derrotas: 150 },
  { nome: 'Malfurion', classe: 'Elemental Master', nivel: 76, olympiadPoints: 8200, vitorias: 175, derrotas: 135 },
  { nome: 'Akama', classe: 'Grand Khavatari', nivel: 76, olympiadPoints: 7800, vitorias: 175, derrotas: 140 },
  { nome: 'Lagertha', classe: 'Sword Muse', nivel: 76, olympiadPoints: 7400, vitorias: 170, derrotas: 140 },
  { nome: 'Sylvanas', classe: 'Phantom Ranger', nivel: 75, olympiadPoints: 7000, vitorias: 150, derrotas: 130 },
  { nome: 'StormQueen', classe: 'Storm Screamer', nivel: 77, olympiadPoints: 6500, vitorias: 200, derrotas: 130 },
  { nome: 'WindRiderX', classe: 'Wind Rider', nivel: 75, olympiadPoints: 6000, vitorias: 160, derrotas: 140 },
  { nome: 'HealerPro', classe: 'Bishop', nivel: 74, olympiadPoints: 5500, vitorias: 175, derrotas: 140 },
  { nome: 'ShadowBlade', classe: 'Adventurer', nivel: 72, olympiadPoints: 4500, vitorias: 160, derrotas: 150 },
  { nome: 'IronWall', classe: 'Phoenix Knight', nivel: 70, olympiadPoints: 4000, vitorias: 140, derrotas: 120 },
  { nome: 'Spartacus', classe: 'Duelist', nivel: 70, olympiadPoints: 3500, vitorias: 130, derrotas: 110 },
  { nome: 'Baine', classe: 'Destroyer', nivel: 75, olympiadPoints: 3200, vitorias: 140, derrotas: 120 },
  { nome: 'Voljin', classe: 'Doomcryer', nivel: 76, olympiadPoints: 2800, vitorias: 165, derrotas: 145 },
  { nome: 'Leonidas', classe: 'Dreadnought', nivel: 72, olympiadPoints: 2500, vitorias: 145, derrotas: 125 },
  { nome: 'Xena', classe: 'Spectral Dancer', nivel: 71, olympiadPoints: 2200, vitorias: 135, derrotas: 115 },
  { nome: 'Hercules', classe: 'Titan', nivel: 74, olympiadPoints: 1800, vitorias: 165, derrotas: 135 },
  { nome: 'Achilles', classe: 'Phoenix Knight', nivel: 73, olympiadPoints: 1500, vitorias: 155, derrotas: 130 },
  { nome: 'Odysseus', classe: 'Adventurer', nivel: 69, olympiadPoints: 1200, vitorias: 120, derrotas: 105 },
  { nome: 'Yoda', classe: 'Mystic Muse', nivel: 60, olympiadPoints: 950, vitorias: 85, derrotas: 75 },
  { nome: 'Vader', classe: 'Dark Avenger', nivel: 55, olympiadPoints: 900, vitorias: 75, derrotas: 65 },
  { nome: 'Luke', classe: 'Paladin', nivel: 52, olympiadPoints: 850, vitorias: 68, derrotas: 60 },
  { nome: 'HanSolo', classe: 'Hawkeye', nivel: 53, olympiadPoints: 800, vitorias: 69, derrotas: 61 },
  { nome: 'Chewie', classe: 'Titan', nivel: 56, olympiadPoints: 750, vitorias: 72, derrotas: 64 },
  { nome: 'Leia', classe: "Eva's Saint", nivel: 54, olympiadPoints: 700, vitorias: 70, derrotas: 62 },
  { nome: 'BobaFett', classe: 'Bounty Hunter', nivel: 50, olympiadPoints: 650, vitorias: 60, derrotas: 55 },
  { nome: 'Thor', classe: 'Destroyer', nivel: 45, olympiadPoints: 400, vitorias: 45, derrotas: 40 },
  { nome: 'Odin', classe: 'Overlord', nivel: 48, olympiadPoints: 350, vitorias: 48, derrotas: 42 },
  { nome: 'Loki', classe: 'Abyss Walker', nivel: 42, olympiadPoints: 307, vitorias: 40, derrotas: 38 },
];

window.dbBotsRanking = dbBotsRanking;

export {};
