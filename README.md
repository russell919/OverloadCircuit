# 过载回路 Overload Circuit

类 Rogue 爆分游戏，基于 Phaser 3 + TypeScript + Vite 构建。

## 运行方式

```bash
npm install
npm run dev
```

访问 http://localhost:3000 即可开始游戏。

## 项目结构

```
├── src/
│   ├── main.ts                 # 游戏入口，场景注册
│   ├── constants.ts           # 常量定义（分辨率、颜色、关卡增长公式）
│   ├── types.ts                # TypeScript 类型定义
│   ├── store.ts                # 游戏状态管理、存档读写
│   ├── modules/
│   │   └── index.ts            # 7种模块定义与权重随机
│   ├── relics/
│   │   └── index.ts            # 10种遗物定义与效果接口
│   └── scenes/
│       ├── BootScene.ts        # 启动场景
│       ├── MenuScene.ts        # 主菜单
│       ├── GameScene.ts        # 核心游戏逻辑
│       ├── RelicScene.ts       # 遗物选择界面
│       └── ResultScene.ts       # 游戏结束界面
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 核心逻辑文件说明

### 模块系统 (`src/modules/index.ts`)
- **蓝芯**: +20 chips（可叠加蓝色成瘾）
- **红芯**: +1 mult（可叠加红色成瘾）
- **黄芯**: +40 chips, +2 heat（可被稳压器减免）
- **冷却**: -2 heat（首次被散热鳍片触发时+25 chips）
- **复制**: 重复上一个非复制模块效果
- **放大**: 下一个模块触发2次
- **裂变**: xmult +1

### 遗物系统 (`src/relics/index.ts`)
所有遗物支持叠加，效果在模块触发时自动检查：
- 超导线圈：每第3个模块 +1 mult
- 散热鳍片：首次冷却 +25 chips
- 失控回路：heat≥7 时 chips 翻倍
- 稳压器：首次黄芯不减 heat
- 镜像驱动：复制额外执行1次
- 红色成瘾：红芯 +1 mult
- 蓝色成瘾：蓝芯 +15 chips
- 极限偏执：heat=9 结算时 xmult +2
- 保险丝：过载时保留35%分数
- 空转增压：本回合无冷却时结算 xmult +1

### 关卡增长 (`src/constants.ts`)
- 第1关目标分：200
- 后续关卡：`target = floor(200 * pow(1.6, stage - 1))`

### 存档 (`src/store.ts`)
使用 localStorage 持久化：
- 最高到达层数
- 最高单回合分
- 历史最高总分

## 游戏流程

1. **MenuScene** - 显示历史最高记录，开始游戏
2. **GameScene** - 每关3回合，每回合可无限抽取模块直到停手或过载
3. **RelicScene** - 过关后3选1遗物
4. **ResultScene** - 游戏结束时显示成绩

## 关键技术点

- **模块权重随机**: 根据 weight 加权随机抽取
- **遗物效果触发**: 在模块效果应用后统一检查
- **数值膨胀**: 通过 chips/mult/xmult 三重乘数实现指数级增长
- **过载惩罚**: heat=10 时本回合分数清零
- **热条变色**: 根据 heat 阶段显示绿/黄/红
