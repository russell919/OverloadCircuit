import Phaser from 'phaser';
import { COLORS } from '../constants';
import { addRelic } from '../store';
import { GameState, Relic } from '../types';
import { getAllRelics, getRelicDescription, RELIC_RARITY_COLORS, RELIC_RARITY_TEXT } from '../relics';

export class PvpStarterShopScene extends Phaser.Scene {
    private state!: GameState;
    private relics: Relic[] = [];
    private boughtIds = new Set<string>();

    constructor() {
        super({ key: 'PvpStarterShopScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        this.relics = getAllRelics();
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        this.render();
    }

    private render(): void {
        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        container.innerHTML = `
            <div class="pvp-shop-container">
                <div class="pvp-shop-header">
                    <div>
                        <div class="pvp-shop-title">开局全遗物商店</div>
                        <div class="pvp-shop-subtitle">对手：${this.state.pvpMatch?.opponentName || '未知'}，购买完成后即可进入第一关。</div>
                    </div>
                    <div class="pvp-shop-gold" id="pvp-starter-gold">金币 ${this.state.gold}</div>
                </div>
                <div class="pvp-starter-grid">
                    ${this.relics.map((relic, index) => this.renderRelicCard(relic, index)).join('')}
                </div>
                <div class="pvp-shop-footer">
                    <button class="btn primary" id="btn-pvp-start-stage">完成购买，进入对战</button>
                </div>
            </div>
        `;

        this.relics.forEach((relic, index) => {
            const btn = document.querySelector(`[data-starter-buy="${index}"]`) as HTMLButtonElement | null;
            btn?.addEventListener('click', () => this.buyRelic(relic));
        });

        document.getElementById('btn-pvp-start-stage')!.addEventListener('click', () => {
            const gameUi = document.getElementById('game-ui')!;
            gameUi.style.display = 'grid';
            gameUi.style.gridTemplateColumns = '220px 1fr 220px';
            this.scene.start('GameScene', { state: this.state });
        });
    }

    private renderRelicCard(relic: Relic, index: number): string {
        const rarityColor = RELIC_RARITY_COLORS[relic.rarity];
        const bought = this.boughtIds.has(relic.id);
        const needsFuse = relic.id === 'reinforced_fuse' && !this.state.relics.some(item => item.id === 'fuse');
        const disabled = bought || needsFuse || this.state.gold < relic.price;
        const buttonText = bought ? '已购买' : needsFuse ? '需先购买保险丝' : this.state.gold < relic.price ? '金币不足' : '购买';

        return `
            <div class="relic-select-card pvp-starter-card" style="border-color: ${rarityColor}; opacity: ${bought ? 0.55 : 1};">
                <div class="relic-card-name" style="color: ${rarityColor};">${relic.name}</div>
                <div class="pvp-relic-meta" style="color: ${rarityColor};">${RELIC_RARITY_TEXT[relic.rarity]} · ${relic.price} 金币</div>
                <div class="relic-card-desc">${getRelicDescription(relic, this.state.maxHeat)}</div>
                <button class="btn ${disabled ? 'secondary' : 'primary'} pvp-starter-buy" data-starter-buy="${index}" ${disabled ? 'disabled' : ''}>${buttonText}</button>
            </div>
        `;
    }

    private buyRelic(relic: Relic): void {
        if (this.boughtIds.has(relic.id)) return;
        if (relic.id === 'reinforced_fuse' && !this.state.relics.some(item => item.id === 'fuse')) return;
        if (this.state.gold < relic.price) return;

        this.state.gold -= relic.price;
        addRelic(this.state, relic);
        this.boughtIds.add(relic.id);
        this.render();
    }
}
