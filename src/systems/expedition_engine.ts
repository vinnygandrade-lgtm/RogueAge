import { itemDropDisplayName } from '../combat/combat_i18n';

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
    critRatePct: number;
    atkSpeedPct: number;
    maxHpPct: number;
    poisonResPct: number;
    bleedResPct: number;
    /** Bonus to passive HP regen ticks during the run (+10% per card, capped). */
    hpRegenPct: number;
    /** Reduces skill MP cost during the run (−15% per card, capped at 60% total). */
    mpCostReductionPct: number;
}

export interface ExpeditionPathChoice {
    id: string;
    type: ExpeditionPathType;
}

export type ExpeditionRunPanelTab = 'path' | 'stats' | 'gear';

export interface ExpeditionState {
    active: boolean;
    zoneId: string;
    journey: number;
    pathChoices: ExpeditionPathChoice[];
    currentPath: ExpeditionPathType | null;
    /** Set when last journey picked a non-combat route; next journey is fights-only. */
    combatOnlyNextJourney: boolean;
    /** True while the current map step was forced to fights-only (UI hint). */
    combatOnlyThisJourney: boolean;
    runBuffs: ExpeditionRunBuffs;
    /** Temporary +enchant on equipped gear — reverts when the run ends (not saved). */
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

const ZONE_REWARD_RATE: Record<string, number> = {
    'No-Grade': 0.01,
    D: 0.02,
    C: 0.04,
    B: 0.06,
    A: 0.08,
    S: 0.1
};

const JOURNEY_TRAITS: JourneyMobTrait[] = ['brutal', 'swift', 'lethal', 'armored', 'frenzied'];

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
        id: 'mp_efficiency',
        icon: '🔷',
        stat: 'mpCostReductionPct',
        value: 15,
        titleKey: 'game.hunt.expedition.upgradeMpEfficiencyTitle',
        titleFallback: 'Arcane Efficiency',
        descKey: 'game.hunt.expedition.upgradeMpEfficiencyDesc',
        descFallback: '−15% MP cost on skills for this run'
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
    static lastCombatLoot: ExpeditionBagDelta | null = null;
    static _resultSkipsAdvance = false;
    static _forestLayoutMode: 'hub' | 'map' | 'combat' | 'idle' = 'idle';
    /** True while expedition combat UI is active (path chosen — no map / no flee). */
    static _combatUiActive = false;

    static isExpeditionCombatUiActive(): boolean {
        return !!(this.state.active && this._combatUiActive);
    }

    /** Original `#hotbar-home-anchor` parent — restore when leaving expedition map/combat. */
    static _hotbarDockRestore: { parent: HTMLElement; next: ChildNode | null } | null = null;

    static captureHotbarHomeAnchor() {
        if (this._hotbarDockRestore) return;
        const anchor = document.getElementById('hotbar-home-anchor');
        if (!anchor?.parentElement) return;
        this._hotbarDockRestore = { parent: anchor.parentElement, next: anchor.nextSibling };
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

    /** Move bar back to `#screen-game` footer and show it (map wipe destroys docked nodes). */
    static restoreGameHotbar() {
        this.captureHotbarHomeAnchor();
        this.restoreHotbarHomeAnchor();

        const anchor = document.getElementById('hotbar-home-anchor');
        const barra = document.getElementById('barra-de-atalhos-dinamica');
        if (anchor) {
            anchor.style.removeProperty('display');
            anchor.removeAttribute('aria-hidden');
        }
        if (barra) barra.style.removeProperty('display');

        const win = window as any;
        if (typeof win.renderizarBarraAtalhos === 'function') {
            win.renderizarBarraAtalhos();
        } else if (barra) {
            barra.style.setProperty('display', 'grid', 'important');
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
        anchor.style.removeProperty('display');
        barra.style.setProperty('display', 'grid', 'important');
    }

    static syncExpeditionHotbar(mode: 'hub' | 'map' | 'combat' | 'idle') {
        const combatSlot = document.getElementById('expedition-combat-hotbar-slot');
        if (combatSlot && !combatSlot.contains(document.getElementById('hotbar-home-anchor'))) {
            combatSlot.setAttribute('aria-hidden', 'true');
        }

        if (!this.state.active) {
            this.restoreGameHotbar();
            return;
        }

        if (mode === 'map') {
            this.dockHotbarToSlot('expedition-hotbar-slot');
            return;
        }

        if (mode === 'combat') {
            this.dockHotbarToSlot('expedition-combat-hotbar-slot');
            return;
        }

        if (mode === 'hub') {
            this.dockHotbarToSlot(null);
            const anchor = document.getElementById('hotbar-home-anchor');
            const barra = document.getElementById('barra-de-atalhos-dinamica');
            if (anchor) anchor.style.setProperty('display', 'none', 'important');
            if (barra) barra.style.setProperty('display', 'none', 'important');
        }
    }

    static createInitialState(zoneId: string): ExpeditionState {
        return {
            active: false,
            zoneId,
            journey: 1,
            pathChoices: [],
            currentPath: null,
            combatOnlyNextJourney: false,
            combatOnlyThisJourney: false,
            runBuffs: ExpeditionEngine.emptyRunBuffs(),
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
            critRatePct: 0,
            atkSpeedPct: 0,
            maxHpPct: 0,
            poisonResPct: 0,
            bleedResPct: 0,
            hpRegenPct: 0,
            mpCostReductionPct: 0
        };
    }

    /** Passive HP regen multiplier during an active run (1.0 = base, 1.1 = +10% card). */
    static getHpRegenMult(): number {
        if (!this.state.active) return 1;
        const pct = Math.min(100, Math.max(0, Number(this.state.runBuffs.hpRegenPct) || 0));
        return 1 + pct / 100;
    }

    /** Effective MP cost for a skill during an active expedition run (min 1 when base > 0). */
    static getSkillMpCost(baseMp: number): number {
        const base = Math.max(0, Math.floor(Number(baseMp) || 0));
        if (!base) return 0;
        if (!this.state.active) return base;
        const pct = Math.min(60, Math.max(0, Number(this.state.runBuffs.mpCostReductionPct) || 0));
        return Math.max(1, Math.floor(base * (1 - pct / 100)));
    }

    static emptyRunEnchantBonus(): ExpeditionRunEnchantBonus {
        return { weapon: 0, armor: 0, neck: 0, ear1: 0, ear2: 0, ring1: 0, ring2: 0 };
    }

    static getRunEnchantBonus(slot: ExpeditionEnchantSlot): number {
        if (!this.state.active) return 0;
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

    /** Roguelike curve: journey 1 starts soft (3 mobs ok), then ramps each step. */
    static getJourneyMobScale(): number {
        const j = Math.max(1, Math.floor(Number(this.state.journey) || 1));
        const RUN_START = 0.66;
        const RUN_STEP = 0.07;
        return RUN_START + (j - 1) * RUN_STEP;
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
            'pAtkPct', 'mAtkPct', 'pDefPct', 'critRatePct', 'atkSpeedPct', 'maxHpPct', 'poisonResPct', 'bleedResPct', 'hpRegenPct', 'mpCostReductionPct'
        ];
        return statKeys[Math.floor(Math.random() * statKeys.length)];
    }

    static runStatLabel(stat: keyof ExpeditionRunBuffs): string {
        const labels: Record<keyof ExpeditionRunBuffs, [string, string]> = {
            pAtkPct: ['game.hunt.expedition.runStatPatk', 'P.Atk'],
            mAtkPct: ['game.hunt.expedition.runStatMatk', 'M.Atk'],
            pDefPct: ['game.hunt.expedition.runStatPdef', 'P.Def'],
            critRatePct: ['game.hunt.expedition.runStatCrit', 'Crit'],
            atkSpeedPct: ['game.hunt.expedition.runStatSpd', 'Spd'],
            maxHpPct: ['game.hunt.expedition.runStatHp', 'HP'],
            poisonResPct: ['game.hunt.expedition.runStatPoisonRes', 'Poison res'],
            bleedResPct: ['game.hunt.expedition.runStatBleedRes', 'Bleed res'],
            hpRegenPct: ['game.hunt.expedition.runStatHpRegen', 'HP regen'],
            mpCostReductionPct: ['game.hunt.expedition.runStatMpEfficiency', 'MP cost']
        };
        const [key, fb] = labels[stat];
        return this.t(key, fb);
    }

    /** Three path cards per journey — fight routes vs safe loot. Journey 10/20/… = mandatory boss gate. */
    static generatePathChoices(journey: number): ExpeditionPathChoice[] {
        if (this.isMilestoneBossJourney(journey)) {
            this.state.combatOnlyThisJourney = false;
            return [{ id: `j${journey}_milestone_boss`, type: 'boss' }];
        }

        if (this.state.combatOnlyNextJourney) {
            this.state.combatOnlyNextJourney = false;
            this.state.combatOnlyThisJourney = true;
            return this.buildCombatOnlyPathChoices(journey);
        }

        this.state.combatOnlyThisJourney = false;

        if (journey < 2) {
            return this.shuffle([
                { id: `j${journey}_combat`, type: 'combat' },
                { id: `j${journey}_elite`, type: 'elite' }
            ]);
        }

        const slotA: ExpeditionPathType = journey >= 5 && Math.random() < 0.35 ? 'elite' : 'combat';
        const slotB: ExpeditionPathType = journey >= 3 && Math.random() < 0.28 ? 'boss' : (Math.random() < 0.4 ? 'elite' : 'combat');
        const slotC = this.pickSafePathType(journey);

        const types = this.shuffle([slotA, slotB, slotC]);
        return types.map((type, i) => ({ id: `j${journey}_${i}_${type}`, type }));
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

    static getRunBuffMults(): { pAtk: number; mAtk: number; pDef: number; crit: number; atkSpeed: number; maxHp: number } {
        const b = this.state.runBuffs;
        return {
            pAtk: 1 + b.pAtkPct / 100,
            mAtk: 1 + b.mAtkPct / 100,
            pDef: 1 + b.pDefPct / 100,
            crit: 1 + b.critRatePct / 100,
            atkSpeed: Math.max(0.5, 1 - b.atkSpeedPct / 100),
            maxHp: 1 + b.maxHpPct / 100
        };
    }

    static applyRunBuffsToPlayerStats(): void {
        if (!this.state.active) return;
        const win = window as any;
        const ps = win.playerStats;
        if (!ps) return;
        const buffed = this.computeRunBuffedStats({
            pAtk: ps.pAtk,
            mAtk: ps.mAtk,
            pDef: ps.pDef,
            critRate: ps.critRate,
            atkSpeed: ps.atkSpeed,
            maxHp: ps.maxHp
        });
        const oldMax = ps.maxHp;
        ps.pAtk = buffed.pAtk;
        ps.mAtk = buffed.mAtk;
        ps.pDef = buffed.pDef;
        ps.critRate = buffed.critRate;
        ps.atkSpeed = buffed.atkSpeed;
        ps.maxHp = buffed.maxHp;
        if (typeof win.playerHP === 'number' && oldMax > 0) {
            win.playerHP = Math.min(ps.maxHp, Math.floor(win.playerHP * (ps.maxHp / oldMax)));
        }
    }

    static computeRunBuffedStats(base: {
        pAtk: number;
        mAtk: number;
        pDef: number;
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
            critRate: typeof win.applyCritRateCap === 'function'
                ? win.applyCritRateCap(Math.floor(base.critRate * m.crit))
                : Math.min(70, Math.floor(base.critRate * m.crit)),
            atkSpeed: Math.max(250, Math.floor(base.atkSpeed * m.atkSpeed)),
            maxHp: Math.floor(base.maxHp * m.maxHp)
        };
    }

    static getUpgradeStatSnapshot(): {
        base: { pAtk: number; mAtk: number; pDef: number; mDef: number; critRate: number; atkSpeed: number; maxHp: number };
        total: { pAtk: number; mAtk: number; pDef: number; critRate: number; atkSpeed: number; maxHp: number };
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
            { label: this.t('game.hunt.expedition.upgradeStatMdef', 'M.Def'), baseVal: base.mDef, totalVal: base.mDef, noRunBuff: true },
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
            ['pDefPct', '🛡️', 'defense'],
            ['maxHpPct', '❤️', 'defense'],
            ['hpRegenPct', '💚', 'regen'],
            ['poisonResPct', '☠️', 'resist'],
            ['bleedResPct', '🩸', 'resist'],
            ['mpCostReductionPct', '🔷', 'resist']
        ];
        for (const [stat, icon, tone] of pctLines) {
            const val = b[stat];
            if (!val) continue;
            const isRes = stat === 'poisonResPct' || stat === 'bleedResPct' || stat === 'mpCostReductionPct';
            const valText = `${isRes ? '−' : '+'}${val}%`;
            chips.push(`<span class="exp-run-upgrade-chip exp-run-upgrade-chip--${tone}">
                <span class="exp-run-upgrade-chip__icon" aria-hidden="true">${icon}</span>
                <span class="exp-run-upgrade-chip__val">${valText}</span>
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
            { label: this.t('game.hunt.expedition.upgradeStatMdef', 'M.Def'), baseVal: base.mDef, totalOnly: true },
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
        const b = this.state.runBuffs;
        const pctLines: [keyof ExpeditionRunBuffs, string][] = [
            ['pAtkPct', '⚔️'],
            ['mAtkPct', '✨'],
            ['pDefPct', '🛡️'],
            ['critRatePct', '🎯'],
            ['atkSpeedPct', '💨'],
            ['maxHpPct', '❤️'],
            ['hpRegenPct', '💚'],
            ['poisonResPct', '☠️'],
            ['bleedResPct', '🩸'],
            ['mpCostReductionPct', '🔷']
        ];
        for (const [stat, icon] of pctLines) {
            const val = b[stat];
            if (!val) continue;
            const isRes = stat === 'poisonResPct' || stat === 'bleedResPct' || stat === 'mpCostReductionPct';
            lines.push(`${icon} ${isRes ? '−' : '+'}${val}% ${this.runStatLabel(stat)}`);
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
            { id: 'gear', labelKey: 'game.hunt.expedition.runTabGear', fallback: 'Gear' }
        ];
        const rareLocked = this.state.pendingRareEvent;
        return `<div class="expedition-run-tabs" role="tablist" aria-label="${this.t('game.hunt.expedition.runTabsLabel', 'Expedition run panels')}">
            ${tabs.map(({ id, labelKey, fallback }) => {
                const active = this.state.runPanelTab === id;
                const disabled = rareLocked && id !== 'path';
                return `<button type="button" role="tab" class="expedition-run-tab${active ? ' expedition-run-tab--active' : ''}${disabled ? ' expedition-run-tab--disabled' : ''}"
                    aria-selected="${active ? 'true' : 'false'}"${disabled ? ' disabled' : ''}
                    onclick="ExpeditionEngine.setRunPanelTab('${id}')">${this.t(labelKey, fallback)}</button>`;
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
            return;
        }
        this.advanceJourney();
    }

    static advanceJourney() {
        this._combatUiActive = false;

        const lastPath = this.state.currentPath;
        if (lastPath && !this.isCombatPathType(lastPath)) {
            this.state.combatOnlyNextJourney = true;
        }

        this.state.journey += 1;
        this.state.journeyTrait = this.state.nextJourneyTrait;
        this.state.nextJourneyTrait = this.rollJourneyTrait();
        this.state.currentPath = null;
        this.refreshJourneyPhase();

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        this.renderMap();
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

    static showUpgradeModal(loot: ExpeditionBagDelta) {
        const win = window as any;
        this.pendingUpgradeOptions = this.rollUpgradeOptions(3);
        this.lastCombatLoot = loot;

        const lootEl = document.getElementById('exp-upgrade-loot');
        if (lootEl) {
            const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
            const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
            let html = '';
            if (loot.adenas) html += this.buildResultLine(labAdena, this.formatSigned(loot.adenas), 'exp-result-line__val--adena');
            if (loot.xp) html += this.buildResultLine(labXp, this.formatSigned(loot.xp), 'exp-result-line__val--xp');
            if (loot.drops) {
                for (const item in loot.drops) {
                    if (loot.drops[item] > 0) {
                        html += this.buildResultLine(itemDropDisplayName(item), `x${loot.drops[item]}`, 'exp-result-line__val--drop');
                    }
                }
            }
            lootEl.innerHTML = html || `<span class="exp-upgrade-loot-empty">${this.t('game.hunt.expedition.upgradeNoLoot', 'Fight cleared.')}</span>`;
        }

        const grid = document.getElementById('exp-upgrade-cards');
        if (grid) {
            grid.innerHTML = this.pendingUpgradeOptions.map((up, idx) => `
                <button type="button" class="exp-upgrade-card exp-upgrade-card--${up.id}${up.legendary ? ' exp-upgrade-card--legendary' : ''}" onclick="ExpeditionEngine.pickUpgrade(${idx})">
                    ${up.legendary ? `<span class="exp-upgrade-card__legend">${this.t('game.hunt.expedition.upgradeLegendBadge', 'LEGENDARY')}</span>` : ''}
                    <span class="exp-upgrade-card__icon">${up.icon}</span>
                    <span class="exp-upgrade-card__body">
                        <span class="exp-upgrade-card__title">${this.t(up.titleKey, up.titleFallback)}</span>
                        <span class="exp-upgrade-card__desc">${this.t(up.descKey, up.descFallback)}</span>
                    </span>
                    <span class="exp-upgrade-card__pick">${this.t('game.hunt.expedition.upgradePick', 'Pick')}</span>
                </button>
            `).join('');
        }

        const titleEl = document.getElementById('exp-upgrade-title');
        if (titleEl) titleEl.innerText = this.t('game.hunt.expedition.upgradeTitle', 'Choose your upgrade');

        this.refreshUpgradeDom();

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        if (typeof win.abrirModal === 'function') win.abrirModal('janela-expedition-upgrade', 1600);
    }

    static refreshUpgradeDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-upgrade');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static pickUpgrade(index: number) {
        const up = this.pendingUpgradeOptions[index];
        if (!up) return;

        this.state.runBuffs[up.stat] += up.value;
        this.state.runStats.upgradesTaken += 1;
        this.pendingUpgradeOptions = [];
        this.lastCombatLoot = null;

        const win = window as any;
        if (typeof win.fecharModal === 'function') win.fecharModal('janela-expedition-upgrade');
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        if (typeof win.atualizar === 'function') win.atualizar();

        this.advanceJourney();
    }

    static syncNavigationLock() {
        const locked = this.state.active;
        const gameRoot = document.querySelector('.game-container');
        const floresta = document.getElementById('tela-floresta');
        if (gameRoot) gameRoot.classList.toggle('expedition-run-locked', locked);
        if (floresta) floresta.classList.toggle('expedition-run-active', locked);
    }

    static promptExitAndExtract(): void {
        void this.confirmExitAndExtract();
    }

    static async confirmExitAndExtract(): Promise<void> {
        if (!this.state.active) return;
        const win = window as any;
        const title = this.t('game.hunt.expedition.exitRunTitle', 'Leave expedition?');
        const body = this.t(
            'game.hunt.expedition.exitRunBody',
            'You will extract now and collect 100% of your Expedition Bag (Adena, XP and materials). Run upgrades and forge enchants are cleared.'
        );

        let ok = false;
        if (typeof win.l2Confirm === 'function') {
            ok = await win.l2Confirm(body, title);
        } else {
            ok = window.confirm(body);
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
        this.syncExpeditionCombatControls(mode);
        this.syncExpeditionHotbar(mode);
    }

    static showHub() {
        this.restoreGameHotbar();

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

    static syncForestEntryUi() {
        if (this.state.active) {
            this.hideHub();
            const mode = this._combatUiActive ? 'combat' : 'map';
            this.setForestLayoutMode(mode);
        } else {
            this._combatUiActive = false;
            this.showHub();
        }
    }

    static init() {
        (window as any).ExpeditionEngine = ExpeditionEngine;
        setTimeout(() => ExpeditionEngine.wireStartButton(), 1000);
    }

    static wireStartButton() {
        const btnIniciar = document.getElementById('btn-iniciar-caca');
        if (!btnIniciar) return;
        btnIniciar.onclick = () => {
            ExpeditionEngine.startExpedition((window as any).zonaAtual?.id || 'No-Grade');
        };
        this.syncForestEntryUi();
    }

    static startExpedition(zoneId: string) {
        this.restoreMobTuning();
        const rareEventJourney = this.rollRareEventJourney();
        const firstTrait = this.rollJourneyTrait();
        this.state = {
            active: true,
            zoneId,
            journey: 1,
            pathChoices: [],
            currentPath: null,
            combatOnlyNextJourney: false,
            combatOnlyThisJourney: false,
            runBuffs: this.emptyRunBuffs(),
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
        this.refreshJourneyPhase();
        this._combatUiActive = false;
        this.hideHub();
        this.renderMap();
        this.syncNavigationLock();
        const win = window as any;
        if (typeof win.atualizar === 'function') win.atualizar();
        try {
            const win = window as any;
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
            merchant: 'Trade · bag loot',
            forge: 'Random +1 enchant · no fight',
            scout: 'Intel · bag bonus',
            patrol: 'XP march · no gifts',
            tracks: 'Next trait intel',
            warhorn: 'Battle prep buff',
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
        if (b.maxHpPct) chips.push(`❤️ +${b.maxHpPct}%`);
        if (b.hpRegenPct) chips.push(`💚 +${b.hpRegenPct}% regen`);
        if (b.poisonResPct) chips.push(`☠️ -${b.poisonResPct}%`);
        if (b.bleedResPct) chips.push(`🩸 -${b.bleedResPct}%`);
        if (b.mpCostReductionPct) chips.push(`🔷 -${b.mpCostReductionPct}% MP`);
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

    static buildRareEventSectionHtml(): string {
        const type = this.state.rareEventType;
        if (!type) return '';
        const meta = this.getRareEventMeta(type);
        const banner = this.t('game.hunt.expedition.rareEventBanner', 'Rare encounter — once per run');
        return `
                <div class="expedition-rare-event">
                    <div class="expedition-rare-event__banner">${banner}</div>
                    <div class="expedition-rare-event__card">
                        <span class="expedition-rare-event__icon" aria-hidden="true">${meta.icon}</span>
                        <h4 class="expedition-rare-event__title">${meta.title}</h4>
                        <p class="expedition-rare-event__desc">${meta.desc}</p>
                        <button type="button" class="btn-l2 expedition-rare-event__btn" onclick="ExpeditionEngine.resolveRareEvent()">${meta.btn}</button>
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
            this.state.combatOnlyThisJourney ? 'expedition-path-section--combat-only' : ''
        ].filter(Boolean).join(' ');

        const headGlyph = opening ? '⚔️' : milestone ? '👹' : '👇';

        return `
                ${milestoneBanner}
                ${openingBanner}
                ${combatOnlyBanner}
                <div class="expedition-path-section ${sectionMods}" role="region" aria-label="${pickHint}">
                    <div class="expedition-path-section__head">
                        <span class="expedition-path-section__glyph" aria-hidden="true">${headGlyph}</span>
                        <div class="expedition-path-section__label">${pickHint}</div>
                    </div>
                    <div class="${gridClass}">${pathsHtml}</div>
                </div>`;
    }

    static resolveRareEvent() {
        if (!this.state.pendingRareEvent || !this.state.rareEventType) return;
        const type = this.state.rareEventType;
        const win = window as any;
        let result: ExpeditionNodeResult;

        switch (type) {
            case 'shrine': {
                const hpBefore = Number(win.playerHP) || 0;
                const mpBefore = Number(win.playerMP) || 0;
                win.playerHP = win.playerStats.maxHp;
                win.playerMP = win.playerStats.maxMp;
                const adenaGain = Math.floor(400 * this.getJourneyRewardMult());
                this.state.bag.adenas += adenaGain;
                if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
                win.atualizar();
                result = {
                    nodeType: 'event',
                    tone: 'success',
                    icon: '🌙',
                    titleKey: 'game.hunt.expedition.rareResult_shrine_title',
                    titleFallback: 'Moonlit shrine',
                    summaryKey: 'game.hunt.expedition.rareResult_shrine_desc',
                    summaryFallback: 'Full recovery and a modest offering to your bag.',
                    bag: { adenas: adenaGain },
                    effects: {
                        hpRestored: Math.max(0, win.playerStats.maxHp - hpBefore),
                        mpRestored: Math.max(0, win.playerStats.maxMp - mpBefore)
                    }
                };
                break;
            }
            case 'gambler': {
                this.state.luckLootMult = 1.75;
                result = {
                    nodeType: 'event',
                    tone: 'warning',
                    icon: '🎲',
                    titleKey: 'game.hunt.expedition.rareResult_gambler_title',
                    titleFallback: 'Fortune twist',
                    summaryKey: 'game.hunt.expedition.rareResult_gambler_desc',
                    summaryFallback: 'Your next fight pays +75% bag loot. Choose your path wisely.',
                    effects: { buffText: this.t('game.hunt.expedition.rareBuffLoot', '+75% next fight loot') }
                };
                break;
            }
            case 'cache': {
                const journeyMult = this.getJourneyRewardMult();
                const adenaGain = Math.floor((Math.random() * 900 + 400) * journeyMult);
                this.state.bag.adenas += adenaGain;
                const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore'];
                const mat = mats[Math.floor(Math.random() * mats.length)];
                const matQty = Math.max(2, Math.floor((Math.random() * 5 + 3) * journeyMult));
                this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
                this.state.runStats.chestsOpened += 1;
                result = {
                    nodeType: 'chest',
                    tone: 'success',
                    icon: '📦',
                    titleKey: 'game.hunt.expedition.rareResult_cache_title',
                    titleFallback: 'Hidden cache',
                    summaryKey: 'game.hunt.expedition.rareResult_cache_desc',
                    summaryFallback: 'A stash left on the trail — straight to your expedition bag.',
                    bag: { adenas: adenaGain, drops: { [mat]: matQty } }
                };
                break;
            }
            case 'storm':
            default: {
                this.state.luckLegendaryNext = true;
                const statKeys: (keyof ExpeditionRunBuffs)[] = [
                    'pAtkPct', 'mAtkPct', 'pDefPct', 'critRatePct', 'atkSpeedPct', 'maxHpPct', 'poisonResPct', 'bleedResPct', 'hpRegenPct', 'mpCostReductionPct'
                ];
                const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
                this.state.runBuffs[stat] += 6;
                if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
                result = {
                    nodeType: 'event',
                    tone: 'neutral',
                    icon: '⛈️',
                    titleKey: 'game.hunt.expedition.rareResult_storm_title',
                    titleFallback: 'Blood storm',
                    summaryKey: 'game.hunt.expedition.rareResult_storm_desc',
                    summaryFallback: '+6% to a random run stat and a guaranteed legendary upgrade on your next victory.',
                    effects: { buffText: this.t('game.hunt.expedition.rareBuffLegendary', 'Next win: legendary upgrade') }
                };
                break;
            }
        }

        this.state.runStats.rareEventType = type;
        this.state.rareEventUsed = true;
        this.state.pendingRareEvent = false;
        this._resultSkipsAdvance = true;
        this.showResultModal(result);
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
        if (runBuffs.maxHpPct) buffParts.push(`+${runBuffs.maxHpPct}% ${this.runStatLabel('maxHpPct')}`);
        if (runBuffs.hpRegenPct) buffParts.push(`+${runBuffs.hpRegenPct}% ${this.runStatLabel('hpRegenPct')}`);
        if (runBuffs.poisonResPct) buffParts.push(`-${runBuffs.poisonResPct}% ${this.runStatLabel('poisonResPct')}`);
        if (runBuffs.bleedResPct) buffParts.push(`-${runBuffs.bleedResPct}% ${this.runStatLabel('bleedResPct')}`);
        if (runBuffs.mpCostReductionPct) buffParts.push(`-${runBuffs.mpCostReductionPct}% ${this.runStatLabel('mpCostReductionPct')}`);
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
        const mobScalePct = Math.round((this.getJourneyMobScale() - 1) * 100);
        const zoneRatePct = Math.round(this.getZoneRewardRate() * 100);

        const mapTitle = this.t('game.hunt.expedition.rogueMapTitle', 'Roguelike Expedition');
        const journeyLabel = this.t('game.hunt.expedition.journeyLabel', 'Journey {n}', { n: journey });
        const pickHint = this.getPathPickHint(journey, this.state.pathChoices.length);
        const mapRulesBtn = this.t('game.hunt.expedition.mapRulesBtn', 'Rules');
        const traitLabel = this.t('game.hunt.expedition.traitLabel', 'Enemy trait');
        const bagTitle = this.t('game.hunt.expedition.bagTitle', 'Expedition Bag');
        const bagEmpty = this.t('game.hunt.expedition.bagEmpty', 'No items yet...');
        const extractLabel = this.t('game.hunt.expedition.extract', 'Exit & collect loot');

        if (this.state.pendingRareEvent) this.state.runPanelTab = 'path';

        const lootLabel = this.t('game.hunt.expedition.metaLoot', 'Loot bonus');
        const enemyLabel = this.t('game.hunt.expedition.metaEnemies', 'Enemy power');
        const zoneLabel = this.t('game.hunt.expedition.metaZone', 'Zone rate');
        const traitName = this.getTraitLabel(this.state.journeyTrait);
        const dropKeys = Object.keys(this.state.bag.drops);
        const dropStacks = dropKeys.reduce((n, k) => n + (this.state.bag.drops[k] || 0), 0);
        const dropsSummary = dropStacks > 0
            ? this.t('game.hunt.expedition.bagDropsToggle', 'Bag drops ({n})', { n: dropStacks })
            : bagEmpty;

        let dropsHtml = '';
        for (const item of dropKeys) {
            dropsHtml += `<span class="expedition-bag__drop">${itemDropDisplayName(item)} x${this.state.bag.drops[item]}</span>`;
        }

        const dropsDetailsHtml = dropStacks > 0
            ? `<details class="expedition-bag-details">
                    <summary class="expedition-bag-details__summary">${dropsSummary}</summary>
                    <div class="expedition-bag__drops">${dropsHtml}</div>
                </details>`
            : '';

        this.restoreGameHotbar();

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
                <div class="expedition-bag-bar">
                    <div class="expedition-bag-bar__info">
                        <span class="expedition-bag-bar__icon" aria-hidden="true">🎒</span>
                        <div class="expedition-bag-bar__totals">
                            <span class="expedition-bag-bar__title">${bagTitle}</span>
                            <span class="expedition-bag-bar__values">
                                <span class="expedition-bag-bar__adena">+${this.state.bag.adenas.toLocaleString()}</span>
                                <span class="expedition-bag-bar__sep">·</span>
                                <span class="expedition-bag-bar__xp">+${this.state.bag.xp.toLocaleString()} XP</span>
                            </span>
                        </div>
                    </div>
                    <button type="button" class="btn-l2 expedition-bag__extract expedition-bag-bar__extract" onclick="ExpeditionEngine.promptExitAndExtract()">${extractLabel}</button>
                </div>
                ${dropsDetailsHtml}
            </div>
        </div>`;

        mapContainer.innerHTML = html;
        this.setForestLayoutMode('map');
    }

    static clickPath(index: number) {
        const choice = this.state.pathChoices[index];
        if (!choice) return;

        this.pendingPathIndex = index;
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
        this.pendingPathIndex = null;
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
        const journeyScale = this.getJourneyMobScale();
        let hp = base.hp * journeyScale;
        let atk = base.atk * journeyScale;
        let def = base.def * journeyScale;
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
        if (typeof win.atualizar === 'function') win.atualizar();
        win.procurarMonstros();
    }

    static onCombatWin(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }) {
        if (!this.state.active) return;

        this._combatUiActive = false;
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
        const win = window as any;
        const journeyMult = this.getJourneyRewardMult();
        const roll = Math.random();
        let result: ExpeditionNodeResult;

        this.state.runStats.merchantsUsed += 1;

        if (roll < 0.4) {
            const adenaGain = Math.floor((Math.random() * 400 + 300) * journeyMult);
            this.state.bag.adenas += adenaGain;
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '🧳',
                titleKey: 'game.hunt.expedition.resultMerchantAdenaTitle',
                titleFallback: 'Trade deal',
                summaryKey: 'game.hunt.expedition.resultMerchantAdenaDesc',
                summaryFallback: 'The merchant paid well for a rare trinket.',
                bag: { adenas: adenaGain }
            };
        } else if (roll < 0.75) {
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore', 'Life Stone'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.max(2, Math.floor((Math.random() * 4 + 2) * journeyMult));
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '🧳',
                titleKey: 'game.hunt.expedition.resultMerchantGiftTitle',
                titleFallback: 'Merchant gift',
                summaryKey: 'game.hunt.expedition.resultMerchantGiftDesc',
                summaryFallback: 'Supplies added straight to your bag.',
                bag: { drops: { [mat]: matQty } }
            };
        } else {
            const stat = this.rollRandomRunStat();
            const boost = 8;
            this.state.runBuffs[stat] += boost;
            if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
            win.atualizar();
            result = {
                nodeType: 'merchant',
                tone: 'warning',
                icon: '🧳',
                titleKey: 'game.hunt.expedition.resultMerchantBuffTitle',
                titleFallback: 'Merchant contract',
                summaryKey: 'game.hunt.expedition.resultMerchantBuffDesc',
                summaryFallback: 'A signed pact boosts one run stat until you extract or fall.',
                summaryParams: { stat: this.runStatLabel(stat), pct: boost },
                effects: { buffText: `+${boost}% ${this.runStatLabel(stat)}` }
            };
        }

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
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        win.atualizar();

        const fallbackKey = forged.reason === 'no_gear'
            ? 'game.hunt.expedition.resultForgeFallbackNoGear'
            : 'game.hunt.expedition.resultForgeFallbackMax';
        const fallbackMsg = forged.reason === 'no_gear'
            ? 'Nothing equipped to enchant — sparks still boost a run stat.'
            : 'All gear is already +25 — sparks boost a run stat instead.';

        this.showResultModal({
            nodeType: 'forge',
            tone: forged.reason === 'no_gear' ? 'neutral' : 'warning',
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
                buffText: this.t('game.hunt.expedition.resultScoutIntel', 'Enemy trait: {trait}', {
                    trait: this.t(`game.hunt.expedition.trait_${trait}`, trait)
                })
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
            bag: { xp: xpGain },
            effects: {
                buffText: this.t('game.hunt.expedition.resultTracksIntel', 'Next journey trait: {trait}', {
                    trait: this.t(`game.hunt.expedition.trait_${nextTrait}`, nextTrait)
                })
            }
        });
    }

    static resolveWarhornPath() {
        const win = window as any;
        const mage = typeof win.isClasseMagica === 'function' && win.isClasseMagica(win.charClass);
        const mainStat: keyof ExpeditionRunBuffs = mage ? 'mAtkPct' : 'pAtkPct';
        this.state.runBuffs[mainStat] += 8;
        this.state.runBuffs.atkSpeedPct += 5;
        if (typeof win.calcularStatusGlobais === 'function') win.calcularStatusGlobais();
        win.atualizar();

        this.showResultModal({
            nodeType: 'warhorn',
            tone: 'success',
            icon: '📯',
            titleKey: 'game.hunt.expedition.resultWarhornTitle',
            titleFallback: 'War horn',
            summaryKey: 'game.hunt.expedition.resultWarhornDesc',
            summaryFallback: 'The horn stirs your line — offensive tempo until you extract.',
            summaryParams: {
                stat: this.runStatLabel(mainStat)
            },
            effects: {
                buffText: `+8% ${this.runStatLabel(mainStat)} · +5% Spd`
            }
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
        this.state = this.createInitialState('');
        this.syncNavigationLock();
        this.showHub();
        this.wireStartButton();
    }

    static finishExpedition(success: boolean, opts?: { skipVictoryModal?: boolean }) {
        if (!this.state.active) return;
        const win = window as any;
        this.restoreMobTuning();

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
        }

        if (typeof win.aplicarXpGanhoFloresta === 'function' && xpReward > 0) {
            win.aplicarXpGanhoFloresta(xpReward);
        }

        win.atualizar();
        if (typeof win.salvarJogo === 'function') win.salvarJogo();

        this.state = this.createInitialState('');
        this._combatUiActive = false;
        this.syncNavigationLock();

        if (success) {
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
        }
        this.wireStartButton();
    }

    static onPlayerDeath() {
        if (this.state.active) this.finishExpedition(false);
    }
}

ExpeditionEngine.init();
