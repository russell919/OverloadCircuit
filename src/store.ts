import { GameState, HistoryRecord, Relic, GamePhase, SettlementPreview, PvpMatchState } from './types';
import { HEAT_MAX, TOTAL_ROUNDS, STORAGE_KEYS } from './constants';
import { getExtremeParanoiaThreshold, getFuseRetainRate, getOutOfControlThreshold } from './relics';

function calculateMaxHeat(state: GameState): number {
    const coreBonus = state.coreChip?.id === 'buffer' ? 2 : 0;
    const relicBonus = state.relics.filter(r => r.id === 'buffer_core').length * 2;
    return HEAT_MAX + coreBonus + relicBonus;
}

export function createInitialState(): GameState {
    return {
        gameMode: 'pve',
        phase: GamePhase.PLAYING,
        stage: 1,
        stageScore: 0,
        totalScore: 0,
        round: 1,
        chips: 0,
        mult: 1,
        xmult: 1,
        heat: 0,
        maxHeat: HEAT_MAX,
        roundScore: 0,
        maxRoundScore: 0,
        maxStageScore: 0,
        modulesThisRound: [],
        lastModule: null,
        relics: [],
        coreChip: null,
        amplifierActive: false,
        amplifierCount: 0,
        stabilizerRemaining: 0,
        history: loadHistory(),
        log: [],
        overloaded: false,
        fuseTriggered: false,
        fuseRetainedScore: 0,
        meltdownProtocolUsed: false,
        quantumBypassUsed: false,
        overloadEchoPending: 0,
        lastRoundOverloaded: false,
        blueArrayProgress: 0,
        zeroPointCoolingUsed: false,
        heatReductionUsed: false,
        capacitorUsed: false,
        overcurrentThresholdsTriggered: [],
        processing: false,
        gold: 0
    };
}

export function createPvpInitialState(match: PvpMatchState): GameState {
    const state = createInitialState();
    state.gameMode = 'pvp';
    state.coreChip = null;
    state.gold = 96;
    state.pvpMatch = match;
    return state;
}

export function resetRoundState(state: GameState): void {
    state.chips = 0;
    state.mult = 1;
    state.xmult = 1;
    state.heat = 0;
    state.roundScore = 0;
    state.modulesThisRound = [];
    state.lastModule = null;
    state.amplifierActive = false;
    state.amplifierCount = 0;
    state.overloaded = false;
    state.fuseTriggered = false;
    state.fuseRetainedScore = 0;
    state.meltdownProtocolUsed = false;
    state.quantumBypassUsed = false;
    state.zeroPointCoolingUsed = false;
    state.heatReductionUsed = false;
    state.capacitorUsed = false;
    state.overcurrentThresholdsTriggered = [];
    state.processing = false;

    // 初始化稳压器剩余抵消次数
    state.stabilizerRemaining = state.relics.filter(r => r.id === 'stabilizer').length;

    state.maxHeat = calculateMaxHeat(state);

    if (state.coreChip) {
        switch (state.coreChip.id) {
            case 'amplify':
                state.mult = 2;
                break;
            case 'storage':
                state.chips = 40;
                break;
            case 'fission':
                state.xmult = 2;
                break;
        }
    }

    const oldCapacitorCount = state.relics.filter(r => r.id === 'old_capacitor').length;
    if (oldCapacitorCount > 0) {
        state.mult += oldCapacitorCount * 2;
    }

    const stablePowerCount = state.relics.filter(r => r.id === 'stable_power').length;
    if (stablePowerCount > 0) {
        const bonus = stablePowerCount * (state.lastRoundOverloaded ? 50 : 20);
        state.chips += bonus;
        applyBlueArrayProgress(state, bonus);
        state.log.push(`[稳定电源] 触发: +${bonus} 筹码`);
    }

    if (state.overloadEchoPending > 0) {
        state.xmult += state.overloadEchoPending;
        state.log.push(`[过载残响] 触发: 本回合初始 X倍率 +${state.overloadEchoPending}`);
        state.overloadEchoPending = 0;
    }
}

export function resetStageState(state: GameState): void {
    state.stage += 1;
    state.stageScore = 0;
    state.round = 1;
    state.phase = GamePhase.PLAYING;

    resetRoundState(state);
}

export function calculateRoundScore(state: GameState): number {
    return Math.floor(state.chips * state.mult * state.xmult);
}

export function applyBlueArrayProgress(state: GameState, chipsGained: number): number {
    const blueArrayCount = state.relics.filter(r => r.id === 'blue_array').length;
    if (blueArrayCount <= 0 || chipsGained <= 0) return 0;

    state.blueArrayProgress += chipsGained;
    const triggers = Math.floor(state.blueArrayProgress / 150);
    if (triggers <= 0) return 0;

    state.blueArrayProgress %= 150;
    const gain = triggers * blueArrayCount;
    state.mult += gain;
    state.log.push(`[蓝芯阵列] 触发: 获得 ${chipsGained} 筹码，倍率 +${gain}`);
    return gain;
}

export function calculateDangerStopBonus(state: GameState): { bonus: number, multiplier: number, label: string } | null {
    if (state.overloaded || state.heat === 0) {
        return null;
    }

    const heatRatio = state.heat / state.maxHeat;

    if (heatRatio >= 0.9) {
        return { bonus: 0, multiplier: 0.6, label: '高压停手奖励: +60%' };
    } else if (heatRatio >= 0.8) {
        return { bonus: 0, multiplier: 0.3, label: '危险停手奖励: +30%' };
    } else if (heatRatio >= 0.7) {
        return { bonus: 0, multiplier: 0.15, label: '危险停手奖励: +15%' };
    }

    return null;
}

export function calculateOverachievementGold(stageScore: number, targetScore: number): { tier: number, bonus: number, extraRelicChoices?: number } {
    const ratio = stageScore / targetScore;

    if (ratio >= 5.0) {
        return { tier: 4, bonus: 12, extraRelicChoices: 1 };
    } else if (ratio >= 4.0) {
        return { tier: 3, bonus: 12 };
    } else if (ratio >= 2.5) {
        return { tier: 2, bonus: 8 };
    } else if (ratio >= 1.5) {
        return { tier: 1, bonus: 4 };
    }

    return { tier: 0, bonus: 0 };
}

export function calculateGoldReward(stage: number, currentRound: number): { base: number, remainingRounds: number, progress: number, total: number } {
    const base = 3;
    const remainingRounds = TOTAL_ROUNDS - currentRound;
    const remainingReward = remainingRounds * 2;
    const progressReward = Math.floor((stage - 1) / 3);
    const total = base + remainingReward + progressReward;

    return {
        base,
        remainingRounds: remainingReward,
        progress: progressReward,
        total
    };
}

function loadHistory(): HistoryRecord {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch {
    }
    return {
        highestStage: 0,
        highestRoundScore: 0,
        highestTotalScore: 0
    };
}

export function saveHistory(state: GameState): void {
    const history = state.history;
    if (state.stage > history.highestStage) {
        history.highestStage = state.stage;
    }
    if (state.roundScore > history.highestRoundScore) {
        history.highestRoundScore = state.roundScore;
    }
    if (state.totalScore > history.highestTotalScore) {
        history.highestTotalScore = state.totalScore;
    }
    try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
    }
}

export function addRelic(state: GameState, relic: Relic): void {
    const maxCountByRelic: Record<string, number> = {
        buffer_core: 5,
        reinforced_fuse: 5
    };
    const maxCount = maxCountByRelic[relic.id] ?? (relic.stackable ? Number.POSITIVE_INFINITY : 1);
    if (countRelic(state, relic.id) < maxCount) {
        state.relics.push(relic);
        if (relic.id === 'buffer_core') {
            state.maxHeat = calculateMaxHeat(state);
        }
    }
}

export function hasRelic(state: GameState, relicId: string): boolean {
    return state.relics.some(r => r.id === relicId);
}

export function countRelic(state: GameState, relicId: string): number {
    return state.relics.filter(r => r.id === relicId).length;
}

export function calculateSettlementPreview(state: GameState): SettlementPreview {
    const breakdownItems: SettlementPreview['breakdownItems'] = [];
    const appliedModifiers: string[] = [];
    
    let effectiveMult = state.mult;
    let effectiveXmult = state.xmult;
    
    breakdownItems.push({
        name: '基础构筑分',
        condition: `${state.chips} × ${state.mult} × ${state.xmult}`,
        value: calculateRoundScore(state)
    });

    if (hasRelic(state, 'extreme_paranoia') && state.heat === getExtremeParanoiaThreshold(state.maxHeat)) {
        const bonusXmult = 2 * countRelic(state, 'extreme_paranoia');
        effectiveXmult += bonusXmult;
        const bonusScore = Math.floor(state.chips * state.mult * bonusXmult);
        breakdownItems.push({
            name: '极限偏执',
            condition: `热量 = ${getExtremeParanoiaThreshold(state.maxHeat)}`,
            value: bonusScore,
            description: `X倍率 +${bonusXmult}`
        });
        appliedModifiers.push('extreme_paranoia');
    }

    if (hasRelic(state, 'critical_charge') && state.heat === state.maxHeat - 1) {
        const bonusMult = countRelic(state, 'critical_charge') * 2;
        effectiveMult += bonusMult;
        breakdownItems.push({
            name: '临界电荷',
            condition: `热量 = ${state.maxHeat - 1}`,
            value: Math.floor(state.chips * bonusMult * effectiveXmult),
            description: `倍率 +${bonusMult}`
        });
        appliedModifiers.push('critical_charge');
    }

    const baseScore = Math.floor(state.chips * effectiveMult * effectiveXmult);
    let previewFinalScore = baseScore;
    let riskStopBonusRate = 0;

    if (hasRelic(state, 'cheap_thermal_paste') && state.heat <= 3) {
        const bonus = countRelic(state, 'cheap_thermal_paste') * 40;
        const bonusScore = Math.floor(bonus * effectiveMult * effectiveXmult);
        previewFinalScore += bonusScore;
        breakdownItems.push({
            name: '廉价散热膏',
            condition: `热量 ${state.heat} <= 3`,
            value: bonusScore,
            description: `筹码 +${bonus}`
        });
        appliedModifiers.push('cheap_thermal_paste');
    }

    if (hasRelic(state, 'out_of_control_circuit') && state.heat >= getOutOfControlThreshold(state.maxHeat)) {
        const multiplier = countRelic(state, 'out_of_control_circuit') * 0.5;
        const bonusScore = Math.floor(state.chips * multiplier * effectiveMult * effectiveXmult);
        previewFinalScore += bonusScore;
        breakdownItems.push({
            name: '失控回路',
            condition: `热量 ${state.heat}/${state.maxHeat}`,
            value: bonusScore,
            description: `筹码 +${Math.floor(multiplier * 100)}%`
        });
        appliedModifiers.push('out_of_control_circuit');
    }

    if (hasRelic(state, 'overclock_core') && state.heat >= Math.floor(state.maxHeat * 0.9)) {
        const overclockCount = countRelic(state, 'overclock_core');
        const bonusScore = Math.floor(state.chips * effectiveMult * effectiveXmult * overclockCount);
        previewFinalScore += bonusScore;
        breakdownItems.push({
            name: '超频核心',
            condition: `热量 ${state.heat}/${state.maxHeat}`,
            value: bonusScore,
            description: `筹码 +${overclockCount * 100}%`
        });
        appliedModifiers.push('overclock_core');
    }

    const fuseRetainRate = getFuseRetainRate(state.relics);
    if (state.overloaded && fuseRetainRate > 0 && !state.fuseTriggered) {
        const retainedScore = Math.floor(baseScore * fuseRetainRate);
        previewFinalScore += retainedScore;
        breakdownItems.push({
            name: '保险丝',
            condition: `过载保留 ${Math.floor(fuseRetainRate * 100)}%`,
            value: retainedScore,
            description: `保留分数`
        });
        appliedModifiers.push('fuse');
    }

    if (!state.overloaded && hasRelic(state, 'danger_stop_protocol')) {
        const dangerBonus = calculateDangerStopBonus(state);
        if (dangerBonus) {
            riskStopBonusRate = dangerBonus.multiplier;
            const bonusScore = Math.floor(baseScore * dangerBonus.multiplier);
            previewFinalScore += bonusScore;
            breakdownItems.push({
                name: dangerBonus.label.split(':')[0],
                condition: `热量 ${state.heat}/${state.maxHeat}`,
                value: bonusScore,
                description: `+${Math.floor(dangerBonus.multiplier * 100)}%`
            });
            appliedModifiers.push(`risk_stop_bonus_${Math.floor(dangerBonus.multiplier * 100)}%`);
        }
    }

    return {
        baseScore,
        previewFinalScore,
        breakdownItems,
        appliedModifiers,
        riskStopBonusRate,
        effectiveMult,
        effectiveXmult
    };
}
