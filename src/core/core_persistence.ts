/**
 * PERSISTENCE ENGINE (SAVE/LOAD)
 * Migrado: js/core_persistence.js
 */
import {
  L2MINI_HOTBAR_SLOT_COUNT,
  L2MINI_SAVE_VERSION,
  type CarregarJogoOptions,
  type CharacterSave,
  type EquipInstance,
  type ItemCatalogBase,
  type SalvarJogoOptions,
} from '../types/game';
import {
  normalizarInventarioStackKeys,
  remapInventarioRecentStackAliases,
  resolveInventarioStackKey,
} from './inventory_stack_keys';

type LooseRecord = Record<string, unknown>;
type LooseEquip = LooseRecord & {
  uid?: string;
  tipo?: string;
  base?: ItemCatalogBase & LooseRecord;
  enchant?: number;
  enchantArmor?: number;
  enchantJewel?: number;
  augmented?: boolean;
  origin?: string;
  id?: string;
  nome?: string;
  tipoItem?: string;
  atk?: number;
  matk?: number;
  mAtk?: number;
  pDef?: number;
  mDef?: number;
  def?: number;
  grade?: string;
};

/** Alinha espada inicial legada em saves (atk 5 → valor alvo) antes da troca por Trainee Blade/Rod. */
function patchTreiningSwordBase(b: ItemCatalogBase | EquipInstance): void {
    const base = ('base' in b && b.base ? b.base : b) as ItemCatalogBase;
    if (!base || base.nome !== 'Treining Sword') return;
    var need = 12;
    var cur = Number(base.atk);
    if (!Number.isFinite(cur) || cur < need) base.atk = need;
}

function patchTreiningSwordInSaveData(data: CharacterSave): void {
    if (!data || typeof data !== 'object') return;
    if (data.armaEquipadaBase) {
        patchTreiningSwordBase(data.armaEquipadaBase);
    }
    if (Array.isArray(data.inventarioEquips)) {
        for (var ix = 0; ix < data.inventarioEquips.length; ix++) {
            var it = data.inventarioEquips[ix];
            if (!it) continue;
            patchTreiningSwordBase(it);
        }
    }
}

function _isTreiningWeaponEntry(w: EquipInstance | LooseEquip | null | undefined): boolean {
    if (!w) return false;
    const b = (w.base || w) as ItemCatalogBase;
    return b && String(b.nome) === 'Treining Sword';
}

/** v7: Treining Sword → instância de catálogo (trainee) conforme charClass; punhos = slot null no jogo novo. */
function migrateTreiningSwordToStarterEquipment(data: CharacterSave): void {
    if (!data || typeof data !== 'object') return;
    var cls = data.charClass || 'Fighter';
    function makeStarter() {
        if (typeof window.createStarterWeaponInstance === 'function') {
            return window.createStarterWeaponInstance(cls);
        }
        return null;
    }
    if (_isTreiningWeaponEntry(data.armaEquipadaBase)) {
        var nw = makeStarter();
        data.armaEquipadaBase = nw || null;
    }
    if (!Array.isArray(data.inventarioEquips)) return;
    for (var ii = 0; ii < data.inventarioEquips.length; ii++) {
        var it = data.inventarioEquips[ii];
        if (!_isTreiningWeaponEntry(it)) continue;
        var rep = makeStarter();
        if (rep) data.inventarioEquips[ii] = rep;
        else data.inventarioEquips.splice(ii, 1), ii--;
    }
}

/** Chaves de stack na bolsa espelhando carteira (HUD + craft + nuvem). */
window.L2MINI_CURRENCY_BAG_KEYS = { adena: 'Adena', ancient: 'Ancient Coin' };

/**
 * Mantém bolsa alinhada a window.adenas / window.ancientCoins (fonte para shop, HUD, RPC).
 */
window.syncMoedasInventarioComCarteira = function () {
    if (!window.inventario || typeof window.inventario !== 'object') window.inventario = {};
    var kA = window.L2MINI_CURRENCY_BAG_KEYS.adena;
    var kC = window.L2MINI_CURRENCY_BAG_KEYS.ancient;
    var a = Math.max(0, Math.floor(Number(window.adenas)));
    var c = Math.max(0, Math.floor(Number(window.ancientCoins)));
    if (Number.isNaN(a)) { a = 0; window.adenas = 0; }
    if (Number.isNaN(c)) { c = 0; window.ancientCoins = 0; }
    window.adenas = a;
    window.ancientCoins = c;
    if (a > 0) window.inventario[kA] = a;
    else delete window.inventario[kA];
    if (c > 0) window.inventario[kC] = c;
    else delete window.inventario[kC];
};

/** Hidrata `base` a partir dos catálogos quando a nuvem só guardou `{ id }` (ex.: craft RPC). */
window.enrichEquipBaseFromCatalogIfNeeded = function enrichEquipBaseFromCatalogIfNeeded(
    item: unknown,
): EquipInstance | unknown {
    if (!item || typeof item !== 'object') return item;
    const row = item as LooseEquip;
    if (row.base && typeof row.base === 'object') {
        var bk = Object.keys(row.base);
        if (bk.length === 0 && row.id) {
            row.base = { id: String(row.id) };
        }
    }
    if (!row.base && row.id) {
        item = {
            uid: row.uid,
            tipo: row.tipo,
            base: { id: String(row.id) },
            enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
            augmented: row.augmented || false,
            origin: row.origin
        } as LooseEquip;
    }
    if (!(item as LooseEquip).base) return item;
    var b = (item as LooseEquip).base!;
    var looksArmor = b.tipo && ['Heavy', 'Light', 'Medium', 'Robe', 'Mage Light', 'Mage Heavy', 'armor'].indexOf(b.tipo) >= 0;
    var looksJewel = b.tipoItem && ['neck', 'ear', 'ring'].indexOf(b.tipoItem) >= 0;
    var hasStats =
        b.atk != null || b.matk != null || b.mAtk != null ||
        b.pDef != null || b.mDef != null || b.def != null ||
        looksArmor || looksJewel;
    if (b.nome && hasStats) {
        var idEarly = b.id;
        var fullEarly = null;
        if (idEarly) {
            if (typeof catalogoArmaduras !== 'undefined') fullEarly = catalogoArmaduras.find(function (a) { return a.id === idEarly; });
            if (!fullEarly && typeof catalogoArmas !== 'undefined') fullEarly = catalogoArmas.find(function (a) { return a.id === idEarly; });
            if (!fullEarly && typeof catalogoJoias !== 'undefined') fullEarly = catalogoJoias.find(function (a) { return a.id === idEarly; });
        }
        if (fullEarly && fullEarly.img && b.img !== fullEarly.img) {
            const src = item as LooseEquip;
            return {
                uid: src.uid,
                tipo: src.tipo,
                base: Object.assign({}, b, { img: fullEarly.img }),
                enchant: src.enchant !== undefined ? src.enchant : 0,
                augmented: src.augmented || false,
                origin: src.origin
            } as EquipInstance;
        }
        return item;
    }
    var id = b.id;
    if (!id) return item;
    var full = null;
    if (typeof catalogoArmaduras !== 'undefined') full = catalogoArmaduras.find(function (a) { return a.id === id; });
    if (!full && typeof catalogoArmas !== 'undefined') full = catalogoArmas.find(function (a) { return a.id === id; });
    if (!full && typeof catalogoJoias !== 'undefined') full = catalogoJoias.find(function (a) { return a.id === id; });
    if (!full) return item;
    const srcItem = item as LooseEquip;
    return {
        uid: srcItem.uid,
        tipo: srcItem.tipo || full.tipoItem || full.tipo,
        base: full,
        enchant: srcItem.enchant !== undefined ? srcItem.enchant : 0,
        augmented: srcItem.augmented || false,
        origin: srcItem.origin || 'Cloud'
    } as EquipInstance;
};

/**
 * Nome de classe legível na UI (inspeção, ranking): remove chaves técnicas e underscores.
 * Opcional: `game.classNames.<Class_Id>` em locales_bundle se quiseres PT/EN por classe.
 */
window.formatClassDisplayName = function (raw) {
    if (raw == null) return '';
    var s = String(raw).trim();
    if (!s) return '';
    var keySlug = s.replace(/\s+/g, '_');
    if (typeof window.t === 'function') {
        var k1 = 'game.classNames.' + keySlug;
        var tr1 = window.t(k1);
        if (tr1 && tr1 !== k1) return tr1;
    }
    return s.replace(/_/g, ' ');
};

/**
 * Reidrata um slot de equipamento a partir do JSONB (inspeção / só leitura), alinhado a carregarJogo.
 */
window.coerceInspectEquipItem = function coerceInspectEquipItem(
    item: unknown,
    tipoPadrao?: string,
): EquipInstance | null {
    if (!item || typeof item !== 'object') return null;
    let row = item as LooseEquip;
    var armorTipo = ['Heavy', 'Light', 'Medium', 'Robe', 'Mage Light', 'Mage Heavy', 'armor'];
    var isArmorishTop = row.tipo && armorTipo.indexOf(String(row.tipo)) >= 0;
    var isJewelTop = row.tipoItem && ['neck', 'ear', 'ring'].indexOf(String(row.tipoItem)) >= 0;
    var hasWeaponStat = row.atk != null || row.matk != null || row.mAtk != null;

    if (!row.base && row.nome && (
        hasWeaponStat ||
        isArmorishTop ||
        isJewelTop ||
        row.pDef != null ||
        row.def != null ||
        row.mDef != null ||
        row.mAtk != null
    )) {
        var guessTipo = tipoPadrao;
        if (!guessTipo) {
            if (hasWeaponStat) guessTipo = 'weapon';
            else if (isArmorishTop || row.pDef != null || row.def != null) guessTipo = 'armor';
            else if (isJewelTop || row.mDef != null) guessTipo = 'jewel';
            else guessTipo = 'misc';
        }
        row = {
            tipo: guessTipo,
            base: row as ItemCatalogBase,
            uid: row.uid,
            enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
            augmented: !!row.augmented
        };
    }

    if (typeof window.enrichEquipBaseFromCatalogIfNeeded === 'function') {
        row = window.enrichEquipBaseFromCatalogIfNeeded(row) as LooseEquip;
    }
    if (typeof window.ItemSecurity !== 'undefined' && window.ItemSecurity.isValidInstance(row)) {
        return row as EquipInstance;
    }
    var itemBase = (row.base || row) as ItemCatalogBase;
    if (itemBase && itemBase.nome === 'Treining Sword') {
        var uids = (typeof window.ItemSecurity !== 'undefined' && window.ItemSecurity.generateUID) ? window.ItemSecurity.generateUID('WPN') : ('WPN-VIEW-' + String(Date.now()));
        return row.base ? (row as EquipInstance) : {
            uid: row.uid || uids,
            tipo: 'weapon',
            base: itemBase,
            enchant: row.enchant || 0,
            augmented: false,
            origin: 'Inspect'
        };
    }
    if (typeof window.ItemSecurity !== 'undefined' && window.ItemSecurity.createInstance && itemBase && itemBase.nome) {
        return window.ItemSecurity.createInstance(row.tipo || tipoPadrao || 'misc', itemBase, {
            uid: row.uid,
            enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
            augmented: row.augmented || false,
            origin: 'Inspect'
        });
    }
    return row.base && itemBase.nome ? (row as EquipInstance) : null;
};

/**
 * JSONB do personagem na nuvem: objeto direto, string JSON ou raro `{ data: { ... save } }`.
 */
window.unwrapCloudCharacterJsonb = function unwrapCloudCharacterJsonb(raw: unknown): CharacterSave {
    var d = raw as LooseRecord | string;
    if (typeof d === 'string') {
        try {
            d = JSON.parse(d);
        } catch {
            return {} as CharacterSave;
        }
    }
    if (!d || typeof d !== 'object') return {} as CharacterSave;
    const obj = d as LooseRecord;
    if (obj.data && typeof obj.data === 'object') {
        var inner = obj.data as CharacterSave;
        if (inner.charName != null || inner.inventarioEquips != null || inner.armaEquipadaBase != null ||
            inner.armaduraEquipada != null || inner.charClass != null) {
            d = inner;
        }
    }
    return d as CharacterSave;
};

/** Primeiro slot de equipamento não vazio entre chaves alternativas (JSONB / saves legados). */
window.pickInspectSaveEquip = function pickInspectSaveEquip(
    rd: Record<string, unknown> | null | undefined,
    keys: string[],
): unknown {
    if (!rd || typeof rd !== 'object' || !Array.isArray(keys)) return null;
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (Object.prototype.hasOwnProperty.call(rd, k) && rd[k] != null) return rd[k];
    }
    return null;
};

window.normalizarInventarioEquipsParaInstancias = function normalizarInventarioEquipsParaInstancias(
    arr: unknown[],
): EquipInstance[] {
    if (!Array.isArray(arr)) return [];
    return arr.map(function (item) {
        let row = item as LooseEquip;
        if (typeof window.enrichEquipBaseFromCatalogIfNeeded === 'function') {
            row = window.enrichEquipBaseFromCatalogIfNeeded(row) as LooseEquip;
        }
        if (typeof window.ItemSecurity !== 'undefined' && !window.ItemSecurity.isValidInstance(row)) {
            var itemBase = (row.base || row) as ItemCatalogBase;
            var orig = row.origin === 'Craft' ? 'Craft' : 'Cloud';
            return window.ItemSecurity.createInstance(String(row.tipo || 'misc'), itemBase, {
                uid: row.uid,
                enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
                augmented: row.augmented || false,
                origin: orig
            })!;
        }
        return row as EquipInstance;
    });
};

/** Normaliza barra de atalhos para 12 slots; resgata pins dos slots 13–20 legados se houver vaga. */
function normalizeBarraAtalhosArray(arr: unknown): Array<string | null> {
    const out: Array<string | null> = [];
    const src = Array.isArray(arr) ? arr : [];
    for (let i = 0; i < L2MINI_HOTBAR_SLOT_COUNT; i++) {
        const slot = src[i];
        out.push(slot == null || slot === '' ? null : String(slot));
    }
    if (src.length > L2MINI_HOTBAR_SLOT_COUNT) {
        for (let i = L2MINI_HOTBAR_SLOT_COUNT; i < src.length; i++) {
            const item = src[i];
            if (item == null || item === '') continue;
            const emptyIdx = out.findIndex((s) => s == null);
            if (emptyIdx < 0) break;
            out[emptyIdx] = String(item);
        }
    }
    return out;
}

/**
 * Ajusta um save antigo para a estrutura esperada pela versão atual.
 * Saves sem `saveVersion` tratam-se como versão 0.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
function migrarDadosSave(data: CharacterSave): CharacterSave {
    if (!data || typeof data !== 'object') return data;
    var v = (typeof data.saveVersion === 'number' && data.saveVersion >= 0) ? data.saveVersion : 0;

    if (v < 1) {
        // v0 → v1: saves legados sem saveVersion; espaço para normalizações one-time.
        // (Ex.: campos renomeados no passado já são tratados no load com fallbacks.)
        if (typeof data.ancientCoins === 'undefined') data.ancientCoins = 0;
        v = 1;
    }

    if (v < 2) {
        if (!data.endgame || typeof data.endgame !== 'object') {
            data.endgame = {
                weeklyChampionKills: 0,
                weeklyWeekKey: '',
                lastClaimedWeekKey: '',
                lifetimeChampionKills: 0,
                renown: 0
            };
        } else {
            if (typeof data.endgame.weeklyChampionKills !== 'number') data.endgame.weeklyChampionKills = 0;
            if (typeof data.endgame.weeklyWeekKey !== 'string') data.endgame.weeklyWeekKey = '';
            if (typeof data.endgame.lastClaimedWeekKey !== 'string') data.endgame.lastClaimedWeekKey = '';
            if (typeof data.endgame.lifetimeChampionKills !== 'number') data.endgame.lifetimeChampionKills = 0;
            if (typeof data.endgame.renown !== 'number') data.endgame.renown = 0;
        }
        v = 2;
    }

    if (v < 3) {
        var inv3 = data.inventario;
        if (inv3 && typeof inv3 === 'object' && !Array.isArray(inv3)) {
            var acSt = Number(inv3['Ancient Coin']);
            var adSt = Number(inv3['Adena']);
            if (Number.isFinite(acSt) && acSt > 0) {
                data.ancientCoins = (Number(data.ancientCoins) || 0) + acSt;
                delete inv3['Ancient Coin'];
            }
            if (Number.isFinite(adSt) && adSt > 0) {
                data.adenas = (Number(data.adenas || data.adena) || 0) + adSt;
                delete inv3['Adena'];
            }
            data.inventario = inv3;
        }
        v = 3;
    }

    if (v < 4) {
        if (!Array.isArray(data.olympiadRewardsClaimed)) {
            data.olympiadRewardsClaimed = [];
        }
        v = 4;
    }

    if (v < 5) {
        if (!data.tutorial || typeof data.tutorial !== 'object') {
            var _hasBarra = Array.isArray(data.barraAtalhos) && data.barraAtalhos.some(function (s) { return s != null; });
            var _inv = data.inventario;
            var _hasInv = _inv && typeof _inv === 'object' && !Array.isArray(_inv) && Object.keys(_inv).length > 0;
            var _hadOldVer = typeof data.saveVersion === 'number' && data.saveVersion >= 1;
            var _hasAdena = typeof data.adenas === 'number' || typeof data.adena === 'number';
            var _hasWpn = data.armaEquipadaBase != null;
            var _legacyFull = _hadOldVer || _hasBarra || _hasInv || _hasAdena || _hasWpn;
            data.tutorial = _legacyFull
                ? { v: 1, active: false, step: 99, completed: true, skipped: false }
                : { v: 1, active: true, step: 0, completed: false, skipped: false };
        } else {
            data.tutorial.v = typeof data.tutorial.v === 'number' ? data.tutorial.v : 1;
            if (typeof data.tutorial.completed !== 'boolean') data.tutorial.completed = !!data.tutorial.completed;
            if (typeof data.tutorial.skipped !== 'boolean') data.tutorial.skipped = !!data.tutorial.skipped;
            if (typeof data.tutorial.active !== 'boolean') {
                data.tutorial.active = !data.tutorial.completed && !data.tutorial.skipped;
            }
            if (typeof data.tutorial.step !== 'number') data.tutorial.step = data.tutorial.completed ? 99 : 0;
        }
        v = 5;
    }

    if (v < 6) {
        patchTreiningSwordInSaveData(data);
        v = 6;
    }

    if (v < 7) {
        migrateTreiningSwordToStarterEquipment(data);
        v = 7;
    }

    if (v < 8) {
        if (!Array.isArray(data.inventarioRecentLog)) data.inventarioRecentLog = [];
        v = 8;
    }

    if (v < 9) {
        if (data.inventario && typeof data.inventario === 'object' && !Array.isArray(data.inventario)) {
            normalizarInventarioStackKeys(data.inventario);
        }
        if (Array.isArray(data.inventarioRecentLog)) {
            data.inventarioRecentLog.forEach((row) => {
                if (row && row.k === 's' && row.id) {
                    row.id = resolveInventarioStackKey(row.id);
                }
            });
        }
        v = 9;
    }

    if (v < 10) {
        if (Array.isArray(data.barraAtalhos)) {
            data.barraAtalhos = normalizeBarraAtalhosArray(data.barraAtalhos);
        }
        v = 10;
    }

    if (v < 11) {
        if (!data.uiCoach || typeof data.uiCoach !== 'object') {
            data.uiCoach = { menuTownSeen: false };
        } else if (typeof data.uiCoach.menuTownSeen !== 'boolean') {
            data.uiCoach.menuTownSeen = false;
        }
        v = 11;
    }

    if (v < 12) {
        if (!data.uiCoach || typeof data.uiCoach !== 'object') {
            data.uiCoach = { menuTownSeen: false, mailboxTipSeen: false, missionsTipSeen: false };
        } else {
            if (typeof data.uiCoach.menuTownSeen !== 'boolean') data.uiCoach.menuTownSeen = false;
            if (typeof data.uiCoach.mailboxTipSeen !== 'boolean') data.uiCoach.mailboxTipSeen = false;
            if (typeof data.uiCoach.missionsTipSeen !== 'boolean') data.uiCoach.missionsTipSeen = false;
        }
        v = 12;
    }

    if (v < 13) {
        const layoutRaw = data.uiLayoutMode;
        if (layoutRaw !== 'auto' && layoutRaw !== 'portrait' && layoutRaw !== 'landscape') {
            data.uiLayoutMode = 'auto';
        }
        v = 13;
    }

    if (v < 14) {
        if (!data.levelRewards || typeof data.levelRewards !== 'object') {
            data.levelRewards = { claimed: [] };
        } else if (!Array.isArray(data.levelRewards.claimed)) {
            data.levelRewards.claimed = [];
        }
        v = 14;
    }

    if (v < 15) {
        if (!data.gameplayAchievements || typeof data.gameplayAchievements !== 'object') {
            data.gameplayAchievements = { stats: {}, unlockedTitles: [], equippedTitleId: null };
        } else {
            if (!data.gameplayAchievements.stats || typeof data.gameplayAchievements.stats !== 'object') {
                data.gameplayAchievements.stats = {};
            }
            if (!Array.isArray(data.gameplayAchievements.unlockedTitles)) {
                data.gameplayAchievements.unlockedTitles = [];
            }
            if (data.gameplayAchievements.equippedTitleId != null
                && typeof data.gameplayAchievements.equippedTitleId !== 'string') {
                data.gameplayAchievements.equippedTitleId = null;
            }
        }
        v = 15;
    }

    if (v < 16) {
        const legacySkipNewbie = (Number(data.nivel) || 1) >= 10;
        if (!data.retention || typeof data.retention !== 'object') {
            data.retention = {
                newbie: {
                    startDayKey: '',
                    claimedDays: [],
                    completed: legacySkipNewbie,
                    day7WeaponId: null,
                },
                monthly: { monthKey: '', claimedDays: [], lastClaimDayKey: '' },
                journey: { completedSteps: [], claimedSteps: [], completed: false },
                comeback: { lastSeenAt: Date.now(), lastComebackDayKey: '' },
                clanPromptDismissed: legacySkipNewbie,
                clanJoinRewardClaimed: !!data.playerClanId,
            };
        }
        if (!data.retention.newbie.startDayKey) {
            const now = new Date();
            const dk = now.getFullYear() + '-'
                + String(now.getMonth() + 1).padStart(2, '0') + '-'
                + String(now.getDate()).padStart(2, '0');
            data.retention.newbie.startDayKey = dk;
        }
        v = 16;
    }

    if (v < 17) {
        if (!Array.isArray(data.unseenSkillUnlocks)) {
            data.unseenSkillUnlocks = [];
        } else {
            data.unseenSkillUnlocks = data.unseenSkillUnlocks
                .filter((id): id is string => typeof id === 'string' && !!id.trim() && id !== 'Attack')
                .map((id) => id.trim());
        }
        v = 17;
    }

    if (v < 18) {
        if (data.expeditionRun != null && typeof data.expeditionRun !== 'object') {
            data.expeditionRun = null;
        }
        v = 18;
    }

    if (v < 19) {
        if (data.expeditionMeta != null && typeof data.expeditionMeta !== 'object') {
            data.expeditionMeta = null;
        }
        v = 19;
    }

    data.saveVersion = L2MINI_SAVE_VERSION;
    return data;
}

function salvarJogo(opts?: SalvarJogoOptions): void {
    opts = opts || {};
    // Sincroniza os níveis de encante nos objetos antes de salvar (Garante integridade no save)
    if (window.armaEquipadaBase && window.armaEquipadaBase.enchant != null) {
        var _syncW = Number(window.armaEquipadaBase.enchant);
        if (!Number.isNaN(_syncW)) window.enchant = _syncW;
    }
    if (window.armaEquipadaBase) window.armaEquipadaBase.enchant = window.enchant || 0;
    if (window.armaduraEquipada && window.armaduraEquipada.enchant != null) {
        var _syncA = Number(window.armaduraEquipada.enchant);
        if (!Number.isNaN(_syncA)) window.enchantArmor = _syncA;
    }
    if (window.armaduraEquipada) window.armaduraEquipada.enchant = window.enchantArmor || 0;
    if (typeof window.syncMoedasInventarioComCarteira === 'function') window.syncMoedasInventarioComCarteira();

    let saveData: CharacterSave = {
        saveVersion: L2MINI_SAVE_VERSION,
        charName: window.charName, 
        charRace: window.charRace, 
        charGender: window.charGender, 
        charClass: window.charClass, 
        adenas: window.adenas, 
        ancientCoins: window.ancientCoins, 
        enchant: window.enchant, 
        enchantArmor: window.enchantArmor, 
        nivel: window.nivel, 
        xpAtual: window.xpAtual, 
        xpNecessario: window.xpNecessario, 
        isAugmented: window.isAugmented, 
        playerHP: window.playerHP, 
        playerMP: window.playerMP, 
        playerCP: window.playerCP, 
        inventario: window.inventario, 
        inventarioEquips: window.inventarioEquips,
        inventarioRecentLog: Array.isArray(window.inventarioRecentLog) ? window.inventarioRecentLog : [],
        armaEquipadaBase: window.armaEquipadaBase === undefined ? null : window.armaEquipadaBase, 
        armaduraEquipada: window.armaduraEquipada === undefined ? null : window.armaduraEquipada, 
        playerClanId: (typeof window.playerClanId !== 'undefined' ? window.playerClanId : null),
        colarEquipado: (window.colarEquipado || null),
        brincoEquipado1: (window.brincoEquipado1 || null),
        brincoEquipado2: (window.brincoEquipado2 || null),
        anelEquipado1: (window.anelEquipado1 || null),
        anelEquipado2: (window.anelEquipado2 || null),
        armaImgSrc: (document.getElementById('arma-img') as HTMLImageElement | null)?.src ?? '', 
        barraAtalhos: window.barraAtalhos, 
        tempoFimBuffGuerreiro: window.tempoFimBuffGuerreiro, 
        tempoFimBuffMistico: window.tempoFimBuffMistico,
        olympiadPoints: window.olympiadPoints, 
        olympiadWins: window.olympiadWins, 
        olympiadLosses: window.olympiadLosses,
        olympiadRewardsClaimed: (window.OlympiadEngine ? window.OlympiadEngine.rewardsClaimed : []) as unknown[],
        endgame: window.endgameData && typeof window.endgameData === 'object' ? window.endgameData : undefined,
        uiLocale: (typeof window.I18n !== 'undefined' && typeof window.I18n.getLocale === 'function')
            ? window.I18n.getLocale() : undefined,
        uiLayoutMode: (typeof window.LayoutMode !== 'undefined' && typeof window.LayoutMode.getPreference === 'function')
            ? window.LayoutMode.getPreference()
            : 'auto',
        tutorial:
            window.tutorialProgress && typeof window.tutorialProgress === 'object'
                ? {
                    v: typeof window.tutorialProgress.v === 'number' ? window.tutorialProgress.v : 1,
                    active: !!window.tutorialProgress.active,
                    step: typeof window.tutorialProgress.step === 'number' ? window.tutorialProgress.step : 0,
                    completed: !!window.tutorialProgress.completed,
                    skipped: !!window.tutorialProgress.skipped
                }
                : undefined,
        uiCoach: window.uiCoachFlags && typeof window.uiCoachFlags === 'object'
            ? {
                menuTownSeen: !!window.uiCoachFlags.menuTownSeen,
                mailboxTipSeen: !!window.uiCoachFlags.mailboxTipSeen,
                missionsTipSeen: !!window.uiCoachFlags.missionsTipSeen,
            }
            : undefined,
        levelRewards: typeof window.getLevelRewardsSavePayload === 'function'
            ? window.getLevelRewardsSavePayload()
            : { claimed: [] },
        gameplayAchievements: typeof window.getGameplayAchievementsSavePayload === 'function'
            ? window.getGameplayAchievementsSavePayload()
            : { stats: {}, unlockedTitles: [], equippedTitleId: null },
        retention: typeof window.getRetentionSavePayload === 'function'
            ? window.getRetentionSavePayload()
            : undefined,
        unseenSkillUnlocks: typeof window.getUnseenSkillUnlocksSavePayload === 'function'
            ? window.getUnseenSkillUnlocksSavePayload()
            : [],
        expeditionRun: (typeof window.ExpeditionEngine !== 'undefined'
            && typeof window.ExpeditionEngine.getRunSavePayload === 'function')
            ? window.ExpeditionEngine.getRunSavePayload()
            : null,
        expeditionMeta: typeof window.getExpeditionMetaSavePayload === 'function'
            ? window.getExpeditionMetaSavePayload()
            : null,
    };
    
    if (!window.charName) return;
    
    localStorage.setItem('l2mini_save_' + window.charName.toLowerCase(), JSON.stringify(saveData));
    if (!opts.silent) {
        var savedMsg = (typeof window.t === 'function') ? window.t('common.gameSaved') : 'Game saved!';
        escreverLog(`<span style="color:#22c55e; font-weight:bold;">${savedMsg}</span>`);
    }
    
    if (typeof window.dispararSincronizacaoCloud === 'function') {
        window.dispararSincronizacaoCloud(!!opts.forceCloud);
    }
}

async function carregarJogo(nome: string, opts?: CarregarJogoOptions): Promise<boolean> {
    if (!nome) return false;
    opts = opts || {};
    const nomeKey = String(nome).trim().toLowerCase();
    const priorKey = window._l2miniLastCarregarChar
        ? String(window._l2miniLastCarregarChar).trim().toLowerCase()
        : '';
    /** Evita loop: reload repetido do mesmo char derrubava a Olympiad a cada `carregarJogo`. */
    var _olyResetOnThisLoad = !!opts.forceOlympiadReset || !priorKey || priorKey !== nomeKey;

    let data: CharacterSave | null = null;
    
    // 1. Prioridade Máxima: Tentar carregar do Supabase (Nuvem)
    if (typeof window.SupabaseAPI !== 'undefined' && window.SUPABASE_CONFIG.enabled && window.SupabaseAPI.client) {
        try {
            console.log(`☁️ Buscando save de [${nome}] na nuvem...`);
            const { data: char, error } = await (window.SupabaseAPI.client as {
                from: (table: string) => {
                    select: (cols: string) => {
                        eq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: { data: CharacterSave } | null; error: unknown }> };
                    };
                };
            })
                .from('characters')
                .select('data')
                .eq('char_name', nome)
                .maybeSingle();
            
            if (char && char.data) {
                data = char.data;
                console.log("✅ Save carregado da Nuvem.");
                // Sincroniza o localStorage para fallback offline
                localStorage.setItem('l2mini_save_' + nome.toLowerCase(), JSON.stringify(data));
            }
        } catch (err) {
            console.error("Erro ao carregar da nuvem:", err);
        }
    }

    // 2. Redundância: LocalStorage (Apenas se a nuvem falhar ou estiver offline)
    if (!data) {
        let saveStr = localStorage.getItem('l2mini_save_' + nome.toLowerCase());
        if(!saveStr) return false;
        try {
            data = JSON.parse(saveStr);
            console.log("💾 Save carregado do LocalStorage (Offline).");
        } catch (e) {
            console.error("Erro ao ler LocalStorage:", e);
            return false;
        }
    }

    if (!data) return false;

    try {
        data = migrarDadosSave(data);
        console.log(`Aplicando dados para [${nome}]... (save v${data.saveVersion})`, data);
        
        window.charName = data.charName || nome; 
        window.charRace = data.charRace || "Human"; 
        window.charGender = data.charGender || "Male"; 
        window.charClass = data.charClass || "Fighter";
        
        window.playerClanId =
            data.playerClanId != null && data.playerClanId !== ''
                ? data.playerClanId
                : null;
        
        // CORREÇÃO: Nomes consistentes (plural)
        window.adenas = Number(data.adenas || data.adena || 0); 
        window.ancientCoins = Number(data.ancientCoins || 0); 
        
        window.enchant = data.enchant || 0; 
        window.enchantArmor = data.enchantArmor || 0; 
        window.nivel = data.nivel || 1; 
        window.xpAtual = data.xpAtual || 0; 
        window.xpNecessario = window.calcularXpNecessario(window.nivel); 
        window.isAugmented = data.isAugmented || false; 
        window.playerHP = (typeof data.playerHP !== 'undefined') ? data.playerHP : 100; 
        window.playerMP = (typeof data.playerMP !== 'undefined') ? data.playerMP : 50; 
        window.playerCP = (typeof data.playerCP !== 'undefined') ? data.playerCP : 60;
        
        // Garante que inventario é objeto
        window.inventario = data.inventario || { 'HP Potion': 10, 'Mana Potion': 5 };
        if (Array.isArray(window.inventario)) {
            // Se virou array por erro de GM, converte de volta
            const objInv = {};
            window.inventario.forEach(item => {
                if (item.idBase) objInv[item.idBase] = (objInv[item.idBase] || 0) + (item.qtd || 1);
            });
            window.inventario = objInv;
        }

        if (typeof window.syncMoedasInventarioComCarteira === 'function') window.syncMoedasInventarioComCarteira();

        if (typeof window.InventoryStackKeys !== 'undefined') {
            window.InventoryStackKeys.normalizarInventarioStackKeys(window.inventario);
            window.InventoryStackKeys.remapInventarioRecentStackAliases();
        }

        window.barraAtalhos = normalizeBarraAtalhosArray(
            data.barraAtalhos || (window.tutorialProgress && window.tutorialProgress.active
                ? ['Attack', null, 'HP Potion', null, null, null, null, null, null, null, null, null]
                : ['Attack', 'HP Potion', 'Mana Potion', null, null, null, null, null, null, null, null, null])
        );
        
        window.tempoFimBuffGuerreiro = data.tempoFimBuffGuerreiro || 0; 
        window.tempoFimBuffMistico = data.tempoFimBuffMistico || 0;
    window.olympiadPoints = data.olympiadPoints || 0;
    window.olympiadWins = data.olympiadWins || 0;
    window.olympiadLosses = data.olympiadLosses || 0;
    if (window.OlympiadEngine) {
        window.OlympiadEngine.rewardsClaimed = Array.isArray(data.olympiadRewardsClaimed) ? data.olympiadRewardsClaimed : [];
    }

        const _defEnd = {
            weeklyChampionKills: 0,
            weeklyWeekKey: '',
            lastClaimedWeekKey: '',
            lifetimeChampionKills: 0,
            renown: 0
        };
        window.endgameData = (data.endgame && typeof data.endgame === 'object')
            ? Object.assign({}, _defEnd, data.endgame)
            : Object.assign({}, _defEnd);

        (function applyTutorialFromSave(data) {
            var raw = data.tutorial;
            var defLegacy = { v: 1, active: false, step: 99, completed: true, skipped: false };
            var defFresh = { v: 1, active: true, step: 0, completed: false, skipped: false };

            function inferWhenMissing(d) {
                var hasBarra = Array.isArray(d.barraAtalhos) && d.barraAtalhos.some(function (s) { return s != null; });
                var inv = d.inventario;
                var hasInv = inv && typeof inv === 'object' && !Array.isArray(inv) && Object.keys(inv).length > 0;
                var hadOldVer = typeof d.saveVersion === 'number' && d.saveVersion >= 1;
                var hasAdena = typeof d.adenas === 'number' || typeof d.adena === 'number';
                var hasWpn = d.armaEquipadaBase != null;
                if (hadOldVer || hasBarra || hasInv || hasAdena || hasWpn) {
                    return Object.assign({}, defLegacy);
                }
                return Object.assign({}, defFresh);
            }

            if (!raw || typeof raw !== 'object') {
                window.tutorialProgress = inferWhenMissing(data);
                return;
            }
            var completed = !!raw.completed;
            window.tutorialProgress = {
                v: typeof raw.v === 'number' ? raw.v : 1,
                active: !!raw.active && !completed && !raw.skipped,
                step: typeof raw.step === 'number' ? raw.step : (completed ? 99 : 0),
                completed: completed,
                skipped: !!raw.skipped
            };
            if (window.tutorialProgress.completed || window.tutorialProgress.skipped) {
                window.tutorialProgress.active = false;
            }
        })(data);

        if (data.uiCoach && typeof data.uiCoach === 'object') {
            window.uiCoachFlags = {
                menuTownSeen: !!data.uiCoach.menuTownSeen,
                mailboxTipSeen: !!data.uiCoach.mailboxTipSeen,
                missionsTipSeen: !!data.uiCoach.missionsTipSeen,
            };
        } else {
            window.uiCoachFlags = { menuTownSeen: false, mailboxTipSeen: false, missionsTipSeen: false };
        }
        
        if (typeof window.EndgamePursuits !== 'undefined' && typeof window.EndgamePursuits.normalizeAfterLoad === 'function') {
            window.EndgamePursuits.normalizeAfterLoad();
        }
        
        window.inventarioEquips = typeof window.normalizarInventarioEquipsParaInstancias === 'function'
            ? window.normalizarInventarioEquipsParaInstancias(data.inventarioEquips || [])
            : (data.inventarioEquips || []).map((item) => {
                const row = item as LooseEquip;
                if (typeof window.ItemSecurity !== 'undefined' && !window.ItemSecurity.isValidInstance(row)) {
                    const itemBase = (row.base || row) as ItemCatalogBase;
                    return window.ItemSecurity.createInstance(String(row.tipo || 'misc'), itemBase, {
                        uid: row.uid,
                        enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
                        augmented: row.augmented || false,
                        origin: 'Cloud'
                    })!;
                }
                return row as EquipInstance;
            });

        if (typeof window.InventarioRecent !== 'undefined') {
            window.inventarioRecentLog = window.InventarioRecent.normalizeLogFromSave(data.inventarioRecentLog);
            window.InventarioRecent.seedFromCurrentInventory();
            window.InventarioRecent.pruneMissing();
        } else {
            window.inventarioRecentLog = Array.isArray(data.inventarioRecentLog) ? data.inventarioRecentLog : [];
        }

        const validarEquipado = (item: unknown, tipoPadrao: string): EquipInstance | null => {
            if (!item) return null;
            let row = item as LooseEquip;
            if (typeof window.enrichEquipBaseFromCatalogIfNeeded === 'function') {
                row = window.enrichEquipBaseFromCatalogIfNeeded(row) as LooseEquip;
            }
            if (typeof window.ItemSecurity !== 'undefined' && !window.ItemSecurity.isValidInstance(row)) {
                const itemBase = (row.base || row) as ItemCatalogBase;
                return window.ItemSecurity.createInstance(row.tipo || tipoPadrao, itemBase, {
                    uid: row.uid,
                    enchant: row.enchant !== undefined ? row.enchant : (row.enchantArmor || row.enchantJewel || 0),
                    augmented: row.augmented || false,
                    origin: 'Cloud'
                });
            }
            return row as EquipInstance;
        };

        window.armaEquipadaBase = validarEquipado(data.armaEquipadaBase, 'weapon');

        if (window.armaEquipadaBase) {
            var _encW = window.armaEquipadaBase.enchant;
            if (_encW !== undefined && _encW !== null) {
                window.enchant = Number(_encW) || 0;
            }
            // Recover offline augments that kept aug* rolls but lost the `augmented` flag.
            var _augKeys = ['augPAtk', 'augMAtk', 'augPDef', 'augMDef', 'augSpd', 'augCrit', 'augHp'];
            var _hasAugRoll = function (obj: Record<string, unknown> | null | undefined): boolean {
                if (!obj) return false;
                return _augKeys.some(function (k) {
                    var v = obj[k];
                    return typeof v === 'number' && Number.isFinite(v) && v > 0;
                });
            };
            var _armaRec = window.armaEquipadaBase as EquipInstance & Record<string, unknown>;
            var _baseRec = (_armaRec.base && typeof _armaRec.base === 'object')
                ? (_armaRec.base as Record<string, unknown>)
                : null;
            if (_armaRec.augmented || _hasAugRoll(_armaRec) || _hasAugRoll(_baseRec)) {
                _armaRec.augmented = true;
                window.isAugmented = true;
            }
        }

        window.armaduraEquipada = validarEquipado(data.armaduraEquipada, 'armor');
        if (window.armaduraEquipada) {
            var _encA = window.armaduraEquipada.enchant;
            if (_encA !== undefined && _encA !== null) {
                window.enchantArmor = Number(_encA) || 0;
            }
        }
        window.colarEquipado = validarEquipado(data.colarEquipado, 'jewel');
        window.brincoEquipado1 = validarEquipado(data.brincoEquipado1, 'jewel');
        window.brincoEquipado2 = validarEquipado(data.brincoEquipado2, 'jewel');
        window.anelEquipado1 = validarEquipado(data.anelEquipado1, 'jewel');
        window.anelEquipado2 = validarEquipado(data.anelEquipado2, 'jewel');
        
        let armaImg = document.getElementById('arma-img') as HTMLImageElement | null;
        if (armaImg) {
            if (!window.armaEquipadaBase) {
                armaImg.removeAttribute('src');
                armaImg.className = '';
            } else {
                var _abI = window.armaEquipadaBase.base || window.armaEquipadaBase;
                armaImg.src = String(data.armaImgSrc || ((_abI as ItemCatalogBase).img) || '');
                armaImg.className = '';
                if (window.isAugmented) armaImg.classList.add('augmented');
            }
        }
        
        // Combat skill buffs are session-only — never carry Frenzy/etc. across character loads.
        if (typeof window.clearSkillCombatBuffs === 'function') {
            window.clearSkillCombatBuffs();
        }

        // Journey titles must be restored BEFORE combat stats — title flats are applied in calcularStatusGlobais.
        if (typeof window.aplicarGameplayAchievementsFromSave === 'function') {
            window.aplicarGameplayAchievementsFromSave(data.gameplayAchievements);
        }
        if (typeof window.aplicarLevelRewardsFromSave === 'function') {
            window.aplicarLevelRewardsFromSave(data.levelRewards);
        }
        if (typeof window.applyUnseenSkillUnlocksFromSave === 'function') {
            window.applyUnseenSkillUnlocksFromSave(data.unseenSkillUnlocks);
        }
        if (
            typeof window.ExpeditionEngine !== 'undefined'
            && typeof window.ExpeditionEngine.applyRunFromSave === 'function'
        ) {
            window.ExpeditionEngine.applyRunFromSave(data.expeditionRun ?? null);
        }
        if (typeof window.applyExpeditionMetaFromSave === 'function') {
            window.applyExpeditionMetaFromSave(data.expeditionMeta ?? null);
        }

        if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
        if (typeof window.restorePlayerVitalsIfDowned === 'function') window.restorePlayerVitalsIfDowned();
        
        // --- ATUALIZAÇÃO DE PRESENÇA CLOUD (Garantia de Troca de Personagem) ---
        if (typeof window.SupabaseAPI !== 'undefined' && window.SUPABASE_CONFIG.enabled && window.charName) {
            void window.SupabaseAPI.updatePresence(window.charName, data);
        }
        
        if (typeof window.I18n !== 'undefined' && data.uiLocale) {
            window.I18n.applyFromSave(data.uiLocale);
        } else if (typeof window.atualizar === 'function') {
            window.atualizar();
        }

        if (typeof window.LayoutMode !== 'undefined' && typeof window.LayoutMode.applyFromSave === 'function') {
            window.LayoutMode.applyFromSave(data.uiLayoutMode);
        }

        // --- SINCRONIZAÇÃO DE MAILBOX (OFFLINE REWARDS) ---
        if (data.mailboxCloud && Array.isArray(data.mailboxCloud) && data.mailboxCloud.length > 0 && typeof window.MailboxEngine !== 'undefined') {
            const hasNew = window.MailboxEngine.syncFromCloud(
                data.mailboxCloud as import('../types/game').MailboxMessage[],
            );
            if (hasNew) {
                // Se houve novas mensagens, limpamos o banco de dados do personagem para não baixar de novo
                // Mas mantemos as outras propriedades do charData
                setTimeout(async () => {
                    const cleanData = { ...data };
                    delete cleanData.mailboxCloud;
                    if (typeof window.SupabaseAPI !== 'undefined' && window.SupabaseAPI.client) {
                        await (window.SupabaseAPI.client as unknown as {
                            from: (table: string) => {
                                update: (payload: unknown) => {
                                    eq: (col: string, val: string) => Promise<unknown>;
                                };
                            };
                        }).from('characters').update({ data: cleanData }).eq('char_name', window.charName);
                        console.log("☁️ Cloud Mailbox synced and cleaned.");
                    }
                }, 2000);
            }
        }
        
        if (typeof window.inicializarMissoesDiarias === 'function') window.inicializarMissoesDiarias();
        if (typeof window.applyRetentionFromSave === 'function') {
            window.applyRetentionFromSave(data.retention, Number(data.nivel) || 1);
        }
        if (typeof window.atualizarWorldDailyBossUI === 'function') window.atualizarWorldDailyBossUI();
        if (typeof iniciarSistemaMercado === 'function') iniciarSistemaMercado();
        if (typeof verificarPagamentosPendentes === 'function') verificarPagamentosPendentes();
        
        // NOVO: Inicializa histórico da Olympiada após carregar o personagem
        if (typeof window.OlympiadEngine !== 'undefined' && typeof window.OlympiadEngine.init === 'function') {
            window.OlympiadEngine.init();
        }

        window._l2miniLastCarregarChar = nomeKey;
        if (_olyResetOnThisLoad && typeof window.OlympiadEngine !== 'undefined' && window.OlympiadEngine.reset) {
            window.OlympiadEngine.reset();
        }

        if (typeof window.TutorialEngine !== 'undefined' && typeof window.TutorialEngine.afterCharacterLoad === 'function') {
            try {
                window.TutorialEngine.afterCharacterLoad();
            } catch (eTut) { /* ignore */ }
        }

        if (typeof window.RetentionEngine !== 'undefined' && typeof window.RetentionEngine.afterCharacterLoad === 'function') {
            try {
                window.RetentionEngine.afterCharacterLoad();
            } catch (eRet) { /* ignore */ }
        }

        return true;
    } catch (e) { 
        console.error("Erro ao carregar:", e); 
        return false; 
    }
}

window.salvarJogo = salvarJogo;
window.carregarJogo = carregarJogo;

export {};
