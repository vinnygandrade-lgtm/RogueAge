/**
 * STATS CALCULATION ENGINE
 * Migrado: js/core_stats.js
 */
import type { CharacterSave, EquipInstance, ItemCatalogBase, StatPerLevel } from '../types/game';
import { getTitleStatBonus, type TitleStatBonus } from '../game/gameplay_title_bonuses';
import { applySkillCombatBuffsToPlayerStats } from '../combat/skill_combat_buffs';
import { resolveEquipHarmony } from './equip_harmony';

type StatItem = EquipInstance | ItemCatalogBase | null | undefined;

function resolveEquippedTitleIdForStats(): string | null {
  const override = (window as unknown as { _calcStatsTitleOverride?: string | null })._calcStatsTitleOverride;
  if (override !== undefined) {
    return override && String(override).trim() ? String(override).trim() : null;
  }
  if (typeof window.getEquippedTitleId === 'function') {
    const id = window.getEquippedTitleId();
    return id && String(id).trim() ? String(id).trim() : null;
  }
  return null;
}

/** Live catalog row by id — balance patches apply even if save still has an old `base` snapshot. */
function lookupLiveCatalogBase(id: string): ItemCatalogBase | null {
  if (!id) return null;
  const cats: Array<ItemCatalogBase[] | undefined> = [
    window.catalogoArmaduras,
    window.catalogoArmas,
    window.catalogoJoias,
  ];
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    if (!Array.isArray(cat)) continue;
    const hit = cat.find((a) => a && a.id === id);
    if (hit) return hit;
  }
  return null;
}

function getItemStat(item: StatItem, stat: string): number {
  if (!item) return 0;
  const rec = item as Record<string, unknown>;
  const base = rec.base as ItemCatalogBase | undefined;
  const id = String((base && base.id) || rec.id || '').trim();
  const live = id ? lookupLiveCatalogBase(id) : null;
  const src = (live || base || rec) as Record<string, unknown>;
  let val: unknown = src[stat];
  if (val === undefined && base && base !== live && base[stat] !== undefined) val = base[stat];
  if (val === undefined && rec[stat] !== undefined) val = rec[stat];
  return typeof val === 'number' && !Number.isNaN(val) ? val : 0;
}

function expeditionRunEnchantBonus(slot: string): number {
  try {
    const eng = window.ExpeditionEngine;
    const effectsOn = eng && typeof (eng as { isRunEffectsActive?: () => boolean }).isRunEffectsActive === 'function'
      ? !!(eng as { isRunEffectsActive: () => boolean }).isRunEffectsActive()
      : !!(eng?.state?.active && !(eng.state as { suspended?: boolean }).suspended);
    if (effectsOn && typeof eng.getRunEnchantBonus === 'function') {
      return Math.max(
        0,
        Number(eng.getRunEnchantBonus(slot as import('../systems/expedition_engine').ExpeditionEnchantSlot)) || 0,
      );
    }
  } catch { /* ignore */ }
  return 0;
}

window.calcularStatusGlobais = function calcularStatusGlobais(): void {
    const race = window.charRace || "Human";
    const cl = window.charClass || "Fighter";
    
    if (!window.statusIniciais || !window.statusIniciais[race]) {
        console.warn("CalcularStatus: Raça não definida ou inválida. Usando padrão.");
    }
    
    let base = (window.statusIniciais && window.statusIniciais[race]) || (window.statusIniciais && window.statusIniciais["Human"]) || { hpFighter: 100, mpFighter: 40, hpMage: 80, mpMage: 80, danoFighter: 10, danoMage: 6, atkSpeedFighter: 3800, atkSpeedMage: 5000, critico: 5 };
    let isMage = typeof window.isClasseMagica === 'function' ? window.isClasseMagica(cl) : false;

    // Keep Attack icon in sync with the hotbar art (legacy ataque_*.png removed).
    if (typeof window.bancoDeSkills !== 'undefined' && window.bancoDeSkills['Attack']) {
        const imgAtaque = 'assets/skills/hf_attack.png';
        window.bancoDeSkills['Attack'].icone =
            `<img src="${imgAtaque}" alt="" style="width:35px;height:35px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 0 3px #000);">`;
    }

    let mod = (typeof window.classModifiers !== 'undefined' && window.classModifiers[cl])
        ? window.classModifiers[cl]
        : { hp: 1.0, mp: 1.0, atk: 1.0, def: 1.0, spd: 1.0, crit: 0, dodge: 1 };

    // Legacy packs retired — always clear timers; Blessing Build is the long-buff source.
    window.tempoFimBuffGuerreiro = 0;
    window.tempoFimBuffMistico = 0;
    if (window.BlessingEngine && typeof window.BlessingEngine.clearExpiredBlessings === 'function') {
        window.BlessingEngine.clearExpiredBlessings();
    }
    // Olympiad clean arena: gear + skills + vitals only (no Grand Master / expedition run %).
    const olyClean =
        typeof window.OlympiadEngine !== 'undefined'
        && typeof (window.OlympiadEngine as { areCleanArenaRulesActive?: () => boolean }).areCleanArenaRulesActive === 'function'
        && !!(window.OlympiadEngine as { areCleanArenaRulesActive: () => boolean }).areCleanArenaRulesActive();
    const emptyBlessingFx = {
        pAtkMult: 1, mAtkMult: 1, pDefMult: 1, mDefMult: 1,
        maxHpMult: 1, maxMpMult: 1, critAdd: 0, castAdd: 0, dodgeAdd: 0, atkSpeedMult: 1,
        poisonResPct: 0, bleedResPct: 0, mpCostReductionPct: 0, ids: [] as string[],
    };
    const blessingFx = olyClean
        ? emptyBlessingFx
        : (
            window.BlessingEngine && typeof window.BlessingEngine.getActiveBlessingEffects === 'function'
                ? window.BlessingEngine.getActiveBlessingEffects()
                : emptyBlessingFx
        );
    window.buffsAtivos.pAtkMult = blessingFx.pAtkMult || 1;
    window.buffsAtivos.pDefMult = blessingFx.pDefMult || 1;
    window.buffsAtivos.mAtkMult = blessingFx.mAtkMult || 1;
    window.buffsAtivos.mDefMult = blessingFx.mDefMult || 1;

    const getStat = getItemStat;

    const arma = window.armaEquipadaBase;
    const armor = window.armaduraEquipada;
    const isAug = window.isAugmented;

    let bonusAugHp   = (isAug && arma) ? getStat(arma, 'augHp') : 0;
    let bonusAugPAtk = (isAug && arma) ? getStat(arma, 'augPAtk') : 0;
    let bonusAugMAtk = (isAug && arma) ? getStat(arma, 'augMAtk') : 0;
    let bonusAugPDef = (isAug && arma) ? getStat(arma, 'augPDef') : 0;
    let bonusAugMDef = (isAug && arma) ? getStat(arma, 'augMDef') : 0;
    let bonusAugSpd  = (isAug && arma) ? getStat(arma, 'augSpd') : 0;
    let bonusAugCrit = (isAug && arma) ? getStat(arma, 'augCrit') : 0;

    let armaBonusHp = getStat(arma, 'bonusHp');
    let armaBonusMp = getStat(arma, 'bonusMp');
    let armaBonusSpd = getStat(arma, 'bonusSpd');
    let armaBonusCrit = getStat(arma, 'bonusCrit');

    // Sincroniza os níveis de encante dos objetos com as globais
    let lvlWpn = (arma && arma.enchant !== undefined) ? arma.enchant : (window.enchant || 0);
    let lvlArm = (armor && armor.enchant !== undefined) ? armor.enchant : (window.enchantArmor || 0);
    lvlWpn += expeditionRunEnchantBonus('weapon');
    lvlArm += expeditionRunEnchantBonus('armor');

    let multEnchant = 1 + (lvlArm * 0.10);
    let armaduraBonusHp = Math.floor(getStat(armor, 'bonusHp') * multEnchant);
    let armaduraBonusMp = Math.floor(getStat(armor, 'bonusMp') * multEnchant);
    // Crit / Dodge / AtkSpd / Cast are budgeted flat (docs/stat-budget.md) — no enchant scale.
    let armaduraBonusSpd = Math.floor(getStat(armor, 'bonusSpd'));
    let armaduraBonusCrit = Math.floor(getStat(armor, 'bonusCrit'));
    let armaduraBonusDodge = Math.floor(getStat(armor, 'bonusDodge'));
    let armaduraBonusMDef = Math.floor(getStat(armor, 'bonusMDef') * multEnchant);
    let armaduraFlatMDef = Math.floor(getStat(armor, 'mDef') * multEnchant);
    
    let atkArmadura = Math.floor(getStat(armor, 'pAtk') * multEnchant);
    let matkArmadura = Math.floor(getStat(armor, 'mAtk') * multEnchant);
    
    let defArmaduraBase = getStat(armor, 'pDef') || getStat(armor, 'def');
    let defArmaduraTotal = Math.floor(defArmaduraBase * multEnchant);

    let joiasAtivas = [
        (window.colarEquipado || null),
        (window.brincoEquipado1 || null),
        (window.brincoEquipado2 || null),
        (window.anelEquipado1 || null),
        (window.anelEquipado2 || null)
    ].filter(j => j !== null);

    const jewelSlotKey = (j: EquipInstance) => {
        if (j === window.colarEquipado) return 'neck';
        if (j === window.brincoEquipado1) return 'ear1';
        if (j === window.brincoEquipado2) return 'ear2';
        if (j === window.anelEquipado1) return 'ring1';
        if (j === window.anelEquipado2) return 'ring2';
        return 'neck';
    };

    const getJewelEnchant = (j: EquipInstance) => {
        const base = j.enchant !== undefined ? j.enchant : (j.enchantJewel || 0);
        return base + expeditionRunEnchantBonus(jewelSlotKey(j));
    };

    let joiasMDef = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'mDef') * (1 + (getJewelEnchant(j) * 0.10))), 0));
    let joiasBonusHp = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'bonusHp') * (1 + (getJewelEnchant(j) * 0.10))), 0)); 
    let joiasBonusMp = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'bonusMp') * (1 + (getJewelEnchant(j) * 0.10))), 0));
    let joiasBonusCrit = Math.floor(joiasAtivas.reduce((soma, j) => soma + getStat(j, 'bonusCrit'), 0));
    let joiasBonusSpd = Math.floor(joiasAtivas.reduce((soma, j) => soma + getStat(j, 'bonusSpd'), 0));
    let joiasBonusCast = Math.floor(joiasAtivas.reduce((soma, j) => soma + getStat(j, 'bonusCastSpeed'), 0));
    let joiasBonusDodge = Math.floor(joiasAtivas.reduce((soma, j) => soma + getStat(j, 'bonusDodge'), 0));
    let joiasPAtk = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'pAtk') * (1 + (getJewelEnchant(j) * 0.10))), 0));
    let joiasMAtk = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'mAtk') * (1 + (getJewelEnchant(j) * 0.10))), 0));

    const joiaSlotLabel = (j) => {
        if (j === window.colarEquipado) return 'neck';
        if (j === window.brincoEquipado1) return 'ear1';
        if (j === window.brincoEquipado2) return 'ear2';
        if (j === window.anelEquipado1) return 'ring1';
        if (j === window.anelEquipado2) return 'ring2';
        return 'jewel';
    };
    let joiasContribLinhas = [];
    joiasAtivas.forEach((j) => {
        const enl = getJewelEnchant(j);
        const mkScaled = (stat) => Math.floor(getStat(j, stat) * (1 + (enl * 0.10)));
        const mkFlat = (stat) => Math.floor(getStat(j, stat));
        const baseObj = j.base || j;
        const nm = (baseObj as ItemCatalogBase).nome || '?';
        const pushIf = (label, stat, raw) => {
            if (raw > 0) joiasContribLinhas.push({ slot: joiaSlotLabel(j), nome: nm, stat: label, value: raw });
        };
        pushIf('mDef', 'mDef', mkScaled('mDef'));
        pushIf('pAtk', 'pAtk', mkScaled('pAtk'));
        pushIf('mAtk', 'mAtk', mkScaled('mAtk'));
        pushIf('bonusHp', 'bonusHp', mkScaled('bonusHp'));
        pushIf('bonusMp', 'bonusMp', mkScaled('bonusMp'));
        pushIf('bonusCrit', 'bonusCrit', mkFlat('bonusCrit'));
        pushIf('bonusSpd', 'bonusSpd', mkFlat('bonusSpd'));
        pushIf('bonusCastSpeed', 'bonusCastSpeed', mkFlat('bonusCastSpeed'));
        pushIf('bonusDodge', 'bonusDodge', mkFlat('bonusDodge'));
    });

    let clanBonusPAtk = 1.0; let clanBonusPDef = 1.0; let clanBonusMAtk = 1.0; let clanBonusHp = 1.0;
    let castleBonusPAtk = 1.0; let castleBonusPDef = 1.0; let castleBonusMAtk = 1.0; let castleBonusMDef = 1.0;

    if (window.clans && window.playerClanId) {
        let meuClan = window.clans.find((c: { id: number | string; level?: number }) => c.id === window.playerClanId);
        if (meuClan && meuClan.level) {
            if (meuClan.level >= 2) clanBonusPAtk = 1.02;
            if (meuClan.level >= 3) clanBonusPDef = 1.02;
            if (meuClan.level >= 4) clanBonusHp = 1.03;
            if (meuClan.level >= 5) clanBonusMAtk = 1.03;
        }

        // Bônus de Castelo (Dominação)
        if (typeof CastleEngine !== 'undefined' && CastleEngine.getCastleBuffs) {
            const cBuffs = CastleEngine.getCastleBuffs();
            if (cBuffs) {
                castleBonusPAtk = cBuffs.pAtkMult;
                castleBonusPDef = cBuffs.pDefMult;
                castleBonusMAtk = cBuffs.mAtkMult;
                castleBonusMDef = cBuffs.mDefMult;
            }
        }
    }

    let baseHp = isMage ? base.hpMage : base.hpFighter;
    let baseMp = isMage ? base.mpMage : base.mpFighter;
    
    // Blindagem de Nível
    const safeNivel = (typeof window.nivel === 'number' && !isNaN(window.nivel)) ? window.nivel : 1;

    const pl: StatPerLevel =
        typeof window.L2MINI_STAT_PER_LEVEL === 'object' && window.L2MINI_STAT_PER_LEVEL
            ? window.L2MINI_STAT_PER_LEVEL
            : { hp: 7, mp: 2, pAtk: 1, mAtk: 1, pDef: 1.2, mDef: 1, atkSpdMs: 0 };
    const hpPerLvl = (typeof pl.hp === 'number') ? pl.hp : 7;
    const mpPerLvl = (typeof pl.mp === 'number') ? pl.mp : 2;
    const pAtkPerLvl = (typeof pl.pAtk === 'number') ? pl.pAtk : 1;
    const mAtkPerLvl = (typeof pl.mAtk === 'number') ? pl.mAtk : 1;
    const pDefPerLvl = (typeof pl.pDef === 'number') ? pl.pDef : 1.2;
    const mDefPerLvl = (typeof pl.mDef === 'number') ? pl.mDef : 1;
    const atkSpdMsMenosPorNivel = (typeof pl.atkSpdMs === 'number' && pl.atkSpdMs >= 0) ? pl.atkSpdMs : 0;

    const equippedTitleId = resolveEquippedTitleIdForStats();
    const titleBonus: TitleStatBonus = equippedTitleId ? getTitleStatBonus(equippedTitleId) : {
      pAtk: 0, mAtk: 0, pDef: 0, mDef: 0, maxHp: 0, maxMp: 0, critRate: 0, atkSpeedMs: 0, castSpeedPct: 0,
    };
    
    let hpBaseDaClasse = Math.floor((baseHp + ((safeNivel - 1) * hpPerLvl) + bonusAugHp) * mod.hp);
    window.playerStats.maxHp = Math.floor((hpBaseDaClasse + armaduraBonusHp + armaBonusHp + joiasBonusHp) * clanBonusHp);
    if (titleBonus.maxHp > 0) window.playerStats.maxHp += titleBonus.maxHp;
    if (blessingFx.maxHpMult && blessingFx.maxHpMult !== 1) {
        window.playerStats.maxHp = Math.floor(window.playerStats.maxHp * blessingFx.maxHpMult);
    }

    let multCP = isMage ? 0.4 : 0.6;
    if (race === "Orc") multCP += 0.1;
    if (race === "Dwarf") multCP += 0.05;
    window.playerStats.maxCp = Math.floor(window.playerStats.maxHp * multCP);

    let mpBaseDaClasse = Math.floor((baseMp + ((safeNivel - 1) * mpPerLvl)) * mod.mp);
    window.playerStats.maxMp = mpBaseDaClasse + armaduraBonusMp + armaBonusMp + joiasBonusMp;
    if (titleBonus.maxMp > 0) window.playerStats.maxMp += titleBonus.maxMp;
    if (blessingFx.maxMpMult && blessingFx.maxMpMult !== 1) {
        window.playerStats.maxMp = Math.floor(window.playerStats.maxMp * blessingFx.maxMpMult);
    }

    let atkFisicoBase = isMage ? (base.danoFighter / 2) : base.danoFighter;
    var _bareW = (typeof window.L2MINI_BARE_HAND_WEAPON_ATK === 'number' && window.L2MINI_BARE_HAND_WEAPON_ATK > 0)
        ? window.L2MINI_BARE_HAND_WEAPON_ATK
        : 5;
    let atkArma = (arma == null) ? _bareW : (getStat(arma, 'atk') || 0);
    let bonusEnchantWpnPAtk = Math.floor(atkArma * 0.10 * lvlWpn); 
    let atkTotal = atkFisicoBase + atkArma + bonusEnchantWpnPAtk + bonusAugPAtk + ((safeNivel - 1) * pAtkPerLvl);
    window.playerStats.pAtk = Math.floor(atkTotal * mod.atk * window.buffsAtivos.pAtkMult * clanBonusPAtk * castleBonusPAtk) + atkArmadura + joiasPAtk;
    if (titleBonus.pAtk > 0) window.playerStats.pAtk += titleBonus.pAtk;

    let atkMagicoBase = isMage ? base.danoMage : (base.danoMage / 2);
    let matkArma = (arma == null) ? _bareW : (getStat(arma, 'matk') || 0);
    let bonusEnchantWpnMAtk = Math.floor(matkArma * 0.10 * lvlWpn); 
    let matkTotal = atkMagicoBase + matkArma + bonusEnchantWpnMAtk + bonusAugMAtk + ((safeNivel - 1) * mAtkPerLvl);
    window.playerStats.mAtk = Math.floor(matkTotal * mod.atk * window.buffsAtivos.mAtkMult * clanBonusMAtk * castleBonusMAtk) + matkArmadura + joiasMAtk;
    if (titleBonus.mAtk > 0) window.playerStats.mAtk += titleBonus.mAtk;

    let defTotal = 30 + defArmaduraTotal + ((safeNivel - 1) * pDefPerLvl) + 20 + bonusAugPDef;
    window.playerStats.pDef = Math.floor(defTotal * mod.def * window.buffsAtivos.pDefMult * clanBonusPDef * castleBonusPDef);
    if (titleBonus.pDef > 0) window.playerStats.pDef += titleBonus.pDef;

    let defMagicaBase = 20;
    let mdefTotal = defMagicaBase + joiasMDef + ((safeNivel - 1) * mDefPerLvl) + bonusAugMDef + armaduraBonusMDef + armaduraFlatMDef;
    window.playerStats.mDef = Math.floor(mdefTotal * mod.def * window.buffsAtivos.mDefMult * castleBonusMDef);
    if (titleBonus.mDef > 0) window.playerStats.mDef += titleBonus.mDef;
    
    const blessingCritAdd = Math.max(0, Math.floor(Number(blessingFx.critAdd) || 0));
    const blessingDodgeAdd = Math.max(0, Math.floor(Number(blessingFx.dodgeAdd) || 0));
    const blessingCastAdd = Math.max(0, Math.floor(Number(blessingFx.castAdd) || 0));
    const blessingAtkSpdMult =
        typeof blessingFx.atkSpeedMult === 'number' && blessingFx.atkSpeedMult > 0
            ? blessingFx.atkSpeedMult
            : 1;

    // Budgeted linear sum — no soft-cap (docs/stat-budget.md).
    const critRawBeforeCap = Math.floor(
      base.critico + mod.crit + bonusAugCrit + armaduraBonusCrit + armaBonusCrit + joiasBonusCrit + titleBonus.critRate + blessingCritAdd,
    );
    window.playerStats.critRate = Math.max(0, critRawBeforeCap);

    const dodgePerLvl =
        typeof window.L2MINI_DODGE_PER_LEVEL === 'number' && window.L2MINI_DODGE_PER_LEVEL >= 0
            ? window.L2MINI_DODGE_PER_LEVEL
            : 0.06;
    const classDodge = Math.max(0, Number((mod as { dodge?: number }).dodge) || 0);
    const dodgeFromLevel = Math.floor((safeNivel - 1) * dodgePerLvl);
    let dodgeInvestmentRaw = Math.floor(classDodge + dodgeFromLevel + armaduraBonusDodge + joiasBonusDodge + blessingDodgeAdd);
    window.playerStats.dodgeRate = Math.max(0, dodgeInvestmentRaw);
    
    let spdBase = isMage ? base.atkSpeedMage : base.atkSpeedFighter;
    let spdTotal = (spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel)) * mod.spd;
    if (blessingAtkSpdMult !== 1) spdTotal *= blessingAtkSpdMult;
    spdTotal -= bonusAugSpd; spdTotal -= armaduraBonusSpd; spdTotal -= armaBonusSpd; spdTotal -= joiasBonusSpd;
    if (titleBonus.atkSpeedMs > 0) spdTotal -= titleBonus.atkSpeedMs;

    let atkSpeedRawMs = Math.floor(spdTotal * 1.0);

    // Casting Speed % — gear + title first; skill buffs (Concentration) add on top.
    const gradeCastTable: Record<string, number> = {
      'No-Grade': 2, D: 4, C: 6, B: 8, A: 11, S: 14,
    };
    const armorBase = (armor?.base || armor) as ItemCatalogBase | null | undefined;
    const weaponBase = (arma?.base || arma) as ItemCatalogBase | null | undefined;
    const armorTipo = String(armorBase?.tipo || '');
    const weaponTipo = String(weaponBase?.tipo || '');
    const armorGrade = String(armorBase?.grade || 'No-Grade');
    const weaponGrade = String(weaponBase?.grade || 'No-Grade');

    let castFromArmor = Math.max(0, Math.floor(getStat(armor, 'bonusCastSpeed')));
    if (castFromArmor <= 0 && armorTipo === 'Robe') {
      castFromArmor = gradeCastTable[armorGrade] ?? 2;
      // Light enchant scaling on robe innate cast speed
      castFromArmor += Math.min(4, Math.floor(lvlArm / 6));
    }
    let castFromWeapon = Math.max(0, Math.floor(getStat(arma, 'bonusCastSpeed')));
    if (castFromWeapon <= 0 && (weaponTipo === 'Magic Sword' || /staff/i.test(String(weaponBase?.nome || '')))) {
      castFromWeapon = Math.max(1, Math.floor((gradeCastTable[weaponGrade] ?? 2) * 0.75));
      castFromWeapon += Math.min(3, Math.floor(lvlWpn / 8));
    }
    const castFromTitle = Math.max(0, Math.floor(titleBonus.castSpeedPct || 0));
    let castSpeedRawPct = Math.max(
        0,
        castFromArmor + castFromWeapon + castFromTitle + joiasBonusCast + blessingCastAdd,
    );

    // Equip Harmony: +N% to combat stats where N = min enchant of a complete set (7 slots).
    const harmony = resolveEquipHarmony();
    let harmonyAppliedPct = 0;
    if (harmony.active && harmony.pct > 0) {
        const hm = harmony.mult;
        harmonyAppliedPct = harmony.pct;
        window.playerStats.maxHp = Math.floor(window.playerStats.maxHp * hm);
        window.playerStats.maxMp = Math.floor(window.playerStats.maxMp * hm);
        window.playerStats.maxCp = Math.floor(window.playerStats.maxHp * multCP);
        window.playerStats.pAtk = Math.floor(window.playerStats.pAtk * hm);
        window.playerStats.mAtk = Math.floor(window.playerStats.mAtk * hm);
        window.playerStats.pDef = Math.floor(window.playerStats.pDef * hm);
        window.playerStats.mDef = Math.floor(window.playerStats.mDef * hm);
        // Crit / Dodge / Cast / AtkSpeed intentionally excluded (content budget).
    }

    // Raw gear investment — skill combat buffs (Ultimate Evasion / Concentration) may add on top.
    (window as Window & { _l2DodgeRawGear?: number })._l2DodgeRawGear = dodgeInvestmentRaw;
    (window as Window & { _l2CastSpeedRawGear?: number })._l2CastSpeedRawGear = castSpeedRawPct;
    const castBeforeBuffs = Math.max(0, Math.floor(castSpeedRawPct));
    window.playerStats.castSpeed = castBeforeBuffs;

    // Absolute timer floor only (no world soft-floor).
    const ATK_SPEED_ABS_MIN_MS = 50;
    window.playerStats.atkSpeed = Math.max(ATK_SPEED_ABS_MIN_MS, Math.floor(atkSpeedRawMs));
    const atkSpdSoftApplied = false;

        if (
        !olyClean
        && typeof window.ExpeditionEngine !== 'undefined'
        && window.ExpeditionEngine.state
        && !(window.ExpeditionEngine as { _skipRunBuffApply?: boolean })._skipRunBuffApply
        && typeof window.ExpeditionEngine.applyRunBuffsToPlayerStats === 'function'
        && (
            typeof (window.ExpeditionEngine as { isRunEffectsActive?: () => boolean }).isRunEffectsActive === 'function'
                ? (window.ExpeditionEngine as { isRunEffectsActive: () => boolean }).isRunEffectsActive()
                : !!(window.ExpeditionEngine.state.active && !(window.ExpeditionEngine.state as { suspended?: boolean }).suspended)
        )
    ) {
        window.ExpeditionEngine.applyRunBuffsToPlayerStats();
    }

    // Skill combat buffs (Frenzy, Shield, etc.) — re-applied after every full rebuild so equip/level-up cannot wipe them.
    applySkillCombatBuffsToPlayerStats();

    // Auditoria única para a UI "Detailed status"
    const innerPAtk = Math.floor(atkTotal * mod.atk * window.buffsAtivos.pAtkMult * clanBonusPAtk * castleBonusPAtk);
    const innerMAtk = Math.floor(matkTotal * mod.atk * window.buffsAtivos.mAtkMult * clanBonusMAtk * castleBonusMAtk);
    const innerPDef = Math.floor(defTotal * mod.def * window.buffsAtivos.pDefMult * clanBonusPDef * castleBonusPDef);
    const innerMDef = Math.floor(mdefTotal * mod.def * window.buffsAtivos.mDefMult * castleBonusMDef);
    window.playerStatBreakdown = {
        nivel: safeNivel,
        charRace: race,
        charClass: cl,
        isMage,
        armorEnchant: lvlArm,
        weaponEnchant: lvlWpn,
        perLevel: { hpPerLvl, mpPerLvl, pAtkPerLvl, mAtkPerLvl, pDefPerLvl, mDefPerLvl, atkSpdMsMenosPorNivel },
        classMod: {
            atk: mod.atk,
            def: mod.def,
            hp: mod.hp,
            mp: mod.mp,
            spd: mod.spd,
            crit: mod.crit,
            dodge: classDodge,
        },
        buffs: {
            fighter: false,
            mage: false,
            blessingIdsCsv: Array.isArray(blessingFx.ids) ? blessingFx.ids.join(',') : '',
            blessingActive: Array.isArray(blessingFx.ids) && blessingFx.ids.length > 0,
            critAdd: blessingCritAdd,
            castAdd: blessingCastAdd,
            dodgeAdd: blessingDodgeAdd,
            atkSpeedMult: blessingAtkSpdMult,
            maxHpMult: blessingFx.maxHpMult || 1,
            maxMpMult: blessingFx.maxMpMult || 1,
            pAtkMult: window.buffsAtivos.pAtkMult,
            pDefMult: window.buffsAtivos.pDefMult,
            mAtkMult: window.buffsAtivos.mAtkMult,
            mDefMult: window.buffsAtivos.mDefMult
        },
        clan: {
            clanId: window.playerClanId != null ? window.playerClanId : null,
            hp: clanBonusHp,
            pAtk: clanBonusPAtk,
            pDef: clanBonusPDef,
            mAtk: clanBonusMAtk
        },
        castle: {
            pAtk: castleBonusPAtk,
            pDef: castleBonusPDef,
            mAtk: castleBonusMAtk,
            mDef: castleBonusMDef,
            castlesOwned: castleBonusPAtk > 1 ? Math.round((castleBonusPAtk - 1) / 0.01) : 0
        },
        title: {
            titleId: equippedTitleId,
            pAtk: titleBonus.pAtk,
            mAtk: titleBonus.mAtk,
            pDef: titleBonus.pDef,
            mDef: titleBonus.mDef,
            maxHp: titleBonus.maxHp,
            maxMp: titleBonus.maxMp,
            critRate: titleBonus.critRate,
            atkSpeedMs: titleBonus.atkSpeedMs,
            castSpeedPct: titleBonus.castSpeedPct,
        },
        hp: {
            raceBaseHp: baseHp,
            hpPerLevels: ((safeNivel - 1) * hpPerLvl),
            augmentFromWeapon: bonusAugHp,
            classHpMult: mod.hp,
            characterPool: hpBaseDaClasse,
            armor: armaduraBonusHp,
            weapon: armaBonusHp,
            jewels: joiasBonusHp,
            clanMultOnSum: clanBonusHp,
            title: titleBonus.maxHp,
            total: window.playerStats.maxHp
        },
        mp: {
            raceBaseMp: baseMp,
            mpPerLevels: ((safeNivel - 1) * mpPerLvl),
            classMpMult: mod.mp,
            mpBaseDaClasse,
            armor: armaduraBonusMp,
            weapon: armaBonusMp,
            jewels: joiasBonusMp,
            title: titleBonus.maxMp,
            total: window.playerStats.maxMp
        },
        cpMult: multCP,
        cpTotal: window.playerStats.maxCp,
        pAtk: {
            raceBaseMelee: atkFisicoBase,
            levelPts: Math.floor(((safeNivel - 1) * pAtkPerLvl)),
            weaponBase: atkArma,
            weaponEnchant: bonusEnchantWpnPAtk,
            augment: bonusAugPAtk,
            atkTotalCore: atkTotal,
            afterMultsNoEquip: innerPAtk,
            armorEquip: atkArmadura,
            jewelsEquip: joiasPAtk,
            title: titleBonus.pAtk,
            total: window.playerStats.pAtk
        },
        mAtk: {
            raceBaseMagic: atkMagicoBase,
            levelPts: Math.floor(((safeNivel - 1) * mAtkPerLvl)),
            weaponBaseM: matkArma,
            weaponEnchantM: bonusEnchantWpnMAtk,
            augment: bonusAugMAtk,
            matkTotalCore: matkTotal,
            afterMultsNoEquip: innerMAtk,
            armorEquip: matkArmadura,
            jewelsEquip: joiasMAtk,
            title: titleBonus.mAtk,
            total: window.playerStats.mAtk
        },
        pDef: {
            flatMeleeBlock: 30,
            flatCore: 20,
            armorPDef: defArmaduraTotal,
            levelPts: Number((((safeNivel - 1) * pDefPerLvl)).toFixed(1)),
            augment: bonusAugPDef,
            rawSumBeforeMult: defTotal,
            afterClassBuffClanCastle: innerPDef,
            title: titleBonus.pDef,
            total: window.playerStats.pDef
        },
        mDef: {
            flatBase: defMagicaBase,
            armorBonusMDef: armaduraBonusMDef,
            armorFlatMDef: armaduraFlatMDef,
            jewelsFlat: joiasMDef,
            levelPts: Number((((safeNivel - 1) * mDefPerLvl)).toFixed(1)),
            augment: bonusAugMDef,
            rawSumBeforeMult: mdefTotal,
            afterClassBuffClanCastle: innerMDef,
            title: titleBonus.mDef,
            total: window.playerStats.mDef
        },
        critRate: window.playerStats.critRate,
        critParts: {
            base: base.critico,
            modClass: mod.crit,
            augment: bonusAugCrit,
            armor: armaduraBonusCrit,
            weapon: armaBonusCrit,
            jewels: joiasBonusCrit,
            blessing: blessingCritAdd,
            title: titleBonus.critRate,
            rawBeforeCap: critRawBeforeCap,
            softCap: (typeof window.L2MINI_CRIT_SOFT_CAP === 'number' ? window.L2MINI_CRIT_SOFT_CAP : 55),
            cap: (typeof window.L2MINI_CRIT_RATE_CAP === 'number' ? window.L2MINI_CRIT_RATE_CAP : 90),
        },
        dodgeRate: window.playerStats.dodgeRate,
        dodgeParts: {
            modClass: classDodge,
            fromLevel: dodgeFromLevel,
            armor: armaduraBonusDodge,
            jewels: joiasBonusDodge,
            blessing: blessingDodgeAdd,
            rawBeforeCap: dodgeInvestmentRaw,
            softCap: (typeof window.L2MINI_DODGE_SOFT_CAP === 'number' ? window.L2MINI_DODGE_SOFT_CAP : 30),
            cap: (typeof window.L2MINI_DODGE_RATE_CAP === 'number' ? window.L2MINI_DODGE_RATE_CAP : 55),
            perLevel: dodgePerLvl,
        },
        atkSpeed: {
            baseRaceMs: spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel),
            afterModSpd: Math.floor((spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel)) * mod.spd),
            buffMeleeMult: null,
            buffMageMult: null,
            blessingAtkSpeedMult: blessingAtkSpdMult !== 1 ? blessingAtkSpdMult : null,
            reduceAugMs: bonusAugSpd,
            reduceArmorMs: armaduraBonusSpd,
            reduceWeaponMs: armaBonusSpd,
            reduceJewelsMs: joiasBonusSpd,
            reduceTitleMs: titleBonus.atkSpeedMs,
            computedMsBeforeFloor: atkSpeedRawMs,
            softMinMs: (typeof window.L2MINI_ATK_SPEED_SOFT_MS === 'number' ? window.L2MINI_ATK_SPEED_SOFT_MS : 280),
            hardMinMs: (typeof window.L2MINI_ATK_SPEED_HARD_MS === 'number' ? window.L2MINI_ATK_SPEED_HARD_MS : 160),
            floored250: atkSpdSoftApplied,
            softFloored: atkSpdSoftApplied,
            totalMs: window.playerStats.atkSpeed
        },
        castSpeed: {
            fromArmor: castFromArmor,
            fromWeapon: castFromWeapon,
            fromTitle: castFromTitle,
            fromJewels: joiasBonusCast,
            fromBlessing: blessingCastAdd,
            fromHarmony: 0,
            rawBeforeCap: castSpeedRawPct,
            gearSoftPct: castBeforeBuffs,
            softCap: 0,
            hardCap: 0,
            fromBuffs: Math.max(
                0,
                (window.playerStats.castSpeed || 0) - castBeforeBuffs,
            ),
            totalPct: window.playerStats.castSpeed || 0,
            capped: false,
        },
        harmony: {
            complete: harmony.complete,
            level: harmony.level,
            pct: harmony.pct,
            active: harmony.active,
        },
        joiasPorStat: joiasContribLinhas
    };

    // Inspeção cloud (`calcularStatusGlobaisFromData`) aplica temporariamente o save do alvo —
    // não clampar vitais do jogador local contra o maxHp/Mp/Cp alheio (sintoma: HP/MP/CP baixam ao inspecionar).
    const skipVitalClamp = !!(window as unknown as { _calcStatsSkipVitalClamp?: boolean })._calcStatsSkipVitalClamp;
    if (!skipVitalClamp) {
        if (window.playerHP > window.playerStats.maxHp) window.playerHP = window.playerStats.maxHp;
        if (window.playerMP > window.playerStats.maxMp) window.playerMP = window.playerStats.maxMp;
        if (window.playerCP > window.playerStats.maxCp) window.playerCP = window.playerStats.maxCp;
    }

    // Glow/slots only (no 1080× layer rebuild) when Profile is visible — e.g. after enchant.
    const _tpPerf = document.getElementById('tela-perfil');
    const _tpVis = !!(
        _tpPerf
        && (_tpPerf.style.display === 'contents' || _tpPerf.style.display === 'flex' || _tpPerf.style.display === 'block')
    );
    if (_tpVis) {
        try {
            if (typeof window.atualizarBrilhoArma === 'function') window.atualizarBrilhoArma();
            if (typeof window.syncProfileEquipmentSlotGlows === 'function') {
                window.syncProfileEquipmentSlotGlows();
            }
        } catch (eGlow) { /* ignore */ }
    }
};

/** Raid/Olympiad defeat can persist HP 0 in save — restores vitals when out of combat. */
window.restorePlayerVitalsIfDowned = function restorePlayerVitalsIfDowned(): void {
    if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
    const ps = window.playerStats;
    if (!ps) return;
    const maxHp = Math.max(1, Math.floor(Number(ps.maxHp) || 100));
    const maxMp = Math.max(1, Math.floor(Number(ps.maxMp) || 50));
    const maxCp = Math.max(1, Math.floor(Number(ps.maxCp) || 60));
    if (!Number.isFinite(window.playerHP) || window.playerHP <= 0) window.playerHP = maxHp;
    if (!Number.isFinite(window.playerMP) || window.playerMP < 0) window.playerMP = maxMp;
    if (!Number.isFinite(window.playerCP) || window.playerCP < 0) window.playerCP = maxCp;
};

/**
 * Recalcula combat stats com o mesmo motor que o jogo (`calcularStatusGlobais`) a partir de um blob
 * estilo save — usado na inspeção cloud (`ui_chat.js`). O JSONB não tem `playerStats` fiável e a RPC
 * `get_player_stats_autoritativo` só devolve o raw `data`; por isso o modal deve usar isto, não o JSON.
 * Repõe sempre os globais do jogador local no `finally` (incl. segundo `calcularStatusGlobais()`).
 * Ver GDD §7 — Inspeção cloud (inspeção + Olimpíada) e `olympiad_engine.js` (applyRealPlayerStatsFromCloudRow).
 */
window.calcularStatusGlobaisFromData = function calcularStatusGlobaisFromData(
    saveLike: Partial<CharacterSave> | null | undefined,
) {
    if (!saveLike || typeof saveLike !== 'object') return null;

    var coerce = (typeof window.coerceInspectEquipItem === 'function')
        ? window.coerceInspectEquipItem
        : function (x: unknown) { return x; };
    var pickEq = (typeof window.pickInspectSaveEquip === 'function')
        ? window.pickInspectSaveEquip
        : function (rd: Record<string, unknown> | null | undefined, keys: string[]) {
            if (!rd || !keys || !keys.length) return null;
            for (var i = 0; i < keys.length; i++) {
                var pk = keys[i];
                if (Object.prototype.hasOwnProperty.call(rd, pk) && rd[pk] != null) return rd[pk];
            }
            return null;
        };

    var defaultArma = null;

    var backupKeys = [
        'charRace', 'charGender', 'charClass', 'nivel', 'enchant', 'enchantArmor', 'isAugmented',
        'armaEquipadaBase', 'armaduraEquipada', 'colarEquipado', 'brincoEquipado1', 'brincoEquipado2',
        'anelEquipado1', 'anelEquipado2', 'tempoFimBuffGuerreiro', 'tempoFimBuffMistico', 'blessingBuild', 'playerClanId',
        '_calcStatsTitleOverride',
        '_calcStatsSkipSkillBuffs',
        '_calcStatsSkipVitalClamp',
    ];
    var backup: Record<string, unknown> = {};
    for (var bi = 0; bi < backupKeys.length; bi++) {
        backup[backupKeys[bi]] = (window as unknown as Record<string, unknown>)[backupKeys[bi]];
    }
    // Vitais do jogador local — o clamp em calcularStatusGlobais() usava o max do alvo e “roubava” HP/MP/CP.
    var backupHP = window.playerHP;
    var backupMP = window.playerMP;
    var backupCP = window.playerCP;

    try {
        (window as unknown as { _calcStatsSkipSkillBuffs?: boolean })._calcStatsSkipSkillBuffs = true;
        (window as unknown as { _calcStatsSkipVitalClamp?: boolean })._calcStatsSkipVitalClamp = true;
        window.charRace = saveLike.charRace || 'Human';
        window.charClass = saveLike.charClass || 'Fighter';
        if (saveLike.charGender) window.charGender = saveLike.charGender;
        var nl = saveLike.nivel;
        window.nivel = typeof nl === 'number' && !Number.isNaN(nl) ? nl : parseInt(String(nl), 10) || 1;
        window.enchant = saveLike.enchant != null ? saveLike.enchant : 0;
        window.enchantArmor = saveLike.enchantArmor != null ? saveLike.enchantArmor : 0;
        window.isAugmented = !!saveLike.isAugmented;

        var armaR = pickEq(saveLike, ['armaEquipadaBase', 'arma_equipada_base', 'ArmaEquipadaBase']);
        var wpn = coerce(armaR, 'weapon') as EquipInstance | null;
        window.armaEquipadaBase = wpn || defaultArma;

        window.armaduraEquipada = coerce(
            pickEq(saveLike, ['armaduraEquipada', 'armadura_equipada', 'ArmaduraEquipada', 'ArmorEquipped', 'equippedArmor']),
            'armor',
        ) as EquipInstance | null;

        var c1 = saveLike.colarEquipado != null ? saveLike.colarEquipado : saveLike.colar_equipado;
        var c2 = saveLike.brincoEquipado1 != null ? saveLike.brincoEquipado1 : saveLike.brinco_equipado1;
        var c3 = saveLike.brincoEquipado2 != null ? saveLike.brincoEquipado2 : saveLike.brinco_equipado2;
        var c4 = saveLike.anelEquipado1 != null ? saveLike.anelEquipado1 : saveLike.anel_equipado1;
        var c5 = saveLike.anelEquipado2 != null ? saveLike.anelEquipado2 : saveLike.anel_equipado2;
        window.colarEquipado = coerce(c1, 'jewel') as EquipInstance | null;
        window.brincoEquipado1 = coerce(c2, 'jewel') as EquipInstance | null;
        window.brincoEquipado2 = coerce(c3, 'jewel') as EquipInstance | null;
        window.anelEquipado1 = coerce(c4, 'jewel') as EquipInstance | null;
        window.anelEquipado2 = coerce(c5, 'jewel') as EquipInstance | null;

        window.tempoFimBuffGuerreiro = 0;
        window.tempoFimBuffMistico = 0;
        if (window.BlessingEngine && typeof window.BlessingEngine.normalizeBlessingBuild === 'function') {
            window.blessingBuild = window.BlessingEngine.normalizeBlessingBuild(saveLike.blessingBuild);
        } else {
            window.blessingBuild = (saveLike.blessingBuild as typeof window.blessingBuild) || null;
        }
        (window as unknown as Record<string, unknown>).playerClanId =
            saveLike.playerClanId !== undefined ? saveLike.playerClanId : null;

        const gaRaw = saveLike.gameplayAchievements;
        (window as unknown as { _calcStatsTitleOverride?: string | null })._calcStatsTitleOverride =
            gaRaw && typeof gaRaw.equippedTitleId === 'string' && gaRaw.equippedTitleId.trim()
                ? gaRaw.equippedTitleId.trim()
                : null;

        if (typeof window.calcularStatusGlobais !== 'function') return null;
        window.calcularStatusGlobais();

        return {
            maxHp: window.playerStats.maxHp,
            maxMp: window.playerStats.maxMp,
            maxCp: window.playerStats.maxCp,
            pAtk: window.playerStats.pAtk,
            mAtk: window.playerStats.mAtk,
            pDef: window.playerStats.pDef,
            mDef: window.playerStats.mDef,
            critRate: window.playerStats.critRate,
            dodgeRate: window.playerStats.dodgeRate,
            atkSpeed: window.playerStats.atkSpeed,
            castSpeed: window.playerStats.castSpeed
        };
    } finally {
        for (var fj = 0; fj < backupKeys.length; fj++) {
            var bk = backupKeys[fj];
            (window as unknown as Record<string, unknown>)[bk] = backup[bk];
        }
        if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
        // Repor vitais depois do recalc local (maxHp/Mp/Cp já são os teus outra vez).
        if (Number.isFinite(backupHP)) window.playerHP = backupHP as number;
        if (Number.isFinite(backupMP)) window.playerMP = backupMP as number;
        if (Number.isFinite(backupCP)) window.playerCP = backupCP as number;
        if (window.playerStats) {
            if (window.playerHP > window.playerStats.maxHp) window.playerHP = window.playerStats.maxHp;
            if (window.playerMP > window.playerStats.maxMp) window.playerMP = window.playerStats.maxMp;
            if (window.playerCP > window.playerStats.maxCp) window.playerCP = window.playerStats.maxCp;
        }
    }
};

export {};
