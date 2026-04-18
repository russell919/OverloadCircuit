export interface ModuleResult {
    chips: number;
    mult: number;
    xmult: number;
    heat: number;
    log: string;
    isOverload: boolean;
}

export interface Module {
    id: string;
    name: string;
    color: number;
    weight: number;
    description: string;
    effectText: string;
    apply(state: GameState, prevModule: Module | null, amplifier: number): ModuleResult;
}

export interface Relic {
    id: string;
    name: string;
    description: string;
    stackable: boolean;
}

export interface RelicResult {
    chips?: number;
    mult?: number;
    xmult?: number;
    heat?: number;
    log?: string;
    trigger?: boolean;
}

export enum GamePhase {
    MENU = 'menu',
    PLAYING = 'playing',
    ROUND_SETTLE = 'round_settle',
    STAGE_CLEAR = 'stage_clear',
    GAME_OVER = 'game_over'
}

export interface GameState {
    phase: GamePhase;
    stage: number;
    stageScore: number;
    totalScore: number;
    round: number;
    chips: number;
    mult: number;
    xmult: number;
    heat: number;
    maxHeat: number;
    roundScore: number;
    maxRoundScore: number;
    modulesThisRound: Module[];
    lastModule: Module | null;
    relics: Relic[];
    amplifierActive: boolean;
    amplifierCount: number;
    history: HistoryRecord;
    log: string[];
    overloaded: boolean;
    fuseTriggered: boolean;
    fuseRetainedScore: number;
    processing: boolean;
}

export interface HistoryRecord {
    highestStage: number;
    highestRoundScore: number;
    highestTotalScore: number;
}
