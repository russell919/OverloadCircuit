# Records System Specification

## Purpose
定义《过载回路》中游戏记录的存储和显示，包括最高关卡、最高单回合分和最高单局总分。

## Current Rules
- 历史最高到达关卡
- 历史最高单回合分
- 历史最高单局总分
- 本地存储记录
- 记录在结算时更新

## Requirements

### Requirement: High Stage Tracking
系统 MUST 记录并更新历史最高到达关卡。

#### Scenario: New Stage Record
Given 当前最高关卡为5
When 玩家通关第6关
Then 最高关卡更新为6

### Requirement: Round Score Tracking
系统 MUST 记录并更新历史最高单回合分。

#### Scenario: New Round Score Record
Given 当前最高单回合分为5000
When 玩家获得6000分的回合结算
Then 最高单回合分更新为6000

### Requirement: Total Score Tracking
系统 MUST 记录并更新历史最高单局总分。

#### Scenario: New Total Score Record
Given 当前最高单局总分为20000
When 玩家本局总分为25000
Then 最高单局总分更新为25000

### Requirement: Persistent Storage
记录 MUST 持久化存储到本地。

#### Scenario: Game Restart
Given 玩家关闭游戏后重新打开
When 进入主菜单
Then 显示之前保存的记录

## Acceptance Criteria
- 最高关卡正确更新
- 最高单回合分正确更新
- 最高单局总分正确更新
- 记录持久化存储
- 记录显示清晰
