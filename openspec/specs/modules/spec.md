# Modules System Specification

## Purpose
定义《过载回路》中各种芯片模块的效果和行为，包括蓝芯、红芯、黄芯、冷却、复制、放大和裂变模块。

## Current Rules
- 蓝芯：增加筹码
- 红芯：增加倍率
- 黄芯：增加大量筹码，但额外增加热量
- 冷却：降低热量
- 复制：重复触发上一个非复制模块
- 放大：使下一个模块额外触发
- 裂变：增加 X倍率

## Requirements

### Requirement: Blue Core Effect
蓝芯 MUST 增加筹码数量。

#### Scenario: Blue Core Activation
Given 当前筹码为100
When 抽取并触发蓝芯(+50筹码)
Then 筹码更新为150

### Requirement: Red Core Effect
红芯 MUST 增加倍率。

#### Scenario: Red Core Activation
Given 当前倍率为2
When 抽取并触发红芯(×1.5)
Then 倍率更新为3

### Requirement: Yellow Core Effect
黄芯 MUST 增加大量筹码并额外增加热量。

#### Scenario: Yellow Core Activation
Given 当前筹码为100，热量为3
When 抽取并触发黄芯(+100筹码，+3热量)
Then 筹码更新为200，热量更新为6

### Requirement: Coolant Effect
冷却模块 MUST 降低热量。

#### Scenario: Coolant Activation
Given 当前热量为8
When 抽取并触发冷却(-3热量)
Then 热量更新为5

### Requirement: Copy Module Effect
复制模块 MUST 重复上一个非复制模块。

#### Scenario: Copy Activation
Given 上一个模块是蓝芯(+50筹码)
When 抽取并触发复制
Then 再次增加50筹码

### Requirement: Amplify Module Effect
放大模块 MUST 使下一个模块额外触发一次。

#### Scenario: Amplify Activation
Given 下一个模块是红芯(×1.5)
When 先抽取放大，再抽取红芯
Then 红芯触发两次，倍率 × 2.25

### Requirement: Fission Module Effect
裂变模块 MUST 增加X倍率。

#### Scenario: Fission Activation
Given 当前X倍率为2
When 抽取并触发裂变(+1)
Then X倍率更新为3

## Acceptance Criteria
- 所有模块效果正确触发
- 复制模块正确识别并重复上一个非复制模块
- 放大模块正确增强下一个模块效果
- 黄芯正确增加热量
- 模块交互逻辑正确
