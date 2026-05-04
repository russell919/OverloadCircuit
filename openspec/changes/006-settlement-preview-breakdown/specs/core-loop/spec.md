## ADDED Requirements

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
