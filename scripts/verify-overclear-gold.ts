#!/usr/bin/env tsx
import { calculateOverachievementGold, calculateGoldReward } from '../src/store';

console.log('=== 005 超额通关金币奖励验证脚本 ===');
console.log('');

console.log('--- 测试 1: 超额通关金币计算 ---');

const testCases = [
    { target: 1000, score: 1499, expectedTier: 0, expectedBonus: 0, desc: '不足150%' },
    { target: 1000, score: 1500, expectedTier: 1, expectedBonus: 1, desc: '150%' },
    { target: 1000, score: 2499, expectedTier: 1, expectedBonus: 1, desc: '249.9%' },
    { target: 1000, score: 2500, expectedTier: 2, expectedBonus: 2, desc: '250%' },
    { target: 1000, score: 3999, expectedTier: 2, expectedBonus: 2, desc: '399.9%' },
    { target: 1000, score: 4000, expectedTier: 3, expectedBonus: 3, desc: '400%' },
    { target: 900, score: 3360, expectedTier: 2, expectedBonus: 2, desc: '373.3% (截图案例)' },
];

let allPassed = true;

for (const test of testCases) {
    const result = calculateOverachievementGold(test.score, test.target);
    const pass = result.tier === test.expectedTier && result.bonus === test.expectedBonus;
    allPassed = allPassed && pass;
    
    console.log(`测试 ${test.desc}:`);
    console.log(`  target=${test.target}, score=${test.score}, ratio=${(test.score/test.target*100).toFixed(1)}%`);
    console.log(`  预期: tier=${test.expectedTier}, bonus=${test.expectedBonus}`);
    console.log(`  实际: tier=${result.tier}, bonus=${result.bonus}`);
    console.log(`  ${pass ? '✅ 通过' : '❌ 失败'}`);
    console.log('');
}

console.log('--- 测试 2: 完整金币奖励计算 ---');

const stage = 7;
const currentRound = 1;
const targetScore = 900;
const stageScore = 3360;

const goldReward = calculateGoldReward(stage, currentRound);
const overachievement = calculateOverachievementGold(stageScore, targetScore);
const totalGold = goldReward.total + overachievement.bonus;

console.log(`第${stage}关，第${currentRound}回合通关:`);
console.log(`  基础奖励: ${goldReward.base}`);
console.log(`  剩余回合奖励: ${goldReward.remainingRounds}`);
console.log(`  进度奖励: ${goldReward.progress}`);
console.log(`  基础合计: ${goldReward.total}`);
console.log(`  超额突破奖励: +${overachievement.bonus}`);
console.log(`  最终合计: ${totalGold}`);

const expectedTotal = 11;
const totalPass = totalGold === expectedTotal;
allPassed = allPassed && totalPass;
console.log(`  预期合计: ${expectedTotal}`);
console.log(`  ${totalPass ? '✅ 通过' : '❌ 失败'}`);
console.log('');

console.log('=== 验证结果 ===');
console.log(allPassed ? '✅ 全部测试通过' : '❌ 部分测试失败');
console.log('');
console.log('【注意】本脚本验证纯函数计算逻辑');
console.log('实际游戏中还需验证 UI 是否显示正确的 totalGold');
