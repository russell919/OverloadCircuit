import { GameState, GamePhase, Relic } from '../src/types';
import { createInitialState, calculateSettlementPreview } from '../src/store';
import { ExtremeParanoia, getShopRelics, ALL_RELICS } from '../src/relics';

function runTests(): void {
    console.log('=== 过载回路 Bug 修复验证 ===\n');

    let passed = 0;
    let failed = 0;

    // ==========================================
    // 验证 1: 极限偏执遗物 (heat === 9 才触发)
    // ==========================================
    console.log('--- 验证 1: 极限偏执遗物 ---');

    // Test 1.1: heat = 8, 不应该触发
    const state8 = createTestState({
        chips: 100, mult: 2, xmult: 1, heat: 8,
        relics: [ExtremeParanoia as Relic]
    });
    const preview8 = calculateSettlementPreview(state8);
    const noTriggerAt8 = preview8.breakdownItems.length === 1;
    
    if (noTriggerAt8) {
        console.log('✅ heat=8: 无额外增幅 (正确)');
        passed++;
    } else {
        console.log('❌ heat=8: 不应触发极限偏执');
        failed++;
    }

    // Test 1.2: heat = 9, 应该触发
    const state9 = createTestState({
        chips: 100, mult: 2, xmult: 1, heat: 9,
        relics: [ExtremeParanoia as Relic]
    });
    const preview9 = calculateSettlementPreview(state9);
    const triggerAt9 = preview9.breakdownItems.length > 1;
    const conditionTextOk = preview9.breakdownItems.some(item => 
        item.name === '极限偏执' && item.condition === '热量 = 9'
    );
    
    if (triggerAt9 && conditionTextOk) {
        console.log('✅ heat=9: 正确触发极限偏执，条件文本正确');
        console.log(`   基础分: ${preview9.baseScore}, 最终分: ${preview9.previewFinalScore}`);
        passed++;
    } else {
        console.log('❌ heat=9: 触发失败或条件文本错误');
        failed++;
    }

    // Test 1.3: heat = 10, 不应该触发
    const state10 = createTestState({
        chips: 100, mult: 2, xmult: 1, heat: 10,
        relics: [ExtremeParanoia as Relic]
    });
    const preview10 = calculateSettlementPreview(state10);
    const noTriggerAt10 = preview10.breakdownItems.length === 1;
    
    if (noTriggerAt10) {
        console.log('✅ heat=10: 无额外增幅 (正确)\n');
        passed++;
    } else {
        console.log('❌ heat=10: 不应触发极限偏执\n');
        failed++;
    }

    // ==========================================
    // 验证 2: 商店商品数量 (始终显示 3 个)
    // ==========================================
    console.log('--- 验证 2: 商店商品数量 ---');

    // Test 2.1: 第 10 关商店，无已拥有遗物
    const shop1 = getShopRelics(10, []);
    const has3Items1 = shop1.length === 3;
    
    if (has3Items1) {
        console.log('✅ 第10关商店: 显示 3 个商品');
        passed++;
    } else {
        console.log(`❌ 第10关商店: 只显示了 ${shop1.length} 个商品`);
        failed++;
    }

    // Test 2.2: 拥有所有遗物时，应该有占位符
    const allOwnedIds = ALL_RELICS.map(r => r.id);
    const shop2 = getShopRelics(10, allOwnedIds);
    const has3Items2 = shop2.length === 3;
    
    if (has3Items2) {
        console.log('✅ 拥有所有遗物: 仍显示 3 个槽位\n');
        passed++;
    } else {
        console.log(`❌ 拥有所有遗物: 只显示了 ${shop2.length} 个商品\n`);
        failed++;
    }

    // ==========================================
    // 总结
    // ==========================================
    console.log('=== 验证结果 ===');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    
    if (failed > 0) {
        process.exit(1);
    } else {
        console.log('\n🎉 所有验证通过！');
    }
}

function createTestState(overrides: Partial<GameState>): GameState {
    return {
        phase: GamePhase.PLAYING,
        stage: 1,
        stageScore: 0,
        totalScore: 0,
        round: 1,
        chips: 0,
        mult: 1,
        xmult: 1,
        heat: 0,
        maxHeat: 10,
        roundScore: 0,
        maxRoundScore: 0,
        modulesThisRound: [],
        lastModule: null,
        relics: [],
        coreChip: null,
        amplifierActive: false,
        amplifierCount: 0,
        stabilizerRemaining: 0,
        history: { highestStage: 0, highestRoundScore: 0, highestTotalScore: 0 },
        log: [],
        overloaded: false,
        fuseTriggered: false,
        fuseRetainedScore: 0,
        processing: false,
        gold: 0,
        ...overrides
    };
}

runTests();
