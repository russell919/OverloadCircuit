import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, getStageTarget, TOTAL_ROUNDS } from '../constants';
import { GameState, Module, ModuleResult, GamePhase } from '../types';
import { createInitialState, resetRoundState, calculateRoundScore, saveHistory, hasRelic, countRelic, resetStageState } from '../store';
import { getWeightedRandomModule, ModuleInfo, getAllModules } from '../modules';
import { getAllRelics } from '../relics';

export class GameScene extends Phaser.Scene {
    private state!: GameState;
    private uiContainer!: HTMLElement;
    private buttonsDisabled = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    init(data: { state?: GameState }): void {
        if (data.state) {
            this.state = data.state;
            if (this.state.phase === GamePhase.STAGE_CLEAR) {
                resetStageState(this.state);
            }
        } else {
            this.state = createInitialState();
        }
    }

    create(): void {
        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        this.uiContainer = document.getElementById('game-ui')!;
        this.uiContainer.style.display = 'grid';
        this.uiContainer.style.gridTemplateColumns = '220px 1fr 220px';
        this.uiContainer.innerHTML = this.createGameUI();

        this.bindGameEvents();
        this.updateAllUI();
        this.populateRulesModal();

        if (this.state.phase === GamePhase.PLAYING && this.state.log.length === 0) {
            this.state.log.push(`=== 第 ${this.state.stage} 关开始 ===`);
            this.state.log.push(`目标: ${getStageTarget(this.state.stage).toLocaleString()} 分`);
        }

        this.scale.on('resize', this.onResize, this);
    }

    private createGameUI(): string {
        const target = getStageTarget(this.state.stage);
        const relicList = this.state.relics.length > 0
            ? this.state.relics.slice(0, 5).map(r => `<span class="relic-item">${r.name}</span>`).join('')
            : '<span class="relic-more">无</span>';

        return `
            <div class="left-panel">
                <div class="game-title">过载回路</div>

                <div class="info-block">
                    <div class="info-label">当前关卡</div>
                    <div class="info-value stage" id="stage-value">第 ${this.state.stage} 关</div>
                </div>

                <div class="info-block">
                    <div class="info-label">当前回合</div>
                    <div class="info-value" id="round-value">第 ${this.state.round} / ${TOTAL_ROUNDS} 回合</div>
                </div>

                <div class="info-block">
                    <div class="info-label">本关目标分</div>
                    <div class="info-value" id="target-value">${target.toLocaleString()}</div>
                </div>

                <div class="info-block">
                    <div class="info-label">本关累计分</div>
                    <div class="info-value score" id="stage-score-value">${this.state.stageScore.toLocaleString()}</div>
                </div>

                <div class="heat-section">
                    <div class="heat-label">
                        <span>热量</span>
                        <span id="heat-text">${this.state.heat} / ${this.state.maxHeat}</span>
                    </div>
                    <div class="heat-bar-container">
                        <div class="heat-bar" id="heat-bar" style="width: ${(this.state.heat / this.state.maxHeat) * 100}%"></div>
                    </div>
                    <div class="heat-warning" id="heat-warning"></div>
                </div>

                <div class="relic-section">
                    <div class="relic-title">已拥有遗物</div>
                    <div class="relic-list" id="relic-list">
                        ${relicList}
                        ${this.state.relics.length > 5 ? `<span class="relic-more">+${this.state.relics.length - 5}更多</span>` : ''}
                    </div>
                </div>

                <button class="btn secondary" id="btn-rules" style="margin-top: 10px;">📖 规则说明</button>
            </div>

            <div class="center-panel">
                <div class="center-title">本回合构筑</div>

                <div class="stats-section">
                    <div class="stat-item">
                        <div class="stat-value" id="chips-value">${this.state.chips.toLocaleString()}</div>
                        <div class="stat-label">筹码</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value mult" id="mult-value">×${this.state.mult}</div>
                        <div class="stat-label">倍率</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value xmult" id="xmult-value">×${this.state.xmult}</div>
                        <div class="stat-label">X倍率</div>
                    </div>
                </div>

                <div class="estimated-section">
                    <div class="estimated-label">预计结算分</div>
                    <div class="estimated-value" id="estimated-value">${calculateRoundScore(this.state).toLocaleString()}</div>
                    <div class="formula" id="formula">${this.state.chips} × ${this.state.mult} × ${this.state.xmult} = ${calculateRoundScore(this.state).toLocaleString()}</div>
                </div>

                <div class="modules-section" id="modules-section"></div>

                <div class="buttons-section">
                    <button class="btn primary" id="btn-draw">抽取模块</button>
                    <button class="btn success" id="btn-settle">停手结算</button>
                    <button class="btn secondary" id="btn-restart">重新开始</button>
                </div>
            </div>

            <div class="right-panel">
                <div class="right-section-title">待触发效果</div>
                <div class="pending-effect" id="pending-effect"></div>
                <div class="copyable-module" id="copyable-module"></div>

                <div class="right-section-title">最近抽取</div>
                <div class="recent-modules" id="recent-modules"></div>

                <div class="right-section-title">事件日志</div>
                <div class="log-section">
                    <div class="log-list" id="log-list"></div>
                </div>
            </div>
        `;
    }

    private populateRulesModal(): void {
        const moduleContainer = document.getElementById('module-info-container');
        const relicContainer = document.getElementById('relic-info-container');

        if (moduleContainer) {
            const allModules = getAllModules();
            moduleContainer.innerHTML = allModules.map(mod => {
                const modInfo = mod as ModuleInfo;
                const colorClass = this.getModuleColorClass(mod.id);
                return `
                    <div class="module-info-item ${colorClass}">
                        <div class="module-info-name">${mod.name}</div>
                        <div class="module-info-desc">${modInfo.effectText || modInfo.description || ''}</div>
                    </div>
                `;
            }).join('');
        }

        if (relicContainer) {
            const allRelics = getAllRelics();
            const ownedRelicIds = this.state.relics.map(r => r.id);
            const relicCounts: Record<string, number> = {};
            this.state.relics.forEach(r => {
                relicCounts[r.id] = (relicCounts[r.id] || 0) + 1;
            });

            relicContainer.innerHTML = allRelics.map(relic => {
                const owned = relicCounts[relic.id] || 0;
                const ownedText = owned > 0 ? `<div class="relic-info-owned">已拥有 ${owned} 个</div>` : '';
                return `
                    <div class="relic-info-item">
                        <div class="relic-info-name">${relic.name}</div>
                        <div class="relic-info-desc">${relic.description}</div>
                        ${ownedText}
                    </div>
                `;
            }).join('');
        }
    }

    private bindGameEvents(): void {
        const drawBtn = document.getElementById('btn-draw')!;
        const settleBtn = document.getElementById('btn-settle')!;
        const restartBtn = document.getElementById('btn-restart')!;
        const rulesBtn = document.getElementById('btn-rules')!;

        drawBtn.addEventListener('click', () => this.onDrawModule());
        settleBtn.addEventListener('click', () => this.onSettle());
        restartBtn.addEventListener('click', () => this.scene.start('ResultScene', { state: this.state }));
        rulesBtn.addEventListener('click', () => {
            if (typeof (window as any).openRulesModal === 'function') {
                (window as any).openRulesModal();
            }
        });
    }

    private updateAllUI(): void {
        const target = getStageTarget(this.state.stage);

        const stageValue = document.getElementById('stage-value')!;
        stageValue.textContent = `第 ${this.state.stage} 关`;

        const roundValue = document.getElementById('round-value')!;
        roundValue.textContent = `第 ${this.state.round} / ${TOTAL_ROUNDS} 回合`;

        const targetValue = document.getElementById('target-value')!;
        targetValue.textContent = target.toLocaleString();

        const stageScoreValue = document.getElementById('stage-score-value')!;
        stageScoreValue.textContent = this.state.stageScore.toLocaleString();

        const chipsValue = document.getElementById('chips-value')!;
        chipsValue.textContent = this.state.chips.toLocaleString();

        const multValue = document.getElementById('mult-value')!;
        multValue.textContent = `×${this.state.mult}`;

        const xmultValue = document.getElementById('xmult-value')!;
        xmultValue.textContent = `×${this.state.xmult}`;

        const estScore = calculateRoundScore(this.state);
        const estimatedValue = document.getElementById('estimated-value')!;
        estimatedValue.textContent = estScore.toLocaleString();

        const formula = document.getElementById('formula')!;
        formula.textContent = `${this.state.chips} × ${this.state.mult} × ${this.state.xmult} = ${estScore.toLocaleString()}`;

        const heatText = document.getElementById('heat-text')!;
        heatText.textContent = `${this.state.heat} / ${this.state.maxHeat}`;

        const heatBar = document.getElementById('heat-bar')!;
        const heatPercent = (this.state.heat / this.state.maxHeat) * 100;
        heatBar.setAttribute('style', `width: ${heatPercent}%`);

        heatBar.classList.remove('medium', 'high');
        if (this.state.heat >= 7) {
            heatBar.classList.add('high');
        } else if (this.state.heat >= 4) {
            heatBar.classList.add('medium');
        }

        const heatWarning = document.getElementById('heat-warning')!;
        if (this.state.heat >= 9) {
            heatWarning.textContent = '⚠️ 危险！即将过载！';
        } else if (this.state.heat >= 7) {
            heatWarning.textContent = '⚡ 高热警告';
        } else {
            heatWarning.textContent = '';
        }

        const pendingEffect = document.getElementById('pending-effect')!;
        if (this.state.amplifierActive) {
            pendingEffect.textContent = `🔺 放大待命 (剩余${this.state.amplifierCount}次)`;
        } else {
            pendingEffect.textContent = '';
        }

        const copyableModule = document.getElementById('copyable-module')!;
        if (this.state.lastModule && this.state.lastModule.id !== 'copy' && this.state.lastModule.id !== 'amplifier') {
            copyableModule.textContent = `可复制: ${this.state.lastModule.name}`;
        } else {
            copyableModule.textContent = '';
        }

        this.updateModuleCards();
        this.updateRecentModules();
        this.updateLog();
        this.updateRelicList();
    }

    private updateModuleCards(): void {
        const modulesSection = document.getElementById('modules-section')!;
        const recentModules = this.state.modulesThisRound.slice(-6);

        modulesSection.innerHTML = recentModules.map((mod, i) => {
            const modInfo = mod as ModuleInfo;
            const isLatest = i === recentModules.length - 1;
            const colorClass = this.getModuleColorClass(mod.id);
            const effectText = modInfo.effectText || '';

            return `
                <div class="module-card ${colorClass} ${isLatest ? 'latest' : ''}">
                    <div class="module-name">${mod.name}</div>
                    <div class="module-effect">${effectText}</div>
                </div>
            `;
        }).join('');
    }

    private getModuleColorClass(moduleId: string): string {
        switch (moduleId) {
            case 'blue_core': return 'blue';
            case 'red_core': return 'red';
            case 'yellow_core': return 'yellow';
            case 'coolant': return 'cool';
            case 'copy': return 'copy';
            case 'amplifier': return 'amp';
            case 'fission': return 'fission';
            default: return 'blue';
        }
    }

    private updateRecentModules(): void {
        const recentModules = document.getElementById('recent-modules')!;
        const recent = this.state.modulesThisRound.slice(-3).reverse();

        recentModules.innerHTML = recent.map(mod => {
            const modInfo = mod as ModuleInfo;
            const colorClass = this.getModuleColorClass(mod.id);
            const effectText = modInfo.effectText || '';
            return `<div class="recent-item ${colorClass}">${mod.name}: ${effectText}</div>`;
        }).join('');
    }

    private updateLog(): void {
        const logList = document.getElementById('log-list')!;
        const recentLogs = this.state.log.slice(-8).reverse();

        logList.innerHTML = recentLogs.map(log => {
            let className = 'log-item';
            if (log.includes('过载')) className += ' overload';
            else if (log.includes('通过') || log.includes('结算')) className += ' success';
            else if (log.includes('[')) className += ' highlight';
            return `<div class="${className}">${log}</div>`;
        }).join('');
    }

    private updateRelicList(): void {
        const relicList = document.getElementById('relic-list')!;
        if (this.state.relics.length > 0) {
            const display = this.state.relics.slice(0, 5).map(r => `<span class="relic-item">${r.name}</span>`).join('');
            const more = this.state.relics.length > 5 ? `<span class="relic-more">+${this.state.relics.length - 5}更多</span>` : '';
            relicList.innerHTML = display + more;
        } else {
            relicList.innerHTML = '<span class="relic-more">无</span>';
        }
    }

    private onDrawModule(): void {
        if (this.buttonsDisabled || this.state.processing) return;
        if (this.state.phase !== GamePhase.PLAYING) return;

        this.state.processing = true;
        this.buttonsDisabled = true;

        this.state.heat += 1;

        const module = getWeightedRandomModule();
        const result = this.applyModule(module);

        if (this.state.heat >= this.state.maxHeat) {
            this.triggerOverload();
            return;
        }

        this.showModuleFeedback(result);
        this.updateAllUI();

        this.state.processing = false;
        this.buttonsDisabled = false;
    }

    private applyModule(module: Module): ModuleResult {
        const prevModule = this.state.lastModule;
        const result = module.apply(this.state, prevModule, this.state.amplifierCount);

        if (this.state.amplifierActive && module.id !== 'amplifier') {
            this.state.amplifierCount--;
            if (this.state.amplifierCount <= 0) {
                this.state.amplifierActive = false;
            }
            const extraResult = module.apply(this.state, prevModule, 1);
            result.chips += extraResult.chips;
            result.mult += extraResult.mult;
            result.xmult += extraResult.xmult;
            result.heat += extraResult.heat;
            this.state.log.push(`[放大] ${module.name} 再次触发!`);
        }

        this.state.modulesThisRound.push(module);
        this.state.lastModule = module;

        for (const relic of this.state.relics) {
            if (relic.id === 'superconductor_coil') {
                const count = this.state.modulesThisRound.length;
                if (count % 3 === 0) {
                    this.state.mult += 1;
                    this.state.log.push(`[超导线圈] 触发: +1 mult (第${count}抽)`);
                }
            }
        }

        if (module.id !== 'copy' && module.id !== 'amplifier') {
            for (const relic of this.state.relics) {
                if (relic.id === 'out_of_control_circuit' && this.state.heat >= 7) {
                    const extra = result.chips;
                    if (extra > 0) {
                        this.state.chips += extra;
                        this.state.log.push(`[失控回路] 触发: chips翻倍 +${extra}`);
                    }
                }
            }
        }

        this.state.log.push(result.log);
        return result;
    }

    private showModuleFeedback(result: ModuleResult): void {
        const gameUi = document.getElementById('game-ui')!;

        if (result.chips > 0) {
            this.createValuePop(gameUi, `+${result.chips}`, '#4488ff', '35%', '35%');
        }
        if (result.mult > 0) {
            this.createValuePop(gameUi, `+${result.mult}倍`, '#ff4444', '50%', '35%');
        }
        if (result.xmult > 0) {
            this.createValuePop(gameUi, `+${result.xmult}X`, '#ffaa22', '65%', '35%');
        }
    }

    private createValuePop(parent: HTMLElement, text: string, color: string, left: string, top: string): void {
        const pop = document.createElement('div');
        pop.className = 'value-pop';
        pop.textContent = text;
        pop.style.color = color;
        pop.style.left = left;
        pop.style.top = top;
        parent.appendChild(pop);

        setTimeout(() => pop.remove(), 600);
    }

    private triggerOverload(): void {
        this.state.overloaded = true;

        const fuseCount = countRelic(this.state, 'fuse');
        let retainedScore = 0;
        if (fuseCount > 0) {
            retainedScore = Math.floor(calculateRoundScore(this.state) * 0.35 * fuseCount);
            this.state.fuseRetainedScore = retainedScore;
            this.state.fuseTriggered = true;
        }

        this.state.roundScore = 0;
        this.state.stageScore += retainedScore;

        this.state.log.push('═══════════════════');
        this.state.log.push('💥 过载爆表！本回合失败！');
        if (retainedScore > 0) {
            this.state.log.push(`[保险丝] 保留 ${retainedScore.toLocaleString()} 分`);
        }
        this.state.log.push('═══════════════════');

        this.showOverloadEffect();
        this.updateAllUI();

        setTimeout(() => {
            this.buttonsDisabled = false;
            this.state.processing = false;
            this.finishRound();
        }, 1500);
    }

    private showOverloadEffect(): void {
        const gameUi = document.getElementById('game-ui')!;

        const flash = document.createElement('div');
        flash.className = 'flash-overlay';
        gameUi.appendChild(flash);
        setTimeout(() => flash.remove(), 400);

        const overloadText = document.createElement('div');
        overloadText.className = 'overload-text';
        overloadText.textContent = '⚠️ 过载！';
        gameUi.appendChild(overloadText);
        setTimeout(() => overloadText.remove(), 1500);
    }

    private onSettle(): void {
        if (this.buttonsDisabled || this.state.processing) return;
        if (this.state.phase !== GamePhase.PLAYING) return;

        this.state.processing = true;
        this.buttonsDisabled = true;

        if (hasRelic(this.state, 'extreme_paranoia') && this.state.heat >= 9) {
            const bonusXmult = 2 * countRelic(this.state, 'extreme_paranoia');
            this.state.xmult += bonusXmult;
            this.state.log.push(`[极限偏执] 触发: xmult +${bonusXmult} (heat=${this.state.heat})`);
        }

        if (hasRelic(this.state, 'idle_supercharge')) {
            const hasCoolant = this.state.modulesThisRound.some(m => m.id === 'coolant');
            if (!hasCoolant) {
                const bonus = countRelic(this.state, 'idle_supercharge');
                this.state.xmult += bonus;
                this.state.log.push(`[空转增压] 触发: xmult +${bonus}`);
            }
        }

        if (this.state.heat >= 8 && this.state.heat < this.state.maxHeat) {
            const riskBonus = Math.floor(calculateRoundScore(this.state) * 0.25);
            if (riskBonus > 0) {
                this.state.stageScore += riskBonus;
                this.state.log.push(`⚡ 惊险结算奖励: +${riskBonus.toLocaleString()}`);
            }
        }

        const roundScore = calculateRoundScore(this.state);

        this.state.roundScore = roundScore;
        if (roundScore > this.state.maxRoundScore) {
            this.state.maxRoundScore = roundScore;
        }
        this.state.stageScore += roundScore;
        this.state.totalScore += roundScore;

        this.state.log.push('═══════════════════');
        this.state.log.push(`结算: ${this.state.chips} × ${this.state.mult} × ${this.state.xmult} = ${roundScore.toLocaleString()}`);
        this.state.log.push(`本关累计: ${this.state.stageScore.toLocaleString()}`);
        this.state.log.push('═══════════════════');

        this.showSettleAnimation(roundScore);
        this.updateAllUI();

        setTimeout(() => {
            this.buttonsDisabled = false;
            this.state.processing = false;
            this.finishRound();
        }, 1500);
    }

    private showSettleAnimation(score: number): void {
        const gameUi = document.getElementById('game-ui')!;

        const settleScore = document.createElement('div');
        settleScore.className = 'settle-score';
        settleScore.textContent = score.toLocaleString();
        gameUi.appendChild(settleScore);
        setTimeout(() => settleScore.remove(), 1500);
    }

    private finishRound(): void {
        this.state.round++;

        if (this.state.round > TOTAL_ROUNDS) {
            const target = getStageTarget(this.state.stage);
            if (this.state.stageScore >= target) {
                this.triggerStageClear();
            } else {
                this.triggerGameOver();
            }
        } else {
            resetRoundState(this.state);
            this.state.log.push('');
            this.state.log.push(`=== 第 ${this.state.round} 回合开始 ===`);
            this.updateAllUI();
        }
    }

    private triggerStageClear(): void {
        this.state.phase = GamePhase.STAGE_CLEAR;
        saveHistory(this.state);

        this.state.log.push('');
        this.state.log.push('🎉🎉🎉');
        this.state.log.push(`第 ${this.state.stage} 关通过！`);
        this.state.log.push(`累计: ${this.state.stageScore.toLocaleString()}`);
        this.state.log.push('🎉🎉🎉');

        const gameUi = document.getElementById('game-ui')!;
        const clearText = document.createElement('div');
        clearText.className = 'stage-clear-text';
        clearText.textContent = '🎉 关卡通过！';
        gameUi.appendChild(clearText);

        setTimeout(() => {
            clearText.remove();
            this.scene.start('RelicScene', { state: this.state });
        }, 2000);
    }

    private triggerGameOver(): void {
        this.state.phase = GamePhase.GAME_OVER;
        saveHistory(this.state);

        this.state.log.push('');
        this.state.log.push('═══════════════════');
        this.state.log.push('游戏结束');
        this.state.log.push(`到达: 第 ${this.state.stage} 关`);
        this.state.log.push(`最高单回合: ${this.state.maxRoundScore.toLocaleString()}`);
        this.state.log.push(`总分: ${this.state.totalScore.toLocaleString()}`);
        this.state.log.push('═══════════════════');

        setTimeout(() => {
            this.scene.start('ResultScene', { state: this.state });
        }, 1500);
    }

    private onResize(): void {
        this.scene.restart({ state: this.state });
    }
}
