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

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

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

export type GameMode = 'pve' | 'pvp';

export interface GoldRewardBreakdown {
    base: number;
    remainingRounds: number;
    progress: number;
    total: number;
    overachievement?: { tier: number; bonus: number };
}

export interface PvpPlayerInfo {
    playerId: string;
    playerName: string;
}

export interface PvpStagePlayerResult extends PvpPlayerInfo {
    roundScores: number[];
    totalScore: number;
}

export interface PvpStageResult {
    stage: number;
    players: PvpStagePlayerResult[];
    winnerPlayerIds: string[];
    matchScore: Record<string, number>;
    gameOver: boolean;
    matchWinnerId: string | null;
}

export interface PvpGoldRewardBreakdown {
    base: number;
    loserCompensation: number;
    lagCompensation: number;
    lagPoints: number;
    total: number;
}

export interface PvpMatchState {
    matchId: string;
    playerId: string;
    playerName: string;
    opponentId: string;
    opponentName: string;
    matchScore: Record<string, number>;
    stageRoundScores: number[];
    rewardedStages: number[];
    lastStageResult?: PvpStageResult;
    lastGoldReward?: PvpGoldRewardBreakdown;
}

export interface GameState {
    gameMode: GameMode;
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
    meltdownProtocolUsed: boolean;
    quantumBypassUsed: boolean;
    zeroPointCoolingUsed: boolean;
    heatReductionUsed: boolean;
    capacitorUsed: boolean;
    overcurrentThresholdsTriggered: number[];
    processing: boolean;
    gold: number;
    goldReward?: GoldRewardBreakdown;
    pvpMatch?: PvpMatchState;
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

export interface SettlementBreakdownItem {
    name: string;
    condition: string;
    value: number;
    description?: string;
    multiplier?: number;
}

export interface SettlementPreview {
    baseScore: number;
    previewFinalScore: number;
    breakdownItems: SettlementBreakdownItem[];
    appliedModifiers: string[];
    riskStopBonusRate: number;
    effectiveMult: number;
    effectiveXmult: number;
}
