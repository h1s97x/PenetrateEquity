# 数据流与数据格式详细文档

## 📋 目录
- [数据流架构](#数据流架构)
- [数据格式说明](#数据格式说明)
- [数据来源](#数据来源)
- [数据转换流程](#数据转换流程)
- [如何修改数据](#如何修改数据)
- [工作流说明](#工作流说明)

---

## 数据流架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                            │
│                    (Vue Components)                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Comparison   │  │ EquityChart  │  │ Performance  │      │
│  │   .vue       │  │   /index.vue │  │   Test.vue   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据服务层                             │
│                    (Data Service)                            │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │              dataService.js                         │     │
│  │  ┌──────────────────┐  ┌──────────────────┐       │     │
│  │  │  DataService     │  │ DataTransformer  │       │     │
│  │  │  - getCompanyData│  │ - transformToTree│       │     │
│  │  │  - getChildren   │  │ - transformNodes │       │     │
│  │  │  - cache管理     │  │ - validateData   │       │     │
│  │  └────────┬─────────┘  └──────────────────┘       │     │
│  └───────────┼────────────────────────────────────────┘     │
└──────────────┼──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                         API 层                                │
│                  (API Interface)                             │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │    src/api/equityPenetrationChart/index.js         │     │
│  │                                                      │     │
│  │  export function getCompanyShareholder(params) {    │     │
│  │    // API 调用逻辑                                   │     │
│  │    // 返回模拟数据或真实 API 响应                    │     │
│  │  }                                                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向

```
1. 用户操作
   ↓
2. Vue 组件调用 dataService
   ↓
3. dataService 检查缓存
   ├─ 有缓存 → 直接返回
   └─ 无缓存 ↓
4. 调用 API 层获取数据
   ↓
5. DataTransformer 转换数据格式
   ↓
6. 验证数据有效性
   ↓
7. 缓存数据
   ↓
8. 返回给组件
   ↓
9. 组件渲染图表
```

---

## 数据格式说明

### 1. API 原始数据格式

**文件位置**: `src/api/equityPenetrationChart/index.js`

#### API 响应结构

```javascript
{
  code: 1,  // 1: 成功, 0: 失败
  retInfo: {
    // 主公司信息
    main: {
      name: "京海控股集团有限公司",
      companyCreditCode: "91310000123456789X",
      companyCode: "BG00001",
      amount: "10000"  // 注册资本（万元）
    },
    
    // 向下数据（子公司/投资）
    downward: [
      {
        id: "BG00002",
        name: "京海强盛曙光大数据股份有限公司",
        percent: "100.00",  // 持股比例
        amount: "5000",     // 投资金额（万元）
        type: 2,            // 1: 个人, 2: 企业
        companyCreditCode: "91310000987654321Y",
        companyCode: "BG00002",
        status: 1,          // 0: 无子节点, 1: 有子节点
        children: []        // 子节点（可选）
      }
    ],
    
    // 向上数据（股东）
    upward: [
      {
        id: "BG00100",
        name: "张三",
        percent: "60.00",
        amount: "6000",
        type: 1,            // 个人
        companyCreditCode: "",
        companyCode: "PERSON001",
        status: 1,
        children: []
      }
    ]
  }
}
```

### 2. 转换后的树形数据格式

**转换器**: `DataTransformer.transformToTree()`

#### 树形数据结构

```javascript
{
  // ========== 根节点信息 ==========
  id: "91310000123456789X",           // 唯一标识
  name: "京海控股集团有限公司",        // 公司名称
  ratio: "100.00%",                    // 持股比例
  amount: "10000",                     // 注册资本
  type: 2,                             // 1: 个人, 2: 企业
  companyCreditCode: "91310000123456789X",  // 统一社会信用代码
  companyCode: "BG00001",              // 公司代码
  direction: "root",                   // 节点方向: root/upward/downward
  
  // ========== 子公司（向下） ==========
  children: [
    {
      id: "BG00002",
      name: "子公司A",
      ratio: "100.00%",
      amount: "5000",
      type: 2,
      companyCreditCode: "91310000987654321Y",
      companyCode: "BG00002",
      direction: "downward",
      status: 1,                       // 0: 无子节点, 1: 有子节点
      children: [],                    // 递归子节点
      _raw: { /* 原始数据 */ }        // 保留原始数据
    }
  ],
  
  // ========== 股东（向上） ==========
  parents: [
    {
      id: "BG00100",
      name: "张三",
      ratio: "60.00%",
      amount: "6000",
      type: 1,
      companyCreditCode: "",
      companyCode: "PERSON001",
      direction: "upward",
      status: 1,
      children: [],
      _raw: { /* 原始数据 */ }
    }
  ]
}
```

### 3. D3 层次数据格式

**转换**: `d3.hierarchy(data, d => d.children)`

#### D3 节点结构

```javascript
{
  // ========== D3 添加的属性 ==========
  depth: 0,              // 节点深度（根节点为 0）
  height: 2,             // 节点高度（叶子节点为 0）
  parent: null,          // 父节点引用
  children: [],          // 子节点数组
  _children: null,       // 折叠的子节点
  
  // ========== 位置信息 ==========
  x: 0,                  // 横坐标
  y: 0,                  // 纵坐标
  x0: 0,                 // 上一次的横坐标
  y0: 0,                 // 上一次的纵坐标
  
  // ========== 原始数据 ==========
  data: {
    id: "BG00001",
    name: "公司名称",
    ratio: "100.00%",
    // ... 其他字段
  }
}
```

---

## 数据来源

### 当前数据来源

**主要文件**: `src/api/equityPenetrationChart/index.js`

```javascript
// 模拟数据生成
export function getCompanyShareholder(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        code: 1,
        retInfo: {
          main: {
            name: params.companyName || '示例科技有限公司',
            companyCreditCode: params.companyCreditCode || '91310000123456789X'
          },
          upward: [
            // 股东数据
          ],
          downward: [
            // 子公司数据
          ]
        }
      }
      resolve(mockData)
    }, 300)
  })
}
```

### 可选数据来源

#### 1. 使用 V2 版本的大数据集

**文件**: `equity-penetration-chart-v2-master/实验数据.js`

这个文件包含 8000+ 行的真实企业数据，可以用于测试大数据量场景。

#### 2. 真实 API 接口

替换模拟数据为真实 API 调用：

```javascript
export async function getCompanyShareholder(params) {
  const response = await fetch('https://your-api.com/shareholder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  })
  
  return response.json()
}
```

---

## 数据转换流程

### 完整转换流程

```
┌─────────────────────────────────────────────────────────────┐
│ 步骤 1: API 调用                                              │
│ getCompanyShareholder(params)                                │
│ ↓                                                             │
│ 返回原始 API 数据                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 步骤 2: 数据转换                                              │
│ DataTransformer.transformToTree(apiResponse)                 │
│ ↓                                                             │
│ - 提取 main, upward, downward                                │
│ - 转换节点格式                                                │
│ - 添加 direction 字段                                         │
│ - 递归处理子节点                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 步骤 3: 数据验证                                              │
│ DataTransformer.validateData(treeData)                       │
│ ↓                                                             │
│ - 检查必需字段                                                │
│ - 验证数据结构                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 步骤 4: D3 层次化                                             │
│ d3.hierarchy(treeData, d => d.children)                      │
│ ↓                                                             │
│ - 添加 depth, height, parent                                 │
│ - 计算节点关系                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 步骤 5: 树布局计算                                            │
│ d3.tree().nodeSize([dx, dy])(root)                          │
│ ↓                                                             │
│ - 计算节点位置 (x, y)                                         │
│ - 生成连接线数据                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 步骤 6: 渲染                                                  │
│ renderNodes() + renderLinks()                                │
│ ↓                                                             │
│ - 绘制节点矩形                                                │
│ - 绘制文本                                                    │
│ - 绘制连接线                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 代码示例

```javascript
// 1. 获取数据
const apiResponse = await getCompanyShareholder({
  companyName: '京海控股',
  companyCreditCode: '91310000123456789X',
  type: 0
})

// 2. 转换数据
const treeData = DataTransformer.transformToTree(apiResponse)

// 3. 验证数据
if (!DataTransformer.validateData(treeData)) {
  throw new Error('数据格式无效')
}

// 4. D3 层次化
const rootOfDown = d3.hierarchy(treeData, d => d.children)
const rootOfUp = d3.hierarchy(treeData, d => d.parents)

// 5. 树布局
const tree = d3.tree().nodeSize([130, 90])
tree(rootOfDown)
tree(rootOfUp)

// 6. 渲染
renderNodes(rootOfDown.descendants())
renderLinks(rootOfDown.links())
```

---

## 如何修改数据

### 方法 1: 修改模拟数据（简单）

**文件**: `src/api/equityPenetrationChart/index.js`

#### 增加数据量

```javascript
export function getCompanyShareholder(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        code: 1,
        retInfo: {
          main: {
            name: params.companyName || '示例科技有限公司',
            companyCreditCode: params.companyCreditCode || '91310000123456789X'
          },
          upward: [
            // ========== 添加更多股东 ==========
            {
              name: '张三',
              ratio: '30.00%',
              amount: '3000',
              type: 1,
              id: 'P001',
              companyCreditCode: '',
              companyCode: 'P001',
              status: 1,  // 有子节点
              children: []
            },
            {
              name: '李四投资有限公司',
              ratio: '25.00%',
              amount: '2500',
              type: 2,
              id: 'C001',
              companyCreditCode: '91310000111111111A',
              companyCode: 'C001',
              status: 1,
              children: []
            },
            {
              name: '王五',
              ratio: '20.00%',
              amount: '2000',
              type: 1,
              id: 'P002',
              companyCreditCode: '',
              companyCode: 'P002',
              status: 0,  // 无子节点
              children: null
            },
            // ... 继续添加
          ],
          downward: [
            // ========== 添加更多子公司 ==========
            {
              name: '子公司A科技有限公司',
              ratio: '100.00%',
              amount: '5000',
              type: 2,
              id: 'SUB001',
              companyCreditCode: '91310000222222222B',
              companyCode: 'SUB001',
              status: 1,
              children: [
                // 添加孙公司
                {
                  name: '孙公司A1',
                  ratio: '100.00%',
                  amount: '2000',
                  type: 2,
                  id: 'SUBSUB001',
                  companyCreditCode: '91310000333333333C',
                  companyCode: 'SUBSUB001',
                  status: 0,
                  children: null
                }
              ]
            },
            {
              name: '子公司B网络科技',
              ratio: '51.00%',
              amount: '2550',
              type: 2,
              id: 'SUB002',
              companyCreditCode: '91310000444444444D',
              companyCode: 'SUB002',
              status: 1,
              children: []
            },
            // ... 继续添加
          ]
        }
      }
      
      resolve(mockData)
    }, 300)
  })
}
```

### 方法 2: 使用 V2 版本的大数据集

**步骤**:

1. **导入数据文件**

```javascript
// src/api/equityPenetrationChart/index.js
import { data as v2Data } from '../../equity-penetration-chart-v2-master/实验数据.js'

export function getCompanyShareholder(params) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 使用 V2 数据
      const rootNode = v2Data[0]
      
      // 转换为我们的格式
      const mockData = {
        code: 1,
        retInfo: {
          main: {
            name: rootNode.name,
            companyCreditCode: rootNode.id,
            companyCode: rootNode.id
          },
          upward: convertV2ToUpward(rootNode, v2Data),
          downward: convertV2ToDownward(rootNode, v2Data)
        }
      }
      
      resolve(mockData)
    }, 300)
  })
}

// 转换函数
function convertV2ToDownward(rootNode, allData) {
  const childrenIds = rootNode.childrenIdList?.split(',') || []
  return childrenIds.map(id => {
    const child = allData.find(item => item.id === id)
    return {
      id: child.id,
      name: child.name,
      percent: child.percent,
      amount: '0',
      type: 2,
      companyCreditCode: child.id,
      companyCode: child.id,
      status: child.childrenIdList ? 1 : 0,
      children: []
    }
  })
}
```

2. **修改导入路径**

确保 `实验数据.js` 文件可以被正确导入。

### 方法 3: 连接真实 API

**步骤**:

1. **修改 API 文件**

```javascript
// src/api/equityPenetrationChart/index.js

// 配置
const API_BASE_URL = 'https://your-api-domain.com'
const API_ENDPOINTS = {
  getShareholder: '/api/v1/company/shareholder'
}

export async function getCompanyShareholder(params) {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getShareholder}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}` // 如果需要认证
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API 调用失败:', error)
    // 返回模拟数据作为降级
    return getMockData(params)
  }
}

function getToken() {
  // 从 localStorage 或其他地方获取 token
  return localStorage.getItem('auth_token')
}
```

2. **配置环境变量**

```javascript
// .env.development
VITE_API_BASE_URL=http://localhost:3000

// .env.production
VITE_API_BASE_URL=https://api.production.com
```

```javascript
// 使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
```

### 方法 4: 创建数据生成器（推荐用于测试）

**文件**: `src/utils/dataGenerator.js`

```javascript
/**
 * 数据生成器 - 用于生成测试数据
 */
export class DataGenerator {
  /**
   * 生成随机公司数据
   * @param {Number} depth - 层级深度
   * @param {Number} childrenCount - 每层子节点数量
   * @returns {Object} 树形数据
   */
  static generateCompanyTree(depth = 3, childrenCount = 5) {
    const root = {
      id: 'ROOT001',
      name: '测试集团有限公司',
      ratio: '100.00%',
      amount: '100000',
      type: 2,
      companyCreditCode: '91000000000000001X',
      companyCode: 'ROOT001',
      direction: 'root',
      children: [],
      parents: []
    }

    // 生成向下数据
    root.children = this.generateNodes(depth, childrenCount, 'downward', 'SUB')
    
    // 生成向上数据
    root.parents = this.generateNodes(2, 3, 'upward', 'SHARE')

    return root
  }

  static generateNodes(depth, count, direction, prefix) {
    if (depth === 0) return null

    const nodes = []
    for (let i = 0; i < count; i++) {
      const id = `${prefix}${depth}_${i + 1}`
      const node = {
        id,
        name: `${direction === 'upward' ? '股东' : '子公司'}${id}`,
        ratio: `${(Math.random() * 100).toFixed(2)}%`,
        amount: `${Math.floor(Math.random() * 10000)}`,
        type: Math.random() > 0.5 ? 2 : 1,
        companyCreditCode: `9100000000000${id}`,
        companyCode: id,
        direction,
        status: depth > 1 ? 1 : 0,
        children: depth > 1 ? this.generateNodes(depth - 1, count, direction, prefix) : null
      }
      nodes.push(node)
    }

    return nodes
  }
}

// 使用示例
const testData = DataGenerator.generateCompanyTree(4, 6)
// 生成 4 层深度，每层 6 个节点的测试数据
```

---

## 工作流说明

### 完整工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 用户打开页面                                               │
│    - 访问 http://localhost:5173/                             │
│    - Vue Router 加载 Comparison.vue                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 组件初始化                                                 │
│    - EquityChart 组件 mounted                                │
│    - 调用 getData() 方法                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. 数据获取                                                   │
│    - dataService.getCompanyData(params)                      │
│    - 检查缓存                                                 │
│    - 调用 API                                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. 数据转换                                                   │
│    - DataTransformer.transformToTree()                       │
│    - 转换为树形结构                                           │
│    - 验证数据                                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 图表绘制                                                   │
│    - useEquityChart.drawChart()                              │
│    - 创建 SVG                                                 │
│    - D3 层次化                                                │
│    - 计算布局                                                 │
│    - 渲染节点和连接线                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 用户交互                                                   │
│    - 点击节点                                                 │
│    - 展开/折叠                                                │
│    - 缩放拖拽                                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. 懒加载（如需要）                                           │
│    - useLazyLoad.lazyLoadNode()                              │
│    - dataService.getChildrenData()                           │
│    - 更新节点数据                                             │
│    - 重新渲染                                                 │
└─────────────────────────────────────────────────────────────┘
```

### 关键文件说明

| 文件路径 | 作用 | 职责 |
|---------|------|------|
| `src/api/equityPenetrationChart/index.js` | API 层 | 数据获取 |
| `src/services/dataService.js` | 数据服务层 | 数据转换、缓存 |
| `src/components/EquityChart/useEquityChart.js` | 图表逻辑层 | 图表绘制、更新 |
| `src/components/EquityChart/index.vue` | 组件层 | UI 渲染、事件处理 |
| `src/components/EquityChart/useLazyLoad.js` | 懒加载层 | 按需加载数据 |

---

## 快速开始

### 1. 使用默认模拟数据

无需修改，直接运行即可。

### 2. 增加数据量

编辑 `src/api/equityPenetrationChart/index.js`，在 `upward` 和 `downward` 数组中添加更多节点。

### 3. 使用数据生成器

```javascript
// 在组件中使用
import { DataGenerator } from '@/utils/dataGenerator'

const testData = DataGenerator.generateCompanyTree(5, 8)
// 生成 5 层深度，每层 8 个节点
```

### 4. 连接真实 API

修改 `src/api/equityPenetrationChart/index.js`，替换为真实 API 调用。

---

## 常见问题

### Q1: 数据不显示？
A: 检查数据格式是否符合要求，使用 `DataTransformer.validateData()` 验证。

### Q2: 如何增加节点数量？
A: 修改 `src/api/equityPenetrationChart/index.js` 中的模拟数据，或使用数据生成器。

### Q3: 如何修改节点样式？
A: 修改 `src/components/EquityChart/constants.js` 中的 `NODE_COLORS` 配置。

### Q4: 懒加载不工作？
A: 确保节点的 `status` 字段为 1，表示有子节点。

### Q5: 缓存如何清除？
A: 调用 `dataService.clearCache()` 或等待 5 分钟自动过期。

---

**文档版本**: v1.0  
**创建日期**: 2026-02-25  
**最后更新**: 2026-02-25  
**维护者**: AI Assistant
