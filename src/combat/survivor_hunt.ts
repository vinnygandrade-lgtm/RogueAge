/**
 * SURVIVOR HUNT — protótipo de caça em ação (estilo horde-survival) com Phaser.
 *
 * Loop: ondas de 30s dentro da zona de caça atual (window.zonaAtual). Mobs
 * perseguem o jogador; o jogador atira automaticamente no inimigo mais
 * próximo. Mobs derrubam MOEDAS que compram melhorias temporárias da run
 * entre as ondas. Ao extrair (ou morrer) o jogador recebe Adena + XP pelos
 * abates, creditados via fluxos existentes (aplicarXpGanhoFloresta / adenas).
 *
 * PROTÓTIPO: visual em formas geométricas (sem sprites). Dívida técnica
 * assumida (§12.7): recompensas creditadas só no cliente, como a floresta
 * clássica offline — validação em nuvem fica para a versão pós-protótipo.
 */

import Phaser from 'phaser';
import { registerGlobalFn } from '../runtime/register-global';
import type { HuntMobTemplate, HuntZoneData } from '../types/game';

// ---------------------------------------------------------------------------
// Constantes de balanceamento do protótipo
// ---------------------------------------------------------------------------
const WAVE_SECONDS = 30;
const MOB_HP_FACTOR = 0.3;        // fração do hpMax da floresta (horda morre rápido)
const MOB_CONTACT_FACTOR = 0.5;   // fração do atk do mob no dano de contato
const MOB_WAVE_SCALE = 0.12;      // +12% hp/atk por onda
const SPAWN_BASE_MS = 900;
const SPAWN_WAVE_DECAY = 0.92;    // intervalo de spawn diminui 8% por onda
const SPAWN_MIN_MS = 280;
const FIRE_BASE_MS = 650;
const PLAYER_BASE_SPEED = 175;
const MOB_BASE_SPEED = 55;
const SHOT_SPEED = 430;
const CONTACT_COOLDOWN_MS = 700;
const COIN_MAGNET_RADIUS = 80;
const COIN_BONUS_CHANCE = 0.1;    // 10% dos mobs derrubam moeda dupla

interface UpgradeDef {
    id: string;
    nameKey: string;
    descKey: string;
    baseCost: number;
    costMult: number;
    maxLevel: number;
}

const UPGRADES: UpgradeDef[] = [
    { id: 'dmg', nameKey: 'game.survivor.upgDmgName', descKey: 'game.survivor.upgDmgDesc', baseCost: 5, costMult: 1.6, maxLevel: 99 },
    { id: 'rate', nameKey: 'game.survivor.upgRateName', descKey: 'game.survivor.upgRateDesc', baseCost: 5, costMult: 1.6, maxLevel: 8 },
    { id: 'multi', nameKey: 'game.survivor.upgMultiName', descKey: 'game.survivor.upgMultiDesc', baseCost: 12, costMult: 2.0, maxLevel: 4 },
    { id: 'speed', nameKey: 'game.survivor.upgSpeedName', descKey: 'game.survivor.upgSpeedDesc', baseCost: 4, costMult: 1.5, maxLevel: 6 },
    { id: 'heal', nameKey: 'game.survivor.upgHealName', descKey: 'game.survivor.upgHealDesc', baseCost: 6, costMult: 1.4, maxLevel: 99 },
];

interface RunState {
    active: boolean;
    phase: 'combat' | 'shop' | 'dead';
    wave: number;
    timeLeft: number;
    coins: number;
    kills: number;
    adena: number;
    xp: number;
    hp: number;
    maxHp: number;
    isMage: boolean;
    dmgMult: number;
    fireMult: number;
    speedBonus: number;
    projectiles: number;
    upgLevels: Record<string, number>;
}

let run: RunState | null = null;
let game: Phaser.Game | null = null;
let sceneRef: HuntScene | null = null;

function tt(key: string, params?: Record<string, string | number>): string {
    return typeof window.t === 'function' ? window.t(key, params) : key;
}

// ---------------------------------------------------------------------------
// Fórmulas (GDD §3.6 — assintótica + floor)
// ---------------------------------------------------------------------------
function danoDoJogador(mobDef: number): { dano: number; crit: boolean } {
    const stats = window.playerStats;
    if (!stats || !run) return { dano: 1, crit: false };
    const atkBase = run.isMage ? stats.mAtk : stats.pAtk;
    const atk = Math.max(1, (Number(atkBase) || 1) * run.dmgMult);
    let dano = (atk * 1100) / (350 + Math.max(1, mobDef));
    dano = Math.max(dano, atk * 0.08);
    let crit = false;
    if (!run.isMage && Math.random() * 100 < (Number(stats.critRate) || 0)) {
        dano *= 1.8;
        crit = true;
    }
    dano *= 0.9 + Math.random() * 0.2;
    return { dano: Math.max(1, Math.floor(dano)), crit };
}

function danoDoMob(mobAtk: number): number {
    const stats = window.playerStats;
    const pDef = stats ? Math.max(1, Number(stats.pDef) || 1) : 1;
    const power = Math.max(1, mobAtk * MOB_CONTACT_FACTOR);
    let dano = (power * 1100) / (350 + pDef);
    dano = Math.max(dano, power * 0.03);
    dano *= 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(dano));
}

function sortearMobTemplate(zona: HuntZoneData): HuntMobTemplate {
    const mobs = zona.mobs || [];
    if (!mobs.length) {
        return { idImg: 'spider', nome: 'MOB', hpMax: 100, atk: 10, def: 10, dropAd: 10, xp: 10, chance: 100, atkSpd: 2000, lvl: 1 };
    }
    const roll = Math.random() * 100;
    let acc = 0;
    for (const mob of mobs) {
        acc += mob.chance;
        if (roll <= acc) return mob;
    }
    return mobs[0];
}

// ---------------------------------------------------------------------------
// Cena Phaser
// ---------------------------------------------------------------------------
class HuntScene extends Phaser.Scene {
    player!: Phaser.Physics.Arcade.Image;
    mobs!: Phaser.Physics.Arcade.Group;
    shots!: Phaser.Physics.Arcade.Group;
    coins!: Phaser.Physics.Arcade.Group;
    keys!: Record<string, Phaser.Input.Keyboard.Key>;
    spawnTimer: Phaser.Time.TimerEvent | null = null;
    fireTimer: Phaser.Time.TimerEvent | null = null;
    clockTimer: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('survivor-hunt');
    }

    create(): void {
        this.criarTexturas();

        this.mobs = this.physics.add.group();
        this.shots = this.physics.add.group();
        this.coins = this.physics.add.group();

        const cx = this.scale.width / 2;
        const cy = this.scale.height / 2;
        this.player = this.physics.add.image(cx, cy, 'sv-player');
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        this.scale.on('resize', (size: Phaser.Structs.Size) => {
            this.physics.world.setBounds(0, 0, size.width, size.height);
        });

        if (this.input.keyboard) {
            this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
        }

        this.physics.add.overlap(this.shots, this.mobs, (shot, mob) => {
            this.acertarMob(shot as Phaser.Physics.Arcade.Image, mob as Phaser.Physics.Arcade.Image);
        });
        this.physics.add.overlap(this.player, this.mobs, (_p, mob) => {
            this.contatoMob(mob as Phaser.Physics.Arcade.Image);
        });
        this.physics.add.overlap(this.player, this.coins, (_p, coin) => {
            this.coletarMoeda(coin as Phaser.Physics.Arcade.Image);
        });

        sceneRef = this;
        this.iniciarOnda();
    }

    criarTexturas(): void {
        const mk = (key: string, draw: (g: Phaser.GameObjects.Graphics) => void, w: number, h: number) => {
            if (this.textures.exists(key)) return;
            const g = this.add.graphics();
            draw(g);
            g.generateTexture(key, w, h);
            g.destroy();
        };
        mk('sv-player', (g) => {
            g.fillStyle(0xf4e8cd, 1);
            g.fillRoundedRect(0, 0, 24, 24, 5);
            g.lineStyle(2, 0xffd76a, 1);
            g.strokeRoundedRect(1, 1, 22, 22, 5);
        }, 24, 24);
        mk('sv-mob', (g) => {
            g.fillStyle(0xb43a35, 1);
            g.fillRect(0, 0, 20, 20);
            g.lineStyle(2, 0x5e1512, 1);
            g.strokeRect(1, 1, 18, 18);
        }, 20, 20);
        mk('sv-shot', (g) => {
            g.fillStyle(0x7ad7ff, 1);
            g.fillCircle(4, 4, 4);
        }, 8, 8);
        mk('sv-coin', (g) => {
            g.fillStyle(0xffd76a, 1);
            g.fillCircle(5, 5, 5);
            g.lineStyle(1, 0x8a6c25, 1);
            g.strokeCircle(5, 5, 4.5);
        }, 10, 10);
    }

    // --- fluxo de onda ---

    iniciarOnda(): void {
        if (!run) return;
        run.phase = 'combat';
        run.timeLeft = WAVE_SECONDS;
        atualizarHud();

        const spawnMs = Math.max(SPAWN_MIN_MS, SPAWN_BASE_MS * Math.pow(SPAWN_WAVE_DECAY, run.wave - 1));
        this.spawnTimer = this.time.addEvent({ delay: spawnMs, loop: true, callback: () => this.spawnMob() });
        this.fireTimer = this.time.addEvent({
            delay: Math.max(120, FIRE_BASE_MS * (run ? run.fireMult : 1)),
            loop: true,
            callback: () => this.atirar(),
        });
        this.clockTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (!run || run.phase !== 'combat') return;
                run.timeLeft -= 1;
                atualizarHud();
                if (run.timeLeft <= 0) this.encerrarOnda();
            },
        });
    }

    pararTimers(): void {
        this.spawnTimer?.remove(); this.spawnTimer = null;
        this.fireTimer?.remove(); this.fireTimer = null;
        this.clockTimer?.remove(); this.clockTimer = null;
    }

    encerrarOnda(): void {
        if (!run) return;
        run.phase = 'shop';
        this.pararTimers();

        // Moedas restantes no chão são recolhidas automaticamente
        this.coins.getChildren().slice().forEach((c) => {
            const coin = c as Phaser.Physics.Arcade.Image;
            run!.coins += (coin.getData('valor') as number) || 1;
            coin.destroy();
        });
        // Mobs restantes fogem (sem recompensa)
        this.mobs.getChildren().slice().forEach((m) => {
            const mob = m as Phaser.Physics.Arcade.Image;
            this.tweens.add({ targets: mob, alpha: 0, duration: 350, onComplete: () => mob.destroy() });
        });
        this.shots.clear(true, true);
        this.physics.pause();
        atualizarHud();
        abrirLoja();
    }

    proximaOnda(): void {
        if (!run) return;
        run.wave += 1;
        this.physics.resume();
        this.iniciarOnda();
    }

    morrer(): void {
        if (!run || run.phase === 'dead') return;
        run.phase = 'dead';
        this.pararTimers();
        this.physics.pause();
        this.cameras.main.flash(300, 180, 30, 30);
        abrirResultado(true);
    }

    // --- spawn / combate ---

    spawnMob(): void {
        if (!run || run.phase !== 'combat') return;
        const zona = window.zonaAtual;
        if (!zona) return;
        const tpl = sortearMobTemplate(zona);
        const escala = 1 + MOB_WAVE_SCALE * (run.wave - 1);

        const w = this.scale.width;
        const h = this.scale.height;
        const lado = Phaser.Math.Between(0, 3);
        const x = lado === 0 ? -14 : lado === 1 ? w + 14 : Phaser.Math.Between(0, w);
        const y = lado === 2 ? -14 : lado === 3 ? h + 14 : Phaser.Math.Between(0, h);

        const mob = this.physics.add.image(x, y, 'sv-mob');
        const hpMax = Math.max(8, Math.floor(tpl.hpMax * MOB_HP_FACTOR * escala));
        mob.setData({
            hp: hpMax,
            hpMax,
            def: tpl.def,
            atk: tpl.atk * escala,
            dropAd: tpl.dropAd,
            xp: tpl.xp,
            speed: MOB_BASE_SPEED + Math.random() * 30 + (run.wave - 1) * 3,
            nextContactAt: 0,
        });
        const tint = 0xb43a35 + ((tpl.lvl * 977) % 0x3030);
        mob.setTint(tint);
        this.mobs.add(mob);
    }

    atirar(): void {
        if (!run || run.phase !== 'combat') return;
        const vivos = (this.mobs.getChildren() as Phaser.Physics.Arcade.Image[])
            .filter((m) => m.active)
            .sort((a, b) =>
                Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y) -
                Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y));
        if (!vivos.length) return;

        const alvos = vivos.slice(0, run.projectiles);
        for (const alvo of alvos) {
            const shot = this.physics.add.image(this.player.x, this.player.y, 'sv-shot');
            this.shots.add(shot);
            this.physics.moveToObject(shot, alvo, SHOT_SPEED);
            this.time.delayedCall(1400, () => { if (shot.active) shot.destroy(); });
        }
    }

    acertarMob(shot: Phaser.Physics.Arcade.Image, mob: Phaser.Physics.Arcade.Image): void {
        if (!run || !shot.active || !mob.active) return;
        shot.destroy();
        const { dano, crit } = danoDoJogador((mob.getData('def') as number) || 1);
        const hp = ((mob.getData('hp') as number) || 1) - dano;
        mob.setData('hp', hp);
        this.textoDano(mob.x, mob.y - 12, String(dano), crit ? '#ffd76a' : '#ffffff', crit);
        if (hp <= 0) this.matarMob(mob);
        else {
            mob.setAlpha(0.5);
            this.time.delayedCall(80, () => { if (mob.active) mob.setAlpha(1); });
        }
    }

    matarMob(mob: Phaser.Physics.Arcade.Image): void {
        if (!run) return;
        run.kills += 1;
        run.adena += Math.max(0, Math.floor((mob.getData('dropAd') as number) || 0));
        run.xp += Math.max(0, Math.floor((mob.getData('xp') as number) || 0));

        const valor = Math.random() < COIN_BONUS_CHANCE ? 2 : 1;
        const coin = this.physics.add.image(mob.x, mob.y, 'sv-coin');
        coin.setData('valor', valor);
        if (valor > 1) coin.setScale(1.4);
        this.coins.add(coin);

        mob.destroy();
        atualizarHud();
    }

    contatoMob(mob: Phaser.Physics.Arcade.Image): void {
        if (!run || run.phase !== 'combat' || !mob.active) return;
        const agora = this.time.now;
        if (agora < ((mob.getData('nextContactAt') as number) || 0)) return;
        mob.setData('nextContactAt', agora + CONTACT_COOLDOWN_MS);

        const dano = danoDoMob((mob.getData('atk') as number) || 1);
        run.hp = Math.max(0, run.hp - dano);
        this.textoDano(this.player.x, this.player.y - 16, String(dano), '#ff6a5e', false);
        this.cameras.main.shake(90, 0.004);
        atualizarHud();
        if (run.hp <= 0) this.morrer();
    }

    coletarMoeda(coin: Phaser.Physics.Arcade.Image): void {
        if (!run || !coin.active) return;
        run.coins += (coin.getData('valor') as number) || 1;
        coin.destroy();
        atualizarHud();
    }

    textoDano(x: number, y: number, texto: string, cor: string, grande: boolean): void {
        const t = this.add.text(x, y, texto, {
            fontFamily: 'Arial, sans-serif',
            fontSize: grande ? '17px' : '13px',
            fontStyle: 'bold',
            color: cor,
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: y - 26, alpha: 0, duration: 600, onComplete: () => t.destroy() });
    }

    update(): void {
        if (!run || run.phase !== 'combat') return;

        // Movimento: teclado + toque/mouse (segurar para andar até o ponto)
        const speed = PLAYER_BASE_SPEED + run.speedBonus;
        let vx = 0;
        let vy = 0;
        if (this.keys) {
            if (this.keys.A?.isDown || this.keys.LEFT?.isDown) vx -= 1;
            if (this.keys.D?.isDown || this.keys.RIGHT?.isDown) vx += 1;
            if (this.keys.W?.isDown || this.keys.UP?.isDown) vy -= 1;
            if (this.keys.S?.isDown || this.keys.DOWN?.isDown) vy += 1;
        }
        if (vx !== 0 || vy !== 0) {
            const norm = Math.hypot(vx, vy);
            this.player.setVelocity((vx / norm) * speed, (vy / norm) * speed);
        } else if (this.input.activePointer.isDown) {
            const p = this.input.activePointer;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.worldX, p.worldY);
            if (dist > 10) this.physics.moveTo(this.player, p.worldX, p.worldY, speed);
            else this.player.setVelocity(0, 0);
        } else {
            this.player.setVelocity(0, 0);
        }

        // Mobs perseguem o jogador
        for (const m of this.mobs.getChildren() as Phaser.Physics.Arcade.Image[]) {
            if (!m.active) continue;
            this.physics.moveToObject(m, this.player, (m.getData('speed') as number) || MOB_BASE_SPEED);
        }

        // Ímã de moedas
        for (const c of this.coins.getChildren() as Phaser.Physics.Arcade.Image[]) {
            if (!c.active) continue;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
            if (dist < COIN_MAGNET_RADIUS) this.physics.moveToObject(c, this.player, 300);
        }
    }
}

// ---------------------------------------------------------------------------
// Overlay DOM (HUD + loja + resultado)
// ---------------------------------------------------------------------------
function construirOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'survivor-overlay';
    overlay.innerHTML = `
        <div class="survivor-frame">
            <div id="survivor-canvas-host"></div>
            <div class="survivor-hud">
                <div class="survivor-hud__group">
                    <span id="survivor-hud-wave" class="survivor-hud__wave"></span>
                    <span id="survivor-hud-kills" class="survivor-hud__kills"></span>
                </div>
                <span id="survivor-hud-timer" class="survivor-hud__timer"></span>
                <div class="survivor-hud__group">
                    <span id="survivor-hud-coins" class="survivor-hud__coins"></span>
                </div>
            </div>
            <button type="button" id="survivor-exit" class="survivor-exit-btn"></button>
            <div class="survivor-hpbar">
                <div id="survivor-hp-fill" class="survivor-hpbar__fill"></div>
                <span id="survivor-hp-text" class="survivor-hpbar__text"></span>
            </div>
            <div id="survivor-panel" class="survivor-panel">
                <div class="survivor-panel__box">
                    <div class="survivor-panel__header">
                        <h3 id="survivor-panel-title" class="survivor-panel__title"></h3>
                        <p id="survivor-panel-hint" class="survivor-panel__hint"></p>
                        <p id="survivor-panel-coins" class="survivor-panel__coins"></p>
                    </div>
                    <div id="survivor-panel-body" class="survivor-panel__body"></div>
                    <div id="survivor-panel-footer" class="survivor-panel__footer"></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const exitBtn = overlay.querySelector('#survivor-exit') as HTMLButtonElement;
    exitBtn.textContent = tt('game.survivor.extractBtn');
    exitBtn.onclick = () => {
        if (!run || run.phase === 'dead') return;
        finalizarRun();
    };
    return overlay;
}

function setTexto(id: string, texto: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function atualizarHud(): void {
    if (!run) return;
    setTexto('survivor-hud-wave', tt('game.survivor.hudWave', { n: run.wave }));
    setTexto('survivor-hud-timer', run.phase === 'combat' ? `${run.timeLeft}s` : '—');
    setTexto('survivor-hud-coins', String(run.coins));
    setTexto('survivor-hud-kills', String(run.kills));
    const fill = document.getElementById('survivor-hp-fill');
    if (fill) fill.style.width = `${Math.max(0, (run.hp / run.maxHp) * 100)}%`;
    setTexto('survivor-hp-text', `${Math.ceil(run.hp)} / ${run.maxHp}`);
}

function custoUpgrade(def: UpgradeDef, nivel: number): number {
    return Math.ceil(def.baseCost * Math.pow(def.costMult, nivel));
}

function aplicarUpgrade(id: string): void {
    if (!run) return;
    switch (id) {
        case 'dmg': run.dmgMult += 0.25; break;
        case 'rate': run.fireMult *= 0.85; break;
        case 'multi': run.projectiles += 1; break;
        case 'speed': run.speedBonus += 26; break;
        case 'heal': run.hp = Math.min(run.maxHp, run.hp + Math.ceil(run.maxHp * 0.4)); break;
    }
}

function abrirLoja(): void {
    if (!run) return;
    const panel = document.getElementById('survivor-panel');
    if (!panel) return;

    setTexto('survivor-panel-title', tt('game.survivor.shopTitle'));
    setTexto('survivor-panel-hint', tt('game.survivor.shopHint'));

    const renderizar = () => {
        if (!run) return;
        setTexto('survivor-panel-coins', tt('game.survivor.coinsLabel', { n: run.coins }));
        const body = document.getElementById('survivor-panel-body');
        if (!body) return;
        body.innerHTML = '';
        for (const def of UPGRADES) {
            const nivel = run.upgLevels[def.id] || 0;
            const custo = custoUpgrade(def, nivel);
            const noMax = nivel >= def.maxLevel;
            const row = document.createElement('div');
            row.className = 'survivor-upg-row';
            row.innerHTML = `
                <div class="survivor-upg-row__info">
                    <div class="survivor-upg-row__name">${tt(def.nameKey)}<span class="survivor-upg-row__lvl">${nivel > 0 ? 'Lv.' + nivel : ''}</span></div>
                    <div class="survivor-upg-row__desc">${tt(def.descKey)}</div>
                </div>
                <button type="button" class="survivor-upg-row__buy"></button>`;
            const btn = row.querySelector('button') as HTMLButtonElement;
            btn.textContent = noMax ? tt('game.survivor.maxedBtn') : tt('game.survivor.buyBtn', { cost: custo });
            btn.disabled = noMax || run.coins < custo;
            btn.onclick = () => {
                if (!run || run.coins < custo || noMax) return;
                run.coins -= custo;
                run.upgLevels[def.id] = nivel + 1;
                aplicarUpgrade(def.id);
                atualizarHud();
                renderizar();
            };
            body.appendChild(row);
        }
    };
    renderizar();

    const footer = document.getElementById('survivor-panel-footer');
    if (footer) {
        footer.innerHTML = '';
        const btnNext = document.createElement('button');
        btnNext.type = 'button';
        btnNext.className = 'btn-l2';
        btnNext.textContent = tt('game.survivor.nextWaveBtn', { n: run.wave + 1 });
        btnNext.onclick = () => {
            fecharPainel();
            sceneRef?.proximaOnda();
        };
        const btnLeave = document.createElement('button');
        btnLeave.type = 'button';
        btnLeave.className = 'btn-l2';
        btnLeave.style.opacity = '0.85';
        btnLeave.textContent = tt('game.survivor.extractBtn');
        btnLeave.onclick = () => finalizarRun();
        footer.appendChild(btnNext);
        footer.appendChild(btnLeave);
    }
    panel.classList.add('is-open');
}

function abrirResultado(morreu: boolean): void {
    if (!run) return;
    const panel = document.getElementById('survivor-panel');
    if (!panel) return;

    setTexto('survivor-panel-title', morreu ? tt('game.survivor.deathTitle') : tt('game.survivor.resultTitle'));
    setTexto('survivor-panel-hint', tt('game.survivor.deathHint'));
    setTexto('survivor-panel-coins', '');

    const body = document.getElementById('survivor-panel-body');
    if (body) {
        body.innerHTML = `
            <div class="survivor-result-rows">
                <div class="survivor-result-row"><span>${tt('game.survivor.resultKills')}</span><b>${run.kills}</b></div>
                <div class="survivor-result-row"><span>${tt('game.survivor.resultAdena')}</span><b>+${run.adena}</b></div>
                <div class="survivor-result-row"><span>${tt('game.survivor.resultXp')}</span><b>+${run.xp}</b></div>
                <div class="survivor-result-row"><span>${tt('game.survivor.hudWave', { n: run.wave })}</span><b>⚔</b></div>
            </div>`;
    }
    const footer = document.getElementById('survivor-panel-footer');
    if (footer) {
        footer.innerHTML = '';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-l2';
        btn.textContent = tt('game.survivor.collectBtn');
        btn.onclick = () => finalizarRun();
        footer.appendChild(btn);
    }
    panel.classList.add('is-open');
}

function fecharPainel(): void {
    document.getElementById('survivor-panel')?.classList.remove('is-open');
}

// ---------------------------------------------------------------------------
// Ciclo de vida da run
// ---------------------------------------------------------------------------
function creditarRecompensas(): void {
    if (!run) return;
    const { adena, xp, kills, wave } = run;
    if (adena > 0) window.adenas = (Number(window.adenas) || 0) + adena;

    let xpFinal = xp;
    const lv = Number(window.nivel) || 1;
    if (window.EconomyBalance && typeof window.EconomyBalance.scaleNoviceXpGain === 'function') {
        xpFinal = window.EconomyBalance.scaleNoviceXpGain(xp, lv);
    }
    if (xpFinal > 0 && typeof window.aplicarXpGanhoFloresta === 'function') {
        window.aplicarXpGanhoFloresta(xpFinal);
    }
    if (typeof window.atualizar === 'function') window.atualizar();
    if (typeof window.escreverLog === 'function' && (kills > 0 || adena > 0)) {
        window.escreverLog(`<span style="color:#b6e29a;">${tt('game.survivor.logResult', { kills, adena, xp: xpFinal, wave })}</span>`);
    }
    if (typeof window.salvarJogo === 'function') window.salvarJogo();
}

function finalizarRun(): void {
    creditarRecompensas();
    destruirTudo();
}

function destruirTudo(): void {
    if (game) {
        game.destroy(true);
        game = null;
    }
    sceneRef = null;
    run = null;
    document.getElementById('survivor-overlay')?.remove();
}

function iniciarSurvivorHunt(): void {
    if (run || document.getElementById('survivor-overlay')) return;
    if (typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais();
    const stats = window.playerStats;
    if (!stats || !window.zonaAtual || !Array.isArray(window.zonaAtual.mobs)) {
        if (typeof window.l2Alert === 'function') window.l2Alert(tt('game.survivor.noStats'));
        return;
    }

    const isMage = typeof window.isClasseMagica === 'function' ? window.isClasseMagica(window.charClass) : false;
    const maxHp = Math.max(1, Number(stats.maxHp) || 100);

    run = {
        active: true,
        phase: 'combat',
        wave: 1,
        timeLeft: WAVE_SECONDS,
        coins: 0,
        kills: 0,
        adena: 0,
        xp: 0,
        hp: maxHp,
        maxHp,
        isMage,
        dmgMult: 1,
        fireMult: 1,
        speedBonus: 0,
        projectiles: 1,
        upgLevels: {},
    };

    construirOverlay();
    atualizarHud();

    const host = document.getElementById('survivor-canvas-host') as HTMLElement;
    game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        backgroundColor: '#101418',
        scale: {
            mode: Phaser.Scale.RESIZE,
            width: host.clientWidth || 450,
            height: host.clientHeight || 800,
        },
        physics: { default: 'arcade', arcade: { debug: false } },
        scene: [HuntScene],
    });
}

registerGlobalFn('iniciarSurvivorHunt', iniciarSurvivorHunt);

export { iniciarSurvivorHunt };
