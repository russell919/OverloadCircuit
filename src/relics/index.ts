import { Relic, Rarity } from '../types';

export const RELIC_RARITY_COLORS: Record<Rarity, string> = {
    common: '#44ff88',
    rare: '#4488ff',
    epic: '#aa44ff',
    legendary: '#ffb000'
};

export const RELIC_RARITY_TEXT: Record<Rarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说'
};

export const RELIC_RARITY_PRICES: Record<Rarity, number> = {
    common: 8,
    rare: 16,
    epic: 24,
    legendary: 32
};

const RELIC_REWARD_RARITY_WEIGHTS: Array<{ rarity: Rarity; weight: number }> = [
    { rarity: 'common', weight: 42 },
    { rarity: 'rare', weight: 31 },
    { rarity: 'epic', weight: 20 },
    { rarity: 'legendary', weight: 7 }
];

const RELIC_RARITY_ORDER: Record<Rarity, number> = {
    legendary: 0,
    epic: 1,
    rare: 2,
    common: 3
};

function getRelicPrice(rarity: Rarity): number {
    return RELIC_RARITY_PRICES[rarity];
}

export const SuperconductorCoil: Relic = {
    id: 'superconductor_coil',
    name: '超导线圈',
    description: '每抽取第3个模块时，额外获得 +1 倍率',
    stackable: true,
    rarity: 'epic',
    price: getRelicPrice('epic')
};

export const HeatFin: Relic = {
    id: 'heat_fin',
    name: '散热鳍片',
    description: '每回合第一次抽到冷却时，额外获得 +25 筹码',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const OutOfControlCircuit: Relic = {
    id: 'out_of_control_circuit',
    name: '失控回路',
    description: '当热量 >= 80% 总热量时，本回合获得筹码增加一倍',
    stackable: true,
    rarity: 'epic',
    price: getRelicPrice('epic')
};

export const Stabilizer: Relic = {
    id: 'stabilizer',
    name: '稳压器',
    description: '每个稳压器能使一个黄芯的额外热量失效',
    stackable: true,
    rarity: 'epic',
    price: getRelicPrice('epic')
};

export const MirrorDrive: Relic = {
    id: 'mirror_drive',
    name: '镜像驱动',
    description: '复制模块会提供 20 筹码',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const RedAddict: Relic = {
    id: 'red_addict',
    name: '红色成瘾',
    description: '每个红芯额外提供 +1 倍率',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const BlueAddict: Relic = {
    id: 'blue_addict',
    name: '蓝色成瘾',
    description: '每个蓝芯额外提供 +15 筹码',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const ExtremeParanoia: Relic = {
    id: 'extreme_paranoia',
    name: '极限偏执',
    description: '当热量 = 90% 总热量时，本回合额外获得 +2 X倍率',
    stackable: true,
    rarity: 'epic',
    price: getRelicPrice('epic')
};

export const Fuse: Relic = {
    id: 'fuse',
    name: '保险丝',
    description: '过载时，保留本回合 35% 分数',
    stackable: false,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const ReinforcedFuse: Relic = {
    id: 'reinforced_fuse',
    name: '强化保险丝',
    description: '保险丝分数保留效果 +3%',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const IdleSupercharge: Relic = {
    id: 'idle_supercharge',
    name: '空转增压',
    description: '如果本回合没有抽到冷却，停手时额外获得 +1 X倍率',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const BufferCore: Relic = {
    id: 'buffer_core',
    name: '缓冲核心',
    description: '每回合热量上限 +2',
    stackable: true,
    rarity: 'legendary',
    price: getRelicPrice('legendary')
};

export const MeltdownProtocol: Relic = {
    id: 'meltdown_protocol',
    name: '熔断协议',
    description: '首次过载时不结束回合，热量降为 5，但本回合 X倍率 -1',
    stackable: false,
    rarity: 'legendary',
    price: getRelicPrice('legendary')
};

export const CopperConductor: Relic = {
    id: 'copper_conductor',
    name: '铜制导片',
    description: '每回合前 2 次抽取额外 +10 筹码',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const CoolantCache: Relic = {
    id: 'coolant_cache',
    name: '冷却缓存',
    description: '每抽到第 2 个冷却模块时，额外获得 +1 X倍率',
    stackable: true,
    rarity: 'epic',
    price: getRelicPrice('epic')
};

export const ShortCircuitReward: Relic = {
    id: 'short_circuit_reward',
    name: '短路奖励',
    description: '当热量正好为 6 时抽取模块，额外 +80 筹码',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const InsulationTape: Relic = {
    id: 'insulation_tape',
    name: '绝缘胶带',
    description: '每回合第一次热量增加时，少增加 1 点热量',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const OldCapacitor: Relic = {
    id: 'old_capacitor',
    name: '废旧电容',
    description: '每回合第一次获得倍率时，额外 +1 倍率',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const OvercurrentMeter: Relic = {
    id: 'overcurrent_meter',
    name: '过流计',
    description: '热量每达到 3/6/9 时，各获得 +1 倍率',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const CheapThermalPaste: Relic = {
    id: 'cheap_thermal_paste',
    name: '廉价散热膏',
    description: '停手时若热量 <= 3，额外 +40 筹码',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const SpareWire: Relic = {
    id: 'spare_wire',
    name: '备用导线',
    description: '每抽取第 4 个模块时，+15 筹码',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const CoolantRebound: Relic = {
    id: 'coolant_rebound',
    name: '冷却反冲',
    description: '冷却模块把热量降到 0 时，额外 +80 筹码',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const CriticalCharge: Relic = {
    id: 'critical_charge',
    name: '临界电荷',
    description: '停手时若热量正好低于过载 1 点，额外 +2 倍率',
    stackable: true,
    rarity: 'rare',
    price: getRelicPrice('rare')
};

export const OldFan: Relic = {
    id: 'old_fan',
    name: '旧式风扇',
    description: '每 5 次抽取，热量 -1',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const ThinCopperWire: Relic = {
    id: 'thin_copper_wire',
    name: '细铜线',
    description: '每次获得筹码时，额外 +5 筹码',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const LowVoltageResistor: Relic = {
    id: 'low_voltage_resistor',
    name: '低压电阻',
    description: '热量低于 4 时，红芯额外 +1 倍率',
    stackable: true,
    rarity: 'common',
    price: getRelicPrice('common')
};

export const OverclockCore: Relic = {
    id: 'overclock_core',
    name: '超频核心',
    description: '热量 >= 90% 时不会获得危险停手奖励，但所有倍率收益翻倍',
    stackable: true,
    rarity: 'legendary',
    price: getRelicPrice('legendary')
};

export const ZeroPointCooling: Relic = {
    id: 'zero_point_cooling',
    name: '零点冷却',
    description: '首次冷却到 0 热量时，本回合 X倍率 +3',
    stackable: true,
    rarity: 'legendary',
    price: getRelicPrice('legendary')
};

export const QuantumBypass: Relic = {
    id: 'quantum_bypass',
    name: '量子旁路',
    description: '每回合第一次过载时，有 10% 概率清空热量且保留所有筹码和倍率',
    stackable: false,
    rarity: 'legendary',
    price: getRelicPrice('legendary')
};

export const ALL_RELICS: Relic[] = [
    SuperconductorCoil,
    HeatFin,
    OutOfControlCircuit,
    Stabilizer,
    MirrorDrive,
    RedAddict,
    BlueAddict,
    ExtremeParanoia,
    Fuse,
    ReinforcedFuse,
    IdleSupercharge,
    BufferCore,
    MeltdownProtocol,
    CopperConductor,
    CoolantCache,
    ShortCircuitReward,
    InsulationTape,
    OldCapacitor,
    OvercurrentMeter,
    CheapThermalPaste,
    SpareWire,
    CoolantRebound,
    CriticalCharge,
    OldFan,
    ThinCopperWire,
    LowVoltageResistor,
    OverclockCore,
    ZeroPointCooling,
    QuantumBypass
];

export function getRandomRelics(count: number, ownedRelics: Relic[] = []): Relic[] {
    const result: Relic[] = [];

    for (let i = 0; i < count; i++) {
        const relic = getWeightedRandomRewardRelic(result, ownedRelics);
        if (relic) {
            result.push(relic);
        }
    }

    return result;
}

export function getAllRelics(): Relic[] {
    return ALL_RELICS;
}

export function getRelicDescription(relic: Relic, maxHeat = 10): string {
    if (relic.id === 'out_of_control_circuit') {
        return `当热量 >= 80% 总热量(${Math.floor(maxHeat * 0.8)})时，本回合获得筹码增加一倍`;
    }
    if (relic.id === 'extreme_paranoia') {
        return `当热量 = 90% 总热量(${Math.floor(maxHeat * 0.9)})时，本回合额外获得 +2 X倍率`;
    }
    return relic.description;
}

export function getOutOfControlThreshold(maxHeat: number): number {
    return Math.floor(maxHeat * 0.8);
}

export function getExtremeParanoiaThreshold(maxHeat: number): number {
    return Math.floor(maxHeat * 0.9);
}

export function getFuseRetainRate(relics: Relic[]): number {
    if (!relics.some(relic => relic.id === 'fuse')) {
        return 0;
    }
    const reinforcedCount = relics.filter(relic => relic.id === 'reinforced_fuse').length;
    return 0.35 + reinforcedCount * 0.03;
}

export function isUniqueRelic(relic: Relic): boolean {
    return !relic.stackable;
}

export function getRelicsForRules(ownedRelics: Relic[]): Relic[] {
    const ownedIds = new Set(ownedRelics.map(relic => relic.id));

    return [...ALL_RELICS].sort((a, b) => {
        const ownedDiff = Number(ownedIds.has(b.id)) - Number(ownedIds.has(a.id));
        if (ownedDiff !== 0) return ownedDiff;

        const rarityDiff = RELIC_RARITY_ORDER[a.rarity] - RELIC_RARITY_ORDER[b.rarity];
        if (rarityDiff !== 0) return rarityDiff;

        return a.name.localeCompare(b.name, 'zh-CN');
    });
}

function getAvailableRelics(ownedRelics: Relic[] = []): Relic[] {
    const hasFuse = ownedRelics.some(relic => relic.id === 'fuse');
    return ALL_RELICS.filter(relic => {
        if (relic.id === 'fuse') return !hasFuse;
        if (relic.id === 'reinforced_fuse') return hasFuse;
        return relic.stackable || !ownedRelics.some(owned => owned.id === relic.id);
    });
}

function rollRewardRarity(): Rarity {
    const totalWeight = RELIC_REWARD_RARITY_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of RELIC_REWARD_RARITY_WEIGHTS) {
        roll -= item.weight;
        if (roll < 0) {
            return item.rarity;
        }
    }

    return 'common';
}

function getWeightedRandomRewardRelic(excluded: Relic[], ownedRelics: Relic[]): Relic | null {
    const excludedIds = new Set(excluded.map(relic => relic.id));
    const rarity = rollRewardRarity();
    const availableRelics = getAvailableRelics(ownedRelics);
    const candidates = availableRelics.filter(relic => relic.rarity === rarity && !excludedIds.has(relic.id));

    if (candidates.length > 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    const fallback = availableRelics.filter(relic => !excludedIds.has(relic.id));
    if (fallback.length > 0) {
        return fallback[Math.floor(Math.random() * fallback.length)];
    }

    return null;
}

export function getShopRelics(stage: number, ownedRelics: Relic[] = []): Relic[] {
    const result: Relic[] = [];
    const availableRelics = getAvailableRelics(ownedRelics);

    const getRelicByRarity = (rarity: Rarity): Relic | null => {
        const relics = availableRelics.filter(r => r.rarity === rarity);
        if (relics.length > 0) {
            return relics[Math.floor(Math.random() * relics.length)];
        }
        return null;
    };

    const getRandomRelic = (): Relic => {
        return availableRelics[Math.floor(Math.random() * availableRelics.length)];
    };

    for (let i = 0; i < 3; i++) {
        const targetRarity = rollRewardRarity();

        let relic = getRelicByRarity(targetRarity);
        if (!relic) relic = getRandomRelic();
        
        if (!result.find(r => r.id === relic.id)) {
            result.push(relic);
        } else {
            const otherRelics = availableRelics.filter(r => !result.find(x => x.id === r.id));
            if (otherRelics.length > 0) {
                result.push(otherRelics[0]);
            } else {
                result.push(relic);
            }
        }
    }

    return result;
}
