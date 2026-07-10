/**
 * STATS CALCULATION ENGINE
 * Migrado: js/core_stats.js
 */
import type { CharacterSave, EquipInstance, ItemCatalogBase, StatPerLevel } from '../types/game';

type StatItem = EquipInstance | ItemCatalogBase | null | undefined;

function getItemStat(item: StatItem, stat: string): number {
  if (!item) return 0;
  const rec = item as Record<string, unknown>;
  let val: unknown = 0;
  const base = rec.base as ItemCatalogBase | undefined;
  if (base && base[stat] !== undefined) val = base[stat];
  else if (rec[stat] !== undefined) val = rec[stat];
  return typeof val === 'number' && !Number.isNaN(val) ? val : 0;
}

function expeditionRunEnchantBonus(slot: string): number {
  try {
    const eng = window.ExpeditionEngine;
    if (eng?.state?.active && typeof eng.getRunEnchantBonus === 'function') {
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

    if (typeof window.bancoDeSkills !== 'undefined' && window.bancoDeSkills['Attack']) {
        let imgAtaque = isMage ? "assets/skills/ataque_mago.png" : "assets/skills/ataque_guerreiro.png";
        window.bancoDeSkills['Attack'].icone = `<img src="${imgAtaque}" style="width: 35px; height: 35px; object-fit: contain; filter: drop-shadow(0 0 3px #000); vertical-align: middle; pointer-events: none;">`;
    }

    let mod = (typeof window.classModifiers !== 'undefined' && window.classModifiers[cl]) ? window.classModifiers[cl] : { hp: 1.0, mp: 1.0, atk: 1.0, def: 1.0, spd: 1.0, crit: 0 };
    let buffFighterLigado = (Date.now() < (window.tempoFimBuffGuerreiro || 0));
    let buffMageLigado = (Date.now() < (window.tempoFimBuffMistico || 0));

    if (buffFighterLigado) { 
        window.buffsAtivos.pAtkMult = 1.20; window.buffsAtivos.pDefMult = 1.20; window.buffsAtivos.mAtkMult = 1.0; window.buffsAtivos.mDefMult = 1.0; 
    } else if (buffMageLigado) { 
        window.buffsAtivos.mAtkMult = 1.30; window.buffsAtivos.mDefMult = 1.10; window.buffsAtivos.pAtkMult = 1.0; window.buffsAtivos.pDefMult = 1.0; 
    } else { 
        window.buffsAtivos.pAtkMult = 1.0; window.buffsAtivos.pDefMult = 1.0; window.buffsAtivos.mAtkMult = 1.0; window.buffsAtivos.mDefMult = 1.0; 
        window.tempoFimBuffGuerreiro = 0; window.tempoFimBuffMistico = 0; 
    }

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
    let armaduraBonusSpd = Math.floor(getStat(armor, 'bonusSpd') * multEnchant);
    let armaduraBonusCrit = Math.floor(getStat(armor, 'bonusCrit') * multEnchant);
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
    let joiasBonusCrit = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'bonusCrit') * (1 + (getJewelEnchant(j) * 0.10))), 0));
    let joiasBonusSpd = Math.floor(joiasAtivas.reduce((soma, j) => soma + (getStat(j, 'bonusSpd') * (1 + (getJewelEnchant(j) * 0.10))), 0));
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
        const mk = (stat) => Math.floor(getStat(j, stat) * (1 + (enl * 0.10)));
        const baseObj = j.base || j;
        const nm = (baseObj as ItemCatalogBase).nome || '?';
        const pushIf = (label, stat, raw) => {
            if (raw > 0) joiasContribLinhas.push({ slot: joiaSlotLabel(j), nome: nm, stat: label, value: raw });
        };
        pushIf('mDef', 'mDef', mk('mDef'));
        pushIf('pAtk', 'pAtk', mk('pAtk'));
        pushIf('mAtk', 'mAtk', mk('mAtk'));
        pushIf('bonusHp', 'bonusHp', mk('bonusHp'));
        pushIf('bonusMp', 'bonusMp', mk('bonusMp'));
        pushIf('bonusCrit', 'bonusCrit', mk('bonusCrit'));
        pushIf('bonusSpd', 'bonusSpd', mk('bonusSpd'));
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
    
    let hpBaseDaClasse = Math.floor((baseHp + ((safeNivel - 1) * hpPerLvl) + bonusAugHp) * mod.hp);
    window.playerStats.maxHp = Math.floor((hpBaseDaClasse + armaduraBonusHp + armaBonusHp + joiasBonusHp) * clanBonusHp); 

    let multCP = isMage ? 0.4 : 0.6;
    if (race === "Orc") multCP += 0.1;
    if (race === "Dwarf") multCP += 0.05;
    window.playerStats.maxCp = Math.floor(window.playerStats.maxHp * multCP);

    let mpBaseDaClasse = Math.floor((baseMp + ((safeNivel - 1) * mpPerLvl)) * mod.mp);
    window.playerStats.maxMp = mpBaseDaClasse + armaduraBonusMp + armaBonusMp + joiasBonusMp;

    let atkFisicoBase = isMage ? (base.danoFighter / 2) : base.danoFighter;
    var _bareW = (typeof window.L2MINI_BARE_HAND_WEAPON_ATK === 'number' && window.L2MINI_BARE_HAND_WEAPON_ATK > 0)
        ? window.L2MINI_BARE_HAND_WEAPON_ATK
        : 5;
    let atkArma = (arma == null) ? _bareW : (getStat(arma, 'atk') || 0);
    let bonusEnchantWpnPAtk = Math.floor(atkArma * 0.10 * lvlWpn); 
    let atkTotal = atkFisicoBase + atkArma + bonusEnchantWpnPAtk + bonusAugPAtk + ((safeNivel - 1) * pAtkPerLvl);
    window.playerStats.pAtk = Math.floor(atkTotal * mod.atk * window.buffsAtivos.pAtkMult * clanBonusPAtk * castleBonusPAtk) + atkArmadura + joiasPAtk;

    let atkMagicoBase = isMage ? base.danoMage : (base.danoMage / 2);
    let matkArma = (arma == null) ? _bareW : (getStat(arma, 'matk') || 0);
    let bonusEnchantWpnMAtk = Math.floor(matkArma * 0.10 * lvlWpn); 
    let matkTotal = atkMagicoBase + matkArma + bonusEnchantWpnMAtk + bonusAugMAtk + ((safeNivel - 1) * mAtkPerLvl);
    window.playerStats.mAtk = Math.floor(matkTotal * mod.atk * window.buffsAtivos.mAtkMult * clanBonusMAtk * castleBonusMAtk) + matkArmadura + joiasMAtk;

    let defTotal = 30 + defArmaduraTotal + ((safeNivel - 1) * pDefPerLvl) + 20 + bonusAugPDef;
    window.playerStats.pDef = Math.floor(defTotal * mod.def * window.buffsAtivos.pDefMult * clanBonusPDef * castleBonusPDef);

    let defMagicaBase = 20;
    let mdefTotal = defMagicaBase + joiasMDef + ((safeNivel - 1) * mDefPerLvl) + bonusAugMDef + armaduraBonusMDef + armaduraFlatMDef;
    window.playerStats.mDef = Math.floor(mdefTotal * mod.def * window.buffsAtivos.mDefMult * castleBonusMDef);
    
    const critRawBeforeCap = Math.floor(base.critico + mod.crit + bonusAugCrit + armaduraBonusCrit + armaBonusCrit + joiasBonusCrit);
    window.playerStats.critRate = (typeof window.applyCritRateCap === 'function')
        ? window.applyCritRateCap(critRawBeforeCap)
        : Math.min(Math.max(0, critRawBeforeCap), 70);
    
    let spdBase = isMage ? base.atkSpeedMage : base.atkSpeedFighter;
    let spdTotal = (spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel)) * mod.spd;
    if (buffFighterLigado) spdTotal *= 0.7; 
    if (buffMageLigado) spdTotal *= 0.6; 
    spdTotal -= bonusAugSpd; spdTotal -= armaduraBonusSpd; spdTotal -= armaBonusSpd; spdTotal -= joiasBonusSpd;
    window.playerStats.atkSpeed = Math.floor(spdTotal * 1.0);
    const atkSpdFlooredBelowMin = window.playerStats.atkSpeed < 250;
    if (atkSpdFlooredBelowMin) { window.playerStats.atkSpeed = 250; }

        if (
        typeof window.ExpeditionEngine !== 'undefined'
        && window.ExpeditionEngine.state
        && window.ExpeditionEngine.state.active
        && !(window.ExpeditionEngine as { _skipRunBuffApply?: boolean })._skipRunBuffApply
        && typeof window.ExpeditionEngine.applyRunBuffsToPlayerStats === 'function'
    ) {
        window.ExpeditionEngine.applyRunBuffsToPlayerStats();
    }

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
        classMod: { atk: mod.atk, def: mod.def, hp: mod.hp, mp: mod.mp, spd: mod.spd, crit: mod.crit },
        buffs: {
            fighter: buffFighterLigado,
            mage: buffMageLigado,
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
            rawBeforeCap: critRawBeforeCap,
            cap: (typeof window.L2MINI_CRIT_RATE_CAP === 'number' ? window.L2MINI_CRIT_RATE_CAP : 70),
        },
        atkSpeed: {
            baseRaceMs: spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel),
            afterModSpd: Math.floor((spdBase - ((safeNivel - 1) * atkSpdMsMenosPorNivel)) * mod.spd),
            buffMeleeMult: buffFighterLigado ? 0.7 : null,
            buffMageMult: buffMageLigado ? 0.6 : null,
            reduceAugMs: bonusAugSpd,
            reduceArmorMs: armaduraBonusSpd,
            reduceWeaponMs: armaBonusSpd,
            reduceJewelsMs: joiasBonusSpd,
            computedMsBeforeFloor: spdTotal,
            floored250: atkSpdFlooredBelowMin,
            totalMs: window.playerStats.atkSpeed
        },
        joiasPorStat: joiasContribLinhas
    };

    if (window.playerHP > window.playerStats.maxHp) window.playerHP = window.playerStats.maxHp;
    if (window.playerMP > window.playerStats.maxMp) window.playerMP = window.playerStats.maxMp;
    if (window.playerCP > window.playerStats.maxCp) window.playerCP = window.playerStats.maxCp;
    
    const _tpPerf = document.getElementById('tela-perfil');
    const _tpVis = _tpPerf && (_tpPerf.style.display === 'contents' || _tpPerf.style.display === 'flex' || _tpPerf.style.display === 'block');
    if (_tpVis) {
        if (typeof window.atualizarVisualPaperdoll === 'function') window.atualizarVisualPaperdoll();
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
        'anelEquipado1', 'anelEquipado2', 'tempoFimBuffGuerreiro', 'tempoFimBuffMistico', 'playerClanId'
    ];
    var backup: Record<string, unknown> = {};
    for (var bi = 0; bi < backupKeys.length; bi++) {
        backup[backupKeys[bi]] = (window as unknown as Record<string, unknown>)[backupKeys[bi]];
    }

    try {
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

        window.tempoFimBuffGuerreiro = saveLike.tempoFimBuffGuerreiro || 0;
        window.tempoFimBuffMistico = saveLike.tempoFimBuffMistico || 0;
        (window as unknown as Record<string, unknown>).playerClanId =
            saveLike.playerClanId !== undefined ? saveLike.playerClanId : null;

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
            atkSpeed: window.playerStats.atkSpeed
        };
    } finally {
        for (var fj = 0; fj < backupKeys.length; fj++) {
            var bk = backupKeys[fj];
            (window as unknown as Record<string, unknown>)[bk] = backup[bk];
        }
        if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
    }
};

export {};
