import { Relic } from '../types';

export const SuperconductorCoil: Relic = {
    id: 'superconductor_coil',
    name: '超导线圈',
    description: '每抽第3个模块，额外 +1 mult',
    stackable: true
};

export const HeatFin: Relic = {
    id: 'heat_fin',
    name: '散热鳍片',
    description: '每回合第一次抽到冷却时，额外 +25 chips',
    stackable: true
};

export const OutOfControlCircuit: Relic = {
    id: 'out_of_control_circuit',
    name: '失控回路',
    description: 'heat >= 7 时，本回合获得的 chips 翻倍',
    stackable: true
};

export const Stabilizer: Relic = {
    id: 'stabilizer',
    name: '稳压器',
    description: '每回合第一次黄芯不增加额外 heat',
    stackable: true
};

export const MirrorDrive: Relic = {
    id: 'mirror_drive',
    name: '镜像驱动',
    description: '复制模块额外再触发一次',
    stackable: true
};

export const RedAddict: Relic = {
    id: 'red_addict',
    name: '红色成瘾',
    description: '每个红芯额外 +1 mult',
    stackable: true
};

export const BlueAddict: Relic = {
    id: 'blue_addict',
    name: '蓝色成瘾',
    description: '每个蓝芯额外 +15 chips',
    stackable: true
};

export const ExtremeParanoia: Relic = {
    id: 'extreme_paranoia',
    name: '极限偏执',
    description: '在 heat = 9 时停手结算，本回合 xmult 额外 +2',
    stackable: true
};

export const Fuse: Relic = {
    id: 'fuse',
    name: '保险丝',
    description: '过载时保留本回合 35% 分数',
    stackable: true
};

export const IdleSupercharge: Relic = {
    id: 'idle_supercharge',
    name: '空转增压',
    description: '若本回合没有抽到冷却，停手时 xmult +1',
    stackable: true
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
