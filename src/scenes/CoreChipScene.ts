import Phaser from 'phaser';
import { COLORS } from '../constants';
import { GameState, CoreChip } from '../types';
import { getAllCoreChips } from '../coreChips';

export class CoreChipScene extends Phaser.Scene {
    private state!: GameState;
    private coreChips: CoreChip[] = [];

    constructor() {
        super({ key: 'CoreChipScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        this.coreChips = getAllCoreChips();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        
        const coreChipColors: Record<string, string> = {
            buffer: '#44ff88',
            amplify: '#ff4444',
            storage: '#4488ff',
            fission: '#ffaa22'
        };

        container.innerHTML = `
            <div class="core-chip-container">
                <div class="core-chip-title">选择开局核心芯片</div>
                <div class="core-chip-subtitle">该选择将影响整局游戏，请谨慎选择</div>
                <div class="core-chip-cards">
                    ${this.coreChips.map((chip, i) => `
                        <div class="core-chip-card" data-index="${i}" style="border-color: ${coreChipColors[chip.id]};">
                            <div class="core-chip-name" style="color: ${coreChipColors[chip.id]};">${chip.name}</div>
                            <div class="core-chip-desc">${chip.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .core-chip-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 25px;
                background: linear-gradient(135deg, #0a0a12, #12121f);
                padding: 30px;
            }
            .core-chip-title {
                font-size: 32px;
                font-weight: bold;
                color: #ffdd44;
                text-shadow: 0 0 20px rgba(255, 221, 68, 0.4);
            }
            .core-chip-subtitle {
                font-size: 16px;
                color: #8888aa;
                margin-top: -15px;
            }
            .core-chip-cards {
                display: flex;
                gap: 25px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .core-chip-card {
                width: 200px;
                padding: 25px 20px;
                background: rgba(18, 18, 31, 0.95);
                border: 3px solid;
                border-radius: 16px;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                text-align: center;
            }
            .core-chip-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 10px 30px rgba(255, 221, 68, 0.3);
            }
            .core-chip-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .core-chip-desc {
                font-size: 14px;
                color: #aaaacc;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(style);

        const cards = container.querySelectorAll('.core-chip-card');
        cards.forEach((card, i) => {
            card.addEventListener('click', () => {
                this.selectCoreChip(this.coreChips[i]);
            });
        });

        this.events.on('shutdown', () => {
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        });
    }

    private selectCoreChip(chip: CoreChip): void {
        this.state.coreChip = chip;
        
        // 初始化稳压器剩余抵消次数
        this.state.stabilizerRemaining = this.state.relics.filter(r => r.id === 'stabilizer').length;
        
        // 立即应用核心芯片效果
        if (chip.id === 'buffer') {
            this.state.maxHeat = 12;
        } else if (chip.id === 'amplify') {
            this.state.mult = 2;
        } else if (chip.id === 'storage') {
            this.state.chips = 40;
        } else if (chip.id === 'fission') {
            this.state.xmult = 2;
        }
        
        const container = document.getElementById('game-ui')!;
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '220px 1fr 220px';
        
        this.scene.start('GameScene', { state: this.state });
    }
}