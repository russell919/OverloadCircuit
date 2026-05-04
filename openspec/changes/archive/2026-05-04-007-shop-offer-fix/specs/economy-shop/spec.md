## ADDED Requirements

### Requirement: Consistent Shop Display
商店 MUST 始终显示3个真正的遗物商品。

#### Scenario: Always 3 Items
Given 玩家进入商店（任意关卡）
When 查看商店界面
Then 显示3个真正的遗物商品
And 没有"暂无商品"占位符

#### Scenario: No Ownership Filter
Given 玩家已经拥有某些遗物
When 进入商店
Then 商店仍能显示所有遗物（包括已拥有的）
And 不因为已拥有而过滤商品

#### Scenario: Rarity Logic Preserved
Given 玩家进入第10关商店
When 查看商品稀有度
Then 稀有度分布符合关卡预期（更多rare和epic）

#### Scenario: No Duplicates
Given 玩家查看商店
When 检查3个商品
Then 商品不重复
