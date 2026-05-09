import Phaser from 'phaser';
import { COLORS, getStageTarget } from '../constants';
import { GameState, Relic, ShopItem } from '../types';
import { addRelic, resetRoundState } from '../store';
import { getRandomRelics, getRelicDescription, getShopRelics, RELIC_RARITY_COLORS, RELIC_RARITY_TEXT } from '../relics';
import { pvpClient } from '../pvpClient';

export class RelicScene extends Phaser.Scene {
    private state!: GameState;
    private relics: Relic[] = [];
    private shopItems: ShopItem[] = [];
    private showShop: boolean = false;
    private remainingRewardChoices = 1;
    private disconnectCleanup?: () => void;

    constructor() {
        super({ key: 'RelicScene' });
    }

    init(data: { state: GameState }): void {
        this.state = data.state;
        this.remainingRewardChoices = 1 + (this.state.goldReward?.overachievement?.extraRelicChoices || 0);
        this.relics = getRandomRelics(3, this.state.relics);
        
        this.showShop = this.state.gameMode === 'pvp' || this.state.stage % 5 === 0;
        if (this.showShop) {
            const shopRelics = getShopRelics(this.state.stage, this.state.relics);
            this.shopItems = shopRelics.map(relic => ({ relic, sold: false }));
        }
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);
        if (this.state.gameMode === 'pvp') {
            this.disconnectCleanup = pvpClient.on('match:opponentLeft', () => {
                alert('联机对方已退出，对局结束。');
                this.scene.start('MenuScene');
            });
            this.events.once('shutdown', () => {
                this.disconnectCleanup?.();
                this.disconnectCleanup = undefined;
            });
        }

        const container = document.getElementById('game-ui')!;
        container.style.display = 'flex';
        container.style.gridTemplateColumns = 'none';
        
        const stageClearInfo = this.generateStageClearInfo();
        
        if (this.showShop) {
            container.innerHTML = `
                <div class="relic-select-container" style="justify-content: center; gap: 30px; padding: 20px; flex-direction: column;">
                    ${stageClearInfo}
                    <div style="text-align: center;">
                        <div class="relic-select-title" style="margin-bottom: 30px;">🎁 ${this.getRewardChoiceTitle()}</div>
                        <div class="relic-cards-container" style="gap: 20px;">
                            ${this.relics.map((relic, i) => this.renderRewardRelicCard(relic, i)).join('')}
                        </div>
                        <div style="margin-top: 30px; text-align: center;">
                            <button class="btn secondary" id="btn-skip">跳过 (随机获得)</button>
                        </div>
                    </div>
                </div>
            `;
            
            this.relics.forEach((relic, i) => {
                const card = document.querySelector(`[data-index="${i}"]`) as HTMLElement;
                card.addEventListener('click', () => {
                    this.selectRelic(relic);
                });
            });
            
            const skipBtn = document.getElementById('btn-skip') as HTMLButtonElement;
            skipBtn.addEventListener('click', () => {
                this.state.gold += 4;
                const randomRelic = this.relics[Math.floor(Math.random() * this.relics.length)];
                this.selectRelic(randomRelic);
            });
        } else {
            container.innerHTML = `
                <div class="relic-select-container" style="justify-content: center; gap: 30px; padding: 20px; flex-direction: column;">
                    ${stageClearInfo}
                    <div style="text-align: center;">
                        <div class="relic-select-title" style="margin-bottom: 30px;">🎁 ${this.getRewardChoiceTitle()}</div>
                        <div class="relic-cards-container" style="gap: 20px;">
                            ${this.relics.map((relic, i) => this.renderRewardRelicCard(relic, i)).join('')}
                        </div>
                        <div style="margin-top: 30px; text-align: center;">
                            <button class="btn secondary" id="btn-skip">跳过 (随机获得)</button>
                        </div>
                    </div>
                </div>
            `;

            this.relics.forEach((relic, i) => {
                const card = document.querySelector(`[data-index="${i}"]`) as HTMLElement;
                card.addEventListener('click', () => {
                    this.selectRelic(relic);
                });
            });

            const skipBtn = document.getElementById('btn-skip') as HTMLButtonElement;
            skipBtn.addEventListener('click', () => {
                this.state.gold += 4;
                const randomRelic = this.relics[Math.floor(Math.random() * this.relics.length)];
                this.selectRelic(randomRelic);
            });
        }
    }

    private generateStageClearInfo(): string {
        if (this.state.gameMode === 'pvp') {
            const match = this.state.pvpMatch;
            const reward = match?.lastGoldReward;
            const result = match?.lastStageResult;
            return `
                <div style="background: rgba(18, 18, 31, 0.95); border: 2px solid #44ff88; border-radius: 12px; padding: 1rem; max-width: 560px; width: 100%; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <div style="color: #44ff88; font-size: 1.3rem; font-weight: bold; margin: 0;">联机关卡结算</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 0.9rem; color: #aaaacc;">
                        <div>
                            <div>本轮：第 ${this.state.stage} 轮</div>
                            <div>你的总分：${this.state.stageScore.toLocaleString()}</div>
                            <div>胜点比分：${match ? (result?.matchScore[match.playerId] || 0) : 0} : ${match ? (result?.matchScore[match.opponentId] || 0) : 0}</div>
                        </div>
                        <div style="text-align: right;">
                            <div>基础奖励：+${reward?.base || 0} 金币</div>
                            ${reward?.loserCompensation ? `<div>败方补偿：+${reward.loserCompensation} 金币</div>` : ''}
                            ${reward?.lagCompensation ? `<div>落后补偿：+${reward.lagCompensation} 金币</div>` : ''}
                            <div style="color: #ffd700; font-weight: bold; margin-top: 5px;">当前金币：${this.state.gold}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!this.state.goldReward) return '';
        
        const target = 400 * Math.pow(1.5, this.state.stage - 1);
        const reward = this.state.goldReward;
        const overachievementBonus = reward.overachievement?.bonus || 0;
        const extraRelicChoices = reward.overachievement?.extraRelicChoices || 0;
        const totalWithBonus = reward.total + overachievementBonus;
        
        return `
            <div style="background: rgba(18, 18, 31, 0.95); border: 2px solid #6666aa; border-radius: 12px; padding: 1rem; max-width: 500px; width: 100%; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="color: #6666aa; font-size: 1.3rem; font-weight: bold; margin: 0;">🎉 关卡通关！</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; max-width: 400px; margin-left: auto; margin-right: auto;">
                    <div style="text-align: left; font-size: 0.9rem; color: #aaaacc;">
                        <div>本关目标: ${Math.floor(target).toLocaleString()} 分</div>
                        <div>本关累计: ${this.state.stageScore.toLocaleString()} 分</div>
                        <div>第 ${this.state.round - 1} 回合达标</div>
                        ${overachievementBonus > 0 ? `<div style="color: #ffaa00;">超额突破: ${((this.state.stageScore / target) * 100).toFixed(1)}%</div>` : ''}
                    </div>
                    <div style="text-align: right; font-size: 0.9rem; color: #aaaacc;">
                        <div>基础奖励: +${reward.base} 金币</div>
                        <div>剩余回合: +${reward.remainingRounds} 金币</div>
                        <div>进度奖励: +${reward.progress} 金币</div>
                        ${overachievementBonus > 0 ? `<div style="color: #ffaa00;">超额突破: +${overachievementBonus} 金币</div>` : ''}
                        ${extraRelicChoices > 0 ? `<div style="color: #ff6688;">超额抽取: +${extraRelicChoices} 次遗物选择</div>` : ''}
                        <div style="color: #ffd700; font-weight: bold; margin-top: 5px;">合计: +${totalWithBonus} 金币</div>
                    </div>
                </div>
            </div>
        `;
    }

    private getRewardChoiceTitle(): string {
        const extraTotal = this.state.goldReward?.overachievement?.extraRelicChoices || 0;
        if (extraTotal <= 0) return '选择遗物';
        const currentPick = 1 + extraTotal - this.remainingRewardChoices + 1;
        return `选择遗物 (${currentPick}/${1 + extraTotal})`;
    }

    private renderRewardRelicCard(relic: Relic, index: number): string {
        const rarityColor = RELIC_RARITY_COLORS[relic.rarity];
        const rarityText = RELIC_RARITY_TEXT[relic.rarity];

        return `
            <div class="relic-select-card" data-index="${index}" style="border-color: ${rarityColor};">
                <div class="relic-card-name" style="color: ${rarityColor};">${relic.name}</div>
                <div style="font-size: 0.9rem; color: ${rarityColor}; margin-bottom: 8px; text-align: center;">${rarityText}</div>
                <div class="relic-card-desc">${getRelicDescription(relic, this.state.maxHeat)}</div>
            </div>
        `;
    }

    private selectRelic(relic: Relic): void {
        const card = document.querySelector(`[data-index="${this.relics.indexOf(relic)}"]`) as HTMLElement;
        
        document.querySelectorAll('.relic-select-card').forEach(c => {
            (c as HTMLElement).style.pointerEvents = 'none';
        });
        
        this.addSelectionAnimation(card, () => {
            addRelic(this.state, relic);
            this.remainingRewardChoices -= 1;
            if (this.remainingRewardChoices > 0) {
                this.relics = getRandomRelics(3, this.state.relics);
                this.create();
                return;
            }
            if (this.showShop) {
                const shopRelics = getShopRelics(this.state.stage, this.state.relics);
                this.shopItems = shopRelics.map(shopRelic => ({ relic: shopRelic, sold: false }));
                this.showShopInterface();
            } else {
                setTimeout(() => {
                    const container = document.getElementById('game-ui')!;
                    container.style.display = 'flex';
                    container.style.gridTemplateColumns = 'none';
                    setTimeout(() => {
                        container.style.display = 'grid';
                        container.style.gridTemplateColumns = '220px 1fr 220px';
                        this.continueToNextStage();
                    }, 100);
                }, 100);
            }
        });
    }

    private addSelectionAnimation(element: HTMLElement, callback: () => void): void {
        element.style.position = 'relative';
        
        const glow = document.createElement('div');
        glow.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 3px solid #ffdd44;
            border-radius: 12px;
            pointer-events: none;
            animation: glow-animation 0.5s ease-in-out forwards;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glow-animation {
                0% {
                    transform: scale(0.95);
                    opacity: 0.5;
                    box-shadow: 0 0 10px #ffdd44;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 1;
                    box-shadow: 0 0 30px #ffdd44, 0 0 60px #ffdd44;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                    box-shadow: 0 0 20px #ffdd44;
                }
            }
        `;
        document.head.appendChild(style);
        
        element.appendChild(glow);
        
        setTimeout(() => {
            element.removeChild(glow);
            document.head.removeChild(style);
            callback();
        }, 500);
    }

    private showShopInterface(): void {
        const container = document.getElementById('game-ui')!;
        
        const shopHtml = `
            <div class="relic-select-container" style="justify-content: center; gap: 30px; padding: 20px; flex-direction: column;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div class="relic-select-title">🏪 商店</div>
                </div>
                <div style="width: 100%; max-width: 850px; margin: 0 auto;">
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 20px; max-width: 800px; margin-left: auto; margin-right: auto;">
                        <div id="relic-shop-gold" style="color: #ffd700; font-size: 1.2rem; margin: 0;">当前金币: ${this.state.gold}</div>
                    </div>
                    <div class="relic-cards-container" style="max-width: 800px; margin: 0 auto;">
                        ${this.shopItems.map((item, i) => {
                            const rarityColor = RELIC_RARITY_COLORS[item.relic.rarity];
                            const rarityText = RELIC_RARITY_TEXT[item.relic.rarity];
                            return `
                                <div class="relic-select-card" data-shop-index="${i}" style="opacity: ${item.sold ? 0.5 : 1}; display: flex; flex-direction: column; min-height: 200px; border-color: ${rarityColor};">
                                    <div class="relic-card-name" style="color: ${rarityColor};">${item.relic.name}</div>
                                    <div style="font-size: 0.9rem; color: ${rarityColor}; margin-bottom: 5px; text-align: center;">${rarityText}</div>
                                    <div style="font-size: 1.2rem; color: #ffd700; margin-bottom: 10px; text-align: center;">价格: ${item.relic.price} 金币</div>
                                    <div class="relic-card-desc" style="flex: 1;">${getRelicDescription(item.relic, this.state.maxHeat)}</div>
                                    <button class="btn ${item.sold ? 'secondary' : 'primary'}" data-shop-index="${i}" style="margin-top: 15px; ${item.sold ? 'background: #666; cursor: not-allowed;' : ''}" ${item.sold || this.state.gold < item.relic.price ? 'disabled' : ''}>
                                        ${item.sold ? '已售出' : '购买'}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="margin-top: 30px; text-align: center;">
                        <button class="btn primary" id="btn-continue">继续前进</button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = shopHtml;
        
        this.shopItems.forEach((item, i) => {
            const card = document.querySelector(`[data-shop-index="${i}"]`) as HTMLElement;
            const btn = card.querySelector('button') as HTMLButtonElement;
            if (!item.sold) {
                btn.addEventListener('click', () => {
                    if (this.state.gold >= item.relic.price) {
                        this.buyShopItem(i, btn);
                    } else {
                        this.showToast('金币不足');
                    }
                });
            }
        });
        
        const continueBtn = document.getElementById('btn-continue') as HTMLButtonElement;
        continueBtn.addEventListener('click', () => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = '220px 1fr 220px';
            this.continueToNextStage();
        });
    }

    private buyShopItem(index: number, button: HTMLButtonElement): void {
        const item = this.shopItems[index];
        if (item.sold || this.state.gold < item.relic.price) return;

        this.state.gold -= item.relic.price;
        addRelic(this.state, item.relic);
        item.sold = true;

        button.textContent = '已售出';
        button.disabled = true;
        button.classList.remove('primary');
        button.classList.add('secondary');
        button.style.background = '#666';
        button.style.cursor = 'not-allowed';
        
        const goldDisplay = document.getElementById('relic-shop-gold');
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

    private continueToNextStage(): void {
        this.state.stage += 1;
        this.state.stageScore = 0;
        this.state.round = 1;
        this.state.phase = 'playing' as any;
        if (this.state.pvpMatch) {
            this.state.pvpMatch.stageRoundScores = [];
            this.state.pvpMatch.lastGoldReward = undefined;
        }
        
        // 调用 resetRoundState 来正确初始化所有回合状态
        resetRoundState(this.state);
        this.state.log.push('');
        this.state.log.push(`=== 第 ${this.state.stage} 关开始 ===`);
        if (this.state.gameMode === 'pvp') {
            this.state.log.push('本轮无目标分，三回合后统一揭示成绩');
        } else {
            this.state.log.push(`目标: ${getStageTarget(this.state.stage).toLocaleString()} 分`);
        }
        
        this.scene.start('GameScene', { state: this.state });
    }
}
