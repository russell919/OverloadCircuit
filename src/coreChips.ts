import { CoreChip } from './types';

export const BufferCoreChip: CoreChip = {
    id: 'buffer',
    name: '缓冲核心',
    description: '每回合热量上限 +2'
};

export const AmplifyCoreChip: CoreChip = {
    id: 'amplify',
    name: '增幅核心',
    description: '每回合开始时，初始倍率 = 2'
};

export const StorageCoreChip: CoreChip = {
    id: 'storage',
    name: '储能核心',
    description: '每回合开始时，初始筹码 = 40'
};

export const FissionCoreChip: CoreChip = {
    id: 'fission',
    name: '裂变核心',
    description: '每回合开始时，初始X倍率 = 2'
};

export const ALL_CORE_CHIPS: CoreChip[] = [
    BufferCoreChip,
    AmplifyCoreChip,
    StorageCoreChip,
    FissionCoreChip
];

export function getAllCoreChips(): CoreChip[] {
    return ALL_CORE_CHIPS;
}