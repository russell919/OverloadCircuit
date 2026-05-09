import Phaser from 'phaser';
import { COLORS } from '../constants';
import { addRelic } from '../store';
import { GameState, Relic, Rarity } from '../types';
import { getAllRelics, getRelicDescription, RELIC_RARITY_COLORS, RELIC_RARITY_TEXT } from '../relics';
import { pvpClient } from '../pvpClient';

type StarterShopFilter = 'all' | Rarity;

export class PvpStarterShopScene extends Phaser.Scene {
    private state!: GameState;
    private relics: Relic[] = [];
    private boughtIds = new Set<string>();
    private filter: StarterShopFilter = 'all';
    private readonly rarityOrder: Rarity[] = ['legendary', 'epic', 'rare', 'common'];
    private disconnectCleanup?: () => void;
    private pendingScrollTop: number | null = null;

    constructor() {
        super({ key: 'PvpStarterShopScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        this.relics = getAllRelics();
        this.boughtIds = new Set<string>();
        this.filter = 'all';
        this.pendingScrollTop = null;
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        this.disconnectCleanup = pvpClient.on('match:opponentLeft', () => {
            alert('联机对方已退出，对局结束。');
            this.scene.start('MenuScene');
        });
        this.events.once('shutdown', () => {
            this.disconnectCleanup?.();
            this.disconnectCleanup = undefined;
        });
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
                        <div class="pvp-shop-subtitle">对手：${this.state.pvpMatch?.opponentName || '未知'}，购买完成后即可进入第一关。每个遗物最多购买一次，金币可保留至对局中使用。</div>
                    </div>
                    <div class="pvp-shop-gold" id="pvp-starter-gold">金币 ${this.state.gold}</div>
                </div>
                <div class="pvp-rarity-tabs">
                    ${this.renderFilterButton('all', '全品质')}
                    ${this.rarityOrder.map(rarity => this.renderFilterButton(rarity, RELIC_RARITY_TEXT[rarity])).join('')}
                </div>
                <div class="pvp-starter-scroll">
                    ${this.renderRelicSections()}
                </div>
                <div class="pvp-shop-footer">
                    <button class="btn primary" id="btn-pvp-start-stage">完成购买，进入对战</button>
                </div>
            </div>
        `;

        if (this.pendingScrollTop !== null) {
            const scrollTop = this.pendingScrollTop;
            this.pendingScrollTop = null;
            requestAnimationFrame(() => {
                const shopContainer = document.querySelector('.pvp-starter-scroll') as HTMLElement | null;
                if (shopContainer) shopContainer.scrollTop = scrollTop;
            });
        }

        this.relics.forEach((relic, index) => {
            const btn = document.querySelector(`[data-starter-buy="${index}"]`) as HTMLButtonElement | null;
            btn?.addEventListener('click', () => this.buyRelic(relic));
        });

        document.querySelectorAll('[data-rarity-filter]').forEach(button => {
            button.addEventListener('click', () => {
                this.filter = (button as HTMLElement).dataset.rarityFilter as StarterShopFilter;
                this.render();
            });
        });

        document.getElementById('btn-pvp-start-stage')!.addEventListener('click', () => {
            const gameUi = document.getElementById('game-ui')!;
            gameUi.style.display = 'grid';
            gameUi.style.gridTemplateColumns = '220px 1fr 220px';
            this.scene.start('GameScene', { state: this.state });
        });
    }

    private renderFilterButton(filter: StarterShopFilter, label: string): string {
        const active = this.filter === filter;
        const color = filter === 'all' ? '#ffdd44' : RELIC_RARITY_COLORS[filter];
        return `
            <button class="pvp-rarity-tab ${active ? 'active' : ''}" data-rarity-filter="${filter}" style="border-color: ${color}; color: ${active ? '#0a0a12' : color}; ${active ? `background: ${color};` : ''}">
                ${label}
            </button>
        `;
    }

    private renderRelicSections(): string {
        if (this.filter !== 'all') {
            const relics = this.getRelicsByRarity(this.filter);
            return `<div class="pvp-starter-grid">${relics.map(relic => this.renderRelicCard(relic, this.relics.indexOf(relic))).join('')}</div>`;
        }

        return this.rarityOrder.map(rarity => {
            const relics = this.getRelicsByRarity(rarity);
            return `
                <section class="pvp-rarity-section">
                    <div class="pvp-rarity-divider" style="border-color: ${RELIC_RARITY_COLORS[rarity]};">
                        <span style="color: ${RELIC_RARITY_COLORS[rarity]};">${RELIC_RARITY_TEXT[rarity]}</span>
                        <small>${this.getRarityIntro(rarity)}</small>
                    </div>
                    <div class="pvp-starter-grid">${relics.map(relic => this.renderRelicCard(relic, this.relics.indexOf(relic))).join('')}</div>
                </section>
            `;
        }).join('');
    }

    private getRelicsByRarity(rarity: Rarity): Relic[] {
        return this.relics.filter(relic => relic.rarity === rarity);
    }

    private getRarityIntro(rarity: Rarity): string {
        const intro: Record<Rarity, string> = {
            legendary: '高价核心构筑遗物，效果最强但会占用大量初始金币。',
            epic: '偏向成型路线和强力条件收益，适合明确打法后选择。',
            rare: '稳定改变得分结构，价格适中。',
            common: '低价基础组件，适合补强手感或保留金币。'
        };
        return intro[rarity];
    }

    private renderRelicCard(relic: Relic, index: number): string {
        const rarityColor = RELIC_RARITY_COLORS[relic.rarity];
        const bought = this.boughtIds.has(relic.id);
        const needsFuse = relic.id === 'reinforced_fuse' && !this.state.relics.some(item => item.id === 'fuse');
        const needsOldFan = relic.id === 'turbo_fan' && !this.state.relics.some(item => item.id === 'old_fan');
        const needsTurboFan = relic.id === 'quantum_fan' && !this.state.relics.some(item => item.id === 'turbo_fan');
        const bannedInStarterShop = relic.id === 'turbo_fan' || relic.id === 'quantum_fan';
        const disabled = bought || bannedInStarterShop || needsFuse || needsOldFan || needsTurboFan || this.state.gold < relic.price;
        const buttonText = bought
            ? '已购买'
            : bannedInStarterShop
                ? '开局禁售'
                : needsFuse
                ? '需先购买保险丝'
                : needsOldFan
                    ? '需先购买旧式风扇'
                    : needsTurboFan
                        ? '需先购买涡轮风扇'
                        : this.state.gold < relic.price ? '金币不足' : '购买';

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
        if (relic.id === 'turbo_fan' || relic.id === 'quantum_fan') return;
        if (relic.id === 'reinforced_fuse' && !this.state.relics.some(item => item.id === 'fuse')) return;
        if (relic.id === 'turbo_fan' && !this.state.relics.some(item => item.id === 'old_fan')) return;
        if (relic.id === 'quantum_fan' && !this.state.relics.some(item => item.id === 'turbo_fan')) return;
        if (this.state.gold < relic.price) return;

        const shopContainer = document.querySelector('.pvp-starter-scroll') as HTMLElement | null;
        this.pendingScrollTop = shopContainer?.scrollTop ?? 0;
        this.state.gold -= relic.price;
        addRelic(this.state, relic);
        this.boughtIds.add(relic.id);
        this.render();
    }
}
