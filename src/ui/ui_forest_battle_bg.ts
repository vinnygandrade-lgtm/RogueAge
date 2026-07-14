/**
 * Full-screen zone battle backgrounds.
 *
 * Portrait (mobile): `assets/zones/battle_<slug>.webp` — 1080×2340
 * Landscape (PC):    `assets/zones/battle_<slug>_wide.webp` — 1920×1080
 *                    (falls back to portrait art + CSS crop if wide missing)
 *
 * Master PNGs stay outside the repo; ship only compressed WebP.
 */

const BATTLE_BG_SLUG: Record<string, string> = {
    'No-Grade': 'ng',
    D: 'd',
    C: 'c',
    B: 'b',
    A: 'a',
    S: 's',
};

type BattleBgAspect = 'wide' | 'portrait';

let _pendingBgToken = 0;
let _bgActive = false;
let _bgGrade: string | null = null;
let _layoutHooked = false;

function isLandscapeLayout(): boolean {
    try {
        const mode = window.LayoutMode?.getEffective?.();
        if (mode === 'landscape' || mode === 'portrait') return mode === 'landscape';
    } catch {
        /* ignore */
    }
    return document.documentElement.getAttribute('data-l2-layout') === 'landscape';
}

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

/** Portrait URL always; pass `wide: true` for the PC 16∶9 asset. */
function battleBgUrlForGrade(grade: string, wide?: boolean): string {
    const slug = battleBgSlugForGrade(grade);
    return wide
        ? `assets/zones/battle_${slug}_wide.webp`
        : `assets/zones/battle_${slug}.webp`;
}

function setBattleBgAspect(el: HTMLElement, aspect: BattleBgAspect): void {
    el.setAttribute('data-battle-bg-aspect', aspect);
}

function clearBattleBg(el: HTMLElement, screen: HTMLElement): void {
    el.classList.remove('forest-battle-bg--visible');
    screen.classList.remove('forest-battle-bg-active');
    el.style.backgroundImage = '';
    el.removeAttribute('data-battle-bg-aspect');
    el.setAttribute('aria-hidden', 'true');
}

function showBattleBgUrl(
    el: HTMLElement,
    screen: HTMLElement,
    url: string,
    aspect: BattleBgAspect,
    token: number,
    onFail?: () => void,
): void {
    const img = new Image();
    img.onload = () => {
        if (token !== _pendingBgToken) return;
        el.style.backgroundImage = `url('${url}')`;
        setBattleBgAspect(el, aspect);
        el.classList.add('forest-battle-bg--visible');
        screen.classList.add('forest-battle-bg-active');
        el.setAttribute('aria-hidden', 'false');
    };
    img.onerror = () => {
        if (token !== _pendingBgToken) return;
        if (onFail) {
            onFail();
            return;
        }
        clearBattleBg(el, screen);
        console.warn('[RogueAge] Battle background missing:', url);
    };
    img.src = url;
}

function applyForestBattleBackground(show: boolean, grade?: string): void {
    const el = document.getElementById('forest-battle-bg');
    const screen = document.getElementById('tela-floresta');
    if (!el || !screen) return;

    ensureLayoutHook();

    if (!show) {
        _pendingBgToken += 1;
        _bgActive = false;
        _bgGrade = null;
        clearBattleBg(el, screen);
        return;
    }

    const zoneGrade = grade || resolveForestBattleZoneGrade();
    _bgActive = true;
    _bgGrade = zoneGrade;
    const token = ++_pendingBgToken;
    const wantWide = isLandscapeLayout();

    if (wantWide) {
        const wideUrl = battleBgUrlForGrade(zoneGrade, true);
        showBattleBgUrl(el, screen, wideUrl, 'wide', token, () => {
            // Wide art not ready yet — portrait crop until the PC asset lands
            const portraitUrl = battleBgUrlForGrade(zoneGrade, false);
            showBattleBgUrl(el, screen, portraitUrl, 'portrait', token);
            console.warn('[RogueAge] Wide battle background missing, using portrait crop:', wideUrl);
        });
        return;
    }

    showBattleBgUrl(el, screen, battleBgUrlForGrade(zoneGrade, false), 'portrait', token);
}

/** Re-pick wide vs portrait when the player toggles Layout / resizes into PC mode. */
function refreshForestBattleBackgroundForLayout(): void {
    if (!_bgActive) return;
    applyForestBattleBackground(true, _bgGrade || undefined);
}

function ensureLayoutHook(): void {
    if (_layoutHooked) return;
    _layoutHooked = true;
    window.addEventListener('l2-layout-change', () => {
        refreshForestBattleBackgroundForLayout();
    });
}

window.applyForestBattleBackground = applyForestBattleBackground;
window.battleBgUrlForGrade = battleBgUrlForGrade;
window.refreshForestBattleBackgroundForLayout = refreshForestBattleBackgroundForLayout;

export {};
