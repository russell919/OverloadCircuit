import Phaser from 'phaser';
import { COLORS } from '../constants';

interface LeaderboardEntry {
    displayName: string;
    playerCode: string;
    score: number;
    completedAt: string | null;
}

interface LeaderboardData {
    highestRoundScore: LeaderboardEntry[];
    highestStageScore: LeaderboardEntry[];
}

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LeaderboardScene' });
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="leaderboard-container">
                <div class="leaderboard-title">排行榜</div>
                <div class="leaderboard-subtitle">当前服务器启动期间记录的 PVE 排行榜</div>
                <div class="leaderboard-grid" id="leaderboard-grid">
                    <div class="pvp-status">正在读取排行榜...</div>
                </div>
                <button class="btn secondary" id="btn-leaderboard-back">返回主菜单</button>
            </div>
        `;

        document.getElementById('btn-leaderboard-back')!.addEventListener('click', () => this.scene.start('MenuScene'));
        this.loadLeaderboard();
    }

    private async loadLeaderboard(): Promise<void> {
        const grid = document.getElementById('leaderboard-grid')!;
        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json() as LeaderboardData;
            grid.innerHTML = `
                ${this.renderBoard('最高单回合分榜', data.highestRoundScore)}
                ${this.renderBoard('历史最高总分榜', data.highestStageScore)}
            `;
        } catch {
            grid.innerHTML = '<div class="pvp-status">排行榜读取失败</div>';
        }
    }

    private renderBoard(title: string, entries: LeaderboardEntry[]): string {
        const rows = entries.length > 0
            ? entries.map((entry, index) => `
                <div class="leaderboard-row">
                    <span>${index + 1}</span>
                    <strong>${entry.displayName}#${entry.playerCode}</strong>
                    <span>${entry.score.toLocaleString()}</span>
                    <time>${this.formatTime(entry.completedAt)}</time>
                </div>
            `).join('')
            : '<div class="leaderboard-empty">暂无记录</div>';
        return `
            <section class="leaderboard-board">
                <h2>${title}</h2>
                <div class="leaderboard-head">
                    <span>#</span><span>玩家</span><span>分数</span><span>完成时间</span>
                </div>
                ${rows}
            </section>
        `;
    }

    private formatTime(value: string | null): string {
        if (!value) return '-';
        const date = new Date(value);
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}
