/**
 * Retention engine — newbie/monthly calendars, recruit journey, comeback rewards.
 */
import type {
  DailyMissionReward,
  EquipInstance,
  ItemCatalogBase,
  RetentionEngineApi,
  RetentionSave,
} from '../types/game';
import { registerGlobal } from '../runtime/register-global';
import {
  RETENTION_DAY7_ENCHANT,
  RETENTION_DAY7_WEAPONS,
  RETENTION_EVENT_ALIASES,
  RETENTION_JOURNEY_STEP_COUNT,
  RETENTION_JOURNEY_STEP_DEFS,
  RETENTION_MONTHLY_DAYS,
  RETENTION_NEWBIE_DAYS,
  retentionMonthlyReward,
  retentionNewbieReward,
} from '../game/retention_catalog';

const COMEBACK_MIN_HOURS = 4;
const COMEBACK_MAX_ADENA = 50000;
const JOURNEY_PROGRESS: Record<number, number> = {};

let retentionSave: RetentionSave | null = null;

function todayDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function daysBetween(startKey: string, endKey: string): number {
  const s = new Date(`${startKey}T12:00:00`);
  const e = new Date(`${endKey}T12:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 86400000));
}

function defaultRetention(legacySkipNewbie = false): RetentionSave {
  const now = Date.now();
  return {
    newbie: {
      startDayKey: todayDayKey(),
      claimedDays: [],
      completed: legacySkipNewbie,
      day7WeaponId: null,
    },
    monthly: {
      monthKey: monthKey(),
      claimedDays: [],
      lastClaimDayKey: '',
    },
    journey: {
      completedSteps: [],
      claimedSteps: [],
      completed: false,
    },
    comeback: {
      lastSeenAt: now,
      lastComebackDayKey: '',
    },
    clanPromptDismissed: false,
    clanJoinRewardClaimed: false,
  };
}

function normalizeRetention(raw: RetentionSave | null | undefined, legacySkipNewbie: boolean): RetentionSave {
  const base = defaultRetention(legacySkipNewbie);
  if (!raw || typeof raw !== 'object') return base;

  const newbie = raw.newbie && typeof raw.newbie === 'object' ? raw.newbie : base.newbie;
  const monthly = raw.monthly && typeof raw.monthly === 'object' ? raw.monthly : base.monthly;
  const journey = raw.journey && typeof raw.journey === 'object' ? raw.journey : base.journey;
  const comeback = raw.comeback && typeof raw.comeback === 'object' ? raw.comeback : base.comeback;

  return {
    newbie: {
      startDayKey: typeof newbie.startDayKey === 'string' && newbie.startDayKey
        ? newbie.startDayKey
        : base.newbie.startDayKey,
      claimedDays: Array.isArray(newbie.claimedDays)
        ? newbie.claimedDays.filter((n) => typeof n === 'number' && n >= 1 && n <= RETENTION_NEWBIE_DAYS)
        : [],
      completed: !!newbie.completed || legacySkipNewbie,
      day7WeaponId: typeof newbie.day7WeaponId === 'string' ? newbie.day7WeaponId : null,
    },
    monthly: {
      monthKey: typeof monthly.monthKey === 'string' && monthly.monthKey
        ? monthly.monthKey
        : base.monthly.monthKey,
      claimedDays: Array.isArray(monthly.claimedDays)
        ? monthly.claimedDays.filter((n) => typeof n === 'number' && n >= 1 && n <= RETENTION_MONTHLY_DAYS)
        : [],
      lastClaimDayKey: typeof monthly.lastClaimDayKey === 'string' ? monthly.lastClaimDayKey : '',
    },
    journey: {
      completedSteps: Array.isArray(journey.completedSteps)
        ? journey.completedSteps.filter((n) => typeof n === 'number' && n >= 1 && n <= RETENTION_JOURNEY_STEP_COUNT)
        : [],
      claimedSteps: Array.isArray(journey.claimedSteps)
        ? journey.claimedSteps.filter((n) => typeof n === 'number' && n >= 1 && n <= RETENTION_JOURNEY_STEP_COUNT)
        : [],
      completed: !!journey.completed,
    },
    comeback: {
      lastSeenAt: typeof comeback.lastSeenAt === 'number' ? comeback.lastSeenAt : base.comeback.lastSeenAt,
      lastComebackDayKey: typeof comeback.lastComebackDayKey === 'string'
        ? comeback.lastComebackDayKey
        : '',
    },
    clanPromptDismissed: !!raw.clanPromptDismissed,
    clanJoinRewardClaimed: !!raw.clanJoinRewardClaimed,
  };
}

function getSaveInternal(): RetentionSave {
  if (!retentionSave) {
    retentionSave = defaultRetention(false);
  }
  return retentionSave;
}

function persistSilent(): void {
  try {
    if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
  } catch { /* ignore */ }
}

function syncMonthlyMonth(): void {
  const s = getSaveInternal();
  const mk = monthKey();
  if (s.monthly.monthKey !== mk) {
    s.monthly.monthKey = mk;
    s.monthly.claimedDays = [];
    s.monthly.lastClaimDayKey = '';
  }
}

function journeyProgress(step: number): number {
  return Math.max(0, JOURNEY_PROGRESS[step] || 0);
}

function rebuildJourneyProgressFromLevel(): void {
  const lvl = Math.max(1, Math.floor(Number(window.nivel) || 1));
  const step10 = RETENTION_JOURNEY_STEP_DEFS.find((s) => s.step === 10);
  if (step10 && lvl >= step10.target) {
    JOURNEY_PROGRESS[10] = step10.target;
    markJourneyStepComplete(10);
  }
}

function markJourneyStepComplete(step: number, notify = false): void {
  const s = getSaveInternal();
  if (s.journey.completedSteps.indexOf(step) >= 0) return;
  s.journey.completedSteps.push(step);
  s.journey.completedSteps.sort((a, b) => a - b);
  if (s.journey.completedSteps.length >= RETENTION_JOURNEY_STEP_COUNT) {
    s.journey.completed = true;
  }
  if (
    notify
    && s.journey.claimedSteps.indexOf(step) < 0
    && typeof window.showMissionReadyToast === 'function'
  ) {
    const def = RETENTION_JOURNEY_STEP_DEFS.find((d) => d.step === step);
    const title = def && typeof window.t === 'function' ? window.t(def.titleKey) : `Step ${step}`;
    window.showMissionReadyToast('retention_journey', title, 'retention');
  }
  persistSilent();
}

function resolveCatalogWeapon(id: string): ItemCatalogBase | null {
  const cat = window.catalogoArmas ?? [];
  return cat.find((w) => String(w.id) === id) || null;
}

function deliverWeaponPlusEnchant(weaponId: string, enchant: number): boolean {
  const base = resolveCatalogWeapon(weaponId);
  if (!base || !window.ItemSecurity?.createInstance) return false;
  const inst = window.ItemSecurity.createInstance('weapon', base, {
    enchant,
    origin: 'Retention',
  });
  if (!inst) return false;
  if (window.InventoryManager?.adicionarEquipamento) {
    return window.InventoryManager.adicionarEquipamento(inst);
  }
  if (!Array.isArray(window.inventarioEquips)) window.inventarioEquips = [];
  window.inventarioEquips.push(inst);
  return true;
}

function aplicarRecompensa(recompensa: DailyMissionReward | null | undefined): void {
  if (!recompensa) return;
  if (recompensa.adenas) window.adenas = (Number(window.adenas) || 0) + recompensa.adenas;
  if (recompensa.ancientCoins) {
    window.ancientCoins = (Number(window.ancientCoins) || 0) + recompensa.ancientCoins;
  }
  if (recompensa.itens) {
    Object.keys(recompensa.itens).forEach((nome) => {
      const qty = recompensa.itens![nome];
      if (window.InventoryManager?.adicionarStack) {
        window.InventoryManager.adicionarStack(nome, qty);
      } else {
        window.inventario[nome] = (Number(window.inventario[nome]) || 0) + qty;
      }
    });
  }
  if (typeof window.syncMoedasInventarioComCarteira === 'function') {
    window.syncMoedasInventarioComCarteira();
  }
}

function refreshHud(): void {
  if (typeof window.syncRetentionHubUi === 'function') {
    window.syncRetentionHubUi();
  } else if (typeof window.refreshRetentionHud === 'function') {
    window.refreshRetentionHud();
  }
  if (typeof window.atualizar === 'function') window.atualizar();
}

export const RetentionEngine: RetentionEngineApi = {
  getSave(): RetentionSave {
    return getSaveInternal();
  },

  getNewbieCurrentDay(): number {
    const s = getSaveInternal();
    if (s.newbie.completed) return RETENTION_NEWBIE_DAYS;
    const idx = daysBetween(s.newbie.startDayKey, todayDayKey()) + 1;
    return Math.min(RETENTION_NEWBIE_DAYS, Math.max(1, idx));
  },

  getMonthlyCurrentDay(): number {
    syncMonthlyMonth();
    const dom = new Date().getDate();
    return Math.min(RETENTION_MONTHLY_DAYS, Math.max(1, dom));
  },

  canClaimNewbieDay(day: number): boolean {
    const s = getSaveInternal();
    const d = Math.floor(day);
    if (d < 1 || d > RETENTION_NEWBIE_DAYS) return false;
    if (s.newbie.claimedDays.indexOf(d) >= 0) return false;
    if (s.newbie.completed) return false;
    return d === this.getNewbieCurrentDay();
  },

  canClaimMonthlyDay(day: number): boolean {
    syncMonthlyMonth();
    const s = getSaveInternal();
    const d = Math.floor(day);
    if (d < 1 || d > RETENTION_MONTHLY_DAYS) return false;
    if (s.monthly.claimedDays.indexOf(d) >= 0) return false;
    return d === this.getMonthlyCurrentDay();
  },

  claimNewbieDay(day: number, weaponId?: string): boolean {
    const d = Math.floor(day);
    if (!this.canClaimNewbieDay(d)) return false;

    if (d === 7) {
      const pick = weaponId || getSaveInternal().newbie.day7WeaponId;
      const valid = RETENTION_DAY7_WEAPONS.some((w) => w.id === pick);
      if (!valid) return false;
      if (!deliverWeaponPlusEnchant(String(pick), RETENTION_DAY7_ENCHANT)) return false;
      getSaveInternal().newbie.day7WeaponId = String(pick);
    }

    const reward = retentionNewbieReward(d);
    if (reward) aplicarRecompensa(reward);

    const s = getSaveInternal();
    if (s.newbie.claimedDays.indexOf(d) < 0) s.newbie.claimedDays.push(d);
    s.newbie.claimedDays.sort((a, b) => a - b);
    if (s.newbie.claimedDays.length >= RETENTION_NEWBIE_DAYS) {
      s.newbie.completed = true;
    }
    persistSilent();
    refreshHud();
    return true;
  },

  claimMonthlyDay(day: number): boolean {
    const d = Math.floor(day);
    if (!this.canClaimMonthlyDay(d)) return false;
    aplicarRecompensa(retentionMonthlyReward(d));
    const s = getSaveInternal();
    if (s.monthly.claimedDays.indexOf(d) < 0) s.monthly.claimedDays.push(d);
    s.monthly.claimedDays.sort((a, b) => a - b);
    s.monthly.lastClaimDayKey = todayDayKey();
    persistSilent();
    refreshHud();
    return true;
  },

  claimJourneyStep(step: number): boolean {
    const s = getSaveInternal();
    const st = Math.floor(step);
    if (st < 1 || st > RETENTION_JOURNEY_STEP_COUNT) return false;
    if (s.journey.claimedSteps.indexOf(st) >= 0) return false;
    if (s.journey.completedSteps.indexOf(st) < 0) return false;

    const def = RETENTION_JOURNEY_STEP_DEFS.find((x) => x.step === st);
    if (!def) return false;
    aplicarRecompensa(def.reward);
    s.journey.claimedSteps.push(st);
    s.journey.claimedSteps.sort((a, b) => a - b);
    if (s.journey.claimedSteps.length >= RETENTION_JOURNEY_STEP_COUNT) {
      s.journey.completed = true;
    }
    persistSilent();
    refreshHud();
    return true;
  },

  hasComebackReady(): boolean {
    const s = getSaveInternal();
    const last = s.comeback.lastSeenAt || Date.now();
    const hoursAway = (Date.now() - last) / 3600000;
    if (hoursAway < COMEBACK_MIN_HOURS) return false;
    return s.comeback.lastComebackDayKey !== todayDayKey();
  },

  claimComeback(): boolean {
    if (!this.hasComebackReady()) return false;
    const s = getSaveInternal();
    const last = s.comeback.lastSeenAt || Date.now();
    const hoursAway = Math.min(48, (Date.now() - last) / 3600000);
    const adena = Math.min(COMEBACK_MAX_ADENA, Math.floor(hoursAway * 500));
    aplicarRecompensa({
      adenas: Math.max(800, adena),
      itens: {
        'HP Potion': Math.min(20, 4 + Math.floor(hoursAway / 2)),
        'Mana Potion': Math.min(15, 3 + Math.floor(hoursAway / 3)),
      },
    });
    s.comeback.lastComebackDayKey = todayDayKey();
    s.comeback.lastSeenAt = Date.now();
    persistSilent();
    refreshHud();
    return true;
  },

  countPending(): number {
    let n = 0;
    const s = getSaveInternal();
    if (!s.newbie.completed) {
      const todayNewbie = this.getNewbieCurrentDay();
      if (s.newbie.claimedDays.indexOf(todayNewbie) < 0) n++;
    }
    syncMonthlyMonth();
    const todayMonthly = this.getMonthlyCurrentDay();
    if (s.monthly.claimedDays.indexOf(todayMonthly) < 0) n++;
    s.journey.completedSteps.forEach((st) => {
      if (s.journey.claimedSteps.indexOf(st) < 0) n++;
    });
    if (this.hasComebackReady()) n++;
    return n;
  },

  shouldShowClanPrompt(): boolean {
    const s = getSaveInternal();
    const lvl = Math.max(1, Math.floor(Number(window.nivel) || 1));
    if (lvl < 10) return false;
    if (window.playerClanId) return false;
    return !s.clanPromptDismissed;
  },

  dismissClanPrompt(): void {
    getSaveInternal().clanPromptDismissed = true;
    persistSilent();
    refreshHud();
  },

  getWeaponChoices() {
    return RETENTION_DAY7_WEAPONS.slice();
  },

  getJourneyProgress(step: number): number {
    const st = Math.floor(step);
    const def = RETENTION_JOURNEY_STEP_DEFS.find((x) => x.step === st);
    if (!def) return 0;
    if (getSaveInternal().journey.completedSteps.indexOf(st) >= 0) return def.target;
    if (def.event === 'reach_level') {
      return Math.min(def.target, Math.floor(Number(window.nivel) || 1));
    }
    return Math.min(def.target, journeyProgress(st));
  },

  touchLastSeen(): void {
    getSaveInternal().comeback.lastSeenAt = Date.now();
  },

  onGameEvent(event: string, value = 1): void {
    const ev = RETENTION_EVENT_ALIASES[event] || event;
    const qty = Math.max(0, Number(value) || 0);
    if (qty <= 0 && ev !== 'reach_level') return;

    if (ev === 'entrar_clan') {
      const s = getSaveInternal();
      if (!s.clanJoinRewardClaimed && window.playerClanId) {
        aplicarRecompensa({ adenas: 3000, ancientCoins: 1 });
        s.clanJoinRewardClaimed = true;
        persistSilent();
      }
    }

    RETENTION_JOURNEY_STEP_DEFS.forEach((def) => {
      if (def.event !== ev) return;
      const cur = journeyProgress(def.step);
      const next = ev === 'reach_level'
        ? Math.max(cur, Math.floor(Number(window.nivel) || 1))
        : cur + qty;
      JOURNEY_PROGRESS[def.step] = next;
      if (next >= def.target) markJourneyStepComplete(def.step, true);
    });

    refreshHud();
  },

  afterCharacterLoad(): void {
    rebuildJourneyProgressFromLevel();
    if (window.playerClanId) {
      markJourneyStepComplete(8);
    }
    refreshHud();

    if (this.hasComebackReady() && typeof window.abrirRetentionComeback === 'function') {
      setTimeout(() => window.abrirRetentionComeback?.(), 2200);
    }
    refreshHud();
  },
};

function applyRetentionFromSave(raw: RetentionSave | null | undefined, nivel = 1): void {
  const legacySkip = nivel >= 10;
  retentionSave = normalizeRetention(raw, legacySkip);
  syncMonthlyMonth();
  for (const key of Object.keys(JOURNEY_PROGRESS)) {
    delete JOURNEY_PROGRESS[Number(key)];
  }
  RETENTION_JOURNEY_STEP_DEFS.forEach((def) => {
    const s = retentionSave!;
    if (s.journey.completedSteps.indexOf(def.step) >= 0) {
      JOURNEY_PROGRESS[def.step] = def.target;
    }
  });
  rebuildJourneyProgressFromLevel();
}

function getRetentionSavePayload(): RetentionSave {
  RetentionEngine.touchLastSeen();
  return getSaveInternal();
}

registerGlobal('RetentionEngine', RetentionEngine);
registerGlobal('applyRetentionFromSave', applyRetentionFromSave);
registerGlobal('getRetentionSavePayload', getRetentionSavePayload);

export { applyRetentionFromSave, getRetentionSavePayload };
