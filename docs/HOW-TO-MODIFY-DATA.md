# 如何修改数据 - 快速指南

## 🎯 目标

本文档帮助你快速了解如何修改股权穿透图的数据。

---

## 📍 数据来源位置

### 主要文件

```
src/
├── api/
│   └── equityPenetrationChart/
│       └── index.js          ← 数据 API（这里修改！）
├── utils/
│   └── dataGenerator.js      ← 数据生成器
└── services/
    └── dataService.js        ← 数据服务层
```

---

## 🚀 快速开始

### 方法 1: 使用数据生成器（推荐）⭐

**最简单的方式！自动生成大量测试数据。**

#### 步骤 1: 确认配置

检查 `.env.development` 文件：

```bash
# 可选值: mock, generator, v2, api
VITE_DATA_MODE=generator
```

#### 步骤 2: 选择场景

在组件中传入 `scenario` 参数：

```vue
<EquityChart
  company-name="测试公司"
  scenario="complex"
/>
```

可选场景：
- `simple` - 简单（2层，少量节点）
- `medium` - 中等（3层，中等节点）
- `complex` - 复杂（4层，大量节点）⭐ 默认
- `deep` - 深度（6层，少节点）
- `wide` - 广度（2层，多节点）

#### 步骤 3: 自定义生成

修改 `src/api/equityPenetrationChart/index.js`:

```javascript
// 找到这一行
const scenario = params.scenario || 'complex'

// 改成你想要的场景
const scenario = params.scenario || 'wide'  // 使用广度场景
```

或者自定义参数：

```javascript
const treeData = DataGenerator.generateCompanyTree({
  downwardDepth: 5,        // 向下5层
  upwardDepth: 3,          // 向上3层
  childrenPerLevel: 8,     // 每层8个子节点
  shareholderCount: 5,     // 5个股东
  companyName: '我的测试公司'
})
```

---

### 方法 2: 使用 V2 实验数据 ⭐

**真实的大规模数据！包含 1368 个节点的完整股权结构。**

#### 步骤 1: 切换到 V2 模式

修改 `.env.development`:

```bash
VITE_DATA_MODE=v2
```

#### 步骤 2: 查看数据

V2 数据来自 `equity-penetration-chart-v2-master/实验数据.js`，包含：
- 1368 个真实企业节点
- 完整的股权穿透关系
- 真实的公司名称和持股比例

数据格式：
```javascript
{
  id: "BG00001",
  childrenIdList: "BG00008,BG01362,BG00012,...",  // 子节点ID列表
  name: "京海控股集团有限公司",
  percent: "100.00"
}
```

#### 步骤 3: 自定义根节点

默认使用第一个节点作为根节点，可以修改 `src/adapters/v2DataAdapter.js`:

```javascript
// 指定特定节点作为根节点
const apiResponse = V2DataAdapter.convertToApiResponse(flatData, 'BG00003')
```

#### 步骤 4: 调整股东数量

修改 `src/adapters/v2DataAdapter.js`:

```javascript
// 添加模拟股东（V2 数据没有向上股东信息）
V2DataAdapter.addMockShareholders(treeData, 5)  // 改成 5 个股东
```

---

### 方法 3: 修改模拟数据

**适合需要特定数据的场景。**

#### 步骤 1: 切换到 MOCK 模式

修改 `.env.development`:

```bash
VITE_DATA_MODE=mock
```

#### 步骤 2: 编辑数据

打开 `src/api/equityPenetrationChart/index.js`，找到 `generateSimpleMockData` 函数：

```javascript
function generateSimpleMockData(params) {
  const mockData = {
    code: 1,
    retInfo: {
      main: {
        name: '我的公司名称',  // ← 修改这里
        companyCreditCode: '91310000123456789X'
      },
      upward: [
        // ========== 添加股东 ==========
        {
          name: '股东A',
          percent: '30.00',
          amount: '3000',
          type: 1,  // 1: 个人, 2: 企业
          id: 'shareholder001',
          companyCreditCode: '',
          companyCode: 'shareholder001',
          status: 1  // 1: 有子节点, 0: 无子节点
        },
        {
          name: '股东B投资公司',
          percent: '70.00',
          amount: '7000',
          type: 2,
          id: 'shareholder002',
          companyCreditCode: '91310000111111111A',
          companyCode: 'shareholder002',
          status: 0
        }
        // 继续添加更多股东...
      ],
      downward: [
        // ========== 添加子公司 ==========
        {
          name: '子公司A',
          percent: '100.00',
          amount: '5000',
          type: 2,
          id: 'subsidiary001',
          companyCreditCode: '91310000222222222B',
          companyCode: 'subsidiary001',
          status: 1
        }
        // 继续添加更多子公司...
      ]
    }
  }
  
  return mockData
}
```

---

### 方法 4: 连接真实 API

**用于生产环境。**

#### 步骤 1: 配置 API 地址

创建 `.env.local` 文件：

```bash
VITE_API_BASE_URL=https://your-api.com
VITE_DATA_MODE=api
```

#### 步骤 2: 修改 API 调用

编辑 `src/api/equityPenetrationChart/index.js`:

```javascript
export async function getCompanyShareholder(params) {
  if (CURRENT_MODE === DATA_MODE.API) {
    // 真实 API 调用
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/shareholder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(params)
      })
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('API 调用失败:', error)
      // 降级到模拟数据
      return generateSimpleMockData(params)
    }
  }
  
  // ... 其他模式
}
```

---

## 📊 数据格式说明

### 必需字段

每个节点必须包含以下字段：

```javascript
{
  id: "唯一标识",           // 必需
  name: "公司/个人名称",     // 必需
  percent: "50.00",         // 持股比例（不带%）
  amount: "5000",           // 金额（万元）
  type: 1,                  // 1: 个人, 2: 企业
  companyCreditCode: "",    // 统一社会信用代码
  companyCode: "",          // 公司代码
  status: 1                 // 0: 无子节点, 1: 有子节点
}
```

### 完整示例

```javascript
{
  code: 1,  // 1: 成功, 0: 失败
  retInfo: {
    main: {
      name: "根公司",
      companyCreditCode: "91310000123456789X"
    },
    upward: [  // 股东（向上）
      {
        id: "S001",
        name: "张三",
        percent: "60.00",
        amount: "6000",
        type: 1,
        companyCreditCode: "",
        companyCode: "S001",
        status: 0
      }
    ],
    downward: [  // 子公司（向下）
      {
        id: "C001",
        name: "子公司A",
        percent: "100.00",
        amount: "10000",
        type: 2,
        companyCreditCode: "91310000111111111A",
        companyCode: "C001",
        status: 1
      }
    ]
  }
}
```

---

## 🎨 常见场景

### 场景 1: 我想要更多节点

**方法 A: 使用数据生成器**

```javascript
// 在 src/api/equityPenetrationChart/index.js 中
const treeData = DataGenerator.generateCompanyTree({
  downwardDepth: 6,        // 增加深度
  childrenPerLevel: 10     // 增加每层节点数
})
```

**方法 B: 手动添加**

在 `generateSimpleMockData` 函数的 `upward` 或 `downward` 数组中添加更多对象。

### 场景 2: 我想要特定的公司结构

使用 MOCK 模式，手动编写数据结构。

### 场景 3: 我想测试大数据量

```javascript
// 使用数据生成器
const treeData = DataGenerator.generateLargeDataset(1000)
// 生成约 1000 个节点
```

### 场景 4: 我想要真实数据

连接真实 API，参考"方法 3"。

---

## 🔧 调试技巧

### 1. 查看当前数据模式

打开浏览器控制台，查看日志：

```
当前数据模式: generator
🎲 使用数据生成器
```

### 2. 查看数据统计

```javascript
import { DataStatistics } from '@/utils/dataGenerator'

const stats = DataStatistics.analyze(treeData)
DataStatistics.printStats(treeData)
```

输出：
```
========== 数据统计 ==========
总节点数: 156
最大深度: 4
向下节点: 120
向上节点: 36
企业节点: 140
个人节点: 16
叶子节点: 80
============================
```

### 3. 清除缓存

```javascript
import { clearCache } from '@/api/equityPenetrationChart/index'

clearCache()  // 清除所有缓存
```

---

## ⚠️ 注意事项

1. **修改后需要刷新页面**
   - 修改 `.env` 文件后需要重启开发服务器
   - 修改 JS 文件后会自动热更新

2. **数据格式必须正确**
   - 缺少必需字段会导致渲染失败
   - 使用 `DataTransformer.validateData()` 验证

3. **性能考虑**
   - 节点数超过 500 时可能会卡顿
   - 建议使用懒加载

4. **缓存机制**
   - 数据会缓存 5 分钟
   - 相同参数的请求会使用缓存

---

## 📚 相关文档

- [数据流与数据格式详细文档](./data-flow-and-format.md)
- [快速启动指南](../QUICKSTART.md)
- [组件使用文档](../src/components/EquityChart/README.md)

---

## 🆘 常见问题

### Q: 修改数据后没有变化？
A: 
1. 检查是否清除了缓存
2. 检查数据模式是否正确
3. 刷新页面

### Q: 数据生成器生成的数据太多？
A: 使用 `simple` 或 `medium` 场景，或自定义参数减少节点数。

### Q: 如何只修改根节点名称？
A: 在组件中传入 `company-name` prop：
```vue
<EquityChart company-name="我的公司" />
```

### Q: 数据格式错误怎么办？
A: 查看浏览器控制台的错误信息，使用 `DataTransformer.validateData()` 验证数据。

---

**最后更新**: 2026-02-25  
**维护者**: AI Assistant
