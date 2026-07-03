import { itemDropDisplayName } from '../combat/combat_i18n';

export type ExpeditionNodeType = 'combat' | 'elite' | 'camp' | 'event' | 'boss' | 'chest' | 'merchant' | 'ambush' | 'guardian';

export interface ExpeditionNode {
    id: number;
    depth: number;
    type: ExpeditionNodeType;
    status: 'locked' | 'available' | 'completed' | 'missed';
    connections: number[];
}

export interface ExpeditionState {
    active: boolean;
    zoneId: string;
    nodes: ExpeditionNode[];
    currentNodeId: number | null;
    luckLootMult: number;
    bag: {
        adenas: number;
        xp: number;
        drops: Record<string, number>;
    };
}

interface NodePreview {
    icon: string;
    title: string;
    desc: string;
    outcomes: string[];
    tags: { text: string; cls: 'exp-node-tag--risk' | 'exp-node-tag--reward' | 'exp-node-tag--safe' }[];
}

type ExpeditionResultTone = 'success' | 'warning' | 'danger' | 'neutral';

interface ExpeditionBagDelta {
    adenas?: number;
    xp?: number;
    drops?: Record<string, number>;
}

interface ExpeditionEffectDelta {
    hpRestored?: number;
    hpLost?: number;
    mpRestored?: number;
    bagAdenaLost?: number;
    buffText?: string;
}

interface ExpeditionNodeResult {
    nodeType: ExpeditionNodeType;
    tone: ExpeditionResultTone;
    icon: string;
    titleKey: string;
    titleFallback: string;
    summaryKey: string;
    summaryFallback: string;
    summaryParams?: Record<string, string | number>;
    bag?: ExpeditionBagDelta;
    effects?: ExpeditionEffectDelta;
}

export class ExpeditionEngine {
    static state: ExpeditionState = {
        active: false,
        zoneId: '',
        nodes: [],
        currentNodeId: null,
        luckLootMult: 1,
        bag: { adenas: 0, xp: 0, drops: {} }
    };

    static pendingNodeId: number | null = null;

    static t(key: string, fallback: string, params?: Record<string, string | number>): string {
        const win = window as any;
        let msg = fallback;
        if (typeof win.t === 'function') {
            const translated = win.t(key, params);
            if (translated && translated !== key) msg = translated;
        }
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                msg = msg.replace(`{${k}}`, String(v));
            }
        }
        return msg;
    }

    static log(key: string, fallback: string, params?: Record<string, string | number>, color = '#e5e7eb') {
        const win = window as any;
        const text = this.t(key, fallback, params);
        win.escreverLog(`<span style="color:${color}; font-weight:bold;">${text}</span>`);
    }

    static refreshRulesDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-rules');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static openRulesModal() {
        const win = window as any;
        this.refreshRulesDom();
        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-rules', 1600);
        }
    }

    static closeRulesModal() {
        const win = window as any;
        if (typeof win.fecharModal === 'function') {
            win.fecharModal('janela-expedition-rules');
        }
    }

    static refreshResultDom(root?: HTMLElement | null) {
        const win = window as any;
        const el = root || document.getElementById('janela-expedition-result');
        if (win.I18n && typeof win.I18n.refreshDom === 'function' && el) {
            try { win.I18n.refreshDom(el); } catch { /* ignore */ }
        }
    }

    static buildResultLine(label: string, value: string, valClass: string): string {
        return `<div class="exp-result-line"><span>${label}</span><span class="exp-result-line__val ${valClass}">${value}</span></div>`;
    }

    static formatSigned(n: number): string {
        return n >= 0 ? `+${n}` : String(n);
    }

    static showResultModal(result: ExpeditionNodeResult) {
        const win = window as any;
        const titleEl = document.getElementById('exp-result-title');
        const iconWrap = document.getElementById('exp-result-icon-wrap');
        const iconEl = document.getElementById('exp-result-icon');
        const summaryEl = document.getElementById('exp-result-summary');
        const rewardsWrap = document.getElementById('exp-result-rewards-wrap');
        const rewardsEl = document.getElementById('exp-result-rewards');
        const effectsWrap = document.getElementById('exp-result-effects-wrap');
        const effectsEl = document.getElementById('exp-result-effects');

        if (titleEl) titleEl.innerText = this.t(result.titleKey, result.titleFallback, result.summaryParams);
        if (iconEl) iconEl.innerText = result.icon;
        if (iconWrap) iconWrap.className = `exp-result-icon-wrap exp-result-icon-wrap--${result.tone}`;
        if (summaryEl) summaryEl.innerText = this.t(result.summaryKey, result.summaryFallback, result.summaryParams);

        const labAdena = this.t('game.hunt.expedition.resultAdena', 'Adena');
        const labXp = this.t('game.hunt.expedition.resultXp', 'XP');
        const labHpRestored = this.t('game.hunt.expedition.resultHpRestored', 'HP restored');
        const labHpLost = this.t('game.hunt.expedition.resultHpLost', 'HP lost');
        const labMpRestored = this.t('game.hunt.expedition.resultMpRestored', 'MP restored');
        const labBagAdenaLost = this.t('game.hunt.expedition.resultBagAdenaLost', 'Bag Adena lost');

        let rewardsHtml = '';
        const bag = result.bag;
        if (bag) {
            if (bag.adenas && bag.adenas !== 0) {
                rewardsHtml += this.buildResultLine(labAdena, this.formatSigned(bag.adenas), 'exp-result-line__val--adena');
            }
            if (bag.xp && bag.xp !== 0) {
                rewardsHtml += this.buildResultLine(labXp, this.formatSigned(bag.xp), 'exp-result-line__val--xp');
            }
            if (bag.drops) {
                for (const item in bag.drops) {
                    const qty = bag.drops[item];
                    if (qty > 0) {
                        rewardsHtml += this.buildResultLine(
                            itemDropDisplayName(item),
                            `x${qty}`,
                            'exp-result-line__val--drop'
                        );
                    }
                }
            }
        }

        if (rewardsEl) rewardsEl.innerHTML = rewardsHtml;
        if (rewardsWrap) rewardsWrap.style.display = rewardsHtml ? 'block' : 'none';

        let effectsHtml = '';
        const effects = result.effects;
        if (effects) {
            if (effects.hpRestored && effects.hpRestored > 0) {
                effectsHtml += this.buildResultLine(labHpRestored, this.formatSigned(effects.hpRestored), 'exp-result-line__val--heal');
            }
            if (effects.hpLost && effects.hpLost > 0) {
                effectsHtml += this.buildResultLine(labHpLost, `-${effects.hpLost}`, 'exp-result-line__val--hurt');
            }
            if (effects.mpRestored && effects.mpRestored > 0) {
                effectsHtml += this.buildResultLine(labMpRestored, this.formatSigned(effects.mpRestored), 'exp-result-line__val--heal');
            }
            if (effects.bagAdenaLost && effects.bagAdenaLost > 0) {
                effectsHtml += this.buildResultLine(labBagAdenaLost, `-${effects.bagAdenaLost}`, 'exp-result-line__val--hurt');
            }
            if (effects.buffText) {
                effectsHtml += this.buildResultLine(effects.buffText, '✓', 'exp-result-line__val--buff');
            }
        }

        if (effectsEl) effectsEl.innerHTML = effectsHtml;
        if (effectsWrap) effectsWrap.style.display = effectsHtml ? 'block' : 'none';

        this.refreshResultDom();

        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-result', 1600);
            const body = document.querySelector('.expedition-result-body') as HTMLElement | null;
            if (body) body.scrollTop = 0;
        }
    }

    static continueFromResult() {
        const win = window as any;
        if (typeof win.fecharModal === 'function') {
            win.fecharModal('janela-expedition-result');
        }

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        this.renderMap();
    }

    static resolveCombatResultTitle(type: ExpeditionNodeType): { titleKey: string; titleFallback: string; summaryKey: string; summaryFallback: string } {
        if (type === 'elite') {
            return {
                titleKey: 'game.hunt.expedition.resultEliteWinTitle',
                titleFallback: 'Elite defeated',
                summaryKey: 'game.hunt.expedition.resultEliteWinDesc',
                summaryFallback: 'Champion-grade spoils added to your bag.'
            };
        }
        if (type === 'ambush') {
            return {
                titleKey: 'game.hunt.expedition.resultAmbushWinTitle',
                titleFallback: 'Ambush survived',
                summaryKey: 'game.hunt.expedition.resultAmbushWinDesc',
                summaryFallback: 'Bonus loot from the ambush is in your bag.'
            };
        }
        if (type === 'guardian') {
            return {
                titleKey: 'game.hunt.expedition.resultGuardianWinTitle',
                titleFallback: 'Guardian fallen',
                summaryKey: 'game.hunt.expedition.resultGuardianWinDesc',
                summaryFallback: 'The gatekeeper\'s loot is secured. The boss awaits.'
            };
        }
        return {
            titleKey: 'game.hunt.expedition.resultCombatWinTitle',
            titleFallback: 'Encounter cleared',
            summaryKey: 'game.hunt.expedition.resultCombatWinDesc',
            summaryFallback: 'Victory loot was secured in your expedition bag.'
        };
    }

    static scaleLootForDisplay(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }, extraMult = 1) {
        const mult = extraMult * this.state.luckLootMult;
        const drops: Record<string, number> = {};
        for (const item in lootTurno.drops) {
            drops[item] = Math.max(1, Math.floor(lootTurno.drops[item] * mult));
        }
        return {
            adenas: Math.floor(lootTurno.adenas * mult),
            xp: Math.floor(lootTurno.xp * mult),
            drops
        };
    }

    static setForestLayoutMode(mode: 'hub' | 'map' | 'combat' | 'idle') {
        const floresta = document.getElementById('tela-floresta');
        const inner = document.querySelector('.tela-floresta-inner') as HTMLElement | null;
        const area = document.getElementById('area-cacada');
        if (floresta) {
            floresta.classList.remove('expedition-hub-open', 'expedition-map-open', 'expedition-combat-open');
            if (mode === 'hub') floresta.classList.add('expedition-hub-open');
            if (mode === 'map') floresta.classList.add('expedition-map-open');
            if (mode === 'combat') floresta.classList.add('expedition-combat-open');
        }
        if (inner) {
            inner.classList.toggle('tela-floresta-inner--expedition-map', mode === 'map');
        }
        if (area) {
            area.style.display = mode === 'combat' ? 'flex' : 'none';
        }
    }

    static showHub() {
        const hub = document.getElementById('expedition-hub');
        const map = document.getElementById('expedition-map-container');
        if (hub) hub.style.display = 'flex';
        if (map) map.style.display = 'none';
        this.setForestLayoutMode('hub');
    }

    static hideHub() {
        const hub = document.getElementById('expedition-hub');
        if (hub) hub.style.display = 'none';
    }

    static syncForestEntryUi() {
        if (this.state.active) {
            this.hideHub();
            const map = document.getElementById('expedition-map-container');
            const mapVisible = map && map.style.display !== 'none';
            this.setForestLayoutMode(mapVisible ? 'map' : 'combat');
        } else {
            this.showHub();
        }
    }

    static init() {
        (window as any).ExpeditionEngine = ExpeditionEngine;
        setTimeout(() => ExpeditionEngine.wireStartButton(), 1000);
    }

    static wireStartButton() {
        const btnIniciar = document.getElementById('btn-iniciar-caca');
        if (!btnIniciar) return;
        btnIniciar.onclick = () => {
            ExpeditionEngine.startExpedition((window as any).zonaAtual?.id || 'No-Grade');
        };
        this.syncForestEntryUi();
    }

    static startExpedition(zoneId: string) {
        this.state = {
            active: true,
            zoneId: zoneId,
            nodes: this.generateNodes(zoneId),
            currentNodeId: null,
            luckLootMult: 1,
            bag: { adenas: 0, xp: 0, drops: {} }
        };
        this.state.nodes[0].status = 'available';

        this.hideHub();
        this.renderMap();
    }

    static pickType(pool: ExpeditionNodeType[]): ExpeditionNodeType {
        return pool[Math.floor(Math.random() * pool.length)];
    }

    /** Nine-stage procedural map — ~18 nodes, 8 choices before the boss. */
    static generateNodes(_zoneId: string): ExpeditionNode[] {
        const stagePools: ExpeditionNodeType[][] = [
            ['combat'],
            [this.pickType(['event', 'chest']), 'combat'],
            ['combat', this.pickType(['chest', 'event'])],
            [this.pickType(['ambush', 'combat']), 'chest', 'event'],
            ['elite', this.pickType(['chest', 'combat'])],
            ['camp', 'merchant'],
            [this.pickType(['event', 'chest']), 'elite', this.pickType(['combat', 'ambush'])],
            [this.pickType(['guardian', 'ambush']), this.pickType(['elite', 'combat'])],
            ['boss']
        ];

        const nodes: ExpeditionNode[] = [];
        const depthNodeIds: number[][] = [];
        let id = 1;

        for (let depth = 0; depth < stagePools.length; depth++) {
            const idsAtDepth: number[] = [];
            for (const type of stagePools[depth]) {
                nodes.push({ id, depth, type, status: 'locked', connections: [] });
                idsAtDepth.push(id);
                id++;
            }
            depthNodeIds.push(idsAtDepth);
        }

        for (let d = 0; d < depthNodeIds.length - 1; d++) {
            const nextIds = depthNodeIds[d + 1];
            for (const nodeId of depthNodeIds[d]) {
                const node = nodes.find((n) => n.id === nodeId);
                if (node) node.connections = [...nextIds];
            }
        }

        return nodes;
    }

    static getNodeMeta(type: ExpeditionNodeType) {
        const icons: Record<ExpeditionNodeType, string> = {
            combat: '⚔️',
            elite: '💀',
            camp: '⛺',
            event: '❓',
            chest: '🎁',
            boss: '👹',
            merchant: '🏪',
            ambush: '🗡️',
            guardian: '🛡️'
        };
        const labelKeys: Record<ExpeditionNodeType, string> = {
            combat: 'game.hunt.expedition.nodeLabelCombat',
            elite: 'game.hunt.expedition.nodeLabelElite',
            camp: 'game.hunt.expedition.nodeLabelCamp',
            event: 'game.hunt.expedition.nodeLabelEvent',
            chest: 'game.hunt.expedition.nodeLabelChest',
            boss: 'game.hunt.expedition.nodeLabelBoss',
            merchant: 'game.hunt.expedition.nodeLabelMerchant',
            ambush: 'game.hunt.expedition.nodeLabelAmbush',
            guardian: 'game.hunt.expedition.nodeLabelGuardian'
        };
        const fallbacks: Record<ExpeditionNodeType, string> = {
            combat: 'Fight',
            elite: 'Elite',
            camp: 'Camp',
            event: 'Event',
            chest: 'Chest',
            boss: 'Boss',
            merchant: 'Trader',
            ambush: 'Ambush',
            guardian: 'Guardian'
        };
        return {
            icon: icons[type],
            label: this.t(labelKeys[type], fallbacks[type])
        };
    }

    static getNodePreview(type: ExpeditionNodeType): NodePreview {
        const base = `game.hunt.expedition.node${type.charAt(0).toUpperCase()}${type.slice(1)}`;
        const meta = this.getNodeMeta(type);
        const outcomeCount = type === 'event' ? 6 : 3;
        const outcomes: string[] = [];
        for (let i = 1; i <= outcomeCount; i++) {
            const key = `${base}Outcome${i}`;
            const text = this.t(key, '');
            if (text && text !== key) outcomes.push(text);
        }

        const tagDefs: Record<ExpeditionNodeType, { key: string; cls: NodePreview['tags'][0]['cls']; fallback: string }[]> = {
            combat: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'Moderate risk' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Standard loot' }
            ],
            elite: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'High risk' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Premium loot' }
            ],
            camp: [
                { key: `${base}TagSafe`, cls: 'exp-node-tag--safe', fallback: 'Safe rest' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Full recovery' }
            ],
            event: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'Unpredictable' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Bonus or heal' }
            ],
            chest: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'Trap chance' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Quick payout' }
            ],
            boss: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'Extreme risk' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Full extract' }
            ],
            merchant: [
                { key: `${base}TagSafe`, cls: 'exp-node-tag--safe', fallback: 'No combat' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Random aid' }
            ],
            ambush: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'High risk' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Loot boost' }
            ],
            guardian: [
                { key: `${base}TagRisk`, cls: 'exp-node-tag--risk', fallback: 'Very high risk' },
                { key: `${base}TagReward`, cls: 'exp-node-tag--reward', fallback: 'Rich loot' }
            ]
        };

        return {
            icon: meta.icon,
            title: this.t(`${base}Title`, type.toUpperCase()),
            desc: this.t(`${base}Desc`, ''),
            outcomes,
            tags: tagDefs[type].map((tag) => ({
                text: this.t(tag.key, tag.fallback),
                cls: tag.cls
            }))
        };
    }

    static getMapProgress(): { current: number; total: number } {
        const maxDepth = Math.max(...this.state.nodes.map((n) => n.depth), 0);
        const furthestDone = this.state.nodes
            .filter((n) => n.status === 'completed')
            .reduce((max, n) => Math.max(max, n.depth), -1);
        return {
            current: Math.min(furthestDone + 2, maxDepth + 1),
            total: maxDepth + 1
        };
    }

    static buildNodeClass(node: ExpeditionNode): string {
        const classes = ['expedition-node', `expedition-node--${node.type}`];
        if (node.status === 'completed') classes.push('expedition-node--completed');
        else if (node.status === 'missed') classes.push('expedition-node--missed');
        else if (node.status === 'available') classes.push('expedition-node--available');
        if (node.id === this.state.currentNodeId) classes.push('expedition-node--current');
        return classes.join(' ');
    }

    static renderMap() {
        const mapContainer = document.getElementById('expedition-map-container');
        const combatArea = document.getElementById('area-cacada');
        const mobsContainer = document.getElementById('mobs-container');
        const botoesCombate = document.getElementById('botoes-combate');

        this.hideHub();
        this.setForestLayoutMode('map');
        if (mapContainer) mapContainer.style.display = 'flex';
        if (combatArea) combatArea.style.display = 'none';
        if (mobsContainer) mobsContainer.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        if (!mapContainer) return;

        const progress = this.getMapProgress();
        const progressPct = Math.min(100, Math.max(0, Math.round((progress.current / Math.max(progress.total, 1)) * 100)));
        const mapTitle = this.t('game.hunt.expedition.mapTitle', 'Expedition Map');
        const mapProgress = this.t('game.hunt.expedition.mapProgress', 'Stage {current} / {total}', progress);
        const mapRulesBtn = this.t('game.hunt.expedition.mapRulesBtn', 'Rules');
        const mapScrollHint = this.t('game.hunt.expedition.mapScrollHint', 'Scroll the path');
        const bagTitle = this.t('game.hunt.expedition.bagTitle', 'Expedition Bag');
        const bagEmpty = this.t('game.hunt.expedition.bagEmpty', 'No items yet...');
        const extractLabel = this.t('game.hunt.expedition.extract', 'Extract (keep loot)');

        const maxDepth = Math.max(...this.state.nodes.map((n) => n.depth));
        const depths = Array.from({ length: maxDepth + 1 }, (_, i) => i);

        let html = `
        <div class="expedition-panel">
            <div class="expedition-map-header">
                <div class="expedition-map-header__row">
                    <div class="expedition-map-header__brand">
                        <span class="expedition-map-header__glyph" aria-hidden="true">🗺</span>
                        <div class="expedition-map-header__text">
                            <h3 class="expedition-map-header__title">${mapTitle}</h3>
                            <p class="expedition-map-header__progress">${mapProgress}</p>
                        </div>
                    </div>
                    <button type="button" class="btn-l2 expedition-map-header__rules" onclick="ExpeditionEngine.openRulesModal()">${mapRulesBtn}</button>
                </div>
                <div class="expedition-map-header__track" style="--exp-progress:${progressPct}%">
                    <div class="expedition-map-header__track-fill"></div>
                </div>
                <p class="expedition-map-header__hint">${mapScrollHint}</p>
            </div>
            <div class="expedition-panel__body">
            <div class="expedition-map-track expedition-map-track--vertical">`;

        depths.forEach((d) => {
            const depthNodes = this.state.nodes.filter((n) => n.depth === d);
            const stageLabel = this.t('game.hunt.expedition.mapStageLabel', 'Stage {n}', { n: d + 1 });

            html += `
            <div class="expedition-map-stage" data-depth="${d}">
                <div class="expedition-map-stage__label">${stageLabel}</div>
                <div class="expedition-map-stage__nodes">`;

            depthNodes.forEach((node) => {
                const meta = this.getNodeMeta(node.type);
                const clickable = node.status === 'available' ? `onclick="ExpeditionEngine.clickNode(${node.id})"` : '';
                html += `
                <div class="${this.buildNodeClass(node)}" ${clickable} title="${meta.label}" role="button" ${node.status === 'available' ? 'tabindex="0"' : ''}>
                    <span class="expedition-node__icon">${meta.icon}</span>
                    <span class="expedition-node__type">${meta.label}</span>
                </div>`;
            });

            html += `</div></div>`;
            if (d < maxDepth) {
                html += `<div class="expedition-map-stage__connector" aria-hidden="true"></div>`;
            }
        });
        html += '</div>';

        html += `
            <div class="expedition-bag">
                <div class="expedition-bag__head">
                    <span class="expedition-bag__glyph" aria-hidden="true">🎒</span>
                    <span class="expedition-bag__title">${bagTitle}</span>
                </div>
                <div class="expedition-bag__stats">
                    <span class="expedition-bag__stat expedition-bag__stat--adena">Adena: +${this.state.bag.adenas}</span>
                    <span class="expedition-bag__stat expedition-bag__stat--xp">XP: +${this.state.bag.xp}</span>
                </div>
                <div class="expedition-bag__drops">`;

        for (const item in this.state.bag.drops) {
            html += `<span class="expedition-bag__drop">${itemDropDisplayName(item)} x${this.state.bag.drops[item]}</span>`;
        }
        if (Object.keys(this.state.bag.drops).length === 0) {
            html += `<span class="expedition-bag__empty">${bagEmpty}</span>`;
        }

        html += `
                </div>
                <div class="expedition-bag__actions">
                    <button type="button" class="btn-l2 expedition-bag__extract" onclick="ExpeditionEngine.extract()">${extractLabel}</button>
                </div>
            </div>
            </div>
        </div>`;

        mapContainer.innerHTML = html;

        requestAnimationFrame(() => {
            const track = mapContainer.querySelector('.expedition-map-track--vertical');
            const target = mapContainer.querySelector('.expedition-node--available') as HTMLElement | null;
            if (track && target) {
                const trackRect = track.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                if (targetRect.top < trackRect.top || targetRect.bottom > trackRect.bottom) {
                    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            }
        });
    }

    static clickNode(id: number) {
        const node = this.state.nodes.find((n) => n.id === id);
        if (!node || node.status !== 'available') return;

        this.pendingNodeId = id;
        const preview = this.getNodePreview(node.type);
        const win = window as any;

        const titleEl = document.getElementById('exp-node-title');
        const iconWrap = document.getElementById('exp-node-icon-wrap');
        const iconEl = document.getElementById('exp-node-icon');
        const descEl = document.getElementById('exp-node-desc');
        const outcomesEl = document.getElementById('exp-node-outcomes-list');
        const tagsEl = document.getElementById('exp-node-tags');

        if (titleEl) titleEl.innerText = preview.title;
        if (iconEl) iconEl.innerText = preview.icon;
        if (iconWrap) iconWrap.className = `exp-node-icon-wrap exp-node-icon-wrap--${node.type}`;
        if (descEl) descEl.innerText = preview.desc;
        if (outcomesEl) outcomesEl.innerHTML = preview.outcomes.map((line) => `<li>${line}</li>`).join('');
        if (tagsEl) {
            tagsEl.innerHTML = preview.tags.map((tag) =>
                `<span class="exp-node-tag ${tag.cls}">${tag.text}</span>`
            ).join('');
        }

        if (typeof win.abrirModal === 'function') {
            win.abrirModal('janela-expedition-node', 1600);
            const body = document.querySelector('.expedition-node-body') as HTMLElement | null;
            if (body) body.scrollTop = 0;
        }
    }

    static confirmNode() {
        if (this.pendingNodeId === null) return;
        const node = this.state.nodes.find((n) => n.id === this.pendingNodeId);
        this.pendingNodeId = null;

        const win = window as any;
        if (typeof win.fecharModal === 'function') {
            win.fecharModal('janela-expedition-node');
        }

        if (!node) return;

        this.state.currentNodeId = node.id;

        if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss' || node.type === 'ambush' || node.type === 'guardian') {
            this.startCombatNode(node);
        } else if (node.type === 'camp') {
            this.startCampNode(node);
        } else if (node.type === 'event') {
            this.startEventNode(node);
        } else if (node.type === 'chest') {
            this.startChestNode(node);
        } else if (node.type === 'merchant') {
            this.startMerchantNode(node);
        }
    }

    static cancelNode() {
        this.pendingNodeId = null;
        const win = window as any;
        if (typeof win.fecharModal === 'function') {
            win.fecharModal('janela-expedition-node');
        }
    }

    static applyBagLoot(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }, extraMult = 1) {
        const mult = extraMult * this.state.luckLootMult;
        this.state.bag.adenas += Math.floor(lootTurno.adenas * mult);
        this.state.bag.xp += Math.floor(lootTurno.xp * mult);
        for (const item in lootTurno.drops) {
            const qty = Math.max(1, Math.floor(lootTurno.drops[item] * mult));
            this.state.bag.drops[item] = (this.state.bag.drops[item] || 0) + qty;
        }
        if (this.state.luckLootMult > 1) this.state.luckLootMult = 1;
    }

    static startCombatNode(node: ExpeditionNode) {
        const mapContainer = document.getElementById('expedition-map-container');
        if (mapContainer) mapContainer.style.display = 'none';

        this.setForestLayoutMode('combat');

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'flex';
        if (botoesCombate) botoesCombate.style.display = 'flex';

        const win = window as any;
        win.L2MINI_ZONAL_MOB_TUNING = win.L2MINI_ZONAL_MOB_TUNING || {};
        const zoneId = this.state.zoneId;
        const originalTuning = win.L2MINI_ZONAL_MOB_TUNING[zoneId] || { hp: 1, atk: 1, def: 1 };

        (this as any)._originalTuning = { ...originalTuning };
        (this as any)._combatLootMult = 1;

        if (node.type === 'elite') {
            win.L2MINI_ZONAL_MOB_TUNING[zoneId] = { ...originalTuning, hp: originalTuning.hp * 2.5, atk: originalTuning.atk * 1.5, championChance: 1.0 };
        } else if (node.type === 'boss') {
            win.L2MINI_ZONAL_MOB_TUNING[zoneId] = { ...originalTuning, hp: originalTuning.hp * 6, atk: originalTuning.atk * 2, championChance: 1.0 };
        } else if (node.type === 'ambush') {
            win.L2MINI_ZONAL_MOB_TUNING[zoneId] = { ...originalTuning, hp: originalTuning.hp * 1.2, atk: originalTuning.atk * 1.8, championChance: 0.35 };
            (this as any)._combatLootMult = 1.5;
        } else if (node.type === 'guardian') {
            win.L2MINI_ZONAL_MOB_TUNING[zoneId] = { ...originalTuning, hp: originalTuning.hp * 4, atk: originalTuning.atk * 1.75, championChance: 0.5 };
        }

        win.procurarMonstros();
    }

    static onCombatWin(lootTurno: { adenas: number; xp: number; drops: Record<string, number> }) {
        if (!this.state.active) return;

        const win = window as any;
        if ((this as any)._originalTuning) {
            win.L2MINI_ZONAL_MOB_TUNING[this.state.zoneId] = (this as any)._originalTuning;
        }

        const combatMult = (this as any)._combatLootMult || 1;
        const displayedLoot = this.scaleLootForDisplay(lootTurno, combatMult);
        this.applyBagLoot(lootTurno, combatMult);
        (this as any)._combatLootMult = 1;

        const node = this.state.nodes.find((n) => n.id === this.state.currentNodeId);
        if (!node) return;

        this.completeNode(node);

        if (node.type === 'boss') return;

        const combatArea = document.getElementById('area-cacada');
        const botoesCombate = document.getElementById('botoes-combate');
        if (combatArea) combatArea.style.display = 'none';
        if (botoesCombate) botoesCombate.style.display = 'none';

        const meta = this.getNodeMeta(node.type);
        const copy = this.resolveCombatResultTitle(node.type);
        this.showResultModal({
            nodeType: node.type,
            tone: 'success',
            icon: meta.icon,
            titleKey: copy.titleKey,
            titleFallback: copy.titleFallback,
            summaryKey: copy.summaryKey,
            summaryFallback: copy.summaryFallback,
            bag: displayedLoot
        });
    }

    static startCampNode(node: ExpeditionNode) {
        const win = window as any;
        const hpBefore = Number(win.playerHP) || 0;
        const mpBefore = Number(win.playerMP) || 0;
        win.playerHP = win.playerStats.maxHp;
        win.playerMP = win.playerStats.maxMp;
        win.atualizar();

        this.completeNode(node);
        this.showResultModal({
            nodeType: 'camp',
            tone: 'success',
            icon: '⛺',
            titleKey: 'game.hunt.expedition.resultCampTitle',
            titleFallback: 'Camp rest',
            summaryKey: 'game.hunt.expedition.resultCampDesc',
            summaryFallback: 'You recovered fully at the safe camp. No bag changes.',
            effects: {
                hpRestored: Math.max(0, win.playerStats.maxHp - hpBefore),
                mpRestored: Math.max(0, win.playerStats.maxMp - mpBefore)
            }
        });
    }

    static startEventNode(node: ExpeditionNode) {
        const win = window as any;
        const roll = Math.random();
        let result: ExpeditionNodeResult;

        if (roll < 1 / 6) {
            const hpBefore = Number(win.playerHP) || 0;
            win.playerHP = win.playerStats.maxHp;
            win.atualizar();
            result = {
                nodeType: 'event',
                tone: 'success',
                icon: '✨',
                titleKey: 'game.hunt.expedition.resultEventShrineTitle',
                titleFallback: 'Ancient Shrine',
                summaryKey: 'game.hunt.expedition.resultEventShrineDesc',
                summaryFallback: 'Sacred energy fully restored your health.',
                effects: { hpRestored: Math.max(0, win.playerStats.maxHp - hpBefore) }
            };
        } else if (roll < 2 / 6) {
            const dmg = Math.floor(win.playerStats.maxHp * 0.20);
            win.playerHP = Math.max(1, win.playerHP - dmg);
            win.atualizar();
            result = {
                nodeType: 'event',
                tone: 'danger',
                icon: '🪤',
                titleKey: 'game.hunt.expedition.resultEventTrapTitle',
                titleFallback: 'Hidden trap',
                summaryKey: 'game.hunt.expedition.resultEventTrapDesc',
                summaryFallback: 'You were wounded before escaping the trap.',
                effects: { hpLost: dmg }
            };
        } else if (roll < 3 / 6) {
            const xpGain = Math.floor(Math.random() * 1000) + 500;
            this.state.bag.xp += xpGain;
            result = {
                nodeType: 'event',
                tone: 'success',
                icon: '📜',
                titleKey: 'game.hunt.expedition.resultEventJournalTitle',
                titleFallback: 'Adventurer\'s journal',
                summaryKey: 'game.hunt.expedition.resultEventJournalDesc',
                summaryFallback: 'Old notes grant experience to your expedition bag.',
                bag: { xp: xpGain }
            };
        } else if (roll < 4 / 6) {
            const adenaGain = Math.floor(Math.random() * 500) + 250;
            this.state.bag.adenas += adenaGain;
            result = {
                nodeType: 'event',
                tone: 'success',
                icon: '💰',
                titleKey: 'game.hunt.expedition.resultEventStashTitle',
                titleFallback: 'Hidden stash',
                summaryKey: 'game.hunt.expedition.resultEventStashDesc',
                summaryFallback: 'Supplies converted into bag Adena.',
                bag: { adenas: adenaGain }
            };
        } else if (roll < 5 / 6) {
            const loss = Math.max(1, Math.floor(this.state.bag.adenas * 0.15));
            this.state.bag.adenas = Math.max(0, this.state.bag.adenas - loss);
            result = {
                nodeType: 'event',
                tone: 'danger',
                icon: '☠️',
                titleKey: 'game.hunt.expedition.resultEventCurseTitle',
                titleFallback: 'Cursed idol',
                summaryKey: 'game.hunt.expedition.resultEventCurseDesc',
                summaryFallback: 'Dark magic drained part of your bag Adena.',
                effects: { bagAdenaLost: loss }
            };
        } else {
            this.state.luckLootMult = 1.25;
            result = {
                nodeType: 'event',
                tone: 'warning',
                icon: '🍀',
                titleKey: 'game.hunt.expedition.resultEventCharmTitle',
                titleFallback: 'Lucky charm',
                summaryKey: 'game.hunt.expedition.resultEventCharmDesc',
                summaryFallback: 'Your next combat node pays +25% bag loot.',
                effects: {
                    buffText: this.t('game.hunt.expedition.logEventCharm', 'Lucky charm — +25% next fight loot')
                }
            };
        }

        this.completeNode(node);
        this.showResultModal(result);
    }

    static startChestNode(node: ExpeditionNode) {
        const win = window as any;
        const isMimic = Math.random() < 0.2;
        let result: ExpeditionNodeResult;

        if (isMimic) {
            const dmg = Math.floor(win.playerStats.maxHp * 0.30);
            win.playerHP = Math.max(1, win.playerHP - dmg);
            win.atualizar();
            result = {
                nodeType: 'chest',
                tone: 'danger',
                icon: '🦷',
                titleKey: 'game.hunt.expedition.resultChestMimicTitle',
                titleFallback: 'Mimic attack!',
                summaryKey: 'game.hunt.expedition.resultChestMimicDesc',
                summaryFallback: 'The chest bites back — no loot this time.',
                effects: { hpLost: dmg }
            };
        } else {
            const adenaGain = Math.floor(Math.random() * 800) + 200;
            this.state.bag.adenas += adenaGain;

            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.floor(Math.random() * 5) + 1;
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;

            result = {
                nodeType: 'chest',
                tone: 'success',
                icon: '🎁',
                titleKey: 'game.hunt.expedition.resultChestLootTitle',
                titleFallback: 'Treasure found',
                summaryKey: 'game.hunt.expedition.resultChestLootDesc',
                summaryFallback: 'The chest yields supplies for your expedition bag.',
                bag: { adenas: adenaGain, drops: { [mat]: matQty } }
            };
        }

        this.completeNode(node);
        this.showResultModal(result);
    }

    static startMerchantNode(node: ExpeditionNode) {
        const win = window as any;
        const roll = Math.random();
        let result: ExpeditionNodeResult;

        if (roll < 0.4) {
            const adenaGain = Math.floor(Math.random() * 401) + 300;
            this.state.bag.adenas += adenaGain;
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '🏪',
                titleKey: 'game.hunt.expedition.resultMerchantAdenaTitle',
                titleFallback: 'Trade deal',
                summaryKey: 'game.hunt.expedition.resultMerchantAdenaDesc',
                summaryFallback: 'The merchant paid well for a rare trinket.',
                bag: { adenas: adenaGain }
            };
        } else if (roll < 0.75) {
            const mats = ['Animal Skin', 'Animal Bone', 'Coal', 'Charcoal', 'Iron Ore', 'Silver Nugget', 'Stem'];
            const mat = mats[Math.floor(Math.random() * mats.length)];
            const matQty = Math.floor(Math.random() * 4) + 2;
            this.state.bag.drops[mat] = (this.state.bag.drops[mat] || 0) + matQty;
            result = {
                nodeType: 'merchant',
                tone: 'success',
                icon: '🏪',
                titleKey: 'game.hunt.expedition.resultMerchantGiftTitle',
                titleFallback: 'Merchant gift',
                summaryKey: 'game.hunt.expedition.resultMerchantGiftDesc',
                summaryFallback: 'Supplies added straight to your bag.',
                bag: { drops: { [mat]: matQty } }
            };
        } else {
            const hpBefore = Number(win.playerHP) || 0;
            const mpBefore = Number(win.playerMP) || 0;
            const hpRestore = Math.floor(win.playerStats.maxHp * 0.6);
            const mpRestore = Math.floor(win.playerStats.maxMp * 0.6);
            win.playerHP = Math.min(win.playerStats.maxHp, win.playerHP + hpRestore);
            win.playerMP = Math.min(win.playerStats.maxMp, win.playerMP + mpRestore);
            win.atualizar();
            result = {
                nodeType: 'merchant',
                tone: 'neutral',
                icon: '🏪',
                titleKey: 'game.hunt.expedition.resultMerchantPatchTitle',
                titleFallback: 'Field remedies',
                summaryKey: 'game.hunt.expedition.resultMerchantPatchDesc',
                summaryFallback: 'Potions and salves patch you up on the trail.',
                effects: {
                    hpRestored: Math.max(0, win.playerHP - hpBefore),
                    mpRestored: Math.max(0, win.playerMP - mpBefore)
                }
            };
        }

        this.completeNode(node);
        this.showResultModal(result);
    }

    static completeNode(node: ExpeditionNode) {
        node.status = 'completed';

        this.state.nodes.forEach((n) => {
            if (n.depth === node.depth && n.id !== node.id) {
                n.status = 'missed';
            }
        });

        node.connections.forEach((connId) => {
            const nextNode = this.state.nodes.find((n) => n.id === connId);
            if (nextNode && nextNode.status === 'locked') {
                nextNode.status = 'available';
            }
        });

        if (node.type === 'boss') {
            this.finishExpedition(true);
        }
    }

    static extract() {
        if (!this.state.active) return;
        this.log('game.hunt.expedition.logExtract', '🏃 You safely extracted with your loot!', undefined, '#facc15');
        this.finishExpedition(true);
    }

    static reset() {
        this.state.active = false;
        this.showHub();
        this.wireStartButton();
    }

    static finishExpedition(success: boolean) {
        if (!this.state.active) return;
        const win = window as any;

        if (success) {
            win.adenas = (Number(win.adenas) || 0) + this.state.bag.adenas;
            for (const itemDrop in this.state.bag.drops) {
                if (itemDrop === 'Ancient Coin') {
                    win.ancientCoins = (Number(win.ancientCoins) || 0) + this.state.bag.drops[itemDrop];
                    continue;
                }
                if (win.InventoryManager && typeof win.InventoryManager.adicionarStack === 'function') {
                    win.InventoryManager.adicionarStack(itemDrop, this.state.bag.drops[itemDrop]);
                } else if (win.inventario[itemDrop]) win.inventario[itemDrop] += this.state.bag.drops[itemDrop];
                else win.inventario[itemDrop] = this.state.bag.drops[itemDrop];
            }
        } else {
            const keptAdena = Math.floor(this.state.bag.adenas * 0.5);
            win.adenas = (Number(win.adenas) || 0) + keptAdena;
            for (const itemDrop in this.state.bag.drops) {
                const keptAmount = Math.floor(this.state.bag.drops[itemDrop] * 0.5);
                if (keptAmount > 0) {
                    if (itemDrop === 'Ancient Coin') {
                        win.ancientCoins = (Number(win.ancientCoins) || 0) + keptAmount;
                        continue;
                    }
                    if (win.InventoryManager && typeof win.InventoryManager.adicionarStack === 'function') {
                        win.InventoryManager.adicionarStack(itemDrop, keptAmount);
                    } else if (win.inventario[itemDrop]) win.inventario[itemDrop] += keptAmount;
                    else win.inventario[itemDrop] = keptAmount;
                }
            }
            this.state.bag.adenas = keptAdena;
            for (const itemDrop in this.state.bag.drops) {
                this.state.bag.drops[itemDrop] = Math.floor(this.state.bag.drops[itemDrop] * 0.5);
            }
        }

        win.atualizar();
        if (typeof win.salvarJogo === 'function') win.salvarJogo();

        this.state.active = false;

        if (success) {
            if (typeof win.setLootTurno === 'function') {
                win.setLootTurno(this.state.bag);
            } else {
                win.lootTurno = this.state.bag;
            }
            win.mostrarResumoVitoria();
        } else {
            win.showForestDeathScreen();
        }

        win.prepararTelaCacada();
        this.wireStartButton();
    }

    static onPlayerDeath() {
        if (this.state.active) {
            this.finishExpedition(false);
        }
    }

    static onFlee() {
        if (!this.state.active) return;

        const win = window as any;
        win.adenas = (Number(win.adenas) || 0) + this.state.bag.adenas;
        for (const itemDrop in this.state.bag.drops) {
            if (itemDrop === 'Ancient Coin') {
                win.ancientCoins = (Number(win.ancientCoins) || 0) + this.state.bag.drops[itemDrop];
                continue;
            }
            if (win.InventoryManager && typeof win.InventoryManager.adicionarStack === 'function') {
                win.InventoryManager.adicionarStack(itemDrop, this.state.bag.drops[itemDrop]);
            } else if (win.inventario[itemDrop]) win.inventario[itemDrop] += this.state.bag.drops[itemDrop];
            else win.inventario[itemDrop] = this.state.bag.drops[itemDrop];
        }
        win.atualizar();
        if (typeof win.salvarJogo === 'function') win.salvarJogo();

        this.state.active = false;
        win.prepararTelaCacada();
        this.wireStartButton();
        win.showForestFleeSuccessScreen();
    }
}

ExpeditionEngine.init();
