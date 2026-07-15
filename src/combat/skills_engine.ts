/**
 * Motor de execução de skills (floresta / caçada)
 * Migrado: js/skills_engine.js
 */

import { petDisplayName, writeSkillLog } from './combat_i18n';
import { mobDefenseAgainstPlayer } from './mob_combat_stats';

interface ForestMob {
  hp?: number;
  maxHp?: number;
  atk?: number;
  def?: number;
  pDef?: number;
  mDef?: number;
  lvl?: number;
  nivel?: number;
  atkSpd?: number;
  debuffs?: Record<string, unknown>;
}

interface SkillDef {
  tipo: string;
  mp: number;
  cd: number;
  poder: number;
  cor?: string;
  icone?: string;
}

function getBancoDeSkills(): Record<string, SkillDef> | undefined {
    return window.bancoDeSkills as Record<string, SkillDef> | undefined;
}

function resolveSkillMpCost(baseMp: number): number {
    const base = Math.max(0, Math.floor(Number(baseMp) || 0));
    if (!base) return 0;
    const eng = (window as Window & { ExpeditionEngine?: { getSkillMpCost?: (n: number) => number } }).ExpeditionEngine;
    if (eng && typeof eng.getSkillMpCost === 'function') {
        return eng.getSkillMpCost(base);
    }
    return base;
}

function usarSkill(nomeSkill: string) {
    if (window.playerHP <= 0) return; 
    if (typeof window.monstrosAtivos === 'undefined' || window.monstrosAtivos.length === 0) return;

    if (nomeSkill === 'Attack') {
        window.atacar?.();
        return;
    }

    if (typeof window.globalCooldownAtivo !== 'undefined' && Date.now() < window.globalCooldownAtivo) return;

    const skill = getBancoDeSkills()?.[nomeSkill];
    if (!skill || (window.cooldownsAtivos[nomeSkill] > Date.now())) return;
    const mpCost = resolveSkillMpCost(skill.mp);
    if (window.playerMP < mpCost) {
        const msg = (typeof window.t === 'function') ? window.t('game.skills.insufficientMana') : 'Not enough MP!';
        window.escreverLog(`<span style="color:#3b82f6; font-weight:bold;">${msg}</span>`);
        return;
    }

    window.globalCooldownAtivo = Date.now() + 1200; 
    window.playerMP -= mpCost;
    window.dispararAnimacaoCooldown?.(nomeSkill, skill.cd);
    if (typeof window.registrarProgressoMissaoDiaria === 'function') {
        window.registrarProgressoMissaoDiaria('usar_skills', 1);
    }

    if(typeof tocarSom === 'function') tocarSom('enchant');
    window.atualizar();

    let tIdx = typeof window.getForestTargetMobIndex === 'function' ? window.getForestTargetMobIndex() : 0;
    if (tIdx < 0) return;
    let monstro = window.monstrosAtivos[tIdx] as ForestMob;
    let isMagico = (typeof window.isClasseMagica === 'function' && window.isClasseMagica(window.charClass)) || window.charClass === "Dark Avenger" || window.charClass === "Hell Knight";
    
   switch(skill.tipo) {
        case "ataque":
        case "ataque_area":
        case "ataque_cura":
        case "ataque_ultimate":
        case "ataque_dreno":
            let atkBase = isMagico ? window.playerStats.mAtk : window.playerStats.pAtk;
            let defAlvo = mobDefenseAgainstPlayer(isMagico, monstro);
            const defMult = monstro.debuffs?.defMult;
            if (typeof defMult === 'number') defAlvo = Math.floor(defAlvo * defMult);
            let danoHabilidade = Math.floor(atkBase * skill.poder);
            let danoFinal = Math.floor((danoHabilidade * 880) / (400 + (defAlvo || 1)));
            
            // BLOQUEIO OLYMPIADA: Não usa shots na arena
            const naOlympiadSkill = (function () {
                const el = document.getElementById('tela-olympiad-arena');
                return el && el.style.display === 'flex';
            })();
            let shot = isMagico ? 'B. Spiritshot (NG)' : 'Soulshot (NG)';
            if (typeof window.autoShotAtivo !== 'undefined' && window.autoShotAtivo && !naOlympiadSkill) {
                if (window.inventario[shot] && window.inventario[shot] > 0) {
                    window.inventario[shot]--;
                    danoFinal = Math.floor(danoFinal * 1.2);
                    if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();
                }
            }

            let lvlMobSkill = monstro.lvl || monstro.nivel || 1;
            if (window.nivel > lvlMobSkill) {
                let diff = window.nivel - lvlMobSkill;
                let bonus = Math.min(0.5, diff * 0.02); 
                danoFinal = Math.floor(danoFinal * (1 + bonus));
            }
            if (danoFinal < 1) danoFinal = 1;
            let foiCriticoSkill = false;
            if (nomeSkill === "Mortal Strike" || nomeSkill === "Deadly Blow") {
                const chanceCrit = (typeof window.applyCritRateCap === 'function')
                    ? window.applyCritRateCap(window.playerStats.critRate + 12)
                    : Math.min((window.playerStats.critRate || 0) + 12, 70);
                if ((Math.random() * 100) < chanceCrit) { 
                    danoFinal = Math.floor(danoFinal * window.motorBuffsEspeciais.critMult); 
                    foiCriticoSkill = true;
                    writeSkillLog('criticalBlow', undefined, 'color:#ff3333; font-weight:bold;');
                }
            }
            if (nomeSkill === "Backstab") {
                if ((Math.random() * 100) < 35) { writeSkillLog('backstabFailed', undefined, 'color:#aaa; font-weight:bold;'); return; }
                else { 
                    danoFinal = Math.floor(danoFinal * window.motorBuffsEspeciais.critMult); 
                    foiCriticoSkill = true;
                    writeSkillLog('backstabFatal', undefined, 'color:#ef4444; font-weight:bold; font-size:1.1em;'); 
                }
            }
            if (nomeSkill === "Lethal Blow" && Math.random() * 100 <= 15) { 
                let curHpLb = Math.floor(Number(monstro.hp)) || 0;
                let vidaArrancada = Math.floor(curHpLb / 2);
                monstro.hp = Math.max(0, curHpLb - vidaArrancada);
                if (typeof renderizarMonstros === 'function') renderizarMonstros();
                else if (typeof window.refreshMobHpUI === 'function') window.refreshMobHpUI(monstro);
                foiCriticoSkill = true;
                writeSkillLog('lethalStrikeHalfHp', undefined, 'color:#000; background:#10b981; font-weight:bold; padding:2px 5px; border-radius:3px;');
                if (typeof window.tryProcessForestMobDeath === 'function') window.tryProcessForestMobDeath(monstro);
            }
            if ((nomeSkill === "Stun Shot" || nomeSkill === "Shield Stun" || nomeSkill === "Hammer Crush") && Math.random() * 100 <= 60) {
                if (window.monstrosAtivos.includes(monstro)) {
                    if (!monstro.debuffs) monstro.debuffs = {};
                    monstro.debuffs.stun = true;
                    writeSkillLog('monsterStunned', undefined, 'color:#facc15; font-weight:bold;');
                    let stunIdx = window.monstrosAtivos.indexOf(monstro);
                    if (stunIdx >= 0) atualizarIconesDebuffMonstro(stunIdx, "Stun", 5000, "💫");
                    let velOriginal = monstro.atkSpd;
                    monstro.atkSpd = 999999;
                    setTimeout(() => { if (window.monstrosAtivos.includes(monstro)) { monstro.debuffs.stun = false; monstro.atkSpd = velOriginal; writeSkillLog('stunWoreOff', undefined, 'color:#aaa;'); } }, 5000);
                }
            }
            if (nomeSkill === "Sting" && window.monstrosAtivos.includes(monstro) && (!monstro.debuffs || !monstro.debuffs.sangrando)) {
                if (!monstro.debuffs) monstro.debuffs = {}; monstro.debuffs.sangrando = true;
                writeSkillLog('bleedStarted', undefined, 'color:#b91c1c; font-weight:bold;');
                let ticks = 0;
                let sangramentoTimer = setInterval(() => {
                    let indexMonstro = window.monstrosAtivos.indexOf(monstro);
                    if (indexMonstro === -1 || ticks >= 5) { clearInterval(sangramentoTimer); if (monstro.debuffs) monstro.debuffs.sangrando = false; return; }
                    let danoBleed = Math.floor(window.playerStats.pAtk * 0.15); 
                    writeSkillLog('bleedTick', { damage: danoBleed }, 'color:#b91c1c;');
                    window.aplicarDanoNoMonstro?.(indexMonstro, danoBleed); ticks++;
                }, 3000);
            }
            if (skill.tipo === "ataque_area") {
                writeSkillLog('aoeHit', { skill: nomeSkill, damage: danoFinal });
                for (let i = window.monstrosAtivos.length - 1; i >= 0; i--) { window.aplicarDanoNoMonstro?.(i, danoFinal, foiCriticoSkill); }
            } else if (skill.tipo === "ataque_ultimate") {
                writeSkillLog('ultimateHit', { skill: nomeSkill, damage: danoFinal });
                let idxUlt = window.monstrosAtivos.indexOf(monstro);
                if (idxUlt >= 0) window.aplicarDanoNoMonstro?.(idxUlt, danoFinal, true);
            } else {
                writeSkillLog('spellDealt', { skill: nomeSkill, damage: danoFinal });
                let idxSpell = window.monstrosAtivos.indexOf(monstro);
                if (idxSpell >= 0) window.aplicarDanoNoMonstro?.(idxSpell, danoFinal, foiCriticoSkill);
                if (skill.tipo === "ataque_cura" || skill.tipo === "ataque_dreno") {
                    let porcentagemCura = (skill.tipo === "ataque_dreno") ? 0.5 : 0.4;
                    let cura = Math.floor(danoFinal * porcentagemCura);
                    window.playerHP = Math.min(window.playerStats.maxHp, window.playerHP + cura);
                    writeSkillLog('bloodDrainHeal', { amount: cura }, 'color:#e11d48; font-weight:bold;');
                    window.atualizar();
                }
            }
            break;

        case "buff_spd":
            writeSkillLog('buffSpeedActive', { skill: nomeSkill }, `color:${skill.cor}; font-weight:bold;`);
            atualizarIconesBuffPlayer(nomeSkill, 30000, skill.icone);
            window.playerStats.atkSpeed = Math.floor(window.playerStats.atkSpeed / skill.poder);
            window.atualizar();
            setTimeout(() => { window.calcularStatusGlobais(); window.atualizar(); }, 30000);
            break;

        case "utilidade": 
            writeSkillLog('utilityActivated', { skill: nomeSkill }, `color:${skill.cor}; font-weight:bold;`);
            atualizarIconesBuffPlayer(nomeSkill, 20000, skill.icone);
            pararAtaqueMonstro(); 
            setTimeout(() => { 
                if (window.monstrosAtivos.length > 0) {
                    const telaFloresta = document.getElementById('tela-floresta');
                    if (telaFloresta && telaFloresta.style.display === 'flex') {
                        window.iniciarAtaqueMonstro?.();
                        writeSkillLog('effectEndedMonstersAttack', undefined, 'color:#ef4444;');
                    }
                }
            }, 20000);
            break;
            
        case "pet":
            if (window.motorPet) clearInterval(window.motorPet);
            let nomePet = "PET"; let iconePet = "🐾"; let corFundoPet = "#111"; let baseAtaquePet = window.playerStats.pAtk; let multDano = 1.5; let corTextoAtk = "#ccc"; let petUsesMagic = false;
            if (nomeSkill === "Summon Zombie") { nomePet = "ZOMBIE"; iconePet = "🧟"; corFundoPet = "#166534"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#4ade80"; multDano = 1.5; petUsesMagic = true; }
            else if (nomeSkill === "Summon Kai the Cat") { nomePet = "KAI THE CAT"; iconePet = "🐱"; corFundoPet = "#ca8a04"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#fef08a"; multDano = 2.0; petUsesMagic = true; }
            else if (nomeSkill === "Summon Feline King") { nomePet = "FELINE KING"; iconePet = "🦁"; corFundoPet = "#b91c1c"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#fca5a5"; multDano = 3.5; petUsesMagic = true; }
            else if (nomeSkill === "Summon Silhouette") { nomePet = "SILHOUETTE"; iconePet = "👤"; corFundoPet = "#475569"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#94a3b8"; multDano = 2.5; petUsesMagic = true; }
            else if (nomeSkill === "Summon Spectral Lord") { nomePet = "SPECTRAL LORD"; iconePet = "🗡️"; corFundoPet = "#1e293b"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#cbd5e1"; multDano = 4.5; petUsesMagic = true; }
            else if (nomeSkill === "Summon Storm Cubic") { nomePet = "STORM CUBIC"; iconePet = "🧊"; corFundoPet = "#0284c7"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#7dd3fc"; multDano = 2.0; petUsesMagic = true; }
            else if (nomeSkill === "Summon Mirage the Unicorn") { nomePet = "MIRAGE UNICORN"; iconePet = "🦄"; corFundoPet = "#0ea5e9"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#7dd3fc"; multDano = 2.2; petUsesMagic = true; }
            else if (nomeSkill === "Summon Aqua Cubic") { nomePet = "AQUA CUBIC"; iconePet = "🧊"; corFundoPet = "#2563eb"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#60a5fa"; multDano = 1.8; petUsesMagic = true; }
            else if (nomeSkill === "Summon Magnus the Unicorn") { nomePet = "MAGNUS"; iconePet = "👑"; corFundoPet = "#3730a3"; baseAtaquePet = window.playerStats.mAtk; corTextoAtk = "#a5b4fc"; multDano = 4.0; petUsesMagic = true; }
            else if (nomeSkill === "Summon Mechanic Golem") { nomePet = "MECHANIC GOLEM"; iconePet = "🤖"; corFundoPet = "#475569"; baseAtaquePet = window.playerStats.pAtk; corTextoAtk = "#94a3b8"; multDano = 1.8; }
            else if (nomeSkill === "Summon Big Boom") { nomePet = "BIG BOOM"; iconePet = "💣"; corFundoPet = "#991b1b"; baseAtaquePet = window.playerStats.pAtk; corTextoAtk = "#fca5a5"; multDano = 3.0; }
            else if (nomeSkill === "Summon Siege Golem") { nomePet = "SIEGE GOLEM"; iconePet = "🏰"; corFundoPet = "#1e293b"; baseAtaquePet = window.playerStats.pAtk; corTextoAtk = "#cbd5e1"; multDano = 5.0; }
            else { nomePet = "PANTERA"; iconePet = "🐆"; corFundoPet = "#111827"; baseAtaquePet = window.playerStats.pAtk; corTextoAtk = "#52525b"; multDano = 1.5; }
            const petLabel = petDisplayName(nomeSkill, nomePet);
            writeSkillLog('petSummoned', { icon: iconePet, pet: petLabel }, `color:#fff; background:${corFundoPet}; font-weight:bold; padding:2px;`);
            atualizarIconesBuffPlayer(nomeSkill, 120000, skill.icone);
            window.motorPet = setInterval(() => {
                if (window.monstrosAtivos.length > 0) {
                    let idxPet = typeof window.getForestTargetMobIndex === 'function' ? window.getForestTargetMobIndex() : 0;
                    if (idxPet < 0) return;
                    let monstroPet = window.monstrosAtivos[idxPet] as ForestMob;
                    let defAlvoPet = mobDefenseAgainstPlayer(petUsesMagic, monstroPet);
                    const defMultPet = monstroPet.debuffs?.defMult;
                    if (typeof defMultPet === 'number') defAlvoPet = Math.floor(defAlvoPet * defMultPet);
                    let danoP = Math.floor((baseAtaquePet * multDano * 70) / (defAlvoPet || 1));
                    if (danoP < 1) danoP = 1;
                    writeSkillLog('petAttack', { pet: petLabel, damage: danoP }, `color:${corTextoAtk}; font-weight:bold;`);
                    window.aplicarDanoNoMonstro?.(idxPet, danoP);
                }
            }, 2000);
            setTimeout(() => { if (window.motorPet) { clearInterval(window.motorPet); window.motorPet = null; writeSkillLog('petReturned', { pet: petLabel }, 'color:#aaa;'); } }, 120000);
            break;

        case "debuff_spoil":
            if (!monstro.debuffs) monstro.debuffs = {}; monstro.debuffs.spoil = true;
            writeSkillLog('spoilSwallowed', undefined, 'color:#3b82f6; font-weight:bold;');
            { let _ix = window.monstrosAtivos.indexOf(monstro); if (_ix >= 0) atualizarIconesDebuffMonstro(_ix, nomeSkill, 20000, skill.icone); }
            if (nomeSkill === "Spoil Festival") { monstro.debuffs.defMult = 0.85; writeSkillLog('defenseFell', undefined, `color:${skill.cor};`); }
            break;

       case "debuff":
            if (!monstro.debuffs) monstro.debuffs = {}; writeSkillLog('monsterCursed', { skill: nomeSkill }, `color:${skill.cor}; font-weight:bold;`);
            if (["Hex", "Curse Weakness", "Curse Gloom", "Surrender To Fire", "Poison Arrow", "Poison Dance", "Surrender To Water", "Crippling Blow"].includes(nomeSkill)) { monstro.debuffs.defMult = 0.7; writeSkillLog('defenseShattered', undefined, `color:${skill.cor}; font-weight:bold;`); }
            if (["Howl", "Freezing Strike", "Sand Bomb", "Wind Shackle"].includes(nomeSkill)) { monstro.debuffs.atkMult = 0.7; writeSkillLog('enemySlowed', undefined, `color:${skill.cor}; font-weight:bold;`); }
            if (["Hamstring", "Dryad Root", "Arrest", "Stun Shot"].includes(nomeSkill)) { monstro.debuffs.preso = true; writeSkillLog('monsterPinned', undefined, `color:${skill.cor}; font-weight:bold;`); }
            if ((nomeSkill === "Poison Arrow" || nomeSkill === "Poison Dance") && !monstro.debuffs.envenenado) {
                monstro.debuffs.envenenado = true; writeSkillLog('poisonStarted', undefined, 'color:#10b981; font-weight:bold;');
                let ticksVeneno = 0;
                let venenoTimer = setInterval(() => {
                    let indexMonstro = window.monstrosAtivos.indexOf(monstro);
                    if (indexMonstro === -1 || ticksVeneno >= 5) { clearInterval(venenoTimer); if (monstro.debuffs) monstro.debuffs.envenenado = false; return; }
                    let danoVeneno = Math.max(5, Math.floor((isMagico ? window.playerStats.mAtk : window.playerStats.pAtk) * 0.10));
                    writeSkillLog('poisonTick', { damage: danoVeneno }, 'color:#10b981;');
                    window.aplicarDanoNoMonstro?.(indexMonstro, danoVeneno); ticksVeneno++;
                }, 3000); 
            }
            if (nomeSkill === "Entangle") {
                if (!monstro.debuffs) monstro.debuffs = {}; monstro.debuffs.defMult = 0.8;
                let velOriginal = monstro.atkSpd; monstro.atkSpd *= 1.5;
                writeSkillLog('entangled', undefined, `color:${skill.cor}; font-weight:bold;`);
                { let _ix = window.monstrosAtivos.indexOf(monstro); if (_ix >= 0) atualizarIconesDebuffMonstro(_ix, "Entangle", 15000, "🌱"); }
                setTimeout(() => { if (window.monstrosAtivos.includes(monstro)) { monstro.debuffs.defMult = 1.0; if (monstro.atkSpd > velOriginal) monstro.atkSpd = velOriginal; writeSkillLog('vinesSnapped', undefined, 'color:#aaa;'); } }, 15000);
            }
            { let _ix = window.monstrosAtivos.indexOf(monstro); if (_ix >= 0) atualizarIconesDebuffMonstro(_ix, nomeSkill, 15000, skill.icone); }
            setTimeout(() => { if (window.monstrosAtivos.includes(monstro)) { monstro.debuffs = {}; writeSkillLog('curseFaded', undefined, 'color:#aaa;'); } }, 15000);
            break;
            
        case "buff_def":
            writeSkillLog('buffActive', { skill: nomeSkill }, `color:${skill.cor}; font-weight:bold;`);
            atualizarIconesBuffPlayer(nomeSkill, 30000, skill.icone);
            if (nomeSkill === "Ultimate Evasion") { window.motorBuffsEspeciais.esquiva = 40; setTimeout(() => { window.motorBuffsEspeciais.esquiva = 0; }, 30000); }
            window.playerStats.pDef = Math.floor(window.playerStats.pDef * skill.poder); window.atualizar();
            setTimeout(() => { window.calcularStatusGlobais(); window.atualizar(); }, 30000);
            break;

        case "buff_atk":
            let poderFinal = skill.poder;
            if ((nomeSkill === "Frenzy" || nomeSkill === "Bison Spirit Totem") && (window.playerHP / window.playerStats.maxHp) * 100 <= 30) {
                poderFinal = 5.0; writeSkillLog('limitBreak', undefined, 'color:#ff0000; font-weight:bold; font-size:1.2em; text-shadow: 1px 1px 0 #000;');
            }
            writeSkillLog('buffActive', { skill: nomeSkill }, `color:${skill.cor}; font-weight:bold;`);
            atualizarIconesBuffPlayer(nomeSkill, 30000, skill.icone);
            if (nomeSkill === "Vicious Stance") { let oldMult = window.motorBuffsEspeciais.critMult; window.motorBuffsEspeciais.critMult = 2.5; setTimeout(() => { window.motorBuffsEspeciais.critMult = oldMult; }, 30000); }
            else { if (isMagico) window.playerStats.mAtk = Math.floor(window.playerStats.mAtk * poderFinal); else window.playerStats.pAtk = Math.floor(window.playerStats.pAtk * poderFinal); if (nomeSkill === "Focus Attack") window.playerStats.atkSpeed = Math.floor(window.playerStats.atkSpeed * 0.85); }
            window.atualizar(); setTimeout(() => { window.calcularStatusGlobais(); window.atualizar(); }, 30000);
            break;

       case "cura":
            let hpC = Math.floor(window.playerStats.maxHp * skill.poder);
            window.playerHP = Math.min(window.playerStats.maxHp, window.playerHP + hpC); writeSkillLog('recoveredHp', { amount: hpC }, `color:${skill.cor}; font-weight:bold;`);
            window.atualizar();
            break;

        case "cura_mp":
            let curaMana = Math.floor(window.playerStats.maxMp * skill.poder);
            window.playerMP = Math.min(window.playerStats.maxMp, window.playerMP + curaMana);
            if (typeof window.t === 'function' && typeof window.escreverLog === 'function') {
                const mpMsg = window.t('game.skills.log.restoredMp', { amount: curaMana });
                if (mpMsg && mpMsg !== 'game.skills.log.restoredMp') {
                    window.escreverLog(`<span style="color:${skill.cor}; font-weight:bold;">${skill.icone}${mpMsg}</span>`);
                }
            }
            window.atualizar();
            break;
    }   
}


window.usarSkill = usarSkill;

export {};
