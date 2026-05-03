const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    allowEIO3: true
});

// --- BANCO DE DADOS EM MEMÓRIA (MMO STYLE) ---
const players = new Map(); // socket.id -> { nome, state, matchId }
const matches = new Map(); // matchId -> { p1, p2, ready: Set }

io.on('connection', (socket) => {
    console.log(`⚡ Conectado: ${socket.id}`);

    socket.on('oly_join_lobby', (data) => {
        players.set(socket.id, { 
            nome: data.nome.toLowerCase(), 
            state: 'LOBBY', 
            matchId: null 
        });
        socket.join('olympiad_global');
        console.log(`⚔️ ${data.nome} entrou no lobby.`);
    });

    socket.on('oly_send_challenge', (data) => {
        const p = players.get(socket.id);
        if (p) p.state = 'CHALLENGING';
        socket.broadcast.to('olympiad_global').emit('oly_challenge_received', data);
    });

    socket.on('oly_challenge_response', (data) => {
        // Cria um contrato de partida único para os dois
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const p1Name = data.oponenteAlvo.toLowerCase();
        const p2Name = data.nome.toLowerCase();

        const match = {
            id: matchId,
            players: [p1Name, p2Name],
            ready: new Set()
        };

        matches.set(matchId, match);
        
        // Avisa aos dois sobre o novo contrato
        io.to('olympiad_global').emit('oly_match_created', {
            matchId: matchId,
            p1: p1Name,
            p2: p2Name,
            details: data
        });
    });

    socket.on('oly_confirm_ready', (data) => {
        const match = matches.get(data.matchId);
        if (match) {
            match.ready.add(data.nome.toLowerCase());
            console.log(`✅ ${data.nome} pronto para ${data.matchId} (${match.ready.size}/2)`);

            // Sincroniza o "botão verde" para os dois
            io.emit('oly_player_ready_sync', {
                nome: data.nome,
                matchId: data.matchId,
                readyCount: match.ready.size
            });

            if (match.ready.size >= 2) {
                console.log("🚀 LUTA INICIADA!");
                io.emit('oly_start_duel_now', { matchId: data.matchId });
                matches.delete(data.matchId); // Limpa o contrato
            }
        }
    });

    socket.on('oly_leave_lobby', (data) => {
        const p = players.get(socket.id);
        if (p) {
            // Se ele estava em um contrato, avisa o outro
            io.emit('oly_lobby_left', { nome: data.nome });
            players.delete(socket.id);
        }
        socket.leave('olympiad_global');
    });

    socket.on('oly_combat_event', (payload) => {
        socket.broadcast.emit('oly_combat_update', payload);
    });

    socket.on('disconnect', () => {
        const p = players.get(socket.id);
        if (p) {
            io.emit('oly_lobby_left', { nome: p.nome });
            players.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`ARENA SERVER ONLINE - PORT ${PORT}`);
});
