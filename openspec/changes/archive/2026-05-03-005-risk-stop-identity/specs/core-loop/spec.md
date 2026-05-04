## MODIFIED Requirements

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
