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

### Requirement: Risk-stop Identity Declaration
规则说明中 MUST 主动强调游戏身份，区分于其他牌型构筑游戏。

#### Scenario: Rule Screen Display
Given 玩家查看规则说明
When 进入规则第一屏
Then 显示："这不是出牌游戏，而是抽取、过热、停手的超频停手游戏。"

#### Scenario: README Documentation
Given 玩家查看README
When 阅读"与小丑牌的差异"小节
Then 明确说明本作核心是"抽取—过热—停手"的即时风险循环

### Requirement: Player Decision Support Through Accurate Stop Preview
游戏 MUST 提供准确的停手预览，帮助玩家做出正确决策。

#### Scenario: Informed Decision Making
Given 玩家正在考虑是否停手
When 查看"现在停手可得"区域
Then 显示的分数准确反映点击停手后的实际收益
And 玩家能够基于此做出明智的停手/继续决策

#### Scenario: Clear Distinction Between Base and Final
Given 玩家查看结算预览界面
When 比较"当前构筑基础分"和"现在停手可得"
Then 能够清晰理解两者的区别
And 明白危险停手奖励等机制的影响

#### Scenario: Heat-Based Bonus Awareness
Given 玩家热量为 9（90%）
When 查看"现在停手可得"预览
Then 清楚看到危险停手奖励的数值
And 理解高风险高回报的决策权衡

#### Scenario: Real-time Update
Given 玩家抽取一个模块
When 模块效果应用后
Then "现在停手可得"预览立即更新
And 反映最新状态下的预计结算分

## Acceptance Criteria
- 玩家能完成完整的一局游戏
- 通关和失败条件清晰
- 关卡进度正确递增
- 商店在通关后正确出现
- 剩余回合正确转换为金币
