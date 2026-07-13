/**
 * OlympiadBots — geração de duelistas para arena, raid e guerra.
 * Migrado: js/olympiad_bots.js — Fase 4: tipos explícitos.
 * Depende de: linhagemClasses, arvoreDeSkills, bancoDeSkills, catálogos, statusIniciais, classModifiers.
 */

import type { ItemCatalogBase, OlympiadBotsApi, OlympiadRival, SkillCatalogEntry, StatPerLevel } from '../types/game';
import { registerGlobal } from '../runtime/register-global';

function olySkillCatalog(): Record<string, SkillCatalogEntry> {
    return window.bancoDeSkills ?? {};
}

function olySkillTree(): Record<string, Array<{ lvl: number; nome: string }>> {
    return window.arvoreDeSkills ?? {};
}

function olyClassLineage(): Record<string, string[]> {
    return window.linhagemClasses ?? {};
}

function olyWeaponCatalog(): ItemCatalogBase[] {
    return window.catalogoArmas ?? (typeof catalogoArmas !== 'undefined' ? catalogoArmas : []);
}

function olyArmorCatalog(): ItemCatalogBase[] {
    return window.catalogoArmaduras ?? (typeof catalogoArmaduras !== 'undefined' ? catalogoArmaduras : []);
}

function olyJewelCatalog(): ItemCatalogBase[] {
    return window.catalogoJoias ?? (typeof catalogoJoias !== 'undefined' ? catalogoJoias : []);
}

const DEFAULT_RACE_STATUS = {
    hpFighter: 100,
    mpFighter: 50,
    hpMage: 80,
    mpMage: 100,
    danoFighter: 10,
    danoMage: 10,
    atkSpeedFighter: 3800,
    atkSpeedMage: 5000,
    critico: 5,
};

const DEFAULT_CLASS_MOD = { hp: 1.0, mp: 1.0, atk: 1.0, def: 1.0, spd: 1.0, crit: 0 };

const OlympiadBots = {
    obterSkillsBot(classeBot: string, nivelBot: number) {
        const skillsDoBot: Array<Record<string, unknown>> = [];
        const linhagem = olyClassLineage()[classeBot];
        if (!linhagem) return [];

        const skillTree = olySkillTree();
        const skillCatalog = olySkillCatalog();

        linhagem.forEach((cls) => {
            const tree = skillTree[cls];
            if (!tree) return;
            tree.forEach((habilidade) => {
                if (nivelBot >= habilidade.lvl) {
                    const dadosSkill = skillCatalog[habilidade.nome];
                    if (dadosSkill && habilidade.nome !== 'Attack') {
                        skillsDoBot.push({ ...dadosSkill, idNome: habilidade.nome });
                    }
                }
            });
        });
        return skillsDoBot;
    },

    /**
     * Skills colocadas na barra do jogador (save), filtrando consumíveis e utilitários de mundo aberto.
     * Usado para snapshot PvP — reflete o que o defensor realmente usa.
     */
    obterSkillsDaBarraSnapshot(barra: unknown) {
        const skillCatalog = olySkillCatalog();
        if (!Array.isArray(barra) || Object.keys(skillCatalog).length === 0) return null;
        const out: Array<Record<string, unknown>> = [];
        const seen = new Set<string>();
        for (let i = 0; i < barra.length; i++) {
            const name = barra[i];
            if (!name || typeof name !== 'string') continue;
            const n = String(name).trim();
            if (!n || n === 'Attack') continue;
            if (/shot$/i.test(n) || /Potion|Totem Scroll|Blessed/i.test(n)) continue;
            if (/Soulshot|Spiritshot/i.test(n)) continue;
            const dados = skillCatalog[n];
            if (!dados) continue;
            const tipo = dados.tipo;
            if (tipo === 'basico') continue;
            if (tipo === 'utilidade' || tipo === 'pet') continue;
            if (seen.has(n)) continue;
            seen.add(n);
            out.push({ ...dados, idNome: n });
        }
        return out.length > 0 ? out : null;
    },

    gerarBotCompleto(botData: Record<string, unknown>): OlympiadRival {
        if (!botData || typeof botData !== 'object') botData = {};
        const classeBot = typeof botData.classe === 'string' && botData.classe ? botData.classe : 'Fighter';
        const visualRival = (botData.visual as Record<string, unknown>) || {
            raca: null,
            isFem: Math.random() > 0.5,
            armorId: null,
            weaponId: null,
        };

        const isMage = typeof window.isClasseMagica === 'function' ? window.isClasseMagica(classeBot) : false;
        const nivelBot = (botData.nivel as number) || 1;
        const mmr = (botData.olympiadPoints as number) || 0;

        let racaBot = visualRival.raca as string | null | undefined;
        const lineage = olyClassLineage();
        if (!racaBot) {
            if (lineage[classeBot]) {
                const baseClass = lineage[classeBot][0];
                if (baseClass.includes('Dark')) racaBot = 'Dark Elf';
                else if (baseClass.includes('Elf')) racaBot = 'Elf';
                else if (baseClass.includes('Orc')) racaBot = 'Orc';
                else if (baseClass.includes('Dwarf')) racaBot = 'Dwarf';
                else racaBot = 'Human';
            } else {
                racaBot = 'Human';
            }
        }
        visualRival.raca = racaBot;

        const statusTable = window.statusIniciais;
        const baseRow = statusTable?.[racaBot];
        const base = baseRow && typeof baseRow.hpFighter === 'number'
            ? baseRow
            : DEFAULT_RACE_STATUS;
        const mod = window.classModifiers?.[classeBot] ?? DEFAULT_CLASS_MOD;

        const pl: Partial<StatPerLevel> = window.L2MINI_STAT_PER_LEVEL ?? {};
        const hpPerLvl = typeof pl.hp === 'number' ? pl.hp : 7;
        const mpPerLvl = typeof pl.mp === 'number' ? pl.mp : 2;
        const bonusAtkLvl = (nivelBot - 1) * (typeof pl.pAtk === 'number' ? pl.pAtk : 1);
        const bonusMAtkLvl = (nivelBot - 1) * (typeof pl.mAtk === 'number' ? pl.mAtk : 1);
        const bonusDefLvl = (nivelBot - 1) * (typeof pl.pDef === 'number' ? pl.pDef : 1.2);
        const bonusMDefLvl = (nivelBot - 1) * (typeof pl.mDef === 'number' ? pl.mDef : 1);

        let gradeBot = 'NO-GRADE';
        if (nivelBot >= 76) gradeBot = 'S';
        else if (nivelBot >= 61) gradeBot = 'A';
        else if (nivelBot >= 52) gradeBot = 'B';
        else if (nivelBot >= 40) gradeBot = 'C';
        else if (nivelBot >= 20) gradeBot = 'D';

        let armaBot: Record<string, unknown> | null = null;
        let armaduraBot: Record<string, unknown> | null = null;
        const joiasBot: Array<Record<string, unknown>> = [];

        const catalogoArmasList = olyWeaponCatalog();
        const catalogoArmadurasList = olyArmorCatalog();
        const catalogoJoiasList = olyJewelCatalog();

        if (catalogoArmasList.length > 0 && !visualRival.weaponId) {
            const armasValidas = catalogoArmasList.filter((a) => {
                if (a.grade !== gradeBot) return false;
                if (typeof window.weaponMatchesClass === 'function') {
                    return window.weaponMatchesClass(a, isMage);
                }
                return isMage
                    ? (a.tipo === 'Magic Sword' || a.tipo === 'Wand' || a.tipo === 'Scepter')
                    : a.tipo !== 'Magic Sword' && a.tipo !== 'Wand' && a.tipo !== 'Scepter';
            });
            if (armasValidas.length > 0) {
                armaBot = armasValidas[Math.floor(Math.random() * armasValidas.length)] as Record<string, unknown>;
                visualRival.weaponId = armaBot.id;
            }
        } else if (visualRival.weaponId) {
            armaBot = (catalogoArmasList.find((a) => a.id === visualRival.weaponId) as Record<string, unknown>) || null;
        }

        if (catalogoArmadurasList.length > 0 && !visualRival.armorId) {
            const weights = ['heavy', 'medium', 'light'] as const;
            let weightPick = weights[Math.floor(Math.random() * weights.length)];
            if (classeBot.includes('Knight') || classeBot.includes('Paladin') || classeBot.includes('Avenger')) weightPick = 'heavy';
            if (classeBot.includes('Rogue') || classeBot.includes('Ranger') || classeBot.includes('Assassin')) weightPick = 'light';

            const armadurasValidas = catalogoArmadurasList.filter((a) => {
                if (a.grade !== gradeBot || Number(a.preco) === 0) return false;
                if (typeof window.armorMatchesClass === 'function') {
                    return window.armorMatchesClass(a, isMage);
                }
                const arch = a.armorArchetype as string | undefined;
                if (arch) return isMage ? arch === 'mage' : arch === 'fighter';
                return isMage ? a.tipo === 'Robe' || a.tipo === 'Mage Light' || a.tipo === 'Mage Heavy' : a.tipo !== 'Robe' && a.tipo !== 'Mage Light' && a.tipo !== 'Mage Heavy';
            }).filter((a) => {
                const w = a.armorWeight as string | undefined;
                if (w) return w === weightPick;
                if (isMage) return weightPick === 'medium' ? a.tipo === 'Robe' : (weightPick === 'light' ? a.tipo === 'Mage Light' : a.tipo === 'Mage Heavy');
                return weightPick === 'heavy' ? a.tipo === 'Heavy' : (weightPick === 'light' ? a.tipo === 'Light' : a.tipo === 'Medium');
            });
            if (armadurasValidas.length > 0) {
                armaduraBot = armadurasValidas[Math.floor(Math.random() * armadurasValidas.length)] as Record<string, unknown>;
                visualRival.armorId = armaduraBot.id;
            }
        } else if (visualRival.armorId) {
            armaduraBot = (catalogoArmadurasList.find((a) => a.id === visualRival.armorId) as Record<string, unknown>) || null;
        }

        if (catalogoJoiasList.length > 0) {
            const joiasGrade = catalogoJoiasList.filter((j) => j.grade === gradeBot && !String(j.id).includes('epic'));
            const neck = joiasGrade.find((j) => j.tipoItem === 'neck');
            const ear = joiasGrade.find((j) => j.tipoItem === 'ear');
            const ring = joiasGrade.find((j) => j.tipoItem === 'ring');
            if (neck) joiasBot.push(neck as Record<string, unknown>);
            if (ear) { joiasBot.push(ear as Record<string, unknown>); joiasBot.push(ear as Record<string, unknown>); }
            if (ring) { joiasBot.push(ring as Record<string, unknown>); joiasBot.push(ring as Record<string, unknown>); }
        }

        let enchantBot = Math.floor(mmr / 200);
        enchantBot = Math.max(0, Math.min(25, enchantBot));

        const multEnchant = 1 + enchantBot * 0.10;

        const armaduraBonusHp = armaduraBot ? Math.floor(((armaduraBot.bonusHp as number) || 0) * multEnchant) : 0;
        const armaduraBonusMp = armaduraBot ? Math.floor(((armaduraBot.bonusMp as number) || 0) * multEnchant) : 0;
        const armaduraBonusSpd = armaduraBot ? Math.floor(((armaduraBot.bonusSpd as number) || 0) * multEnchant) : 0;
        const armaduraBonusCrit = armaduraBot ? Math.floor(((armaduraBot.bonusCrit as number) || 0) * multEnchant) : 0;
        const armaduraBonusMDef = armaduraBot ? Math.floor(((armaduraBot.bonusMDef as number) || 0) * multEnchant) : 0;
        const atkArmadura = armaduraBot ? Math.floor(((armaduraBot.pAtk as number) || 0) * multEnchant) : 0;
        const matkArmadura = armaduraBot ? Math.floor(((armaduraBot.mAtk as number) || 0) * multEnchant) : 0;
        const defArmaduraTotal = armaduraBot
            ? Math.floor((((armaduraBot.pDef as number) || (armaduraBot.def as number) || 0) * multEnchant))
            : 0;

        const armaBonusHp = armaBot ? ((armaBot.bonusHp as number) || 0) : 0;
        const armaBonusMp = armaBot ? ((armaBot.bonusMp as number) || 0) : 0;
        const armaBonusSpd = armaBot ? ((armaBot.bonusSpd as number) || 0) : 0;
        const armaBonusCrit = armaBot ? ((armaBot.bonusCrit as number) || 0) : 0;

        const joiasMDef = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.mDef as number) || 0) * multEnchant), 0));
        const joiasBonusHp = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.bonusHp as number) || 0) * multEnchant), 0));
        const joiasBonusMp = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.bonusMp as number) || 0) * multEnchant), 0));
        const joiasBonusCrit = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.bonusCrit as number) || 0) * multEnchant), 0));
        const joiasBonusSpd = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.bonusSpd as number) || 0) * multEnchant), 0));
        const joiasPAtk = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.pAtk as number) || 0) * multEnchant), 0));
        const joiasMAtk = Math.floor(joiasBot.reduce((soma, j) => soma + (((j.mAtk as number) || 0) * multEnchant), 0));

        const baseHp = isMage ? base.hpMage : base.hpFighter;
        const baseMp = isMage ? base.mpMage : base.mpFighter;

        const hpMax = Math.floor((baseHp + (nivelBot - 1) * hpPerLvl) * mod.hp) + armaduraBonusHp + armaBonusHp + joiasBonusHp;
        const mpMax = Math.floor((baseMp + (nivelBot - 1) * mpPerLvl) * mod.mp) + armaduraBonusMp + armaBonusMp + joiasBonusMp;

        const atkFisicoBase = isMage ? base.danoFighter / 2 : base.danoFighter;
        const atkArma = armaBot ? (armaBot.atk as number) : 5;
        const bonusEnchantWpnPAtk = Math.floor(atkArma * 0.10 * enchantBot);
        const pAtk = Math.floor((atkFisicoBase + atkArma + bonusEnchantWpnPAtk + bonusAtkLvl) * mod.atk) + atkArmadura + joiasPAtk;

        const atkMagicoBase = isMage ? base.danoMage : base.danoMage / 2;
        const matkArma = armaBot && armaBot.matk ? (armaBot.matk as number) : 5;
        const bonusEnchantWpnMAtk = Math.floor(matkArma * 0.10 * enchantBot);
        const mAtk = Math.floor((atkMagicoBase + matkArma + bonusEnchantWpnMAtk + bonusMAtkLvl) * mod.atk) + matkArmadura + joiasMAtk;

        const pDef = Math.floor((25 + defArmaduraTotal + bonusDefLvl + 20) * mod.def);
        const mDef = Math.floor((15 + joiasMDef + bonusMDefLvl + armaduraBonusMDef) * mod.def);

        const critRateRaw = Math.floor(base.critico + mod.crit + armaduraBonusCrit + armaBonusCrit + joiasBonusCrit);
        const critRate = typeof window.applyCritRateCap === 'function'
            ? window.applyCritRateCap(critRateRaw)
            : Math.min(critRateRaw, 70);

        const cpMax = Math.floor(hpMax * (isMage ? 0.4 : 0.6));

        const spdBase = isMage ? base.atkSpeedMage : base.atkSpeedFighter;
        const atkSpdPorNivel = typeof pl.atkSpdMs === 'number' && pl.atkSpdMs >= 0 ? pl.atkSpdMs : 0;
        let spdTotal = (spdBase - (nivelBot - 1) * atkSpdPorNivel) * mod.spd;
        spdTotal -= armaduraBonusSpd;
        spdTotal -= armaBonusSpd;
        spdTotal -= joiasBonusSpd;
        const atkSpd = Math.max(300, Math.floor(spdTotal));

        let skillsDisponiveis = this.obterSkillsDaBarraSnapshot(botData.barraAtalhos);
        if (!skillsDisponiveis || skillsDisponiveis.length === 0) {
            skillsDisponiveis = this.obterSkillsBot(classeBot, nivelBot);
        }

        return {
            nome: (botData.nome as string) || (botData.farmBot1 as string) || 'Bot',
            classe: classeBot,
            raca: racaBot,
            isMage,
            nivel: nivelBot,
            olympiadPoints: mmr,
            hp: hpMax,
            maxHp: Math.max(1, hpMax),
            cp: cpMax,
            maxCp: Math.max(1, cpMax),
            mp: mpMax,
            maxMp: Math.max(1, mpMax),
            pAtk: Math.max(1, pAtk),
            mAtk: Math.max(1, mAtk),
            pDef: Math.max(1, pDef),
            mDef: Math.max(1, mDef),
            critRate,
            atkSpd,
            skills: skillsDisponiveis,
            cooldowns: {},
            olyEffects: [],
            visual: visualRival as OlympiadRival['visual'],
            equipamentos: {
                arma: armaBot,
                armadura: armaduraBot,
                joias: joiasBot,
                enchant: enchantBot,
            },
        };
    },
};

registerGlobal('OlympiadBots', OlympiadBots as OlympiadBotsApi);

export {};
