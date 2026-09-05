/**
 * Sistema de classes e evolução
 * Migrado: js/classes.js
 */
import { classEvolutionDisplayName } from '../i18n/polish12_display';
import { renderClassTransferOptions } from '../ui/ui_class_transfer';

// ==========================================
// hp/mp/atk/def/crit: multiplicadores de piscina de stats (ver core_stats.js).
// spd: multiplica o INTERVALO em ms entre ataques básicos — valor MAIOR = cadência MAIS LENTA; menor que 1 = mais rápido.
//     Cast speed de magias usa outro campo (castSpeed) onde existir; não confundir os dois.
const classModifiers = {
    // === CLASSES BASE (Iniciantes Nível 1) ===
    "Fighter": { hp: 0.85, mp: 0.8, atk: 1.0, def: 0.85, spd: 1.0, crit: 5 },
    "Mage": { hp: 0.7, mp: 1.0, atk: 1.0, def: 0.6, spd: 1.0, crit: 2 },
    // === CLASSE BASE (Nível 1) ===
    "Dark_Fighter": { hp: 0.75, mp: 0.9, atk: 1.2, def: 0.65, spd: 0.98, crit: 7 },
    "Dark_Mage": { hp: 0.6, mp: 1.1, atk: 1.2, def: 0.5, spd: 1.1, crit: 5 },
    // === PRIMEIRA TRANSFERÊNCIA (NÍVEL 20) ===
    "Warrior": { hp: 1.2, mp: 1.0, atk: 1.3, def: 1.1, spd: 1.05, crit: 5 },
    "Human Knight": { hp: 1.4, mp: 1.0, atk: 0.9, def: 1.5, spd: 1.0, crit: 0 },
    "Rogue": { hp: 1.0, mp: 1.0, atk: 1.2, def: 0.9, spd: 0.85, crit: 7 }, 
    "Human Wizard": { hp: 0.8, mp: 1.5, atk: 1.6, def: 0.8, spd: 0.9, crit: 5 },
    "Cleric": { hp: 1.0, mp: 1.5, atk: 1.2, def: 1.0, spd: 0.9, crit: 5 },

    // === SEGUNDA TRANSFERÊNCIA (NÍVEL 40) ===
    "Gladiator": { hp: 1.4, mp: 1.1, atk: 1.7, def: 1.2, spd: 0.96, crit: 7 },
    "Warlord": { hp: 1.6, mp: 1.0, atk: 1.5, def: 1.3, spd: 0.9, crit: 5 },
    "Paladin": { hp: 1.8, mp: 1.2, atk: 0.9, def: 2.2, spd: 0.9, crit: 2 },
    "Dark Avenger": { hp: 1.8, mp: 1.0, atk: 1.0, def: 2.0, spd: 1.0, crit: 2 }, 
    "Treasure Hunter": { hp: 1.1, mp: 1.0, atk: 1.4, def: 0.9, spd: 0.58, crit: 9 }, 
    "Hawkeye": { hp: 1.1, mp: 1.0, atk: 1.8, def: 0.9, spd: 0.94, crit: 10 }, 
    "Necromancer": { hp: 0.8, mp: 2.0, atk: 2.5, def: 0.8, spd: 0.8, crit: 7 },
    "Sorcerer": { hp: 0.8, mp: 2.0, atk: 2.5, def: 0.8, spd: 0.8, crit: 7 }, // <-- Mago de Fogo Adicionado
    "Bishop": { hp: 1.1, mp: 2.2, atk: 1.5, def: 1.1, spd: 0.9, crit: 5 },
    // Prophet = buffer path (less tanky than Bishop, strong MP pool for hymns)
    "Prophet": { hp: 1.0, mp: 2.1, atk: 1.35, def: 0.95, spd: 0.9, crit: 5 },

    // === TERCEIRA TRANSFERÊNCIA (NÍVEL 76 - ENDGAME) ===
    "Duelist": { hp: 1.6, mp: 1.2, atk: 2.5, def: 1.3, spd: 0.88, crit: 8 },
    "Dreadnought": { hp: 2.0, mp: 1.2, atk: 2.2, def: 1.5, spd: 0.95, crit: 7 },
    "Phoenix Knight": { hp: 2.6, mp: 1.5, atk: 1.2, def: 3.5, spd: 0.95, crit: 5 },
    "Hell Knight": { hp: 2.5, mp: 1.2, atk: 1.3, def: 3.2, spd: 0.95, crit: 5 }, 
    "Adventurer": { hp: 1.3, mp: 1.2, atk: 2.0, def: 1.0, spd: 0.50, crit: 10 },
    "Sagittarius": { hp: 1.3, mp: 1.2, atk: 3.0, def: 1.0, spd: 1.0, crit: 10 },
    // Human 3rd mages: Soultaker = necro (sustentação/vida); Archmage = burst elemental (mais dano, mais frágil).
    // Atk alinhado ao tier ~3.2–3.4 (Storm Screamer) — 4.0 + def alta gerava desequilíbrio com gear e PvP.
    "Soultaker": { hp: 0.92, mp: 2.85, atk: 3.22, def: 0.88, spd: 0.76, crit: 9 },
    "Archmage": { hp: 0.84, mp: 2.92, atk: 3.38, def: 0.76, spd: 0.74, crit: 7 },
    "Warlock": { hp: 1.2, mp: 2.0, atk: 2.0, def: 1.1, spd: 0.9, crit: 5 },
    "Arcane Lord": { hp: 1.45, mp: 3.0, atk: 3.2, def: 1.2, spd: 0.9, crit: 6 },
    "Cardinal": { hp: 1.22, mp: 3.5, atk: 2.0, def: 1.22, spd: 0.9, crit: 5 },
    "Hierophant": { hp: 1.12, mp: 3.0, atk: 1.75, def: 1.05, spd: 0.9, crit: 5 },

    // === DARK ELVES (Fighters & Mages) ===
    "Assassin": { hp: 0.90, mp: 1.0, atk: 1.6, def: 0.7, spd: 0.80, crit: 9 },
    "Abyss Walker": { hp: 1.05, mp: 1.0, atk: 2.2, def: 0.75, spd: 0.66, crit: 9 },
    "Ghost Hunter": { hp: 1.25, mp: 1.0, atk: 3.0, def: 0.8, spd: 0.54, crit: 11 },
    // === DARK ELVES (Magos) ===
    "Dark Wizard": { hp: 0.75, mp: 1.25, atk: 1.8, def: 0.55, spd: 1.3, crit: 5 },
    "Spellhowler": { hp: 0.90, mp: 1.40, atk: 2.6, def: 0.60, spd: 1.5, crit: 6 },
    // Topo de atk puro entre magos 3rd; paga com def mais baixa que humanos (jogo justo entre raças).
    "Storm Screamer": { hp: 1.08, mp: 1.65, atk: 3.42, def: 0.62, spd: 1.62, crit: 6 },
    // === DARK ELVES (Arqueiros) ===
    "Palus Ranger": { hp: 0.90, mp: 1.0, atk: 1.7, def: 0.7, spd: 0.90, crit: 10 },
    "Phantom Ranger": { hp: 1.05, mp: 1.1, atk: 2.5, def: 0.7, spd: 0.84, crit: 10 },
    "Ghost Sentinel": { hp: 1.25, mp: 1.2, atk: 3.5, def: 0.8, spd: 0.78, crit: 10 },
    // === DARK ELVES (Espadas Duplas / Dançarinos) ===
    "Palus Knight": { hp: 0.95, mp: 1.0, atk: 1.5, def: 0.80, spd: 1.0, crit: 7 },
    "Bladedancer": { hp: 1.15, mp: 1.2, atk: 2.1, def: 0.85, spd: 0.92, crit: 8 },
    "Spectral Dancer": { hp: 1.40, mp: 1.4, atk: 3.2, def: 0.95, spd: 0.86, crit: 10 },
    // === DARK ELVES (Tanque Sombrio / Escudo) ===
    // (O Palus Knight Lvl 20 já existe no seu código, não precisa duplicar)
    "Shillien Knight": { hp: 1.25, mp: 1.1, atk: 1.8, def: 1.25, spd: 1.08, crit: 8 },
    "Shillien Templar": { hp: 1.55, mp: 1.2, atk: 2.5, def: 1.65, spd: 1.12, crit: 9 },

    // === DARK ELVES (Invocador de Sombras) ===
    // (O Dark Wizard Lvl 20 já existe no seu código)
    "Phantom Summoner": { hp: 0.90, mp: 1.40, atk: 2.2, def: 0.70, spd: 1.08, crit: 6 },
    "Spectral Master": { hp: 1.18, mp: 1.60, atk: 3.0, def: 0.88, spd: 1.06, crit: 6 },

    // === DARK ELVES (Curandeiro / Suporte) ===
    "Shillien Oracle": { hp: 0.70, mp: 1.30, atk: 1.3, def: 0.55, spd: 1.05, crit: 5 },
    "Shillien Elder": { hp: 0.85, mp: 1.50, atk: 1.6, def: 0.65, spd: 1.04, crit: 5 },
    "Shillien Saint": { hp: 1.08, mp: 1.80, atk: 2.2, def: 0.78, spd: 1.03, crit: 6 },
    // === ELFOS DA LUZ (Base Lvl 20) ===
    "Elven Knight": { hp: 1.1, mp: 1.1, atk: 1.2, def: 1.3, spd: 1.08, crit: 7 },
    "Elven Scout": { hp: 0.8, mp: 1.0, atk: 1.3, def: 0.8, spd: 0.86, crit: 10 },
    "Elven Wizard": { hp: 0.6, mp: 1.4, atk: 1.4, def: 0.6, spd: 1.12, crit: 5 },
    "Elven Oracle": { hp: 0.7, mp: 1.4, atk: 1.0, def: 0.6, spd: 1.06, crit: 4 },

    // === ELFOS DA LUZ (Guerreiros Nível 40 e 76) ===
    "Temple Knight": { hp: 1.3, mp: 1.2, atk: 1.4, def: 1.6, spd: 1.14, crit: 7 },
    "Eva's Templar": { hp: 1.6, mp: 1.3, atk: 1.9, def: 2.1, spd: 1.12, crit: 8 },
    
    "Swordsinger": { hp: 1.1, mp: 1.2, atk: 1.4, def: 1.3, spd: 1.06, crit: 8 },
    "Sword Muse": { hp: 1.4, mp: 1.4, atk: 1.8, def: 1.6, spd: 1.04, crit: 9 },

    "Plains Walker": { hp: 0.9, mp: 1.0, atk: 1.5, def: 0.9, spd: 0.62, crit: 9 },
    "Wind Rider": { hp: 1.1, mp: 1.1, atk: 2.2, def: 1.1, spd: 0.52, crit: 10 },

    "Silver Ranger": { hp: 0.8, mp: 1.1, atk: 1.6, def: 0.8, spd: 0.88, crit: 10 },
    "Moonlight Sentinel": { hp: 1.0, mp: 1.2, atk: 2.4, def: 1.0, spd: 0.80, crit: 12 },

    // === ELFOS DA LUZ (Magos Nível 40 e 76) ===
    "Spellsinger": { hp: 0.7, mp: 1.6, atk: 1.8, def: 0.7, spd: 1.10, crit: 5 },
    "Mystic Muse": { hp: 0.92, mp: 2.15, atk: 2.88, def: 0.90, spd: 1.06, crit: 6 },

    "Elemental Summoner": { hp: 0.9, mp: 1.5, atk: 1.6, def: 0.8, spd: 1.12, crit: 5 },
    "Elemental Master": { hp: 1.1, mp: 1.9, atk: 2.58, def: 1.02, spd: 1.08, crit: 6 },

    "Elven Elder": { hp: 0.8, mp: 1.7, atk: 1.2, def: 0.7, spd: 1.05, crit: 5 },
    "Eva's Saint": { hp: 1.0, mp: 2.1, atk: 1.8, def: 0.9, spd: 1.04, crit: 5 },

    // === ORCS (Classes Base - Lvl 1) ===
    "Orc_Fighter": { hp: 1.2, mp: 0.6, atk: 1.3, def: 1.1, spd: 0.8, crit: 4 },
    "Orc_Mage": { hp: 1.0, mp: 0.9, atk: 1.1, def: 0.9, spd: 0.9, crit: 3 },

    // === ORCS (Primeira Transferência - Lvl 20) ===
    "Orc Raider": { hp: 1.5, mp: 0.7, atk: 1.6, def: 1.2, spd: 0.8, crit: 5 }, // Espadão de 2 mãos
    "Monk": { hp: 1.3, mp: 0.8, atk: 1.4, def: 1.0, spd: 0.90, crit: 7 }, // Garras e Socos
    "Orc Shaman": { hp: 1.2, mp: 1.1, atk: 1.4, def: 1.1, spd: 1.0, crit: 4 }, // Mago de Batalha

    // === ORCS (Segunda Transferência - Lvl 40) ===
    "Destroyer": { hp: 2.0, mp: 0.8, atk: 2.2, def: 1.4, spd: 0.8, crit: 6 },
    "Tyrant": { hp: 1.6, mp: 1.0, atk: 1.8, def: 1.1, spd: 0.82, crit: 8 },
    "Overlord": { hp: 1.6, mp: 1.4, atk: 1.8, def: 1.4, spd: 1.0, crit: 5 }, // Foco em Debuff e absorção
    "Warcryer": { hp: 1.5, mp: 1.5, atk: 1.7, def: 1.3, spd: 1.1, crit: 5 }, // Foco em Buffs para o grupo

    // === ORCS (Terceira Transferência - Lvl 76) ===
    "Titan": { hp: 2.8, mp: 1.0, atk: 3.5, def: 1.8, spd: 0.85, crit: 7 }, // O monstro do Frenzy
    "Grand Khavatari": { hp: 2.0, mp: 1.2, atk: 2.8, def: 1.3, spd: 0.74, crit: 9 }, // Metralhadora de socos
    "Dominator": { hp: 2.2, mp: 1.8, atk: 2.5, def: 1.8, spd: 1.0, crit: 6 },
    "Doomcryer": { hp: 2.0, mp: 2.0, atk: 2.4, def: 1.6, spd: 1.2, crit: 6 },

    // === ANÕES (Classe Base - Lvl 1) ===
    "Dwarven Fighter": { hp: 1.2, mp: 0.8, atk: 1.1, def: 1.2, spd: 0.9, crit: 4 },

    // === ANÕES (SCAVENGER / BOUNTY HUNTER / FORTUNE SEEKER) - Foco em Spoil e Adagas ===
    "Scavenger": { hp: 1.3, mp: 0.9, atk: 1.2, def: 1.2, spd: 1.1, crit: 6 },
    "Bounty Hunter": { hp: 1.5, mp: 1.0, atk: 1.4, def: 1.3, spd: 1.2, crit: 7 },
    "Fortune Seeker": { hp: 1.8, mp: 1.1, atk: 1.7, def: 1.5, spd: 1.3, crit: 8 },

    // === ANÕES (ARTISAN / WARSMITH / MAESTRO) - Foco em Força, Golems e Machados ===
    "Artisan": { hp: 1.4, mp: 1.1, atk: 1.3, def: 1.3, spd: 0.9, crit: 5 },
    "Warsmith": { hp: 1.7, mp: 1.2, atk: 1.6, def: 1.5, spd: 0.9, crit: 5 },
    "Maestro": { hp: 2.1, mp: 1.4, atk: 2.0, def: 1.8, spd: 1.0, crit: 6 },
};

/** Class factory Dodge % (before level / Light armor). Light & dagger paths lead; tanks near 0. */
const CLASS_DODGE_BASE: Record<string, number> = {
    Fighter: 2, Mage: 1, Dark_Fighter: 3, Dark_Mage: 2,
    Warrior: 2, 'Human Knight': 0, Rogue: 4, 'Human Wizard': 2, Cleric: 2,
    Gladiator: 2, Warlord: 1, Paladin: 0, 'Dark Avenger': 0,
    'Treasure Hunter': 7, Hawkeye: 6,
    Necromancer: 2, Sorcerer: 2, Bishop: 2, Prophet: 2,
    Duelist: 2, Dreadnought: 1, 'Phoenix Knight': 0, 'Hell Knight': 0,
    Adventurer: 9, Sagittarius: 7,
    Soultaker: 2, Archmage: 2, Warlock: 2, 'Arcane Lord': 2, Cardinal: 2, Hierophant: 2,
    Assassin: 6, 'Abyss Walker': 8, 'Ghost Hunter': 10,
    'Dark Wizard': 2, Spellhowler: 2, 'Storm Screamer': 2,
    'Palus Ranger': 6, 'Phantom Ranger': 7, 'Ghost Sentinel': 8,
    'Palus Knight': 2, Bladedancer: 4, 'Spectral Dancer': 6,
    'Shillien Knight': 2, 'Shillien Templar': 2,
    'Phantom Summoner': 2, 'Spectral Master': 2,
    'Shillien Oracle': 2, 'Shillien Elder': 2, 'Shillien Saint': 2,
    'Elven Knight': 2, 'Elven Scout': 6, 'Elven Wizard': 2, 'Elven Oracle': 2,
    'Temple Knight': 2, "Eva's Templar": 2,
    Swordsinger: 3, 'Sword Muse': 3,
    'Plains Walker': 7, 'Wind Rider': 9,
    'Silver Ranger': 7, 'Moonlight Sentinel': 8,
    Spellsinger: 2, 'Mystic Muse': 2,
    'Elemental Summoner': 2, 'Elemental Master': 2,
    'Elven Elder': 2, "Eva's Saint": 2,
    Orc_Fighter: 1, Orc_Mage: 1,
    'Orc Raider': 1, Monk: 3, 'Orc Shaman': 1,
    Destroyer: 1, Tyrant: 4, Overlord: 1, Warcryer: 1,
    Titan: 0, 'Grand Khavatari': 6, Dominator: 1, Doomcryer: 1,
    'Dwarven Fighter': 1,
    Scavenger: 2, 'Bounty Hunter': 3, 'Fortune Seeker': 3,
    Artisan: 1, Warsmith: 1, Maestro: 1,
};

for (const className of Object.keys(classModifiers)) {
    const row = classModifiers[className] as { dodge?: number };
    row.dodge = CLASS_DODGE_BASE[className] ?? 1;
}

// Árvore de Evolução e Requisitos (Com trava de Raça para Nível 1)
const classEvolutions = {
    // === Nível 1 -> 20 (Filtro por Raça) ===
    // === Nível 1 -> 20 (Filtro por Raça) ===
    "Human_Fighter": [
        { nome: "Warrior", reqLvl: 20, desc: "Focus on brute physical damage and melee combat.", cor: "#f97316" },
        { nome: "Human Knight", reqLvl: 20, desc: "Focus on defense and survival (tank).", cor: "#60a5fa" },
        { nome: "Rogue", reqLvl: 20, desc: "Focus on speed, critical hits, and evasion.", cor: "#fde047" }
    ],
    "Human_Mage": [
        { nome: "Human Wizard", reqLvl: 20, desc: "Focus on destructive magic damage. Low defense.", cor: "#ef4444" },
        { nome: "Cleric", reqLvl: 20, desc: "Focused on healing magic and divine support.", cor: "#22c55e" }
    ],
   // === Nível 1 -> 20 (Atualize a lista do Dark_Fighter para ter as 3 opções) ===
    "Dark_Fighter": [
        { nome: "Assassin", reqLvl: 20, desc: "Focus on speed, daggers, and critical damage.", cor: "#6b7280" },
        { nome: "Palus Ranger", reqLvl: 20, desc: "Dark archer focused on high damage per shot.", cor: "#166534" },
        { nome: "Palus Knight", reqLvl: 20, desc: "Warrior focused on dual swords and shadow magic.", cor: "#7f1d1d" }
    ],
    "Dark_Mage": [
        { nome: "Dark Wizard", reqLvl: 20, desc: "Mage focused on offensive damage spells and summons.", cor: "#991b1b" },
        { nome: "Shillien Oracle", reqLvl: 20, desc: "Focused on heals, combat buffs, and divine support.", cor: "#2563eb" }
    ],
    // === Nível 20 -> 40 ===
    "Warrior": [
        { nome: "Gladiator", reqLvl: 40, desc: "Blade master. High damage and speed.", cor: "#ea580c" },
        { nome: "Warlord", reqLvl: 40, desc: "Pole weapon master. Area damage specialist.", cor: "#b45309" }
    ],
    "Human Knight": [
        { nome: "Paladin", reqLvl: 40, desc: "Warrior of Light. Extreme divine defense and healing.", cor: "#3b82f6" },
        { nome: "Dark Avenger", reqLvl: 40, desc: "Dark knight. Near-impenetrable defense.", cor: "#8b5cf6" }
    ],
    "Rogue": [
        { nome: "Treasure Hunter", reqLvl: 40, desc: "Dagger master. Extreme crit and lethal speed.", cor: "#fde047" },
        { nome: "Hawkeye", reqLvl: 40, desc: "Bow master. Massive ranged damage.", cor: "#f97316" }
    ],
   "Human Wizard": [
        { nome: "Necromancer", reqLvl: 40, desc: "Master of Death. Overwhelming shadow damage.", cor: "#9333ea" },
        { nome: "Sorcerer", reqLvl: 40, desc: "Fire master. Explosions and catastrophic area damage.", cor: "#ef4444" },
        { nome: "Warlock", reqLvl: 40, desc: "Summoner master. Calls magical felines into battle.", cor: "#ca8a04" }
    ],
    "Assassin": [
        { nome: "Abyss Walker", reqLvl: 40, desc: "Lethal shadow assassin.", cor: "#374151" }
    ],
  "Dark Wizard": [
        { nome: "Spellhowler", reqLvl: 40, desc: "Mage focused on raw magic damage, wind, and darkness.", cor: "#7e22ce" },
        { nome: "Phantom Summoner", reqLvl: 40, desc: "Summoner who commands dark demons to fight for him.", cor: "#475569" }
    ],
    "Shillien Oracle": [
        { nome: "Shillien Elder", reqLvl: 40, desc: "Master of buffs and mana recharge.", cor: "#1d4ed8" }
    ],
    "Palus Ranger": [
        { nome: "Phantom Ranger", reqLvl: 40, desc: "Lethal shooter; trades defense for massive damage.", cor: "#14532d" }
    ],
    // === Nível 20 -> 40 ===
    "Palus Knight": [
        { nome: "Bladedancer", reqLvl: 40, desc: "Master of dual blades and war dances.", cor: "#991b1b" },
        { nome: "Shillien Knight", reqLvl: 40, desc: "Dark knight with sword, shield, and life-steal magic.", cor: "#1e3a8a" }
    ],
    // === Nível 40 -> 76 (3rd Class Transfer) ===
    "Gladiator": [
        { nome: "Duelist", reqLvl: 76, desc: "The peak of martial combat. Massive physical damage.", cor: "#ef4444" }
    ],
    "Warlord": [
        { nome: "Dreadnought", reqLvl: 76, desc: "Lord of battle. Dominates whole armies.", cor: "#9a3412" }
    ],
    "Paladin": [
        { nome: "Phoenix Knight", reqLvl: 76, desc: "Immortality incarnate. Unbreakable wall of light.", cor: "#2563eb" }
    ],
    "Dark Avenger": [
        { nome: "Hell Knight", reqLvl: 76, desc: "Absolute shadow control. A wall of terror and resilience.", cor: "#dc2626" }
    ],
    "Treasure Hunter": [
        { nome: "Adventurer", reqLvl: 76, desc: "Peak lethal combat. Imperceptible moves and perfect crits.", cor: "#facc15" }
    ],
    "Hawkeye": [
        { nome: "Sagittarius", reqLvl: 76, desc: "Legendary elite archer. Every arrow is a death sentence.", cor: "#ea580c" }
    ],
    "Necromancer": [
        { nome: "Soultaker", reqLvl: 76, desc: "The abyss incarnate. Commands life, death, and cruel curses.", cor: "#6b21a8" }
    ],
    "Sorcerer": [
        { nome: "Archmage", reqLvl: 76, desc: "The peak of fire magic. Volcanic obliteration.", cor: "#7f1d1d" }
    ],
    "Warlock": [
        { nome: "Arcane Lord", reqLvl: 76, desc: "Lord of summons. Commands the Feline King.", cor: "#b91c1c" }
    ],
    // Lembre de colocar a vírgula depois do bloco do Warlock!
    "Cleric": [
        { nome: "Bishop", reqLvl: 40, desc: "Master of heals and divine shields. Nearly immortal.", cor: "#22c55e" },
        { nome: "Prophet", reqLvl: 40, desc: "Battle hymnist. Empowers allies with attack, armor, and speed blessings.", cor: "#a78bfa" }
    ],
    "Bishop": [
        { nome: "Cardinal", reqLvl: 76, desc: "Sacred envoy. Can perform miraculous heals.", cor: "#10b981" }
    ],
    "Prophet": [
        { nome: "Hierophant", reqLvl: 76, desc: "Supreme prophet. Speaks the Prophecy of Wind — peak combat cadence.", cor: "#8b5cf6" }
    ],
    "Abyss Walker": [
        { nome: "Ghost Hunter", reqLvl: 76, desc: "A lethal ghost on the battlefield.", cor: "#111827" }
    ],
    "Spellhowler": [
        { nome: "Storm Screamer", reqLvl: 76, desc: "The storm incarnate. Extreme damage.", cor: "#3b0764" }
    ],
    "Phantom Ranger": [
        { nome: "Ghost Sentinel", reqLvl: 76, desc: "The phantom shooter. Shots that pierce the soul.", cor: "#052e16" }
    ],
    "Bladedancer": [
        { nome: "Spectral Dancer", reqLvl: 76, desc: "The dance of death. Their moves wipe out armies.", cor: "#450a0a" }
    ],
    "Shillien Knight": [ { nome: "Shillien Templar", reqLvl: 76, desc: "Shillien's unbreakable wall.", cor: "#172554" } ],
    "Phantom Summoner": [ { nome: "Spectral Master", reqLvl: 76, desc: "Supreme master of shadow entities.", cor: "#334155" } ],
    "Shillien Elder": [ { nome: "Shillien Saint", reqLvl: 76, desc: "Divinity of healing and shadow miracles.", cor: "#1e40af" } ],
    // === Nível 1 -> 20 (Elfos da Luz) ===
    "Elf_Fighter": [
        { nome: "Elven Knight", reqLvl: 20, desc: "Warrior focused on shield defense and light magic.", cor: "#3b82f6" },
        { nome: "Elven Scout", reqLvl: 20, desc: "Expert in evasion, speed, daggers, and bows.", cor: "#22c55e" }
    ],
    "Elf_Mage": [
        { nome: "Elven Wizard", reqLvl: 20, desc: "Mage focused on cast speed and water magic.", cor: "#0ea5e9" },
        { nome: "Elven Oracle", reqLvl: 20, desc: "Healer focused on defense and speed.", cor: "#facc15" }
    ],

    // === Nível 20 -> 40 (Elfos da Luz) ===
    "Elven Knight": [
        { nome: "Temple Knight", reqLvl: 40, desc: "Holy knight with divine shield and high block rate.", cor: "#1d4ed8" },
        { nome: "Swordsinger", reqLvl: 40, desc: "Support warrior who sings songs that raise party defense.", cor: "#8b5cf6" }
    ],
    "Elven Scout": [
        { nome: "Plains Walker", reqLvl: 40, desc: "Fastest assassin in Aden. Dagger specialist.", cor: "#15803d" },
        { nome: "Silver Ranger", reqLvl: 40, desc: "Extremely fast archer. Shoot and run.", cor: "#a3e635" }
    ],
    "Elven Wizard": [
        { nome: "Spellsinger", reqLvl: 40, desc: "Water mage with the fastest casting in the game.", cor: "#0284c7" },
        { nome: "Elemental Summoner", reqLvl: 40, desc: "Summoner who commands magic unicorns.", cor: "#60a5fa" }
    ],
    "Elven Oracle": [
        { nome: "Elven Elder", reqLvl: 40, desc: "Healer focused on quick heals and defense buffs.", cor: "#eab308" }
    ],

    // === Nível 40 -> 76 (Elfos da Luz) ===
    "Temple Knight": [ { nome: "Eva's Templar", reqLvl: 76, desc: "Eva's absolute guardian. Impenetrable shield.", cor: "#1e3a8a" } ],
    "Swordsinger": [ { nome: "Sword Muse", reqLvl: 76, desc: "Divine voice that rallies whole armies.", cor: "#6d28d9" } ],
    "Plains Walker": [ { nome: "Wind Rider", reqLvl: 76, desc: "Rides the winds. Nearly impossible to hit.", cor: "#14532d" } ],
    "Silver Ranger": [ { nome: "Moonlight Sentinel", reqLvl: 76, desc: "Moon sentinel. Their arrows are beams of light.", cor: "#65a30d" } ],
    "Spellsinger": [ { nome: "Mystic Muse", reqLvl: 76, desc: "Absolute mastery of ice and water.", cor: "#0369a1" } ],
    "Elemental Summoner": [ { nome: "Elemental Master", reqLvl: 76, desc: "Commander of the Unicorn King (Magnus).", cor: "#3b82f6" } ],
    "Elven Elder": [ { nome: "Eva's Saint", reqLvl: 76, desc: "Saint of divine light. Supreme healing.", cor: "#ca8a04" } ],

    // === Nível 1 -> 20 (Filtro por Raça: ORCS) ===
    "Orc_Fighter": [
        { nome: "Orc Raider", reqLvl: 20, desc: "Warrior focused on brute strength and two-handed swords.", cor: "#dc2626" },
        { nome: "Monk", reqLvl: 20, desc: "Martial artist using claws and high-speed attacks.", cor: "#ea580c" }
    ],
    "Orc_Mage": [
        { nome: "Orc Shaman", reqLvl: 20, desc: "Battle mage. Curses enemies and supports physical attacks.", cor: "#84cc16" }
    ],

    // === Nível 20 -> 40 (ORCS) ===
    "Orc Raider": [
        { nome: "Destroyer", reqLvl: 40, desc: "A monster on the battlefield. The lower his HP, the harder he hits.", cor: "#991b1b" }
    ],
    "Monk": [
        { nome: "Tyrant", reqLvl: 40, desc: "Master of animal totems. Insane attack speed.", cor: "#c2410c" }
    ],
    "Orc Shaman": [
        { nome: "Overlord", reqLvl: 40, desc: "Clan leader. Expert at rooting and shattering whole armies.", cor: "#4d7c0f" },
        { nome: "Warcryer", reqLvl: 40, desc: "War shaman. Chants that empower everyone nearby.", cor: "#65a30d" }
    ],

    // === Nível 40 -> 76 (ORCS - ENDGAME) ===
    "Destroyer": [ { nome: "Titan", reqLvl: 76, desc: "Wrath incarnate. Said to slay gods in one blow.", cor: "#7f1d1d" } ],
    "Tyrant": [ { nome: "Grand Khavatari", reqLvl: 76, desc: "Peak of melee. Fists that break mountains.", cor: "#9a3412" } ],
    "Overlord": [ { nome: "Dominator", reqLvl: 76, desc: "Absolute lord of war. Relentless crowd control.", cor: "#3f6212" } ],
    "Warcryer": [ { nome: "Doomcryer", reqLvl: 76, desc: "Herald of destruction. Supreme support and damage chants.", cor: "#4d7c0f" } ],
    // === ANÕES: PRIMEIRA TRANSFERÊNCIA (Nível 20) ===
    "Dwarven Fighter": [
        { nome: "Scavenger", reqLvl: 20, desc: "Expert at extracting extra loot (Spoil) from monsters.", cor: "#facc15" },
        { nome: "Artisan", reqLvl: 20, desc: "Master builder. Summons mechanical golems to fight.", cor: "#d97706" }
    ],

    // === ANÕES: SEGUNDA TRANSFERÊNCIA (Nível 40) ===
    "Scavenger": [
        { nome: "Bounty Hunter", reqLvl: 40, desc: "King of farming. Maximizes rare resources and recipes.", cor: "#eab308" }
    ],
    "Artisan": [
        { nome: "Warsmith", reqLvl: 40, desc: "Legendary smith. Summons siege golems and hits hard with axes.", cor: "#b45309" }
    ],

    // === ANÕES: TERCEIRA TRANSFERÊNCIA (Nível 76) ===
    "Bounty Hunter": [ 
        { nome: "Fortune Seeker", reqLvl: 76, desc: "Living legend of wealth. Pulls unimaginable treasures (supreme Spoil).", cor: "#ca8a04" } 
    ],
    "Warsmith": [ 
        { nome: "Maestro", reqLvl: 76, desc: "Genius of mechanics. Wins battles with supreme clockwork creations.", cor: "#92400e" } 
    ],
};

function resolveClassEvolutionKey(): string {
    let chaveEvolucao = String(window.charClass || 'Fighter');
    if (chaveEvolucao === 'Fighter' || chaveEvolucao === 'Mage') {
        chaveEvolucao = `${window.charRace || 'Human'}_${chaveEvolucao}`;
    }
    return chaveEvolucao;
}

export type ClassTransferAvailability = {
    hasAvailable: boolean;
    count: number;
    nextReqLvl: number | null;
    optionsTotal: number;
};

function getClassTransferAvailability(): ClassTransferAvailability {
    const chave = resolveClassEvolutionKey();
    const opcoes = (classEvolutions as Record<string, Array<{ nome: string; reqLvl: number }>>)[chave];
    if (!Array.isArray(opcoes) || opcoes.length === 0) {
        return { hasAvailable: false, count: 0, nextReqLvl: null, optionsTotal: 0 };
    }
    const lvl = Number(window.nivel) || 1;
    let count = 0;
    let nextReqLvl: number | null = null;
    for (let i = 0; i < opcoes.length; i++) {
        const req = Number(opcoes[i].reqLvl) || 1;
        if (lvl >= req) {
            count++;
        } else if (nextReqLvl == null || req < nextReqLvl) {
            nextReqLvl = req;
        }
    }
    return {
        hasAvailable: count > 0,
        count,
        nextReqLvl,
        optionsTotal: opcoes.length,
    };
}

function paintNpcReadyNotif(
    host: HTMLElement | null,
    show: boolean,
    ariaLabel: string,
): void {
    if (!host) return;
    let pill = host.querySelector('.npc-ready-notif') as HTMLElement | null;
    if (!show) {
        if (pill) {
            pill.hidden = true;
            pill.textContent = '';
            pill.removeAttribute('aria-label');
        }
        host.classList.remove('npc-ready--has-notif');
        return;
    }
    if (!pill) {
        pill = document.createElement('span');
        pill.className = 'npc-ready-notif';
        pill.setAttribute('aria-hidden', 'false');
        host.appendChild(pill);
    }
    pill.hidden = false;
    pill.textContent = '!';
    pill.setAttribute('aria-label', ariaLabel);
    host.classList.add('npc-ready--has-notif');
}

function paintTownTabClassTransferNotif(show: boolean, count: number, ariaLabel: string): void {
    const townBtn = document.getElementById('btn-tab-cidade');
    const pill = document.getElementById('nav-notif-cidade-class');
    if (townBtn) {
        townBtn.classList.toggle('btn-travel--has-notif', show);
        townBtn.classList.toggle('btn-travel--has-class-transfer', show);
    }
    if (!pill) return;
    if (!show) {
        pill.hidden = true;
        pill.textContent = '';
        pill.setAttribute('aria-hidden', 'true');
        pill.removeAttribute('aria-label');
        pill.classList.remove('nav-notif--active');
        return;
    }
    pill.hidden = false;
    pill.removeAttribute('aria-hidden');
    pill.textContent = count > 1 ? String(Math.min(count, 9)) : '!';
    pill.setAttribute('aria-label', ariaLabel);
    pill.classList.add('nav-notif--active');
}

function refreshClassTransferNotifs(): void {
    const avail = getClassTransferAvailability();
    const tFn = typeof window.t === 'function' ? window.t : null;
    const aria = tFn
        ? tFn('game.town.classReadyBadgeAria', { count: avail.count })
        : `Class transfer ready (${avail.count})`;
    const readyHint = tFn ? tFn('game.town.changeClassHintReady') : 'Ready to ascend!';
    const idleHint = tFn ? tFn('game.town.changeClassHint') : 'Ascend when ready';

    paintNpcReadyNotif(
        document.querySelector('.npc-card--classmaster') as HTMLElement | null,
        avail.hasAvailable,
        aria,
    );

    const classBtn = document.querySelector('.npc-action--class') as HTMLElement | null;
    paintNpcReadyNotif(classBtn, avail.hasAvailable, aria);
    if (classBtn) {
        const hint = classBtn.querySelector('.npc-action__hint') as HTMLElement | null;
        if (hint) {
            hint.textContent = avail.hasAvailable ? readyHint : idleHint;
            hint.removeAttribute('data-i18n');
        }
        classBtn.classList.toggle('npc-action--class-ready', avail.hasAvailable);
    }

    // Bottom TOWN tab — points players into the plaza / Grand Master NPC.
    paintTownTabClassTransferNotif(avail.hasAvailable, avail.count, aria);
}

function abrirMenuClasses() {
    window.fecharNpc?.(); // Esconde o menu do Grand Master
    
    let aviso = document.getElementById('classes-aviso');
    let container = document.getElementById('classes-opcoes-container');
    if (!aviso || !container) return;
    container.innerHTML = '';

    let tFn = (typeof window.t === 'function') ? window.t : null;

    // === LÓGICA DE BUSCA DA CLASSE ===
    let chaveEvolucao = resolveClassEvolutionKey();

    let opcoes = (classEvolutions as Record<string, Array<{ nome: string; reqLvl: number; desc?: string; cor?: string }>>)[chaveEvolucao];
    
    // Se a classe atual não tem mais pra onde evoluir (já é Level 76)
    if (!opcoes || opcoes.length === 0) {
        aviso.innerHTML = tFn ? tFn('game.classes.maxChroniclePower') : 'Your class has already reached the maximum power available in this chronicle!';
        aviso.style.color = "#10b981"; 
        aviso.style.display = "block";
        container.innerHTML = '';
        abrirModal('janela-classes', 1500);
        return;
    }

    let precisaUpar = false;
    let temOpcaoDisponivel = false;
    opcoes.forEach((opcao) => {
        const pode = (Number(window.nivel) || 1) >= opcao.reqLvl;
        if (!pode) precisaUpar = true;
        else temOpcaoDisponivel = true;
    });

    renderClassTransferOptions(container, opcoes, {
        currentClass: String(window.charClass || 'Fighter'),
        playerLevel: Number(window.nivel) || 1,
    });
    
    if (precisaUpar && !temOpcaoDisponivel) { 
        let proximoLvl = opcoes[0].reqLvl;
        aviso.innerHTML = tFn
            ? tFn('game.classes.returnGrandMasterLevel', { level: proximoLvl })
            : (`Return to the Grand Master when you reach <b style="color:#ef4444;">Level ${proximoLvl}</b>.`);
        aviso.style.color = "#ccc"; 
        aviso.style.display = "block"; 
    } else {
        const tip = tFn ? tFn('game.classes.pickAPath') : 'Pick a path below — tap a card to compare stats, skills, and the road ahead.';
        aviso.innerHTML = tip;
        aviso.style.color = "#94a3b8";
        aviso.style.display = "block";
    }
    
    abrirModal('janela-classes', 1500);
}

function fecharMenuClasses() { fecharModal('janela-classes'); }

function confirmarTrocaClasse(novaClasse) {
    // 1. Esconde a janela de lista de classes para não encavalar
    fecharMenuClasses();
    
    let tFn = (typeof window.t === 'function') ? window.t : null;

    // 2. Prepara a nossa janela nativa do jogo para perguntar se ele tem certeza
    abrirModal('janela-item-acao', 2100);
    
    let ctitle = tFn ? tFn('game.classes.confirmTitle') : 'CONFIRM CLASS';
    document.getElementById('acao-titulo')!.innerHTML = `<span style="color:#ef4444; text-shadow: 1px 1px 0 #000;">${ctitle}</span>`;
    (document.getElementById('acao-img') as HTMLImageElement).src = 'assets/npcs/magister.png';
    
    const displayName = classEvolutionDisplayName(novaClasse);
    let intro = tFn ? tFn('game.classes.confirmIntro') : 'You are about to walk the path of the';
    let warn = tFn ? tFn('game.classes.confirmWarning') : 'Warning: This choice is permanent and cannot be undone!';
    document.getElementById('acao-desc').innerHTML = `
        ${intro} <b style="color:#fde047; font-size:1.2em;">${displayName}</b>.<br><br>
        <span style="color:#ef4444; font-weight:bold;">${warn}</span>
    `;
    
    let btnAcao = document.getElementById('btn-acao-item');
    btnAcao.innerText = tFn ? tFn('game.classes.confirmAdvance') : 'YES, ADVANCE MY CLASS!';
    btnAcao.style.background = "#15803d"; // Verde de sucesso
    
    btnAcao.onclick = function() { 
        executarTrocaClasse(novaClasse); 
    };
}

function executarTrocaClasse(novaClasse) {
    let tFn = (typeof window.t === 'function') ? window.t : null;

    const skillsBefore = typeof window.obterSkillsAprendidas === 'function'
        ? window.obterSkillsAprendidas().map((s) => s.idNome).filter(Boolean)
        : [];

    charClass = novaClasse;
    tocarSom('lvlup');
    const displayName = classEvolutionDisplayName(novaClasse);
    let ascMsg = tFn ? tFn('game.classes.logAscension', { className: displayName }) : (`🌟 ASCENSION! You are now a ${displayName}!`);
    escreverLog(`<span style="color:#fde047; font-size:1.2em; font-weight:bold; text-shadow: 1px 1px 0 #000;">${ascMsg}</span>`);
    
    window.calcularStatusGlobais(); // Recalcula os status com a nova classe!
    playerHP = playerStats.maxHp; playerMP = playerStats.maxMp; // Enche a vida de brinde
    
    atualizar(); renderizarPerfil();
    let newSkillCount = 0;
    if (typeof window.notifySkillsUnlockedAfterClassChange === 'function') {
        window.notifySkillsUnlockedAfterClassChange(skillsBefore);
        newSkillCount = typeof window.countUnseenSkillUnlocks === 'function'
            ? window.countUnseenSkillUnlocks()
            : 0;
    }
    if (typeof window.syncSkillUnlockNotifUi === 'function') {
        window.syncSkillUnlockNotifUi();
    }
    salvarJogo();
    if (typeof window.refreshClassTransferNotifs === 'function') {
        try { window.refreshClassTransferNotifs(); } catch (eNotif) { /* ignore */ }
    }
    
    let stitle = tFn ? tFn('game.classes.successTitle') : 'CLASS TRANSFER SUCCESS';
    document.getElementById('acao-titulo').innerHTML = `<span style="color:#10b981; text-shadow: 1px 1px 0 #000;">${stitle}</span>`;
    let congrats = tFn ? tFn('game.classes.successCongrats') : 'Congratulations!';
    let bodyRaw = tFn
        ? tFn('game.classes.successBody', { className: `<b style="color:#fde047">${displayName}</b>` })
        : (`You advanced to <b style="color:#fde047">${displayName}</b>. Your base stats were boosted and your combat potential rose sharply!`);
    const skillsLine = newSkillCount > 0
        ? (tFn
            ? tFn('game.classes.successBodySkills', { n: newSkillCount })
            : `${newSkillCount} new skills are waiting — check the mark on Profile and Spellbook.`)
        : '';
    document.getElementById('acao-desc').innerHTML = `<b style="color:white; font-size: 1.2em;">${congrats}</b><br><br><span style="color:#ccc;">${bodyRaw}</span>`
        + (skillsLine ? `<br><br><span style="color:#7dd3fc; font-weight:bold;">📘 ${skillsLine}</span>` : '');
    
    let btnAcao = document.getElementById('btn-acao-item');
    btnAcao.innerText = tFn ? tFn('game.enchantUi.continue') : 'CONTINUE'; 
    btnAcao.style.background = "#ca8a04";
    btnAcao.onclick = function() { fecharJanelaAcao(); };
}

window.classModifiers = classModifiers;
window.classEvolutions = classEvolutions;
window.abrirMenuClasses = abrirMenuClasses;
window.fecharMenuClasses = fecharMenuClasses;
window.confirmarTrocaClasse = confirmarTrocaClasse;
window.executarTrocaClasse = executarTrocaClasse;
window.getClassTransferAvailability = getClassTransferAvailability;
window.refreshClassTransferNotifs = refreshClassTransferNotifs;

export {};