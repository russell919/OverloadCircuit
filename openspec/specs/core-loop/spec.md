# Core Loop Specification

## Purpose
定义《过载回路》游戏的核心玩法循环，包括关卡流程、回合机制、胜负判定和游戏状态管理。确保玩家能够体验到"抽取—过热—停手"的核心游戏体验。

## Current Rules
- 主菜单 -> 选择开局核心芯片 -> 进入关卡 -> 抽取模块 -> 停手或过载 -> 达标通关 -> 获得金币 -> 商店购买遗物 -> 下一关 -> 失败结算
- 每关有目标分，最多3回合
- 回合结束后检查累计分是否达标，达标即刻通关
- 剩余回合转为金币
- 3回合后未达标则失败

## Requirements

### Requirement: Game Flow Control
游戏 MUST 按照预设流程进行，确保状态正确转换。

#### Scenario: Complete Game Flow
Given 玩家进入游戏
When 选择核心芯片并开始游戏
Then 进入关卡，开始回合，玩家可抽取模块或停手

### Requirement: Stage Clear Condition
关卡 MUST 在累计分数达标时立即通关。

#### Scenario: Early Clear
Given 当前关卡目标分为1000分，玩家已获得900分
When 玩家结算获得200分，累计达到1100分
Then 立即触发通关，进入商店

### Requirement: Round Limit
每关最多3回合，超过则失败。系统 MUST 在第3回合结束后检查是否达标。

#### Scenario: Round Exhaustion
Given 玩家已进行3回合，累计分未达标
When 第三回合结束
Then 游戏失败，显示结算界面

### Requirement: Remaining Rounds Reward
未使用的回合 MUST 转换为金币奖励。

#### Scenario: Early Exit Reward
Given 玩家在第1回合达标通关，剩余2回合
When 通关结算时
Then 获得2个金币的剩余回合奖励

## Acceptance Criteria
- 玩家能完成完整的一局游戏
- 通关和失败条件清晰
- 关卡进度正确递增
- 商店在通关后正确出现
- 剩余回合正确转换为金币
