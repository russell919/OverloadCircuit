import { Module, ModuleResult, GameState } from '../types';
import { COLORS } from '../constants';

export interface ModuleInfo {
    id: string;
    name: string;
    color: number;
    weight: number;
    description: string;
    effectText: string;
    apply(state: GameState, prevModule: Module | null, amplifier: number): ModuleResult;
}

export const BlueCoreModule: ModuleInfo = {
    id: 'blue_core',
    name: '蓝芯',
    color: COLORS.CHIP_BLUE,
    weight: 25,
    description: '筹码',
    effectText: '+30 筹码',
    apply(state: GameState): ModuleResult {
        const blueAddict = state.relics.filter(r => r.id === 'blue_addict').length;
        const bonus = blueAddict * 15;
        const hasHighPressureBlueBridge = state.relics.some(r => r.id === 'high_pressure_blue_bridge');
        if (hasHighPressureBlueBridge && state.heat < Math.ceil(state.maxHeat * 0.5)) {
            return {
                chips: 0,
                mult: 0,
                xmult: 0,
                heat: 0,
                log: '抽到蓝芯，但[恶魔协议]使低热量蓝芯无效',
                isOverload: false
            };
        }
        const pressureMultiplier = hasHighPressureBlueBridge ? 3 : 1;
        const gainedChips = (30 + bonus) * pressureMultiplier;
        state.chips += gainedChips;
        return {
            chips: gainedChips,
            mult: 0,
            xmult: 0,
            heat: 0,
            log: `抽到蓝芯 +${gainedChips} 筹码${bonus > 0 ? ` (蓝色成瘾+${bonus})` : ''}${pressureMultiplier > 1 ? ' (恶魔协议+200%)' : ''}`,
            isOverload: false
        };
    }
};

export const RedCoreModule: ModuleInfo = {
    id: 'red_core',
    name: '红芯',
    color: COLORS.CHIP_RED,
    weight: 25,
    description: '倍率',
    effectText: '+1 倍率',
    apply(state: GameState): ModuleResult {
        const redAddict = state.relics.filter(r => r.id === 'red_addict').length;
        const lowVoltageBonus = state.heat < 5 ? state.relics.filter(r => r.id === 'low_voltage_resistor').length : 0;
        const bonus = redAddict + lowVoltageBonus;
        const gain = 1 + bonus;
        state.mult += gain;
        return {
            chips: 0,
            mult: gain,
            xmult: 0,
            heat: 0,
            log: `抽到红芯 +${gain} 倍率${bonus > 0 ? ` (额外+${bonus})` : ''}`,
            isOverload: false
        };
    }
};

export const YellowCoreModule: ModuleInfo = {
    id: 'yellow_core',
    name: '黄芯',
    color: COLORS.CHIP_YELLOW,
    weight: 20,
    description: '高热筹码',
    effectText: '+60 筹码 / +2 热量',
    apply(state: GameState): ModuleResult {
        // 每次应用黄芯时，重新计算稳压器剩余抵消次数
        // 这样可以确保即使在场景切换后也能正确工作
        if (state.stabilizerRemaining === undefined || state.stabilizerRemaining < 0) {
            state.stabilizerRemaining = state.relics.filter(r => r.id === 'stabilizer').length;
        }
        
        let heatBonus = 2;
        // 检查稳压器是否还能抵消热量
        if (state.stabilizerRemaining > 0) {
            heatBonus = 0;
            state.stabilizerRemaining--;
        }
        state.chips += 60;
        state.heat += heatBonus;
        return {
            chips: 60,
            mult: 0,
            xmult: 0,
            heat: heatBonus,
            log: `抽到黄芯 +60 筹码${heatBonus > 0 ? `, +${heatBonus} 热量` : ', 稳压器抵消热量'}`,
            isOverload: false
        };
    }
};

export const CoolantModule: ModuleInfo = {
    id: 'coolant',
    name: '冷却',
    color: COLORS.CHIP_COOL,
    weight: 18,
    description: '散热',
    effectText: '-3 热量',
    apply(state: GameState): ModuleResult {
        const heatBefore = state.heat;
        const heatReduce = 3 + (state.relics.some(r => r.id === 'cooling_inertia_wheel') ? 1 : 0);
        let chipBonus = 0;
        const finCount = state.relics.filter(r => r.id === 'heat_fin').length;
        if (finCount > 0) {
            chipBonus = finCount * 10;
            state.chips += chipBonus;
        }
        state.heat = Math.max(0, state.heat - heatReduce);
        const actualReduction = heatBefore - state.heat;
        const condensingCount = state.relics.filter(r => r.id === 'condensing_battery').length;
        if (condensingCount > 0 && actualReduction > 0) {
            const condensingBonus = actualReduction * 20 * condensingCount;
            chipBonus += condensingBonus;
            state.chips += condensingBonus;
        }
        return {
            chips: chipBonus,
            mult: 0,
            xmult: 0,
            heat: -heatReduce,
            log: `抽到冷却 -${heatReduce} 热量${chipBonus > 0 ? `, +${chipBonus}筹码` : ''}`,
            isOverload: false
        };
    }
};

export const CopyModule: ModuleInfo = {
    id: 'copy',
    name: '复制',
    color: COLORS.CHIP_COPY,
    weight: 10,
    description: '复制',
    effectText: '重复上一个模块',
    apply(state: GameState, prevModule: Module | null): ModuleResult {
        const mirrorCount = state.relics.filter(r => r.id === 'mirror_drive').length;
        const mirrorBonus = mirrorCount * 20;
        if (!prevModule || prevModule.id === 'copy') {
            if (mirrorBonus > 0) {
                state.chips += mirrorBonus;
            }
            return {
                chips: mirrorBonus,
                mult: 0,
                xmult: 0,
                heat: 0,
                log: `抽到复制（无上一个模块可复制）${mirrorBonus > 0 ? ` (镜像驱动+${mirrorBonus}筹码)` : ''}`,
                isOverload: false
            };
        }
        const result = prevModule.apply(state, null, 1);
        if (state.relics.some(r => r.id === 'mirror_furnace') && (prevModule.id === 'blue_core' || prevModule.id === 'red_core')) {
            const furnaceResult = prevModule.apply(state, null, 1);
            result.chips += furnaceResult.chips;
            result.mult += furnaceResult.mult;
            result.xmult += furnaceResult.xmult;
            result.heat += furnaceResult.heat;
        }
        if (mirrorBonus > 0) {
            state.chips += mirrorBonus;
        }
        let logMsg = `复制触发：重复 ${prevModule.name}`;
        if (mirrorCount > 0) {
            logMsg += ` (镜像驱动+${mirrorBonus}筹码)`;
        }
        return {
            chips: result.chips + mirrorBonus,
            mult: result.mult,
            xmult: result.xmult,
            heat: result.heat,
            log: logMsg,
            isOverload: false
        };
    }
};

export const AmplifierModule: ModuleInfo = {
    id: 'amplifier',
    name: '放大',
    color: COLORS.CHIP_AMP,
    weight: 10,
    description: '强化',
    effectText: '下一个模块 x2',
    apply(state: GameState): ModuleResult {
        state.amplifierActive = true;
        state.amplifierCount += 1;
        return {
            chips: 0,
            mult: 0,
            xmult: 0,
            heat: 0,
            log: '抽到放大，下一个模块效果 x2',
            isOverload: false
        };
    }
};

export const FissionModule: ModuleInfo = {
    id: 'fission',
    name: '裂变',
    color: COLORS.CHIP_FISSION,
    weight: 7,
    description: 'X倍率',
    effectText: 'X倍率 +1',
    apply(state: GameState): ModuleResult {
        state.xmult += 1;
        return {
            chips: 0,
            mult: 0,
            xmult: 1,
            heat: 0,
            log: '抽到裂变 X倍率 +1',
            isOverload: false
        };
    }
};

export const ALL_MODULES: ModuleInfo[] = [
    BlueCoreModule,
    RedCoreModule,
    YellowCoreModule,
    CoolantModule,
    CopyModule,
    AmplifierModule,
    FissionModule
];

export function getWeightedRandomModule(excludeCopy = false): ModuleInfo {
    const modules = excludeCopy ? ALL_MODULES.filter(m => m.id !== 'copy') : ALL_MODULES;
    const totalWeight = modules.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    for (const module of modules) {
        random -= module.weight;
        if (random <= 0) {
            return module;
        }
    }
    return modules[modules.length - 1];
}

export function getAllModules(): ModuleInfo[] {
    return ALL_MODULES;
}
