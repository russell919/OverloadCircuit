import Phaser from 'phaser';
import { COLORS } from '../constants';
import { pvpClient } from '../pvpClient';
import { GameState, PvpStageResult } from '../types';

export class PvpWaitingScene extends Phaser.Scene {
    private state!: GameState;
    private cleanups: Array<() => void> = [];

    constructor() {
        super({ key: 'PvpWaitingScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const match = this.state.pvpMatch!;
        const roundScores = match.stageRoundScores;
        const total = roundScores.reduce((sum, score) => sum + score, 0);
        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="pvp-wait-container">
                <div class="pvp-wait-title">等待对手完成三回合</div>
                <div class="pvp-wait-subtitle">你的本轮成绩已封存。双方完成后会同时公开回合分与总分。</div>
                <div class="pvp-sealed-score">
                    <div>本轮总分</div>
                    <strong>${total.toLocaleString()}</strong>
                </div>
                <div class="pvp-round-pill-row">
                    ${roundScores.map((score, index) => `<span>第 ${index + 1} 回合：${score.toLocaleString()}</span>`).join('')}
                </div>
                <div class="pvp-status" id="pvp-wait-status">正在提交成绩...</div>
                <button class="btn secondary" id="btn-pvp-wait-exit">退出联机</button>
            </div>
        `;

        this.cleanups.push(
            pvpClient.on('pvp:waiting', () => this.setStatus('本轮成绩已提交，等待对手...')),
            pvpClient.on('pvp:stageResult', result => this.showResult(result)),
            pvpClient.on('pvp:error', payload => this.setStatus(payload.message)),
            pvpClient.on('match:opponentLeft', () => {
                alert('联机对方已退出，对局结束。');
                this.scene.start('MenuScene');
            })
        );
        this.events.once('shutdown', () => {
            this.cleanups.forEach(cleanup => cleanup());
            this.cleanups = [];
        });

        pvpClient.submitStage(match.matchId, this.state.stage, roundScores, total);

        document.getElementById('btn-pvp-wait-exit')!.addEventListener('click', () => {
            pvpClient.leaveMatch();
            this.scene.start('MenuScene');
        });
    }

    private showResult(result: PvpStageResult): void {
        this.state.pvpMatch!.lastStageResult = result;
        this.state.pvpMatch!.matchScore = result.matchScore;
        this.scene.start('PvpStageResultScene', { state: this.state, result });
    }

    private setStatus(message: string): void {
        const status = document.getElementById('pvp-wait-status');
        if (status) status.textContent = message;
    }
}
