/**
 * Full-screen zone battle backgrounds (`assets/zones/battle_<grade>.webp`,
 * 1080×2340 — arte-mestre PNG fica fora do repo; servir só o WebP comprimido).
 */

const BATTLE_BG_SLUG: Record<string, string> = {
    'No-Grade': 'ng',
    D: 'd',
    C: 'c',
    B: 'b',
    A: 'a',
    S: 's',
};

let _pendingBgToken = 0;

function resolveForestBattleZoneGrade(): string {
    const exp = (window as Window & { ExpeditionEngine?: { state?: { active?: boolean; zoneId?: string } } }).ExpeditionEngine;
    if (exp?.state?.active && exp.state.zoneId) {
        return exp.state.zoneId;
    }
    return window.zonaAtual?.id || 'No-Grade';
}

function battleBgSlugForGrade(grade: string): string {
    return BATTLE_BG_SLUG[grade] || 'ng';
}

function battleBgUrlForGrade(grade: string): string {
    return `assets/zones/battle_${battleBgSlugForGrade(grade)}.webp`;
}

function applyForestBattleBackground(show: boolean, grade?: string): void {
    const el = document.getElementById('forest-battle-bg');
    const screen = document.getElementById('tela-floresta');
    if (!el || !screen) return;

    if (!show) {
        _pendingBgToken += 1;
        el.classList.remove('forest-battle-bg--visible');
        screen.classList.remove('forest-battle-bg-active');
        el.style.backgroundImage = '';
        el.setAttribute('aria-hidden', 'true');
        return;
    }

    const zoneGrade = grade || resolveForestBattleZoneGrade();
    const url = battleBgUrlForGrade(zoneGrade);
    const token = ++_pendingBgToken;

    const img = new Image();
    img.onload = () => {
        if (token !== _pendingBgToken) return;
        el.style.backgroundImage = `url('${url}')`;
        el.classList.add('forest-battle-bg--visible');
        screen.classList.add('forest-battle-bg-active');
        el.setAttribute('aria-hidden', 'false');
    };
    img.onerror = () => {
        if (token !== _pendingBgToken) return;
        el.classList.remove('forest-battle-bg--visible');
        screen.classList.remove('forest-battle-bg-active');
        el.style.backgroundImage = '';
        el.setAttribute('aria-hidden', 'true');
        console.warn('[RogueAge] Battle background missing:', url);
    };
    img.src = url;
}

window.applyForestBattleBackground = applyForestBattleBackground;
window.battleBgUrlForGrade = battleBgUrlForGrade;

export {};
