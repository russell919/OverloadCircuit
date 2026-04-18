import Phaser from 'phaser';
import { COLORS } from '../constants';
import { GameState, Relic } from '../types';
import { addRelic } from '../store';
import { getRandomRelics } from '../relics';

export class RelicScene extends Phaser.Scene {
    private state!: GameState;
    private relics: Relic[] = [];

    constructor() {
        super({ key: 'RelicScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        this.relics = getRandomRelics(3);
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="relic-select-container">
                <div class="relic-select-title">🎁 选择遗物</div>
                <div class="relic-cards-container">
                    ${this.relics.map((relic, i) => `
                        <div class="relic-select-card" data-index="${i}">
                            <div class="relic-card-name">${relic.name}</div>
                            <div class="relic-card-desc">${relic.description}</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn secondary" id="btn-skip">跳过 (随机获得)</button>
            </div>
        `;

        this.relics.forEach((relic, i) => {
            const card = document.querySelector(`[data-index="${i}"]`)!;
            card.addEventListener('click', () => {
                container.style.display = 'grid';
                container.style.gridTemplateColumns = '220px 1fr 220px';
                this.selectRelic(relic);
            });
        });

        const skipBtn = document.getElementById('btn-skip')!;
        skipBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            const randomRelic = this.relics[Math.floor(Math.random() * this.relics.length)];
            this.selectRelic(randomRelic);
        });
    }

    private selectRelic(relic: Relic): void {
        addRelic(this.state, relic);
        this.scene.start('GameScene', { state: this.state });
    }
}
