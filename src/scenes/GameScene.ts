import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, getStageTarget, TOTAL_ROUNDS } from '../constants';
import { GameState, Module, ModuleResult, GamePhase } from '../types';
import { createInitialState, resetRoundState, calculateRoundScore, saveHistory, hasRelic, countRelic, resetStageState, calculateGoldReward, calculateOverachievementGold, calculateSettlementPreview } from '../store';
import { getWeightedRandomModule, ModuleInfo, getAllModules } from '../modules';
import { getExtremeParanoiaThreshold, getFuseRetainRate, getRelicDescription, getRelicsForRules, isUniqueRelic, RELIC_RARITY_COLORS, RELIC_RARITY_TEXT } from '../relics';

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
        this.buttonsDisabled = false;

        // 如果是新游戏开始（log为空），需要先初始化回合状态
        if (this.state.phase === GamePhase.PLAYING && this.state.log.length === 0) {
            resetRoundState(this.state);
            this.state.log.push(`=== 第 ${this.state.stage} 关开始 ===`);
            if (this.isPvp()) {
                this.state.log.push(`联机对手: ${this.state.pvpMatch?.opponentName || '未知'}`);
                this.state.log.push('本关无目标分，三回合后统一揭示成绩');
            } else {
                this.state.log.push(`目标: ${getStageTarget(this.state.stage).toLocaleString()} 分`);
            }
        }

        this.uiContainer = document.getElementById('game-ui')!;
        this.uiContainer.style.display = 'grid';
        this.uiContainer.style.gridTemplateColumns = '220px 1fr 220px';
        this.uiContainer.innerHTML = this.createGameUI();

        this.bindGameEvents();
        this.updateAllUI();
        this.populateRulesModal();

        this.scale.on('resize', this.onResize, this);
    }

    private createGameUI(): string {
        const target = getStageTarget(this.state.stage);
        const pvpScoreText = this.getPvpScoreText();
        const relicList = this.state.relics.length > 0
            ? this.state.relics.slice(0, 5).map(r => `<span class="relic-item" style="border-color: ${RELIC_RARITY_COLORS[r.rarity]};" title="${RELIC_RARITY_TEXT[r.rarity]}">${r.name}</span>`).join('')
            : '<span class="relic-more">无</span>';

        const coreChipDisplay = this.state.coreChip
            ? `<div class="core-chip-display" style="color: #ffdd44; font-size: 12px; margin-top: 5px;">核心芯片: ${this.state.coreChip.name}</div>`
            : this.isPvp()
                ? `<div class="core-chip-display" style="color: #44ff88; font-size: 12px; margin-top: 5px;">联机对战: VS ${this.state.pvpMatch?.opponentName || '未知'}</div>`
            : '';

        return `
            <div class="left-panel">
                <div class="game-title">过载回路</div>
                ${coreChipDisplay}

                <div class="info-block">
                    <div class="info-label">当前关卡</div>
                    <div class="info-value stage" id="stage-value">第 ${this.state.stage} 关</div>
                </div>

                <div class="info-block">
                    <div class="info-label">当前回合</div>
                    <div class="info-value" id="round-value">第 ${this.state.round} / ${TOTAL_ROUNDS} 回合</div>
                </div>

                <div class="info-block">
                    <div class="info-label">${this.isPvp() ? '当前胜点' : '本关目标分'}</div>
                    <div class="info-value" id="target-value">${this.isPvp() ? pvpScoreText : target.toLocaleString()}</div>
                </div>

                <div class="info-block">
                    <div class="info-label">${this.isPvp() ? '本机本关分' : '本关累计分'}</div>
                    <div class="info-value score" id="stage-score-value">${this.state.stageScore.toLocaleString()}</div>
                </div>

                <div class="info-block">
                    <div class="info-label">当前金币</div>
                    <div class="info-value" style="color: #ffd700;" id="gold-value">${this.state.gold}</div>
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
                    <div class="stat-divider">=</div>
                    <div class="stat-item base-item">
                        <div class="stat-value base" id="base-value">${calculateRoundScore(this.state).toLocaleString()}</div>
                        <div class="stat-label">基础分</div>
                    </div>
                </div>

                <div class="modules-section" id="modules-section"></div>

                <div class="preview-final-section">
                    <div class="preview-final-label">预估结算分数</div>
                    <div class="preview-final-value" id="preview-final-value">${calculateSettlementPreview(this.state).previewFinalScore.toLocaleString()}</div>
                </div>

                <div class="breakdown-panel" id="breakdown-panel"></div>

                <div class="buttons-section">
                    <button class="btn primary" id="btn-draw">抽取模块</button>
                    <button class="btn success" id="btn-settle">停手结算</button>
                    <button class="btn secondary" id="btn-restart">${this.isPvp() ? '退出联机' : '重新开始'}</button>
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

    private isPvp(): boolean {
        return this.state.gameMode === 'pvp' && !!this.state.pvpMatch;
    }

    private getPvpScoreText(): string {
        if (!this.state.pvpMatch) return '0 : 0';
        const match = this.state.pvpMatch;
        const selfScore = match.matchScore[match.playerId] || 0;
        const opponentScore = match.matchScore[match.opponentId] || 0;
        return `${selfScore} : ${opponentScore}`;
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
            const allRelics = getRelicsForRules(this.state.relics);
            const relicCounts: Record<string, number> = {};
            this.state.relics.forEach(r => {
                relicCounts[r.id] = (relicCounts[r.id] || 0) + 1;
            });

            relicContainer.innerHTML = allRelics.map(relic => {
                const owned = relicCounts[relic.id] || 0;
                const ownedText = owned > 0 ? `<div class="relic-info-owned">已拥有 ${owned} 个</div>` : '';
                const rarityColor = RELIC_RARITY_COLORS[relic.rarity];
                const uniqueText = isUniqueRelic(relic) ? '<div style="font-size: 0.75rem; color: #ffdd44; margin-bottom: 6px;">至多获取一个</div>' : '';
                return `
                    <div class="relic-info-item" style="border-color: ${rarityColor};">
                        <div class="relic-info-name" style="color: ${rarityColor};">${relic.name}</div>
                        <div style="font-size: 0.8rem; color: ${rarityColor}; margin-bottom: 6px;">${RELIC_RARITY_TEXT[relic.rarity]}</div>
                        ${uniqueText}
                        <div class="relic-info-desc">${getRelicDescription(relic, this.state.maxHeat)}</div>
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
        restartBtn.addEventListener('click', () => {
            if (this.isPvp()) {
                this.scene.start('MenuScene');
            } else {
                this.scene.start('ResultScene', { state: this.state });
            }
        });
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
        targetValue.textContent = this.isPvp() ? this.getPvpScoreText() : target.toLocaleString();

        const stageScoreValue = document.getElementById('stage-score-value')!;
        stageScoreValue.textContent = this.state.stageScore.toLocaleString();

        const goldValue = document.getElementById('gold-value')!;
        goldValue.textContent = this.state.gold.toString();

        const chipsValue = document.getElementById('chips-value')!;
        chipsValue.textContent = this.state.chips.toLocaleString();

        const multValue = document.getElementById('mult-value')!;
        multValue.textContent = `×${this.state.mult}`;

        const xmultValue = document.getElementById('xmult-value')!;
        xmultValue.textContent = `×${this.state.xmult}`;

        const baseScore = calculateRoundScore(this.state);
        const baseValue = document.getElementById('base-value');
        if (baseValue) {
            baseValue.textContent = baseScore.toLocaleString();
        }

        const preview = calculateSettlementPreview(this.state);
        const previewFinalValue = document.getElementById('preview-final-value');
        if (previewFinalValue) {
            previewFinalValue.textContent = preview.previewFinalScore.toLocaleString();
        }

        const breakdownPanel = document.getElementById('breakdown-panel');
        if (breakdownPanel) {
            if (preview.breakdownItems.length > 1) {
                let breakdownHtml = '<div class="breakdown-title">分数增幅原因</div>';
                preview.breakdownItems.forEach((item, index) => {
                    const isPositive = item.value >= 0;
                    const valueText = isPositive && index > 0 ? `+${item.value.toLocaleString()}` : item.value.toLocaleString();
                    breakdownHtml += `
                        <div class="breakdown-item">
                            <div class="breakdown-name">${item.name}</div>
                            <div class="breakdown-desc">${item.condition}</div>
                            <div class="breakdown-value ${isPositive ? 'positive' : 'negative'}">${valueText}</div>
                        </div>
                    `;
                });
                breakdownHtml += `
                    <div class="breakdown-total">
                        <span class="breakdown-total-label">最终预估</span>
                        <span class="breakdown-total-value">${preview.previewFinalScore.toLocaleString()}</span>
                    </div>
                `;
                breakdownPanel.innerHTML = breakdownHtml;
            } else {
                breakdownPanel.innerHTML = '<div class="breakdown-empty">暂无额外增幅</div>';
            }
        }

        const heatText = document.getElementById('heat-text')!;
        heatText.textContent = `${this.state.heat} / ${this.state.maxHeat}`;

        const heatBar = document.getElementById('heat-bar')!;
        const heatPercent = (this.state.heat / this.state.maxHeat) * 100;
        heatBar.setAttribute('style', `width: ${heatPercent}%`);

        const heatRatio = this.state.heat / this.state.maxHeat;
        heatBar.classList.remove('medium', 'high');
        if (heatRatio >= 0.9) {
            heatBar.classList.add('high');
        } else if (heatRatio >= 0.7) {
            heatBar.classList.add('medium');
        }

        const heatWarning = document.getElementById('heat-warning')!;
        if (heatRatio >= 0.9) {
            heatWarning.textContent = '⚠️ 危险！即将过载！';
        } else if (heatRatio >= 0.7) {
            heatWarning.textContent = '⚡ 高热警告';
        } else {
            heatWarning.textContent = '';
        }

        const pendingEffect = document.getElementById('pending-effect')!;
        pendingEffect.innerHTML = this.renderPendingEffects();

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
            const display = this.state.relics.slice(0, 5).map(r => `<span class="relic-item" style="border-color: ${RELIC_RARITY_COLORS[r.rarity]};" title="${RELIC_RARITY_TEXT[r.rarity]}">${r.name}</span>`).join('');
            const more = this.state.relics.length > 5 ? `<span class="relic-more">+${this.state.relics.length - 5}更多</span>` : '';
            relicList.innerHTML = display + more;
        } else {
            relicList.innerHTML = '<span class="relic-more">无</span>';
        }
    }

    private renderPendingEffects(): string {
        const effects: Array<{ rarityRank: number; text: string }> = [];
        const rarityRank: Record<string, number> = {
            legendary: 0,
            epic: 1,
            rare: 2,
            common: 3
        };
        const addRelicEffect = (relicId: string, text: string): void => {
            const relic = this.state.relics.find(r => r.id === relicId);
            if (relic) {
                effects.push({ rarityRank: rarityRank[relic.rarity], text });
            }
        };

        if (this.state.amplifierActive && this.state.amplifierCount > 0) {
            effects.push({ rarityRank: -1, text: `🔺 放大待命 (剩余${this.state.amplifierCount}次)` });
        }

        if (hasRelic(this.state, 'meltdown_protocol') && !this.state.meltdownProtocolUsed) {
            addRelicEffect('meltdown_protocol', '熔断协议: 首次过载保护待命');
        }
        if (hasRelic(this.state, 'quantum_bypass') && !this.state.quantumBypassUsed) {
            addRelicEffect('quantum_bypass', '量子旁路: 首次过载 10% 清空热量');
        }

        const nextDrawCount = this.state.modulesThisRound.length + 1;
        if (hasRelic(this.state, 'superconductor_coil')) {
            const remaining = 3 - ((nextDrawCount - 1) % 3);
            addRelicEffect('superconductor_coil', remaining === 1 ? '超导线圈: 下次抽取 +1 倍率' : `超导线圈: 还差 ${remaining} 次抽取`);
        }

        if (this.state.stabilizerRemaining > 0) {
            addRelicEffect('stabilizer', `稳压器: 可抵消 ${this.state.stabilizerRemaining} 次黄芯热量`);
        }

        if (hasRelic(this.state, 'heat_fin') && !this.state.modulesThisRound.some(m => m.id === 'coolant')) {
            addRelicEffect('heat_fin', '散热鳍片: 首个冷却 +25 筹码');
        }

        if (hasRelic(this.state, 'copper_conductor') && this.state.modulesThisRound.length < 2) {
            addRelicEffect('copper_conductor', `铜制导片: 第 ${nextDrawCount} 次抽取 +${countRelic(this.state, 'copper_conductor') * 10} 筹码`);
        }

        if (hasRelic(this.state, 'short_circuit_reward')) {
            if (this.state.heat === 6) {
                addRelicEffect('short_circuit_reward', `短路奖励: 下次抽取 +${countRelic(this.state, 'short_circuit_reward') * 80} 筹码`);
            }
        }

        return effects
            .sort((a, b) => a.rarityRank - b.rarityRank)
            .map(effect => `<div>${effect.text}</div>`)
            .join('');
    }

    private getDrawHeatIncrease(): number {
        return countRelic(this.state, 'insulation_tape') > 0 && !this.state.heatReductionUsed ? 0 : 1;
    }

    private getMultGain(baseGain: number): number {
        return hasRelic(this.state, 'overclock_core') && this.state.heat / this.state.maxHeat >= 0.9
            ? baseGain * 2
            : baseGain;
    }

    private onDrawModule(): void {
        if (this.buttonsDisabled || this.state.processing) return;
        if (this.state.phase !== GamePhase.PLAYING) return;

        this.state.processing = true;
        this.buttonsDisabled = true;

        const heatBeforeDraw = this.state.heat;
        const drawHeatIncrease = this.getDrawHeatIncrease();
        if (drawHeatIncrease === 0 && countRelic(this.state, 'insulation_tape') > 0 && !this.state.heatReductionUsed) {
            this.state.heatReductionUsed = true;
            this.state.log.push('[绝缘胶带] 触发: 本次热量增加 -1');
        }
        this.state.heat += drawHeatIncrease;
        const heatAfterDrawCost = this.state.heat;

        const module = getWeightedRandomModule();
        const result = this.applyModule(module, heatBeforeDraw);

        if (this.state.heat >= this.state.maxHeat) {
            this.triggerOverload();
            return;
        }

        this.showModuleFeedback(result);
        this.updateAllUI();

        this.state.processing = false;
        this.buttonsDisabled = false;
    }

    private applyModule(module: Module, heatBeforeDraw: number): ModuleResult {
        const prevModule = this.state.lastModule;
        const wasAmplified = this.state.amplifierActive && this.state.amplifierCount > 0;
        const heatBeforeModule = this.state.heat;
        const multBeforeEffects = this.state.mult;
        const result = module.apply(this.state, prevModule, this.state.amplifierCount);

        if (wasAmplified) {
            if (module.id === 'copy' || module.id === 'amplifier') {
                this.state.amplifierCount += 1;
                this.state.amplifierActive = true;
                this.state.log.push(`[放大] ${module.name} 被放大: 放大待命 +1`);
            } else {
                this.state.amplifierCount = Math.max(0, this.state.amplifierCount - 1);
                if (this.state.amplifierCount === 0) {
                    this.state.amplifierActive = false;
                }
                const extraResult = module.apply(this.state, prevModule, 1);
                result.chips += extraResult.chips;
                result.mult += extraResult.mult;
                result.xmult += extraResult.xmult;
                result.heat += extraResult.heat;
                this.state.log.push(`[放大] ${module.name} 再次触发!`);
            }
        }

        if (this.state.amplifierCount <= 0) {
            this.state.amplifierCount = 0;
            this.state.amplifierActive = false;
        }

        if (result.heat > 0 && countRelic(this.state, 'insulation_tape') > 0 && !this.state.heatReductionUsed) {
            this.state.heat = Math.max(0, this.state.heat - 1);
            result.heat -= 1;
            this.state.heatReductionUsed = true;
            this.state.log.push('[绝缘胶带] 触发: 本次热量增加 -1');
        }

        if (result.heat < 0 && heatBeforeModule > 0 && this.state.heat === 0) {
            const reboundCount = countRelic(this.state, 'coolant_rebound');
            if (reboundCount > 0) {
                const bonus = reboundCount * 80;
                this.state.chips += bonus;
                result.chips += bonus;
                this.state.log.push(`[冷却反冲] 触发: +${bonus} 筹码`);
            }
        }

        const overcurrentCount = countRelic(this.state, 'overcurrent_meter');
        if (overcurrentCount > 0) {
            for (const threshold of [3, 6, 9]) {
                if (this.state.heat >= threshold && !this.state.overcurrentThresholdsTriggered.includes(threshold)) {
                    this.state.overcurrentThresholdsTriggered.push(threshold);
                    const gain = this.getMultGain(overcurrentCount);
                    this.state.mult += gain;
                    result.mult += gain;
                    this.state.log.push(`[过流计] 触发: +${gain} 倍率 (热量达到 ${threshold})`);
                }
            }
        }

        if (this.state.amplifierCount <= 0) {
            this.state.amplifierCount = 0;
            if (module.id !== 'amplifier') {
                this.state.amplifierActive = false;
            }
        }

        this.state.modulesThisRound.push(module);
        this.state.lastModule = module;

        const drawCount = this.state.modulesThisRound.length;
        const copperCount = countRelic(this.state, 'copper_conductor');
        if (copperCount > 0 && drawCount <= 2) {
            const bonus = copperCount * 10;
            this.state.chips += bonus;
            result.chips += bonus;
            this.state.log.push(`[铜制导片] 触发: +${bonus} 筹码 (第${drawCount}抽)`);
        }

        for (const relic of this.state.relics) {
            if (relic.id === 'superconductor_coil') {
                if (drawCount % 3 === 0) {
                    const gain = this.getMultGain(1);
                    this.state.mult += gain;
                    result.mult += gain;
                    this.state.log.push(`[超导线圈] 触发: +${gain} 倍率 (第${drawCount}抽)`);
                }
            }
        }

        if (module.id === 'coolant') {
            const coolantCacheCount = countRelic(this.state, 'coolant_cache');
            const coolantCount = this.state.modulesThisRound.filter(m => m.id === 'coolant').length;
            if (coolantCacheCount > 0 && coolantCount % 2 === 0) {
                this.state.xmult += coolantCacheCount;
                result.xmult += coolantCacheCount;
                this.state.log.push(`[冷却缓存] 触发: X倍率 +${coolantCacheCount} (第${coolantCount}个冷却)`);
            }
            const zeroPointCount = countRelic(this.state, 'zero_point_cooling');
            if (zeroPointCount > 0 && !this.state.zeroPointCoolingUsed && heatBeforeModule > 0 && this.state.heat === 0) {
                const gain = zeroPointCount * 3;
                this.state.xmult += gain;
                result.xmult += gain;
                this.state.zeroPointCoolingUsed = true;
                this.state.log.push(`[零点冷却] 触发: X倍率 +${gain}`);
            }
        }

        const shortCircuitCount = countRelic(this.state, 'short_circuit_reward');
        if (shortCircuitCount > 0 && heatBeforeDraw === 6) {
            const bonus = shortCircuitCount * 80;
            this.state.chips += bonus;
            result.chips += bonus;
            this.state.log.push(`[短路奖励] 触发: +${bonus} 筹码 (热量=6)`);
        }

        const spareWireCount = countRelic(this.state, 'spare_wire');
        if (spareWireCount > 0 && drawCount % 4 === 0) {
            const bonus = spareWireCount * 15;
            this.state.chips += bonus;
            result.chips += bonus;
            this.state.log.push(`[备用导线] 触发: +${bonus} 筹码 (第${drawCount}抽)`);
        }

        const oldFanCount = countRelic(this.state, 'old_fan');
        if (oldFanCount > 0 && drawCount % 5 === 0) {
            this.state.heat = Math.max(0, this.state.heat - oldFanCount);
            result.heat -= oldFanCount;
            this.state.log.push(`[旧式风扇] 触发: -${oldFanCount} 热量 (第${drawCount}抽)`);
        }

        const capacitorCount = countRelic(this.state, 'old_capacitor');
        if (capacitorCount > 0 && !this.state.capacitorUsed && this.state.mult > multBeforeEffects) {
            const gain = this.getMultGain(capacitorCount);
            this.state.mult += gain;
            result.mult += gain;
            this.state.capacitorUsed = true;
            this.state.log.push(`[废旧电容] 触发: +${gain} 倍率`);
        }

        const thinCopperWireCount = countRelic(this.state, 'thin_copper_wire');
        if (thinCopperWireCount > 0 && result.chips > 0) {
            const bonus = thinCopperWireCount * 5;
            this.state.chips += bonus;
            result.chips += bonus;
            this.state.log.push(`[细铜线] 触发: +${bonus} 筹码`);
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

        if (hasRelic(this.state, 'quantum_bypass') && !this.state.quantumBypassUsed) {
            this.state.quantumBypassUsed = true;
            if (Math.random() < 0.1) {
                this.state.overloaded = false;
                this.state.heat = 0;
                this.state.log.push('[量子旁路] 触发: 清空热量，保留所有筹码和倍率');
                this.updateAllUI();

                setTimeout(() => {
                    this.buttonsDisabled = false;
                    this.state.processing = false;
                }, 800);
                return;
            }
            this.state.log.push('[量子旁路] 未触发');
        }

        if (hasRelic(this.state, 'meltdown_protocol') && !this.state.meltdownProtocolUsed) {
            this.state.overloaded = false;
            this.state.meltdownProtocolUsed = true;
            this.state.heat = 5;
            this.state.xmult = Math.max(0, this.state.xmult - 1);
            this.state.log.push(`[熔断协议] 首次过载被阻止: 热量降为 5, X倍率 -1`);
            this.showOverloadEffect();
            this.updateAllUI();

            setTimeout(() => {
                this.buttonsDisabled = false;
                this.state.processing = false;
            }, 800);
            return;
        }

        const fuseRetainRate = getFuseRetainRate(this.state.relics);
        let retainedScore = 0;
        if (fuseRetainRate > 0) {
            retainedScore = Math.floor(calculateRoundScore(this.state) * fuseRetainRate);
            this.state.fuseRetainedScore = retainedScore;
            this.state.fuseTriggered = true;
        }

        this.state.roundScore = retainedScore;
        this.state.stageScore += retainedScore;
        this.state.totalScore += retainedScore;

        this.state.log.push('═══════════════════');
        this.state.log.push('💥 过载爆表！本回合失败！');
        if (retainedScore > 0) {
            this.state.log.push(`[保险丝] 保留 ${retainedScore.toLocaleString()} 分 (${Math.floor(fuseRetainRate * 100)}%)`);
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

        const preview = calculateSettlementPreview(this.state);
        const finalRoundScore = preview.previewFinalScore;

        if (hasRelic(this.state, 'extreme_paranoia') && this.state.heat === getExtremeParanoiaThreshold(this.state.maxHeat)) {
            const bonusXmult = 2 * countRelic(this.state, 'extreme_paranoia');
            this.state.xmult += bonusXmult;
            this.state.log.push(`[极限偏执] 触发: X倍率 +${bonusXmult} (热量=${this.state.heat})`);
        }

        if (hasRelic(this.state, 'idle_supercharge')) {
            const hasCoolant = this.state.modulesThisRound.some(m => m.id === 'coolant');
            if (!hasCoolant) {
                const bonus = countRelic(this.state, 'idle_supercharge');
                this.state.xmult += bonus;
                this.state.log.push(`[空转增压] 触发: X倍率 +${bonus}`);
            }
        }

        this.state.roundScore = finalRoundScore;
        if (finalRoundScore > this.state.maxRoundScore) {
            this.state.maxRoundScore = finalRoundScore;
        }
        this.state.stageScore += finalRoundScore;
        this.state.totalScore += finalRoundScore;

        this.state.log.push('═══════════════════');
        this.state.log.push(`结算: ${this.state.chips} × ${this.state.mult} × ${this.state.xmult} = ${preview.baseScore.toLocaleString()}`);
        preview.breakdownItems.forEach((item, index) => {
            if (index > 0) {
                this.state.log.push(`${item.name}: ${item.value.toLocaleString()}`);
            }
        });
        this.state.log.push(`本关累计: ${this.state.stageScore.toLocaleString()}`);
        this.state.log.push('═══════════════════');

        const previewFinalValue = document.getElementById('preview-final-value');
        if (previewFinalValue) {
            previewFinalValue.classList.remove('animating');
            void previewFinalValue.offsetWidth;
            previewFinalValue.classList.add('animating');
        }
        this.updateAllUI();

        const finalPreviewValue = document.getElementById('preview-final-value');
        if (finalPreviewValue) {
            finalPreviewValue.textContent = finalRoundScore.toLocaleString();
        }

        setTimeout(() => {
            this.buttonsDisabled = false;
            this.state.processing = false;
            this.finishRound();
        }, 1500);
    }

    private finishRound(): void {
        if (this.isPvp()) {
            this.finishPvpRound();
            return;
        }

        const target = getStageTarget(this.state.stage);

        if (this.state.stageScore >= target) {
            this.triggerStageClear();
            return;
        }

        this.state.round++;

        if (this.state.round > TOTAL_ROUNDS) {
            this.triggerGameOver();
        } else {
            resetRoundState(this.state);
            this.state.log.push('');
            this.state.log.push(`=== 第 ${this.state.round} 回合开始 ===`);
            this.updateAllUI();
        }
    }

    private finishPvpRound(): void {
        const match = this.state.pvpMatch!;
        if (match.stageRoundScores.length < this.state.round) {
            match.stageRoundScores.push(this.state.roundScore);
        }

        this.state.round++;

        if (this.state.round > TOTAL_ROUNDS) {
            this.state.log.push('');
            this.state.log.push('三回合结束，成绩已封存');
            this.scene.start('PvpWaitingScene', { state: this.state });
            return;
        }

        resetRoundState(this.state);
        this.state.log.push('');
        this.state.log.push(`=== 第 ${this.state.round} 回合开始 ===`);
        this.updateAllUI();
    }

    private triggerStageClear(): void {
        this.state.phase = GamePhase.STAGE_CLEAR;
        saveHistory(this.state);

        const goldReward = calculateGoldReward(this.state.stage, this.state.round - 1);
        const target = getStageTarget(this.state.stage);
        const overachievement = calculateOverachievementGold(this.state.stageScore, target);

        let totalGold = goldReward.total;
        if (overachievement.bonus > 0) {
            totalGold += overachievement.bonus;
        }

        this.state.gold += totalGold;
        this.state.goldReward = { ...goldReward, overachievement };

        this.state.log.push('');
        this.state.log.push('🎉🎉🎉');
        this.state.log.push(`第 ${this.state.stage} 关通过！`);
        this.state.log.push(`累计: ${this.state.stageScore.toLocaleString()} / ${target.toLocaleString()}`);
        if (overachievement.bonus > 0) {
            this.state.log.push(`超额突破奖励: +${overachievement.bonus} 金币`);
        }
        this.state.log.push(`获得金币: ${totalGold}`);
        this.state.log.push('🎉🎉🎉');

        this.scene.start('RelicScene', { state: this.state });
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
