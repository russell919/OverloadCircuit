import { GameState, HistoryRecord, Relic, GamePhase } from './types';
import { HEAT_MAX, TOTAL_ROUNDS, STORAGE_KEYS } from './constants';

export function createInitialState(): GameState {
    return {
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
        processing: false,
        gold: 0
    };
}

export function resetRoundState(state: GameState): void {
    state.chips = 0;
    state.mult = 1;
    state.xmult = 1;
    state.heat = 0;
    state.modulesThisRound = [];
    state.lastModule = null;
    state.amplifierActive = false;
    state.amplifierCount = 0;
    state.overloaded = false;
    state.fuseTriggered = false;
    state.fuseRetainedScore = 0;
    state.processing = false;

    // 初始化稳压器剩余抵消次数
    state.stabilizerRemaining = state.relics.filter(r => r.id === 'stabilizer').length;

    if (state.coreChip) {
        switch (state.coreChip.id) {
            case 'buffer':
                state.maxHeat = HEAT_MAX + 2;
                break;
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
}

export function resetStageState(state: GameState): void {
    state.stage += 1;
    state.stageScore = 0;
    state.round = 1;
    state.phase = GamePhase.PLAYING;

    if (state.coreChip && state.coreChip.id === 'buffer') {
        state.maxHeat = HEAT_MAX + 2;
    }

    resetRoundState(state);
}

export function calculateRoundScore(state: GameState): number {
    return Math.floor(state.chips * state.mult * state.xmult);
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

export function calculateOverachievementGold(stageScore: number, targetScore: number): { tier: number, bonus: number } {
    const ratio = stageScore / targetScore;

    if (ratio >= 4.0) {
        return { tier: 3, bonus: 3 };
    } else if (ratio >= 2.5) {
        return { tier: 2, bonus: 2 };
    } else if (ratio >= 1.5) {
        return { tier: 1, bonus: 1 };
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
    if (relic.stackable || !state.relics.find(r => r.id === relic.id)) {
        state.relics.push(relic);
    }
}

export function hasRelic(state: GameState, relicId: string): boolean {
    return state.relics.some(r => r.id === relicId);
}

export function countRelic(state: GameState, relicId: string): number {
    return state.relics.filter(r => r.id === relicId).length;
}