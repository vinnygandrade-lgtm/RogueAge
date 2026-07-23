/* ========================================== */
/* COMBAT MATH ENGINE (DAMAGE CALCULATION)    */
/* Migrado: js/combat_math.js → TypeScript    */
/* ========================================== */

import { consumableDisplayName } from './combat_i18n';
import { severityFromDamageRatio, triggerCombatImpact } from './combat_feedback';
import { mobAttacksMagically, mobDefenseAgainstPlayer, mobPrimaryAtk } from './mob_combat_stats';
import { onMobThreatHitPlayer } from './mob_threat';

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
  debuffs?: { defMult?: number };
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

window.calcularDefesaDoPlayer = function (ataqueMagicoDoMonstro: boolean) {
  const buffs = motorBuffs();
  const defesaUsada = ataqueMagicoDoMonstro ? window.playerStats.mDef : window.playerStats.pDef;
  if (buffs.esquiva > 0 && Math.random() * 100 < buffs.esquiva) {
    escreverLog(
      `<span style="color:#34d399; font-weight:bold;">${
        typeof window.t === 'function'
          ? window.t('game.combatMath.dodgePerfect')
          : '💨 You dodged the attack perfectly!'
      }</span>`,
    );
    return 999999;
  }
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
    const mobPower = mobPrimaryAtk(mob);
    const danoBaseMonstro = Math.floor(Math.random() * (mobPower * 0.2)) + (mobPower * 0.9);
    const defesaSegura = window.calcularDefesaDoPlayer(isMagico);

    if (defesaSegura !== 999999) {
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
        triggerCombatImpact({
          rootId: 'area-cacada',
          tone: 'crit',
          severity: severityFromDamageRatio(threatRatio),
          shake: threatRatio >= 0.08,
        });
      }
      const hpBarFill = document.getElementById('player-hp-fill');
      if (hpBarFill) {
        hpBarFill.classList.remove('player-dano');
        void hpBarFill.offsetWidth;
        hpBarFill.classList.add('player-dano');
      }

      mostrarDanoVisualMob(danoRecebido, 'rival', false, null);
      triggerCombatImpact({
        rootId: 'area-cacada',
        tone: 'damage',
        severity: severityFromDamageRatio(hitRatio),
        shake: hitRatio >= 0.1,
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
    triggerCombatImpact({
      rootId: 'area-cacada',
      tone: 'deal',
      severity: 'light',
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
  el.innerText = String(valor);

  const offset = Math.random() * 40 - 20;

  if (alvo === 'player') {
    const mobCard = mobId ? document.getElementById(`mob-card-${mobId}`) : null;
    if (mobCard) {
      const rect = mobCard.getBoundingClientRect();
      el.style.left = rect.left + rect.width / 2 + offset + 'px';
      el.style.top = rect.top + offset + 'px';
      el.style.position = 'fixed';
    } else {
      el.style.left = `calc(50% + ${offset}px)`;
      el.style.top = '40%';
    }
  } else {
    el.style.left = `calc(50% + ${offset}px)`;
    el.style.top = '60%';
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function mostrarDanoVisualMobPoison(valor: number) {
  const cena = document.getElementById('tela-floresta');
  if (!cena) return;
  const el = document.createElement('div');
  el.className = 'damage-number rival poison-dot';
  el.innerText = String(valor);
  const offset = Math.random() * 30 - 15;
  el.style.left = `calc(50% + ${offset}px)`;
  el.style.top = '58%';
  el.style.position = 'fixed';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
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
 * One basic Attack swing (forest / raid). Respects Attack CD.
 * Returns true if a swing was performed.
 */
function tentarGolpeAtaqueBasico(): boolean {
  if (window.playerHP <= 0) return false;

  const cdLeft = getAttackCooldownRemainingMs();
  if (cdLeft > 0) return false;

  if (estaEmCombateRaid()) {
    if (typeof window.RaidEngine?.playerAtaca === 'function') {
      window.RaidEngine.playerAtaca();
    }
    const atkCdMs = getAttackSwingCdMs();
    if (typeof dispararAnimacaoGCD === 'function') dispararAnimacaoGCD(atkCdMs, 'Attack');
    return true;
  }

  if (!estaEmCombateFloresta()) return false;

  if (typeof window.globalCooldownAtivo !== 'undefined' && Date.now() < window.globalCooldownAtivo) {
    return false;
  }
  if (typeof tocarSom === 'function') tocarSom('ataque');
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
  const shotKey = isMage ? 'B. Spiritshot (NG)' : 'Soulshot (NG)';
  const shotLabel = consumableDisplayName(shotKey);

  const olyEl = document.getElementById('tela-olympiad-arena');
  const naOlympiad = olyEl && olyEl.style.display === 'flex';

  if (typeof window.autoShotAtivo !== 'undefined' && window.autoShotAtivo && !naOlympiad) {
    if (window.inventario[shotKey] && window.inventario[shotKey] > 0) {
      window.inventario[shotKey]--;
      danoFinal = Math.floor(danoFinal * 1.2);
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

/** Manual Attack: one swing. Does not toggle auto-attack (use toggleAutoAtaque). */
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
  const swung = tentarGolpeAtaqueBasico();
  if (swung && window.autoAtaqueAtivo) {
    scheduleNextAutoAttackSwing(getAttackSwingCdMs());
  }
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
    const cdLeft = getAttackCooldownRemainingMs();
    if (cdLeft > 0) scheduleNextAutoAttackSwing(cdLeft);
    else realizarGolpeAutoAtaque();
  } else {
    escreverLog(
      `<span style="color:#ef4444; font-weight:bold;">${
        typeof window.t === 'function' ? window.t('game.combatMath.autoAttackOff') : '🛑 Auto-Attack: OFF'
      }</span>`,
    );
    if (loopAutoAtaque) clearTimeout(loopAutoAtaque);
    loopAutoAtaque = null;
  }
};

function realizarGolpeAutoAtaque() {
  if (window.playerHP <= 0 || !window.autoAtaqueAtivo) {
    window.pararAutoAtaque?.();
    return;
  }

  const cdLeft = getAttackCooldownRemainingMs();
  if (cdLeft > 0) {
    scheduleNextAutoAttackSwing(cdLeft);
    return;
  }

  if (
    !estaEmCombateRaid() &&
    (typeof window.monstrosAtivos === 'undefined' || window.monstrosAtivos.length === 0)
  ) {
    window.pararAutoAtaque?.();
    return;
  }

  if (
    !estaEmCombateRaid() &&
    typeof window.globalCooldownAtivo !== 'undefined' &&
    Date.now() < window.globalCooldownAtivo
  ) {
    scheduleNextAutoAttackSwing(100);
    return;
  }

  const swung = tentarGolpeAtaqueBasico();
  if (!swung) {
    if (window.autoAtaqueAtivo) scheduleNextAutoAttackSwing(100);
    return;
  }
  scheduleNextAutoAttackSwing(getAttackSwingCdMs());
}

export {};
