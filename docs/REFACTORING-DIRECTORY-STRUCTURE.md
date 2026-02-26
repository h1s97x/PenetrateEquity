# 目录结构重构总结

## 重构日期
2024年（根据当前日期）

## 重构目标
将 src 目录重构为更清晰、更符合现代前端项目规范的结构，参考业界最佳实践。

## 重构前后对比

### 重构前结构
```
src/
├── adapters/
│   └── v2DataAdapter.js
├── api/
│   └── equityPenetrationChart/
├── components/
│   └── EquityChart/
│       ├── constants.js
│       ├── index.vue
│       ├── README.md
│       ├── useEquityChart.js
│       ├── useLazyLoad.js
│       ├── useLinks.js
│       ├── useNodes.js
│       ├── useZoom.js
│       └── utils/
│           └── performance.js
├── router/
├── services/
├── utils/
│   └── dataGenerator.js
├── views/
├── App.vue
└── main.js
```

### 重构后结构
```
src/
├── components/
│   └── ui/                          # UI 组件目录
│       └── EquityChart/
│           ├── index.vue            # 主组件
│           ├── README.md
│           └── composables/         # Composable 函数
│               ├── useEquityChart.js
│               ├── useLazyLoad.js
│               ├── useLinks.js
│               ├── useNodes.js
│               └── useZoom.js
│
├── data/                            # 数据相关
│   ├── adapters/                    # 数据适配器
│   │   └── v2DataAdapter.js
│   └── generators/                  # 数据生成器
│       └── dataGenerator.js
│
├── lib/                             # 工具库和常量
│   ├── constants.js                 # 全局常量配置
│   └── utils/
│       └── performance.js           # 性能工具
│
├── api/                             # API 调用（保持不变）
│   └── equityPenetrationChart/
│
├── services/                        # 业务服务层（保持不变）
│   └── dataService.js
│
├── router/                          # 路由配置（保持不变）
│   └── index.js
│
├── views/                           # 页面视图（保持不变）
│   ├── Comparison.vue
│   ├── EquityChartView.vue
│   ├── Home.vue
│   ├── PerformanceTest.vue
│   └── V2DataTest.vue
│
├── App.vue
└── main.js
```

## 主要改动

### 1. components/ui/ - UI 组件分类
- **改动**: 将 `EquityChart` 移到 `components/ui/` 子目录
- **原因**: 更清晰地表明这是 UI 组件，为未来添加其他 UI 组件类别做准备
- **影响文件**: 所有 views 文件中的导入路径

### 2. composables/ - Composable 函数集中管理
- **改动**: 在 `EquityChart` 内创建 `composables` 文件夹
- **原因**: 
  - 集中管理所有 composable 函数
  - 符合 Vue 3 Composition API 最佳实践
  - 便于未来添加新的 composable（如 useSearch、usePathHighlight 等）
- **移动文件**:
  - `useEquityChart.js`
  - `useLazyLoad.js`
  - `useLinks.js`
  - `useNodes.js`
  - `useZoom.js`

### 3. data/ - 数据相关模块整合
- **改动**: 新建 `data` 目录，包含 `adapters` 和 `generators` 子目录
- **原因**: 
  - 将数据处理相关的代码集中管理
  - 区分数据适配器和数据生成器的职责
- **移动文件**:
  - `src/adapters/v2DataAdapter.js` → `src/data/adapters/v2DataAdapter.js`
  - `src/utils/dataGenerator.js` → `src/data/generators/dataGenerator.js`

### 4. lib/ - 工具库和常量
- **改动**: 新建 `lib` 目录，存放全局工具函数和常量
- **原因**: 
  - 将通用工具和配置从组件中分离
  - 便于跨组件复用
  - 符合"关注点分离"原则
- **移动文件**:
  - `src/components/EquityChart/constants.js` → `src/lib/constants.js`
  - `src/components/EquityChart/utils/performance.js` → `src/lib/utils/performance.js`

## 导入路径更新

### 组件导入
```javascript
// 旧路径
import EquityChart from '@/components/EquityChart/index.vue'

// 新路径
import EquityChart from '@/components/ui/EquityChart/index.vue'
```

### Composable 导入
```javascript
// 旧路径（组件内部）
import { useEquityChart } from './useEquityChart'

// 新路径（组件内部）
import { useEquityChart } from './composables/useEquityChart'
```

### 常量导入
```javascript
// 旧路径
import { CHART_CONFIG } from './constants'

// 新路径
import { CHART_CONFIG } from '@/lib/constants'
// 或相对路径
import { CHART_CONFIG } from '../../../../lib/constants'
```

### 数据适配器导入
```javascript
// 旧路径
import { v2DataLoader } from '@/adapters/v2DataAdapter.js'

// 新路径
import { v2DataLoader } from '@/data/adapters/v2DataAdapter.js'
```

### 工具函数导入
```javascript
// 旧路径
import { PerformanceMonitor } from './utils/performance'

// 新路径
import { PerformanceMonitor } from '@/lib/utils/performance'
```

## 受影响的文件列表

### 移动的文件
1. `src/utils/dataGenerator.js` → `src/data/generators/dataGenerator.js`
2. `src/adapters/v2DataAdapter.js` → `src/data/adapters/v2DataAdapter.js`
3. `src/components/EquityChart/constants.js` → `src/lib/constants.js`
4. `src/components/EquityChart/utils/performance.js` → `src/lib/utils/performance.js`
5. `src/components/EquityChart/` → `src/components/ui/EquityChart/`
6. 所有 composable 文件 → `src/components/ui/EquityChart/composables/`

### 更新导入路径的文件
1. `src/components/ui/EquityChart/index.vue`
2. `src/components/ui/EquityChart/composables/useEquityChart.js`
3. `src/views/EquityChartView.vue`
4. `src/views/Comparison.vue`
5. `src/views/PerformanceTest.vue`
6. `src/views/V2DataTest.vue`

## 优势

### 1. 更清晰的职责划分
- **components/ui/**: 纯 UI 组件
- **data/**: 数据处理相关
- **lib/**: 通用工具和常量
- **api/**: API 调用
- **services/**: 业务逻辑
- **views/**: 页面视图

### 2. 更好的可扩展性
- 为未来添加新功能预留了清晰的位置
- 例如：新的 composable 直接放在 `composables/` 目录
- 新的工具函数放在 `lib/utils/`

### 3. 符合业界最佳实践
- 参考了 React、Vue 等现代前端项目的目录结构
- 便于团队协作和新成员理解

### 4. 便于维护
- 相关代码集中在一起
- 减少了跨目录查找的时间
- 导入路径更加语义化

## 后续建议

### 1. 可以考虑添加的目录
- `src/hooks/` - 全局可复用的 hooks（如响应式、主题等）
- `src/i18n/` - 国际化配置
- `src/types/` - TypeScript 类型定义（如果使用 TS）
- `src/styles/` - 全局样式文件

### 2. 进一步优化
- 考虑将 `constants.js` 拆分为多个文件（如 `chart.constants.js`, `color.constants.js`）
- 为 composables 添加单元测试
- 考虑使用 barrel exports（index.js）简化导入

## 验证

所有文件已通过 TypeScript/ESLint 诊断检查，无错误。

## 注意事项

1. 如果项目使用了构建工具的路径别名（如 `@/`），确保配置正确
2. 如果有其他开发者在并行开发，需要同步这次重构
3. 建议在重构后运行完整的测试套件确保功能正常

## 总结

这次重构使项目结构更加清晰、模块化，符合现代前端项目的最佳实践。所有导入路径已更新，功能保持不变，为后续的第三阶段功能开发（搜索、路径高亮、导出、全屏、缩略图）打下了良好的基础。
