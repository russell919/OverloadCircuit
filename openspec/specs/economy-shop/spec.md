# Economy & Shop Specification

## Purpose
定义《过载回路》中的金币获取、商店机制和遗物购买流程，确保经济系统平衡且有策略深度。

## Current Rules
- 金币来源：通关基础奖励、剩余回合返还、关卡进度奖励
- 金币用于购买遗物
- 商店展示可用遗物
- 已售出遗物不再显示
- 通关奖励随关卡进度递增
## Requirements
### Requirement: Gold Calculation
金币计算 MUST 准确无误。

#### Scenario: Stage Clear Gold
Given 当前关卡为第3关，剩余回合1
When 通关结算
Then 基础奖励3 + 剩余回合1 + 进度奖励2 = 6金币

### Requirement: Shop Display
商店 MUST 正确显示可用遗物。

#### Scenario: Shop Refresh
Given 玩家进入新关卡商店
When 查看商店界面
Then 显示3个随机可用遗物，包含不同稀有度

### Requirement: Purchase Validation
购买 MUST 检查金币是否足够。

#### Scenario: Insufficient Gold
Given 玩家有3金币，遗物售价5金币
When 玩家点击购买
Then 购买失败，显示提示信息

### Requirement: Progress Reward
金币奖励 MUST 随关卡进度递增。

#### Scenario: Progress Scaling
Given 第1关进度奖励为0，第5关进度奖励为4
When 在第5关通关
Then 获得4金币的进度奖励

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

## Acceptance Criteria
- 通关后正确获得金币
- 剩余回合正确转换为金币
- 商店正确显示可用遗物
- 购买后金币正确扣除
- 已购买遗物不再出现
- 进度奖励正确递增
