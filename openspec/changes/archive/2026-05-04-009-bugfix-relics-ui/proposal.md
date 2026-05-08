# Change: Bugfix - 遗物生效和 UI 问题修复

## Why
存在三个需要修复的问题：

1. 裂变模块颜色与冷却模块颜色太接近，需要区分
2. 极限偏执和失控回路遗物没有正常生效
3. breakdown-panel 边框不能自适应大小

## What

### 1. 裂变模块颜色
- 修改裂变模块的 CSS 颜色
- 选择与冷却模块明显不同的颜色

### 2. 遗物生效修复
- 确保极限偏执（heat === 9 时 +2 X倍率）在 preview 和 actual 中都生效
- 确保失控回路（heat >= 7 时筹码翻倍）在 preview 和 actual 中都生效
- 确保 breakdownItems 正确显示这两个遗物效果

### 3. Breakdown-panel UI 优化
- 修复边框自适应问题
- 确保多个增幅原因时布局正常

## Requirements

### 模块颜色
- 裂变模块使用与冷却明显不同的颜色

### 遗物生效
- 极限偏执：heat === 9 时触发，+2 X倍率
- 失控回路：heat >= 7 时触发，筹码翻倍
- breakdownItems 正确显示

### Breakdown-panel
- 边框能自适应内容高度

## Acceptance Criteria
- 裂变模块颜色与冷却模块明显区分
- 极限偏执和失控回路在相应条件下正确生效
- breakdown-panel 边框自适应大小
