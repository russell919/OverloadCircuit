#!/usr/bin/env tsx
import { createInitialState, calculateRoundScore, calculateDangerStopBonus, calculateOverachievementGold } from '../src/store';
import { GamePhase } from '../src/types';

console.log('=== 005 Risk Stop Identity 验证脚本 ===');
console.log('');

console.log('--- 测试 1: 危险停手奖励 ---');
console.log('');

const testCases = [
    { name: 'heatLimit=10, heat=6, expectedBonus: null, desc: '热量低于70%无奖励' },
    { name: 'heatLimit=10, heat=7, expectedBonus: 0.15, desc: '70%-80% → +15%' },
    { name: 'heatLimit=10, heat=8, expectedBonus: 0.30, desc: '80%-90% → +30%' },
    { name: 'heatLimit=10, heat=9, expectedBonus: 0.60, desc: '90%+ → +60%' },
    { name: 'heatLimit=12, heat=11, expectedBonus: 0.60, desc: '缓冲核心提升上限' },
];

for (const test of testCases) {
    const state = createInitialState();
    state.maxHeat = test.name.includes('12') ? 12 : 10;
    state.heat = test.heat;
    state.chips = 100;
    state.mult = 1;
    state.xmult = 1;
    
    const baseScore = calculateRoundScore(state);
    const bonusResult = calculateDangerStopBonus(state);
    
    let actualBonus = bonusResult?.multiplier ?? null;
    
    console.log(`测试 ${test.desc}: ${test.name}, heat=${test.heat}/${state.maxHeat} → 基准分=${baseScore}`);
    console.log(`  预期奖励比例: ${test.expectedBonus ?? '无'}, 实际奖励比例: ${actualBonus ?? '无'}`);
    
    let pass = actualBonus === test.expectedBonus;
    console.log(`  ${pass ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
}

console.log('--- 测试 2: 过载不触发危险停手奖励 ---');
const stateOverload = createInitialState();
stateOverload.overloaded = true;
stateOverload.heat = 9;
stateOverload.maxHeat = 10;
const baseScoreOverload = calculateRoundScore(stateOverload);
const bonusOverload = calculateDangerStopBonus(stateOverload);
console.log(`过载状态: overloaded=true → 危险停手奖励: ${bonusOverload ? '❌ 不应该有' : '✅ 正确没有'}
    ```

console.log('');

console.log('--- 测试 3: 超额通关金币奖励 ---');

const goldTestCases = [
    { target: 1000, score: 1400, expectedTier: 0, expectedBonus: 0, desc: '不足150% → +0' },
    { target: 1000, score: 1500, expectedTier: 1, expectedBonus: 1, desc: '150% → +1' },
    { target: 1000, score: 2500, expectedTier: 2, expectedBonus: 2, desc: '250% → +2' },
    { target: 1000, score: 4000, expectedTier: 3, expectedBonus: 3, desc: '400% → +3' },
    { target: 1000, score: 5000, expectedTier: 3, expectedBonus: 3, desc: '500% → +3' },
];

for (const test of goldTestCases) {
    const result = calculateOverachievementGold(test.score, test.target);
    console.log(`目标 ${test.target} → 累计 ${test.score} (${Math.round((test.score/test.target*100)}% → ${result.tier} 档 → +${result.bonus} 金币`);
    console.log(`  ${result.tier === test.expectedTier && result.bonus === test.expectedBonus ? '✅ 通过' : '❌ 失败'} (预期: tier=${test.expectedTier}, bonus=${test.expectedBonus}; 实际: tier=${result.tier}, bonus=${result.bonus})`);
    console.log('');
}

console.log('=== 验证脚本运行完成 ===');
console.log('');
console.log('【注意】这只是验证纯函数的测试');
console.log('实际游戏中还需要验证：');
console.log('1. 危险停手奖励是否真正加入 roundScore');
console.log('2. maxRoundScore 是否更新');
console.log('3. 日志是否显示');
