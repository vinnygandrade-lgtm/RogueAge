/**
 * Mob threat affixes — poison DoT and bleed burst on the 3rd hit.
 */

export type MobThreat = 'none' | 'poison' | 'bleed';

export interface ForestPoisonDebuff {
    dps: number;
    expiresAt: number;
}

export interface MobThreatHitContext {
    mobThreat?: MobThreat;
    bleedHitsOnPlayer?: number;
    idUnico?: string;
    isChampion?: boolean;
}

const POISON_DURATION_MS = 6000;
const BLEED_HITS_FOR_BURST = 3;
const BLEED_BURST_ATK_MULT = 2.25;
const BLEED_BURST_POWER_MULT = 0.48;
const THREAT_RESIST_CAP_PCT = 75;

let poisonTickTimer: ReturnType<typeof setInterval> | null = null;

/** Poison/bleed resist from active expedition run upgrades + build bonuses (0–75% reduction). */
function getExpeditionThreatDamageMult(kind: 'poison' | 'bleed'): number {
    const win = window as any;
    const exp = win.ExpeditionEngine;
    if (!exp?.state?.active) return 1;
    const stat = kind === 'poison' ? 'poisonResPct' : 'bleedResPct';
    const raw = typeof exp.getCombinedBuffPct === 'function'
        ? Number(exp.getCombinedBuffPct(stat)) || 0
        : Number((exp.state.runBuffs || {})[stat]) || 0;
    const pct = Math.max(0, Math.min(THREAT_RESIST_CAP_PCT, raw));
    return 1 - pct / 100;
}

export function rollMobThreat(): MobThreat {
    const roll = Math.random();
    if (roll < 0.275) return 'poison';
    if (roll < 0.55) return 'bleed';
    return 'none';
}

export function clearForestPlayerThreats(): void {
    const win = window as any;
    win.forestPoisonDebuff = null;
    stopPoisonTick();
    const buffHost = document.getElementById('player-combat-buffs');
    if (buffHost) {
        buffHost.querySelectorAll('[data-forest-poison-debuff]').forEach((el) => el.remove());
    }
}

function stopPoisonTick(): void {
    if (poisonTickTimer) {
        clearInterval(poisonTickTimer);
        poisonTickTimer = null;
    }
}

function renderPlayerPoisonBuff(expiresAt: number): void {
    const host = document.getElementById('player-combat-buffs');
    if (!host) return;
    let el = host.querySelector('[data-forest-poison-debuff]') as HTMLElement | null;
    if (!el) {
        el = document.createElement('div');
        el.className = 'mini-icon-buff forest-poison-buff';
        el.dataset.forestPoisonDebuff = '1';
        el.title = typeof window.t === 'function' ? window.t('game.combat.poisonDebuffHint') : 'Poisoned';
        el.innerHTML = `<span class="forest-poison-buff__icon" aria-hidden="true">☠</span>`;
        host.appendChild(el);
    }
    const remain = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    el.setAttribute('aria-label', typeof window.t === 'function'
        ? window.t('game.combat.poisonDebuffAria', { sec: remain })
        : `Poison ${remain}s`);
}

function applyPoisonFromHit(mobPower: number, hitDamage: number): void {
    const win = window as any;
    const resistMult = getExpeditionThreatDamageMult('poison');
    const rawDps = Math.max(1, Math.floor(hitDamage * 0.28 + mobPower * 0.05));
    const dps = Math.max(1, Math.floor(rawDps * resistMult));
    const expiresAt = Date.now() + POISON_DURATION_MS;
    const prev = win.forestPoisonDebuff as ForestPoisonDebuff | null;
    win.forestPoisonDebuff = {
        dps: prev ? Math.max(prev.dps, dps) : dps,
        expiresAt: Math.max(prev?.expiresAt || 0, expiresAt)
    };
    renderPlayerPoisonBuff(win.forestPoisonDebuff.expiresAt);
    startPoisonTickIfNeeded();
    if (typeof window.escreverLog === 'function') {
        const msg = typeof window.t === 'function'
            ? window.t('game.combat.poisonApplied', { dps: win.forestPoisonDebuff.dps })
            : `☠ Poison! ${win.forestPoisonDebuff.dps} damage/sec.`;
        window.escreverLog(`<span style="color:#4ade80; font-weight:bold;">${msg}</span>`);
    }
}

function tickForestPoison(): void {
    const win = window as any;
    const debuff = win.forestPoisonDebuff as ForestPoisonDebuff | null;
    if (!debuff || Date.now() >= debuff.expiresAt) {
        clearForestPlayerThreats();
        return;
    }
    if (!Array.isArray(win.monstrosAtivos) || win.monstrosAtivos.length === 0) {
        clearForestPlayerThreats();
        return;
    }
    if ((Number(win.playerHP) || 0) <= 0) {
        clearForestPlayerThreats();
        return;
    }

    const dps = Math.max(1, Math.floor(debuff.dps));
    win.playerHP = Math.max(0, (Number(win.playerHP) || 0) - dps);
    renderPlayerPoisonBuff(debuff.expiresAt);

    if (typeof (window as any).mostrarDanoVisualMobPoison === 'function') {
        (window as any).mostrarDanoVisualMobPoison(dps);
    }

    if (win.playerHP <= 0) {
        if (typeof win.handleForestPlayerDefeat === 'function') {
            win.handleForestPlayerDefeat();
        } else if (typeof win.atualizar === 'function') {
            win.atualizar();
        }
        return;
    }
    if (typeof win.atualizar === 'function') win.atualizar();
}

function startPoisonTickIfNeeded(): void {
    if (poisonTickTimer) return;
    poisonTickTimer = setInterval(tickForestPoison, 1000);
}

function applyBleedFromHit(
    mob: MobThreatHitContext,
    hitDamage: number,
    mobPower: number
): number {
    mob.bleedHitsOnPlayer = (mob.bleedHitsOnPlayer || 0) + 1;
    let extraDamage = 0;

    if (mob.bleedHitsOnPlayer >= BLEED_HITS_FOR_BURST) {
        const resistMult = getExpeditionThreatDamageMult('bleed');
        const rawBurst = Math.max(
            1,
            Math.floor(hitDamage * BLEED_BURST_ATK_MULT + mobPower * BLEED_BURST_POWER_MULT)
        );
        extraDamage = Math.max(1, Math.floor(rawBurst * resistMult));
        mob.bleedHitsOnPlayer = 0;
        if (typeof window.escreverLog === 'function') {
            const msg = typeof window.t === 'function'
                ? window.t('game.combat.bleedBurst', { damage: extraDamage })
                : `🩸 Bleed burst! +${extraDamage} damage.`;
            window.escreverLog(`<span style="color:#f87171; font-weight:bold;">${msg}</span>`);
        }
    } else if (typeof window.escreverLog === 'function' && mob.bleedHitsOnPlayer === 2) {
        const msg = typeof window.t === 'function'
            ? window.t('game.combat.bleedAlmost')
            : '🩸 Bleed building — next hit hurts badly!';
        window.escreverLog(`<span style="color:#fca5a5;">${msg}</span>`);
    }

    if (typeof (window as any).updateMobBleedPips === 'function') {
        (window as any).updateMobBleedPips(mob);
    }
    return extraDamage;
}

/** Called after a mob lands a normal hit on the player. */
export function onMobThreatHitPlayer(
    mob: MobThreatHitContext,
    hitDamage: number,
    mobPower: number
): number {
    const threat = mob.mobThreat || 'none';
    let extra = 0;
    if (threat === 'poison') {
        applyPoisonFromHit(mobPower, hitDamage);
    }
    if (threat === 'bleed') {
        extra = applyBleedFromHit(mob, hitDamage, mobPower);
    }
    return extra;
}
