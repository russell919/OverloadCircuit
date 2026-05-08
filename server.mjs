import http from 'node:http';
import os from 'node:os';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || '0.0.0.0';

const vite = await createViteServer({
    server: { middlewareMode: true, host: HOST },
    appType: 'spa'
});

const httpServer = http.createServer((req, res) => {
    vite.middlewares(req, res, () => {
        res.statusCode = 404;
        res.end('Not found');
    });
});

const wss = new WebSocketServer({ server: httpServer, path: '/pvp' });
const clients = new Map();
const rooms = new Map();
const matches = new Map();

function handleServerError(error) {
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用。请关闭正在运行的开发服务，或用其他端口启动：`);
        console.error(`PowerShell: $env:PORT=5174; npm run dev`);
        console.error(`CMD: set PORT=5174 && npm run dev`);
    } else {
        console.error('开发服务启动失败:', error);
    }
    vite.close().finally(() => process.exit(1));
}

httpServer.on('error', handleServerError);
wss.on('error', handleServerError);

function makeId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function send(ws, type, payload = {}) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type, payload }));
    }
}

function broadcastLobby() {
    const openRooms = [...rooms.values()]
        .filter(room => room.status === 'open')
        .map(room => ({
            roomId: room.id,
            hostId: room.hostId,
            hostName: room.hostName,
            createdAt: room.createdAt
        }));

    for (const client of clients.values()) {
        send(client.ws, 'lobby:update', {
            selfId: client.id,
            rooms: openRooms
        });
    }
}

function removeClientOpenRoom(clientId) {
    for (const [roomId, room] of rooms) {
        if (room.hostId === clientId && room.status === 'open') {
            rooms.delete(roomId);
        }
    }
}

function ensureOpenRoom(client) {
    const existing = [...rooms.values()].find(room => room.hostId === client.id && room.status === 'open');
    if (existing) return existing;

    const room = {
        id: makeId('room'),
        hostId: client.id,
        hostName: client.name,
        createdAt: Date.now(),
        status: 'open'
    };
    rooms.set(room.id, room);
    return room;
}

function startMatch(hostId, guestId) {
    const host = clients.get(hostId);
    const guest = clients.get(guestId);
    if (!host || !guest) return;

    removeClientOpenRoom(hostId);
    removeClientOpenRoom(guestId);

    const matchId = makeId('match');
    const players = [
        { playerId: host.id, playerName: host.name },
        { playerId: guest.id, playerName: guest.name }
    ];
    const match = {
        id: matchId,
        players,
        matchScore: { [host.id]: 0, [guest.id]: 0 },
        submissions: new Map(),
        status: 'playing'
    };
    matches.set(matchId, match);

    for (const player of players) {
        const client = clients.get(player.playerId);
        client.matchId = matchId;
        client.status = 'matched';
        send(client.ws, 'match:start', {
            matchId,
            selfId: player.playerId,
            players,
            matchScore: match.matchScore
        });
    }

    broadcastLobby();
}

function submitStage(client, payload) {
    const match = matches.get(payload.matchId);
    if (!match || !match.players.some(player => player.playerId === client.id)) {
        send(client.ws, 'pvp:error', { message: '未找到有效对局。' });
        return;
    }

    const stage = Number(payload.stage || 1);
    const stageKey = String(stage);
    if (!match.submissions.has(stageKey)) {
        match.submissions.set(stageKey, new Map());
    }

    const stageSubmissions = match.submissions.get(stageKey);
    stageSubmissions.set(client.id, {
        playerId: client.id,
        playerName: client.name,
        roundScores: Array.isArray(payload.roundScores) ? payload.roundScores.map(score => Number(score) || 0) : [],
        totalScore: Number(payload.totalScore) || 0
    });

    send(client.ws, 'pvp:waiting', { stage, submitted: true });

    if (stageSubmissions.size < match.players.length) return;

    const results = match.players.map(player => stageSubmissions.get(player.playerId));
    const highScore = Math.max(...results.map(result => result.totalScore));
    const winners = results.filter(result => result.totalScore === highScore).map(result => result.playerId);

    if (winners.length === match.players.length) {
        for (const winnerId of winners) {
            match.matchScore[winnerId] += 1;
        }
    } else {
        match.matchScore[winners[0]] += 1;
    }

    const scoreValues = Object.values(match.matchScore);
    const scoreDiff = Math.abs(scoreValues[0] - scoreValues[1]);
    const gameOver = scoreDiff >= 3;
    const matchWinnerId = gameOver
        ? Object.entries(match.matchScore).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const resultPayload = {
        stage,
        players: results,
        winnerPlayerIds: winners,
        matchScore: match.matchScore,
        gameOver,
        matchWinnerId
    };

    for (const player of match.players) {
        const target = clients.get(player.playerId);
        if (target) {
            send(target.ws, 'pvp:stageResult', resultPayload);
        }
    }
}

wss.on('connection', ws => {
    const client = {
        id: makeId('player'),
        name: '匿名玩家',
        ws,
        status: 'connected',
        matchId: null
    };
    clients.set(client.id, client);
    send(ws, 'server:welcome', { playerId: client.id });

    ws.on('message', raw => {
        let message;
        try {
            message = JSON.parse(raw.toString());
        } catch {
            send(ws, 'pvp:error', { message: '消息格式错误。' });
            return;
        }

        const { type, payload = {} } = message;
        if (type === 'lobby:enter') {
            client.name = String(payload.name || '匿名玩家').slice(0, 18);
            client.status = 'lobby';
            ensureOpenRoom(client);
            broadcastLobby();
            return;
        }

        if (type === 'lobby:refresh') {
            broadcastLobby();
            return;
        }

        if (type === 'lobby:join') {
            const room = rooms.get(payload.roomId);
            if (!room || room.status !== 'open') {
                send(ws, 'pvp:error', { message: '该主机已不可加入。' });
                broadcastLobby();
                return;
            }
            if (room.hostId === client.id) {
                send(ws, 'pvp:error', { message: '不能加入自己的主机。' });
                return;
            }
            startMatch(room.hostId, client.id);
            return;
        }

        if (type === 'pvp:submitStage') {
            submitStage(client, payload);
        }
    });

    ws.on('close', () => {
        removeClientOpenRoom(client.id);
        clients.delete(client.id);
        broadcastLobby();
    });
});

httpServer.listen(PORT, HOST, () => {
    const addresses = [];
    for (const net of Object.values(os.networkInterfaces())) {
        for (const info of net || []) {
            if (info.family === 'IPv4' && !info.internal) {
                addresses.push(`http://${info.address}:${PORT}`);
            }
        }
    }

    console.log(`Overload Circuit dev server: http://localhost:${PORT}`);
    if (addresses.length > 0) {
        console.log(`LAN: ${addresses.join('  ')}`);
    }
});
