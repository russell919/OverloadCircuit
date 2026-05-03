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

export type Rarity = 'common' | 'rare' | 'epic';

export interface Relic {
    id: string;
    name: string;
    description: string;
    stackable: boolean;
    rarity: Rarity;
    price: number;
}

export interface RelicResult {
    chips?: number;
    mult?: number;
    xmult?: number;
    heat?: number;
    log?: string;
    trigger?: boolean;
}

export type CoreChipId = 'buffer' | 'amplify' | 'storage' | 'fission';

export interface CoreChip {
    id: CoreChipId;
    name: string;
    description: string;
}

export enum GamePhase {
    MENU = 'menu',
    PLAYING = 'playing',
    ROUND_SETTLE = 'round_settle',
    STAGE_CLEAR = 'stage_clear',
    GAME_OVER = 'game_over'
}

export interface GoldRewardBreakdown {
    base: number;
    remainingRounds: number;
    progress: number;
    total: number;
    overachievement?: { tier: number; bonus: number };
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
    coreChip: CoreChip | null;
    amplifierActive: boolean;
    amplifierCount: number;
    stabilizerRemaining: number;
    history: HistoryRecord;
    log: string[];
    overloaded: boolean;
    fuseTriggered: boolean;
    fuseRetainedScore: number;
    processing: boolean;
    gold: number;
    goldReward?: GoldRewardBreakdown;
}

export interface ShopItem {
    relic: Relic;
    sold: boolean;
}

export interface HistoryRecord {
    highestStage: number;
    highestRoundScore: number;
    highestTotalScore: number;
}