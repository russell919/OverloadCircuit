# Starter Core Chips Specification

## Purpose
定义《过载回路》中开局四选一的核心芯片系统，为玩家提供不同的初始策略选择。

## Current Rules
- 缓冲核心：提高热量上限
- 增幅核心：提高每回合初始倍率
- 储能核心：提高每回合初始筹码
- 裂变核心：提高每回合初始 X倍率
- 核心芯片不是遗物，不进入遗物池
- 核心芯片整局生效

## Requirements

### Requirement: Initial Selection
游戏开始时 MUST 显示四个核心芯片选项供玩家选择。

#### Scenario: Core Selection Screen
Given 玩家进入游戏
When 完成主菜单选择
Then 显示四个核心芯片选项

### Requirement: Buffer Core Effect
缓冲核心 MUST 提高热量上限。

#### Scenario: Buffer Core
Given 选择缓冲核心(+2热量上限)
When 进入游戏
Then 热量上限从10变为12

### Requirement: Amplifier Core Effect
增幅核心 MUST 提高每回合初始倍率。

#### Scenario: Amplifier Core
Given 选择增幅核心(初始倍率+1)
When 每回合开始
Then 初始倍率从1变为2

### Requirement: Energy Core Effect
储能核心 MUST 提高每回合初始筹码。

#### Scenario: Energy Core
Given 选择储能核心(初始筹码+50)
When 每回合开始
Then 初始筹码从50变为100

### Requirement: Fission Core Effect
裂变核心 MUST 提高每回合初始X倍率。

#### Scenario: Fission Core
Given 选择裂变核心(初始X倍率+1)
When 每回合开始
Then 初始X倍率从1变为2

### Requirement: Permanent Effect
核心芯片效果 MUST 持续整局游戏。

#### Scenario: Persistent Effect
Given 选择增幅核心
When 进入第5关第2回合
Then 初始倍率仍为2

## Acceptance Criteria
- 开局正确显示四个核心芯片选项
- 选择后正确应用效果
- 核心芯片效果持续整局
- 核心芯片不出现在遗物池
- 核心芯片与遗物独立
