# Relics System Specification

## Purpose
定义《过载回路》中遗物的获取、效果和稀有度系统，确保遗物能够改变玩家的收益结构，提供策略选择。

## Current Rules
- 遗物来自商店购买
- 遗物会改变收益结构
- 遗物有不同稀有度和价格
- 遗物与核心芯片独立，不互相混淆
- 遗物在整局游戏中持续生效

## Requirements

### Requirement: Relic Purchase
玩家 MUST 能够从商店购买遗物。

#### Scenario: Successful Purchase
Given 玩家有10金币，商店中有售价5金币的遗物
When 玩家点击购买
Then 金币减少5，遗物加入玩家遗物列表

### Requirement: Relic Effect Activation
遗物效果 MUST 在游戏过程中正确触发。

#### Scenario: Relic Trigger
Given 玩家拥有"极限偏执"遗物(热量>=9时X倍率+2)
When 热量达到9
Then X倍率增加2

### Requirement: Unique Purchase
已购买的遗物 MUST 从商店移除，不再出现。

#### Scenario: Purchased Relic Removal
Given 玩家购买了某个遗物
When 进入下一关商店
Then 该遗物不再显示在商店中

### Requirement: Separation from Core Chips
遗物 MUST 与核心芯片严格区分，不能混淆。

#### Scenario: Core Chip vs Relic
Given 玩家选择了缓冲核心(提高热量上限)
When 查看商店遗物列表
Then 缓冲核心不在遗物列表中

## Acceptance Criteria
- 遗物购买流程正常
- 遗物效果正确生效
- 已购买遗物不再出现在商店
- 遗物与核心芯片不混淆
- 稀有度系统正常工作
