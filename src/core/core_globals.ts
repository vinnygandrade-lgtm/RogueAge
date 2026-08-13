/**
 * CORE GLOBALS & BASIC HELPERS
 * Migrado: js/core_globals.js
 */
import type {
  BuffsAtivos,
  EquipInstance,
  GradeEquipKey,
  GradeEquipValidation,
  ItemCatalogBase,
  StatPerLevel,
  ZonalMobTuneEntry,
} from '../types/game';

const L2MINI_CLASSES_MAGICAS = new Set([
  'Mage',
  'Wizard',
  'Cleric',
  'Prophet',
  'Human Wizard',
  'Necromancer',
  'Sorcerer',
  'Warlock',
  'Bishop',
  'Hierophant',
  'Soultaker',
  'Archmage',
  'Arcane Lord',
  'Cardinal',
  'Dark_Mage',
  'Dark Wizard',
  'Spellhowler',
  'Storm Screamer',
  'Shillien Oracle',
  'Shillien Elder',
  'Shillien Saint',
  'Phantom Summoner',
  'Spectral Master',
  'Elf_Mage',
  'Elven Wizard',
  'Elven Oracle',
  'Spellsinger',
  'Mystic Muse',
  'Elemental Summoner',
  'Elemental Master',
  'Elven Elder',
  "Eva's Saint",
  'Orc_Mage',
  'Orc Shaman',
  'Overlord',
  'Warcryer',
  'Dominator',
  'Doomcryer',
]);

function buscarNoCatalogo(
  cat: ItemCatalogBase[] | null | undefined,
  idBusca: string | null,
  nomeBusca: string | null,
): ItemCatalogBase | null {
  if (!Array.isArray(cat)) return null;
  return (
    cat.find((i) => (idBusca && i.id === idBusca) || (nomeBusca && i.nome === nomeBusca)) || null
  );
}

// --- Personagem & economia ---
window.charName = '';
window.charRace = 'Human';
window.charGender = 'Male';
window.charClass = 'Fighter';
window.nivel = 1;
/** Estado social (GDD §7 — espelhado em window para módulos TS e onclick). */
window.clans = [];
window.playerClanId = null;
window.adenas = 0;
window.ancientCoins = 0;
window.xpAtual = 0;
window.xpNecessario = 100;
window.playerHP = 100;
window.playerMP = 50;
window.playerCP = 60;
window.isAugmented = false;

window.endgameData = {
  weeklyChampionKills: 0,
  weeklyWeekKey: '',
  lastClaimedWeekKey: '',
  lifetimeChampionKills: 0,
  renown: 0,
};

// --- Combate & caçada (referência única em window — legado usa bare globalCooldownAtivo, etc.) ---
window.monstrosAtivos = [];
window.globalCooldownAtivo = 0;
window.autoAtaqueAtivo = false;
window.podeAtacar = true;
window.cooldownsAtivos = {};

window.playerStats = {
  maxHp: 100,
  maxMp: 50,
  maxCp: 60,
  pAtk: 10,
  mAtk: 10,
  pDef: 10,
  mDef: 10,
  critRate: 5,
  dodgeRate: 3,
  atkSpeed: 3800,
  /** Casting Speed: % reduction on skill cast time (0–40). */
  castSpeed: 0,
  runSpeed: 120,
};

window.L2MINI_STAT_PER_LEVEL = {
  hp: 7,
  mp: 2,
  pAtk: 1,
  mAtk: 1,
  pDef: 1.2,
  mDef: 1,
  atkSpdMs: 0,
} satisfies StatPerLevel;

window.L2MINI_BARE_HAND_WEAPON_ATK = 5;
window.L2MINI_ITEM_ICON_PX = 256;
window.L2MINI_TRAINING_SWORD_ATK = window.L2MINI_BARE_HAND_WEAPON_ATK;
/**
 * Soft/hard curves — full value until SOFT, then diminishing gains toward HARD.
 * Same philosophy for Crit, Evasion, and Attack Speed (ms floor).
 */
/** Crit %: full until soft, asymptote toward hard. */
window.L2MINI_CRIT_SOFT_CAP = 55;
window.L2MINI_CRIT_RATE_CAP = 90;
window.L2MINI_CRIT_SOFT_SCALE = 30;

/** Evasion % */
window.L2MINI_DODGE_SOFT_CAP = 30;
window.L2MINI_DODGE_RATE_CAP = 55;
window.L2MINI_DODGE_SOFT_SCALE = 28;
/** Evasion from levels — budgeted so ~85 ≈ +5 (docs/stat-budget.md). */
window.L2MINI_DODGE_PER_LEVEL = 0.06;

/**
 * Attack interval (ms) — LOWER is faster.
 * Full speed gains while interval >= SOFT_MS; below that, soft approach toward HARD_MS.
 * Replaces the old hard floor of 250ms so gear/buffs past that still matter.
 */
window.L2MINI_ATK_SPEED_SOFT_MS = 280;
window.L2MINI_ATK_SPEED_HARD_MS = 160;
window.L2MINI_ATK_SPEED_SOFT_SCALE = 110;

/** Casting Speed % — full until soft, asymptote toward hard (replaces hard wall at 40). */
window.L2MINI_CAST_SOFT_CAP = 35;
window.L2MINI_CAST_RATE_CAP = 55;
window.L2MINI_CAST_SOFT_SCALE = 28;

function applySoftPercentCap(
  value: number,
  soft: number,
  hard: number,
  scale: number,
): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= soft) return Math.floor(n);
  const over = n - soft;
  const gained = (hard - soft) * (1 - Math.exp(-over / Math.max(1, scale)));
  return Math.max(0, Math.min(hard, Math.floor(soft + gained)));
}

/** @deprecated Prefer content budget (docs/stat-budget.md). Kept for legacy callers / expedition safety. */
window.applyCritRateCap = function applyCritRateCap(value: number): number {
  const soft =
    typeof window.L2MINI_CRIT_SOFT_CAP === 'number' && window.L2MINI_CRIT_SOFT_CAP >= 0
      ? window.L2MINI_CRIT_SOFT_CAP
      : 55;
  const hard =
    typeof window.L2MINI_CRIT_RATE_CAP === 'number' && window.L2MINI_CRIT_RATE_CAP >= soft
      ? window.L2MINI_CRIT_RATE_CAP
      : 90;
  const scale =
    typeof window.L2MINI_CRIT_SOFT_SCALE === 'number' && window.L2MINI_CRIT_SOFT_SCALE > 0
      ? window.L2MINI_CRIT_SOFT_SCALE
      : 30;
  return applySoftPercentCap(value, soft, hard, scale);
};

window.applyDodgeRateCap = function applyDodgeRateCap(value: number): number {
  const soft =
    typeof window.L2MINI_DODGE_SOFT_CAP === 'number' && window.L2MINI_DODGE_SOFT_CAP >= 0
      ? window.L2MINI_DODGE_SOFT_CAP
      : 30;
  const hard =
    typeof window.L2MINI_DODGE_RATE_CAP === 'number' && window.L2MINI_DODGE_RATE_CAP >= soft
      ? window.L2MINI_DODGE_RATE_CAP
      : 55;
  const scale =
    typeof window.L2MINI_DODGE_SOFT_SCALE === 'number' && window.L2MINI_DODGE_SOFT_SCALE > 0
      ? window.L2MINI_DODGE_SOFT_SCALE
      : 28;
  return applySoftPercentCap(value, soft, hard, scale);
};

/** Soft-floor for attack interval ms (lower = faster). */
window.applyAtkSpeedFloor = function applyAtkSpeedFloor(valueMs: number): number {
  const soft =
    typeof window.L2MINI_ATK_SPEED_SOFT_MS === 'number' && window.L2MINI_ATK_SPEED_SOFT_MS > 0
      ? window.L2MINI_ATK_SPEED_SOFT_MS
      : 280;
  const hard =
    typeof window.L2MINI_ATK_SPEED_HARD_MS === 'number' && window.L2MINI_ATK_SPEED_HARD_MS > 0
      ? Math.min(window.L2MINI_ATK_SPEED_HARD_MS, soft)
      : 160;
  const scale =
    typeof window.L2MINI_ATK_SPEED_SOFT_SCALE === 'number' && window.L2MINI_ATK_SPEED_SOFT_SCALE > 0
      ? window.L2MINI_ATK_SPEED_SOFT_SCALE
      : 110;
  const n = Number(valueMs);
  if (!Number.isFinite(n)) return soft;
  if (n >= soft) return Math.floor(n);
  const over = soft - n;
  const gained = (soft - hard) * (1 - Math.exp(-over / scale));
  return Math.max(hard, Math.floor(soft - gained));
};

window.applyCastSpeedCap = function applyCastSpeedCap(value: number): number {
  const soft =
    typeof window.L2MINI_CAST_SOFT_CAP === 'number' && window.L2MINI_CAST_SOFT_CAP >= 0
      ? window.L2MINI_CAST_SOFT_CAP
      : 35;
  const hard =
    typeof window.L2MINI_CAST_RATE_CAP === 'number' && window.L2MINI_CAST_RATE_CAP >= soft
      ? window.L2MINI_CAST_RATE_CAP
      : 55;
  const scale =
    typeof window.L2MINI_CAST_SOFT_SCALE === 'number' && window.L2MINI_CAST_SOFT_SCALE > 0
      ? window.L2MINI_CAST_SOFT_SCALE
      : 28;
  return applySoftPercentCap(value, soft, hard, scale);
};

window.L2MINI_ZONAL_MOB_TUNING = {
  'No-Grade': {
    hp: 0.52,
    atk: 0.42,
    def: 0.68,
    championChance: 0.022,
    championHpMult: 2.85,
    championAtkMult: 1.06,
    championOnePerPull: true,
    packAtkMult: 0.82,
  },
  // D ATK ≈ 2× NG mid hit (Zombie ≈ 2× Wolf after tune); HP/Def keep mild ease.
  D: { hp: 0.62, atk: 0.19, def: 0.70, packAtkMult: 0.84, championOnePerPull: true },
  C: { hp: 0.83, atk: 0.76, def: 0.86 },
  B: { hp: 0.78, atk: 0.72, def: 0.83 },
  A: { hp: 0.74, atk: 0.68, def: 0.8 },
  S: { hp: 0.7, atk: 0.64, def: 0.78 },
} satisfies Record<string, ZonalMobTuneEntry>;

window.buffsAtivos = {
  pAtkMult: 1.0,
  pDefMult: 1.0,
  mAtkMult: 1.0,
  mDefMult: 1.0,
} satisfies BuffsAtivos;

window.enchant = 0;
window.enchantArmor = 0;
window.inventario = { 'HP Potion': 20, 'Mana Potion': 5 };
window.inventarioEquips = [];
window.armaEquipadaBase = null;
window.armaduraEquipada = null;

window.olympiadPoints = 0;
window.olympiadWins = 0;
window.olympiadLosses = 0;

window.barraAtalhos = [
  'Attack',
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

window.tempoFimBuffGuerreiro = 0;
window.tempoFimBuffMistico = 0;
/** Active Grand Master Blessing Build (null when none). */
window.blessingBuild = null;

window.calcularXpNecessario = function calcularXpNecessario(lvl: number): number {
  const base = Math.floor(100 * lvl ** 2 + lvl ** 5 * 0.05);
  if (
    typeof window.EconomyBalance !== 'undefined'
    && typeof window.EconomyBalance.scaleNoviceXpRequired === 'function'
  ) {
    return window.EconomyBalance.scaleNoviceXpRequired(base, lvl);
  }
  return base;
};

window.labelTipoHUD = null;
window.labelValorHUD = null;

document.addEventListener('DOMContentLoaded', () => {
  window.labelTipoHUD = document.getElementById('hud-tipo-ataque');
  window.labelValorHUD = document.getElementById('hud-valor-ataque');
});

window.isClasseMagica = function isClasseMagica(classeNome: string): boolean {
  return typeof classeNome === 'string' && L2MINI_CLASSES_MAGICAS.has(classeNome);
};

window.L2MINI_STARTER_WEAPON_IDS = { fighter: 'wpn_ng_trainee_blade', mage: 'wpn_ng_trainee_focus' };

window.createStarterWeaponInstance = function createStarterWeaponInstance(
  charClass?: string,
): EquipInstance | null {
  const mage =
    typeof window.isClasseMagica === 'function' &&
    window.isClasseMagica(charClass || window.charClass || 'Fighter');
  const ids = window.L2MINI_STARTER_WEAPON_IDS;
  const id = mage ? ids.mage : ids.fighter;
  if (!id || typeof catalogoArmas === 'undefined' || !Array.isArray(catalogoArmas)) return null;
  const base = catalogoArmas.find((a) => a && a.id === id);
  if (!base) return null;
  if (typeof window.ItemSecurity !== 'undefined' && window.ItemSecurity.createInstance) {
    return window.ItemSecurity.createInstance('weapon', base, { origin: 'System', enchant: 0 });
  }
  return {
    uid: `WPN-START-${Date.now()}`,
    tipo: 'weapon',
    base,
    enchant: 0,
  };
};

window.mostrarAviso = function mostrarAviso(mensagem: string): void {
  const container = document.getElementById('toast-container');
  if (!container) return;
  if (container.children.length >= 2 && container.firstElementChild) {
    container.removeChild(container.firstElementChild);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `⚠️ ${mensagem}`;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
};

window.TRAVAS_GRADE_NIVEL = {
  'NO-GRADE': 1,
  D: 20,
  C: 40,
  B: 52,
  A: 61,
  S: 76,
} satisfies Record<GradeEquipKey, number>;

window.normalizarGradeEquip = function normalizarGradeEquip(grade: unknown): GradeEquipKey {
  if (!grade) return 'NO-GRADE';
  const g = String(grade).trim().toUpperCase();
  if (g === 'NO-GRADE' || g === 'NOGRADE' || g === 'NO GRADE') return 'NO-GRADE';
  if (g.startsWith('D')) return 'D';
  if (g.startsWith('C')) return 'C';
  if (g.startsWith('B')) return 'B';
  if (g.startsWith('A')) return 'A';
  if (g.startsWith('S')) return 'S';
  return 'NO-GRADE';
};

window.obterNivelMinimoGradeEquip = function obterNivelMinimoGradeEquip(grade: unknown): number {
  const gradeNormalizado = window.normalizarGradeEquip(grade);
  return window.TRAVAS_GRADE_NIVEL[gradeNormalizado] || 1;
};

window.validarEquipPorGrade = function validarEquipPorGrade(
  item: EquipInstance | EquipRawInputLike | null | undefined,
): GradeEquipValidation {
  if (!item) {
    return { permitido: false, motivo: 'ITEM_INVALIDO', nivelMinimo: 1, grade: 'NO-GRADE' };
  }

  const base = item.base && typeof item.base === 'object' ? item.base : null;
  let gradeDetectada: unknown =
    (item as EquipInstance & { grade?: string }).grade != null &&
    (item as EquipInstance & { grade?: string }).grade !== ''
      ? (item as EquipInstance & { grade?: string }).grade
      : base?.grade;

  if (!gradeDetectada) {
    const idBusca = (item as ItemCatalogBase).id || base?.id || null;
    const nomeBusca = (item as ItemCatalogBase).nome || base?.nome || null;
    const itemCat =
      buscarNoCatalogo(typeof catalogoArmas !== 'undefined' ? catalogoArmas : null, idBusca, nomeBusca) ||
      buscarNoCatalogo(
        typeof catalogoArmaduras !== 'undefined' ? catalogoArmaduras : null,
        idBusca,
        nomeBusca,
      ) ||
      buscarNoCatalogo(typeof catalogoJoias !== 'undefined' ? catalogoJoias : null, idBusca, nomeBusca);
    if (itemCat?.grade) gradeDetectada = itemCat.grade;
  }

  const gradeNormalizado = window.normalizarGradeEquip(gradeDetectada);
  const nivelMinimo = window.obterNivelMinimoGradeEquip(gradeNormalizado);
  const nivelAtual = typeof window.nivel !== 'undefined' ? window.nivel : 1;
  const permitido = nivelAtual >= nivelMinimo;
  return { permitido, nivelMinimo, grade: gradeNormalizado, nivelAtual };
};

/** Item-like mínimo para validação de grade (instância ou catálogo). */
interface EquipRawInputLike {
  base?: ItemCatalogBase;
  grade?: string;
  id?: string;
  nome?: string;
}

export {};
