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
        amplifierActive: false,
        amplifierCount: 0,
        history: loadHistory(),
        log: [],
        overloaded: false,
        fuseTriggered: false,
        fuseRetainedScore: 0,
        processing: false
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
