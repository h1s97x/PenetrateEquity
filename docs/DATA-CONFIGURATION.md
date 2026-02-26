# 数据配置说明

## 概述

系统支持 4 种数据模式，可以通过环境变量灵活切换。

## 数据模式

### 1. V2 模式（当前默认）
**配置**: `.env.development` 中设置 `VITE_DATA_MODE=v2`

**特点**:
- 使用真实的实验数据（1368 个节点）
- 数据来源：`reference/equity-penetration-chart-v2-master/实验数据.js`
- 数据结构复杂，层级深
- 适合测试大规模数据场景

**数据文件**: `src/adapters/v2DataAdapter.js` 负责加载和转换

### 2. Generator 模式（推荐用于首页）
**配置**: `.env.development` 中设置 `VITE_DATA_MODE=generator`

**特点**:
- 使用数据生成器动态生成数据
- 支持为不同公司生成不同结构的数据
- 可以自定义层级深度、节点数量等参数
- 适合演示和测试多公司场景

**配置位置**: `src/api/equityPenetrationChart/index.js`

```javascript
const companyDataConfigs = {
  '91310000123456789X': {
    companyName: '京海控股集团有限公司',
    downwardDepth: 3,      // 向下层级深度
    upwardDepth: 2,        // 向上层级深度
    childrenPerLevel: 4,   // 每层子节点数量
    shareholderCount: 3    // 股东数量
  },
  // ... 其他 9 家公司配置
}
```

### 3. Mock 模式
**配置**: `.env.development` 中设置 `VITE_DATA_MODE=mock`

**特点**:
- 使用简单的硬编码数据
- 节点数量少（2-3 层）
- 适合快速开发和调试

**数据示例**:
```javascript
{
  main: { name: '示例科技有限公司', ... },
  upward: [
    { name: '张三', type: 1, percent: '60.00', ... },
    { name: '李四投资有限公司', type: 2, percent: '40.00', ... }
  ],
  downward: [
    { name: '子公司A', type: 2, percent: '100.00', ... },
    { name: '子公司B', type: 2, percent: '51.00', ... }
  ]
}
```

### 4. API 模式
**配置**: `.env.development` 中设置 `VITE_DATA_MODE=api`

**特点**:
- 连接真实后端 API
- 目前未实现，会降级到 Mock 模式
- 生产环境推荐使用

## 当前配置

### 开发环境 (`.env.development`)
```env
VITE_DATA_MODE=v2
```
- 使用 V2 实验数据
- 1368 个节点，真实数据结构
- 所有公司都显示相同的数据

### 生产环境 (`.env.production`)
```env
VITE_DATA_MODE=api
```
- 应该连接真实 API
- 目前未实现，会降级到 Mock 模式

## 推荐配置

### 场景 1: 演示首页多公司功能
```env
VITE_DATA_MODE=generator
```
- 每个公司显示不同的数据结构
- 数据量可控，性能好
- 适合展示系统功能

### 场景 2: 测试大规模数据性能
```env
VITE_DATA_MODE=v2
```
- 1368 个节点
- 测试渲染性能
- 测试懒加载功能

### 场景 3: 快速开发调试
```env
VITE_DATA_MODE=mock
```
- 数据简单，加载快
- 适合开发新功能

## 如何切换数据模式

### 方法 1: 修改环境变量文件（推荐）
编辑 `.env.development` 文件：
```env
# 改为 generator 模式
VITE_DATA_MODE=generator
```

重启开发服务器：
```bash
npm run dev
```

### 方法 2: 运行时切换（临时）
在浏览器控制台执行：
```javascript
// 注意：这只是临时切换，刷新页面后会恢复
import { setDataMode } from '@/api/equityPenetrationChart/index.js'
setDataMode('generator')
```

## Generator 模式配置详解

### 公司数据配置参数

| 参数 | 说明 | 示例值 | 影响 |
|-----|------|--------|------|
| `companyName` | 公司名称 | '京海控股集团' | 显示在节点上 |
| `downwardDepth` | 向下层级深度 | 3 | 子公司的层级数 |
| `upwardDepth` | 向上层级深度 | 2 | 股东的层级数 |
| `childrenPerLevel` | 每层子节点数 | 4 | 每个节点的子节点数量 |
| `shareholderCount` | 股东数量 | 3 | 根节点的股东数量 |

### 节点数量计算

**向下节点总数** ≈ `childrenPerLevel ^ downwardDepth`
- 例如：4^3 = 64 个子公司节点

**向上节点总数** ≈ `shareholderCount * (childrenPerLevel ^ (upwardDepth - 1))`
- 例如：3 * 4^1 = 12 个股东节点

### 添加新公司配置

1. 在 `src/views/Home.vue` 中添加公司信息：
```javascript
{
  id: 11,
  name: '新公司名称',
  creditCode: '91XXXXXXXXXXXXXXXXX',
  subsidiaryCount: 50,  // 预估值
  shareholderCount: 5   // 预估值
}
```

2. 在 `src/api/equityPenetrationChart/index.js` 中添加配置：
```javascript
'91XXXXXXXXXXXXXXXXX': {
  companyName: '新公司名称',
  downwardDepth: 3,
  upwardDepth: 2,
  childrenPerLevel: 5,
  shareholderCount: 3
}
```

## 数据生成器详解

### 位置
`src/utils/dataGenerator.js`

### 主要类

#### 1. DataGenerator
生成树形数据的主类

**方法**:
- `generateCompanyTree(options)` - 生成完整的公司树
- `generateDownwardNodes(depth, count, level)` - 生成子公司
- `generateUpwardNodes(depth, count, level)` - 生成股东
- `generateScenario(scenarioName)` - 生成预设场景

**预设场景**:
- `simple` - 简单场景（2 层，少量节点）
- `medium` - 中等场景（3 层，中等节点）
- `complex` - 复杂场景（4 层，大量节点）
- `deep` - 深度场景（6 层，少节点）
- `wide` - 广度场景（2 层，多节点）

#### 2. NameGenerator
生成公司名称和人名

**方法**:
- `generateCompanyName()` - 生成公司名称
- `generatePersonName()` - 生成人名

#### 3. DataStatistics
统计数据信息

**方法**:
- `analyze(treeData)` - 分析树形数据
- `printStats(treeData)` - 打印统计信息

### 使用示例

```javascript
import { DataGenerator } from '@/utils/dataGenerator.js'

// 生成自定义数据
const data = DataGenerator.generateCompanyTree({
  companyName: '测试公司',
  companyCreditCode: '91000000000000001X',
  downwardDepth: 3,
  upwardDepth: 2,
  childrenPerLevel: 5,
  shareholderCount: 3
})

// 使用预设场景
const complexData = DataGenerator.generateScenario('complex')

// 生成大数据集
const largeData = DataGenerator.generateLargeDataset(1000)
```

## 数据缓存

系统实现了 5 分钟的数据缓存：

```javascript
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟
```

**缓存键**: `{creditCode}_{companyName}_{type}`

**清除缓存**:
```javascript
import { clearCache } from '@/api/equityPenetrationChart/index.js'
clearCache()
```

## 数据流程

```
用户点击公司
    ↓
路由传递 creditCode 和 companyName
    ↓
EquityChart 组件调用 getCompanyShareholder(params)
    ↓
检查缓存
    ↓
根据 VITE_DATA_MODE 选择数据源
    ↓
    ├─ v2: 加载实验数据
    ├─ generator: 查找配置 → 生成数据
    ├─ mock: 返回简单数据
    └─ api: 调用真实 API（未实现）
    ↓
返回数据并缓存
    ↓
渲染股权图
```

## 常见问题

### Q: 为什么所有公司显示相同的数据？
A: 当前使用 V2 模式，所有公司都加载同一份实验数据。切换到 `generator` 模式即可看到不同数据。

### Q: 如何调整节点数量？
A: 修改 `companyDataConfigs` 中的 `downwardDepth` 和 `childrenPerLevel` 参数。

### Q: 数据生成太慢怎么办？
A: 减少 `downwardDepth` 或 `childrenPerLevel`，或者使用 `mock` 模式。

### Q: 如何连接真实 API？
A: 在 `src/api/equityPenetrationChart/index.js` 的 `generateSimpleMockData` 函数中实现真实 API 调用逻辑。

## 建议

1. **开发阶段**: 使用 `generator` 模式，可以快速测试不同公司的数据
2. **性能测试**: 使用 `v2` 模式，测试大规模数据的渲染性能
3. **演示阶段**: 使用 `generator` 模式，展示多公司功能
4. **生产环境**: 使用 `api` 模式，连接真实后端

## 下一步

如果需要切换到 Generator 模式以展示不同公司的不同数据，请告诉我，我会帮你修改配置文件。
