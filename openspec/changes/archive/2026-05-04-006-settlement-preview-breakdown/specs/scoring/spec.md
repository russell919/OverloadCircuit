## ADDED Requirements

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
