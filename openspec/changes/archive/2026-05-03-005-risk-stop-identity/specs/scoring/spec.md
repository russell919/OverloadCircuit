## ADDED Requirements

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
