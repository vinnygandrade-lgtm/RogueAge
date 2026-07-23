import { itemDropDisplayName } from '../combat/combat_i18n';
import type { ExpeditionRunSave } from '../types/game';

/** Path card picked each journey (roguelike route). */
export type ExpeditionPathType = 'combat' | 'boss' | 'chest' | 'elite' | 'merchant' | 'forge' | 'scout' | 'patrol' | 'tracks' | 'warhorn' | 'ambush';

export type ExpeditionRareEventType = 'shrine' | 'gambler' | 'cache' | 'storm';

export type JourneyMobTrait = 'brutal' | 'swift' | 'lethal' | 'armored' | 'frenzied';

export interface ExpeditionRunStats {
    combatsWon: number;
    elitesCleared: number;
    bossesCleared: number;
    upgradesTaken: number;
    chestsOpened: number;
    merchantsUsed: number;
    forgesUsed: number;
    scoutsUsed: number;
    rareEventType: ExpeditionRareEventType | null;
}

export type ExpeditionEnchantSlot = 'weapon' | 'armor' | 'neck' | 'ear1' | 'ear2' | 'ring1' | 'ring2';

export interface ExpeditionRunEnchantBonus {
    weapon: number;
    armor: number;
    neck: number;
    ear1: number;
    ear2: number;
    ring1: number;
    ring2: number;
}

export interface ExpeditionRunBuffs {
    pAtkPct: number;
    mAtkPct: number;
    pDefPct: number;
    mDefPct: number;
    critRatePct: number;
    atkSpeedPct: number;
    maxHpPct: number;
    poisonResPct: number;
    bleedResPct: number;
    /** Bonus to passive HP regen ticks during the run (+10% per card, capped). */
    hpRegenPct: number;
    /** Bonus to passive MP regen ticks during the run (+10% per card, capped). */
    mpRegenPct: number;
    /** Reduces skill MP cost during the run (−15% per card, capped at 60% total). */
    mpCostReductionPct: number;
    /** Reduces skill cooldown during the run (−12% per card, capped at 50% total). */
    skillCdReductionPct: number;
}

/** Synergy builds — unlock many per run; bonuses stack (+ mastery at 3/5/7). */
export type ExpeditionBuildId =
    | 'swift_caster'
    | 'spell_fortress'
    | 'blade_dancer'
    | 'iron_wall'
    | 'mana_well'
    | 'vital_pulse'
    | 'executioner'
    | 'warden';

export type ExpeditionBuildRole = 'offense' | 'defense' | 'sustain';

type ExpeditionBuildRequirement =
    | { kind: 'stat'; stat: keyof ExpeditionRunBuffs; minPct: number }
    | { kind: 'anyOf'; stats: (keyof ExpeditionRunBuffs)[]; minPct: number };

interface ExpeditionBuildDef {
    id: ExpeditionBuildId;
    icon: string;
    role: ExpeditionBuildRole;
    priority: number;
    titleKey: string;
    titleFallback: string;
    bonusKey: string;
    bonusFallback: string;
    requirements: ExpeditionBuildRequirement[];
    bonuses: Partial<Record<keyof ExpeditionRunBuffs, number>>;
}

export interface ExpeditionPathChoice {
    id: string;
    type: ExpeditionPathType;
}

export type ExpeditionRunPanelTab = 'path' | 'stats' | 'builds' | 'gear';

/** Scout foresight for the next journey's path mix. */
export type ExpeditionPathBias = 'fight' | 'safe';

export interface ExpeditionState {
    active: boolean;
    /**
     * Run parked while the player is in town / other tabs / offline.
     * Bag + progress persist; combat buffs/enchants pause until resume.
     */
    suspended: boolean;
    zoneId: string;
    journey: number;
    pathChoices: ExpeditionPathChoice[];
    currentPath: ExpeditionPathType | null;
    /**
     * Fight was interrupted (reload / edge park). Resume restarts the same combat path —
     * no free re-pick of another route.
     */
    combatInterrupted: boolean;
    /** Set when last journey picked a non-combat route; next journey is fights-only. */
    combatOnlyNextJourney: boolean;
    /** True while the current map step was forced to fights-only (UI hint). */
    combatOnlyThisJourney: boolean;
    /** Scout intel — applied when generating the next journey's path cards. */
    nextPathBias: ExpeditionPathBias | null;
    /** Tracks intel — force one path type to appear on the next journey. */
    nextPathGuarantee: ExpeditionPathType | null;
    /** Bias that shaped the current journey's cards (map banner). */
    pathBiasThisJourney: ExpeditionPathBias | null;
    runBuffs: ExpeditionRunBuffs;
    /**
     * Synergy builds unlocked this run (stack — complete as many as you can).
     * Bonus % live in `buildBonusBuffs` — separate from card picks.
     */
    unlockedBuildIds: ExpeditionBuildId[];
    buildBonusBuffs: ExpeditionRunBuffs;
    /** Temporary +enchant on equipped gear — reverts when the run ends (cleared on extract). */
    runEnchantBonus: ExpeditionRunEnchantBonus;
    runStats: ExpeditionRunStats;
    journeyTrait: JourneyMobTrait;
    nextJourneyTrait: JourneyMobTrait;
    luckLootMult: number;
    luckLegendaryNext: boolean;
    rareEventJourney: number;
    rareEventUsed: boolean;
    pendingRareEvent: boolean;
    rareEventType: ExpeditionRareEventType | null;
    /** Main run screen tab: path cards, stats, or equipped gear. */
    runPanelTab: ExpeditionRunPanelTab;
    bag: {
        adenas: number;
        xp: number;
        drops: Record<string, number>;
    };
}

type ExpeditionResultTone = 'success' | 'warning' | 'danger' | 'neutral';

interface ExpeditionBagDelta {
    adenas?: number;
    xp?: number;
    drops?: Record<string, number>;
}

interface ExpeditionEffectDelta {
    hpRestored?: number;
    hpLost?: number;
    mpRestored?: number;
    bagAdenaLost?: number;
    buffText?: string;
}

interface ExpeditionNodeResult {
    nodeType: ExpeditionPathType | 'event';
    tone: ExpeditionResultTone;
    icon: string;
    titleKey: string;
    titleFallback: string;
    summaryKey: string;
    summaryFallback: string;
    summaryParams?: Record<string, string | number>;
    bag?: ExpeditionBagDelta;
    effects?: ExpeditionEffectDelta;
}

interface UpgradeDef {
    id: string;
    icon: string;
    stat: keyof ExpeditionRunBuffs;
    value: number;
    titleKey: string;
    titleFallback: string;
    descKey: string;
    descFallback: string;
    legendary?: boolean;
}

/** Interactive path / rare-event offer shown in the node modal. */
interface ExpeditionOffer {
    id: string;
    icon: string;
    titleKey: string;
    titleFallback: string;
    descKey: string;
    descFallback: string;
    descParams?: Record<string, string | number>;
    costAdena?: number;
}

const ZONE_REWARD_RATE: Record<string, number> = {
    'No-Grade': 0.01,
    D: 0.02,
    C: 0.04,
    B: 0.06,
    A: 0.08,
    S: 0.1
};

const JOURNEY_TRAITS: JourneyMobTrait[] = ['brutal', 'swift', 'lethal', 'armored', 'frenzied'];

const RUN_BUILD_IDS: ExpeditionBuildId[] = [
    'swift_caster', 'spell_fortress', 'blade_dancer', 'iron_wall',
    'mana_well', 'vital_pulse', 'executioner', 'warden'
];

/** Mastery — extra stacked bonus when you unlock many builds in one run. */
const BUILD_MASTERY_TIERS: {
    count: number;
    bonuses: Partial<Record<keyof ExpeditionRunBuffs, number>>;
    titleKey: string;
    titleFallback: string;
}[] = [
    {
        count: 3,
        bonuses: { maxHpPct: 5 },
        titleKey: 'game.hunt.expedition.buildMastery3',
        titleFallback: 'Pathfinder (3 builds)'
    },
    {
        count: 5,
        bonuses: { maxHpPct: 5, pAtkPct: 3, mAtkPct: 3 },
        titleKey: 'game.hunt.expedition.buildMastery5',
        titleFallback: 'Trailblazer (5 builds)'
    },
    {
        count: 7,
        bonuses: { maxHpPct: 6, pAtkPct: 4, mAtkPct: 4, atkSpeedPct: 5 },
        titleKey: 'game.hunt.expedition.buildMastery7',
        titleFallback: 'Legend of the Trail (7 builds)'
    }
];

/**
 * Synergy builds — thresholds from card picks; every completed build stacks.
 * Tuned so a focused path needs ~4–7 dedicated picks (not 2). Mastery 3 = mid/late run.
 */
const RUN_BUILDS: ExpeditionBuildDef[] = [
    {
        id: 'swift_caster',
        icon: '⚡',
        role: 'offense',
        priority: 1,
        titleKey: 'game.hunt.expedition.buildSwiftCaster',
        titleFallback: 'Swift Caster',
        bonusKey: 'game.hunt.expedition.buildSwiftCasterBonus',
        bonusFallback: '+6% M.Atk · −6% skill MP cost',
        // CDR ×3 (+12) + MP efficiency ×2 (+15) ≈ 5 picks
        requirements: [
            { kind: 'stat', stat: 'skillCdReductionPct', minPct: 36 },
            { kind: 'stat', stat: 'mpCostReductionPct', minPct: 30 }
        ],
        bonuses: { mAtkPct: 6, mpCostReductionPct: 6 }
    },
    {
        id: 'blade_dancer',
        icon: '🗡️',
        role: 'offense',
        priority: 2,
        titleKey: 'game.hunt.expedition.buildBladeDancer',
        titleFallback: 'Blade Dancer',
        bonusKey: 'game.hunt.expedition.buildBladeDancerBonus',
        bonusFallback: '+5% P.Atk · +4% Crit',
        // Speed ×3 (+10) + Crit ×3 (+5) ≈ 6 picks
        requirements: [
            { kind: 'stat', stat: 'atkSpeedPct', minPct: 30 },
            { kind: 'stat', stat: 'critRatePct', minPct: 15 }
        ],
        bonuses: { pAtkPct: 5, critRatePct: 4 }
    },
    {
        id: 'executioner',
        icon: '💥',
        role: 'offense',
        priority: 3,
        titleKey: 'game.hunt.expedition.buildExecutioner',
        titleFallback: 'Executioner',
        bonusKey: 'game.hunt.expedition.buildExecutionerBonus',
        bonusFallback: '+6% Crit · +3% P.Atk · +3% M.Atk',
        // Crit ×4 (+5) + Atk ×3 (+8) ≈ 7 picks
        requirements: [
            { kind: 'stat', stat: 'critRatePct', minPct: 20 },
            { kind: 'anyOf', stats: ['pAtkPct', 'mAtkPct'], minPct: 24 }
        ],
        bonuses: { critRatePct: 6, pAtkPct: 3, mAtkPct: 3 }
    },
    {
        id: 'spell_fortress',
        icon: '🏰',
        role: 'defense',
        priority: 4,
        titleKey: 'game.hunt.expedition.buildSpellFortress',
        titleFallback: 'Spell Fortress',
        bonusKey: 'game.hunt.expedition.buildSpellFortressBonus',
        bonusFallback: '+10% Max HP · +4% M.Def',
        // M.Def ×3 (+7) + regen ×2 (+10) + HP ×1 (+8) ≈ 6 picks
        requirements: [
            { kind: 'stat', stat: 'mDefPct', minPct: 21 },
            { kind: 'anyOf', stats: ['hpRegenPct', 'mpRegenPct'], minPct: 20 },
            { kind: 'stat', stat: 'maxHpPct', minPct: 8 }
        ],
        bonuses: { maxHpPct: 10, mDefPct: 4 }
    },
    {
        id: 'iron_wall',
        icon: '🛡️',
        role: 'defense',
        priority: 5,
        titleKey: 'game.hunt.expedition.buildIronWall',
        titleFallback: 'Iron Wall',
        bonusKey: 'game.hunt.expedition.buildIronWallBonus',
        bonusFallback: '+8% P.Def · +8% Max HP',
        // P.Def ×3 (+7) + HP ×3 (+8) ≈ 6 picks
        requirements: [
            { kind: 'stat', stat: 'pDefPct', minPct: 21 },
            { kind: 'stat', stat: 'maxHpPct', minPct: 24 }
        ],
        bonuses: { pDefPct: 8, maxHpPct: 8 }
    },
    {
        id: 'warden',
        icon: '🧿',
        role: 'defense',
        priority: 6,
        titleKey: 'game.hunt.expedition.buildWarden',
        titleFallback: 'Trail Warden',
        bonusKey: 'game.hunt.expedition.buildWardenBonus',
        bonusFallback: '−10% poison · −10% bleed',
        // Poison ×3 (+10) + Bleed ×2 (+10) ≈ 5 picks
        requirements: [
            { kind: 'stat', stat: 'poisonResPct', minPct: 30 },
            { kind: 'stat', stat: 'bleedResPct', minPct: 20 }
        ],
        bonuses: { poisonResPct: 10, bleedResPct: 10 }
    },
    {
        id: 'mana_well',
        icon: '💧',
        role: 'sustain',
        priority: 7,
        titleKey: 'game.hunt.expedition.buildManaWell',
        titleFallback: 'Mana Well',
        bonusKey: 'game.hunt.expedition.buildManaWellBonus',
        bonusFallback: '+10% MP regen · −10% skill MP cost',
        // MP regen ×2 (+10) + MP cost ×2 (+15) + CDR ×1 (+12) ≈ 5 picks
        requirements: [
            { kind: 'stat', stat: 'mpRegenPct', minPct: 20 },
            { kind: 'stat', stat: 'mpCostReductionPct', minPct: 30 },
            { kind: 'stat', stat: 'skillCdReductionPct', minPct: 12 }
        ],
        bonuses: { mpRegenPct: 10, mpCostReductionPct: 10 }
    },
    {
        id: 'vital_pulse',
        icon: '💚',
        role: 'sustain',
        priority: 8,
        titleKey: 'game.hunt.expedition.buildVitalPulse',
        titleFallback: 'Vital Pulse',
        bonusKey: 'game.hunt.expedition.buildVitalPulseBonus',
        bonusFallback: '+14% HP regen · +6% Max HP',
        // HP regen ×3 (+10) + HP ×2 (+8) ≈ 5 picks
        requirements: [
            { kind: 'stat', stat: 'hpRegenPct', minPct: 30 },
            { kind: 'stat', stat: 'maxHpPct', minPct: 16 }
        ],
        bonuses: { hpRegenPct: 14, maxHpPct: 6 }
    }
];

const UPGRADE_POOL: UpgradeDef[] = [
    {
        id: 'patk',
        icon: '⚔️',
        stat: 'pAtkPct',
        value: 8,
        titleKey: 'game.hunt.expedition.upgradePatkTitle',
        titleFallback: 'Sharpened Blade',
        descKey: 'game.hunt.expedition.upgradePatkDesc',
        descFallback: '+8% P.Atk for this run'
    },
    {
        id: 'matk',
        icon: '✨',
        stat: 'mAtkPct',
        value: 8,
        titleKey: 'game.hunt.expedition.upgradeMatkTitle',
        titleFallback: 'Arcane Focus',
        descKey: 'game.hunt.expedition.upgradeMatkDesc',
        descFallback: '+8% M.Atk for this run'
    },
    {
        id: 'crit',
        icon: '🎯',
        stat: 'critRatePct',
        value: 5,
        titleKey: 'game.hunt.expedition.upgradeCritTitle',
        titleFallback: 'Deadly Precision',
        descKey: 'game.hunt.expedition.upgradeCritDesc',
        descFallback: '+5% Crit Rate for this run'
    },
    {
        id: 'speed',
        icon: '💨',
        stat: 'atkSpeedPct',
        value: 10,
        titleKey: 'game.hunt.expedition.upgradeSpeedTitle',
        titleFallback: 'Battle Rhythm',
        descKey: 'game.hunt.expedition.upgradeSpeedDesc',
        descFallback: '+10% Attack Speed for this run'
    },
    {
        id: 'pdef',
        icon: '🛡️',
        stat: 'pDefPct',
        value: 7,
        titleKey: 'game.hunt.expedition.upgradePdefTitle',
        titleFallback: 'Iron Guard',
        descKey: 'game.hunt.expedition.upgradePdefDesc',
        descFallback: '+7% P.Def for this run'
    },
    {
        id: 'mdef',
        icon: '🔮',
        stat: 'mDefPct',
        value: 7,
        titleKey: 'game.hunt.expedition.upgradeMdefTitle',
        titleFallback: 'Spell Ward',
        descKey: 'game.hunt.expedition.upgradeMdefDesc',
        descFallback: '+7% M.Def for this run'
    },
    {
        id: 'vitality',
        icon: '❤️',
        stat: 'maxHpPct',
        value: 8,
        titleKey: 'game.hunt.expedition.upgradeVitalityTitle',
        titleFallback: 'Survival Instinct',
        descKey: 'game.hunt.expedition.upgradeVitalityDesc',
        descFallback: '+8% Max HP for this run'
    },
    {
        id: 'poison_res',
        icon: '☠️',
        stat: 'poisonResPct',
        value: 10,
        titleKey: 'game.hunt.expedition.upgradePoisonResTitle',
        titleFallback: 'Toxic Ward',
        descKey: 'game.hunt.expedition.upgradePoisonResDesc',
        descFallback: '-10% poison damage for this run'
    },
    {
        id: 'bleed_res',
        icon: '🩸',
        stat: 'bleedResPct',
        value: 10,
        titleKey: 'game.hunt.expedition.upgradeBleedResTitle',
        titleFallback: 'Hemostatic Wrap',
        descKey: 'game.hunt.expedition.upgradeBleedResDesc',
        descFallback: '-10% bleed damage for this run'
    },
    {
        id: 'hp_regen',
        icon: '💚',
        stat: 'hpRegenPct',
        value: 10,
        titleKey: 'game.hunt.expedition.upgradeHpRegenTitle',
        titleFallback: 'Field Medic',
        descKey: 'game.hunt.expedition.upgradeHpRegenDesc',
        descFallback: '+10% HP regeneration during this run (map and combat)'
    },
    {
        id: 'mp_regen',
        icon: '💙',
        stat: 'mpRegenPct',
        value: 10,
        titleKey: 'game.hunt.expedition.upgradeMpRegenTitle',
        titleFallback: 'Mana Flow',
        descKey: 'game.hunt.expedition.upgradeMpRegenDesc',
        descFallback: '+10% MP regeneration during this run (map and combat)'
    },
    {
        id: 'mp_efficiency',
        icon: '🔷',
        stat: 'mpCostReductionPct',
        value: 15,
        titleKey: 'game.hunt.expedition.upgradeMpEfficiencyTitle',
        titleFallback: 'Arcane Efficiency',
        descKey: 'game.hunt.expedition.upgradeMpEfficiencyDesc',
        descFallback: '−15% MP cost on skills for this run'
    },
    {
        id: 'skill_cdr',
        icon: '⏱️',
        stat: 'skillCdReductionPct',
        value: 12,
        titleKey: 'game.hunt.expedition.upgradeSkillCdrTitle',
        titleFallback: 'Swift Cast',
        descKey: 'game.hunt.expedition.upgradeSkillCdrDesc',
        descFallback: '−12% skill cooldown for this run'
    }
];

const LEGENDARY_UPGRADE_POOL: UpgradeDef[] = [
    {
        id: 'patk',
        icon: '⚔️',
        stat: 'pAtkPct',
        value: 16,
        legendary: true,
        titleKey: 'game.hunt.expedition.upgradeLegendPatkTitle',
        titleFallback: 'Legendary Edge',
        descKey: 'game.hunt.expedition.upgradeLegendPatkDesc',
        descFallback: '+16% P.Atk for this run'
    },
    {
        id: 'matk',
        icon: '✨',
        stat: 'mAtkPct',
        value: 16,
        legendary: true,
        titleKey: 'game.hunt.expedition.upgradeLegendMatkTitle',
        titleFallback: 'Arcane Crown',
        descKey: 'game.hunt.expedition.upgradeLegendMatkDesc',
        descFallback: '+16% M.Atk for this run'
    },
    {
        id: 'crit',
        icon: '🎯',
        stat: 'critRatePct',
        value: 10,
        legendary: true,
        titleKey: 'game.hunt.expedition.upgradeLegendCritTitle',
        titleFallback: 'Fatal Star',
        descKey: 'game.hunt.expedition.upgradeLegendCritDesc',
        descFallback: '+10% Crit Rate for this run'
    },
    {
        id: 'vitality',
        icon: '❤️',
        stat: 'maxHpPct',
        value: 15,
        legendary: true,
        titleKey: 'game.hunt.expedition.upgradeLegendVitalityTitle',
        titleFallback: 'Ironheart',
        descKey: 'game.hunt.expedition.upgradeLegendVitalityDesc',
        descFallback: '+15% Max HP for this run'
    }
];

const RARE_EVENT_TYPES: ExpeditionRareEventType[] = ['shrine', 'gambler', 'cache', 'storm'];

export class ExpeditionEngine {
    static state: ExpeditionState = ExpeditionEngine.createInitialState('');

    /** When true, calcularStatusGlobais skips run-buff apply (upgrade UI base snapshot). */
    static _skipRunBuffApply = false;

    static pendingPathIndex: number | null = null;
    static pendingUpgradeOptions: UpgradeDef[] = [];
    static _upgradePickLocked = false;
    static lastCombatLoot: ExpeditionBagDelta | null = null;
    static _resultSkipsAdvance = false;
    static _forestLayoutMode: 'hub' | 'map' | 'combat' | 'idle' = 'idle';
    /** True while expedition combat UI is active (path chosen — no map / no flee). */
    static _combatUiActive = false;
    /** After extract-to-switch: start this zone when the victory modal closes. */
    static _pendingStartZoneAfterExtract: string | null = null;
    /** Offer modal (merchant / warhorn / storm focus) — must pick; no cancel. */
    static _offerMode = false;
    static _pendingOffers: ExpeditionOffer[] = [];
    static _pendingOfferHandler: ((id: string) => void) | null = null;
    static _offerPickLocked = false;
    /** Merchant signed-pact stat rolled when the shop opens. */
    static _merchantPactStat: keyof ExpeditionRunBuffs | null = null;
    /** Storm focus: three stats offered when picking the non-legendary option. */
    static _stormFocusStats: (keyof ExpeditionRunBuffs)[] = [];

    static isExpeditionCombatUiActive(): boolean {
        return !!(this.state.active && !this.state.suspended && this._combatUiActive);
    }

    /** Live fight on Forest — leave / Pause retreat is blocked (rules: no retreat). */
    static isLiveCombatActive(): boolean {
        if (!this.state.active || this.state.suspended) return false;
        if (this._combatUiActive) return true;
        const win = window as any;
        return Array.isArray(win.monstrosAtivos) && win.monstrosAtivos.length > 0;
    }

    /**
     * Call from nav before leaving Forest / screen-game.
     * @returns true if navigation must abort.
     */
    static blockLeaveDuringCombat(): boolean {
        if (!this.isLiveCombatActive()) return false;
        const win = window as any;
        const title = this.t('game.hunt.expedition.combatLeaveTitle', 'Fight in progress');
        const body = this.t(
            'game.hunt.expedition.combatLeaveBlocked',
            'You are in an expedition fight. There is no retreat — win the battle or die and keep half the bag.'
        );
        if (typeof win.l2Alert === 'function') {
            void win.l2Alert(body, title);
        } else if (typeof win.escreverLog === 'function') {
            win.escreverLog(`<span style="color:#ef4444; font-weight:bold;">⚠️ ${body}</span>`);
        }
        return true;
    }

    /** Original `#hotbar-home-anchor` parent — restore when leaving expedition map/combat. */
    static _hotbarDockRestore: { parent: HTMLElement; next: ChildNode | null } | null = null;

    static captureHotbarHomeAnchor() {
        if (this._hotbarDockRestore) return;
        const anchor = document.getElementById('hotbar-home-anchor');
        const screen = document.getElementById('screen-game');
        if (!anchor || !screen) return;
        const log = screen.querySelector(':scope > .log-container');
        this._hotbarDockRestore = {
            parent: screen,
            next: log && log.parentElement === screen ? log : anchor.nextSibling
        };
    }

    static restoreHotbarHomeAnchor() {
        const anchor = document.getElementById('hotbar-home-anchor');
        if (!anchor || !this._hotbarDockRestore) return;
        const { parent, next } = this._hotbarDockRestore;
        if (anchor.parentElement === parent) return;
        if (next && next.parentNode === parent) {
            parent.insertBefore(anchor, next);
        } else {
            parent.appendChild(anchor);
        }
    }

    /** Pull hotbar to `#screen-game` before map `innerHTML` wipe — never re-dock into the old map slot. */
    static detachHotbarBeforeMapWipe(): void {
        this.captureHotbarHomeAnchor();
        this.restoreHotbarHomeAnchor();
        const anchor = document.getElementById('hotbar-home-anchor');
        const barra = document.getElementById('barra-de-atalhos-dinamica');
        if (anchor) {
            anchor.style.removeProperty('display');
            anchor.removeAttribute('aria-hidden');
        }
        if (barra) barra.style.removeProperty('display');
    }

    /**
     * Move bar back to `#screen-game` footer after map wipe.
     * Does not force visibility — caller / `irPara` decides show vs hide per screen.
     */
    static restoreGameHotbar() {
        this.detachHotbarBeforeMapWipe();
        const win = window as any;
        if (typeof win.renderizarBarraAtalhos === 'function') {
            win.renderizarBarraAtalhos();
        }
    }

    static syncExpeditionCombatControls(mode: 'hub' | 'map' | 'combat' | 'idle') {
        const botoes = document.getElementById('botoes-combate');
        const flee = document.getElementById('btn-fugir');
        if (!botoes) return;

        if (this.state.active && mode === 'combat') {
            botoes.style.setProperty('display', 'none', 'important');
            if (flee) flee.style.setProperty('display', 'none', 'important');
            return;
        }

        botoes.style.display = 'none';
        if (flee) flee.style.removeProperty('display');
    }

    /** Dock shortcut bar into journey/combat panel, or restore to `#screen-game` footer. */
    static dockHotbarToSlot(slotId: string | null) {
        const anchor = document.getElementById('hotbar-home-anchor');
        const barra = document.getElementById('barra-de-atalhos-dinamica');
        if (!anchor || !barra) return;

        this.captureHotbarHomeAnchor();

        if (!slotId) {
            this.restoreHotbarHomeAnchor();
            return;
        }

        const slot = document.getElementById(slotId);
        if (!slot) {
            this.restoreHotbarHomeAnchor();
            return;
        }

        slot.appendChild(anchor);
        slot.setAttribute('aria-hidden', 'false');
        slot.style.removeProperty('display');
        anchor.style.removeProperty('display');
        barra.style.setProperty('display', 'grid', 'important');
    }

    /** Keep expedition vitals playable — HP at 0 softlocks attack, regen and potions. */
    static ensureRunVitalsForCombat(): void {
        const win = window as any;
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        const ps = win.playerStats;
        if (!ps) return;
        const maxHp = Math.max(1, Math.floor(Number(ps.maxHp) || 100));
        const maxMp = Math.max(1, Math.floor(Number(ps.maxMp) || 50));
        const maxCp = Math.max(1, Math.floor(Number(ps.maxCp) || 60));
        ps.maxHp = maxHp;
        if (!Number.isFinite(win.playerHP) || win.playerHP <= 0) {
            win.playerHP = maxHp;
        } else {
            win.playerHP = Math.max(1, Math.min(maxHp, Math.floor(win.playerHP)));
        }
        if (!Number.isFinite(win.playerMP) || win.playerMP < 0) {
            win.playerMP = maxMp;
        } else {
            win.playerMP = Math.min(maxMp, Math.floor(win.playerMP));
        }
        if (!Number.isFinite(win.playerCP) || win.playerCP < 0) {
            win.playerCP = maxCp;
        } else {
            win.playerCP = Math.min(maxCp, Math.floor(win.playerCP));
        }
    }

    static syncExpeditionHotbar(mode: 'hub' | 'map' | 'combat' | 'idle') {
        const combatSlot = document.getElementById('expedition-combat-hotbar-slot');
        const mapSlot = document.getElementById('expedition-hotbar-slot');
        const anchor = document.getElementById('hotbar-home-anchor');
        const barra = document.getElementById('barra-de-atalhos-dinamica');

        const hideHomeHotbar = () => {
            this.dockHotbarToSlot(null);
            const home = document.getElementById('hotbar-home-anchor');
            const bar = document.getElementById('barra-de-atalhos-dinamica');
            if (home) home.style.setProperty('display', 'none', 'important');
            if (bar) bar.style.setProperty('display', 'none', 'important');
        };

        // No live expedition UI (ended or parked) — never force the bar visible on Profile/Town.
        if (!this.state.active || this.state.suspended || mode === 'hub' || mode === 'idle') {
            if (combatSlot) combatSlot.setAttribute('aria-hidden', 'true');
            if (mapSlot) mapSlot.setAttribute('aria-hidden', 'true');
            hideHomeHotbar();
            return;
        }

        if (mode === 'map') {
            if (combatSlot && (!anchor || !combatSlot.contains(anchor))) {
                combatSlot.setAttribute('aria-hidden', 'true');
            }
            if (mapSlot) mapSlot.style.removeProperty('display');
            this.dockHotbarToSlot('expedition-hotbar-slot');
            if (barra) barra.style.setProperty('display', 'grid', 'important');
            return;
        }

        if (mode === 'combat') {
            if (mapSlot) mapSlot.setAttribute('aria-hidden', 'true');
            if (combatSlot) {
                combatSlot.style.removeProperty('display');
                combatSlot.setAttribute('aria-hidden', 'false');
            }
            this.dockHotbarToSlot('expedition-combat-hotbar-slot');
            if (barra) barra.style.setProperty('display', 'grid', 'important');
        }
    }

    static createInitialState(zoneId: string): ExpeditionState {
        return {
            active: false,
            suspended: false,
            zoneId,
            journey: 1,
            pathChoices: [],
            currentPath: null,
            combatInterrupted: false,
            combatOnlyNextJourney: false,
            combatOnlyThisJourney: false,
            nextPathBias: null,
            nextPathGuarantee: null,
            pathBiasThisJourney: null,
            runBuffs: ExpeditionEngine.emptyRunBuffs(),
            unlockedBuildIds: [],
            buildBonusBuffs: ExpeditionEngine.emptyRunBuffs(),
            runEnchantBonus: ExpeditionEngine.emptyRunEnchantBonus(),
            runStats: ExpeditionEngine.emptyRunStats(),
            journeyTrait: 'brutal',
            nextJourneyTrait: 'brutal',
            luckLootMult: 1,
            luckLegendaryNext: false,
            rareEventJourney: 0,
            rareEventUsed: false,
            pendingRareEvent: false,
            rareEventType: null,
            runPanelTab: 'path',
            bag: { adenas: 0, xp: 0, drops: {} }
        };
    }

    /** Run buffs / forge enchants apply only while the player is on the expedition map/combat. */
    static isRunEffectsActive(): boolean {
        return !!(this.state.active && !this.state.suspended);
    }

    static hasActiveRun(): boolean {
        return !!this.state.active;
    }

    static hasSuspendedRun(): boolean {
        return !!(this.state.active && this.state.suspended);
    }

    static getRunSavePayload(): ExpeditionRunSave | null {
        if (!this.state.active) return null;
        const win = window as any;
        const bagDrops: Record<string, number> = {};
        const srcDrops = this.state.bag.drops || {};
        for (const k of Object.keys(srcDrops)) {
            const n = Math.floor(Number(srcDrops[k]) || 0);
            if (n > 0) bagDrops[k] = n;
        }
        const payload: ExpeditionRunSave = {
            v: 1,
            suspended: !!this.state.suspended,
            zoneId: String(this.state.zoneId || 'No-Grade'),
            journey: Math.max(1, Math.floor(Number(this.state.journey) || 1)),
            pathChoices: (this.state.pathChoices || []).map((c) => ({
                id: String(c.id || ''),
                type: c.type,
            })),
            currentPath: this.state.currentPath,
            combatInterrupted: !!this.state.combatInterrupted,
            combatOnlyNextJourney: !!this.state.combatOnlyNextJourney,
            combatOnlyThisJourney: !!this.state.combatOnlyThisJourney,
            nextPathBias: this.state.nextPathBias,
            nextPathGuarantee: this.state.nextPathGuarantee,
            pathBiasThisJourney: this.state.pathBiasThisJourney,
            runBuffs: { ...this.state.runBuffs },
            unlockedBuildIds: [...(this.state.unlockedBuildIds || [])],
            runEnchantBonus: { ...this.state.runEnchantBonus },
            runStats: { ...this.state.runStats },
            journeyTrait: this.state.journeyTrait,
            nextJourneyTrait: this.state.nextJourneyTrait,
            luckLootMult: Number(this.state.luckLootMult) || 1,
            luckLegendaryNext: !!this.state.luckLegendaryNext,
            rareEventJourney: Math.floor(Number(this.state.rareEventJourney) || 0),
            rareEventUsed: !!this.state.rareEventUsed,
            pendingRareEvent: !!this.state.pendingRareEvent,
            rareEventType: this.state.rareEventType,
            runPanelTab: this.state.runPanelTab || 'path',
            bag: {
                adenas: Math.max(0, Math.floor(Number(this.state.bag.adenas) || 0)),
                xp: Math.max(0, Math.floor(Number(this.state.bag.xp) || 0)),
                drops: bagDrops,
            },
            vitals: {
                hp: Math.max(0, Math.floor(Number(win.playerHP) || 0)),
                mp: Math.max(0, Math.floor(Number(win.playerMP) || 0)),
                cp: Math.max(0, Math.floor(Number(win.playerCP) || 0)),
            },
        };
        if (this.pendingUpgradeOptions.length) {
            payload.pendingUpgradeIds = this.pendingUpgradeOptions.map((u) => u.id);
            if (this.lastCombatLoot) {
                payload.lastCombatLoot = {
                    adenas: Math.floor(Number(this.lastCombatLoot.adenas) || 0),
                    xp: Math.floor(Number(this.lastCombatLoot.xp) || 0),
                    drops: { ...(this.lastCombatLoot.drops || {}) },
                };
            }
        }
        return payload;
    }

    static persistRun(opts?: { silent?: boolean }): void {
        if (!this.state.active) return;
        if (typeof window.salvarJogo === 'function') {
            window.salvarJogo({ silent: opts?.silent !== false });
        }
    }

    static applyRunFromSave(raw: ExpeditionRunSave | null | undefined): void {
        this.restoreMobTuning();
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;
        this._combatUiActive = false;

        if (!raw || typeof raw !== 'object' || raw.v !== 1) {
            this.state = this.createInitialState('');
            this.syncNavigationLock();
            return;
        }

        const zoneId = String(raw.zoneId || 'No-Grade');
        const baseBuffs = this.emptyRunBuffs();
        const baseEnch = this.emptyRunEnchantBonus();
        const baseStats = this.emptyRunStats();
        const rb = raw.runBuffs && typeof raw.runBuffs === 'object' ? raw.runBuffs : {};
        const re = raw.runEnchantBonus && typeof raw.runEnchantBonus === 'object' ? raw.runEnchantBonus : {};
        const rs = raw.runStats && typeof raw.runStats === 'object' ? raw.runStats : {};

        for (const k of Object.keys(baseBuffs) as (keyof ExpeditionRunBuffs)[]) {
            baseBuffs[k] = Math.max(0, Math.floor(Number(rb[k]) || 0));
        }
        for (const k of Object.keys(baseEnch) as (keyof ExpeditionRunEnchantBonus)[]) {
            baseEnch[k] = Math.max(0, Math.floor(Number(re[k]) || 0));
        }
        baseStats.combatsWon = Math.max(0, Math.floor(Number(rs.combatsWon) || 0));
        baseStats.elitesCleared = Math.max(0, Math.floor(Number(rs.elitesCleared) || 0));
        baseStats.bossesCleared = Math.max(0, Math.floor(Number(rs.bossesCleared) || 0));
        baseStats.upgradesTaken = Math.max(0, Math.floor(Number(rs.upgradesTaken) || 0));
        baseStats.chestsOpened = Math.max(0, Math.floor(Number(rs.chestsOpened) || 0));
        baseStats.merchantsUsed = Math.max(0, Math.floor(Number(rs.merchantsUsed) || 0));
        baseStats.forgesUsed = Math.max(0, Math.floor(Number(rs.forgesUsed) || 0));
        baseStats.scoutsUsed = Math.max(0, Math.floor(Number(rs.scoutsUsed) || 0));
        baseStats.rareEventType = (rs.rareEventType as ExpeditionRareEventType) || null;

        const pathTypes: ExpeditionPathType[] = [
            'combat', 'boss', 'chest', 'elite', 'merchant', 'forge',
            'scout', 'patrol', 'tracks', 'warhorn', 'ambush',
        ];
        const pathChoices = Array.isArray(raw.pathChoices)
            ? raw.pathChoices
                .filter((c) => c && pathTypes.includes(c.type as ExpeditionPathType))
                .map((c, i) => ({
                    id: String(c.id || `path_${i}`),
                    type: c.type as ExpeditionPathType,
                }))
            : [];

        const traits: JourneyMobTrait[] = ['brutal', 'swift', 'lethal', 'armored', 'frenzied'];
        const bagDrops: Record<string, number> = {};
        const rawDrops = raw.bag?.drops && typeof raw.bag.drops === 'object' ? raw.bag.drops : {};
        for (const k of Object.keys(rawDrops)) {
            const n = Math.floor(Number(rawDrops[k]) || 0);
            if (n > 0) bagDrops[k] = n;
        }

        const loadedPath = pathTypes.includes(raw.currentPath as ExpeditionPathType)
            ? (raw.currentPath as ExpeditionPathType)
            : null;
        const hasPendingUpgrade = Array.isArray(raw.pendingUpgradeIds) && raw.pendingUpgradeIds.length > 0;
        const pathIsCombat = !!loadedPath && ['combat', 'boss', 'elite'].includes(loadedPath);
        // Mid-fight reload (path locked, no upgrade pick yet) must resume the same fight.
        const combatInterrupted = pathIsCombat && !hasPendingUpgrade;

        this.state = {
            active: true,
            suspended: true, // always load parked; resume when entering Forest
            zoneId,
            journey: Math.max(1, Math.floor(Number(raw.journey) || 1)),
            pathChoices,
            currentPath: loadedPath,
            combatInterrupted,
            combatOnlyNextJourney: !!raw.combatOnlyNextJourney,
            combatOnlyThisJourney: !!raw.combatOnlyThisJourney,
            nextPathBias: raw.nextPathBias === 'fight' || raw.nextPathBias === 'safe' ? raw.nextPathBias : null,
            nextPathGuarantee: pathTypes.includes(raw.nextPathGuarantee as ExpeditionPathType)
                ? (raw.nextPathGuarantee as ExpeditionPathType)
                : null,
            pathBiasThisJourney: raw.pathBiasThisJourney === 'fight' || raw.pathBiasThisJourney === 'safe'
                ? raw.pathBiasThisJourney
                : null,
            runBuffs: baseBuffs,
            unlockedBuildIds: [],
            buildBonusBuffs: this.emptyRunBuffs(),
            runEnchantBonus: baseEnch,
            runStats: baseStats,
            journeyTrait: traits.includes(raw.journeyTrait as JourneyMobTrait)
                ? (raw.journeyTrait as JourneyMobTrait)
                : 'brutal',
            nextJourneyTrait: traits.includes(raw.nextJourneyTrait as JourneyMobTrait)
                ? (raw.nextJourneyTrait as JourneyMobTrait)
                : 'brutal',
            luckLootMult: Math.max(1, Number(raw.luckLootMult) || 1),
            luckLegendaryNext: !!raw.luckLegendaryNext,
            rareEventJourney: Math.max(0, Math.floor(Number(raw.rareEventJourney) || 0)),
            rareEventUsed: !!raw.rareEventUsed,
            pendingRareEvent: !!raw.pendingRareEvent,
            rareEventType: (['shrine', 'gambler', 'cache', 'storm'] as ExpeditionRareEventType[])
                .includes(raw.rareEventType as ExpeditionRareEventType)
                ? (raw.rareEventType as ExpeditionRareEventType)
                : null,
            runPanelTab: (['path', 'stats', 'builds', 'gear'] as ExpeditionRunPanelTab[])
                .includes(raw.runPanelTab as ExpeditionRunPanelTab)
                ? (raw.runPanelTab as ExpeditionRunPanelTab)
                : 'path',
            bag: {
                adenas: Math.max(0, Math.floor(Number(raw.bag?.adenas) || 0)),
                xp: Math.max(0, Math.floor(Number(raw.bag?.xp) || 0)),
                drops: bagDrops,
            },
        };

        const rawSave = raw as { unlockedBuildIds?: string[]; activeBuildId?: string | null };
        const merged: ExpeditionBuildId[] = [];
        const pushId = (id: unknown) => {
            if (typeof id === 'string' && RUN_BUILD_IDS.includes(id as ExpeditionBuildId) && merged.indexOf(id as ExpeditionBuildId) < 0) {
                merged.push(id as ExpeditionBuildId);
            }
        };
        if (Array.isArray(rawSave.unlockedBuildIds)) rawSave.unlockedBuildIds.forEach(pushId);
        else pushId(rawSave.activeBuildId);
        this.state.unlockedBuildIds = merged;
        this.syncBuildBonusBuffsFromUnlocked();

        // Stash vitals on the engine for resume (town HP stays until then).
        (this as any)._savedRunVitals = {
            hp: Math.max(0, Math.floor(Number(raw.vitals?.hp) || 0)),
            mp: Math.max(0, Math.floor(Number(raw.vitals?.mp) || 0)),
            cp: Math.max(0, Math.floor(Number(raw.vitals?.cp) || 0)),
        };

        if (Array.isArray(raw.pendingUpgradeIds) && raw.pendingUpgradeIds.length) {
            const pool = [...UPGRADE_POOL, ...LEGENDARY_UPGRADE_POOL];
            this.pendingUpgradeOptions = raw.pendingUpgradeIds
                .map((id) => pool.find((u) => u.id === id))
                .filter((u): u is UpgradeDef => !!u);
            if (raw.lastCombatLoot && typeof raw.lastCombatLoot === 'object') {
                this.lastCombatLoot = {
                    adenas: Math.floor(Number(raw.lastCombatLoot.adenas) || 0),
                    xp: Math.floor(Number(raw.lastCombatLoot.xp) || 0),
                    drops: { ...(raw.lastCombatLoot.drops || {}) },
                };
            }
        }

        this.ensureZoneForRun(zoneId);
        this.syncNavigationLock();
    }

    static ensureZoneForRun(zoneId: string): void {
        const win = window as any;
        const zones = win.zonasDeCaca;
        if (zones && zones[zoneId]) {
            win.zonaAtual = zones[zoneId];
        } else if (zones && zones['No-Grade']) {
            win.zonaAtual = zones['No-Grade'];
            if (this.state.active) this.state.zoneId = 'No-Grade';
        }
        if (typeof win.atualizarHudZonaNome === 'function') {
            try { win.atualizarHudZonaNome(); } catch { /* noop */ }
        }
    }

    /**
     * Park the run so the player can open town / inventory / leave the game.
     * Live combat leave is normally blocked; if still called mid-fight, the same
     * combat path stays locked (`combatInterrupted`) — no free route re-pick.
     */
    static suspendRunForWorldLeave(opts?: { persist?: boolean }): void {
        if (!this.state.active || this.state.suspended) return;
        const win = window as any;

        const inCombat = this._combatUiActive
            || (Array.isArray(win.monstrosAtivos) && win.monstrosAtivos.length > 0);

        if (inCombat) {
            if (typeof win.pararAtaqueMonstro === 'function') win.pararAtaqueMonstro();
            if (typeof win.clearForestPlayerThreats === 'function') win.clearForestPlayerThreats();
            if (Array.isArray(win.monstrosAtivos)) win.monstrosAtivos.length = 0;
            this.restoreMobTuning();
            this._combatUiActive = false;
            (this as any)._combatLootMult = 1;
            if (this.state.currentPath && this.isCombatPathType(this.state.currentPath)) {
                this.state.combatInterrupted = true;
            } else {
                this.state.currentPath = null;
                this.state.combatInterrupted = false;
            }
        } else {
            this.state.combatInterrupted = false;
        }

        // Close expedition modals that would soft-lock other screens.
        if (typeof win.fecharModal === 'function') {
            ['janela-expedition-node', 'janela-expedition-result', 'janela-expedition-rules']
                .forEach((id) => { try { win.fecharModal(id); } catch { /* noop */ } });
        }

        (this as any)._savedRunVitals = {
            hp: Math.max(0, Math.floor(Number(win.playerHP) || 0)),
            mp: Math.max(0, Math.floor(Number(win.playerMP) || 0)),
            cp: Math.max(0, Math.floor(Number(win.playerCP) || 0)),
        };

        this.state.suspended = true;
        this.restoreGameHotbar();
        this.setForestLayoutMode('idle');
        this.syncNavigationLock();

        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        if (typeof win.atualizar === 'function') win.atualizar();

        if (opts?.persist !== false) this.persistRun({ silent: true });

        if (typeof win.escreverLog === 'function') {
            const msg = this.t(
                'game.hunt.expedition.runParkedLog',
                'Expedition parked — bag and progress saved. Return to Forest to continue.'
            );
            win.escreverLog(`<span style="color:#fbbf24; font-weight:bold;">⛺ ${msg}</span>`);
        }
    }

    /** Resume a parked run when entering Forest. */
    static resumeSuspendedRun(): void {
        if (!this.state.active) return;
        const resumeCombat = this.state.combatInterrupted
            && !!this.state.currentPath
            && this.isCombatPathType(this.state.currentPath);
        const pathToResume = this.state.currentPath;

        this.state.suspended = false;
        this.state.combatInterrupted = false;
        this.ensureZoneForRun(this.state.zoneId);
        this._combatUiActive = false;

        const win = window as any;
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();

        const vitals = (this as any)._savedRunVitals as { hp: number; mp: number; cp: number } | null;
        if (vitals) {
            const maxHp = Math.max(1, Math.floor(Number(win.playerStats?.maxHp) || 1));
            const maxMp = Math.max(1, Math.floor(Number(win.playerStats?.maxMp) || 1));
            const maxCp = Math.max(0, Math.floor(Number(win.playerStats?.maxCp) || 0));
            win.playerHP = Math.min(maxHp, Math.max(1, Math.floor(Number(vitals.hp) || maxHp)));
            win.playerMP = Math.min(maxMp, Math.max(0, Math.floor(Number(vitals.mp) || 0)));
            win.playerCP = Math.min(maxCp, Math.max(0, Math.floor(Number(vitals.cp) || 0)));
        }

        this.hideHub();

        if (resumeCombat && pathToResume) {
            this.syncNavigationLock();
            this.ensureRunVitalsForCombat();
            if (typeof win.atualizar === 'function') win.atualizar();
            this.startCombatPath(pathToResume);
            this.persistRun({ silent: true });
            this.syncHubParkedHint();
            return;
        }

        this.renderMap();
        this.syncNavigationLock();
        this.ensureRunVitalsForCombat();
        if (typeof win.atualizar === 'function') win.atualizar();

        if (this.pendingUpgradeOptions.length) {
            this.showUpgradeModal(this.lastCombatLoot || { adenas: 0, xp: 0, drops: {} });
        }

        this.persistRun({ silent: true });
        this.syncHubParkedHint();
    }

    static emptyRunStats(): ExpeditionRunStats {
        return {
            combatsWon: 0,
            elitesCleared: 0,
            bossesCleared: 0,
            upgradesTaken: 0,
            chestsOpened: 0,
            merchantsUsed: 0,
            forgesUsed: 0,
            scoutsUsed: 0,
            rareEventType: null
        };
    }

    static emptyRunBuffs(): ExpeditionRunBuffs {
        return {
            pAtkPct: 0,
            mAtkPct: 0,
            pDefPct: 0,
            mDefPct: 0,
            critRatePct: 0,
            atkSpeedPct: 0,
            maxHpPct: 0,
            poisonResPct: 0,
            bleedResPct: 0,
            hpRegenPct: 0,
            mpRegenPct: 0,
            mpCostReductionPct: 0,
            skillCdReductionPct: 0
        };
    }


    static getBuildDef(id: ExpeditionBuildId | null | undefined): ExpeditionBuildDef | null {
        if (!id) return null;
        return RUN_BUILDS.find((b) => b.id === id) || null;
    }

    static getCardBuffPct(stat: keyof ExpeditionRunBuffs): number {
        return Math.max(0, Number(this.state.runBuffs[stat]) || 0);
    }

    /** Card picks + locked build synergy bonus. */
    static getCombinedBuffPct(stat: keyof ExpeditionRunBuffs): number {
        const cards = this.getCardBuffPct(stat);
        const bonus = Math.max(0, Number(this.state.buildBonusBuffs?.[stat]) || 0);
        return cards + bonus;
    }

    static syncBuildBonusBuffsFromUnlocked(): void {
        const bonuses = this.emptyRunBuffs();
        const add = (partial: Partial<Record<keyof ExpeditionRunBuffs, number>> | undefined) => {
            if (!partial) return;
            for (const [stat, val] of Object.entries(partial) as [keyof ExpeditionRunBuffs, number][]) {
                bonuses[stat] += Math.max(0, Math.floor(Number(val) || 0));
            }
        };
        for (const id of this.state.unlockedBuildIds || []) {
            add(this.getBuildDef(id)?.bonuses);
        }
        const mastery = this.getBuildMasteryTier();
        if (mastery) add(mastery.bonuses);
        this.state.buildBonusBuffs = bonuses;
    }

    /** @deprecated alias — prefer syncBuildBonusBuffsFromUnlocked */
    static syncBuildBonusBuffsFromActive(): void {
        this.syncBuildBonusBuffsFromUnlocked();
    }

    static getBuildMasteryTier(): (typeof BUILD_MASTERY_TIERS)[number] | null {
        const n = (this.state.unlockedBuildIds || []).length;
        let best: (typeof BUILD_MASTERY_TIERS)[number] | null = null;
        for (const tier of BUILD_MASTERY_TIERS) {
            if (n >= tier.count) best = tier;
        }
        return best;
    }

    static isBuildUnlocked(id: ExpeditionBuildId): boolean {
        return (this.state.unlockedBuildIds || []).indexOf(id) >= 0;
    }

    static isBuildRequirementMet(req: ExpeditionBuildRequirement): boolean {
        if (req.kind === 'stat') {
            return this.getCardBuffPct(req.stat) >= req.minPct;
        }
        const best = Math.max(...req.stats.map((s) => this.getCardBuffPct(s)));
        return best >= req.minPct;
    }

    static isBuildComplete(def: ExpeditionBuildDef): boolean {
        return def.requirements.every((r) => this.isBuildRequirementMet(r));
    }

    static getBuildReqValues(req: ExpeditionBuildRequirement): {
        cur: number;
        minPct: number;
        label: string;
        pct: number;
    } {
        if (req.kind === 'stat') {
            const cur = Math.min(req.minPct, this.getCardBuffPct(req.stat));
            return {
                cur,
                minPct: req.minPct,
                label: this.runStatLabel(req.stat),
                pct: req.minPct > 0 ? Math.min(100, Math.round((cur / req.minPct) * 100)) : 0
            };
        }
        const bestStat = req.stats.reduce((a, b) =>
            this.getCardBuffPct(a) >= this.getCardBuffPct(b) ? a : b
        );
        const cur = Math.min(req.minPct, this.getCardBuffPct(bestStat));
        const orLabel = req.stats.map((s) => this.runStatLabel(s)).join(' / ');
        return {
            cur,
            minPct: req.minPct,
            label: orLabel,
            pct: req.minPct > 0 ? Math.min(100, Math.round((cur / req.minPct) * 100)) : 0
        };
    }

    static formatBuildReqProgress(req: ExpeditionBuildRequirement): string {
        const v = this.getBuildReqValues(req);
        return v.cur + '/' + v.minPct + ' ' + v.label;
    }

    static getBuildProgress(def: ExpeditionBuildDef): {
        met: number;
        total: number;
        complete: boolean;
        partial: boolean;
        label: string;
        chipVal: string;
    } {
        const total = def.requirements.length;
        let met = 0;
        let partial = false;
        const parts: string[] = [];
        for (const req of def.requirements) {
            if (this.isBuildRequirementMet(req)) met += 1;
            else if (req.kind === 'stat') {
                if (this.getCardBuffPct(req.stat) > 0) partial = true;
            } else if (Math.max(...req.stats.map((s) => this.getCardBuffPct(s))) > 0) {
                partial = true;
            }
            parts.push(this.formatBuildReqProgress(req));
        }
        if (met > 0 && met < total) partial = true;
        let chipVal = met + '/' + total;
        if (total === 1) {
            const req = def.requirements[0];
            if (req.kind === 'stat') {
                chipVal = Math.min(req.minPct, this.getCardBuffPct(req.stat)) + '/' + req.minPct;
            } else {
                const best = Math.max(...req.stats.map((s) => this.getCardBuffPct(s)));
                chipVal = Math.min(req.minPct, best) + '/' + req.minPct;
            }
        }
        return {
            met,
            total,
            complete: met >= total,
            partial: partial || (total === 1 && chipVal !== '0/' + (def.requirements[0] as { minPct: number }).minPct),
            label: parts.join(' · '),
            chipVal
        };
    }

    /** Builds that would gain progress if this upgrade card is picked. */
    static getBuildsAdvancedByUpgrade(up: UpgradeDef): ExpeditionBuildDef[] {
        const before = this.getCardBuffPct(up.stat);
        const after = before + up.value;
        return RUN_BUILDS.filter((def) => {
            if (this.isBuildUnlocked(def.id)) return false;
            return def.requirements.some((req) => {
                if (req.kind === 'stat') {
                    if (req.stat !== up.stat) return false;
                    return before < req.minPct && after > before;
                }
                if (req.stats.indexOf(up.stat) < 0) return false;
                const bestBefore = Math.max(...req.stats.map((s) => s === up.stat ? before : this.getCardBuffPct(s)));
                const bestAfter = Math.max(...req.stats.map((s) => s === up.stat ? after : this.getCardBuffPct(s)));
                return bestBefore < req.minPct && bestAfter > bestBefore;
            });
        });
    }

    /**
     * Unlock every newly completed build (bonuses stack). Returns newly unlocked ids.
     */
    static evaluateRunBuilds(opts?: { notify?: boolean }): ExpeditionBuildId[] {
        if (!this.state.active) return [];
        if (!Array.isArray(this.state.unlockedBuildIds)) this.state.unlockedBuildIds = [];
        const newly: ExpeditionBuildId[] = [];
        const masteryBefore = this.getBuildMasteryTier()?.count || 0;
        const ordered = [...RUN_BUILDS].sort((a, b) => a.priority - b.priority);
        for (const def of ordered) {
            if (this.isBuildUnlocked(def.id)) continue;
            if (!this.isBuildComplete(def)) continue;
            this.state.unlockedBuildIds.push(def.id);
            newly.push(def.id);
            if (opts?.notify !== false) {
                const title = this.t(def.titleKey, def.titleFallback);
                const bonus = this.t(def.bonusKey, def.bonusFallback);
                const msg = this.t(
                    'game.hunt.expedition.buildUnlockedLog',
                    '{icon} Build unlocked: {name} — {bonus}',
                    { icon: def.icon, name: title, bonus }
                );
                const win = window as any;
                if (typeof win.escreverLog === 'function') {
                    win.escreverLog('<span style="color:#fde68a;font-weight:bold;">' + msg + '</span>');
                }
            }
        }
        this.syncBuildBonusBuffsFromUnlocked();
        const masteryAfter = this.getBuildMasteryTier();
        if (opts?.notify !== false && masteryAfter && masteryAfter.count > masteryBefore) {
            const win = window as any;
            const msg = this.t(
                'game.hunt.expedition.buildMasteryLog',
                '{icon} Mastery: {name}',
                { icon: '🏆', name: this.t(masteryAfter.titleKey, masteryAfter.titleFallback) }
            );
            if (typeof win.escreverLog === 'function') {
                win.escreverLog('<span style="color:#fbbf24;font-weight:bold;">' + msg + '</span>');
            }
        }
        return newly;
    }

    static buildRoleLabel(role: ExpeditionBuildRole): string {
        if (role === 'offense') return this.t('game.hunt.expedition.buildRoleOffense', 'Offense');
        if (role === 'defense') return this.t('game.hunt.expedition.buildRoleDefense', 'Defense');
        return this.t('game.hunt.expedition.buildRoleSustain', 'Sustain');
    }

    /** Next incomplete build with the highest progress (for tips). */
    static getClosestIncompleteBuild(): { def: ExpeditionBuildDef; score: number; prog: ReturnType<typeof ExpeditionEngine.getBuildProgress> } | null {
        let best: { def: ExpeditionBuildDef; score: number; prog: ReturnType<typeof ExpeditionEngine.getBuildProgress> } | null = null;
        for (const def of RUN_BUILDS) {
            if (this.isBuildUnlocked(def.id)) continue;
            const prog = this.getBuildProgress(def);
            if (!prog.partial && prog.met <= 0) continue;
            let score = prog.met / Math.max(1, prog.total);
            for (const req of def.requirements) {
                const v = this.getBuildReqValues(req);
                score += (v.pct / 100) / Math.max(1, prog.total);
            }
            if (!best || score > best.score) best = { def, score, prog };
        }
        return best;
    }

    static formatBuildBonusBuffLine(stat: keyof ExpeditionRunBuffs, val: number): string {
        const isRes = this.isNegativeRunBuffStat(stat);
        return `${isRes ? '−' : '+'}${val}% ${this.runStatLabel(stat)}`;
    }

    static buildMasteryTrackHtml(): string {
        const unlockedN = (this.state.unlockedBuildIds || []).length;
        const next = BUILD_MASTERY_TIERS.find((t) => unlockedN < t.count);
        const tiers = BUILD_MASTERY_TIERS.map((tier) => {
            const done = unlockedN >= tier.count;
            const isNext = !!next && tier.count === next.count;
            const tone = done ? 'done' : (isNext ? 'next' : 'locked');
            const name = this.t(tier.titleKey, tier.titleFallback);
            const bonusBits = Object.entries(tier.bonuses)
                .filter(([, v]) => Number(v) > 0)
                .map(([stat, v]) => this.formatBuildBonusBuffLine(stat as keyof ExpeditionRunBuffs, Number(v)))
                .join(' · ');
            return `<div class="exp-build-mastery__tier exp-build-mastery__tier--${tone}" title="${bonusBits}">
                <span class="exp-build-mastery__mark" aria-hidden="true">${done ? '✓' : tier.count}</span>
                <span class="exp-build-mastery__name">${name}</span>
            </div>`;
        }).join('');
        const progressHint = next
            ? this.t(
                'game.hunt.expedition.buildMasteryProgress',
                '{cur}/{need} to next mastery',
                { cur: unlockedN, need: next.count }
            )
            : this.t('game.hunt.expedition.buildMasteryMax', 'All mastery tiers unlocked');
        return `<div class="exp-build-mastery">
            <div class="exp-build-mastery__head">
                <span class="exp-build-mastery__title">${this.t('game.hunt.expedition.buildMasteryTitle', 'Mastery')}</span>
                <span class="exp-build-mastery__progress">${progressHint}</span>
            </div>
            <div class="exp-build-mastery__tiers">${tiers}</div>
        </div>`;
    }

    static buildStackedBonusesHtml(): string {
        const b = this.state.buildBonusBuffs || this.emptyRunBuffs();
        const lines: string[] = [];
        (Object.keys(b) as (keyof ExpeditionRunBuffs)[]).forEach((stat) => {
            const val = Math.max(0, Math.floor(Number(b[stat]) || 0));
            if (val > 0) lines.push(this.formatBuildBonusBuffLine(stat, val));
        });
        if (!lines.length) return '';
        return `<div class="exp-build-stack">
            <div class="exp-build-stack__title">${this.t('game.hunt.expedition.buildStackTitle', 'Stacked build bonuses')}</div>
            <ul class="exp-build-stack__list">${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
        </div>`;
    }

    static buildRunBuildsHtml(opts?: { compact?: boolean }): string {
        const title = this.t('game.hunt.expedition.buildsTitle', 'Run builds');
        const unlockedN = (this.state.unlockedBuildIds || []).length;
        const hint = this.t(
            'game.hunt.expedition.buildsHint',
            'Complete as many builds as you can — bonuses stack.'
        );
        const chips = [...RUN_BUILDS]
            .sort((a, b) => a.priority - b.priority)
            .map((def) => {
                const prog = this.getBuildProgress(def);
                const unlocked = this.isBuildUnlocked(def.id);
                const name = this.t(def.titleKey, def.titleFallback);
                let tone = 'progress';
                let valText = prog.chipVal;
                if (unlocked) {
                    tone = 'active';
                    valText = '\u2713';
                } else if (!prog.partial && prog.met <= 0) {
                    tone = 'idle';
                }
                const bonus = unlocked ? this.t(def.bonusKey, def.bonusFallback) : prog.label;
                return (
                    '<span class="exp-run-build-chip exp-run-build-chip--' + tone + '" title="' + bonus + '">' +
                    '<span class="exp-run-build-chip__icon" aria-hidden="true">' + def.icon + '</span>' +
                    '<span class="exp-run-build-chip__val">' + valText + '</span>' +
                    '<span class="exp-run-build-chip__label">' + name + '</span>' +
                    '</span>'
                );
            })
            .join('');
        if (opts?.compact) {
            const countLabel = unlockedN > 0
                ? '<span class="exp-run-builds__count">' + this.t('game.hunt.expedition.buildsUnlockedCount', '{n}/{total} unlocked', { n: unlockedN, total: RUN_BUILDS.length }) + '</span>'
                : '';
            return '<div class="exp-run-builds exp-run-builds--compact">' + countLabel + chips + '</div>';
        }
        return (
            '<div class="exp-run-builds">' +
            '<div class="exp-run-builds__head">' +
            '<span class="exp-run-builds__title">' + title + '</span>' +
            '<span class="exp-run-builds__hint">' + hint + '</span>' +
            '</div>' +
            '<div class="exp-run-builds__chips">' + chips + '</div>' +
            '</div>'
        );
    }

    /** Passive HP regen multiplier during an active run (1.0 = base, 1.1 = +10% card). */
    static getHpRegenMult(): number {
        if (!this.isRunEffectsActive()) return 1;
        const pct = Math.min(100, Math.max(0, this.getCombinedBuffPct('hpRegenPct')));
        return 1 + pct / 100;
    }

    /** Passive MP regen multiplier during an active run (1.0 = base, 1.1 = +10% card). */
    static getMpRegenMult(): number {
        if (!this.isRunEffectsActive()) return 1;
        const pct = Math.min(100, Math.max(0, this.getCombinedBuffPct('mpRegenPct')));
        return 1 + pct / 100;
    }

    /** Effective MP cost for a skill during an active expedition run (min 1 when base > 0). */
    static getSkillMpCost(baseMp: number): number {
        const base = Math.max(0, Math.floor(Number(baseMp) || 0));
        if (!base) return 0;
        if (!this.isRunEffectsActive()) return base;
        const pct = Math.min(60, Math.max(0, this.getCombinedBuffPct('mpCostReductionPct')));
        return Math.max(1, Math.floor(base * (1 - pct / 100)));
    }

    /** Effective skill cooldown (ms) during an active expedition run (min 250ms when base > 0). */
    static getSkillCooldownMs(baseMs: number): number {
        const base = Math.max(0, Math.floor(Number(baseMs) || 0));
        if (!base) return 0;
        if (!this.isRunEffectsActive()) return base;
        const pct = Math.min(50, Math.max(0, this.getCombinedBuffPct('skillCdReductionPct')));
        return Math.max(250, Math.floor(base * (1 - pct / 100)));
    }

    static emptyRunEnchantBonus(): ExpeditionRunEnchantBonus {
        return { weapon: 0, armor: 0, neck: 0, ear1: 0, ear2: 0, ring1: 0, ring2: 0 };
    }

    static getRunEnchantBonus(slot: ExpeditionEnchantSlot): number {
        if (!this.isRunEffectsActive()) return 0;
        return Math.max(0, Number(this.state.runEnchantBonus[slot]) || 0);
    }

    static getBaseEnchantLevel(item: unknown): number {
        if (!item || typeof item !== 'object') return 0;
        const row = item as { enchant?: number; enchantArmor?: number; enchantJewel?: number };
        if (row.enchant !== undefined) return Math.max(0, Math.floor(Number(row.enchant) || 0));
        return Math.max(0, Math.floor(Number(row.enchantArmor ?? row.enchantJewel) || 0));
    }

    static getEffectiveRunEnchantLevel(slot: ExpeditionEnchantSlot, item: unknown): number {
        return this.getBaseEnchantLevel(item) + this.getRunEnchantBonus(slot);
    }

    static collectForgeEnchantTargets(): {
        slot: ExpeditionEnchantSlot;
        item: unknown;
        name: string;
        slotLabelKey: string;
    }[] {
        const win = window as any;
        const sec = win.ItemSecurity;
        const targets: ReturnType<typeof ExpeditionEngine.collectForgeEnchantTargets> = [];
        const push = (slot: ExpeditionEnchantSlot, item: unknown, slotLabelKey: string) => {
            if (!item) return;
            if (sec && typeof sec.isValidInstance === 'function' && !sec.isValidInstance(item)) return;
            const base = (item as { base?: { nome?: string }; nome?: string }).base || item;
            const name = (base as { nome?: string }).nome || '?';
            targets.push({ slot, item, name, slotLabelKey });
        };
        push('weapon', win.armaEquipadaBase, 'game.hunt.expedition.forgeSlotWeapon');
        push('armor', win.armaduraEquipada, 'game.hunt.expedition.forgeSlotArmor');
        push('neck', win.colarEquipado, 'game.hunt.expedition.forgeSlotNeck');
        push('ear1', win.brincoEquipado1, 'game.hunt.expedition.forgeSlotEar');
        push('ear2', win.brincoEquipado2, 'game.hunt.expedition.forgeSlotEar');
        push('ring1', win.anelEquipado1, 'game.hunt.expedition.forgeSlotRing');
        push('ring2', win.anelEquipado2, 'game.hunt.expedition.forgeSlotRing');
        return targets;
    }

    static applyRandomForgeEnchant():
        | { ok: true; slot: ExpeditionEnchantSlot; itemName: string; slotLabel: string; before: number; after: number }
        | { ok: false; reason: 'no_gear' | 'max_enchant' } {
        const targets = this.collectForgeEnchantTargets();
        const eligible = targets.filter((t) => this.getEffectiveRunEnchantLevel(t.slot, t.item) < 25);
        if (eligible.length === 0) {
            return { ok: false, reason: targets.length === 0 ? 'no_gear' : 'max_enchant' };
        }
        const pick = eligible[Math.floor(Math.random() * eligible.length)];
        const before = this.getEffectiveRunEnchantLevel(pick.slot, pick.item);
        this.state.runEnchantBonus[pick.slot] += 1;
        return {
            ok: true,
            slot: pick.slot,
            itemName: pick.name,
            slotLabel: this.t(pick.slotLabelKey, pick.slot),
            before,
            after: before + 1
        };
    }

    static buildRunEnchantChipsHtml(): string {
        const en = this.state.runEnchantBonus;
        const chips: string[] = [];
        const add = (value: number, icon: string, label: string) => {
            if (value > 0) chips.push(`${icon} +${value} ${label}`);
        };
        add(en.weapon, '⚔️', this.t('game.hunt.expedition.runEnchantWeaponShort', 'Wpn'));
        add(en.armor, '🛡️', this.t('game.hunt.expedition.runEnchantArmorShort', 'Armor'));
        add(en.neck, '💎', this.t('game.hunt.expedition.runEnchantNeckShort', 'Neck'));
        add(en.ear1 + en.ear2, '👂', this.t('game.hunt.expedition.runEnchantEarShort', 'Ear'));
        add(en.ring1 + en.ring2, '💍', this.t('game.hunt.expedition.runEnchantRingShort', 'Ring'));
        return chips
            .map((c) => `<span class="expedition-run-buffs__chip expedition-run-buffs__chip--forge">${c}</span>`)
            .join('');
    }

    static buildRunEnchantSummaryText(): string {
        const en = this.state.runEnchantBonus;
        const parts: string[] = [];
        const add = (value: number, label: string) => {
            if (value > 0) parts.push(`+${value} ${label}`);
        };
        add(en.weapon, this.t('game.hunt.expedition.runEnchantWeaponShort', 'Wpn'));
        add(en.armor, this.t('game.hunt.expedition.runEnchantArmorShort', 'Armor'));
        add(en.neck, this.t('game.hunt.expedition.runEnchantNeckShort', 'Neck'));
        const earTotal = en.ear1 + en.ear2;
        if (earTotal > 0) add(earTotal, this.t('game.hunt.expedition.runEnchantEarShort', 'Ear'));
        const ringTotal = en.ring1 + en.ring2;
        if (ringTotal > 0) add(ringTotal, this.t('game.hunt.expedition.runEnchantRingShort', 'Ring'));
        if (!parts.length) return '';
        return this.t('game.hunt.expedition.extractSummaryForge', 'Forge: {items}', { items: parts.join(', ') });
    }

    static t(key: string, fallback: string, params?: Record<string, string | number>): string {
        const win = window as any;
        let msg = fallback;
        if (typeof win.t === 'function') {
            const translated = win.t(key, params);
            if (translated && translated !== key) msg = translated;
        }
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                msg = msg.replace(`{${k}}`, String(v));
            }
        }
        return msg;
    }

    static getZoneRewardRate(): number {
        return ZONE_REWARD_RATE[this.state.zoneId] ?? ZONE_REWARD_RATE['No-Grade'];
    }

    /** Loot bonus from journey depth (+rate% per journey after the first). Capped at +100%. */
    static getJourneyRewardMult(): number {
        const rate = this.getZoneRewardRate();
        const bonus = rate * Math.max(0, this.state.journey - 1);
        return Math.min(2, 1 + bonus);
    }

    /** Roguelike curve: HP ramps gently so early journeys stay learnable. */
    static getJourneyMobHpScale(): number {
        const j = Math.max(1, Math.floor(Number(this.state.journey) || 1));
        const HP_START = 0.74;
        const HP_STEP = 0.085;
        return HP_START + (j - 1) * HP_STEP;
    }

    /** ATK ramps faster — mobs must threaten HP and potions without one-shots. */
    static getJourneyMobAtkScale(): number {
        const j = Math.max(1, Math.floor(Number(this.state.journey) || 1));
        const ATK_START = 1.05;
        const ATK_STEP = 0.095;
        return ATK_START + (j - 1) * ATK_STEP;
    }

    /** UI chip + def scaling reference (weighted toward felt threat). */
    static getJourneyMobScale(): number {
        const hp = this.getJourneyMobHpScale();
        const atk = this.getJourneyMobAtkScale();
        return hp * 0.35 + atk * 0.65;
    }

    /** Champion bonus (HP/ATK above normal mob) scales with journey — weak mini-champs early, full power late run. */
    static getJourneyChampionPowerScale(): number {
        const j = Math.max(1, Math.floor(Number(this.state.journey) || 1));
        const CHAMP_START = 0.34;
        const CHAMP_STEP = 0.075;
        return Math.min(1, CHAMP_START + (j - 1) * CHAMP_STEP);
    }

    static getTraitLabel(trait: JourneyMobTrait): string {
        return this.t(`game.hunt.expedition.trait_${trait}`, trait);
    }

    static rollJourneyTrait(): JourneyMobTrait {
        return JOURNEY_TRAITS[Math.floor(Math.random() * JOURNEY_TRAITS.length)];
    }

    static isMilestoneBossJourney(journey: number): boolean {
        return journey > 0 && journey % 10 === 0;
    }

    static rollRareEventJourney(): number {
        const candidates: number[] = [];
        for (let j = 3; j <= 39; j++) {
            if (j % 10 !== 0) candidates.push(j);
        }
        return candidates[Math.floor(Math.random() * candidates.length)] || 7;
    }

    static rollRareEventType(): ExpeditionRareEventType {
        return RARE_EVENT_TYPES[Math.floor(Math.random() * RARE_EVENT_TYPES.length)];
    }

    static shuffle<T>(arr: T[]): T[] {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    static isCombatPathType(type: ExpeditionPathType): boolean {
        return type === 'combat' || type === 'elite' || type === 'boss';
    }

    /** Fight-only cards after skipping combat on the previous journey. */
    static buildCombatOnlyPathChoices(journey: number): ExpeditionPathChoice[] {
        if (journey < 2) {
            return this.shuffle([
                { id: `j${journey}_combat`, type: 'combat' },
                { id: `j${journey}_elite`, type: 'elite' }
            ]);
        }

        const slotA: ExpeditionPathType = 'combat';
        const slotB: ExpeditionPathType = Math.random() < 0.55 ? 'elite' : 'combat';
        let slotC: ExpeditionPathType = Math.random() < 0.45 ? 'elite' : 'combat';
        if (journey >= 3 && Math.random() < 0.28) slotC = 'boss';

        const types = this.shuffle([slotA, slotB, slotC]);
        return types.map((type, i) => ({ id: `j${journey}_fight_${i}_${type}`, type }));
    }

    /** Weighted pick for the third “safe” path slot. J1 = prep routes only; chest/merchant from J2+. */
    static pickSafePathType(journey: number): ExpeditionPathType {
        let types: ExpeditionPathType[];
        let weights: number[];

        if (journey < 2) {
            types = ['patrol', 'tracks', 'forge', 'scout', 'warhorn', 'ambush'];
            weights = [22, 20, 18, 16, 14, 10];
        } else if (journey < 5) {
            types = ['chest', 'merchant', 'forge', 'scout', 'patrol', 'ambush', 'tracks', 'warhorn'];
            weights = [30, 22, 14, 12, 10, 6, 4, 2];
        } else {
            types = ['chest', 'merchant', 'forge', 'scout', 'patrol', 'ambush', 'tracks', 'warhorn'];
            weights = [26, 18, 12, 12, 10, 8, 8, 6];
        }

        const total = weights.reduce((a, b) => a + b, 0);
        let roll = Math.random() * total;
        for (let i = 0; i < types.length; i++) {
            roll -= weights[i];
            if (roll <= 0) return types[i];
        }
        return types[types.length - 1];
    }

    static rollRandomRunStat(): keyof ExpeditionRunBuffs {
        const statKeys: (keyof ExpeditionRunBuffs)[] = [
            'pAtkPct', 'mAtkPct', 'pDefPct', 'mDefPct', 'critRatePct', 'atkSpeedPct', 'maxHpPct',
            'poisonResPct', 'bleedResPct', 'hpRegenPct', 'mpRegenPct', 'mpCostReductionPct', 'skillCdReductionPct'
        ];
        return statKeys[Math.floor(Math.random() * statKeys.length)];
    }

    /** Prefer a run stat that still advances an incomplete build; else random. */
    static pickMerchantPactStat(): keyof ExpeditionRunBuffs {
        const needed: (keyof ExpeditionRunBuffs)[] = [];
        for (const def of RUN_BUILDS) {
            if (this.isBuildUnlocked(def.id)) continue;
            for (const req of def.requirements) {
                if (req.kind === 'stat') {
                    if (this.getCardBuffPct(req.stat) < req.minPct) needed.push(req.stat);
                } else {
                    const best = Math.max(...req.stats.map((s) => this.getCardBuffPct(s)));
                    if (best < req.minPct) needed.push(...req.stats);
                }
            }
        }
        if (needed.length) return needed[Math.floor(Math.random() * needed.length)];
        return this.rollRandomRunStat();
    }

    static getBagAdena(): number {
        return Math.max(0, Math.floor(Number(this.state.bag?.adenas) || 0));
    }

    /** Debit expedition bag Adena. Returns false if not enough. */
    static spendBagAdena(amount: number): boolean {
        const cost = Math.max(0, Math.floor(Number(amount) || 0));
        if (cost <= 0) return true;
        if (this.getBagAdena() < cost) return false;
        this.state.bag.adenas -= cost;
        return true;
    }

    /** Cost = max(min, floor(bag * pct)). */
    static bagPctCost(pct: number, minCost: number): number {
        return Math.max(minCost, Math.floor(this.getBagAdena() * pct));
    }

    static resetNodeModalToPreviewMode(): void {
        this._offerMode = false;
        this._pendingOffers = [];
        this._pendingOfferHandler = null;
        this._offerPickLocked = false;
        const offersEl = document.getElementById('exp-node-offers');
        const outcomesWrap = document.getElementById('exp-node-outcomes-wrap');
        const tagsEl = document.getElementById('exp-node-tags');
        const enterBtn = document.getElementById('exp-node-enter');
        const cancelBtn = document.getElementById('exp-node-cancel');
        if (offersEl) {
            offersEl.style.display = 'none';
            offersEl.innerHTML = '';
        }
        if (outcomesWrap) outcomesWrap.style.display = '';
        if (tagsEl) tagsEl.style.display = '';
        if (enterBtn) enterBtn.style.display = '';
        if (cancelBtn) cancelBtn.style.display = '';
    }

    static showOfferModal(opts: {
        icon: string;
        title: string;
        desc: string;
        toneClass?: string;
        offers: ExpeditionOffer[];
        onPick: (id: string) => void;
    }): void {
        const win = window as any;
        this._offerMode = true;
        this._offerPickLocked = false;
        this._pendingOffers = opts.offers.slice();
        this._pendingOfferHandler = opts.onPick;

        const titleEl = document.getElementById('exp-node-title');
        const iconWrap = document.getElementById('exp-node-icon-wrap');
        const iconEl = document.getElementById('exp-node-icon');
        const descEl = document.getElementById('exp-node-desc');
        const offersEl = document.getElementById('exp-node-offers');
        const outcomesWrap = document.getElementById('exp-node-outcomes-wrap');
        const tagsEl = document.getElementById('exp-node-tags');
        const enterBtn = document.getElementById('exp-node-enter');
        const cancelBtn = document.getElementById('exp-node-cancel');

        if (titleEl) titleEl.innerText = opts.title;
        if (iconEl) iconEl.innerText = opts.icon;
        if (iconWrap) {
            iconWrap.className = `exp-node-icon-wrap exp-node-icon-wrap--${opts.toneClass || 'merchant'}`;
        }
        if (descEl) descEl.innerText = opts.desc;
        if (outcomesWrap) outcomesWrap.style.display = 'none';
        if (tagsEl) {
            tagsEl.style.display = 'none';
            tagsEl.innerHTML = '';
        }
        if (enterBtn) enterBtn.style.display = 'none';
        if (cancelBtn) cancelBtn.style.display = 'none';

        if (offersEl) {
            const bag = this.getBagAdena();
            offersEl.style.display = 'grid';
            offersEl.innerHTML = opts.offers.map((offer) => {
                const cost = Math.max(0, Math.floor(Number(offer.costAdena) || 0));
                const cannotAfford = cost > 0 && bag < cost;
                const title = this.t(offer.titleKey, offer.titleFallback, offer.descParams || {});
                const desc = this.t(offer.descKey, offer.descFallback, offer.descParams || {});
                const costHtml = cost > 0
                    ? (cannotAfford
                        ? `<span class="exp-offer-card__cost exp-offer-card__cost--need">${this.t('game.hunt.expedition.offerNeedAdena', 'Need {n} Adena', { n: cost.toLocaleString() })}</span>`
                        : `<span class="exp-offer-card__cost">${this.t('game.hunt.expedition.offerCostAdena', 'Cost {n} Adena', { n: cost.toLocaleString() })}</span>`)
                    : `<span class="exp-offer-card__cost exp-offer-card__cost--free">${this.t('game.hunt.expedition.offerFree', 'Free')}</span>`;
                return `<button type="button" class="exp-offer-card${cannotAfford ? ' exp-offer-card--disabled' : ''}" ${cannotAfford ? 'disabled' : ''} onclick="ExpeditionEngine.pickOffer('${offer.id}')">
                    <span class="exp-offer-card__icon" aria-hidden="true">${offer.icon}</span>
                    <span class="exp-offer-card__title">${title}</span>
                    <span class="exp-offer-card__desc">${desc}</span>
                    ${costHtml}
                </button>`;
            }).join('');
        }

        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-node', 1600);
            const body = document.querySelector('.expedition-node-body') as HTMLElement | null;
            if (body) body.scrollTop = 0;
        }
    }

    static pickOffer(id: string): void {
        if (!this._offerMode || this._offerPickLocked) return;
        const offer = this._pendingOffers.find((o) => o.id === id);
        const handler = this._pendingOfferHandler;
        if (!offer || !handler) return;
        const cost = Math.max(0, Math.floor(Number(offer.costAdena) || 0));
        if (cost > 0 && this.getBagAdena() < cost) return;
        this._offerPickLocked = true;
        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-node');
        this.resetNodeModalToPreviewMode();
        handler(id);
    }

    static runStatLabel(stat: keyof ExpeditionRunBuffs): string {
        const labels: Record<keyof ExpeditionRunBuffs, [string, string]> = {
            pAtkPct: ['game.hunt.expedition.runStatPatk', 'P.Atk'],
            mAtkPct: ['game.hunt.expedition.runStatMatk', 'M.Atk'],
            pDefPct: ['game.hunt.expedition.runStatPdef', 'P.Def'],
            mDefPct: ['game.hunt.expedition.runStatMdef', 'M.Def'],
            critRatePct: ['game.hunt.expedition.runStatCrit', 'Crit'],
            atkSpeedPct: ['game.hunt.expedition.runStatSpd', 'Spd'],
            maxHpPct: ['game.hunt.expedition.runStatHp', 'HP'],
            poisonResPct: ['game.hunt.expedition.runStatPoisonRes', 'Poison res'],
            bleedResPct: ['game.hunt.expedition.runStatBleedRes', 'Bleed res'],
            hpRegenPct: ['game.hunt.expedition.runStatHpRegen', 'HP regen'],
            mpRegenPct: ['game.hunt.expedition.runStatMpRegen', 'MP regen'],
            mpCostReductionPct: ['game.hunt.expedition.runStatMpEfficiency', 'MP cost'],
            skillCdReductionPct: ['game.hunt.expedition.runStatSkillCdr', 'Skill CD']
        };
        const [key, fb] = labels[stat];
        return this.t(key, fb);
    }

    /** Stats that display as reductions (−%) on chips / cards. */
    static isNegativeRunBuffStat(stat: keyof ExpeditionRunBuffs): boolean {
        return stat === 'poisonResPct'
            || stat === 'bleedResPct'
            || stat === 'mpCostReductionPct'
            || stat === 'skillCdReductionPct';
    }

    /** Three path cards per journey — fight routes vs safe loot. Journey 10/20/… = mandatory boss gate. */
    static generatePathChoices(journey: number): ExpeditionPathChoice[] {
        if (this.isMilestoneBossJourney(journey)) {
            this.state.combatOnlyThisJourney = false;
            this.state.pathBiasThisJourney = null;
            // Milestone boss ignores pending scout/tracks intel
            this.state.nextPathBias = null;
            this.state.nextPathGuarantee = null;
            return [{ id: `j${journey}_milestone_boss`, type: 'boss' }];
        }

        if (this.state.combatOnlyNextJourney) {
            this.state.combatOnlyNextJourney = false;
            this.state.combatOnlyThisJourney = true;
            this.state.pathBiasThisJourney = null;
            // Forced fight-only journey ignores scout/tracks foresight
            this.state.nextPathBias = null;
            this.state.nextPathGuarantee = null;
            return this.buildCombatOnlyPathChoices(journey);
        }

        this.state.combatOnlyThisJourney = false;

        if (journey < 2) {
            this.state.pathBiasThisJourney = null;
            return this.shuffle([
                { id: `j${journey}_combat`, type: 'combat' },
                { id: `j${journey}_elite`, type: 'elite' }
            ]);
        }

        const bias = this.state.nextPathBias;
        const guarantee = this.state.nextPathGuarantee;
        this.state.nextPathBias = null;
        this.state.nextPathGuarantee = null;
        this.state.pathBiasThisJourney = bias;

        let types: ExpeditionPathType[];
        if (bias === 'safe') {
            const fightSlot: ExpeditionPathType = Math.random() < 0.4 ? 'elite' : 'combat';
            let safeA = this.pickSafePathType(journey);
            let safeB = this.pickSafePathType(journey);
            let guard = 0;
            while (safeB === safeA && guard < 8) {
                safeB = this.pickSafePathType(journey);
                guard += 1;
            }
            types = this.shuffle([fightSlot, safeA, safeB]);
        } else if (bias === 'fight') {
            const slotA: ExpeditionPathType = Math.random() < 0.55 ? 'elite' : 'combat';
            let slotB: ExpeditionPathType = Math.random() < 0.5 ? 'elite' : 'combat';
            if (journey >= 3 && Math.random() < 0.4) slotB = 'boss';
            const slotC = this.pickSafePathType(journey);
            types = this.shuffle([slotA, slotB, slotC]);
        } else {
            const slotA: ExpeditionPathType = journey >= 5 && Math.random() < 0.35 ? 'elite' : 'combat';
            const slotB: ExpeditionPathType = journey >= 3 && Math.random() < 0.28
                ? 'boss'
                : (Math.random() < 0.4 ? 'elite' : 'combat');
            const slotC = this.pickSafePathType(journey);
            types = this.shuffle([slotA, slotB, slotC]);
        }

        if (guarantee && types.indexOf(guarantee) < 0) {
            types = this.injectPathGuarantee(types, guarantee);
        }

        return types.map((type, i) => ({ id: `j${journey}_${i}_${type}`, type }));
    }

    /** Replace one slot so `guarantee` appears among the three path types. */
    static injectPathGuarantee(types: ExpeditionPathType[], guarantee: ExpeditionPathType): ExpeditionPathType[] {
        const out = types.slice();
        if (out.indexOf(guarantee) >= 0) return out;
        const combatIdx = out.findIndex((t) => this.isCombatPathType(t));
        const safeIdx = out.findIndex((t) => !this.isCombatPathType(t));
        let replaceAt = 0;
        if (this.isCombatPathType(guarantee) && combatIdx >= 0) replaceAt = combatIdx;
        else if (!this.isCombatPathType(guarantee) && safeIdx >= 0) replaceAt = safeIdx;
        else replaceAt = Math.floor(Math.random() * out.length);
        out[replaceAt] = guarantee;
        return out;
    }

    static rollTracksPathGuarantee(journey: number): ExpeditionPathType {
        const safePool: ExpeditionPathType[] = journey < 2
            ? ['patrol', 'tracks', 'forge', 'scout', 'warhorn']
            : ['chest', 'merchant', 'forge', 'scout', 'patrol', 'tracks', 'warhorn'];
        if (Math.random() < 0.28 && journey >= 2) {
            return Math.random() < 0.55 ? 'elite' : 'combat';
        }
        return safePool[Math.floor(Math.random() * safePool.length)];
    }

    static pathTypeLabel(type: ExpeditionPathType): string {
        return this.getPathMeta(type).label;
    }

    static refreshJourneyPhase() {
        if (!this.state.rareEventUsed && this.state.journey === this.state.rareEventJourney) {
            this.state.pendingRareEvent = true;
            this.state.rareEventType = this.rollRareEventType();
            this.state.runPanelTab = 'path';
        } else {
            this.state.pendingRareEvent = false;
        }
        this.state.pathChoices = this.generatePathChoices(this.state.journey);
    }

    static getPathMeta(type: ExpeditionPathType) {
        const icons: Record<ExpeditionPathType, string> = {
            combat: '⚔️',
            boss: '👹',
            chest: '🎁',
            elite: '💀',
            merchant: '🧳',
            forge: '🔨',
            scout: '🔭',
            patrol: '🚶',
            tracks: '👣',
            warhorn: '📯',
            ambush: '🌿'
        };
        const labelKeys: Record<ExpeditionPathType, string> = {
            combat: 'game.hunt.expedition.pathLabelCombat',
            boss: 'game.hunt.expedition.pathLabelBoss',
            chest: 'game.hunt.expedition.pathLabelChest',
            elite: 'game.hunt.expedition.pathLabelElite',
            merchant: 'game.hunt.expedition.pathLabelMerchant',
            forge: 'game.hunt.expedition.pathLabelForge',
            scout: 'game.hunt.expedition.pathLabelScout',
            patrol: 'game.hunt.expedition.pathLabelPatrol',
            tracks: 'game.hunt.expedition.pathLabelTracks',
            warhorn: 'game.hunt.expedition.pathLabelWarhorn',
            ambush: 'game.hunt.expedition.pathLabelAmbush'
        };
        const fallbacks: Record<ExpeditionPathType, string> = {
            combat: 'Fight',
            boss: 'Boss',
            chest: 'Chest',
            elite: 'Elite',
            merchant: 'Merchant',
            forge: 'Forge',
            scout: 'Scout',
            patrol: 'Patrol',
            tracks: 'Tracks',
            warhorn: 'Warhorn',
            ambush: 'Ambush'
        };
        return {
            icon: icons[type],
            label: this.t(labelKeys[type], fallbacks[type])
        };
    }

    static getPathPreview(type: ExpeditionPathType) {
        if (type === 'merchant') {
            return {
                icon: '🧳',
                title: this.t('game.hunt.expedition.nodeMerchantTitle', 'Wandering Merchant'),
                desc: this.t('game.hunt.expedition.nodeMerchantDesc', ''),
                outcomes: [
                    this.t('game.hunt.expedition.nodeMerchantOutcome1', ''),
                    this.t('game.hunt.expedition.nodeMerchantOutcome2', ''),
                    this.t('game.hunt.expedition.nodeMerchantOutcome3', '')
                ].filter((o, i) => o && o !== `game.hunt.expedition.nodeMerchantOutcome${i + 1}`),
                tags: [
                    { text: this.t('game.hunt.expedition.nodeMerchantTagSafe', 'No combat'), cls: 'exp-node-tag--safe' as const },
                    { text: this.t('game.hunt.expedition.nodeMerchantTagReward', 'Random aid'), cls: 'exp-node-tag--reward' as const }
                ]
            };
        }

        const base = `game.hunt.expedition.path${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        const meta = this.getPathMeta(type);
        const grantsUpgrade = type === 'combat' || type === 'boss' || type === 'elite';
        return {
            icon: meta.icon,
            title: this.t(`${base}Title`, meta.label),
            desc: this.t(`${base}Desc`, ''),
            outcomes: [
                this.t(`${base}Outcome1`, ''),
                this.t(`${base}Outcome2`, ''),
                this.t(`${base}Outcome3`, '')
            ].filter((o, i) => o && o !== `${base}Outcome${i + 1}`),
            tags: [
                grantsUpgrade
                    ? { text: this.t('game.hunt.expedition.pathTagUpgrade', 'Grants upgrade card'), cls: 'exp-node-tag--reward' as const }
                    : { text: this.t('game.hunt.expedition.pathTagNoUpgrade', 'No upgrade — safe trail only'), cls: 'exp-node-tag--safe' as const },
                { text: this.t('game.hunt.expedition.pathTagEscalate', 'Next journey scales enemies'), cls: 'exp-node-tag--risk' as const }
            ]
        };
    }

    static getRunBuffMults(): { pAtk: number; mAtk: number; pDef: number; mDef: number; crit: number; atkSpeed: number; maxHp: number } {
        return {
            pAtk: 1 + this.getCombinedBuffPct('pAtkPct') / 100,
            mAtk: 1 + this.getCombinedBuffPct('mAtkPct') / 100,
            pDef: 1 + this.getCombinedBuffPct('pDefPct') / 100,
            mDef: 1 + this.getCombinedBuffPct('mDefPct') / 100,
            crit: 1 + this.getCombinedBuffPct('critRatePct') / 100,
            atkSpeed: Math.max(0.5, 1 - this.getCombinedBuffPct('atkSpeedPct') / 100),
            maxHp: 1 + this.getCombinedBuffPct('maxHpPct') / 100
        };
    }

    static applyRunBuffsToPlayerStats(): void {
        if (!this.isRunEffectsActive()) return;
        const win = window as any;
        const ps = win.playerStats;
        if (!ps) return;
        const buffed = this.computeRunBuffedStats({
            pAtk: ps.pAtk,
            mAtk: ps.mAtk,
            pDef: ps.pDef,
            mDef: ps.mDef,
            critRate: ps.critRate,
            atkSpeed: ps.atkSpeed,
            maxHp: ps.maxHp
        });
        const oldMax = ps.maxHp;
        ps.pAtk = buffed.pAtk;
        ps.mAtk = buffed.mAtk;
        ps.pDef = buffed.pDef;
        ps.mDef = buffed.mDef;
        ps.critRate = buffed.critRate;
        ps.atkSpeed = buffed.atkSpeed;
        ps.maxHp = buffed.maxHp;
        if (typeof win.playerHP === 'number' && oldMax > 0) {
            const scaled = Math.floor(win.playerHP * (ps.maxHp / oldMax));
            win.playerHP = Math.max(1, Math.min(ps.maxHp, scaled));
        } else if (!Number.isFinite(win.playerHP) || win.playerHP <= 0) {
            win.playerHP = ps.maxHp;
        }
    }

    static computeRunBuffedStats(base: {
        pAtk: number;
        mAtk: number;
        pDef: number;
        mDef: number;
        critRate: number;
        atkSpeed: number;
        maxHp: number;
    }) {
        const win = window as any;
        const m = this.getRunBuffMults();
        return {
            pAtk: Math.floor(base.pAtk * m.pAtk),
            mAtk: Math.floor(base.mAtk * m.mAtk),
            pDef: Math.floor(base.pDef * m.pDef),
            mDef: Math.floor(base.mDef * m.mDef),
            critRate: typeof win.applyCritRateCap === 'function'
                ? win.applyCritRateCap(Math.floor(base.critRate * m.crit))
                : Math.min(70, Math.floor(base.critRate * m.crit)),
            atkSpeed: Math.max(250, Math.floor(base.atkSpeed * m.atkSpeed)),
            maxHp: Math.floor(base.maxHp * m.maxHp)
        };
    }

    static getUpgradeStatSnapshot(): {
        base: { pAtk: number; mAtk: number; pDef: number; mDef: number; critRate: number; atkSpeed: number; maxHp: number };
        total: { pAtk: number; mAtk: number; pDef: number; mDef: number; critRate: number; atkSpeed: number; maxHp: number };
    } {
        const win = window as any;
        this._skipRunBuffApply = true;
        try {
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        } finally {
            this._skipRunBuffApply = false;
        }
        const ps = win.playerStats || {};
        const base = {
            pAtk: Math.floor(Number(ps.pAtk) || 0),
            mAtk: Math.floor(Number(ps.mAtk) || 0),
            pDef: Math.floor(Number(ps.pDef) || 0),
            mDef: Math.floor(Number(ps.mDef) || 0),
            critRate: Math.floor(Number(ps.critRate) || 0),
            atkSpeed: Math.floor(Number(ps.atkSpeed) || 0),
            maxHp: Math.floor(Number(ps.maxHp) || 0)
        };
        return {
            base,
            total: this.computeRunBuffedStats(base)
        };
    }

    static formatStatBonusText(bonus: number): string {
        if (!bonus) return '';
        const sign = bonus > 0 ? '+' : '−';
        return `${sign} ${Math.abs(bonus).toLocaleString()}`;
    }

    static buildRunStatsTableHtml(): string {
        const { base, total } = this.getUpgradeStatSnapshot();
        const colBase = this.t('game.hunt.expedition.runStatsColBase', 'Base');
        const colRun = this.t('game.hunt.expedition.runStatsColRun', 'Run');
        const colTotal = this.t('game.hunt.expedition.runStatsColTotal', 'Total');
        const groupOffense = this.t('game.hunt.expedition.runStatsGroupOffense', 'Offense');
        const groupDefense = this.t('game.hunt.expedition.runStatsGroupDefense', 'Defense');
        const legend = this.t(
            'game.hunt.expedition.runStatsLegend',
            'White = your character · Green = run bonus · Gold = total in combat'
        );

        const offenseRows = [
            { label: this.t('game.hunt.expedition.upgradeStatPatk', 'P.Atk'), baseVal: base.pAtk, totalVal: total.pAtk },
            { label: this.t('game.hunt.expedition.upgradeStatMatk', 'M.Atk'), baseVal: base.mAtk, totalVal: total.mAtk },
            { label: this.t('game.hunt.expedition.upgradeStatCrit', 'Crit'), baseVal: base.critRate, totalVal: total.critRate },
            { label: this.t('game.hunt.expedition.upgradeStatSpd', 'Atk Spd'), baseVal: base.atkSpeed, totalVal: total.atkSpeed }
        ];
        const defenseRows = [
            { label: this.t('game.hunt.expedition.upgradeStatPdef', 'P.Def'), baseVal: base.pDef, totalVal: total.pDef },
            { label: this.t('game.hunt.expedition.upgradeStatMdef', 'M.Def'), baseVal: base.mDef, totalVal: total.mDef },
            { label: this.t('game.hunt.expedition.upgradeStatHp', 'Max HP'), baseVal: base.maxHp, totalVal: total.maxHp }
        ];

        const renderRow = (row: { label: string; baseVal: number; totalVal: number; noRunBuff?: boolean }) => {
            const bonus = row.noRunBuff ? 0 : row.totalVal - row.baseVal;
            const runHtml = row.noRunBuff || bonus <= 0
                ? `<span class="exp-run-stat-row__run exp-run-stat-row__run--na" aria-hidden="true">—</span>`
                : `<span class="exp-run-stat-row__run">+${bonus.toLocaleString()}</span>`;
            const totalVal = row.noRunBuff ? row.baseVal : row.totalVal;
            const totalClass = bonus > 0 && !row.noRunBuff
                ? 'exp-run-stat-row__total exp-run-stat-row__total--buffed'
                : 'exp-run-stat-row__total';
            return `<div class="exp-run-stat-row">
                <span class="exp-run-stat-row__label">${row.label}</span>
                <span class="exp-run-stat-row__base">${row.baseVal.toLocaleString()}</span>
                ${runHtml}
                <span class="${totalClass}">${totalVal.toLocaleString()}</span>
            </div>`;
        };

        return `<div class="exp-run-stats-table">
            <p class="exp-run-stats-legend">${legend}</p>
            <div class="exp-run-stats-table__head" aria-hidden="true">
                <span class="exp-run-stats-table__head-stat"></span>
                <span>${colBase}</span>
                <span>${colRun}</span>
                <span>${colTotal}</span>
            </div>
            <div class="exp-run-stats-table__group">${groupOffense}</div>
            ${offenseRows.map(renderRow).join('')}
            <div class="exp-run-stats-table__group">${groupDefense}</div>
            ${defenseRows.map(renderRow).join('')}
        </div>`;
    }

    static buildRunUpgradesChipsHtml(): string {
        const chips: string[] = [];
        const b = this.state.runBuffs;
        const pctLines: [keyof ExpeditionRunBuffs, string, 'offense' | 'defense' | 'resist' | 'regen'][] = [
            ['pAtkPct', '⚔️', 'offense'],
            ['mAtkPct', '✨', 'offense'],
            ['critRatePct', '🎯', 'offense'],
            ['atkSpeedPct', '💨', 'offense'],
            ['skillCdReductionPct', '⏱️', 'offense'],
            ['pDefPct', '🛡️', 'defense'],
            ['mDefPct', '🔮', 'defense'],
            ['maxHpPct', '❤️', 'defense'],
            ['hpRegenPct', '💚', 'regen'],
            ['mpRegenPct', '💙', 'regen'],
            ['poisonResPct', '☠️', 'resist'],
            ['bleedResPct', '🩸', 'resist'],
            ['mpCostReductionPct', '🔷', 'resist']
        ];
        for (const [stat, icon, tone] of pctLines) {
            const cardVal = Math.max(0, Math.floor(Number(b[stat]) || 0));
            const buildVal = Math.max(0, Math.floor(Number(this.state.buildBonusBuffs?.[stat]) || 0));
            const val = cardVal + buildVal;
            if (!val) continue;
            const isRes = this.isNegativeRunBuffStat(stat);
            const valText = `${isRes ? '−' : '+'}${val}%`;
            const buildMark = buildVal > 0
                ? `<span class="exp-run-upgrade-chip__build" title="${this.t('game.hunt.expedition.buildChipFromBuilds', '+{n}% from builds', { n: buildVal })}">★</span>`
                : '';
            chips.push(`<span class="exp-run-upgrade-chip exp-run-upgrade-chip--${tone}${buildVal > 0 ? ' exp-run-upgrade-chip--has-build' : ''}">
                <span class="exp-run-upgrade-chip__icon" aria-hidden="true">${icon}</span>
                <span class="exp-run-upgrade-chip__val">${valText}${buildMark}</span>
                <span class="exp-run-upgrade-chip__label">${this.runStatLabel(stat)}</span>
            </span>`);
        }
        const en = this.state.runEnchantBonus;
        const addForge = (value: number, icon: string, label: string) => {
            if (value > 0) {
                chips.push(`<span class="exp-run-upgrade-chip exp-run-upgrade-chip--forge">
                    <span class="exp-run-upgrade-chip__icon" aria-hidden="true">${icon}</span>
                    <span class="exp-run-upgrade-chip__val">+${value}</span>
                    <span class="exp-run-upgrade-chip__label">${label}</span>
                </span>`);
            }
        };
        addForge(en.weapon, '⚔️', this.t('game.hunt.expedition.runEnchantWeaponShort', 'Wpn'));
        addForge(en.armor, '🛡️', this.t('game.hunt.expedition.runEnchantArmorShort', 'Armor'));
        addForge(en.neck, '💎', this.t('game.hunt.expedition.runEnchantNeckShort', 'Neck'));
        const earTotal = en.ear1 + en.ear2;
        if (earTotal > 0) addForge(earTotal, '👂', this.t('game.hunt.expedition.runEnchantEarShort', 'Ear'));
        const ringTotal = en.ring1 + en.ring2;
        if (ringTotal > 0) addForge(ringTotal, '💍', this.t('game.hunt.expedition.runEnchantRingShort', 'Ring'));

        if (!chips.length) {
            return `<p class="exp-run-upgrades-empty">${this.t('game.hunt.expedition.runBuffsEmpty', 'No run upgrades yet — win fights to grow stronger.')}</p>`;
        }
        return `<div class="exp-run-upgrade-chips">${chips.join('')}</div>`;
    }

    static buildUpgradeStatsHtml(): string {
        const { base, total } = this.getUpgradeStatSnapshot();
        const rows: { label: string; baseVal: number; bonus?: number; totalOnly?: boolean }[] = [
            { label: this.t('game.hunt.expedition.upgradeStatPatk', 'P.Atk'), baseVal: base.pAtk, bonus: total.pAtk - base.pAtk },
            { label: this.t('game.hunt.expedition.upgradeStatMatk', 'M.Atk'), baseVal: base.mAtk, bonus: total.mAtk - base.mAtk },
            { label: this.t('game.hunt.expedition.upgradeStatPdef', 'P.Def'), baseVal: base.pDef, bonus: total.pDef - base.pDef },
            { label: this.t('game.hunt.expedition.upgradeStatMdef', 'M.Def'), baseVal: base.mDef, bonus: total.mDef - base.mDef },
            { label: this.t('game.hunt.expedition.upgradeStatCrit', 'Crit'), baseVal: base.critRate, bonus: total.critRate - base.critRate },
            { label: this.t('game.hunt.expedition.upgradeStatSpd', 'Atk Spd'), baseVal: base.atkSpeed, bonus: total.atkSpeed - base.atkSpeed },
            { label: this.t('game.hunt.expedition.upgradeStatHp', 'Max HP'), baseVal: base.maxHp, bonus: total.maxHp - base.maxHp }
        ];

        return rows.map((row) => {
            const bonusHtml = !row.totalOnly && row.bonus
                ? `<span class="exp-upgrade-stat__bonus">${this.formatStatBonusText(row.bonus)}</span>`
                : '';
            return `<div class="exp-upgrade-stat">
                <span class="exp-upgrade-stat__label">${row.label}</span>
                <span class="exp-upgrade-stat__values">
                    <span class="exp-upgrade-stat__base">${row.baseVal.toLocaleString()}</span>${bonusHtml}
                </span>
            </div>`;
        }).join('');
    }

    static buildRunUpgradesDetailListHtml(): string {
        const lines: string[] = [];
        const pctLines: [keyof ExpeditionRunBuffs, string][] = [
            ['pAtkPct', '⚔️'],
            ['mAtkPct', '✨'],
            ['pDefPct', '🛡️'],
            ['mDefPct', '🔮'],
            ['critRatePct', '🎯'],
            ['atkSpeedPct', '💨'],
            ['maxHpPct', '❤️'],
            ['hpRegenPct', '💚'],
            ['mpRegenPct', '💙'],
            ['poisonResPct', '☠️'],
            ['bleedResPct', '🩸'],
            ['mpCostReductionPct', '🔷'],
            ['skillCdReductionPct', '⏱️']
        ];
        for (const [stat, icon] of pctLines) {
            const val = this.getCombinedBuffPct(stat);
            if (!val) continue;
            const isRes = this.isNegativeRunBuffStat(stat);
            const buildVal = Math.max(0, Math.floor(Number(this.state.buildBonusBuffs?.[stat]) || 0));
            const buildNote = buildVal > 0 ? ` ★` : '';
            lines.push(`${icon} ${isRes ? '−' : '+'}${val}% ${this.runStatLabel(stat)}${buildNote}`);
        }
        const en = this.state.runEnchantBonus;
        const addForge = (value: number, icon: string, label: string) => {
            if (value > 0) lines.push(`${icon} +${value} ${label}`);
        };
        addForge(en.weapon, '⚔️', this.t('game.hunt.expedition.runEnchantWeaponShort', 'Wpn'));
        addForge(en.armor, '🛡️', this.t('game.hunt.expedition.runEnchantArmorShort', 'Armor'));
        addForge(en.neck, '💎', this.t('game.hunt.expedition.runEnchantNeckShort', 'Neck'));
        const earTotal = en.ear1 + en.ear2;
        if (earTotal > 0) addForge(earTotal, '👂', this.t('game.hunt.expedition.runEnchantEarShort', 'Ear'));
        const ringTotal = en.ring1 + en.ring2;
        if (ringTotal > 0) addForge(ringTotal, '💍', this.t('game.hunt.expedition.runEnchantRingShort', 'Ring'));

        if (!lines.length) {
            return `<p class="exp-upgrade-buff-details__empty">${this.t('game.hunt.expedition.upgradeBuffsEmpty', 'No run upgrades yet — pick a card below.')}</p>`;
        }
        return `<ul class="exp-upgrade-buff-details__list">${lines.map((line) => `<li>${line}</li>`).join('')}</ul>`;
    }

    static setRunPanelTab(tab: ExpeditionRunPanelTab) {
        if (this.state.pendingRareEvent && tab !== 'path') return;
        if (this.state.runPanelTab === tab) return;
        this.state.runPanelTab = tab;
        this.renderMap();
    }

    static buildRunPanelTabsHtml(): string {
        const tabs: { id: ExpeditionRunPanelTab; labelKey: string; fallback: string }[] = [
            { id: 'path', labelKey: 'game.hunt.expedition.runTabPath', fallback: 'Path' },
            { id: 'stats', labelKey: 'game.hunt.expedition.runTabStats', fallback: 'Stats' },
            { id: 'builds', labelKey: 'game.hunt.expedition.runTabBuilds', fallback: 'Builds' },
            { id: 'gear', labelKey: 'game.hunt.expedition.runTabGear', fallback: 'Gear' }
        ];
        const rareLocked = this.state.pendingRareEvent;
        const unlockedN = (this.state.unlockedBuildIds || []).length;
        return `<div class="expedition-run-tabs" role="tablist" aria-label="${this.t('game.hunt.expedition.runTabsLabel', 'Expedition run panels')}">
            ${tabs.map(({ id, labelKey, fallback }) => {
                const active = this.state.runPanelTab === id;
                const disabled = rareLocked && id !== 'path';
                let label = this.t(labelKey, fallback);
                if (id === 'builds' && unlockedN > 0) {
                    label = `${label} ${unlockedN}`;
                }
                return `<button type="button" role="tab" class="expedition-run-tab${active ? ' expedition-run-tab--active' : ''}${disabled ? ' expedition-run-tab--disabled' : ''}${id === 'builds' && unlockedN > 0 ? ' expedition-run-tab--has-builds' : ''}"
                    aria-selected="${active ? 'true' : 'false'}"${disabled ? ' disabled' : ''}
                    onclick="ExpeditionEngine.setRunPanelTab('${id}')">${label}</button>`;
            }).join('')}
        </div>`;
    }

    static buildRunStatsPanelHtml(): string {
        const statsTitle = this.t('game.hunt.expedition.runStatsTitle', 'Combat stats');
        const upgradeCount = (() => {
            let n = 0;
            for (const v of Object.values(this.state.runBuffs)) if (v > 0) n += 1;
            for (const v of Object.values(this.state.runEnchantBonus)) if (v > 0) n += 1;
            return n;
        })();
        const upgradesTitle = this.t(
            'game.hunt.expedition.runUpgradesTitle',
            'Run upgrades ({n})',
            { n: upgradeCount }
        );
        return `<div class="exp-run-stats-panel" role="tabpanel">
            <div class="exp-run-stats-panel__section">
                <div class="exp-run-stats-panel__label">${statsTitle}</div>
                ${this.buildRunStatsTableHtml()}
            </div>
            <div class="exp-run-upgrades-block">
                <div class="exp-run-upgrades-block__label">${upgradesTitle}</div>
                ${this.buildRunUpgradesChipsHtml()}
            </div>
        </div>`;
    }

    static buildRunBuildsPanelHtml(): string {
        const title = this.t('game.hunt.expedition.buildsPanelTitle', 'Run builds');
        const hint = this.t(
            'game.hunt.expedition.buildsPanelHint',
            'Complete as many builds as you can — every unlock stacks. Mastery bonuses kick in at 3, 5, and 7.'
        );
        const unlockedN = (this.state.unlockedBuildIds || []).length;
        const mastery = this.getBuildMasteryTier();
        const statusLine = unlockedN > 0
            ? this.t('game.hunt.expedition.buildsPanelActive', '{n}/{total} unlocked{mastery}', {
                n: unlockedN,
                total: RUN_BUILDS.length,
                mastery: mastery
                    ? ' · ' + this.t(mastery.titleKey, mastery.titleFallback)
                    : ''
            })
            : this.t('game.hunt.expedition.buildsPanelOpen', 'No builds yet — stack the right upgrades to unlock paths.');

        const roles: ExpeditionBuildRole[] = ['offense', 'defense', 'sustain'];
        const sections = roles.map((role) => {
            const defs = RUN_BUILDS.filter((d) => d.role === role).sort((a, b) => a.priority - b.priority);
            const cards = defs.map((def) => {
                const prog = this.getBuildProgress(def);
                const unlocked = this.isBuildUnlocked(def.id);
                const name = this.t(def.titleKey, def.titleFallback);
                const bonus = this.t(def.bonusKey, def.bonusFallback);
                let tone = 'idle';
                let statusKey = 'game.hunt.expedition.buildStatusIdle';
                let statusFb = 'Not started';
                if (unlocked) {
                    tone = 'active';
                    statusKey = 'game.hunt.expedition.buildStatusActive';
                    statusFb = 'Unlocked';
                } else if (prog.partial || prog.met > 0) {
                    tone = 'progress';
                    statusKey = 'game.hunt.expedition.buildStatusProgress';
                    statusFb = 'In progress';
                }
                const status = this.t(statusKey, statusFb);
                const reqRows = def.requirements.map((req) => {
                    const v = this.getBuildReqValues(req);
                    const done = v.cur >= v.minPct;
                    return `<div class="exp-build-card__req${done ? ' exp-build-card__req--done' : ''}">
                        <div class="exp-build-card__req-top">
                            <span class="exp-build-card__req-label">${v.label}</span>
                            <span class="exp-build-card__req-val">${v.cur}/${v.minPct}%</span>
                        </div>
                        <div class="exp-build-card__bar" aria-hidden="true">
                            <span class="exp-build-card__bar-fill" style="width:${v.pct}%"></span>
                        </div>
                    </div>`;
                }).join('');
                return `<article class="exp-build-card exp-build-card--${tone}">
                    <header class="exp-build-card__head">
                        <span class="exp-build-card__icon" aria-hidden="true">${def.icon}</span>
                        <div class="exp-build-card__titles">
                            <span class="exp-build-card__name">${name}</span>
                            <span class="exp-build-card__status">${status}</span>
                        </div>
                        <span class="exp-build-card__chip">${unlocked ? '✓' : prog.chipVal}</span>
                    </header>
                    <div class="exp-build-card__reqs">${reqRows}</div>
                    <p class="exp-build-card__bonus"><strong>${this.t('game.hunt.expedition.buildBonusLabel', 'Bonus')}</strong> ${bonus}</p>
                </article>`;
            }).join('');
            return `<div class="exp-run-builds-panel__group">
                <div class="exp-run-builds-panel__group-label">${this.buildRoleLabel(role)}</div>
                <div class="exp-run-builds-panel__group-list">${cards}</div>
            </div>`;
        }).join('');

        const closest = this.getClosestIncompleteBuild();
        const tipHtml = closest
            ? `<p class="exp-run-builds-panel__tip">${this.t(
                'game.hunt.expedition.buildClosestTip',
                'Closest: {icon} {name} — {progress}',
                {
                    icon: closest.def.icon,
                    name: this.t(closest.def.titleKey, closest.def.titleFallback),
                    progress: closest.prog.label
                }
            )}</p>`
            : '';

        return `<div class="exp-run-builds-panel" role="tabpanel">
            <div class="exp-run-builds-panel__label">${title}</div>
            <p class="exp-run-builds-panel__hint">${hint}</p>
            <p class="exp-run-builds-panel__status">${statusLine}</p>
            ${this.buildMasteryTrackHtml()}
            ${this.buildStackedBonusesHtml()}
            ${tipHtml}
            <div class="exp-run-builds-panel__list">${sections}</div>
        </div>`;
    }

    static buildRunGearRowHtml(
        slot: ExpeditionEnchantSlot,
        item: unknown,
        slotLabelKey: string
    ): string {
        const base = ((item as { base?: { nome?: string; img?: string } }).base || item) as { nome?: string; img?: string };
        const name = base.nome || '?';
        const baseEn = this.getBaseEnchantLevel(item);
        const runBonus = this.getRunEnchantBonus(slot);
        const iconHtml = base.img
            ? `<span class="exp-run-gear-row__icon"><img src="${base.img}" alt="" class="exp-run-gear-row__img" loading="lazy"></span>`
            : `<span class="exp-run-gear-row__icon exp-run-gear-row__icon--empty" aria-hidden="true">◇</span>`;
        const runBonusHtml = runBonus > 0
            ? `<span class="exp-upgrade-stat__bonus">+ ${runBonus}</span>`
            : '';
        const slotLabel = this.t(slotLabelKey, slot);
        return `<div class="exp-run-gear-row">
            ${iconHtml}
            <div class="exp-run-gear-row__body">
                <span class="exp-run-gear-row__slot">${slotLabel}</span>
                <span class="exp-run-gear-row__name">${name}</span>
            </div>
            <span class="exp-run-gear-row__enchant">
                <span class="exp-upgrade-stat__base">+${baseEn}</span>${runBonusHtml}
            </span>
        </div>`;
    }

    static buildRunGearPanelHtml(): string {
        const targets = this.collectForgeEnchantTargets();
        if (!targets.length) {
            return `<div class="exp-run-gear-panel exp-run-gear-panel--empty" role="tabpanel">
                <p class="exp-run-gear-panel__empty">${this.t('game.hunt.expedition.runGearEmpty', 'No equipment equipped.')}</p>
            </div>`;
        }
        const title = this.t('game.hunt.expedition.runGearTitle', 'Equipped this run');
        const hint = this.t('game.hunt.expedition.runGearHint', 'Green +N is temporary forge bonus — lost on extract or death.');
        const rows = targets
            .map((t) => this.buildRunGearRowHtml(t.slot, t.item, t.slotLabelKey))
            .join('');
        return `<div class="exp-run-gear-panel" role="tabpanel">
            <div class="exp-run-gear-panel__label">${title}</div>
            <p class="exp-run-gear-panel__hint">${hint}</p>
            <div class="exp-run-gear-list">${rows}</div>
        </div>`;
    }

    static buildRunPanelContentHtml(journey: number, pickHint: string): string {
        if (this.state.runPanelTab === 'stats') return this.buildRunStatsPanelHtml();
        if (this.state.runPanelTab === 'builds') return this.buildRunBuildsPanelHtml();
        if (this.state.runPanelTab === 'gear') return this.buildRunGearPanelHtml();
        return this.state.pendingRareEvent
            ? this.buildRareEventSectionHtml()
            : this.buildPathSectionHtml(journey, pickHint);
    }

    static refreshRulesDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-rules');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static openRulesModal() {
        const win = window as any;
        this.refreshRulesDom();
        if (typeof win.abrirModal === 'function') win.abrirModal('janela-expedition-rules', 1600);
    }

    static closeRulesModal() {
        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-rules');
    }

    static refreshResultDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-result');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static buildResultLine(label: string, value: string, valClass: string): string {
        return `<div class="exp-result-line"><span>${label}</span><span class="exp-result-line__val ${valClass}">${value}</span></div>`;
    }

    static formatSigned(n: number): string {
        return n >= 0 ? `+${n}` : String(n);
    }

    static showResultModal(result: ExpeditionNodeResult) {
        const win = window as any;
        const titleEl = document.getElementById('exp-result-title');
        const iconWrap = document.getElementById('exp-result-icon-wrap');
        const iconEl = document.getElementById('exp-result-icon');
        const summaryEl = document.getElementById('exp-result-summary');
        const rewardsWrap = document.getElementById('exp-result-rewards-wrap');
        const rewardsEl = document.getElementById('exp-result-rewards');
        const effectsWrap = document.getElementById('exp-result-effects-wrap');
        const effectsEl = document.getElementById('exp-result-effects');

        if (titleEl) titleEl.innerText = this.t(result.titleKey, result.titleFallback, result.summaryParams);
        if (iconEl) iconEl.innerText = result.icon;
        if (iconWrap) iconWrap.className = `exp-result-icon-wrap exp-result-icon-wrap--${result.tone}`;
        if (summaryEl) summaryEl.innerText = this.t(result.summaryKey, result.summaryFallback, result.summaryParams);

        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const labHpRestored = this.t('game.hunt.expedition.resultHpRestored', 'HP restored');
        const labHpLost = this.t('game.hunt.expedition.resultHpLost', 'HP lost');
        const labMpRestored = this.t('game.hunt.expedition.resultMpRestored', 'MP restored');
        const labBagAdenaLost = this.t('game.hunt.expedition.resultBagAdenaLost', 'Bag Adena lost');

        let rewardsHtml = '';
        const bag = result.bag;
        if (bag) {
            if (bag.adenas && bag.adenas !== 0) {
                rewardsHtml += this.buildResultLine(labAdena, this.formatSigned(bag.adenas), 'exp-result-line__val--adena');
            }
            if (bag.xp && bag.xp !== 0) {
                rewardsHtml += this.buildResultLine(labXp, this.formatSigned(bag.xp), 'exp-result-line__val--xp');
            }
            if (bag.drops) {
                for (const item in bag.drops) {
                    if (bag.drops[item] > 0) {
                        rewardsHtml += this.buildResultLine(itemDropDisplayName(item), `x${bag.drops[item]}`, 'exp-result-line__val--drop');
                    }
                }
            }
        }

        if (rewardsEl) rewardsEl.innerHTML = rewardsHtml;
        if (rewardsWrap) rewardsWrap.style.display = rewardsHtml ? 'block' : 'none';

        let effectsHtml = '';
        const effects = result.effects;
        if (effects) {
            if (effects.hpRestored && effects.hpRestored > 0) {
                effectsHtml += this.buildResultLine(labHpRestored, this.formatSigned(effects.hpRestored), 'exp-result-line__val--heal');
            }
            if (effects.hpLost && effects.hpLost > 0) {
                effectsHtml += this.buildResultLine(labHpLost, `-${effects.hpLost}`, 'exp-result-line__val--hurt');
            }
            if (effects.mpRestored && effects.mpRestored > 0) {
                effectsHtml += this.buildResultLine(labMpRestored, this.formatSigned(effects.mpRestored), 'exp-result-line__val--heal');
            }
            if (effects.bagAdenaLost && effects.bagAdenaLost > 0) {
                effectsHtml += this.buildResultLine(labBagAdenaLost, `-${effects.bagAdenaLost}`, 'exp-result-line__val--hurt');
            }
            if (effects.buffText) {
                effectsHtml += this.buildResultLine(effects.buffText, '✓', 'exp-result-line__val--buff');
            }
        }

        if (effectsEl) effectsEl.innerHTML = effectsHtml;
        if (effectsWrap) effectsWrap.style.display = effectsHtml ? 'block' : 'none';

        this.refreshResultDom();
        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-result', 1600);
            const body = document.querySelector('.expedition-result-body') as HTMLElement | null;
            if (body) body.scrollTop = 0;
        }
    }

    static continueFromResult() {
        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-result');
        if (this._resultSkipsAdvance) {
            this._resultSkipsAdvance = false;
            this.renderMap();
            this.persistRun({ silent: true });
            return;
        }
        this.advanceJourney();
    }

    static advanceJourney() {
        this._combatUiActive = false;
        this.state.combatInterrupted = false;

        const lastPath = this.state.currentPath;
        if (lastPath && !this.isCombatPathType(lastPath)) {
            this.state.combatOnlyNextJourney = true;
        }

        this.state.journey += 1;
        if (typeof window.registrarProgressoMissaoDiaria === 'function') {
            window.registrarProgressoMissaoDiaria('expedition_journey', 1);
        }
        this.state.journeyTrait = this.state.nextJourneyTrait;
        this.state.nextJourneyTrait = this.rollJourneyTrait();
        this.state.currentPath = null;
        this.refreshJourneyPhase();

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        this.renderMap();
        this.persistRun({ silent: true });
    }

    static rollUpgradeOptions(count = 3): UpgradeDef[] {
        const picks = this.shuffle(UPGRADE_POOL).slice(0, Math.min(count, UPGRADE_POOL.length));
        const forceLegendary = this.state.luckLegendaryNext || Math.random() < 0.22;
        if (forceLegendary) {
            this.state.luckLegendaryNext = false;
            const leg = this.shuffle(LEGENDARY_UPGRADE_POOL)[0];
            const slot = Math.floor(Math.random() * picks.length);
            picks[slot] = { ...leg };
        }
        return picks;
    }

    static formatUpgradeEffect(up: UpgradeDef): { valueText: string; statLabel: string; tone: string } {
        const negative = this.isNegativeRunBuffStat(up.stat);
        const valueText = negative ? `−${up.value}%` : `+${up.value}%`;
        const statLabel = this.runStatLabel(up.stat);
        const tone = up.legendary ? 'legend' : (negative ? 'guard' : 'power');
        return { valueText, statLabel, tone };
    }

    static buildUpgradeLootMetricsHtml(loot: ExpeditionBagDelta): string {
        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const labDrops = this.t('game.hunt.expedition.bagRiskDropsLabel', 'Drops');
        const adenas = Math.max(0, Math.floor(Number(loot.adenas) || 0));
        const xp = Math.max(0, Math.floor(Number(loot.xp) || 0));
        const drops = loot.drops || {};
        const dropStacks = Object.keys(drops).reduce((n, k) => n + Math.max(0, Math.floor(Number(drops[k]) || 0)), 0);
        if (!adenas && !xp && !dropStacks) {
            return `<span class="exp-upgrade-loot-empty">${this.t('game.hunt.expedition.upgradeNoLoot', 'Fight cleared.')}</span>`;
        }
        return `
            <div class="exp-upgrade-metric exp-upgrade-metric--adena"><strong>+${adenas.toLocaleString()}</strong><em>${labAdena}</em></div>
            <div class="exp-upgrade-metric exp-upgrade-metric--xp"><strong>+${xp.toLocaleString()}</strong><em>${labXp}</em></div>
            <div class="exp-upgrade-metric exp-upgrade-metric--drop"><strong>${dropStacks}</strong><em>${labDrops}</em></div>`;
    }

    static buildUpgradeCardHtml(up: UpgradeDef, idx: number): string {
        const effect = this.formatUpgradeEffect(up);
        const legend = up.legendary
            ? `<span class="exp-upgrade-card__legend">${this.t('game.hunt.expedition.upgradeLegendBadge', 'LEGENDARY')}</span>`
            : '';
        const advanced = this.getBuildsAdvancedByUpgrade(up);
        const wouldUnlock = advanced.filter((def) => {
            const before = this.getCardBuffPct(up.stat);
            const after = before + up.value;
            return def.requirements.every((req) => {
                if (req.kind === 'stat') {
                    const cur = req.stat === up.stat ? after : this.getCardBuffPct(req.stat);
                    return cur >= req.minPct;
                }
                const best = Math.max(...req.stats.map((s) =>
                    s === up.stat ? after : this.getCardBuffPct(s)
                ));
                return best >= req.minPct;
            });
        });
        let buildHint = '';
        if (wouldUnlock.length) {
            buildHint = `<span class="exp-upgrade-card__build-hint exp-upgrade-card__build-hint--unlock">${this.t(
                'game.hunt.expedition.buildCardUnlocks',
                'Unlocks {names}',
                { names: wouldUnlock.slice(0, 2).map((b) => b.icon + ' ' + this.t(b.titleKey, b.titleFallback)).join(' · ') }
            )}</span>`;
        } else if (advanced.length) {
            buildHint = `<span class="exp-upgrade-card__build-hint">${this.t(
                'game.hunt.expedition.buildCardAdvances',
                'Toward {names}',
                { names: advanced.slice(0, 2).map((b) => b.icon + ' ' + this.t(b.titleKey, b.titleFallback)).join(' · ') }
            )}</span>`;
        }
        return `<button type="button" class="exp-upgrade-card exp-upgrade-card--${up.id} exp-upgrade-card--${effect.tone}${up.legendary ? ' exp-upgrade-card--legendary' : ''}${advanced.length ? ' exp-upgrade-card--builds' : ''}${wouldUnlock.length ? ' exp-upgrade-card--unlocks' : ''}" onclick="ExpeditionEngine.pickUpgrade(${idx})">
            ${legend}
            <span class="exp-upgrade-card__icon" aria-hidden="true">${up.icon}</span>
            <span class="exp-upgrade-card__effect">${effect.valueText}</span>
            <span class="exp-upgrade-card__stat">${effect.statLabel}</span>
            <span class="exp-upgrade-card__title">${this.t(up.titleKey, up.titleFallback)}</span>
            ${buildHint}
            <span class="exp-upgrade-card__pick">${this.t('game.hunt.expedition.upgradePick', 'Select')}</span>
        </button>`;
    }

    static showUpgradeModal(loot: ExpeditionBagDelta) {
        const win = window as any;
        this._upgradePickLocked = false;
        this.pendingUpgradeOptions = this.rollUpgradeOptions(3);
        this.lastCombatLoot = loot;

        const lootEl = document.getElementById('exp-upgrade-loot');
        if (lootEl) lootEl.innerHTML = this.buildUpgradeLootMetricsHtml(loot);

        const grid = document.getElementById('exp-upgrade-cards');
        if (grid) {
            grid.innerHTML = this.pendingUpgradeOptions
                .map((up, idx) => this.buildUpgradeCardHtml(up, idx))
                .join('');
        }

        let buildsEl = document.getElementById('exp-upgrade-builds');
        const scroll = document.querySelector('#janela-expedition-upgrade .exp-upgrade-scroll');
        if (!buildsEl && scroll) {
            buildsEl = document.createElement('div');
            buildsEl.id = 'exp-upgrade-builds';
            buildsEl.className = 'exp-upgrade-builds';
            scroll.appendChild(buildsEl);
        }
        // Keep builds below upgrade cards (legacy sessions may have inserted them above).
        if (buildsEl && grid && buildsEl.previousElementSibling !== grid) {
            grid.insertAdjacentElement('afterend', buildsEl);
        }
        if (buildsEl) buildsEl.innerHTML = this.buildRunBuildsHtml({ compact: true });

        const titleEl = document.getElementById('exp-upgrade-title');
        if (titleEl) titleEl.innerText = this.t('game.hunt.expedition.upgradeTitle', 'Choose your upgrade');

        this.refreshUpgradeDom();

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        this.setForestLayoutMode('map');

        if (typeof win.abrirModal === 'function') win.abrirModal('janela-expedition-upgrade', 1600);
        const scrollEl = document.querySelector('#janela-expedition-upgrade .exp-upgrade-scroll') as HTMLElement | null;
        if (scrollEl) scrollEl.scrollTop = 0;
        this.persistRun({ silent: true });
    }

    static refreshUpgradeDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-upgrade');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static pickUpgrade(index: number) {
        if (this._upgradePickLocked) return;
        const up = this.pendingUpgradeOptions[index];
        if (!up) return;
        this._upgradePickLocked = true;

        this.state.runBuffs[up.stat] += up.value;
        this.state.runStats.upgradesTaken += 1;
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;
        this.evaluateRunBuilds({ notify: true });

        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-upgrade');
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        if (typeof win.atualizar === 'function') win.atualizar();

        this.advanceJourney();
        this._upgradePickLocked = false;
    }

    static syncNavigationLock() {
        // Layout lock only while the run is live on the Forest screen (not when parked in town).
        const locked = this.isRunEffectsActive();
        const gameRoot = document.querySelector('.game-container');
        const floresta = document.getElementById('tela-floresta');
        if (gameRoot) gameRoot.classList.toggle('expedition-run-locked', locked);
        if (floresta) floresta.classList.toggle('expedition-run-active', locked);
        this.refreshHubStartButton();
    }

    static promptExitAndExtract(): void {
        void this.confirmExitAndExtract();
    }

    static async confirmExitAndExtract(): Promise<void> {
        if (!this.state.active) return;
        const win = window as any;
        const title = this.t('game.hunt.expedition.exitRunTitle', 'Leave expedition?');
        const body = this.buildExtractConfirmHtml();
        const confirmLabel = this.t('game.hunt.expedition.extract', 'Collect & exit');
        const cancelLabel = this.t('modal.cancel', 'Cancel');

        let ok = false;
        if (typeof win.l2Confirm === 'function') {
            ok = await win.l2Confirm(body, title, { confirmLabel, cancelLabel });
        } else {
            ok = window.confirm(
                this.t(
                    'game.hunt.expedition.exitRunBody',
                    'Extract now to keep 100% of the bag. Run upgrades and forge enchants are cleared.'
                )
            );
        }
        if (!ok) return;

        if (typeof win.pararAtaqueMonstro === 'function') win.pararAtaqueMonstro();
        if (typeof win.clearForestPlayerThreats === 'function') win.clearForestPlayerThreats();
        if (Array.isArray(win.monstrosAtivos)) win.monstrosAtivos.length = 0;

        this.extract();
    }

    static setForestLayoutMode(mode: 'hub' | 'map' | 'combat' | 'idle') {
        this._forestLayoutMode = mode;
        if (mode === 'combat') this._combatUiActive = true;
        if (mode === 'map' || mode === 'hub') this._combatUiActive = false;

        const floresta = document.getElementById('tela-floresta');
        const inner = document.querySelector('.tela-floresta-inner') as HTMLElement | null;
        const area = document.getElementById('area-cacada');
        const map = document.getElementById('expedition-map-container');
        const hub = document.getElementById('expedition-hub');
        if (floresta) {
            floresta.classList.remove('expedition-hub-open', 'expedition-map-open', 'expedition-combat-open');
            if (mode === 'hub') floresta.classList.add('expedition-hub-open');
            if (mode === 'map') floresta.classList.add('expedition-map-open');
            if (mode === 'combat') floresta.classList.add('expedition-combat-open');
        }
        if (typeof window.applyForestBattleBackground === 'function') {
            window.applyForestBattleBackground(mode === 'combat', this.state.zoneId);
        }
        if (inner) inner.classList.toggle('tela-floresta-inner--expedition-map', mode === 'map');

        const hideJourneyChrome = mode === 'combat';
        if (map) {
            if (hideJourneyChrome) {
                map.style.setProperty('display', 'none', 'important');
                map.style.visibility = 'hidden';
                map.style.height = '0';
                map.style.overflow = 'hidden';
                map.setAttribute('aria-hidden', 'true');
            } else if (mode === 'map') {
                map.style.removeProperty('display');
                map.style.display = 'flex';
                map.style.removeProperty('visibility');
                map.style.removeProperty('height');
                map.style.removeProperty('overflow');
                map.setAttribute('aria-hidden', 'false');
            } else {
                map.style.display = 'none';
                map.setAttribute('aria-hidden', 'true');
            }
        }
        if (hub) {
            hub.style.display = mode === 'hub' ? 'flex' : 'none';
            hub.setAttribute('aria-hidden', mode === 'hub' ? 'false' : 'true');
        }

        if (area) area.style.display = mode === 'combat' ? 'flex' : 'none';
        if (mode === 'combat' && this.state.active) {
            this.ensureRunVitalsForCombat();
        }
        this.syncExpeditionCombatControls(mode);
        this.syncExpeditionHotbar(mode);
    }

    static showHub() {
        this.detachHotbarBeforeMapWipe();

        const hub = document.getElementById('expedition-hub');
        const map = document.getElementById('expedition-map-container');
        const btn = document.getElementById('btn-iniciar-caca');
        const mobs = document.getElementById('mobs-container');
        const botoes = document.getElementById('botoes-combate');
        const area = document.getElementById('area-cacada');

        if (hub) hub.style.display = 'flex';
        if (map) {
            map.style.display = 'none';
            map.innerHTML = '';
        }
        if (btn) btn.style.display = '';
        if (mobs) mobs.style.display = 'none';
        if (botoes) botoes.style.display = 'none';
        if (area) area.style.display = 'none';

        this.setForestLayoutMode('hub');
    }

    static hideHub() {
        const hub = document.getElementById('expedition-hub');
        if (hub) hub.style.display = 'none';
    }

    static isForestScreenVisible(): boolean {
        const floresta = document.getElementById('tela-floresta');
        if (!floresta) return false;
        const style = window.getComputedStyle(floresta);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    static syncForestEntryUi() {
        if (this.state.active) {
            if (this.state.suspended) {
                // Parked run: show hub with Resume (do not auto-jump into the map).
                this._combatUiActive = false;
                if (this.isForestScreenVisible()) {
                    this.showHub();
                    this.refreshHubStartButton();
                    this.syncHubParkedHint();
                } else {
                    this.refreshHubStartButton();
                }
                return;
            }
            this.hideHub();
            const mode = this._combatUiActive ? 'combat' : 'map';
            this.setForestLayoutMode(mode);
            if (mode === 'map') this.renderMap();
        } else {
            this._combatUiActive = false;
            this.showHub();
            this.refreshHubStartButton();
            this.syncHubParkedHint();
        }
    }

    /** Sync zone name / grade badge on the trailhead hub. */
    static syncHubZoneCard() {
        const win = window as any;
        const zoneId = this.getCurrentHuntZoneId();
        const gradeEl = document.getElementById('expedition-hub-grade');
        const nameEl = document.getElementById('expedition-hub-zone-name');
        const levelEl = document.getElementById('expedition-hub-zone-level');

        const gradeShort = zoneId === 'No-Grade' ? 'NG' : String(zoneId);
        if (gradeEl) {
            gradeEl.textContent = gradeShort;
            const color = typeof win.getGradeColor === 'function'
                ? win.getGradeColor(zoneId)
                : '#e6c28a';
            gradeEl.style.color = color || '#e6c28a';
            gradeEl.style.borderColor = color ? `${color}99` : '';
        }
        if (nameEl) {
            const fromZona = win.zonaAtual?.nome ? String(win.zonaAtual.nome) : '';
            nameEl.textContent = fromZona || this.getZoneLabel(zoneId);
        }
        if (levelEl) {
            const cat = win.catalogoZonas?.[zoneId];
            const range = cat?.nivelSugerido ? String(cat.nivelSugerido) : '';
            if (range) {
                levelEl.textContent = this.t(
                    'game.hunt.expedition.hubLevelRange',
                    'Suggested Lv. {range}',
                    { range }
                );
                levelEl.style.display = '';
            } else {
                levelEl.textContent = '';
                levelEl.style.display = 'none';
            }
        }
    }

    /** Toggle hub copy when a run is parked vs a fresh start. */
    static syncHubParkedHint() {
        this.syncHubZoneCard();
        const zoneId = this.getCurrentHuntZoneId();
        if (typeof (window as any).ExpeditionMeta?.renderHubLedger === 'function') {
            (window as any).ExpeditionMeta.renderHubLedger(zoneId);
        }
        const hub = document.getElementById('expedition-hub');
        const desc = document.querySelector('#expedition-hub .expedition-hub__desc') as HTMLElement | null;
        if (!desc) return;
        const parked = !!(this.state.active && this.state.suspended);
        if (hub) hub.classList.toggle('expedition-hub--parked', parked);
        if (parked) {
            if (this.isPendingRunOnOtherZone()) {
                const parkedZone = this.getZoneLabel(this.state.zoneId);
                const here = this.getZoneLabel(this.getCurrentHuntZoneId());
                desc.textContent = this.t(
                    'game.hunt.expedition.hubOtherMapHint',
                    'Pending expedition on {parked}. Collect loot to start on {here}, or Resume only works after you return to that map.',
                    { parked: parkedZone, here }
                );
            } else {
                desc.textContent = this.t(
                    'game.hunt.expedition.hubResumeHint',
                    'You have a run in progress. Resume to continue from your bag and journey.'
                );
            }
            desc.removeAttribute('data-i18n');
        } else {
            desc.setAttribute('data-i18n', 'game.hunt.expedition.hubDesc');
            desc.textContent = this.t(
                'game.hunt.expedition.hubDesc',
                'Pick a path each journey, grow stronger as you go, and extract when the bag is worth the risk.'
            );
        }
    }

    static getCurrentHuntZoneId(): string {
        const win = window as any;
        const id = win.zonaAtual?.id;
        return id != null && String(id).length ? String(id) : 'No-Grade';
    }

    static getZoneLabel(zoneId: string): string {
        const win = window as any;
        if (typeof win.zoneDisplayName === 'function') {
            try {
                const n = win.zoneDisplayName(zoneId);
                if (n) return String(n);
            } catch { /* noop */ }
        }
        const z = win.zonasDeCaca?.[zoneId];
        if (z?.nome) return String(z.nome);
        return zoneId || 'No-Grade';
    }

    static isPendingRunOnOtherZone(targetZoneId?: string): boolean {
        if (!this.state.active) return false;
        const target = targetZoneId != null ? String(targetZoneId) : this.getCurrentHuntZoneId();
        return String(this.state.zoneId) !== String(target);
    }

    /**
     * Player is on map B while a run is parked on map A.
     * Confirm → extract (collect bag) then start a fresh run on B after the victory modal.
     * Cancel → keep parked run.
     */
    static async confirmExtractToStartOtherZone(newZoneId: string): Promise<void> {
        if (!this.state.active) {
            this.startExpedition(newZoneId);
            return;
        }
        if (!this.isPendingRunOnOtherZone(newZoneId)) {
            this.resumeSuspendedRun();
            return;
        }

        const win = window as any;
        const parked = this.getZoneLabel(this.state.zoneId);
        const next = this.getZoneLabel(newZoneId);
        const title = this.t('game.hunt.expedition.otherMapTitle', 'Pending expedition');
        const body = this.t(
            'game.hunt.expedition.otherMapBody',
            'You still have an expedition on {parked}.\n\nCollect your bag (100% loot) to start a new run on {next}, or Cancel to keep the pending run.',
            { parked, next }
        );
        const confirmLabel = this.t('game.hunt.expedition.otherMapCollectBtn', 'Collect & start new');
        const cancelLabel = this.t('game.hunt.expedition.otherMapCancelBtn', 'Cancel');

        let ok = false;
        if (typeof win.l2Confirm === 'function') {
            ok = await win.l2Confirm(body, title, { confirmLabel, cancelLabel });
        } else {
            ok = window.confirm(body);
        }
        if (!ok) return;

        if (typeof win.pararAtaqueMonstro === 'function') win.pararAtaqueMonstro();
        if (typeof win.clearForestPlayerThreats === 'function') win.clearForestPlayerThreats();
        if (Array.isArray(win.monstrosAtivos)) win.monstrosAtivos.length = 0;

        this._pendingStartZoneAfterExtract = String(newZoneId);
        this.extract();
    }

    /** Called when the extract victory modal closes — starts a queued new-zone run if any. */
    static consumePendingStartAfterExtract(): boolean {
        const zoneId = this._pendingStartZoneAfterExtract;
        this._pendingStartZoneAfterExtract = null;
        if (!zoneId) return false;
        this.startExpedition(zoneId);
        return true;
    }

    /**
     * Pause button — park the run and return to the Forest hub without extracting.
     * Bag/progress stay saved; player can open town or Resume later.
     */
    static pauseRunToHub(): void {
        if (!this.state.active || this.state.suspended) return;
        // Pause is a map action — never a free retreat from an active fight.
        if (this.blockLeaveDuringCombat()) return;
        const win = window as any;
        if (typeof win.fecharModal === 'function') {
            ['janela-expedition-upgrade', 'janela-expedition-node', 'janela-expedition-result', 'janela-expedition-rules']
                .forEach((id) => { try { win.fecharModal(id); } catch { /* noop */ } });
        }
        this.suspendRunForWorldLeave({ persist: true });
        this.showHub();
        this.refreshHubStartButton();
        this.syncHubParkedHint();
    }

    static init() {
        (window as any).ExpeditionEngine = ExpeditionEngine;
        setTimeout(() => ExpeditionEngine.wireStartButton(), 1000);
    }

    static refreshHubStartButton() {
        this.syncHubZoneCard();
        const btn = document.getElementById('btn-iniciar-caca');
        if (!btn) return;
        if (this.state.active) {
            if (this.isPendingRunOnOtherZone()) {
                btn.setAttribute('data-i18n', 'game.hunt.expedition.startOtherMapBtn');
                btn.textContent = this.t('game.hunt.expedition.startOtherMapBtn', 'Start here (pending run…)');
            } else {
                btn.setAttribute('data-i18n', 'game.hunt.expedition.resumeBtn');
                btn.textContent = this.t('game.hunt.expedition.resumeBtn', 'Resume Expedition');
            }
        } else {
            btn.setAttribute('data-i18n', 'game.hunt.expedition.startBtn');
            btn.textContent = this.t('game.hunt.expedition.startBtn', 'Begin Expedition');
        }
    }

    static wireStartButton() {
        const btnIniciar = document.getElementById('btn-iniciar-caca');
        if (!btnIniciar) return;
        btnIniciar.onclick = () => {
            const zoneId = ExpeditionEngine.getCurrentHuntZoneId();
            if (ExpeditionEngine.state.active) {
                if (ExpeditionEngine.isPendingRunOnOtherZone(zoneId)) {
                    void ExpeditionEngine.confirmExtractToStartOtherZone(zoneId);
                    return;
                }
                ExpeditionEngine.resumeSuspendedRun();
                return;
            }
            ExpeditionEngine.startExpedition(zoneId);
        };
        this.refreshHubStartButton();
        this.syncForestEntryUi();
    }

    static startExpedition(zoneId: string) {
        this.restoreMobTuning();
        const rareEventJourney = this.rollRareEventJourney();
        const firstTrait = this.rollJourneyTrait();
        this.state = {
            active: true,
            suspended: false,
            zoneId,
            journey: 1,
            pathChoices: [],
            currentPath: null,
            combatInterrupted: false,
            combatOnlyNextJourney: false,
            combatOnlyThisJourney: false,
            nextPathBias: null,
            nextPathGuarantee: null,
            pathBiasThisJourney: null,
            runBuffs: this.emptyRunBuffs(),
            unlockedBuildIds: [],
            buildBonusBuffs: this.emptyRunBuffs(),
            runEnchantBonus: this.emptyRunEnchantBonus(),
            runStats: this.emptyRunStats(),
            journeyTrait: firstTrait,
            nextJourneyTrait: this.rollJourneyTrait(),
            luckLootMult: 1,
            luckLegendaryNext: false,
            rareEventJourney,
            rareEventUsed: false,
            pendingRareEvent: false,
            rareEventType: null,
            runPanelTab: 'path',
            bag: { adenas: 0, xp: 0, drops: {} }
        };
        (this as any)._savedRunVitals = null;
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;
        this.refreshJourneyPhase();
        this._combatUiActive = false;
        this.hideHub();
        this.renderMap();
        this.syncNavigationLock();
        const win = window as any;
        this.ensureRunVitalsForCombat();
        if (typeof win.atualizar === 'function') win.atualizar();
        if (typeof win.ExpeditionMeta?.recordRunStarted === 'function') {
            win.ExpeditionMeta.recordRunStarted(zoneId);
        }
        this.persistRun({ silent: true });
        try {
            if (typeof win.TutorialEngine !== 'undefined' && typeof win.TutorialEngine.notifyHuntSearch === 'function') {
                win.TutorialEngine.notifyHuntSearch();
            }
        } catch (e) { /* ignore */ }
    }

    static getPathCardMeta(type: ExpeditionPathType, opts?: { milestone?: boolean }) {
        const meta = this.getPathMeta(type);
        const grantsUpgrade = type === 'combat' || type === 'boss' || type === 'elite';
        if (opts?.milestone && type === 'boss') {
            return {
                ...meta,
                hint: this.t('game.hunt.expedition.pathCardHintMilestoneBoss', 'Required gate · every 10 journeys'),
                badge: this.t('game.hunt.expedition.pathBadgeMilestone', 'MILESTONE'),
                badgeCls: 'expedition-path-card__badge--milestone'
            };
        }
        const hintKeys: Record<ExpeditionPathType, string> = {
            combat: 'game.hunt.expedition.pathCardHintCombat',
            boss: 'game.hunt.expedition.pathCardHintBoss',
            chest: 'game.hunt.expedition.pathCardHintChest',
            elite: 'game.hunt.expedition.pathCardHintElite',
            merchant: 'game.hunt.expedition.pathCardHintMerchant',
            forge: 'game.hunt.expedition.pathCardHintForge',
            scout: 'game.hunt.expedition.pathCardHintScout',
            patrol: 'game.hunt.expedition.pathCardHintPatrol',
            tracks: 'game.hunt.expedition.pathCardHintTracks',
            warhorn: 'game.hunt.expedition.pathCardHintWarhorn',
            ambush: 'game.hunt.expedition.pathCardHintAmbush'
        };
        const hintFallbacks: Record<ExpeditionPathType, string> = {
            combat: 'Win → pick 1 upgrade',
            boss: 'Hard fight · ×2 loot',
            chest: 'Loot now · no upgrade',
            elite: 'Champions · premium',
            merchant: 'Choose 1 of 3 deals',
            forge: 'Random +1 enchant · no fight',
            scout: 'Foresight · bag bonus',
            patrol: 'XP march · no gifts',
            tracks: 'Trait · path guarantee',
            warhorn: 'Pick a rally cry',
            ambush: 'Risk · loot or pain'
        };
        return {
            ...meta,
            hint: this.t(hintKeys[type], hintFallbacks[type]),
            badge: grantsUpgrade
                ? this.t('game.hunt.expedition.pathBadgeUpgrade', 'UPGRADE')
                : this.t('game.hunt.expedition.pathBadgeSafe', 'SAFE'),
            badgeCls: grantsUpgrade ? 'expedition-path-card__badge--upgrade' : 'expedition-path-card__badge--safe'
        };
    }

    static buildRunBuffsHtml(): string {
        const b = this.state.runBuffs;
        const chips: string[] = [];
        if (b.pAtkPct) chips.push(`⚔️ +${b.pAtkPct}%`);
        if (b.mAtkPct) chips.push(`✨ +${b.mAtkPct}%`);
        if (b.critRatePct) chips.push(`🎯 +${b.critRatePct}%`);
        if (b.atkSpeedPct) chips.push(`💨 +${b.atkSpeedPct}%`);
        if (b.pDefPct) chips.push(`🛡️ +${b.pDefPct}%`);
        if (b.mDefPct) chips.push(`🔮 +${b.mDefPct}%`);
        if (b.maxHpPct) chips.push(`❤️ +${b.maxHpPct}%`);
        if (b.hpRegenPct) chips.push(`💚 +${b.hpRegenPct}% regen`);
        if (b.mpRegenPct) chips.push(`💙 +${b.mpRegenPct}% MP regen`);
        if (b.poisonResPct) chips.push(`☠️ -${b.poisonResPct}%`);
        if (b.bleedResPct) chips.push(`🩸 -${b.bleedResPct}%`);
        if (b.mpCostReductionPct) chips.push(`🔷 -${b.mpCostReductionPct}% MP`);
        if (b.skillCdReductionPct) chips.push(`⏱️ -${b.skillCdReductionPct}% CD`);
        const enchantHtml = this.buildRunEnchantChipsHtml();
        if (chips.length === 0 && !enchantHtml) {
            return `<span class="expedition-run-buffs__empty">${this.t('game.hunt.expedition.runBuffsEmpty', 'No run upgrades yet — win fights to grow stronger.')}</span>`;
        }
        return chips.map((c) => `<span class="expedition-run-buffs__chip">${c}</span>`).join('') + enchantHtml;
    }

    static getRareEventMeta(type: ExpeditionRareEventType) {
        const icons: Record<ExpeditionRareEventType, string> = {
            shrine: '🌙',
            gambler: '🎲',
            cache: '📦',
            storm: '⛈️'
        };
        return {
            icon: icons[type],
            title: this.t(`game.hunt.expedition.rareEvent_${type}_title`, type),
            desc: this.t(`game.hunt.expedition.rareEvent_${type}_desc`, ''),
            btn: this.t(`game.hunt.expedition.rareEvent_${type}_btn`, 'Continue')
        };
    }

    static getRareEventChoices(type: ExpeditionRareEventType): { id: string; label: string; hint: string }[] {
        if (type === 'shrine') {
            return [
                {
                    id: 'a',
                    label: this.t('game.hunt.expedition.rareChoice_shrine_a', 'Moon bounty'),
                    hint: this.t('game.hunt.expedition.rareChoice_shrine_a_hint', 'Rich bag loot · +8% HP regen · full restore')
                },
                {
                    id: 'b',
                    label: this.t('game.hunt.expedition.rareChoice_shrine_b', 'Vital oath'),
                    hint: this.t('game.hunt.expedition.rareChoice_shrine_b_hint', 'Partial heal · +8% Max HP')
                }
            ];
        }
        if (type === 'gambler') {
            return [
                {
                    id: 'a',
                    label: this.t('game.hunt.expedition.rareChoice_gambler_a', 'Lucky charm'),
                    hint: this.t('game.hunt.expedition.rareChoice_gambler_a_hint', '+75% next fight loot')
                },
                {
                    id: 'b',
                    label: this.t('game.hunt.expedition.rareChoice_gambler_b', 'Blood wager'),
                    hint: this.t('game.hunt.expedition.rareChoice_gambler_b_hint', '−12% HP now · +120% next loot')
                }
            ];
        }
        if (type === 'cache') {
            return [
                {
                    id: 'a',
                    label: this.t('game.hunt.expedition.rareChoice_cache_a', 'Coin purse'),
                    hint: this.t('game.hunt.expedition.rareChoice_cache_a_hint', 'More Adena')
                },
                {
                    id: 'b',
                    label: this.t('game.hunt.expedition.rareChoice_cache_b', 'Supply cache'),
                    hint: this.t('game.hunt.expedition.rareChoice_cache_b_hint', 'Less Adena · more materials')
                }
            ];
        }
        return [
            {
                id: 'a',
                label: this.t('game.hunt.expedition.rareChoice_storm_a', 'Embrace chaos'),
                hint: this.t('game.hunt.expedition.rareChoice_storm_a_hint', '+6% random · next win legendary')
            },
            {
                id: 'b',
                label: this.t('game.hunt.expedition.rareChoice_storm_b', 'Focused surge'),
                hint: this.t('game.hunt.expedition.rareChoice_storm_b_hint', 'Pick +8% (no legendary)')
            }
        ];
    }

    static buildRareEventSectionHtml(): string {
        const type = this.state.rareEventType;
        if (!type) return '';
        const meta = this.getRareEventMeta(type);
        const banner = this.t('game.hunt.expedition.rareEventBanner', 'Rare encounter — once per run');
        const choices = this.getRareEventChoices(type);
        const choiceBtns = choices.map((c) =>
            `<button type="button" class="btn-l2 expedition-rare-event__btn expedition-rare-event__btn--choice" onclick="ExpeditionEngine.resolveRareEvent('${c.id}')">
                <span class="expedition-rare-event__btn-label">${c.label}</span>
                <span class="expedition-rare-event__btn-hint">${c.hint}</span>
            </button>`
        ).join('');
        return `
                <div class="expedition-rare-event">
                    <div class="expedition-rare-event__banner">${banner}</div>
                    <div class="expedition-rare-event__card">
                        <span class="expedition-rare-event__icon" aria-hidden="true">${meta.icon}</span>
                        <h4 class="expedition-rare-event__title">${meta.title}</h4>
                        <p class="expedition-rare-event__desc">${meta.desc}</p>
                        <div class="expedition-rare-event__choices">${choiceBtns}</div>
                    </div>
                </div>`;
    }

    static getPathPickHint(journey: number, choiceCount: number): string {
        if (this.state.combatOnlyThisJourney && choiceCount > 1) {
            return this.t(
                'game.hunt.expedition.pathPickHintCombatOnly',
                'You skipped a fight — only battle routes this journey'
            );
        }
        if (journey < 2 && choiceCount > 1) {
            return this.t('game.hunt.expedition.pathPickHintOpeningChoice', 'First step — pick Fight or Elite below');
        }
        if (choiceCount === 1) {
            if (this.isMilestoneBossJourney(journey)) {
                return this.t('game.hunt.expedition.pathPickHintMilestone', 'Gate boss — tap the card to fight');
            }
            return this.t('game.hunt.expedition.pathPickHintSolo', 'Tap the card below to continue');
        }
        return this.t('game.hunt.expedition.pathPickHint', 'Choose a path below to continue');
    }

    static buildPathSectionHtml(journey: number, pickHint: string): string {
        const milestone = this.isMilestoneBossJourney(journey);
        const opening = journey < 2;
        const choiceCount = this.state.pathChoices.length;
        const solo = choiceCount === 1;
        let pathsHtml = '';
        this.state.pathChoices.forEach((choice, idx) => {
            const card = this.getPathCardMeta(choice.type, { milestone });
            pathsHtml += `
            <button type="button" class="expedition-path-card expedition-path-card--cta expedition-path-card--${choice.type}${milestone ? ' expedition-path-card--milestone' : ''}${opening ? ' expedition-path-card--opening' : ''}" onclick="ExpeditionEngine.clickPath(${idx})">
                <span class="expedition-path-card__badge ${card.badgeCls}">${card.badge}</span>
                <span class="expedition-path-card__icon">${card.icon}</span>
                <span class="expedition-path-card__label">${card.label}</span>
                <span class="expedition-path-card__hint">${card.hint}</span>
            </button>`;
        });

        const milestoneBanner = milestone
            ? `<div class="expedition-milestone-banner">${this.t('game.hunt.expedition.milestoneBossBanner', 'Milestone {n} — defeat the gate boss to continue', { n: journey })}</div>`
            : '';

        const openingBanner = opening
            ? `<div class="expedition-opening-banner">${this.t('game.hunt.expedition.openingFightBanner', 'Opening step — standard fight or elite pull, your call')}</div>`
            : '';

        const combatOnlyBanner = this.state.combatOnlyThisJourney && !milestone && choiceCount > 1
            ? `<div class="expedition-combat-only-banner">${this.t('game.hunt.expedition.combatOnlyBanner', 'No shortcuts — pick a fight to continue')}</div>`
            : '';

        const biasThis = this.state.pathBiasThisJourney;
        const biasThisBanner = biasThis && !milestone && !this.state.combatOnlyThisJourney
            ? `<div class="expedition-intel-banner expedition-intel-banner--${biasThis}">${biasThis === 'fight'
                ? this.t('game.hunt.expedition.intelBiasThisFight', 'Scout intel active — fight-heavy routes')
                : this.t('game.hunt.expedition.intelBiasThisSafe', 'Scout intel active — safer routes')}</div>`
            : '';

        const pendingBits: string[] = [];
        if (this.state.nextPathBias === 'fight') {
            pendingBits.push(this.t('game.hunt.expedition.intelPendingFight', 'Next journey: fight-heavy'));
        } else if (this.state.nextPathBias === 'safe') {
            pendingBits.push(this.t('game.hunt.expedition.intelPendingSafe', 'Next journey: safer paths'));
        }
        if (this.state.nextPathGuarantee) {
            pendingBits.push(this.t(
                'game.hunt.expedition.intelPendingGuarantee',
                'Guaranteed: {path}',
                { path: this.pathTypeLabel(this.state.nextPathGuarantee) }
            ));
        }
        const pendingIntelBanner = pendingBits.length
            ? `<div class="expedition-intel-banner expedition-intel-banner--pending">${pendingBits.join(' · ')}</div>`
            : '';

        const gridClass = solo
            ? 'expedition-path-grid expedition-path-grid--solo'
            : choiceCount === 2
                ? 'expedition-path-grid expedition-path-grid--duo'
                : 'expedition-path-grid';

        const sectionMods = [
            'expedition-path-section--hero',
            'expedition-path-section--action-focus',
            solo ? 'expedition-path-section--solo' : '',
            choiceCount === 2 ? 'expedition-path-section--duo' : '',
            opening ? 'expedition-path-section--opening' : '',
            milestone ? 'expedition-path-section--milestone' : '',
            this.state.combatOnlyThisJourney ? 'expedition-path-section--combat-only' : '',
            biasThis ? 'expedition-path-section--intel-' + biasThis : ''
        ].filter(Boolean).join(' ');

        const headGlyph = opening ? '⚔️' : milestone ? '👹' : '👇';

        return `
                ${milestoneBanner}
                ${openingBanner}
                ${combatOnlyBanner}
                ${biasThisBanner}
                ${pendingIntelBanner}
                <div class="expedition-path-section ${sectionMods}" role="region" aria-label="${pickHint}">
                    <div class="expedition-path-section__head">
                        <span class="expedition-path-section__glyph" aria-hidden="true">${headGlyph}</span>
                        <div class="expedition-path-section__label">${pickHint}</div>
                    </div>
                    <div class="${gridClass}">${pathsHtml}</div>
                </div>`;
    }

    static resolveRareEvent(choiceId: string = 'a') {
        if (!this.state.pendingRareEvent || !this.state.rareEventType) return;
        if (this._offerMode) return;
        const type = this.state.rareEventType;
        const choice = choiceId === 'b' ? 'b' : 'a';

        if (type === 'storm' && choice === 'b') {
            this.openStormFocusOffers();
            return;
        }

        const result = this.applyRareEventChoice(type, choice);
        if (!result) return;

        this.state.runStats.rareEventType = type;
        this.state.rareEventUsed = true;
        this.state.pendingRareEvent = false;
        this._resultSkipsAdvance = true;
        this.showResultModal(result);
    }

    static openStormFocusOffers(): void {
        const pool: (keyof ExpeditionRunBuffs)[] = [
            'pAtkPct', 'mAtkPct', 'pDefPct', 'mDefPct', 'critRatePct', 'atkSpeedPct', 'maxHpPct',
            'hpRegenPct', 'mpRegenPct', 'skillCdReductionPct', 'mpCostReductionPct'
        ];
        const shuffled = this.shuffle(pool);
        this._stormFocusStats = shuffled.slice(0, 3);
        const offers: ExpeditionOffer[] = this._stormFocusStats.map((stat, idx) => ({
            id: 'storm_' + idx,
            icon: '⚡',
            titleKey: 'game.hunt.expedition.offerStormFocusTitle',
            titleFallback: '+8% {stat}',
            descKey: 'game.hunt.expedition.offerStormFocusDesc',
            descFallback: 'Focused surge — no legendary guarantee.',
            descParams: { stat: this.runStatLabel(stat) }
        }));
        // Fix title per-stat via fallback params — use custom titles in HTML via descParams on title
        offers.forEach((o, idx) => {
            const stat = this._stormFocusStats[idx];
            o.titleFallback = '+8% ' + this.runStatLabel(stat);
            o.titleKey = 'game.hunt.expedition.offerStormFocusTitle';
            o.descParams = { stat: this.runStatLabel(stat) };
        });

        this.showOfferModal({
            icon: '⛈️',
            title: this.t('game.hunt.expedition.rareEvent_storm_title', 'Blood Storm'),
            desc: this.t(
                'game.hunt.expedition.offerStormFocusPick',
                'Channel the storm into one surge — +8%, no legendary.'
            ),
            toneClass: 'event',
            offers,
            onPick: (id) => this.applyStormFocusOffer(id)
        });
    }

    static applyStormFocusOffer(id: string): void {
        const win = window as any;
        const idx = Number(String(id).replace('storm_', ''));
        const stat = this._stormFocusStats[idx] || this.rollRandomRunStat();
        this.state.runBuffs[stat] += 8;
        this.evaluateRunBuilds({ notify: true });
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        win.atualizar();

        this.state.runStats.rareEventType = 'storm';
        this.state.rareEventUsed = true;
        this.state.pendingRareEvent = false;
        this._resultSkipsAdvance = true;
        this._stormFocusStats = [];

        this.showResultModal({
            nodeType: 'event',
            tone: 'neutral',
            icon: '⛈️',
            titleKey: 'game.hunt.expedition.rareResult_storm_focus_title',
            titleFallback: 'Focused surge',
            summaryKey: 'game.hunt.expedition.rareResult_storm_focus_desc',
            summaryFallback: 'You shaped the storm — +8% {stat}, no legendary.',
            summaryParams: { stat: this.runStatLabel(stat) },
            effects: { buffText: `+8% ${this.runStatLabel(stat)}` }
        });
    }

    static applyRareEventChoice(type: ExpeditionRareEventType, choice: 'a' | 'b'): ExpeditionNodeResult | null {
        const win = window as any;

        if (type === 'shrine') {
            const hpBefore = Number(win.playerHP) || 0;
            const mpBefore = Number(win.playerMP) || 0;
            const maxHp = Number(win.playerStats?.maxHp) || hpBefore;
            const maxMp = Number(win.playerStats?.maxMp) || mpBefore;
            const journeyMult = this.getJourneyRewardMult();
            if (choice === 'b') {
                win.playerHP = Math.min(maxHp, Math.max(hpBefore, Math.floor(maxHp * 0.55)));
                win.playerMP = Math.min(maxMp, Math.max(mpBefore, Math.floor(maxMp * 0.55)));
                this.state.runBuffs.maxHpPct += 8;
                this.evaluateRunBuilds({ notify: true });
                if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
                win.atualizar();
                return {
                    nodeType: 'event',
                    tone: 'success',
                    icon: '🌙',
                    titleKey: 'game.hunt.expedition.rareResult_shrine_vital_title',
                    titleFallback: 'Vital oath',
                    summaryKey: 'game.hunt.expedition.rareResult_shrine_vital_desc',
                    summaryFallback: 'Partial recovery and a lasting +8% Max HP for this run.',
                    effects: {
                        hpRestored: Math.max(0, (Number(win.playerHP) || 0) - hpBefore),
                        mpRestored: Math.max(0, (Number(win.playerMP) || 0) - mpBefore),
                        buffText: `+8% ${this.runStatLabel('maxHpPct')}`
                    }
                };
            }
            // Moon bounty — bag wealth + run regen (heal is a bonus; potions already cover emergency HP)
            win.playerHP = maxHp;
            win.playerMP = maxMp;
            const adenaGain = Math.floor((Math.random() * 400 + 900) * journeyMult);
            this.state.bag.adenas += adenaGain;
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.max(3, Math.floor((Math.random() * 3 + 3) * journeyMult));
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            this.state.runBuffs.hpRegenPct += 8;
            this.evaluateRunBuilds({ notify: true });
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
            win.atualizar();
            return {
                nodeType: 'event',
                tone: 'success',
                icon: '🌙',
                titleKey: 'game.hunt.expedition.rareResult_shrine_title',
                titleFallback: 'Moon bounty',
                summaryKey: 'game.hunt.expedition.rareResult_shrine_desc',
                summaryFallback: 'The altar fills your bag and steadies your breath — +8% HP regen this run.',
                bag: { adenas: adenaGain, drops: { [mat]: matQty } },
                effects: {
                    hpRestored: Math.max(0, maxHp - hpBefore),
                    mpRestored: Math.max(0, maxMp - mpBefore),
                    buffText: `+8% ${this.runStatLabel('hpRegenPct')}`
                }
            };
        }

        if (type === 'gambler') {
            if (choice === 'b') {
                const dmg = Math.floor((Number(win.playerStats?.maxHp) || 100) * 0.12);
                win.playerHP = Math.max(1, (Number(win.playerHP) || 1) - dmg);
                win.atualizar();
                this.state.luckLootMult = 2.2;
                return {
                    nodeType: 'event',
                    tone: 'danger',
                    icon: '🎲',
                    titleKey: 'game.hunt.expedition.rareResult_gambler_blood_title',
                    titleFallback: 'Blood wager',
                    summaryKey: 'game.hunt.expedition.rareResult_gambler_blood_desc',
                    summaryFallback: 'You paid in blood — next fight pays +120% bag loot.',
                    effects: {
                        hpLost: dmg,
                        buffText: this.t('game.hunt.expedition.rareBuffLootHigh', '+120% next fight loot')
                    }
                };
            }
            this.state.luckLootMult = 1.75;
            return {
                nodeType: 'event',
                tone: 'warning',
                icon: '🎲',
                titleKey: 'game.hunt.expedition.rareResult_gambler_title',
                titleFallback: 'Fortune twist',
                summaryKey: 'game.hunt.expedition.rareResult_gambler_desc',
                summaryFallback: 'Your next fight pays +75% bag loot. Choose your path wisely.',
                effects: { buffText: this.t('game.hunt.expedition.rareBuffLoot', '+75% next fight loot') }
            };
        }

        if (type === 'cache') {
            const journeyMult = this.getJourneyRewardMult();
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore'];
            this.state.runStats.chestsOpened += 1;
            if (choice === 'b') {
                const adenaGain = Math.floor((Math.random() * 400 + 200) * journeyMult);
                this.state.bag.adenas += adenaGain;
                const matA = mats[Math.floor(Math.random() * mats.length)];
                let matB = mats[Math.floor(Math.random() * mats.length)];
                if (matB === matA) matB = mats[(mats.indexOf(matA) + 1) % mats.length];
                const qtyA = Math.max(3, Math.floor((Math.random() * 4 + 4) * journeyMult));
                const qtyB = Math.max(2, Math.floor((Math.random() * 3 + 3) * journeyMult));
                this.state.bag.drops[matA] = (this.state.bag.drops[matA] || 0) + qtyA;
                this.state.bag.drops[matB] = (this.state.bag.drops[matB] || 0) + qtyB;
                return {
                    nodeType: 'chest',
                    tone: 'success',
                    icon: '📦',
                    titleKey: 'game.hunt.expedition.rareResult_cache_mats_title',
                    titleFallback: 'Supply cache',
                    summaryKey: 'game.hunt.expedition.rareResult_cache_mats_desc',
                    summaryFallback: 'You took the supplies — fewer coins, fuller crates.',
                    bag: { adenas: adenaGain, drops: { [matA]: qtyA, [matB]: qtyB } }
                };
            }
            const adenaGain = Math.floor((Math.random() * 900 + 550) * journeyMult);
            this.state.bag.adenas += adenaGain;
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.max(1, Math.floor((Math.random() * 2 + 1) * journeyMult));
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            return {
                nodeType: 'chest',
                tone: 'success',
                icon: '📦',
                titleKey: 'game.hunt.expedition.rareResult_cache_title',
                titleFallback: 'Hidden cache',
                summaryKey: 'game.hunt.expedition.rareResult_cache_desc',
                summaryFallback: 'A stash left on the trail — straight to your expedition bag.',
                bag: { adenas: adenaGain, drops: { [mat]: matQty } }
            };
        }

        // storm choice a
        this.state.luckLegendaryNext = true;
        const stat = this.rollRandomRunStat();
        this.state.runBuffs[stat] += 6;
        this.evaluateRunBuilds({ notify: true });
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        return {
            nodeType: 'event',
            tone: 'neutral',
            icon: '⛈️',
            titleKey: 'game.hunt.expedition.rareResult_storm_title',
            titleFallback: 'Blood storm',
            summaryKey: 'game.hunt.expedition.rareResult_storm_desc',
            summaryFallback: '+6% to a random run stat and a guaranteed legendary upgrade on your next victory.',
            effects: {
                buffText: `+6% ${this.runStatLabel(stat)} · ${this.t('game.hunt.expedition.rareBuffLegendary', 'Next win: legendary upgrade')}`
            }
        };
    }

    static buildExtractSummary(journey: number, stats: ExpeditionRunStats, runBuffs: ExpeditionRunBuffs): string {
        const parts: string[] = [];
        parts.push(this.t('game.hunt.expedition.extractSummaryJourney', 'Journey {n}', { n: journey }));

        const fightParts: string[] = [];
        if (stats.bossesCleared > 0) {
            fightParts.push(this.t('game.hunt.expedition.extractSummaryBosses', '{n} bosses', { n: stats.bossesCleared }));
        }
        if (stats.elitesCleared > 0) {
            fightParts.push(this.t('game.hunt.expedition.extractSummaryElites', '{n} elites', { n: stats.elitesCleared }));
        }
        if (stats.combatsWon > 0) {
            fightParts.push(this.t('game.hunt.expedition.extractSummaryFights', '{n} fights', { n: stats.combatsWon }));
        }
        if (stats.upgradesTaken > 0) {
            fightParts.push(this.t('game.hunt.expedition.extractSummaryUpgrades', '{n} upgrades', { n: stats.upgradesTaken }));
        }
        if (stats.rareEventType) {
            fightParts.push(this.t('game.hunt.expedition.extractSummaryRare', 'Rare: {event}', {
                event: this.t(`game.hunt.expedition.rareEvent_${stats.rareEventType}_short`, stats.rareEventType)
            }));
        }
        if (fightParts.length) parts.push(fightParts.join(' · '));

        const buffParts: string[] = [];
        if (runBuffs.pAtkPct) buffParts.push(`+${runBuffs.pAtkPct}% P.Atk`);
        if (runBuffs.mAtkPct) buffParts.push(`+${runBuffs.mAtkPct}% M.Atk`);
        if (runBuffs.critRatePct) buffParts.push(`+${runBuffs.critRatePct}% Crit`);
        if (runBuffs.atkSpeedPct) buffParts.push(`+${runBuffs.atkSpeedPct}% Spd`);
        if (runBuffs.pDefPct) buffParts.push(`+${runBuffs.pDefPct}% P.Def`);
        if (runBuffs.mDefPct) buffParts.push(`+${runBuffs.mDefPct}% M.Def`);
        if (runBuffs.maxHpPct) buffParts.push(`+${runBuffs.maxHpPct}% ${this.runStatLabel('maxHpPct')}`);
        if (runBuffs.hpRegenPct) buffParts.push(`+${runBuffs.hpRegenPct}% ${this.runStatLabel('hpRegenPct')}`);
        if (runBuffs.mpRegenPct) buffParts.push(`+${runBuffs.mpRegenPct}% ${this.runStatLabel('mpRegenPct')}`);
        if (runBuffs.poisonResPct) buffParts.push(`-${runBuffs.poisonResPct}% ${this.runStatLabel('poisonResPct')}`);
        if (runBuffs.bleedResPct) buffParts.push(`-${runBuffs.bleedResPct}% ${this.runStatLabel('bleedResPct')}`);
        if (runBuffs.mpCostReductionPct) buffParts.push(`-${runBuffs.mpCostReductionPct}% ${this.runStatLabel('mpCostReductionPct')}`);
        if (runBuffs.skillCdReductionPct) buffParts.push(`-${runBuffs.skillCdReductionPct}% ${this.runStatLabel('skillCdReductionPct')}`);
        const unlocked = (this.state.unlockedBuildIds || [])
            .map((id) => this.getBuildDef(id))
            .filter(Boolean) as ExpeditionBuildDef[];
        if (unlocked.length) {
            buffParts.push(this.t('game.hunt.expedition.extractSummaryBuild', 'Builds: {names}', {
                names: unlocked.map((d) => this.t(d.titleKey, d.titleFallback)).join(', ')
            }));
            const mastery = this.getBuildMasteryTier();
            if (mastery) {
                buffParts.push(this.t(mastery.titleKey, mastery.titleFallback));
            }
        }
        const forgeSummary = this.buildRunEnchantSummaryText();
        if (forgeSummary) parts.push(forgeSummary);
        if (buffParts.length) {
            parts.push(this.t('game.hunt.expedition.extractSummaryBuffs', 'Run: {buffs}', { buffs: buffParts.join(', ') }));
        }

        return parts.join(' · ');
    }

    /** Integer half on death: kept = floor(n/2), lost = n - kept (no fractional items). */
    static splitDeathShare(total: number): { kept: number; lost: number } {
        const t = Math.max(0, Math.floor(Number(total) || 0));
        const kept = Math.floor(t / 2);
        return { kept, lost: t - kept };
    }

    static getBagSnapshot(): { adenas: number; xp: number; drops: Record<string, number> } {
        const drops: Record<string, number> = {};
        const src = this.state.bag?.drops || {};
        for (const k of Object.keys(src)) {
            const n = Math.max(0, Math.floor(Number(src[k]) || 0));
            if (n > 0) drops[k] = n;
        }
        return {
            adenas: Math.max(0, Math.floor(Number(this.state.bag?.adenas) || 0)),
            xp: Math.max(0, Math.floor(Number(this.state.bag?.xp) || 0)),
            drops,
        };
    }

    static countBagDropStacks(drops: Record<string, number>): number {
        return Object.keys(drops || {}).reduce((n, k) => n + Math.max(0, Math.floor(Number(drops[k]) || 0)), 0);
    }

    /** Compact "Adena · XP · drops" line for HUD / confirms. */
    static formatBagCompactLine(bag: { adenas: number; xp: number; drops: Record<string, number> }): string {
        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const parts: string[] = [];
        parts.push(`${bag.adenas.toLocaleString()} ${labAdena}`);
        parts.push(`${bag.xp.toLocaleString()} ${labXp}`);
        const stacks = this.countBagDropStacks(bag.drops);
        if (stacks > 0) {
            parts.push(this.t('game.hunt.expedition.bagRiskDrops', '{n} drops', { n: stacks }));
        }
        return parts.join(' · ');
    }

    static buildBagDropLinesHtml(
        bag: { adenas: number; xp: number; drops: Record<string, number> },
        tone: 'keep' | 'death',
        opts?: { compact?: boolean }
    ): string {
        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const compact = !!opts?.compact;
        let html = '';
        if (bag.adenas > 0 || compact) {
            const cls = tone === 'keep' ? 'exp-result-line__val--adena' : 'exp-result-line__val--hurt';
            html += this.buildResultLine(labAdena, `+${bag.adenas.toLocaleString()}`, cls);
        }
        if (bag.xp > 0 || compact) {
            const cls = tone === 'keep' ? 'exp-result-line__val--xp' : 'exp-result-line__val--hurt';
            html += this.buildResultLine(labXp, `+${bag.xp.toLocaleString()}`, cls);
        }
        const stacks = this.countBagDropStacks(bag.drops);
        if (compact) {
            if (stacks > 0) {
                const cls = tone === 'keep' ? 'exp-result-line__val--drop' : 'exp-result-line__val--hurt';
                html += this.buildResultLine(
                    this.t('game.hunt.expedition.bagRiskDropsLabel', 'Drops'),
                    `x${stacks}`,
                    cls
                );
            }
        } else {
            for (const item of Object.keys(bag.drops || {})) {
                const qty = bag.drops[item];
                if (qty <= 0) continue;
                const cls = tone === 'keep' ? 'exp-result-line__val--drop' : 'exp-result-line__val--hurt';
                html += this.buildResultLine(itemDropDisplayName(item), `x${qty}`, cls);
            }
        }
        if (!html) {
            return `<p class="exp-risk-empty">${this.t('game.hunt.expedition.bagRiskEmpty', 'Bag is empty.')}</p>`;
        }
        return `<div class="exp-risk-lines">${html}</div>`;
    }

    /** Map footer HUD — totals only (risk detail lives on Extract confirm). */
    static buildMapBagBarHtml(): string {
        const bag = this.getBagSnapshot();
        const hasLoot = this.bagHasAnyLoot(bag);
        const drops = this.countBagDropStacks(bag.drops);
        const risk = hasLoot
            ? this.t('game.hunt.expedition.bagHudRisk', 'Die = keep half')
            : this.t('game.hunt.expedition.bagHudSafe', 'No loot at risk');
        const dropsHtml = drops > 0
            ? `<span class="exp-bag-hud__stat exp-bag-hud__stat--drop">${drops} ${this.t('game.hunt.expedition.bagRiskDropsLabel', 'Drops')}</span>`
            : '';
        return `<div class="exp-bag-hud${hasLoot ? '' : ' exp-bag-hud--safe'}" role="status">
            <div class="exp-bag-hud__left">
                <span class="exp-bag-hud__label">${this.t('game.hunt.expedition.bagTitle', 'Expedition Bag')}</span>
                <div class="exp-bag-hud__stats">
                    <span class="exp-bag-hud__stat exp-bag-hud__stat--adena">+${bag.adenas.toLocaleString()}</span>
                    <span class="exp-bag-hud__stat exp-bag-hud__stat--xp">+${bag.xp.toLocaleString()} XP</span>
                    ${dropsHtml}
                </div>
            </div>
            <span class="exp-bag-hud__risk">${risk}</span>
        </div>`;
    }

    /** Extract confirm — raid results style: EXTRACT 100% vs DIE 50%. */
    static buildExtractConfirmHtml(): string {
        const bag = this.getBagSnapshot();
        const split = this.computeDeathBagSplit(bag);
        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const labDrops = this.t('game.hunt.expedition.bagRiskDropsLabel', 'Drops');
        const keepDrops = this.countBagDropStacks(bag.drops);
        const dieDrops = this.countBagDropStacks(split.kept.drops);

        const rows = (adena: number, xp: number, drops: number) =>
            `<div class="exp-summary__rows">
                <div class="exp-summary__row"><span>${labAdena}</span><strong class="exp-summary__adena">${adena.toLocaleString()}</strong></div>
                <div class="exp-summary__row"><span>${labXp}</span><strong class="exp-summary__xp">${xp.toLocaleString()}</strong></div>
                <div class="exp-summary__row"><span>${labDrops}</span><strong class="exp-summary__drop">${drops}</strong></div>
            </div>`;

        return `<div class="exp-risk-confirm exp-summary">
            <p class="exp-summary__headline">${this.t(
                'game.hunt.expedition.summaryHeadline',
                'Secure the bag now — or risk losing half.'
            )}</p>
            <div class="exp-summary__vs">
                <div class="exp-summary__col exp-summary__col--keep">
                    <div class="exp-summary__col-head">
                        <span class="exp-summary__pct">100%</span>
                        <span class="exp-summary__col-title">${this.t('game.hunt.expedition.summaryExtract', 'Extract')}</span>
                    </div>
                    ${rows(bag.adenas, bag.xp, keepDrops)}
                </div>
                <div class="exp-summary__col exp-summary__col--die">
                    <div class="exp-summary__col-head">
                        <span class="exp-summary__pct">50%</span>
                        <span class="exp-summary__col-title">${this.t('game.hunt.expedition.summaryDie', 'If you die')}</span>
                    </div>
                    ${rows(split.kept.adenas, split.kept.xp, dieDrops)}
                </div>
            </div>
            <p class="exp-summary__note">${this.t(
                'game.hunt.expedition.summaryNote',
                'Run upgrades clear when you leave.'
            )}</p>
        </div>`;
    }

    static computeDeathBagSplit(bag: { adenas: number; xp: number; drops: Record<string, number> }) {
        const adenaSplit = this.splitDeathShare(bag.adenas);
        const xpSplit = this.splitDeathShare(bag.xp);
        const dropsKept: Record<string, number> = {};
        const dropsLost: Record<string, number> = {};
        for (const item in bag.drops) {
            const qty = Math.max(0, Math.floor(Number(bag.drops[item]) || 0));
            if (qty <= 0) continue;
            const split = this.splitDeathShare(qty);
            if (split.kept > 0) dropsKept[item] = split.kept;
            if (split.lost > 0) dropsLost[item] = split.lost;
        }
        return {
            total: {
                adenas: Math.max(0, Math.floor(Number(bag.adenas) || 0)),
                xp: Math.max(0, Math.floor(Number(bag.xp) || 0)),
                drops: { ...bag.drops }
            },
            kept: { adenas: adenaSplit.kept, xp: xpSplit.kept, drops: dropsKept },
            lost: { adenas: adenaSplit.lost, xp: xpSplit.lost, drops: dropsLost }
        };
    }

    static bagHasAnyLoot(bag: { adenas: number; xp: number; drops: Record<string, number> }): boolean {
        if ((bag.adenas || 0) > 0 || (bag.xp || 0) > 0) return true;
        return Object.keys(bag.drops || {}).some((k) => (bag.drops[k] || 0) > 0);
    }

    static buildDeathLootColumn(
        title: string,
        bag: { adenas: number; xp: number; drops: Record<string, number> },
        tone: 'kept' | 'lost',
        emptyLabel: string
    ): string {
        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        let lines = '';
        if (bag.adenas > 0) {
            const valClass = tone === 'kept' ? 'exp-result-line__val--adena' : 'exp-result-line__val--hurt';
            const val = tone === 'kept' ? this.formatSigned(bag.adenas) : `-${bag.adenas.toLocaleString()}`;
            lines += this.buildResultLine(labAdena, val, valClass);
        }
        if (bag.xp > 0) {
            const valClass = tone === 'kept' ? 'exp-result-line__val--xp' : 'exp-result-line__val--hurt';
            const val = tone === 'kept' ? this.formatSigned(bag.xp) : `-${bag.xp.toLocaleString()}`;
            lines += this.buildResultLine(labXp, val, valClass);
        }
        for (const item in bag.drops) {
            const qty = bag.drops[item];
            if (qty <= 0) continue;
            const valClass = tone === 'kept' ? 'exp-result-line__val--drop' : 'exp-result-line__val--hurt';
            const val = tone === 'kept' ? `x${qty}` : `-x${qty}`;
            lines += this.buildResultLine(itemDropDisplayName(item), val, valClass);
        }
        const body = lines
            ? `<div class="forest-death-loot__lines">${lines}</div>`
            : `<p class="forest-death-loot__col-empty">${emptyLabel}</p>`;
        return `<div class="forest-death-loot__col forest-death-loot__col--${tone}">
            <h3 class="forest-death-loot__col-title">${title}</h3>
            ${body}
        </div>`;
    }

    static buildDeathSummaryHtml(
        split: ReturnType<typeof ExpeditionEngine.computeDeathBagSplit>,
        journey: number
    ): string {
        if (!this.bagHasAnyLoot(split.total)) {
            return `<p class="forest-death-loot__empty">${this.t('game.hunt.deathLootEmpty', 'Your expedition bag was empty.')}</p>`;
        }
        const journeyLine = this.t('game.hunt.deathLootJourney', 'Journey {n}', { n: journey });
        const ruleLine = this.t('game.hunt.deathLootRule', 'You keep half of your expedition bag.');
        const savedTitle = this.t('game.hunt.deathLootSaved', 'Kept (credited)');
        const lostTitle = this.t('game.hunt.deathLootLost', 'Lost');
        const savedCol = this.buildDeathLootColumn(savedTitle, split.kept, 'kept', '—');
        const lostCol = this.buildDeathLootColumn(lostTitle, split.lost, 'lost', '—');
        return `<p class="forest-death-loot__journey">${journeyLine}</p>
            <p class="forest-death-loot__rule">${ruleLine}</p>
            <div class="forest-death-loot__grid">${savedCol}${lostCol}</div>`;
    }

    static renderMap() {
        const mapContainer = document.getElementById('expedition-map-container');
        const combatArea = document.getElementById('area-cacada');
        const mobsContainer = document.getElementById('mobs-container');
        const botoesCombate = document.getElementById('botoes-combate');

        this.hideHub();
        if (mapContainer) mapContainer.style.display = 'flex';
        if (combatArea) combatArea.style.display = 'none';
        if (mobsContainer) mobsContainer.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';
        if (!mapContainer) return;

        const journey = this.state.journey;
        const rewardPct = Math.round((this.getJourneyRewardMult() - 1) * 100);
        const mobScalePct = Math.round((this.getJourneyMobAtkScale() - 1) * 100);
        const zoneRatePct = Math.round(this.getZoneRewardRate() * 100);

        const mapTitle = this.t('game.hunt.expedition.rogueMapTitle', 'Roguelike Expedition');
        const journeyLabel = this.t('game.hunt.expedition.journeyLabel', 'Journey {n}', { n: journey });
        const pickHint = this.getPathPickHint(journey, this.state.pathChoices.length);
        const mapRulesBtn = this.t('game.hunt.expedition.mapRulesBtn', 'Rules');
        const traitLabel = this.t('game.hunt.expedition.traitLabel', 'Enemy trait');
        const extractLabel = this.t('game.hunt.expedition.extract', 'Collect & exit');
        const pauseLabel = this.t('game.hunt.expedition.pauseBtn', 'Pause');

        if (this.state.pendingRareEvent) this.state.runPanelTab = 'path';

        const lootLabel = this.t('game.hunt.expedition.metaLoot', 'Loot bonus');
        const enemyLabel = this.t('game.hunt.expedition.metaEnemies', 'Enemy power');
        const zoneLabel = this.t('game.hunt.expedition.metaZone', 'Zone rate');
        const traitName = this.getTraitLabel(this.state.journeyTrait);

        this.detachHotbarBeforeMapWipe();

        let html = `
        <div class="expedition-panel expedition-panel--rogue">
            <div class="expedition-map-header expedition-map-header--rogue expedition-map-header--compact">
                <div class="expedition-map-header__row">
                    <div class="expedition-journey-badge" aria-hidden="true">
                        <span class="expedition-journey-badge__eyebrow">${this.t('game.hunt.expedition.journeyEyebrow', 'Journey')}</span>
                        <span class="expedition-journey-badge__num">${journey}</span>
                    </div>
                    <div class="expedition-map-header__brand">
                        <div class="expedition-map-header__text">
                            <h3 class="expedition-map-header__title">${mapTitle}</h3>
                            <p class="expedition-map-header__progress">${journeyLabel}</p>
                        </div>
                    </div>
                    <button type="button" class="btn-l2 expedition-map-header__rules" onclick="ExpeditionEngine.openRulesModal()">${mapRulesBtn}</button>
                </div>
                <div class="expedition-map-header__chips" role="list" aria-label="${traitLabel}">
                    <span class="expedition-meta-chip expedition-meta-chip--trait expedition-meta-chip--${this.state.journeyTrait}" role="listitem">${traitName}</span>
                    <span class="expedition-meta-chip expedition-meta-chip--gold" role="listitem">${lootLabel} +${rewardPct}%</span>
                    <span class="expedition-meta-chip expedition-meta-chip--danger" role="listitem">${enemyLabel} +${mobScalePct}%</span>
                    <span class="expedition-meta-chip" role="listitem">${zoneLabel} +${zoneRatePct}%</span>
                </div>
            </div>
            <div class="expedition-panel__main">
                ${this.buildRunPanelTabsHtml()}
                <div class="expedition-run-panel">${this.buildRunPanelContentHtml(journey, pickHint)}</div>
            </div>
            <div id="expedition-hotbar-slot" class="expedition-hotbar-slot" aria-label="Shortcuts"></div>
            <div class="expedition-panel__footer expedition-panel__footer--compact">
                <div class="expedition-bag-dock">
                    ${this.buildMapBagBarHtml()}
                    <div class="expedition-bag-bar__actions">
                        <button type="button" class="btn-l2 expedition-bag-bar__pause" onclick="ExpeditionEngine.pauseRunToHub()">${pauseLabel}</button>
                        <button type="button" class="btn-l2 expedition-bag__extract expedition-bag-bar__extract" onclick="ExpeditionEngine.promptExitAndExtract()">${extractLabel}</button>
                    </div>
                </div>
            </div>
        </div>`;

        mapContainer.innerHTML = html;
        this.setForestLayoutMode('map');
        const win = window as any;
        if (typeof win.renderizarBarraAtalhos === 'function') win.renderizarBarraAtalhos();
    }

    static clickPath(index: number) {
        const choice = this.state.pathChoices[index];
        if (!choice) return;
        if (this._offerMode) return;

        this.pendingPathIndex = index;
        this.resetNodeModalToPreviewMode();
        const preview = this.getPathPreview(choice.type);
        const win = window as any;

        const titleEl = document.getElementById('exp-node-title');
        const iconWrap = document.getElementById('exp-node-icon-wrap');
        const iconEl = document.getElementById('exp-node-icon');
        const descEl = document.getElementById('exp-node-desc');
        const outcomesEl = document.getElementById('exp-node-outcomes-list');
        const tagsEl = document.getElementById('exp-node-tags');

        if (titleEl) titleEl.innerText = preview.title;
        if (iconEl) iconEl.innerText = preview.icon;
        if (iconWrap) iconWrap.className = `exp-node-icon-wrap exp-node-icon-wrap--${choice.type}`;
        if (descEl) descEl.innerText = preview.desc;
        if (outcomesEl) outcomesEl.innerHTML = preview.outcomes.map((line) => `<li>${line}</li>`).join('');
        if (tagsEl) {
            tagsEl.innerHTML = preview.tags.map((tag) =>
                `<span class="exp-node-tag ${tag.cls}">${tag.text}</span>`
            ).join('');
        }

        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-node', 1600);
            const body = document.querySelector('.expedition-node-body') as HTMLElement | null;
            if (body) body.scrollTop = 0;
        }
    }

    static confirmNode() {
        if (this.pendingPathIndex === null) return;
        const choice = this.state.pathChoices[this.pendingPathIndex];
        this.pendingPathIndex = null;

        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-node');
        if (!choice) return;

        this.state.currentPath = choice.type;

        if (choice.type === 'combat' || choice.type === 'boss' || choice.type === 'elite') {
            this.startCombatPath(choice.type);
            try {
                if (typeof win.TutorialEngine !== 'undefined' && typeof win.TutorialEngine.notifyExpeditionNodeConfirmed === 'function') {
                    win.TutorialEngine.notifyExpeditionNodeConfirmed();
                }
            } catch (e) { /* ignore */ }
        } else if (choice.type === 'chest') {
            this.resolveChestPath();
        } else if (choice.type === 'merchant') {
            this.resolveMerchantPath();
        } else if (choice.type === 'forge') {
            this.resolveForgePath();
        } else if (choice.type === 'scout') {
            this.resolveScoutPath();
        } else if (choice.type === 'patrol') {
            this.resolvePatrolPath();
        } else if (choice.type === 'tracks') {
            this.resolveTracksPath();
        } else if (choice.type === 'warhorn') {
            this.resolveWarhornPath();
        } else if (choice.type === 'ambush') {
            this.resolveAmbushPath();
        }
    }

    static cancelNode() {
        if (this._offerMode) return;
        this.pendingPathIndex = null;
        this.resetNodeModalToPreviewMode();
        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-node');
    }

    static scalePlayerXpReward(rawXp: number): number {
        const win = window as any;
        const raw = Math.max(0, Math.floor(Number(rawXp) || 0));
        if (raw <= 0) return 0;
        const lv = Number(win.nivel) || 1;
        if (typeof win.EconomyBalance?.scaleNoviceXpGain === 'function') {
            return win.EconomyBalance.scaleNoviceXpGain(raw, lv);
        }
        return raw;
    }

    static applyBagLoot(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }, extraMult = 1) {
        const mult = extraMult * this.state.luckLootMult * this.getJourneyRewardMult();
        this.state.bag.adenas += Math.floor(lootTurno.adenas * mult);
        this.state.bag.xp += Math.floor(lootTurno.xp * mult);
        for (const item in lootTurno.drops) {
            const qty = Math.max(1, Math.floor(lootTurno.drops[item] * mult));
            this.state.bag.drops[item] = (this.state.bag.drops[item] || 0) + qty;
        }
        if (this.state.luckLootMult > 1) this.state.luckLootMult = 1;
    }

    static scaleLootForDisplay(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }, extraMult = 1) {
        const mult = extraMult * this.state.luckLootMult * this.getJourneyRewardMult();
        const drops: Record<string, number> = {};
        for (const item in lootTurno.drops) {
            drops[item] = Math.max(1, Math.floor(lootTurno.drops[item] * mult));
        }
        return {
            adenas: Math.floor(lootTurno.adenas * mult),
            xp: Math.floor(lootTurno.xp * mult),
            drops
        };
    }

    static buildMobTuning(pathType: ExpeditionPathType) {
        const win = window as any;
        const zoneId = this.state.zoneId;
        const rawBase = win.L2MINI_ZONAL_MOB_TUNING?.[zoneId] || { hp: 1, atk: 1, def: 1 };
        const playerLv = Number(win.nivel) || 1;
        const base = (typeof win.EconomyBalance?.resolveNoviceMobTune === 'function')
            ? win.EconomyBalance.resolveNoviceMobTune(rawBase, playerLv, zoneId)
            : rawBase;
        const journeyHpScale = this.getJourneyMobHpScale();
        const journeyAtkScale = this.getJourneyMobAtkScale();
        const journeyDefScale = (journeyHpScale + journeyAtkScale) / 2;
        let hp = base.hp * journeyHpScale;
        let atk = base.atk * journeyAtkScale;
        let def = base.def * journeyDefScale;
        // Novice No-Grade tuning crushes mob atk — partial recovery for fair expedition hits.
        if (zoneId === 'No-Grade' && playerLv <= 20) {
            atk *= 1.35;
        }
        let mobAtkSpdMult = 1;
        let championChance = base.championChance;

        if (pathType === 'elite') {
            hp *= 2.2;
            atk *= 1.45;
            championChance = 0.85;
        } else if (pathType === 'boss') {
            hp *= 4.5;
            atk *= 1.85;
            championChance = 1;
            if (this.isMilestoneBossJourney(this.state.journey)) {
                hp *= 1.4;
                atk *= 1.22;
            }
        }

        const trait = this.state.journeyTrait;
        if (trait === 'brutal') atk *= 1.22;
        if (trait === 'swift') mobAtkSpdMult = 0.72;
        if (trait === 'lethal') { atk *= 1.15; championChance = Math.min(1, (championChance ?? 0.05) + 0.2); }
        if (trait === 'armored') { def *= 1.32; hp *= 1.12; }
        if (trait === 'frenzied') { hp *= 1.1; atk *= 1.18; }

        const champJourney = this.getJourneyChampionPowerScale();
        const tunedChampHp = typeof base.championHpMult === 'number' ? base.championHpMult : 2.85;
        const tunedChampAtk = typeof base.championAtkMult === 'number' ? base.championAtkMult : 1.06;
        const championHpMult = 1 + (tunedChampHp - 1) * champJourney;
        const championAtkMult = 1 + (tunedChampAtk - 1) * champJourney;

        return {
            ...base,
            hp,
            atk,
            def,
            championChance,
            championHpMult,
            championAtkMult,
            mobAtkSpdMult,
        };
    }

    static restoreMobTuning() {
        const win = window as any;
        if ((this as any)._originalTuning && this.state.zoneId) {
            win.L2MINI_ZONAL_MOB_TUNING[this.state.zoneId] = (this as any)._originalTuning;
        }
        (this as any)._originalTuning = null;
    }

    static startCombatPath(pathType: ExpeditionPathType) {
        this._combatUiActive = true;
        this.state.combatInterrupted = false;
        this.state.currentPath = pathType;
        this.setForestLayoutMode('combat');

        const win = window as any;
        win.L2MINI_ZONAL_MOB_TUNING = win.L2MINI_ZONAL_MOB_TUNING || {};
        const zoneId = this.state.zoneId;
        const originalTuning = win.L2MINI_ZONAL_MOB_TUNING[zoneId] || { hp: 1, atk: 1, def: 1 };
        (this as any)._originalTuning = { ...originalTuning };

        let combatLootMult = 1;
        if (pathType === 'boss') combatLootMult = this.isMilestoneBossJourney(this.state.journey) ? 2.5 : 2;
        else if (pathType === 'elite') combatLootMult = 1.55;
        (this as any)._combatLootMult = combatLootMult;

        win.L2MINI_ZONAL_MOB_TUNING[zoneId] = this.buildMobTuning(pathType);
        this.syncNavigationLock();
        this.ensureRunVitalsForCombat();
        if (typeof win.atualizar === 'function') win.atualizar();
        // Persist path lock so reload mid-fight cannot free-re-pick another route.
        this.persistRun({ silent: true });
        win.procurarMonstros();
    }

    static onCombatWin(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }) {
        if (!this.state.active) return;

        this._combatUiActive = false;
        this.state.combatInterrupted = false;
        this.restoreMobTuning();

        const combatMult = (this as any)._combatLootMult || 1;
        const displayedLoot = this.scaleLootForDisplay(lootTurno, combatMult);
        this.applyBagLoot(lootTurno, combatMult);
        (this as any)._combatLootMult = 1;

        const path = this.state.currentPath;
        if (path === 'boss') this.state.runStats.bossesCleared += 1;
        else if (path === 'elite') this.state.runStats.elitesCleared += 1;
        else this.state.runStats.combatsWon += 1;

        this.showUpgradeModal(displayedLoot);
    }

    static resolveMerchantPath() {
        if (this.state.journey < 2) {
            this.resolvePatrolPath();
            return;
        }
        this._merchantPactStat = this.pickMerchantPactStat();
        const journeyMult = this.getJourneyRewardMult();
        const healCost = this.bagPctCost(0.4, Math.max(150, Math.floor(150 * journeyMult)));
        const pactCost = this.bagPctCost(0.55, Math.max(250, Math.floor(250 * journeyMult)));
        const pactLabel = this.runStatLabel(this._merchantPactStat);

        this.showOfferModal({
            icon: '🧳',
            title: this.t('game.hunt.expedition.offerMerchantTitle', 'Wandering Merchant'),
            desc: this.t(
                'game.hunt.expedition.offerMerchantDesc',
                'Choose one deal. Paid deals spend Adena from your expedition bag ({bag}).',
                { bag: this.getBagAdena().toLocaleString() }
            ),
            toneClass: 'merchant',
            offers: [
                {
                    id: 'heal',
                    icon: '💚',
                    titleKey: 'game.hunt.expedition.offerMerchantHealTitle',
                    titleFallback: 'Patch-up',
                    descKey: 'game.hunt.expedition.offerMerchantHealDesc',
                    descFallback: 'Restore most of your HP and MP.',
                    costAdena: healCost
                },
                {
                    id: 'supply',
                    icon: '📦',
                    titleKey: 'game.hunt.expedition.offerMerchantSupplyTitle',
                    titleFallback: 'Supply crate',
                    descKey: 'game.hunt.expedition.offerMerchantSupplyDesc',
                    descFallback: '2–5 random materials into the bag.',
                    costAdena: 0
                },
                {
                    id: 'pact',
                    icon: '📜',
                    titleKey: 'game.hunt.expedition.offerMerchantPactTitle',
                    titleFallback: 'Signed pact',
                    descKey: 'game.hunt.expedition.offerMerchantPactDesc',
                    descFallback: '+8% {stat} for this run.',
                    descParams: { stat: pactLabel },
                    costAdena: pactCost
                }
            ],
            onPick: (offerId) => this.applyMerchantOffer(offerId, healCost, pactCost)
        });
    }

    static applyMerchantOffer(id: string, healCost: number, pactCost: number): void {
        const win = window as any;
        const journeyMult = this.getJourneyRewardMult();
        let result: ExpeditionNodeResult;

        if (id === 'heal') {
            if (!this.spendBagAdena(healCost)) {
                this.resolveMerchantPath();
                return;
            }
            this.state.runStats.merchantsUsed += 1;
            const hpBefore = Number(win.playerHP) || 0;
            const mpBefore = Number(win.playerMP) || 0;
            const maxHp = Number(win.playerStats?.maxHp) || hpBefore;
            const maxMp = Number(win.playerStats?.maxMp) || mpBefore;
            const healPct = 0.6 + Math.random() * 0.4;
            win.playerHP = Math.min(maxHp, Math.max(hpBefore, Math.floor(maxHp * healPct)));
            win.playerMP = Math.min(maxMp, Math.max(mpBefore, Math.floor(maxMp * healPct)));
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
            win.atualizar();
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '💚',
                titleKey: 'game.hunt.expedition.resultMerchantHealTitle',
                titleFallback: 'Field patch-up',
                summaryKey: 'game.hunt.expedition.resultMerchantHealDesc',
                summaryFallback: 'The merchant\'s salves restore your line — Adena spent from the bag.',
                effects: {
                    hpRestored: Math.max(0, (Number(win.playerHP) || 0) - hpBefore),
                    mpRestored: Math.max(0, (Number(win.playerMP) || 0) - mpBefore),
                    bagAdenaLost: healCost
                }
            };
        } else if (id === 'pact') {
            if (!this.spendBagAdena(pactCost)) {
                this.resolveMerchantPath();
                return;
            }
            this.state.runStats.merchantsUsed += 1;
            const stat = this._merchantPactStat || this.pickMerchantPactStat();
            const boost = 8;
            this.state.runBuffs[stat] += boost;
            this.evaluateRunBuilds({ notify: true });
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
            win.atualizar();
            result = {
                nodeType: 'merchant',
                tone: 'warning',
                icon: '📜',
                titleKey: 'game.hunt.expedition.resultMerchantBuffTitle',
                titleFallback: 'Merchant contract',
                summaryKey: 'game.hunt.expedition.resultMerchantBuffDesc',
                summaryFallback: 'A signed pact boosts one run stat until you extract or fall.',
                summaryParams: { stat: this.runStatLabel(stat), pct: boost },
                effects: {
                    buffText: `+${boost}% ${this.runStatLabel(stat)}`,
                    bagAdenaLost: pactCost
                }
            };
        } else {
            this.state.runStats.merchantsUsed += 1;
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore', 'Life Stone'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.max(2, Math.floor((Math.random() * 4 + 2) * journeyMult));
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '📦',
                titleKey: 'game.hunt.expedition.resultMerchantGiftTitle',
                titleFallback: 'Merchant gift',
                summaryKey: 'game.hunt.expedition.resultMerchantGiftDesc',
                summaryFallback: 'Supplies added straight to your bag.',
                bag: { drops: { [mat]: matQty } }
            };
        }

        this._merchantPactStat = null;
        this.showResultModal(result);
    }

    static resolveForgePath() {
        const win = window as any;
        const forged = this.applyRandomForgeEnchant();
        this.state.runStats.forgesUsed += 1;

        if (forged.ok) {
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
            win.atualizar();
            this.showResultModal({
                nodeType: 'forge',
                tone: 'success',
                icon: '🔨',
                titleKey: 'game.hunt.expedition.resultForgeTitle',
                titleFallback: 'Field forge',
                summaryKey: 'game.hunt.expedition.resultForgeDesc',
                summaryFallback: '{item} ({slot}) +1 enchant for this run — now +{after} (was +{before}).',
                summaryParams: {
                    item: forged.itemName,
                    slot: forged.slotLabel,
                    before: forged.before,
                    after: forged.after
                },
                effects: {
                    buffText: this.t('game.hunt.expedition.resultForgeBuff', '+1 {item} ({before}→{after})', {
                        item: forged.itemName,
                        before: forged.before,
                        after: forged.after
                    })
                }
            });
            return;
        }

        const stat = this.rollRandomRunStat();
        const boost = 8;
        this.state.runBuffs[stat] += boost;
        this.evaluateRunBuilds({ notify: true });
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        win.atualizar();

        const forgeFailReason = (forged as { ok: false; reason: 'no_gear' | 'max_enchant' }).reason;
        const fallbackKey = forgeFailReason === 'no_gear'
            ? 'game.hunt.expedition.resultForgeFallbackNoGear'
            : 'game.hunt.expedition.resultForgeFallbackMax';
        const fallbackMsg = forgeFailReason === 'no_gear'
            ? 'Nothing equipped to enchant — sparks still boost a run stat.'
            : 'All gear is already +25 — sparks boost a run stat instead.';

        this.showResultModal({
            nodeType: 'forge',
            tone: forgeFailReason === 'no_gear' ? 'neutral' : 'warning',
            icon: '🔨',
            titleKey: 'game.hunt.expedition.resultForgeFallbackTitle',
            titleFallback: 'Anvil sparks',
            summaryKey: fallbackKey,
            summaryFallback: fallbackMsg,
            summaryParams: { stat: this.runStatLabel(stat), pct: boost },
            effects: { buffText: `+${boost}% ${this.runStatLabel(stat)}` }
        });
    }

    static resolveScoutPath() {
        const journeyMult = this.getJourneyRewardMult();
        const trait = this.state.journeyTrait;
        const early = this.state.journey < 2;
        const adenaGain = early ? 0 : Math.floor((Math.random() * 350 + 180) * journeyMult);
        const xpGain = this.scalePlayerXpReward(
            Math.floor(((early ? 50 : 60) + Math.random() * (early ? 50 : 120)) * journeyMult),
        );
        if (adenaGain > 0) this.state.bag.adenas += adenaGain;
        this.state.bag.xp += xpGain;

        const intelBits: string[] = [
            this.t('game.hunt.expedition.resultScoutIntel', 'Enemy trait: {trait}', {
                trait: this.t(`game.hunt.expedition.trait_${trait}`, trait)
            })
        ];
        if (!early) {
            const fightHeavy = Math.random() < 0.5;
            this.state.nextPathBias = fightHeavy ? 'fight' : 'safe';
            intelBits.push(fightHeavy
                ? this.t('game.hunt.expedition.resultScoutForesightFight', 'Next stretch looks fight-heavy')
                : this.t('game.hunt.expedition.resultScoutForesightSafe', 'Next stretch looks safer'));
        }

        this.state.runStats.scoutsUsed += 1;
        this.showResultModal({
            nodeType: 'scout',
            tone: 'neutral',
            icon: '🔭',
            titleKey: early ? 'game.hunt.expedition.resultScoutEarlyTitle' : 'game.hunt.expedition.resultScoutTitle',
            titleFallback: early ? 'Recon sweep' : 'Trail intel',
            summaryKey: early ? 'game.hunt.expedition.resultScoutEarlyDesc' : 'game.hunt.expedition.resultScoutDesc',
            summaryFallback: early
                ? 'You map the zone trait and earn march XP — no free Adena on the opening step.'
                : 'You read the land ahead — bonus bag loot and enemy intel.',
            summaryParams: {
                trait: this.t(`game.hunt.expedition.trait_${trait}`, trait)
            },
            bag: { adenas: adenaGain || undefined, xp: xpGain },
            effects: {
                buffText: intelBits.join(' · ')
            }
        });
    }

    static resolvePatrolPath() {
        const journeyMult = this.getJourneyRewardMult();
        const xpGain = this.scalePlayerXpReward(Math.floor((Math.random() * 140 + 90) * journeyMult));
        const adenaGain = this.state.journey >= 2
            ? Math.floor((Math.random() * 120 + 60) * journeyMult)
            : 0;
        this.state.bag.xp += xpGain;
        if (adenaGain > 0) this.state.bag.adenas += adenaGain;

        this.showResultModal({
            nodeType: 'patrol',
            tone: 'neutral',
            icon: '🚶',
            titleKey: 'game.hunt.expedition.resultPatrolTitle',
            titleFallback: 'Perimeter patrol',
            summaryKey: 'game.hunt.expedition.resultPatrolDesc',
            summaryFallback: 'You march the edge of the hunt zone — XP in the bag, no merchant handouts.',
            bag: { adenas: adenaGain || undefined, xp: xpGain }
        });
    }

    static resolveTracksPath() {
        const journeyMult = this.getJourneyRewardMult();
        const nextTrait = this.state.nextJourneyTrait;
        const xpGain = this.scalePlayerXpReward(Math.floor((Math.random() * 80 + 70) * journeyMult));
        this.state.bag.xp += xpGain;

        let adenaGain = 0;
        let drops: Record<string, number> | undefined;
        const extraBits: string[] = [
            this.t('game.hunt.expedition.resultTracksIntel', 'Next journey trait: {trait}', {
                trait: this.t(`game.hunt.expedition.trait_${nextTrait}`, nextTrait)
            })
        ];
        if (Math.random() < 0.5) {
            const guaranteed = this.rollTracksPathGuarantee(this.state.journey);
            this.state.nextPathGuarantee = guaranteed;
            extraBits.push(this.t(
                'game.hunt.expedition.resultTracksGuarantee',
                'Next path includes: {path}',
                { path: this.pathTypeLabel(guaranteed) }
            ));
        }
        if (Math.random() < 0.3) {
            if (Math.random() < 0.5) {
                adenaGain = Math.floor((Math.random() * 120 + 40) * journeyMult);
                this.state.bag.adenas += adenaGain;
                extraBits.push(this.t('game.hunt.expedition.resultTracksBonusAdena', 'Scavenged coins along the trail'));
            } else {
                const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal'];
                const mat = mats[Math.floor(Math.random() * mats.length)];
                this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + 1;
                drops = { [mat]: 1 };
                extraBits.push(this.t('game.hunt.expedition.resultTracksBonusMat', 'Found a spare material'));
            }
        }

        this.showResultModal({
            nodeType: 'tracks',
            tone: 'neutral',
            icon: '👣',
            titleKey: 'game.hunt.expedition.resultTracksTitle',
            titleFallback: 'Fresh tracks',
            summaryKey: 'game.hunt.expedition.resultTracksDesc',
            summaryFallback: 'You read signs on the trail — XP logged and the next journey trait revealed.',
            summaryParams: {
                trait: this.t(`game.hunt.expedition.trait_${nextTrait}`, nextTrait)
            },
            bag: { xp: xpGain, adenas: adenaGain || undefined, drops },
            effects: {
                buffText: extraBits.join(' · ')
            }
        });
    }

    static resolveWarhornPath() {
        const win = window as any;
        const mage = typeof win.isClasseMagica === 'function' && win.isClasseMagica(win.charClass);
        const atkLabel = this.runStatLabel(mage ? 'mAtkPct' : 'pAtkPct');

        this.showOfferModal({
            icon: '📯',
            title: this.t('game.hunt.expedition.offerWarhornTitle', 'War Horn'),
            desc: this.t(
                'game.hunt.expedition.offerWarhornDesc',
                'Sound the rally — pick one battle cry for this run.'
            ),
            toneClass: 'warhorn',
            offers: [
                {
                    id: 'assault',
                    icon: '⚔️',
                    titleKey: 'game.hunt.expedition.offerWarhornAssaultTitle',
                    titleFallback: 'Assault',
                    descKey: 'game.hunt.expedition.offerWarhornAssaultDesc',
                    descFallback: '+10% {stat} for this run.',
                    descParams: { stat: atkLabel }
                },
                {
                    id: 'tempo',
                    icon: '💨',
                    titleKey: 'game.hunt.expedition.offerWarhornTempoTitle',
                    titleFallback: 'Tempo',
                    descKey: 'game.hunt.expedition.offerWarhornTempoDesc',
                    descFallback: '+8% Atk Spd · −12% skill CD.'
                },
                {
                    id: 'iron',
                    icon: '🛡️',
                    titleKey: 'game.hunt.expedition.offerWarhornIronTitle',
                    titleFallback: 'Iron Rally',
                    descKey: 'game.hunt.expedition.offerWarhornIronDesc',
                    descFallback: '+7% P.Def · +8% Max HP.'
                }
            ],
            onPick: (offerId) => this.applyWarhornOffer(offerId)
        });
    }

    static applyWarhornOffer(id: string): void {
        const win = window as any;
        const mage = typeof win.isClasseMagica === 'function' && win.isClasseMagica(win.charClass);
        const mainStat: keyof ExpeditionRunBuffs = mage ? 'mAtkPct' : 'pAtkPct';
        let buffText = '';
        let summaryKey = 'game.hunt.expedition.resultWarhornAssaultDesc';
        let summaryFallback = 'Assault cry — your weapon arm surges.';

        if (id === 'tempo') {
            this.state.runBuffs.atkSpeedPct += 8;
            this.state.runBuffs.skillCdReductionPct += 12;
            buffText = `+8% ${this.runStatLabel('atkSpeedPct')} · −12% ${this.runStatLabel('skillCdReductionPct')}`;
            summaryKey = 'game.hunt.expedition.resultWarhornTempoDesc';
            summaryFallback = 'Tempo cry — cast and swing faster.';
        } else if (id === 'iron') {
            this.state.runBuffs.pDefPct += 7;
            this.state.runBuffs.maxHpPct += 8;
            buffText = `+7% ${this.runStatLabel('pDefPct')} · +8% ${this.runStatLabel('maxHpPct')}`;
            summaryKey = 'game.hunt.expedition.resultWarhornIronDesc';
            summaryFallback = 'Iron Rally — hold the line.';
        } else {
            this.state.runBuffs[mainStat] += 10;
            buffText = `+10% ${this.runStatLabel(mainStat)}`;
            summaryKey = 'game.hunt.expedition.resultWarhornAssaultDesc';
            summaryFallback = 'Assault cry — your weapon arm surges.';
        }

        this.evaluateRunBuilds({ notify: true });
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        win.atualizar();

        this.showResultModal({
            nodeType: 'warhorn',
            tone: 'success',
            icon: '📯',
            titleKey: 'game.hunt.expedition.resultWarhornTitle',
            titleFallback: 'War horn',
            summaryKey,
            summaryFallback,
            summaryParams: { stat: this.runStatLabel(mainStat) },
            effects: { buffText }
        });
    }

    static resolveAmbushPath() {
        const win = window as any;
        const journeyMult = this.getJourneyRewardMult();
        const early = this.state.journey < 2;
        const successRoll = early ? 0.55 : 0.62;

        if (Math.random() < successRoll) {
            const adenaGain = Math.floor((Math.random() * (early ? 220 : 380) + (early ? 80 : 140)) * journeyMult);
            this.state.bag.adenas += adenaGain;
            let drops: Record<string, number> | undefined;
            if (!early && Math.random() < 0.45) {
                const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal'];
                const mat = mats[Math.floor(Math.random() * mats.length)];
                const matQty = Math.max(1, Math.floor((Math.random() * 2 + 1) * journeyMult));
                this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
                drops = { [mat]: matQty };
            }
            this.showResultModal({
                nodeType: 'ambush',
                tone: 'success',
                icon: '🌿',
                titleKey: 'game.hunt.expedition.resultAmbushWinTitle',
                titleFallback: 'Ambush turned',
                summaryKey: 'game.hunt.expedition.resultAmbushWinDesc',
                summaryFallback: 'You sprung the trap first — scraps to the bag.',
                bag: { adenas: adenaGain, drops }
            });
        } else {
            const pct = early ? 0.16 : 0.12;
            const dmg = Math.floor(win.playerStats.maxHp * pct);
            win.playerHP = Math.max(1, win.playerHP - dmg);
            win.atualizar();
            this.showResultModal({
                nodeType: 'ambush',
                tone: 'danger',
                icon: '🌿',
                titleKey: 'game.hunt.expedition.resultAmbushFailTitle',
                titleFallback: 'Caught in the brush',
                summaryKey: 'game.hunt.expedition.resultAmbushFailDesc',
                summaryFallback: 'Snares and blades nick you — use potions, then pick your next path.',
                effects: { hpLost: dmg }
            });
        }
    }

    static resolveChestPath() {
        if (this.state.journey < 2) {
            this.resolvePatrolPath();
            return;
        }
        const win = window as any;
        const journeyMult = this.getJourneyRewardMult();
        const isMimic = Math.random() < 0.18;
        let result: ExpeditionNodeResult;

        this.state.runStats.chestsOpened += 1;

        if (isMimic) {
            const dmg = Math.floor(win.playerStats.maxHp * 0.28);
            win.playerHP = Math.max(1, win.playerHP - dmg);
            win.atualizar();
            result = {
                nodeType: 'chest',
                tone: 'danger',
                icon: '🦷',
                titleKey: 'game.hunt.expedition.resultChestMimicTitle',
                titleFallback: 'Mimic attack!',
                summaryKey: 'game.hunt.expedition.resultChestMimicDesc',
                summaryFallback: 'No upgrade and no loot — only pain. Next journey hits harder.',
                effects: { hpLost: dmg }
            };
        } else {
            const adenaGain = Math.floor((Math.random() * 700 + 250) * journeyMult);
            this.state.bag.adenas += adenaGain;
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.max(1, Math.floor((Math.random() * 4 + 2) * journeyMult));
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            result = {
                nodeType: 'chest',
                tone: 'success',
                icon: '🎁',
                titleKey: 'game.hunt.expedition.resultChestLootTitle',
                titleFallback: 'Treasure found',
                summaryKey: 'game.hunt.expedition.resultChestLootDesc',
                summaryFallback: 'Quick bag loot — you skipped the fight and any upgrade card.',
                bag: { adenas: adenaGain, drops: { [mat]: matQty } }
            };
        }

        this.showResultModal(result);
    }

    static extract() {
        if (!this.state.active) return;
        this.finishExpedition(true);
    }

    static reset() {
        this.restoreMobTuning();
        this._combatUiActive = false;
        this._pendingStartZoneAfterExtract = null;
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;
        (this as any)._savedRunVitals = null;
        this.state = this.createInitialState('');
        this.syncNavigationLock();
        this.showHub();
        this.wireStartButton();
    }

    static finishExpedition(success: boolean, opts?: { skipVictoryModal?: boolean }) {
        if (!this.state.active) return;
        const win = window as any;
        this.restoreMobTuning();
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;
        (this as any)._savedRunVitals = null;

        const bagSnapshot = {
            adenas: this.state.bag.adenas,
            xp: this.state.bag.xp,
            drops: { ...this.state.bag.drops }
        };
        const journeySnapshot = this.state.journey;
        const statsSnapshot = { ...this.state.runStats };
        const buffsSnapshot = { ...this.state.runBuffs };
        const extractSummary = success
            ? this.buildExtractSummary(journeySnapshot, statsSnapshot, buffsSnapshot)
            : '';

        let deathSummaryHtml = '';
        let xpReward = 0;
        let adenaKeptForMeta = 0;

        if (success) {
            win.adenas = (Number(win.adenas) || 0) + bagSnapshot.adenas;
            for (const itemDrop in bagSnapshot.drops) {
                if (itemDrop === 'Ancient Coin') {
                    win.ancientCoins = (Number(win.ancientCoins) || 0) + bagSnapshot.drops[itemDrop];
                    continue;
                }
                if (win.InventoryManager?.adicionarStack) {
                    win.InventoryManager.adicionarStack(itemDrop, bagSnapshot.drops[itemDrop]);
                } else if (win.inventario[itemDrop]) win.inventario[itemDrop] += bagSnapshot.drops[itemDrop];
                else win.inventario[itemDrop] = bagSnapshot.drops[itemDrop];
            }
            xpReward = bagSnapshot.xp;
            adenaKeptForMeta = bagSnapshot.adenas;
        } else {
            const deathSplit = this.computeDeathBagSplit(bagSnapshot);
            deathSummaryHtml = this.buildDeathSummaryHtml(deathSplit, journeySnapshot);
            win.adenas = (Number(win.adenas) || 0) + deathSplit.kept.adenas;
            for (const itemDrop in deathSplit.kept.drops) {
                const keptAmount = deathSplit.kept.drops[itemDrop];
                if (keptAmount <= 0) continue;
                if (itemDrop === 'Ancient Coin') {
                    win.ancientCoins = (Number(win.ancientCoins) || 0) + keptAmount;
                    continue;
                }
                if (win.InventoryManager?.adicionarStack) {
                    win.InventoryManager.adicionarStack(itemDrop, keptAmount);
                } else if (win.inventario[itemDrop]) win.inventario[itemDrop] += keptAmount;
                else win.inventario[itemDrop] = keptAmount;
            }
            xpReward = deathSplit.kept.xp;
            adenaKeptForMeta = deathSplit.kept.adenas;
        }

        if (typeof win.aplicarXpGanhoFloresta === 'function' && xpReward > 0) {
            win.aplicarXpGanhoFloresta(xpReward);
        }

        const zoneForMeta = this.state.zoneId || this.getCurrentHuntZoneId();
        if (typeof win.ExpeditionMeta?.recordOutcome === 'function') {
            win.ExpeditionMeta.recordOutcome({
                zoneId: zoneForMeta,
                journey: journeySnapshot,
                adenaKept: adenaKeptForMeta,
                outcome: success ? 'extract' : 'death',
            });
        }

        // Clear run BEFORE save so expeditionRun is null after extract/death payout.
        this.state = this.createInitialState('');
        this._combatUiActive = false;
        this.syncNavigationLock();

        win.atualizar();
        if (typeof win.salvarJogo === 'function') win.salvarJogo();

        if (success) {
            // registrarProgressoMissaoDiaria also forwards to RetentionEngine.onGameEvent
            if (typeof win.registrarProgressoMissaoDiaria === 'function') {
                win.registrarProgressoMissaoDiaria('expedition_complete', 1);
            }
            if (!opts?.skipVictoryModal) {
                if (typeof win.setLootTurno === 'function') {
                    win.setLootTurno(bagSnapshot);
                } else {
                    win.lootTurno = bagSnapshot;
                }
                win.expeditionExtractSummary = extractSummary;
                win.mostrarResumoVitoria();
            }
        } else {
            win.expeditionDeathSummaryHtml = deathSummaryHtml;
            win.showForestDeathScreen();
        }

        win.prepararTelaCacada();
        if (!this.state.active) {
            this.restoreGameHotbar();
            this.showHub();
            this.syncHubParkedHint();
        }
        this.wireStartButton();
    }

    static onPlayerDeath() {
        if (this.state.active) this.finishExpedition(false);
    }
}

ExpeditionEngine.init();
