# Scoring System Specification

## Purpose
定义《过载回路》中的筹码、倍率、X倍率、热量和过载机制，以及分数结算公式，确保计分系统准确且具有风险奖励机制。

## Current Rules
- 本回合得分 = 筹码 × 倍率 × X倍率
- 回合开始初始化筹码、倍率、X倍率、热量
- 玩家可抽取模块或停手
- 热量达到上限则过载
- 过载时本回合得分清零，进入下回合或失败
## Requirements
### Requirement: Round Score Calculation
回合得分 MUST 按照公式正确计算。

#### Scenario: Basic Calculation
Given 筹码=100, 倍率=2, X倍率=3
When 结算时
Then 回合得分 = 100 × 2 × 3 = 600

### Requirement: Heat System
热量系统 MUST 正确工作，达到上限触发过载。

#### Scenario: Overload Trigger
Given 热量上限为10，当前热量为9
When 玩家抽取黄芯增加2热量
Then 热量达到11超过上限，触发过载

### Requirement: Overload Penalty
过载时 MUST 清零本回合得分。

#### Scenario: Overload Effect
Given 本回合已获得500分，热量达到上限
When 触发过载
Then 本回合得分清零，不加入累计分

### Requirement: Score Accumulation
回合得分 MUST 正确累加到关卡和总分。

#### Scenario: Score Tracking
Given 当前关卡累计分为800，回合得分为300
When 结算时
Then 关卡累计分更新为1100

### Requirement: Risk Stop Bonus
玩家主动停手结算时，系统 MUST 根据当前热量与热量上限的比例给予最终分数奖励。

#### Scenario: Risk Stop Bonus at 70%
Given heatLimit=10, heat=7, baseScore=1000
When 玩家主动停手结算
Then finalRoundScore = 1000 + (1000 × 0.15) = 1150

#### Scenario: Risk Stop Bonus at 80%
Given heatLimit=10, heat=8, baseScore=1000
When 玩家主动停手结算
Then finalRoundScore = 1000 + (1000 × 0.30) = 1300

#### Scenario: Risk Stop Bonus at 90%
Given heatLimit=10, heat=9, baseScore=1000
When 玩家主动停手结算
Then finalRoundScore = 1000 + (1000 × 0.60) = 1600

#### Scenario: Risk Stop Bonus with Extended Heat Limit
Given heatLimit=12, heat=11, baseScore=1000
When 玩家主动停手结算
Then finalRoundScore = 1000 + (1000 × 0.60) = 1600

#### Scenario: No Bonus Below 70%
Given heatLimit=10, heat=6, baseScore=1000
When 玩家主动停手结算
Then finalRoundScore = 1000 (无奖励)

#### Scenario: No Bonus on Overload
Given heatLimit=10, heat=10, baseScore=1000
When 触发过载
Then finalRoundScore = 0 (不触发危险停手奖励)

### Requirement: Bonus Application
危险停手奖励 MUST 正确应用到最终回合得分，并加入关卡累计分。

#### Scenario: Bonus Added to Stage Score
Given baseScore=1000, heatRatio=0.85, stageScore=500
When 玩家主动停手结算
Then bonusScore=300, stageScore更新为800

### Requirement: Settlement Preview Consistency
预览分数与实际结算分数 MUST 使用同一套计算逻辑，确保一致性。

#### Scenario: Preview Matches Actual
Given 玩家当前状态为 chips=150, mult=4, xmult=2, heat=9, heatLimit=10
When 查看"现在停手可得"预览
Then 预览分数 = 基础分(1200) + 危险停手奖励(720) = 1920
And 实际点击停手结算后，roundScore 也等于 1920

#### Scenario: Relic Effects Included
Given 玩家拥有"极限偏执"遗物且热量=9
When 查看"现在停手可得"预览
Then 预览分数必须包含遗物触发的 X倍率加成
And 实际结算分数与预览一致

### Requirement: Settlement Breakdown Display
结算分解明细 MUST 清晰展示各项影响因素。

#### Scenario: Breakdown Components
Given 玩家当前状态为 chips=150, mult=4, xmult=2, heat=9
When 查看结算分解明细
Then 显示：
  - 基础构筑分：150 × 4 × 2 = 1200
  - 危险停手奖励：热量 9/10，+60%，+720
  - 预计最终结算：1920

#### Scenario: Multiple Relic Effects
Given 玩家拥有多个停手触发遗物
When 查看结算分解明细
Then 每项遗物影响单独列出
And 显示触发条件和数值变化

### Requirement: Settlement Animation Alignment
结算动画 MUST 基于预览区域展开，而非独立计算。

#### Scenario: Animation Uses Preview
Given 玩家点击停手结算
When 播放结算动画
Then 动画围绕"现在停手可得"区域展开
And 最终显示的分数与预览一致

#### Scenario: No Independent Calculation
Given 预览分数为 1920
When 执行停手结算
Then 动画不重新计算分数
And 使用预览时的计算结果

## Acceptance Criteria
- 分数计算正确
- 热量系统正常工作
- 过载时正确惩罚玩家
- 结算显示清晰
- 分数正确累加
