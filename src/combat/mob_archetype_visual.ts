/**
 * Mob archetype visuals — physical/magic + poison/bleed hybrids.
 */

import type { MobThreat } from './mob_threat';

export interface MobVisualSource {
    tipo?: 'fisico' | 'magico';
    mobThreat?: MobThreat;
    isChampion?: boolean;
    bleedHitsOnPlayer?: number;
    idUnico?: string;
}

export function buildMobArchetypeTagsHtml(mob: MobVisualSource): string {
    const tags: string[] = [];
    const t = typeof window.t === 'function' ? window.t.bind(window) : (_k: string, fb?: string) => fb || '';

    if (mob.tipo === 'magico') {
        tags.push(`<span class="mob-archetype-tag mob-archetype-tag--magic">${t('game.combat.mobMagicTag', 'MAGIC')}</span>`);
    }
    if (mob.mobThreat === 'poison') {
        tags.push(`<span class="mob-archetype-tag mob-archetype-tag--poison">${t('game.combat.mobPoisonTag', 'POISON')}</span>`);
    }
    if (mob.mobThreat === 'bleed') {
        tags.push(`<span class="mob-archetype-tag mob-archetype-tag--bleed">${t('game.combat.mobBleedTag', 'BLEED')}</span>`);
    }

    return tags.length
        ? `<span class="mob-archetype-tags">${tags.join('')}</span>`
        : '';
}

export function buildMobSpriteShellClasses(mob: MobVisualSource): string {
    return [
        'mob-hunt-sprite-shell',
        mob.tipo === 'magico' ? 'mob-archetype--magic' : 'mob-archetype--physical',
        mob.isChampion ? 'mob-archetype--champion' : ''
    ].filter(Boolean).join(' ');
}

/** Silhouette-only glow — drop-shadow respects PNG alpha (no full-canvas tint). */
export function buildMobSpriteImgFilter(mob: MobVisualSource): string {
    const imgFilters: string[] = [];

    if (mob.tipo === 'magico') {
        imgFilters.push('drop-shadow(0 0 6px rgba(56, 189, 248, 0.92))');
        imgFilters.push('drop-shadow(0 0 11px rgba(37, 99, 235, 0.5))');
    } else {
        imgFilters.push('drop-shadow(0 0 4px rgba(248, 113, 113, 0.35))');
    }

    if (mob.mobThreat === 'poison') {
        imgFilters.push('drop-shadow(0 0 7px rgba(74, 222, 128, 0.88))');
        imgFilters.push('drop-shadow(0 0 13px rgba(34, 197, 94, 0.42))');
    }
    if (mob.mobThreat === 'bleed') {
        imgFilters.push('drop-shadow(0 0 7px rgba(251, 113, 133, 0.9))');
        imgFilters.push('drop-shadow(0 0 13px rgba(239, 68, 68, 0.48))');
    }
    if (mob.isChampion) {
        imgFilters.push('drop-shadow(0 0 9px rgba(250, 204, 21, 0.85))');
    }

    return imgFilters.length ? `filter: ${imgFilters.join(' ')};` : '';
}

export function buildMobSpriteImgClasses(mob: MobVisualSource): string {
    const classes = ['mob-hunt-sprite'];
    if (mob.tipo === 'magico') classes.push('mob-sprite-glow--magic');
    if (mob.mobThreat === 'poison') classes.push('mob-sprite-glow--poison');
    if (mob.mobThreat === 'bleed') classes.push('mob-sprite-glow--bleed');
    if (mob.isChampion) classes.push('mob-sprite-glow--champion');
    return classes.join(' ');
}

export function buildMobBleedPipsHtml(mob: MobVisualSource): string {
    if (mob.mobThreat !== 'bleed' || !mob.idUnico) return '';
    const hits = Math.max(0, Math.min(2, Math.floor(Number(mob.bleedHitsOnPlayer) || 0)));
    const pips = [0, 1, 2].map((i) =>
        `<span class="mob-bleed-pip${i < hits ? ' mob-bleed-pip--filled' : ''}"></span>`
    ).join('');
    const label = typeof window.t === 'function'
        ? window.t('game.combat.bleedPipsAria')
        : 'Bleed stacks toward burst';
    return `<div id="mob-bleed-pips-${mob.idUnico}" class="mob-bleed-pips" aria-label="${label}">${pips}</div>`;
}

export function updateMobBleedPips(mob: MobVisualSource): void {
    if (!mob.idUnico || mob.mobThreat !== 'bleed') return;
    const el = document.getElementById(`mob-bleed-pips-${mob.idUnico}`);
    if (!el) return;
    const hits = Math.max(0, Math.min(2, Math.floor(Number(mob.bleedHitsOnPlayer) || 0)));
    el.querySelectorAll('.mob-bleed-pip').forEach((pip, i) => {
        pip.classList.toggle('mob-bleed-pip--filled', i < hits);
    });
}

export function renderMobTypeLegend(): void {
    const legend = document.getElementById('mob-type-legend');
    if (!legend) return;
    const t = typeof window.t === 'function' ? window.t.bind(window) : (_k: string, fb?: string) => fb || '';

    legend.innerHTML = `
        <span class="mob-type-legend__title">${t('game.combat.mobLegendTitle', 'Enemy types')}</span>
        <span class="mob-type-legend__item mob-type-legend__item--magic">${t('game.combat.mobLegendMagic', 'Blue — Magic')}</span>
        <span class="mob-type-legend__item mob-type-legend__item--poison">${t('game.combat.mobLegendPoison', 'Green — Poison')}</span>
        <span class="mob-type-legend__item mob-type-legend__item--bleed">${t('game.combat.mobLegendBleed', 'Red — Bleed')}</span>
        <span class="mob-type-legend__item mob-type-legend__item--hybrid">${t('game.combat.mobLegendHybrid', 'Auras stack on hybrids')}</span>
    `;
    legend.hidden = false;
    legend.setAttribute('aria-hidden', 'false');
}

export function hideMobTypeLegend(): void {
    const legend = document.getElementById('mob-type-legend');
    if (!legend) return;
    legend.hidden = true;
    legend.setAttribute('aria-hidden', 'true');
    legend.innerHTML = '';
}
