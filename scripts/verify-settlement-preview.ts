import { GameState, GamePhase } from '../src/types';
import { calculateSettlementPreview } from '../src/store';

function runTests(): void {
    console.log('=== 结算预览一致性验证 ===\n');

    let passed = 0;
    let failed = 0;

    const testCases = [
        {
            name: '无任何结算修正',
            state: createTestState({ chips: 150, mult: 4, xmult: 2, heat: 3 }),
            expectedBase: 1200,
            expectedFinal: 1200,
            expectBreakdownItems: 1
        },
        {
            name: '危险停手 +15% (heat=7/10)',
            state: createTestState({ chips: 100, mult: 10, xmult: 1, heat: 7 }),
            expectedBase: 1000,
            expectedFinal: 1150,
            expectBreakdownItems: 2
        },
        {
            name: '危险停手 +30% (heat=8/10)',
            state: createTestState({ chips: 100, mult: 10, xmult: 1, heat: 8 }),
            expectedBase: 1000,
            expectedFinal: 1300,
            expectBreakdownItems: 2
        },
        {
            name: '危险停手 +60% (heat=9/10)',
            state: createTestState({ chips: 150, mult: 4, xmult: 2, heat: 9 }),
            expectedBase: 1200,
            expectedFinal: 1920,
            expectBreakdownItems: 2
        },
        {
            name: '缓冲核心 heatLimit=12, heat=11 (+60%)',
            state: createTestState({ chips: 100, mult: 10, xmult: 1, heat: 11, maxHeat: 12 }),
            expectedBase: 1000,
            expectedFinal: 1600,
            expectBreakdownItems: 2
        },
        {
            name: '过载时不触发危险停手奖励',
            state: createTestState({ chips: 100, mult: 10, xmult: 1, heat: 10, overloaded: true }),
            expectedBase: 1000,
            expectedFinal: 1000,
            expectBreakdownItems: 1
        },
        {
            name: '热量6/10，无危险停手奖励',
            state: createTestState({ chips: 100, mult: 10, xmult: 1, heat: 6 }),
            expectedBase: 1000,
            expectedFinal: 1000,
            expectBreakdownItems: 1
        },
        {
            name: '有极限偏执遗物 (heat=9)',
            state: createTestState({
                chips: 100, mult: 10, xmult: 1, heat: 9,
                relics: [{ id: 'extreme_paranoia', name: '极限偏执', description: '', stackable: false, rarity: 'rare', price: 6 }]
            }),
            expectedBase: 1000,
            expectedFinal: 3000,
            expectBreakdownItems: 3
        }
    ];

    for (const test of testCases) {
        const preview = calculateSettlementPreview(test.state);

        const baseMatch = preview.baseScore === test.expectedBase;
        const finalMatch = preview.previewFinalScore === test.expectedFinal;
        const breakdownMatch = preview.breakdownItems.length >= test.expectBreakdownItems;

        const allPassed = baseMatch && finalMatch && breakdownMatch;

        if (allPassed) {
            console.log(`✅ ${test.name}`);
            console.log(`   基础分: ${preview.baseScore} (预期: ${test.expectedBase})`);
            console.log(`   最终分: ${preview.previewFinalScore} (预期: ${test.expectedFinal})`);
            console.log(`   分解项: ${preview.breakdownItems.length} 项`);
            passed++;
        } else {
            console.log(`❌ ${test.name}`);
            console.log(`   基础分: ${preview.baseScore} (预期: ${test.expectedBase}) - ${baseMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   最终分: ${preview.previewFinalScore} (预期: ${test.expectedFinal}) - ${finalMatch ? 'PASS' : 'FAIL'}`);
            console.log(`   分解项: ${preview.breakdownItems.length} (预期 >= ${test.expectBreakdownItems}) - ${breakdownMatch ? 'PASS' : 'FAIL'}`);
            failed++;
        }
        console.log();
    }

    console.log('=== breakdownItems 内容验证 ===');
    const test1 = createTestState({ chips: 150, mult: 4, xmult: 2, heat: 9 });
    const preview1 = calculateSettlementPreview(test1);
    console.log('Heat=9 时的分解明细:');
    preview1.breakdownItems.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.name}: ${item.value} (条件: ${item.condition})`);
    });

    console.log();
    console.log(`=== 验证结果: ${passed} 通过, ${failed} 失败 ===`);

    if (failed > 0) {
        process.exit(1);
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
