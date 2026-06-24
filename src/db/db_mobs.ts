/**
 * Migrado: js/db_mobs.js
 */

import type { HuntZoneData, HuntZoneGrade } from '../types/game';

// ==========================================
// BANCO DE DADOS - MONSTROS E ZONAS DE CAÇA
// (drops Adena alinhados a economia multiplayer / farm)
// Valores base; em runtime combat.js aplica L2MINI_ZONAL_MOB_TUNING por grade.
// atkSpd = ms para o monstro completar 1 ciclo de ataque (maior = mais lento).
// ==========================================

const zonasDeCaca: Record<HuntZoneGrade, HuntZoneData> = {
    'No-Grade': { 
        id: 'No-Grade', nome: 'Talking Island', custo: 0, 
        mobs: [
            { idImg: 'spider', nome: 'GIANT SPIDER', hpMax: 320, atk: 11, def: 12, dropAd: 72, xp: 42, chance: 18, atkSpd: 2750, lvl: 4 },
            { idImg: 'wolf', nome: 'WOLF', hpMax: 265, atk: 11, def: 10, dropAd: 56, xp: 38, chance: 37, atkSpd: 2150, lvl: 3 },
            { idImg: 'goblin', nome: 'GOBLIN', hpMax: 248, atk: 9, def: 7, dropAd: 40, xp: 26, chance: 45, atkSpd: 2680, lvl: 2 }
        ] 
    },
    'D': { 
        id: 'D', nome: 'Ruins of Despair', custo: 100, 
        mobs: [
            { idImg: 'zombie', nome: 'ZOMBIE SOLDIER', hpMax: 330, atk: 48, def: 58, dropAd: 238, xp: 120, chance: 40, atkSpd: 2300, lvl: 22 },
            { idImg: 'skeleton', nome: 'SKELETON ARCHER', hpMax: 265, atk: 56, def: 38, dropAd: 205, xp: 110, chance: 35, atkSpd: 1900, lvl: 24 },
            { idImg: 'bat', nome: 'RUIN BAT', hpMax: 175, atk: 40, def: 30, dropAd: 158, xp: 90, chance: 25, atkSpd: 1500, lvl: 20 }
        ] 
    },
    'C': { 
        id: 'C', nome: 'Death Pass', custo: 500, 
        mobs: [
            { idImg: 'fettered_soul', nome: 'FETTERED SOUL', hpMax: 1120, atk: 165, def: 175, dropAd: 718, xp: 400, chance: 40, atkSpd: 2600, lvl: 42 },
            { idImg: 'leto_lizardman', nome: 'LETO LIZARDMAN', hpMax: 840, atk: 138, def: 145, dropAd: 636, xp: 350, chance: 35, atkSpd: 1900, lvl: 40 },
            { idImg: 'wyrm', nome: 'WYRM', hpMax: 560, atk: 100, def: 95, dropAd: 478, xp: 250, chance: 25, atkSpd: 1450, lvl: 38 }
        ] 
    },
    'B': { 
        id: 'B', nome: 'Dragon Valley', custo: 2000, 
        mobs: [
            { idImg: 'cave_beast', nome: 'CAVE BEAST', hpMax: 2800, atk: 315, def: 330, dropAd: 2150, xp: 1100, chance: 40, atkSpd: 2650, lvl: 55 },
            { idImg: 'malruk_soldier', nome: 'MALRUK SOLDIER', hpMax: 2250, atk: 288, def: 285, dropAd: 1980, xp: 1000, chance: 35, atkSpd: 1950, lvl: 53 },
            { idImg: 'bloody_queen', nome: 'BLOODY QUEEN', hpMax: 1500, atk: 225, def: 190, dropAd: 1490, xp: 800, chance: 25, atkSpd: 1550, lvl: 51 }
        ] 
    },
    'A': { 
        id: 'A', nome: 'Tower of Insolence', custo: 10000, 
        mobs: [
            { idImg: 'doom_knight', nome: 'DOOM KNIGHT', hpMax: 6400, atk: 600, def: 660, dropAd: 6800, xp: 3500, chance: 40, atkSpd: 2700, lvl: 70 },
            { idImg: 'platinum_guardian', nome: 'PLATINUM GUARDIAN', hpMax: 5500, atk: 520, def: 565, dropAd: 5950, xp: 3000, chance: 35, atkSpd: 2000, lvl: 68 },
            { idImg: 'guardian_angel', nome: 'GUARDIAN ANGEL', hpMax: 4100, atk: 400, def: 425, dropAd: 4760, xp: 2500, chance: 25, atkSpd: 1650, lvl: 65 }
        ] 
    },
   'S': { 
        id: 'S', nome: 'Imperial Tomb', custo: 50000, 
        mobs: [
            { idImg: 'undead_knight', nome: 'UNDEAD KNIGHT', hpMax: 13500, atk: 1120, def: 1420, dropAd: 31800, xp: 12000, chance: 40, atkSpd: 2750, lvl: 80 },
            { idImg: 'imperial_guard', nome: 'IMPERIAL GUARD', hpMax: 10800, atk: 960, def: 1140, dropAd: 26500, xp: 10000, chance: 35, atkSpd: 2050, lvl: 78 },
            { idImg: 'tomb_banshee', nome: 'TOMB BANSHEE', hpMax: 7600, atk: 800, def: 860, dropAd: 21200, xp: 8000, chance: 25, atkSpd: 1700, lvl: 76 }
        ] 
    }
};

let zonaAtual: HuntZoneData = zonasDeCaca['No-Grade'];

window.zonasDeCaca = zonasDeCaca;
window.zonaAtual = zonaAtual;

export {};
