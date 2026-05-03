// ==========================================
// OLYMPIAD ENGINE - SIMULADOR X1 (MMO AUTHORITATIVE)
// ==========================================
window.OlympiadEngine = {
    ativo: false,
    multiplayer: false,
    lobbyAtivo: false,
    resumoAtivo: false,
    playerConfirmou: false,
    rivalConfirmou: false,
    inimigo: null,
    danoCausado: 0,
    danoRecebido: 0,
    olyPairSessionId: null, // Agora usado como MatchId do Servidor
    dbRanking: [],

    // --- CORE FLOW ---

    reset() {
        this.logOly("Resetando motor...");
        this.ativo = false;
        this.multiplayer = false;
        this.playerConfirmou = false;
        this.rivalConfirmou = false;
        this.inimigo = null;
        this.olyPairSessionId = null;
        this.danoCausado = 0;
        this.danoRecebido = 0;

        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (this.challengeInterval) clearInterval(this.challengeInterval);
        this.heartbeatInterval = this.syncInterval = this.challengeInterval = null;
        
        this.pararLoopInimigo();
    },

    iniciarLobby() {
        if (!window.charName) return;
        this.reset();
        this.lobbyAtivo = true;
        this.prepararTelaLobby();
        this.escreverLog(`<span style="color:#60a5fa; font-weight:bold;">[Multiplayer] Procurando desafiantes...</span>`);
        
        if (window.SupabaseAPI?.nodeSocket?.connected) {
            window.SupabaseAPI.nodeSocket.emit('oly_join_lobby', { nome: window.charName });
            this.iniciarHeartbeatLobby();
        }
    },

    iniciarHeartbeatLobby() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (!this.lobbyAtivo || this.ativo) return;
            if (!this.inimigo) {
                // Se não tem inimigo, grita para o mundo
                window.SupabaseAPI.broadcastCombat('oly_challenge', this.gerarMeusDadosParaOponente());
            }
        }, 3000);
    },

    handleMultiplayerEvent(evento, dados) {
        if (!dados) return;
        const remetente = dados.nome || dados.sender || dados.attacker;
        if (this.sameCharName(remetente, window.charName)) return;

        this.logOly(`Evento: ${evento}`, dados);

        switch(evento) {
            case 'oly_challenge':
                if (this.lobbyAtivo && !this.inimigo && !this.ativo) {
                    this.aceitarDesafio(dados);
                }
                break;

            case 'oly_match_created':
                // O SERVIDOR criou um contrato de luta para nós
                const euSouP1 = this.sameCharName(dados.p1, window.charName);
                const euSouP2 = this.sameCharName(dados.p2, window.charName);

                if (euSouP1 || euSouP2) {
                    this.logOly("Contrato de luta recebido!", dados.matchId);
                    const dadosRival = euSouP1 ? dados.details : this.gerarDadosRivalFake(dados.p1);
                    this.vincularInimigo(dadosRival, dados.matchId);
                }
                break;

            case 'oly_player_ready_sync':
                if (this.olyPairSessionId === dados.matchId && !this.sameCharName(dados.nome, window.charName)) {
                    this.logOly("Rival está pronto!");
                    this.rivalConfirmou = true;
                    this.atualizarStatusConfirmacao();
                }
                break;

            case 'oly_start_duel_now':
                if (this.olyPairSessionId === dados.matchId) {
                    this.logOly("ORDEM DE INÍCIO RECEBIDA!");
                    this.entrarNoDuelo();
                }
                break;

            case 'oly_lobby_left':
                if (this.inimigo && this.sameCharName(remetente, this.inimigo.nome)) {
                    window.mostrarAviso(`${this.inimigo.nome} saiu do lobby.`);
                    this.iniciarLobby();
                }
                break;

            case 'oly_opponent_fled':
                if (this.inimigo && this.sameCharName(remetente, this.inimigo.nome)) {
                    if (this.ativo) {
                        window.l2Alert(`${this.inimigo.nome} fugiu! Vitória por W.O.`, "ARENA");
                        this.finalizar(true);
                    }
                }
                break;

            case 'oly_hit':
                if (this.ativo && this.inimigo && this.sameCharName(remetente, this.inimigo.nome)) {
                    this.receberDanoMultiplayer(dados.damage, dados.isCrit, dados.skillName);
                }
                break;

            case 'oly_sync_hp':
                if (this.ativo && this.inimigo && this.sameCharName(remetente, this.inimigo.nome)) {
                    this.inimigo.hp = dados.hp;
                    this.inimigo.cp = dados.cp;
                    this.renderizarUI();
                }
                break;
        }
    },

    aceitarDesafio(dadosOponente) {
        this.logOly("Enviando aceitação de desafio para o servidor...");
        window.SupabaseAPI.nodeSocket.emit('oly_challenge_response', {
            nome: window.charName,
            oponenteAlvo: dadosOponente.nome,
            ...this.gerarMeusDadosParaOponente()
        });
    },

    vincularInimigo(dados, matchId) {
        this.multiplayer = true;
        this.olyPairSessionId = matchId;
        this.inimigo = dados;
        this.inimigo.hp = dados.maxHp;
        this.inimigo.cp = dados.maxCp;
        this.inimigo.mp = dados.maxMp;

        this.setupPaperdolls();
        this.renderizarUI();
        this.setOlympiadLobbyMatched(true);
        this.escreverLog(`<span style="color:#facc15;">[Arena] Oponente vinculado: ${this.inimigo.nome}!</span>`);
    },

    confirmarPlayer() {
        if (!this.lobbyAtivo || this.playerConfirmou || !this.olyPairSessionId) return;
        
        this.playerConfirmou = true;
        this.atualizarStatusUIConfirmacaoLocal();

        this.logOly("Enviando confirmação de prontidão...");
        window.SupabaseAPI.nodeSocket.emit('oly_confirm_ready', {
            nome: window.charName,
            matchId: this.olyPairSessionId
        });
    },

    entrarNoDuelo() {
        if (this.ativo) return;
        this.logOly("Teleportando para arena...");
        this.lobbyAtivo = false;
        const lobby = document.getElementById('olympiad-lobby');
        if (lobby) lobby.style.display = 'none';
        
        this.ativo = true;
        this.renderizarUI();
        this.escreverLog(`<span style="color:#facc15; font-weight:bold;">[Olympiad] A luta começou!</span>`);
        
        this.syncInterval = setInterval(() => {
            if (this.ativo) this.broadcastMyOlyVitalityToPeer();
            else clearInterval(this.syncInterval);
        }, 2000);
    },

    // --- HELPERS ---

    sameCharName(a, b) {
        return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
    },

    logOly(msg, d) {
        console.log(`%c[OLY-SYSTEM] ${msg}`, "color: #facc15; font-weight: bold", d || "");
    },

    escreverLog(msg) {
        const log = document.getElementById('olympiad-log');
        if (log) log.innerHTML = `${msg}<br>${log.innerHTML}`;
    },

    gerarMeusDadosParaOponente() {
        return {
            nome: window.charName,
            classe: window.charClass,
            nivel: window.nivel,
            maxHp: window.playerStats.maxHp,
            maxMp: window.playerStats.maxMp,
            maxCp: window.playerStats.maxCp,
            pAtk: window.playerStats.pAtk,
            mAtk: window.playerStats.mAtk,
            pDef: window.playerStats.pDef,
            mDef: window.playerStats.mDef,
            isRealPlayer: true,
            visual: {
                raca: window.charRace,
                isFem: window.charGender === "Female",
                armorId: window.armaduraEquipada?.id,
                weaponId: window.armaEquipadaBase?.id
            }
        };
    },

    gerarDadosRivalFake(nome) {
        return { nome: nome, maxHp: 1000, maxCp: 600, maxMp: 500, visual: { raca: 'Human' } };
    },

    prepararTelaLobby() {
        const lobby = document.getElementById('olympiad-lobby');
        const resultado = document.getElementById('olympiad-resultado');
        if (lobby) lobby.style.display = 'flex';
        if (resultado) resultado.style.display = 'none';
        
        document.getElementById('oly-status-player').innerText = 'WAITING';
        document.getElementById('oly-status-player').style.color = "#f59e0b";
        document.getElementById('oly-status-rival').innerText = 'WAITING';
        document.getElementById('oly-status-rival').style.color = "#f59e0b";
        
        const btn = document.getElementById('btn-oly-confirmar');
        if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerText = 'CONFIRM'; }
        this.setOlympiadLobbyMatched(false);
    },

    atualizarStatusUIConfirmacaoLocal() {
        document.getElementById('oly-status-player').innerText = 'READY';
        document.getElementById('oly-status-player').style.color = "#22c55e";
        const btn = document.getElementById('btn-oly-confirmar');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; btn.innerText = 'WAITING RIVAL'; }
    },

    atualizarStatusConfirmacao() {
        if (this.rivalConfirmou) {
            document.getElementById('oly-status-rival').innerText = 'READY';
            document.getElementById('oly-status-rival').style.color = "#22c55e";
        }
    },

    setOlympiadLobbyMatched(m) {
        const lobby = document.getElementById('olympiad-lobby');
        if (lobby) lobby.classList.toggle('olympiad-lobby--matched', !!m);
    },

    renderizarUI() {
        if (!this.inimigo) return;
        const updateFill = (id, cur, max) => {
            const el = document.getElementById(id);
            if (el) el.style.width = `${Math.max(0, (cur / max) * 100)}%`;
        };
        updateFill('oly-inimigo-hp-fill', this.inimigo.hp, this.inimigo.maxHp);
        updateFill('oly-inimigo-cp-fill', this.inimigo.cp, this.inimigo.maxCp);
        updateFill('oly-player-hp-fill', window.playerHP, window.playerStats.maxHp);
        updateFill('oly-player-cp-fill', window.playerCP, window.playerStats.maxCp);
        updateFill('oly-player-mp-fill', window.playerMP, window.playerStats.maxMp);
        
        document.getElementById('oly-inimigo-nome').innerText = this.inimigo.nome;
        document.getElementById('oly-player-lvl').innerText = window.nivel;
    },

    broadcastMyOlyVitalityToPeer() {
        window.SupabaseAPI.broadcastCombat('oly_sync_hp', {
            hp: window.playerHP,
            cp: window.playerCP,
            matchId: this.olyPairSessionId
        });
    },

    receberDanoMultiplayer(dano, isCrit, skill) {
        if (!this.ativo) return;
        const d = Math.max(1, Math.floor(dano * 0.35));
        if (window.playerCP > 0) {
            if (window.playerCP >= d) window.playerCP -= d;
            else { const s = d - window.playerCP; window.playerCP = 0; window.playerHP -= s; }
        } else window.playerHP -= d;
        
        if (window.playerHP <= 0) {
            window.playerHP = 0;
            window.SupabaseAPI.broadcastCombat('oly_end', { winner: this.inimigo.nome, matchId: this.olyPairSessionId });
            this.finalizar(false);
        }
        this.renderizarUI();
        if (typeof atualizar === 'function') atualizar();
    },

    finalizar(v) {
        if (!this.ativo) return;
        this.ativo = false;
        this.resumoAtivo = true;
        this.pararLoopInimigo();
        if (v) {
            window.adenas += 500;
            window.olympiadWins++;
            this.escreverLog(`<span style="color:#10b981; font-weight:bold;">Vitória! +500a</span>`);
        } else {
            window.olympiadLosses++;
            this.escreverLog(`<span style="color:#ef4444; font-weight:bold;">Derrota...</span>`);
        }
        this.mostrarPainelResultado(v);
        if (typeof salvarJogo === 'function') salvarJogo();
    },

    mostrarPainelResultado(v) {
        const p = document.getElementById('olympiad-resultado');
        if (p) p.style.display = 'flex';
        document.getElementById('oly-res-titulo').innerText = v ? 'VICTORY' : 'DEFEAT';
        document.getElementById('oly-res-rival').innerText = this.inimigo?.nome || '-';
    },

    fugir() {
        if (this.ativo) {
            window.SupabaseAPI.broadcastCombat('oly_opponent_fled', { nome: window.charName });
            window.l2Alert("Você fugiu e perdeu por W.O.", "ARENA");
            this.finalizar(false);
        }
        this.sairPosPartida();
    },

    cancelarLobby() {
        if (window.SupabaseAPI?.nodeSocket?.connected) {
            window.SupabaseAPI.nodeSocket.emit('oly_leave_lobby', { nome: window.charName });
        }
        this.reset();
        sairOlympiad(true);
    },

    sairPosPartida() {
        this.reset();
        sairOlympiad(true);
    },

    revanche() {
        this.iniciarLobby();
    },

    pararLoopInimigo() { if (this.loopInimigo) clearInterval(this.loopInimigo); this.loopInimigo = null; },
    initRanking() { /* ranking local mantido */ },
    setupPaperdolls() { /* visual mantido */ },
    mitigateDamageForRealtimeOlyPvP(d) { return Math.floor(d * 0.35); }
};

window.abrirOlympiad = () => window.OlympiadEngine.iniciarLobby();
window.sairOlympiad = (f) => {
    document.getElementById('tela-olympiad-arena').style.display = 'none';
    if (typeof irPara === 'function') irPara('world');
};
