import Phaser from 'phaser';
import { COLORS } from '../constants';
import { GameState } from '../types';
import { createInitialState } from '../store';

export class ResultScene extends Phaser.Scene {
    private state!: GameState;

    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="result-container">
                <div class="result-title">游戏结束</div>
                <div class="result-stats">
                    <div class="result-stat">
                        <div>到达层数</div>
                        <div class="result-stat-value">第 ${this.state.stage} 关</div>
                    </div>
                    <div class="result-stat">
                        <div>历史最高层数</div>
                        <div class="result-stat-value">第 ${this.state.history.highestStage} 关</div>
                    </div>
                    <div class="result-stat">
                        <div>最高单回合分</div>
                        <div class="result-stat-value">${this.state.maxRoundScore.toLocaleString()}</div>
                    </div>
                    <div class="result-stat">
                        <div>本局总分</div>
                        <div class="result-stat-value">${this.state.totalScore.toLocaleString()}</div>
                    </div>
                    <div class="result-stat">
                        <div>本局获得遗物</div>
                        <div class="result-stat-value">${this.state.relics.length} 个</div>
                    </div>
                </div>
                <div class="result-buttons">
                    <button class="btn primary" id="btn-restart">再来一局</button>
                    <button class="btn secondary" id="btn-menu">返回主菜单</button>
                </div>
            </div>
        `;

        const restartBtn = document.getElementById('btn-restart')!;
        restartBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            const state = createInitialState();
            this.scene.start('GameScene', { state });
        });

        const menuBtn = document.getElementById('btn-menu')!;
        menuBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            this.scene.start('MenuScene');
        });
    }
}
