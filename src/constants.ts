export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const HEAT_MAX = 10;
export const TOTAL_ROUNDS = 3;
export const STAGE_1_TARGET = 400;
export const STAGE_SCALING = 1.5;

export const COLORS = {
    BACKGROUND: 0x0a0a12,
    PANEL_BG: 0x12121f,
    PANEL_BORDER: 0x2a2a4e,
    TEXT_PRIMARY: 0xffffff,
    TEXT_SECONDARY: 0xaaaacc,
    CHIP_BLUE: 0x4488ff,
    CHIP_RED: 0xff4444,
    CHIP_YELLOW: 0xffaa22,
    CHIP_COOL: 0x44ffaa,
    CHIP_COPY: 0xaa44ff,
    CHIP_AMP: 0xff88aa,
    CHIP_FISSION: 0x44ffaa,
    HEAT_LOW: 0x44ff44,
    HEAT_MEDIUM: 0xffaa22,
    HEAT_HIGH: 0xff4444,
    OVERLOAD: 0xff0000,
    SUCCESS: 0x44ff88,
    BUTTON_PRIMARY: 0x4488ff,
    BUTTON_SECONDARY: 0x6666aa,
    RELIC_GLOW: 0xffdd44
};

export const STORAGE_KEYS = {
    HISTORY: 'overload_circuit_history'
};

export function getStageTarget(stage: number): number {
    return Math.floor(STAGE_1_TARGET * Math.pow(STAGE_SCALING, stage - 1));
}
