/**
 * Migrado: js/systems/clan_war_engine.js — Fase 4: tipos explícitos.
 */

/**
 * CLAN_WAR_ENGINE.JS - Tournament Edition (11v11 Duels)
 * Motor de Combate para Guerra de Clãs organizado por Patentes.
 * Cada clã inscreve 11 membros que lutam em duelos 1v1 contra oponentes de mesmo rank.
 */

import type { BotRankingSeed, ClanRecord, ClanWarEngineApi } from '../types/game';
import { registerGlobal } from '../runtime/register-global';

function cwEl<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

function rankingBotByName(nome: string): BotRankingSeed | null {
    if (!Array.isArray(window.dbBotsRanking)) return null;
    const hit = window.dbBotsRanking.find((b) => {
        const row = b as BotRankingSeed;
        return (row.nome || row.farmBot1) === nome;
    });
    return hit ? (hit as BotRankingSeed) : null;
}

const ClanWarEngine = {
    ativo: false,
    emLobby: false,
    dueloAtual: 1, // 1 a 11
    aliadoWins: 0,
    inimigoWins: 0,
    meuClan: null,
    clanInimigo: null,
    inscritosAliados: [], // Array de 11 nomes
    inscritosInimigos: [], // Array de 11 nomes
    dueloEmAndamento: false,
    aliadoCombatente: null,
    inimigoCombatente: null,
    intervaloProcessamento: null,
    pvpMultiplier: 0.35,
    eventosGuerra: [],

    init() {
        console.log("⚔️ [ClanWar] Motor de Torneio 11v11 inicializado.");
    },

    abrirLobby() {
        if (!window.playerClanId) {
            window.l2Alert(window.t('game.war.needClan'));
            return;
        }

        this.meuClan = (window.clans.find(c => c.id === window.playerClanId) as ClanRecord | undefined) ?? null;
        if (!this.meuClan) return;

        // Trava de segurança: Apenas o líder acessa o Centro de Comando
        if (this.meuClan.lider !== window.charName) {
            window.l2Alert(window.t('game.clan.leaderOnly') || "Only the Clan Leader can access the War Command Center.");
            return;
        }

        // Carrega inscrição salva ou inicia com o líder
        const key = `l2mini_clan_war_roster_${window.playerClanId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            this.inscritosAliados = JSON.parse(saved);
        } else {
            this.inscritosAliados = new Array(11).fill(null);
            this.inscritosAliados[0] = this.meuClan.lider;
        }

        window.irPara('clanwar');
        this.mostrarHub();
    },

    mostrarHub() {
        document.getElementById('clan-war-lobby').style.display = 'flex';
        document.getElementById('clan-war-hub-view').style.display = 'flex';
        document.getElementById('clan-war-preparation-view').style.display = 'none';
        document.getElementById('clan-war-arena').style.display = 'none';
        document.getElementById('clan-war-ui').style.display = 'none';
        
        const header = document.getElementById('war-battle-header');
        if (header) header.style.display = 'none';

        // Reset status UI
        document.getElementById('btn-cw-register').style.display = 'block';
        document.getElementById('cw-waiting-anim').style.display = 'none';
        document.getElementById('cw-status-text').innerText = window.t('game.war.matchProximity');
        document.getElementById('cw-status-text').style.color = '#88745c';
    },

    registrarParaGuerra() {
        // Primeiro, abre a tela de roster para o líder confirmar os 11
        this.renderizarRoster();
    },

    renderizarRoster() {
        const container = document.getElementById('war-roster-slots');
        if (!container) return;

        document.getElementById('clan-war-hub-view').style.display = 'none';
        document.getElementById('clan-war-preparation-view').style.display = 'flex';

        container.innerHTML = '';

        for (let i = 0; i < 11; i++) {
            const rank = i + 1;
            const nome = this.inscritosAliados[i];
            const isLeader = rank === 1;

            const slot = document.createElement('div');
            slot.className = `roster-slot ${isLeader ? 'mandatory' : ''} ${nome ? 'selected' : ''}`;
            
            let memberDetails = "";
            if (nome) {
                if (nome === window.charName) {
                    memberDetails = `Lv. ${window.nivel} ${window.charClass}`;
                } else {
                    const bot = rankingBotByName(nome);
                    memberDetails = bot ? `Lv. ${bot.nivel ?? '??'} ${bot.classe ?? '???'}` : "Lv. ?? ???";
                }
            }

            slot.innerHTML = `
                <div class="roster-rank-badge">${rank}</div>
                <div class="roster-member-info">
                    <div class="roster-member-name">${nome || window.t('game.war.rosterEmptySlot')}</div>
                    <div class="roster-member-details">${memberDetails}</div>
                </div>
                ${!isLeader ? `<button class="btn-l2" style="width:auto; padding:5px 10px; font-size:0.7em;" onclick="ClanWarEngine.abrirSelecaoMembro(${i})">${nome ? window.t('game.war.rosterChange') : window.t('game.war.rosterSelect')}</button>` : ''}
            `;
            container.appendChild(slot);
        }

        const isCompleto = this.inscritosAliados.every(n => n !== null);
        document.getElementById('btn-save-roster').style.display = 'block';
        document.getElementById('btn-start-war').style.display = 'none';
    },

    abrirSelecaoMembro(index) {
        const membrosDisponiveis = this.meuClan.membros.filter(m => !this.inscritosAliados.includes(m));
        
        if (membrosDisponiveis.length === 0) {
            window.l2Alert(window.t('game.war.noMembersAvailable'));
            return;
        }

        let html = `<div style="display:grid; grid-template-columns:1fr; gap:10px; max-height:300px; overflow-y:auto; padding:10px;">`;
        membrosDisponiveis.forEach(m => {
            html += `<button class="btn-l2" onclick="ClanWarEngine.selecionarMembro(${index}, '${m}')">${m}</button>`;
        });
        html += `</div>`;

        window.l2Confirm(html, (confirmado) => {}, {
            title: window.t('game.war.selectMemberTitle', { n: index + 1 }),
            hideCancel: true
        });
    },

    selecionarMembro(index, nome) {
        this.inscritosAliados[index] = nome;
        if (window.fecharTopModal) window.fecharTopModal();
        else window.fecharModal('modal-confirm'); // Fallback
        this.renderizarRoster();
    },

    salvarInscricao() {
        if (this.inscritosAliados.some(n => n === null)) {
            window.l2Alert(window.t('game.war.rosterIncomplete'));
            return;
        }

        const key = `l2mini_clan_war_roster_${window.playerClanId}`;
        localStorage.setItem(key, JSON.stringify(this.inscritosAliados));
        window.mostrarAviso(window.t('game.war.rosterSaved'));
        
        // Após salvar, volta pro Hub em estado de "Procurando"
        this.entrarNaFila();
    },

    entrarNaFila() {
        document.getElementById('clan-war-hub-view').style.display = 'flex';
        document.getElementById('clan-war-preparation-view').style.display = 'none';
        
        document.getElementById('btn-cw-register').style.display = 'none';
        document.getElementById('cw-waiting-anim').style.display = 'flex';
        document.getElementById('cw-status-text').innerText = window.t('game.war.statusWaiting');

        // Simulação de busca
        setTimeout(() => {
            this.verificarMatchmaking();
        }, 3000);
    },

    verificarMatchmaking() {
        // Simulação de Matchmaking Avançado
        const rivais = clans.filter(c => c.id !== playerClanId);
        
        if (rivais.length === 0) {
            // Se não houver clãs reais, gera um oponente bot equilibrado
            this.gerarOponenteBot();
        } else {
            // Filtra clãs que estariam "na fila" (simulação)
            // No futuro, isso buscaria de uma tabela 'war_queue' no Supabase
            const meuNivel = this.meuClan.level || 1;
            
            // Ordena por proximidade de nível para manter o equilíbrio
            rivais.sort((a, b) => {
                const diffA = Math.abs((a.level || 1) - meuNivel);
                const diffB = Math.abs((b.level || 1) - meuNivel);
                return diffA - diffB;
            });

            // Pega o rival mais equilibrado
            this.clanInimigo = rivais[0];
            this.inscritosInimigos = this.gerarInscritosInimigos(this.clanInimigo);
            this.matchEncontrado();
        }
    },

    gerarOponenteBot() {
        const ghostKing = window.t('game.war.ghostKing');
        this.clanInimigo = {
            id: 'bot_clan_' + Date.now(),
            nome: window.t('game.war.ghostClanName'),
            sigla: window.t('game.war.ghostClanTag'),
            level: this.meuClan.level || 1,
            lider: ghostKing,
            membros: [ghostKing]
        };
        this.inscritosInimigos = this.gerarInscritosInimigos(this.clanInimigo);
        this.matchEncontrado();
    },

    matchEncontrado() {
        const statusText = document.getElementById('cw-status-text');
        const waitingAnim = document.getElementById('cw-waiting-anim');
        
        if (statusText) {
            statusText.innerText = window.t('game.war.statusMatchFound') + ": " + this.clanInimigo.nome;
            statusText.style.color = '#22c55e';
        }
        if (waitingAnim) waitingAnim.style.display = 'none';
        
        const btnStart = document.createElement('button');
        btnStart.className = 'btn-l2 btn-cw-siege';
        btnStart.style.marginTop = '15px';
        btnStart.innerText = window.t('pvp.fight');
        btnStart.onclick = () => this.iniciar();
        
        document.getElementById('clan-war-matchmaking-status').appendChild(btnStart);
    },

    async iniciar() {
        if (this.inscritosAliados.some(n => n === null)) {
            window.l2Alert(window.t('game.war.rosterIncomplete'));
            return;
        }

        // Seleciona clã inimigo (snapshot)
        const rivais = clans.filter(c => c.id !== playerClanId);
        if (rivais.length === 0 && this.clanInimigo.id.startsWith('bot_clan_')) {
            // Já geramos o bot no matchmaking
        } else if (rivais.length === 0) {
            window.l2Alert(window.t('game.war.noRivalClans'));
            return;
        }

        this.clanInimigo = rivais[Math.floor(Math.random() * rivais.length)];
        
        // Gera inscritos inimigos (em um sistema real viria do snapshot, aqui geramos 11 membros aleatórios ou bots)
        this.inscritosInimigos = this.gerarInscritosInimigos(this.clanInimigo);

        this.dueloAtual = 1;
        this.aliadoWins = 0;
        this.inimigoWins = 0;
        this.ativo = true;
        this.emLobby = false;
        this.dueloEmAndamento = false;

        document.getElementById('clan-war-lobby').style.display = 'none';
        document.getElementById('clan-war-arena').style.display = 'flex';
        document.getElementById('clan-war-ui').style.display = 'flex';
        
        const header = document.getElementById('war-battle-header');
        if (header) header.style.display = 'block';
        
        document.getElementById('war-clans-vs').innerText = `${this.meuClan.nome} VS ${this.clanInimigo.nome}`;
        this.atualizarPlacar();
        this.prepararProximoDuelo();
    },

    gerarInscritosInimigos(clan) {
        let lista = [...clan.membros];
        // Se tiver menos de 11, completa com bots
        if (lista.length < 11) {
            const numMercs = 11 - lista.length;
            const bots = Array.isArray(window.dbBotsRanking)
                ? [...window.dbBotsRanking].sort(() => 0.5 - Math.random()).slice(0, numMercs)
                : [];
            bots.forEach((b) => {
                const row = b as BotRankingSeed;
                lista.push(`[M] ${row.nome || row.farmBot1 || 'Merc'}`);
            });
        }
        // Embaralha e pega 11 (o líder sempre em primeiro)
        const lider = clan.lider;
        const outros = lista.filter(m => m !== lider).sort(() => 0.5 - Math.random());
        return [lider, ...outros.slice(0, 10)];
    },

    atualizarPlacar() {
        const scoreEl = document.getElementById('war-tournament-score');
        if (scoreEl) {
            scoreEl.innerText = window.t('game.war.duelResult', { aliadoWins: this.aliadoWins, inimigoWins: this.inimigoWins });
        }
    },

    prepararProximoDuelo() {
        if (this.dueloAtual > 11) {
            this.finalizarGuerra();
            return;
        }

        this.dueloEmAndamento = false;
        const rank = this.dueloAtual;
        const nomeAliado = this.inscritosAliados[rank - 1];
        const nomeInimigo = this.inscritosInimigos[rank - 1];

        const container = document.getElementById('war-duel-container');
        container.innerHTML = `
            <div class="duel-rank-header">${window.t('game.war.rosterRank', { n: rank })}</div>
            <div style="display:flex; justify-content:space-between; align-items:center; gap:20px;">
                <div id="combatente-aliado-card" class="war-unit-card aliado">
                    <div class="unit-name">${nomeAliado}</div>
                    <div id="aliado-hp-bar" class="unit-hp-bar"><div class="fill"></div></div>
                </div>
                <div style="font-family:'Cinzel'; color:#ef4444; font-weight:bold; font-size:1.5em;">VS</div>
                <div id="combatente-inimigo-card" class="war-unit-card inimigo">
                    <div class="unit-name">${nomeInimigo}</div>
                    <div id="inimigo-hp-bar" class="unit-hp-bar"><div class="fill"></div></div>
                </div>
            </div>
            <div id="war-tournament-controls" style="text-align:center; margin-top:20px;">
                <button class="btn-l2" onclick="ClanWarEngine.comecarDuelo()">${window.t('pvp.fight')}</button>
            </div>
        `;

        document.getElementById('war-tournament-title').innerText = window.t('game.war.duelTitle', { n: rank });
    },

    comecarDuelo() {
        const rank = this.dueloAtual;
        const nomeAliado = this.inscritosAliados[rank - 1];
        const nomeInimigo = this.inscritosInimigos[rank - 1];

        this.aliadoCombatente = this.gerarCombatente(nomeAliado, 'aliado');
        this.inimigoCombatente = this.gerarCombatente(nomeInimigo, 'inimigo');

        this.dueloEmAndamento = true;
        document.getElementById('war-tournament-controls').innerHTML = "";
        
        this.iniciarProcessamento();
    },

    gerarCombatente(nome, time) {
        const isPlayer = (nome === window.charName);
        const nomeLimpo = nome.replace('[M] ', '');
        
        let completo: Record<string, unknown> | null = null;
        if (isPlayer) {
            completo = {
                nome: window.charName,
                maxHp: window.playerStats.maxHp,
                maxMp: window.playerStats.maxMp,
                maxCp: window.playerStats.maxCp,
                pAtk: window.playerStats.pAtk,
                mAtk: window.playerStats.mAtk,
                pDef: window.playerStats.pDef,
                mDef: window.playerStats.mDef,
                critRate: window.playerStats.critRate,
                atkSpd: window.playerStats.atkSpeed,
                isMage: typeof window.isClasseMagica === 'function' ? window.isClasseMagica(window.charClass) : false,
                skills: []
            };
        } else {
            const botData = rankingBotByName(nomeLimpo);
            const fallback: Record<string, unknown> = { nome: nomeLimpo, nivel: 80, pAtk: 1000, pDef: 1000, mAtk: 1000, mDef: 1000, maxHp: 5000, atkSpd: 500 };
            completo = (typeof window.OlympiadBots !== 'undefined' && window.OlympiadBots?.gerarBotCompleto)
                ? (window.OlympiadBots.gerarBotCompleto((botData || fallback) as Record<string, unknown>) as Record<string, unknown>)
                : fallback;
        }

        const base = completo ?? { maxHp: 5000, maxMp: 500, maxCp: 3000 };
        return {
            ...base,
            idUnico: time === 'aliado' ? 'aliado' : 'inimigo',
            hp: Number(base.maxHp) || 5000,
            cp: (Number(base.maxHp) || 5000) * 0.6,
            mp: Number(base.maxMp) || 500,
            time: time,
            progresso: 0,
            debuffs: {},
            expiracaoDebuffs: {},
            cooldowns: {}
        };
    },

    iniciarProcessamento() {
        if (this.intervaloProcessamento) clearInterval(this.intervaloProcessamento);
        this.intervaloProcessamento = setInterval(() => {
            if (!this.dueloEmAndamento) return;

            this.processarIA(this.aliadoCombatente, this.inimigoCombatente);
            this.processarIA(this.inimigoCombatente, this.aliadoCombatente);

            this.atualizarUIDuelo();
            this.verificarFimDuelo();
        }, 100);
    },

    processarIA(bot, alvo) {
        if (bot.hp <= 0 || alvo.hp <= 0) return;
        
        const agora = Date.now();
        bot.progresso += (100 / (bot.atkSpd / 100));

        if (bot.progresso >= 100) {
            bot.progresso = 0;
            this.aplicarDano(bot, alvo);
        }
    },

    aplicarDano(atacante, defensor) {
        let atk = atacante.isMage ? atacante.mAtk : atacante.pAtk;
        let def = atacante.isMage ? defensor.mDef : defensor.pDef;

        let danoBase = (atk * 1100) / (350 + def);
        let danoFinal = danoBase * this.pvpMultiplier * (0.9 + Math.random() * 0.2);

        if (defensor.cp > 0) {
            if (defensor.cp >= danoFinal) defensor.cp -= danoFinal;
            else { let sobra = danoFinal - defensor.cp; defensor.cp = 0; defensor.hp -= sobra; }
        } else defensor.hp -= danoFinal;

        if (defensor.hp < 0) defensor.hp = 0;
        
        this.exibirDanoVisual(defensor, Math.floor(danoFinal));
    },

    exibirDanoVisual(unit, dano) {
        const cardId = unit.time === 'aliado' ? 'combatente-aliado-card' : 'combatente-inimigo-card';
        const card = document.getElementById(cardId);
        if (!card) return;

        const floating = document.createElement('div');
        floating.className = 'war-floating-damage';
        floating.innerText = dano;
        floating.style.left = (Math.random() * 40 + 30) + '%';
        card.appendChild(floating);
        setTimeout(() => floating.remove(), 1000);
    },

    atualizarUIDuelo() {
        const aliHp = (this.aliadoCombatente.hp / this.aliadoCombatente.maxHp) * 100;
        const iniHp = (this.inimigoCombatente.hp / this.inimigoCombatente.maxHp) * 100;
        
        const aliFill = document.querySelector('#aliado-hp-bar .fill');
        const iniFill = document.querySelector('#inimigo-hp-bar .fill');
        
        if (aliFill instanceof HTMLElement) aliFill.style.width = aliHp + '%';
        if (iniFill instanceof HTMLElement) iniFill.style.width = iniHp + '%';
    },

    verificarFimDuelo() {
        if (this.aliadoCombatente.hp <= 0 || this.inimigoCombatente.hp <= 0) {
            this.dueloEmAndamento = false;
            clearInterval(this.intervaloProcessamento);

            const venceu = this.aliadoCombatente.hp > 0;
            if (venceu) this.aliadoWins++;
            else this.inimigoWins++;

            this.atualizarPlacar();
            
            const controls = document.getElementById('war-tournament-controls');
            const winnerName = venceu ? this.aliadoCombatente.nome : this.inimigoCombatente.nome;
            
            controls.innerHTML = `
                <div style="color:${venceu ? '#22c55e' : '#ef4444'}; font-weight:bold; margin-bottom:10px;">
                    ${window.t('game.war.duelWinner', { name: winnerName })}
                </div>
                <button class="btn-l2" onclick="ClanWarEngine.proximoDuelo()">
                    ${this.dueloAtual < 11 ? window.t('game.war.btnNextDuel') : window.t('game.war.btnFinishWar')}
                </button>
            `;
        }
    },

    proximoDuelo() {
        this.dueloAtual++;
        this.prepararProximoDuelo();
    },

    finalizarGuerra() {
        this.ativo = false;
        const vitoria = this.aliadoWins > this.inimigoWins;
        
        const container = document.getElementById('war-duel-container');
        container.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h2 style="color:${vitoria ? '#facc15' : '#ef4444'}; font-family:'Cinzel'; font-size:2em;">
                    ${vitoria ? window.t('game.war.clanVictory') : window.t('game.war.clanDefeat')}
                </h2>
                <div style="font-size:1.5em; color:#fff; margin:20px 0;">
                    ${this.aliadoWins} VS ${this.inimigoWins}
                </div>
                <button class="btn-l2" onclick="ClanWarEngine.sairDaGuerra()">${window.t('game.war.rosterSave').replace('SAVE', 'EXIT')}</button>
            </div>
        `;
    },

    sairDaGuerra() {
        this.ativo = false;
        this.emLobby = false;
        if (this.intervaloProcessamento) clearInterval(this.intervaloProcessamento);
        window.irPara('world');
    },

    voltarParaSelecaoCastelo() {
        this.mostrarHub();
    }
};

registerGlobal('ClanWarEngine', ClanWarEngine as ClanWarEngineApi);

export {};
