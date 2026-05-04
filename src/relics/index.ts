import { Relic } from '../types';

export const SuperconductorCoil: Relic = {
    id: 'superconductor_coil',
    name: '超导线圈',
    description: '每抽取第3个模块时，额外获得 +1 倍率',
    stackable: true,
    rarity: 'common',
    price: 4
};

export const HeatFin: Relic = {
    id: 'heat_fin',
    name: '散热鳍片',
    description: '每回合第一次抽到冷却时，额外获得 +25 筹码',
    stackable: true,
    rarity: 'common',
    price: 4
};

export const OutOfControlCircuit: Relic = {
    id: 'out_of_control_circuit',
    name: '失控回路',
    description: '当热量 >= 7 时，本回合获得的筹码翻倍',
    stackable: true,
    rarity: 'rare',
    price: 6
};

export const Stabilizer: Relic = {
    id: 'stabilizer',
    name: '稳压器',
    description: '每个稳压器能使一个黄芯的额外热量失效',
    stackable: true,
    rarity: 'common',
    price: 4
};

export const MirrorDrive: Relic = {
    id: 'mirror_drive',
    name: '镜像驱动',
    description: '复制模块会额外再触发一次',
    stackable: true,
    rarity: 'epic',
    price: 8
};

export const RedAddict: Relic = {
    id: 'red_addict',
    name: '红色成瘾',
    description: '每个红芯额外提供 +1 倍率',
    stackable: true,
    rarity: 'rare',
    price: 6
};

export const BlueAddict: Relic = {
    id: 'blue_addict',
    name: '蓝色成瘾',
    description: '每个蓝芯额外提供 +15 筹码',
    stackable: true,
    rarity: 'common',
    price: 4
};

export const ExtremeParanoia: Relic = {
    id: 'extreme_paranoia',
    name: '极限偏执',
    description: '当热量 = 9 时停手结算，本回合额外获得 +2 X倍率',
    stackable: true,
    rarity: 'rare',
    price: 6
};

export const Fuse: Relic = {
    id: 'fuse',
    name: '保险丝',
    description: '过载时，保留本回合 35% 分数',
    stackable: true,
    rarity: 'common',
    price: 4
};

export const IdleSupercharge: Relic = {
    id: 'idle_supercharge',
    name: '空转增压',
    description: '如果本回合没有抽到冷却，停手时额外获得 +1 X倍率',
    stackable: true,
    rarity: 'rare',
    price: 6
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
    IdleSupercharge
];

export function getRandomRelics(count: number): Relic[] {
    const shuffled = [...ALL_RELICS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

export function getAllRelics(): Relic[] {
    return ALL_RELICS;
}

export function getRelicDescription(relic: Relic): string {
    return relic.description;
}

export function getShopRelics(stage: number): Relic[] {
    const result: Relic[] = [];

    const getRelicByRarity = (rarity: string): Relic | null => {
        const relics = ALL_RELICS.filter(r => r.rarity === rarity);
        if (relics.length > 0) {
            return relics[Math.floor(Math.random() * relics.length)];
        }
        return null;
    };

    const getRandomRelic = (): Relic => {
        return ALL_RELICS[Math.floor(Math.random() * ALL_RELICS.length)];
    };

    for (let i = 0; i < 3; i++) {
        let targetRarity: string;
        const rand = Math.random();

        if (stage <= 3) {
            if (i === 0) targetRarity = 'common';
            else if (i === 1) targetRarity = 'common';
            else targetRarity = rand < 0.8 ? 'common' : 'rare';
        } else if (stage <= 6) {
            if (i === 0) targetRarity = 'common';
            else if (i === 1) targetRarity = rand < 0.7 ? 'common' : 'rare';
            else targetRarity = rand < 0.7 ? 'rare' : 'epic';
        } else {
            if (i === 0) targetRarity = rand < 0.5 ? 'common' : 'rare';
            else if (i === 1) targetRarity = rand < 0.6 ? 'rare' : 'epic';
            else targetRarity = rand < 0.3 ? 'rare' : 'epic';
        }

        let relic = getRelicByRarity(targetRarity);
        if (!relic) relic = getRandomRelic();
        
        if (!result.find(r => r.id === relic.id)) {
            result.push(relic);
        } else {
            const otherRelics = ALL_RELICS.filter(r => !result.find(x => x.id === r.id));
            if (otherRelics.length > 0) {
                result.push(otherRelics[0]);
            } else {
                result.push(relic);
            }
        }
    }

    return result;
}