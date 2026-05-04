import Phaser from 'phaser';
import { GameState, ShopItem, Relic } from '../types';
import { getShopRelics } from '../relics';
import { addRelic, resetStageState } from '../store';

export default class ShopScene extends Phaser.Scene {
    private state!: GameState;
    private shopItems: ShopItem[] = [];
    private uiContainer!: HTMLElement;
    private shopElement!: HTMLElement;

    constructor() {
        super('ShopScene');
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        const relics = getShopRelics(this.state.stage);
        this.shopItems = relics.map(relic => ({ relic, sold: false }));
    }

    create(): void {
        this.uiContainer = document.getElementById('game-ui')!;
        this.uiContainer.style.display = 'flex';
        this.uiContainer.style.gridTemplateColumns = 'none';

        this.createShopUI();
    }

    private createShopUI(): void {
        this.shopElement = document.createElement('div');
        this.shopElement.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: rgba(10, 10, 18, 0.98);
            padding: 2rem;
            gap: 2rem;
        `;

        // 标题
        const title = document.createElement('h1');
        title.textContent = '商店';
        title.style.cssText = `
            color: #fff;
            font-size: clamp(2rem, 5vw, 3rem);
            margin: 0;
        `;
        this.shopElement.appendChild(title);

        // 金币显示
        const goldDisplay = document.createElement('div');
        goldDisplay.textContent = `当前金币: ${this.state.gold}`;
        goldDisplay.id = 'shop-gold';
        goldDisplay.style.cssText = `
            color: #ffd700;
            font-size: clamp(1.2rem, 3vw, 1.8rem);
            font-weight: bold;
        `;
        this.shopElement.appendChild(goldDisplay);

        // 商品容器
        const itemsContainer = document.createElement('div');
        itemsContainer.style.cssText = `
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;
            justify-content: center;
            max-width: 1200px;
        `;

        // 生成商品卡片
        this.shopItems.forEach((item, index) => {
            const card = this.createShopItemCard(item, index);
            itemsContainer.appendChild(card);
        });

        this.shopElement.appendChild(itemsContainer);

        // 继续按钮
        const continueBtn = document.createElement('button');
        continueBtn.textContent = '继续前进';
        continueBtn.style.cssText = `
            padding: 1rem 2rem;
            font-size: clamp(1.2rem, 3vw, 1.5rem);
            background: #4488ff;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.2s;
        `;
        continueBtn.addEventListener('mouseenter', () => {
            continueBtn.style.background = '#3377ee';
        });
        continueBtn.addEventListener('mouseleave', () => {
            continueBtn.style.background = '#4488ff';
        });
        continueBtn.addEventListener('click', () => {
            this.goToNextStage();
        });
        this.shopElement.appendChild(continueBtn);

        this.uiContainer.appendChild(this.shopElement);
    }

    private createShopItemCard(item: ShopItem, index: number): HTMLElement {
        const card = document.createElement('div');
        const rarityColors: Record<string, string> = {
            common: '#44ff88',
            rare: '#4488ff',
            epic: '#aa44ff'
        };
        const rarityText: Record<string, string> = {
            common: '普通',
            rare: '稀有',
            epic: '史诗'
        };

        const isPlaceholder = item.relic.id === 'placeholder';

        card.style.cssText = `
            width: 280px;
            background: ${isPlaceholder ? '#1a1a2e' : '#12121f'};
            border: 2px solid ${isPlaceholder ? '#444' : rarityColors[item.relic.rarity]};
            border-radius: 12px;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            opacity: ${item.sold || isPlaceholder ? 0.5 : 1};
        `;

        // 遗物名称
        const name = document.createElement('h3');
        name.textContent = item.relic.name;
        name.style.cssText = `
            color: ${isPlaceholder ? '#666' : rarityColors[item.relic.rarity]};
            font-size: 1.5rem;
            margin: 0;
            text-align: center;
        `;
        card.appendChild(name);

        if (!isPlaceholder) {
            // 稀有度
            const rarity = document.createElement('div');
            rarity.textContent = rarityText[item.relic.rarity];
            rarity.style.cssText = `
                color: ${rarityColors[item.relic.rarity]};
                font-size: 0.9rem;
                text-align: center;
                opacity: 0.8;
            `;
            card.appendChild(rarity);

            // 价格
            const price = document.createElement('div');
            price.textContent = `价格: ${item.relic.price} 金币`;
            price.style.cssText = `
                color: #ffd700;
                font-size: 1.2rem;
                font-weight: bold;
                text-align: center;
            `;
            card.appendChild(price);
        }

        // 描述
        const desc = document.createElement('p');
        desc.textContent = item.relic.description;
        desc.style.cssText = `
            color: ${isPlaceholder ? '#555' : '#aaaacc'};
            font-size: 1rem;
            line-height: 1.5;
            text-align: center;
            margin: 0;
            flex: 1;
        `;
        card.appendChild(desc);

        // 购买按钮
        const buyBtn = document.createElement('button');
        buyBtn.textContent = isPlaceholder ? '暂不可用' : item.sold ? '已售出' : '购买';
        buyBtn.disabled = isPlaceholder || item.sold || this.state.gold < item.relic.price;
        buyBtn.style.cssText = `
            padding: 0.8rem;
            font-size: 1.1rem;
            background: ${isPlaceholder ? '#333' : item.sold ? '#666' : this.state.gold >= item.relic.price ? '#4488ff' : '#666'};
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: ${isPlaceholder || item.sold || this.state.gold < item.relic.price ? 'not-allowed' : 'pointer'};
            font-weight: bold;
            transition: all 0.2s;
        `;

        if (!isPlaceholder && !item.sold) {
            buyBtn.addEventListener('click', () => {
                if (this.state.gold >= item.relic.price) {
                    this.buyItem(index, buyBtn);
                } else {
                    this.showToast('金币不足');
                }
            });
        }

        card.appendChild(buyBtn);

        return card;
    }

    private buyItem(index: number, button: HTMLButtonElement): void {
        const item = this.shopItems[index];
        if (item.sold || this.state.gold < item.relic.price) return;

        // 扣金币
        this.state.gold -= item.relic.price;
        // 添加遗物（下一关生效，所以直接加入即可）
        addRelic(this.state, item.relic);
        // 标记为已售出
        item.sold = true;

        // 更新UI
        button.textContent = '已售出';
        button.disabled = true;
        button.style.background = '#666';
        button.style.cursor = 'not-allowed';
        
        const goldDisplay = document.getElementById('shop-gold');
        if (goldDisplay) {
            goldDisplay.textContent = `当前金币: ${this.state.gold}`;
        }

        this.showToast(`购买成功: ${item.relic.name}`);
    }

    private showToast(message: string): void {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.2rem;
            z-index: 1000;
            animation: fadeInOut 2s ease forwards;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
            document.head.removeChild(style);
        }, 2000);
    }

    private goToNextStage(): void {
        // 清理UI
        this.uiContainer.removeChild(this.shopElement);
        this.uiContainer.style.display = 'grid';
        this.uiContainer.style.gridTemplateColumns = '220px 1fr 220px';

        // 进入下一关
        resetStageState(this.state);
        this.scene.start('GameScene', { state: this.state });
    }
}
