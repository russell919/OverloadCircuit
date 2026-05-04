## ADDED Requirements

### Requirement: Over-clear Gold Bonus
通关时系统 MUST 根据本关累计分与目标分的比例给予额外金币奖励。

#### Scenario: Over-clear Bonus Tier 1
Given targetScore=1000, stageScore=1600
When 通关结算
Then extraGold=1

#### Scenario: Over-clear Bonus Tier 2
Given targetScore=1000, stageScore=2600
When 通关结算
Then extraGold=2

#### Scenario: Over-clear Bonus Tier 3
Given targetScore=1000, stageScore=4100
When 通关结算
Then extraGold=3

#### Scenario: No Over-clear Bonus
Given targetScore=1000, stageScore=1400
When 通关结算
Then extraGold=0

#### Scenario: Highest Tier Only
Given targetScore=1000, stageScore=5000
When 通关结算
Then extraGold=3 (不叠加，取最高档)

### Requirement: Bonus Integration
超额通关金币奖励 MUST 正确加入实际金币奖励总额。

#### Scenario: Gold Reward Calculation
Given baseGold=5, extraGold=2
When 计算通关奖励
Then totalGold=7
