/* ========================================== */
/* COMBAT MATH ENGINE (DAMAGE CALCULATION)    */
/* Migrado: js/combat_math.js → TypeScript    */
/* ========================================== */

import { consumableDisplayName } from './combat_i18n';
import {
  resolveForestCombatRootId,
  severityFromDamageRatio,
  triggerCombatImpact,
} from './combat_feedback';
import { mobAttacksMagically, mobDefenseAgainstPlayer, mobPrimaryAtk } from './mob_combat_stats';
import { onMobThreatHitPlayer } from './mob_threat';
import { resolveActiveShotKey } from './shot_ammo';

interface ForestMob {
  idUnico?: string;
  hp?: number;
  maxHp?: number;
  atk?: number;
  pAtk?: number;
  mAtk?: number;
  tipo?: 'fisico' | 'magico';
  mobThreat?: 'none' | 'poison' | 'bleed';
  bleedHitsOnPlayer?: number;
  lvl?: number;
  nivel?: number;
  def?: number;
  mDef?: number;
  pDef?: number;
  isChampion?: boolean;
  debuffs?: { defMult?: number; atkMult?: number; preso?: boolean; spoil?: boolean; [key: string]: unknown };
  __forestDeathProcessing?: boolean;
}

function motorBuffs() {
  return window.motorBuffsEspeciais ?? { critMult: 2.0, esquiva: 0 };
}

/** Atualiza barra/texto de HP do mob (scoped ao card para evitar IDs duplicados / CSS global .hp-fill). */
window.refreshMobHpUI = function (monstro: ForestMob) {
  if (!monstro || !monstro.idUnico) return;
  let maxRef = Number(monstro.maxHp);
  if (!Number.isFinite(maxRef) || maxRef < 1) {
    const h = Number(monstro.hp);
    maxRef = Math.max(1, Math.floor(Number.isFinite(h) && h > 0 ? h : 1));
    monstro.maxHp = maxRef;
  }
  let hpVal = Number(monstro.hp);
  if (!Number.isFinite(hpVal)) hpVal = maxRef;
  hpVal = Math.max(0, hpVal);
  monstro.hp = hpVal;
  const hpPorcento = Math.min(100, Math.max(0, (hpVal / maxRef) * 100));
  const card = document.getElementById('mob-card-' + monstro.idUnico);
  const fill = card
    ? card.querySelector('.mob-hunt-hp-fill')
    : document.getElementById('mob-hp-fill-' + monstro.idUnico);
  const text = card
    ? card.querySelector('.mob-hunt-hp-text')
    : document.getElementById('mob-hp-text-' + monstro.idUnico);
  if (fill instanceof HTMLElement) fill.style.setProperty('width', hpPorcento + '%', 'important');
  if (text) text.textContent = String(Math.floor(hpVal));
  if (!fill && typeof renderizarMonstros === 'function') renderizarMonstros();
};

window.syncAllForestMobHpBars = function () {
  if (!window.monstrosAtivos || !window.monstrosAtivos.length) return;
  window.monstrosAtivos.forEach(function (m) {
    window.refreshMobHpUI(m as ForestMob);
  });
};

/** First alive mob in hunting zone (index 0 is not always the valid target when multiple mobs spawn). */
window.getForestTargetMobIndex = function () {
  const list = window.monstrosAtivos;
  if (!Array.isArray(list) || list.length === 0) return -1;
  for (let i = 0; i < list.length; i++) {
    const m = list[i] as ForestMob;
    if (m && Math.floor(Number(m.hp)) > 0) return i;
  }
  return -1;
};

/** Effective dodge chance % vs an incoming forest hit (class+gear+buff − mob accuracy). */
window.getPlayerDodgeChanceVsMob = function (
  mob?: { lvl?: number; nivel?: number } | null,
  ataqueMagicoDoMonstro = false,
): number {
  // Soft-cap once on (gear raw + Ultimate Evasion + expedition run), never on an already-softened portrait total.
  const win = window as Window & {
    _l2DodgeRawGear?: number;
    ExpeditionEngine?: { getRunDodgeInvestment?: () => number };
  };
  const hasGearRaw = typeof win._l2DodgeRawGear === 'number';
  const gearRaw = hasGearRaw
    ? Math.max(0, Math.floor(win._l2DodgeRawGear as number))
    : Math.max(0, Math.floor(Number(window.playerStats?.dodgeRate) || 0));
  const buff = Number(motorBuffs().esquiva) || 0;
  // Only add run investment on raw gear — portrait dodgeRate may already include it after applyRunBuffs.
  const runDodge =
    hasGearRaw && typeof win.ExpeditionEngine?.getRunDodgeInvestment === 'function'
      ? Math.max(0, Math.floor(Number(win.ExpeditionEngine.getRunDodgeInvestment()) || 0))
      : 0;
  let raw = gearRaw + buff + runDodge;
  if (mob) {
    const mobLvl = Number(mob.lvl ?? mob.nivel) || 1;
    const plLvl = Number(window.nivel) || 1;
    if (mobLvl > plLvl) {
      raw -= (mobLvl - plLvl) * 0.4;
    }
  }
  if (ataqueMagicoDoMonstro) {
    raw *= 0.85;
  }
  raw = Math.max(0, raw);
  return typeof window.applyDodgeRateCap === 'function'
    ? window.applyDodgeRateCap(raw)
    : Math.max(0, Math.min(55, Math.floor(raw)));
};

window.tryPlayerDodgeIncoming = function (
  mob?: { lvl?: number; nivel?: number } | null,
  ataqueMagicoDoMonstro = false,
): boolean {
  const chance = window.getPlayerDodgeChanceVsMob(mob, ataqueMagicoDoMonstro);
  if (chance <= 0) return false;
  return Math.random() * 100 < chance;
};

function anchorPlayerCombatFloat(): { left: number; top: number } {
  const expHp = document.getElementById('expedition-hp-fill');
  const expVitals = document.getElementById('expedition-run-vitals');
  const anchor =
    (expVitals && window.getComputedStyle(expVitals).display !== 'none' && expHp) ||
    document.getElementById('player-hp-fill');
  if (anchor) {
    const r = anchor.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return {
        left: r.left + r.width / 2,
        top: Math.max(48, r.top - 6),
      };
    }
  }
  return {
    left: window.innerWidth * 0.5,
    top: window.innerHeight * 0.42,
  };
}

function flashPlayerHpBars(): void {
  for (const id of ['player-hp-fill', 'expedition-hp-fill']) {
    const bar = document.getElementById(id);
    if (!bar) continue;
    bar.classList.remove('player-dano');
    void bar.offsetWidth;
    bar.classList.add('player-dano');
  }
  const expRow = document.getElementById('expedition-run-vitals');
  if (expRow && window.getComputedStyle(expRow).display !== 'none') {
    expRow.classList.remove('exp-vitals--hit');
    void expRow.offsetWidth;
    expRow.classList.add('exp-vitals--hit');
    setTimeout(() => expRow.classList.remove('exp-vitals--hit'), 520);
  }
}

function mostrarEsquivaVisualPlayer(): void {
  const cena = document.getElementById('tela-floresta');
  if (!cena) return;
  const el = document.createElement('div');
  el.className = 'damage-number dodge-float';
  el.innerText =
    typeof window.t === 'function' ? window.t('game.combatMath.dodgeFloat') : 'EVASION';
  const pos = anchorPlayerCombatFloat();
  const offset = Math.random() * 28 - 14;
  el.style.left = `${pos.left + offset}px`;
  el.style.top = `${pos.top}px`;
  el.style.position = 'fixed';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1900);
}

window.calcularDefesaDoPlayer = function (ataqueMagicoDoMonstro: boolean) {
  const defesaUsada = ataqueMagicoDoMonstro ? window.playerStats.mDef : window.playerStats.pDef;
  return defesaUsada > 0 ? defesaUsada : 1;
};

function handleForestPlayerDefeat(): void {
  const maxHp = Math.max(1, Math.floor(Number(window.playerStats?.maxHp) || 100));
  window.playerHP = Math.max(1, Math.floor(maxHp * 0.1));
  escreverLog(
    `<span style="color:red; font-weight:bold; font-size:1.1em;">${
      typeof window.t === 'function'
        ? window.t('game.combatMath.playerDefeated')
        : '💀 YOU were defeated! Returning...'
    }</span>`,
  );
  pararAtaqueMonstro();
  window.autoAtaqueAtivo = false;
  if (loopAutoAtaque) clearTimeout(loopAutoAtaque);
  if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();
  atualizar();
  if (window.ExpeditionEngine && window.ExpeditionEngine.state && window.ExpeditionEngine.state.active) {
    window.ExpeditionEngine.onPlayerDeath();
  } else if (typeof window.showForestDeathScreen === 'function') {
    window.showForestDeathScreen();
  } else {
    setTimeout(() => {
      prepararTelaCacada();
      irPara('cidade');
    }, 1500);
  }
}

window.handleForestPlayerDefeat = handleForestPlayerDefeat;

function executarDanoDeUmMonstro(mob: ForestMob) {
  try {
    const isMagico = mobAttacksMagically(mob);
    if (window.tryPlayerDodgeIncoming(mob, isMagico)) {
      escreverLog(
        `<span style="color:#34d399; font-weight:bold;">${
          typeof window.t === 'function'
            ? window.t('game.combatMath.dodgePerfect')
            : '💨 You evaded the attack perfectly!'
        }</span>`,
      );
      mostrarEsquivaVisualPlayer();
      if (window.playerHP > 0) atualizar();
      return;
    }
    let mobPower = mobPrimaryAtk(mob);
    // Howl / Freezing Strike / etc. — reduce outgoing mob damage while active.
    const atkMultRaw = Number(mob.debuffs?.atkMult);
    if (Number.isFinite(atkMultRaw) && atkMultRaw > 0 && atkMultRaw < 1) {
      mobPower = Math.max(1, Math.floor(mobPower * atkMultRaw));
    }
    const danoBaseMonstro = Math.floor(Math.random() * (mobPower * 0.2)) + (mobPower * 0.9);
    const defesaSegura = window.calcularDefesaDoPlayer(isMagico);

    {
      let danoRecebido = Math.floor((danoBaseMonstro * 1100) / (350 + defesaSegura));
      const expeditionActive = !!(window.ExpeditionEngine?.state?.active);
      const danoMinPct = expeditionActive ? 0.05 : 0.03;
      const danoMinimo = Math.floor(mobPower * danoMinPct);
      if (danoRecebido < danoMinimo) danoRecebido = danoMinimo;
      if (isNaN(danoRecebido) || danoRecebido <= 0) danoRecebido = 1;

      const lvlMob = mob.lvl || mob.nivel || 1;
      if (window.nivel > lvlMob) {
        const perLevel = expeditionActive ? 0.015 : 0.03;
        const cap = expeditionActive ? 0.28 : 0.6;
        const red = Math.min(cap, (window.nivel - lvlMob) * perLevel);
        danoRecebido = Math.floor(danoRecebido * (1 - red));
      }

      try {
        const zoneId =
          typeof window.zonaAtual !== 'undefined' && window.zonaAtual && window.zonaAtual.id
            ? window.zonaAtual.id
            : 'No-Grade';
        const lv = typeof window.nivel === 'number' ? window.nivel : 1;
        if (typeof window.EconomyBalance?.noviceIncomingDamageMult === 'function') {
          let ease = window.EconomyBalance.noviceIncomingDamageMult(lv, zoneId, !!mob.isChampion);
          if (expeditionActive && ease < 1) {
            ease = Math.max(ease, 0.88);
          }
          if (ease < 1) {
            danoRecebido = Math.max(danoMinimo, Math.floor(danoRecebido * ease));
          }
        }
      } catch {
        /* ignore */
      }

      window.playerHP -= danoRecebido;
      const maxHp = Math.max(1, Number(window.playerStats?.maxHp) || 100);
      const hitRatio = danoRecebido / maxHp;
      const extraThreat = onMobThreatHitPlayer(mob, danoRecebido, mobPower);
      if (extraThreat > 0) {
        window.playerHP -= extraThreat;
        mostrarDanoVisualMob(extraThreat, 'rival', true, null);
        const threatRatio = extraThreat / maxHp;
        // Flash only — screen shake is reserved for the player's critical hits.
        triggerCombatImpact({
          rootId: resolveForestCombatRootId(),
          tone: 'crit',
          severity: severityFromDamageRatio(threatRatio),
          shake: false,
        });
      }
      flashPlayerHpBars();

      mostrarDanoVisualMob(danoRecebido, 'rival', false, null);
      triggerCombatImpact({
        rootId: resolveForestCombatRootId(),
        tone: 'damage',
        severity: severityFromDamageRatio(hitRatio),
        shake: false,
      });
    }
    if (window.playerHP <= 0) {
      handleForestPlayerDefeat();
    } else {
      atualizar();
    }
  } catch (error) {
    console.error(error);
  }
}

window.executarDanoDeUmMonstro = executarDanoDeUmMonstro;

function aplicarDanoNoMonstro(index: number, dano: number, isCrit = false) {
  const list = window.monstrosAtivos;
  if (!Array.isArray(list) || index < 0 || index >= list.length) return;
  const monstro = list[index] as ForestMob;
  if (!monstro || typeof monstro !== 'object') return;
  if (monstro.__forestDeathProcessing) return;

  let preHp = Math.floor(Number(monstro.hp));
  if (!Number.isFinite(preHp)) preHp = Math.floor(Number(monstro.maxHp)) || 0;
  if (preHp <= 0) {
    if (typeof window.tryProcessForestMobDeath === 'function') window.tryProcessForestMobDeath(monstro);
    return;
  }

  dano = Math.max(0, Math.floor(Number(dano) || 0));
  monstro.hp = Math.max(0, preHp - dano);

  window.refreshMobHpUI(monstro);

  mostrarDanoVisualMob(dano, 'player', isCrit, monstro.idUnico ?? null);
  if (isCrit) {
    if (typeof window.tocarSomCritico === 'function') window.tocarSomCritico();
    const maxHp = Math.max(1, Math.floor(Number(monstro.maxHp) || preHp || 1));
    const critRatio = dano / maxHp;
    triggerCombatImpact({
      rootId: resolveForestCombatRootId(),
      tone: 'deal',
      severity: severityFromDamageRatio(Math.max(0.1, critRatio)),
      shake: true,
    });
  }

  if (Math.floor(Number(monstro.hp)) <= 0) {
    monstro.hp = 0;
    if (typeof window.tryProcessForestMobDeath === 'function') window.tryProcessForestMobDeath(monstro);
  } else {
    if (typeof renderizarMonstros === 'function') renderizarMonstros();
    else window.syncAllForestMobHpBars();
    const mobImg = document.getElementById('monster-img-' + monstro.idUnico);
    if (mobImg) {
      mobImg.classList.remove('tomando-dano');
      void mobImg.offsetWidth;
      mobImg.classList.add('tomando-dano');
    }
  }
}

window.aplicarDanoNoMonstro = aplicarDanoNoMonstro;

function mostrarDanoVisualMob(
  valor: number,
  alvo: string,
  isCrit: boolean,
  mobId: string | null,
) {
  const cena = document.getElementById('tela-floresta');
  if (!cena) return;

  const el = document.createElement('div');
  el.className = `damage-number ${alvo}${isCrit ? ' critical' : ''}`;
  const amount = Math.max(0, Math.floor(Number(valor) || 0));
  el.innerText = alvo === 'rival' ? `−${amount}` : String(amount);

  const offset = Math.random() * 36 - 18;

  if (alvo === 'player') {
    const mobCard = mobId ? document.getElementById(`mob-card-${mobId}`) : null;
    if (mobCard) {
      const rect = mobCard.getBoundingClientRect();
      el.style.left = rect.left + rect.width / 2 + offset + 'px';
      el.style.top = rect.top + Math.max(8, rect.height * 0.15) + 'px';
      el.style.position = 'fixed';
    } else {
      el.style.left = `calc(50% + ${offset}px)`;
      el.style.top = '38%';
      el.style.position = 'fixed';
    }
  } else {
    const pos = anchorPlayerCombatFloat();
    el.style.left = `${pos.left + offset}px`;
    el.style.top = `${pos.top + 10}px`;
    el.style.position = 'fixed';
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), isCrit ? 1800 : 1600);
}

function mostrarDanoVisualMobPoison(valor: number) {
  const cena = document.getElementById('tela-floresta');
  if (!cena) return;
  const el = document.createElement('div');
  el.className = 'damage-number rival poison-dot';
  el.innerText = `−${Math.max(0, Math.floor(Number(valor) || 0))}`;
  const pos = anchorPlayerCombatFloat();
  const offset = Math.random() * 24 - 12;
  el.style.left = `${pos.left + offset}px`;
  el.style.top = `${pos.top + 18}px`;
  el.style.position = 'fixed';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

window.mostrarDanoVisualMobPoison = mostrarDanoVisualMobPoison;

let loopAutoAtaque: ReturnType<typeof setTimeout> | null = null;

function estaEmCombateRaid(): boolean {
  const re = window.RaidEngine as { ativo?: boolean; state?: { bossStatus?: string } } | undefined;
  return !!(re && re.ativo && re.state?.bossStatus !== 'dead');
}

function estaEmCombateFloresta(): boolean {
  return typeof window.monstrosAtivos !== 'undefined' && window.monstrosAtivos.length > 0;
}

window.pararAutoAtaque = function () {
  window.autoAtaqueAtivo = false;
  if (loopAutoAtaque) clearTimeout(loopAutoAtaque);
  loopAutoAtaque = null;
  try {
    // Do not nudge AA resume — we are turning auto off.
    window.cancelAttackWindup?.({ resumeAuto: false });
  } catch {
    /* ignore */
  }
  if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();
};

window.isAutoAtaqueLigado = function () {
  return window.autoAtaqueAtivo;
};

/** Remaining Attack swing lock (ms). Spam-toggling auto-attack must not ignore this. */
function getAttackCooldownRemainingMs(): number {
  const end = Number(window.cooldownsAtivos?.['Attack']) || 0;
  const left = end - Date.now();
  return left > 0 ? left : 0;
}

function getAttackSwingCdMs(): number {
  return typeof window.playerStats !== 'undefined' && window.playerStats.atkSpeed > 0
    ? window.playerStats.atkSpeed
    : 3800;
}

function scheduleNextAutoAttackSwing(delayMs: number): void {
  if (loopAutoAtaque) clearTimeout(loopAutoAtaque);
  const wait = Math.max(16, Math.floor(Number(delayMs) || 0));
  loopAutoAtaque = setTimeout(realizarGolpeAutoAtaque, wait);
}

/**
 * Resolve one basic Attack hit (forest / raid) after wind-up completes.
 * Returns true if a swing was performed.
 */
function executarGolpeAtaqueBasico(): boolean {
  if (window.playerHP <= 0) return false;

  if (typeof window.isSkillGcdBlocked === 'function' && window.isSkillGcdBlocked()) {
    return false;
  }

  if (estaEmCombateRaid()) {
    if (typeof window.RaidEngine?.playerAtaca === 'function') {
      window.RaidEngine.playerAtaca();
    }
    const atkCdMs = getAttackSwingCdMs();
    if (typeof dispararAnimacaoGCD === 'function') dispararAnimacaoGCD(atkCdMs, 'Attack');
    return true;
  }

  if (!estaEmCombateFloresta()) return false;

  const isMage = typeof window.isClasseMagica === 'function' ? window.isClasseMagica(window.charClass) : false;
  let tIdx =
    typeof window.getForestTargetMobIndex === 'function' ? window.getForestTargetMobIndex() : 0;
  if (tIdx < 0) {
    window.pararAutoAtaque?.();
    return false;
  }
  const monstro = window.monstrosAtivos[tIdx] as ForestMob;
  let defAlvo = mobDefenseAgainstPlayer(isMage, monstro);
  if (monstro.debuffs?.defMult) defAlvo = Math.floor((defAlvo ?? 0) * monstro.debuffs.defMult);

  let atkAtual = isMage ? window.playerStats.mAtk : window.playerStats.pAtk;
  let danoBase = (atkAtual * 1100) / (350 + (defAlvo || 1));

  const danoMinimo = Math.floor(atkAtual * 0.08);
  if (danoBase < danoMinimo) danoBase = danoMinimo;

  const lvlMob = monstro.lvl || monstro.nivel || 1;
  if (window.nivel > lvlMob) {
    danoBase *= 1 + Math.min(1.0, (window.nivel - lvlMob) * 0.03);
  }
  let danoFinal = danoBase * (0.9 + Math.random() * 0.2);
  let foiCritico = false;
  const buffs = motorBuffs();
  if (!isMage && Math.random() * 100 < window.playerStats.critRate) {
    danoFinal *= buffs.critMult;
    foiCritico = true;
  }
  danoFinal = Math.max(1, Math.floor(danoFinal));
  const shotKey =
    typeof window.resolveActiveShotKey === 'function'
      ? window.resolveActiveShotKey(isMage)
      : resolveActiveShotKey(isMage);
  const shotLabel = consumableDisplayName(shotKey);

  const olyEl = document.getElementById('tela-olympiad-arena');
  const naOlympiad = olyEl && olyEl.style.display === 'flex';

  if (typeof window.autoShotAtivo !== 'undefined' && window.autoShotAtivo && !naOlympiad) {
    if (window.inventario[shotKey] && window.inventario[shotKey] > 0) {
      window.inventario[shotKey]--;
      danoFinal = Math.floor(danoFinal * 1.2);
      if (typeof window.tocarSom === 'function') window.tocarSom('soulshot');
      if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();
      if (window.inventario[shotKey] <= 0) {
        window.autoShotAtivo = false;
        escreverLog(
          `<span style="color:#ef4444; font-weight:bold;">${
            typeof window.t === 'function'
              ? window.t('game.combatMath.shotsDepleted', { item: shotLabel })
              : `${shotLabel} depleted!`
          }</span>`,
        );
      }
    } else {
      window.autoShotAtivo = false;
    }
  }
  if (typeof window.tocarSomEspada === 'function') window.tocarSomEspada();
  escreverLog(
    foiCritico
      ? `<span style="color:#ff3333; font-weight:bold;">${
          typeof window.t === 'function'
            ? window.t('game.combatMath.criticalHit', { damage: danoFinal })
            : `CRITICAL HIT! ${danoFinal}`
        }</span>`
      : typeof window.t === 'function'
        ? window.t('game.combatMath.damageDealt', { damage: danoFinal })
        : `You dealt <span style="color:white">${danoFinal}</span> damage!`,
  );

  if (typeof window.TutorialEngine !== 'undefined' && window.TutorialEngine.isRunning?.()) {
    if (window.tutorialProgress?.step === 9) {
      window.tutorialFirstAttackDone = true;
      if (typeof window.TutorialEngine.notifyFirstAttack === 'function') {
        window.TutorialEngine.notifyFirstAttack();
      }
    }
  }

  window.aplicarDanoNoMonstro(tIdx, danoFinal, foiCritico);
  const atkCdMs = getAttackSwingCdMs();
  if (typeof dispararAnimacaoGCD === 'function') dispararAnimacaoGCD(atkCdMs, 'Attack');
  if (typeof atualizar === 'function') atualizar();
  return true;
}

/**
 * Request a basic Attack: short wind-up, then swing.
 * Returns true if wind-up started (or already winding).
 */
function tentarGolpeAtaqueBasico(opts?: { rescheduleAuto?: boolean }): boolean {
  if (window.playerHP <= 0) return false;

  if (typeof window.isAttackWindupActive === 'function' && window.isAttackWindupActive()) {
    return true;
  }

  // Wait for skill launch lock — Attack CD keeps loading, just cannot fire yet.
  if (typeof window.isSkillGcdBlocked === 'function' && window.isSkillGcdBlocked()) {
    return false;
  }

  const cdLeft = getAttackCooldownRemainingMs();
  if (cdLeft > 0) return false;

  const rescheduleAuto = !!opts?.rescheduleAuto;
  const begin =
    typeof window.beginAttackWindup === 'function' ? window.beginAttackWindup : null;

  if (!begin) {
    const swung = executarGolpeAtaqueBasico();
    if (swung && rescheduleAuto && window.autoAtaqueAtivo) {
      scheduleNextAutoAttackSwing(getAttackSwingCdMs());
    }
    return swung;
  }

  return begin(() => {
    const swung = executarGolpeAtaqueBasico();
    if (rescheduleAuto && window.autoAtaqueAtivo) {
      scheduleNextAutoAttackSwing(swung ? getAttackSwingCdMs() : 100);
    }
  });
}

/** Manual Attack: one wind-up + swing. Does not toggle auto-attack (use toggleAutoAtaque). */
window.atacar = function () {
  if (window.playerHP <= 0) return;
  const naRaid = estaEmCombateRaid();
  const naFloresta = estaEmCombateFloresta();
  if (!naRaid && !naFloresta) {
    escreverLog(
      `<span style="color:#aaa;">${
        typeof window.t === 'function' ? window.t('game.combat.noTarget') : 'No target to attack!'
      }</span>`,
    );
    return;
  }
  tentarGolpeAtaqueBasico({ rescheduleAuto: !!window.autoAtaqueAtivo });
};

/** Start/continue the auto-attack swing loop (no log). Used by settings defaults. */
window.resumeAutoAtaqueLoop = function () {
  if (window.playerHP <= 0) return;
  if (!estaEmCombateRaid() && !estaEmCombateFloresta()) return;
  window.autoAtaqueAtivo = true;
  if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();

  if (typeof window.isAttackWindupActive === 'function' && window.isAttackWindupActive()) {
    const windLeft =
      typeof window.getAttackWindupRemainingMs === 'function'
        ? window.getAttackWindupRemainingMs()
        : 50;
    scheduleNextAutoAttackSwing(Math.max(16, windLeft));
    return;
  }

  const castLeft =
    typeof window.getSkillGcdRemainingMs === 'function' ? window.getSkillGcdRemainingMs() : 0;
  if (castLeft > 0) {
    scheduleNextAutoAttackSwing(castLeft);
    return;
  }

  const cdLeft = getAttackCooldownRemainingMs();
  if (cdLeft > 0) scheduleNextAutoAttackSwing(cdLeft);
  else realizarGolpeAutoAtaque();
};

/** Small AUTO chip above Attack — toggle continuous basic attacks. */
window.toggleAutoAtaque = function () {
  if (window.playerHP <= 0) return;
  const naRaid = estaEmCombateRaid();
  const naFloresta = estaEmCombateFloresta();
  if (!naRaid && !naFloresta) {
    escreverLog(
      `<span style="color:#aaa;">${
        typeof window.t === 'function' ? window.t('game.combat.noTarget') : 'No target to attack!'
      }</span>`,
    );
    return;
  }
  window.autoAtaqueAtivo = !window.autoAtaqueAtivo;
  if (typeof renderizarBarraAtalhos === 'function') renderizarBarraAtalhos();
  if (window.autoAtaqueAtivo) {
    escreverLog(
      `<span style="color:#10b981; font-weight:bold;">${
        typeof window.t === 'function' ? window.t('game.combatMath.autoAttackOn') : '⚔️ Auto-Attack: ON'
      }</span>`,
    );
    window.resumeAutoAtaqueLoop?.();
  } else {
    escreverLog(
      `<span style="color:#ef4444; font-weight:bold;">${
        typeof window.t === 'function' ? window.t('game.combatMath.autoAttackOff') : '🛑 Auto-Attack: OFF'
      }</span>`,
    );
    if (loopAutoAtaque) clearTimeout(loopAutoAtaque);
    loopAutoAtaque = null;
    try {
      window.cancelAttackWindup?.({ resumeAuto: false });
    } catch {
      /* ignore */
    }
  }
};

function realizarGolpeAutoAtaque() {
  if (window.playerHP <= 0 || !window.autoAtaqueAtivo) {
    window.pararAutoAtaque?.();
    return;
  }

  if (typeof window.isAttackWindupActive === 'function' && window.isAttackWindupActive()) {
    const windLeft =
      typeof window.getAttackWindupRemainingMs === 'function'
        ? window.getAttackWindupRemainingMs()
        : 50;
    scheduleNextAutoAttackSwing(Math.max(16, windLeft));
    return;
  }

  const cdLeft = getAttackCooldownRemainingMs();
  if (cdLeft > 0) {
    scheduleNextAutoAttackSwing(cdLeft);
    return;
  }

  const castLeft =
    typeof window.getSkillGcdRemainingMs === 'function' ? window.getSkillGcdRemainingMs() : 0;
  if (castLeft > 0) {
    scheduleNextAutoAttackSwing(castLeft);
    return;
  }

  if (
    !estaEmCombateRaid() &&
    (typeof window.monstrosAtivos === 'undefined' || window.monstrosAtivos.length === 0)
  ) {
    window.pararAutoAtaque?.();
    return;
  }

  // Wind-up owns the next reschedule when the swing lands.
  const started = tentarGolpeAtaqueBasico({ rescheduleAuto: true });
  if (!started && window.autoAtaqueAtivo) {
    scheduleNextAutoAttackSwing(100);
  }
}

export {};
