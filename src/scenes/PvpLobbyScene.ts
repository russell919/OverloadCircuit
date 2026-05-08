import Phaser from 'phaser';
import { COLORS } from '../constants';
import { createPvpInitialState } from '../store';
import { PvpMatchState, PvpPlayerInfo } from '../types';
import { LobbyRoom, MatchStartPayload, pvpClient } from '../pvpClient';
import { getPlayerLabel } from '../playerProfile';

export class PvpLobbyScene extends Phaser.Scene {
    private rooms: LobbyRoom[] = [];
    private selfId = '';
    private playerName = '';
    private cleanups: Array<() => void> = [];

    constructor() {
        super({ key: 'PvpLobbyScene' });
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        this.playerName = this.getDefaultName();

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = this.renderLobby('正在连接联机服务...');

        this.bindStaticEvents();
        this.connectLobby();
    }

    private getDefaultName(): string {
        const playerLabel = getPlayerLabel();
        if (playerLabel !== '未登记') return playerLabel;
        const stored = localStorage.getItem('overload_circuit_pvp_name');
        if (stored) return stored;
        const generated = `玩家${Math.floor(1000 + Math.random() * 9000)}`;
        localStorage.setItem('overload_circuit_pvp_name', generated);
        return generated;
    }

    private renderLobby(status: string): string {
        return `
            <div class="pvp-lobby-container">
                <div class="pvp-lobby-title">联机模式</div>
                <div class="pvp-lobby-subtitle">同一局域网玩家访问本机地址后，可在这里互相发现并加入对局。</div>
                <div class="pvp-name-row">
                    <input id="pvp-player-name" class="pvp-name-input" value="${this.playerName}" maxlength="18" />
                    <button class="btn secondary" id="btn-pvp-rename">更新名称</button>
                </div>
                <div class="pvp-status" id="pvp-status">${status}</div>
                <div class="pvp-lobby-panel">
                    <div class="pvp-panel-title">可加入主机</div>
                    <div id="pvp-room-list" class="pvp-room-list">
                        <div class="pvp-empty">正在搜索...</div>
                    </div>
                </div>
                <div class="pvp-lobby-actions">
                    <button class="btn primary" id="btn-pvp-refresh">刷新搜索</button>
                    <button class="btn secondary" id="btn-pvp-back">返回主菜单</button>
                </div>
            </div>
        `;
    }

    private bindStaticEvents(): void {
        document.getElementById('btn-pvp-back')!.addEventListener('click', () => {
            this.scene.start('MenuScene');
        });
        document.getElementById('btn-pvp-refresh')!.addEventListener('click', () => {
            pvpClient.refreshLobby();
        });
        document.getElementById('btn-pvp-rename')!.addEventListener('click', () => {
            const input = document.getElementById('pvp-player-name') as HTMLInputElement;
            this.playerName = input.value.trim() || this.getDefaultName();
            localStorage.setItem('overload_circuit_pvp_name', this.playerName);
            pvpClient.enterLobby(this.playerName);
        });
    }

    private async connectLobby(): Promise<void> {
        this.cleanups.push(
            pvpClient.on('lobby:update', payload => {
                this.selfId = payload.selfId;
                this.rooms = payload.rooms;
                this.renderRoomList();
            }),
            pvpClient.on('match:start', payload => this.startMatch(payload)),
            pvpClient.on('pvp:error', payload => this.setStatus(payload.message))
        );

        this.events.once('shutdown', () => {
            this.cleanups.forEach(cleanup => cleanup());
            this.cleanups = [];
        });

        try {
            await pvpClient.connect();
            this.setStatus('正在广播本机并搜索其他主机...');
            pvpClient.enterLobby(this.playerName);
        } catch {
            this.setStatus('连接失败：请确认使用 npm run dev 启动，并通过该服务地址打开页面。');
        }
    }

    private renderRoomList(): void {
        const list = document.getElementById('pvp-room-list');
        if (!list) return;

        const joinableRooms = this.rooms.filter(room => room.hostId !== this.selfId);
        const ownRoom = this.rooms.find(room => room.hostId === this.selfId);

        if (joinableRooms.length === 0) {
            list.innerHTML = `
                <div class="pvp-empty">
                    暂未发现其他主机。你的主机${ownRoom ? `「${ownRoom.hostName}」` : ''}正在等待加入。
                </div>
            `;
            return;
        }

        list.innerHTML = joinableRooms.map(room => `
            <button class="pvp-room-card" data-room-id="${room.roomId}">
                <span class="pvp-room-name">${room.hostName}</span>
                <span class="pvp-room-meta">等待联机</span>
            </button>
        `).join('');

        list.querySelectorAll('.pvp-room-card').forEach(card => {
            card.addEventListener('click', () => {
                const roomId = (card as HTMLElement).dataset.roomId!;
                this.setStatus('正在加入对局...');
                pvpClient.joinRoom(roomId);
            });
        });
    }

    private startMatch(payload: MatchStartPayload): void {
        const self = payload.players.find(player => player.playerId === payload.selfId) as PvpPlayerInfo;
        const opponent = payload.players.find(player => player.playerId !== payload.selfId) as PvpPlayerInfo;
        const match: PvpMatchState = {
            matchId: payload.matchId,
            playerId: self.playerId,
            playerName: self.playerName,
            opponentId: opponent.playerId,
            opponentName: opponent.playerName,
            matchScore: payload.matchScore,
            stageRoundScores: [],
            rewardedStages: []
        };
        const state = createPvpInitialState(match);
        this.scene.start('PvpStarterShopScene', { state });
    }

    private setStatus(message: string): void {
        const status = document.getElementById('pvp-status');
        if (status) status.textContent = message;
    }
}
