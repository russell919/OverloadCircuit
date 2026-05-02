import Phaser from 'phaser';
import { COLORS } from '../constants';
import { GameState } from '../types';
import { createInitialState } from '../store';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="menu-container">
                <div class="menu-title">过载回路</div>
                <div class="menu-subtitle">Overload Circuit</div>
                <div class="menu-history">
                    <div class="history-item">最高到达层数: <span class="history-value">${this.getHistory().highestStage || 0}</span></div>
                    <div class="history-item">最高单回合分: <span class="history-value">${this.getHistory().highestRoundScore.toLocaleString() || 0}</span></div>
                    <div class="history-item">历史最高总分: <span class="history-value">${this.getHistory().highestTotalScore.toLocaleString() || 0}</span></div>
                </div>
                <div class="menu-buttons">
                    <button class="btn primary" id="btn-start">开始游戏</button>
                </div>
            </div>
        `;

        const startBtn = document.getElementById('btn-start')!;
        startBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            const state = createInitialState();
            this.scene.start('CoreChipScene', { state });
        });
    }

    private getHistory() {
        try {
            const raw = localStorage.getItem('overload_circuit_history');
            if (raw) {
                return JSON.parse(raw);
            }
        } catch {
        }
        return { highestStage: 0, highestRoundScore: 0, highestTotalScore: 0 };
    }
}