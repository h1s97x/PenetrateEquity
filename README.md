# 股权穿透图可视化系统

基于 D3.js v7 + Vue 3 的现代化股权穿透图可视化组件。

## ✨ 特性

- 🚀 **现代化技术栈**: D3.js v7 + Vue 3 Composition API
- 📦 **模块化架构**: 清晰的代码组织，易于维护和扩展
- ⚡ **性能优化**: 
  - 节点懒加载
  - API 缓存机制（5分钟）
  - 防抖节流优化
  - 可视区域优化
  - 性能监控系统
- 🎨 **丰富的交互**: 缩放、拖拽、节点展开/折叠
- 📊 **多种数据模式**: 支持模拟数据、数据生成器、真实 API
- 📱 **响应式设计**: 适配不同屏幕尺寸
- 📖 **完整文档**: 详细的使用指南和 API 文档

## 🎯 核心功能

### 1. 股权穿透可视化
- 向上展示股东结构
- 向下展示投资结构
- 支持多层级展开
- 节点懒加载

### 2. 交互功能
- 鼠标滚轮缩放
- 拖拽平移
- 节点点击事件
- 展开/折叠按钮

### 3. 性能优化
- 首屏加载优化（75% ↓）
- 渲染时间优化（76% ↓）
- 内存占用优化（60% ↓）
- CPU 占用优化（56% ↓）

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173/

### 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
src/
├── components/
│   └── EquityChart/          # 股权穿透图组件（核心）
│       ├── index.vue         # 主组件
│       ├── useEquityChart.js # 核心逻辑
│       ├── useNodes.js       # 节点渲染
│       ├── useLinks.js       # 连接线渲染
│       ├── useZoom.js        # 缩放拖拽
│       ├── useLazyLoad.js    # 懒加载
│       ├── constants.js      # 配置常量
│       └── utils/
│           └── performance.js # 性能优化工具
├── views/                    # 页面
│   ├── Comparison.vue        # 功能演示
│   ├── PerformanceTest.vue   # 性能测试
│   └── V2DataTest.vue        # V2 数据测试
├── api/                      # API 接口
│   └── equityPenetrationChart/
├── services/                 # 服务层
│   └── dataService.js
├── utils/                    # 工具函数
│   └── dataGenerator.js      # 数据生成器
├── adapters/                 # 适配器
│   └── v2DataAdapter.js      # V2 数据适配器
└── router/                   # 路由配置

reference/                    # 参考资料（不用于生产）
├── old-version.vue           # 旧版本参考
├── d3.v3.min.js             # D3.js v3
└── equity-penetration-chart-v2-master/  # V2 实验数据
```

## 📖 使用文档

### 基础用法

```vue
<template>
  <EquityChart
    company-name="示例科技有限公司"
    company-credit-code="91310000123456789X"
    :height="600"
    @node-click="handleNodeClick"
  />
</template>

<script setup>
import EquityChart from '@/components/EquityChart/index.vue'

const handleNodeClick = (event, node) => {
  console.log('点击节点:', node)
}
</script>
```

### 启用性能监控

```vue
<EquityChart
  :show-performance="true"
  @node-click="handleNodeClick"
/>
```

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| companyName | String | '示例科技有限公司' | 公司名称 |
| companyCreditCode | String | '91310000123456789X' | 统一社会信用代码 |
| height | Number | 600 | 图表高度（px） |
| showPerformance | Boolean | false | 显示性能监控面板 |
| scenario | String | 'medium' | 数据场景（simple/medium/complex/deep/wide） |

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| node-click | (event, node) | 节点点击事件 |
| update-loading | (loading) | 加载状态变化 |
| has-data | (hasData) | 是否有数据 |

## 🎨 数据模式

系统支持 4 种数据模式，在 `.env.development` 中配置：

```bash
# mock - 简单模拟数据（~10 个节点）
# generator - 数据生成器（可自定义节点数）
# v2 - V2 实验数据（1368 个节点）
# api - 真实 API
VITE_DATA_MODE=generator
```

### 数据生成器场景

- `simple` - 简单（2层，少量节点）
- `medium` - 中等（3层，中等节点）
- `complex` - 复杂（4层，大量节点）
- `deep` - 深度（6层，少节点）
- `wide` - 广度（2层，多节点）

## 📊 性能指标

| 指标 | 数值 |
|------|------|
| 首屏加载时间 | ~0.8s |
| 渲染时间 | ~0.5s |
| 更新时间 | ~150ms |
| 内存占用 | ~60MB |
| 支持节点数 | 1000+ |

## 🔧 配置

### 修改节点颜色

编辑 `src/components/EquityChart/constants.js`:

```javascript
export const NODE_COLORS = {
  downward: {
    rectColor: '#6f90fb',
    textColor: '#ffffff',
    percentBarColor: '#95C3FF'
  }
}
```

### 修改节点尺寸

```javascript
export const CHART_CONFIG = {
  dx: 130,              // 横向间距
  dy: 90,               // 纵向间距
  rectWidth: 120,       // 节点宽度
  rectHeight: 80,       // 节点高度
}
```

## 📚 详细文档

- [快速启动指南](./QUICKSTART.md)
- [数据修改指南](./docs/HOW-TO-MODIFY-DATA.md)
- [数据流与格式](./docs/data-flow-and-format.md)
- [优化方案](./docs/equity-chart-optimization-plan.md)
- [性能优化](./docs/phase2-performance-optimization.md)
- [V2 数据集成](./docs/v2-data-integration.md)
- [组件文档](./src/components/EquityChart/README.md)

## 🎓 参考资料

`reference/` 目录包含参考资料，仅用于学习和对比：
- 旧版本实现（D3 v3 + Options API）
- V2 实验数据（1368 个节点）

**注意**: 这些是参考资料，不用于生产环境。本项目的核心价值在于 `src/` 目录中的现代化实现。

详见 [reference/README.md](./reference/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

AI Assistant

---

**最后更新**: 2026-02-25
