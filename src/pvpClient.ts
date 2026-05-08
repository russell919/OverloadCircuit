import { PvpPlayerInfo, PvpStageResult } from './types';

export interface LobbyRoom {
    roomId: string;
    hostId: string;
    hostName: string;
    createdAt: number;
}

export interface MatchStartPayload {
    matchId: string;
    selfId: string;
    players: PvpPlayerInfo[];
    matchScore: Record<string, number>;
}

type PvpEventMap = {
    'server:welcome': { playerId: string };
    'lobby:update': { selfId: string; rooms: LobbyRoom[] };
    'match:start': MatchStartPayload;
    'pvp:waiting': { stage: number; submitted: boolean };
    'pvp:stageResult': PvpStageResult;
    'pvp:error': { message: string };
};

type PvpEventName = keyof PvpEventMap;
type Listener<T extends PvpEventName> = (payload: PvpEventMap[T]) => void;

class PvpClient {
    private socket: WebSocket | null = null;
    private listeners = new Map<PvpEventName, Set<(payload: any) => void>>();
    private connectPromise: Promise<void> | null = null;
    playerId = '';

    connect(): Promise<void> {
        if (this.socket?.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.connectPromise) {
            return this.connectPromise;
        }

        this.connectPromise = new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const socket = new WebSocket(`${protocol}//${window.location.host}/pvp`);
            this.socket = socket;

            socket.addEventListener('open', () => {
                resolve();
            });
            socket.addEventListener('error', () => {
                reject(new Error('无法连接联机服务'));
            });
            socket.addEventListener('close', () => {
                this.connectPromise = null;
                this.socket = null;
            });
            socket.addEventListener('message', event => {
                let message: { type: PvpEventName; payload: any };
                try {
                    message = JSON.parse(event.data);
                } catch {
                    return;
                }
                if (message.type === 'server:welcome') {
                    this.playerId = message.payload.playerId;
                }
                this.emit(message.type, message.payload);
            });
        });

        return this.connectPromise;
    }

    on<T extends PvpEventName>(event: T, listener: Listener<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener as (payload: any) => void);
        return () => this.off(event, listener);
    }

    off<T extends PvpEventName>(event: T, listener: Listener<T>): void {
        this.listeners.get(event)?.delete(listener as (payload: any) => void);
    }

    send(type: string, payload: Record<string, unknown> = {}): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        }
    }

    enterLobby(name: string): void {
        this.send('lobby:enter', { name });
    }

    refreshLobby(): void {
        this.send('lobby:refresh');
    }

    joinRoom(roomId: string): void {
        this.send('lobby:join', { roomId });
    }

    submitStage(matchId: string, stage: number, roundScores: number[], totalScore: number): void {
        this.send('pvp:submitStage', {
            matchId,
            stage,
            roundScores,
            totalScore
        });
    }

    private emit<T extends PvpEventName>(event: T, payload: PvpEventMap[T]): void {
        this.listeners.get(event)?.forEach(listener => listener(payload));
    }
}

export const pvpClient = new PvpClient();
