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

## Acceptance Criteria
- 分数计算正确
- 热量系统正常工作
- 过载时正确惩罚玩家
- 结算显示清晰
- 分数正确累加
