# 首页和公司切换功能

## 功能概述

新增了首页功能，用户可以浏览公司列表、搜索公司，并切换查看不同公司的股权穿透图。

## 新增文件

### 1. `src/views/Home.vue`
首页组件，包含以下功能：
- 公司列表展示（网格布局）
- 搜索功能（支持公司名称和信用代码）
- 公司卡片显示基本信息（子公司数、股东数）
- 点击卡片跳转到股权图查看页面
- 响应式设计，支持移动端

### 2. `src/views/EquityChartView.vue`
股权图查看页面，包含以下功能：
- 顶部导航栏（返回按钮、公司信息）
- 股权图展示区域
- 节点详情弹窗
- 支持点击节点查看该公司的股权图（企业节点）

## 预设公司数据

系统预设了 10 家公司，每家公司有不同的数据结构：

| 公司名称 | 信用代码 | 子公司数 | 股东数 | 数据特点 |
|---------|---------|---------|--------|---------|
| 京海控股集团 | 91310000123456789X | 8 | 3 | 中等规模 |
| 阿里巴巴集团 | 91330000MA27XYZ123 | 156 | 12 | 大规模，深层级 |
| 腾讯控股 | 91440300MA5ABC1234 | 234 | 8 | 超大规模 |
| 字节跳动 | 91110108MA01DEF567 | 89 | 15 | 多股东 |
| 华为技术 | 91440300618520018E | 178 | 2 | 少股东，多子公司 |
| 小米科技 | 91110108551385082Q | 67 | 9 | 中等规模 |
| 美团科技 | 91110108MA00GHI890 | 45 | 11 | 中等规模 |
| 京东集团 | 91110000633674814D | 123 | 7 | 大规模 |
| 百度在线 | 91110000802100433B | 98 | 6 | 中等规模 |
| 网易（杭州） | 91330000MA27JKL456 | 54 | 5 | 中等规模 |

## 数据配置

在 `src/api/equityPenetrationChart/index.js` 中配置了 `companyDataConfigs` 对象：

```javascript
const companyDataConfigs = {
  '91310000123456789X': {
    companyName: '京海控股集团有限公司',
    downwardDepth: 3,      // 向下层级深度
    upwardDepth: 2,        // 向上层级深度
    childrenPerLevel: 4,   // 每层子节点数
    shareholderCount: 3    // 股东数量
  },
  // ... 其他公司配置
}
```

## 使用流程

1. **访问首页**
   - 打开应用，默认显示首页
   - 看到 10 家公司的卡片列表

2. **搜索公司**
   - 在搜索框输入公司名称或信用代码
   - 列表实时过滤显示匹配结果

3. **查看股权图**
   - 点击公司卡片
   - 跳转到股权图查看页面
   - 系统根据公司信用代码生成对应的数据

4. **切换公司**
   - 在股权图页面点击"返回首页"
   - 或点击企业节点，查看该企业的股权图

## 路由配置

```javascript
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home  // 首页
  },
  {
    path: '/chart',
    name: 'EquityChart',
    component: EquityChartView  // 股权图查看页
  }
]
```

## 样式特点

### 首页
- 渐变背景（紫色系）
- 卡片式布局
- 悬浮动画效果
- 响应式网格布局

### 股权图页面
- 顶部固定导航栏
- 全屏图表展示
- 模态弹窗显示节点详情
- 平滑过渡动画

## 技术实现

### 搜索功能
使用 Vue 3 的 `computed` 实现实时搜索：

```javascript
const filteredCompanies = computed(() => {
  if (!searchKeyword.value) {
    return companies.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return companies.value.filter(company => 
    company.name.toLowerCase().includes(keyword) ||
    company.creditCode.toLowerCase().includes(keyword)
  )
})
```

### 路由跳转
使用 Vue Router 传递查询参数：

```javascript
router.push({
  name: 'EquityChart',
  query: {
    companyName: company.name,
    creditCode: company.creditCode
  }
})
```

### 数据生成
根据公司信用代码查找配置，生成对应的树形数据：

```javascript
const config = companyDataConfigs[companyCreditCode] || defaultConfig
const treeData = DataGenerator.generateCompanyTree({
  ...config,
  companyCreditCode
})
```

## 扩展性

### 添加新公司
在 `src/views/Home.vue` 的 `companies` 数组中添加：

```javascript
{
  id: 11,
  name: '新公司名称',
  creditCode: '91XXXXXXXXXXXXXXXXX',
  subsidiaryCount: 50,
  shareholderCount: 5
}
```

在 `src/api/equityPenetrationChart/index.js` 的 `companyDataConfigs` 中添加配置：

```javascript
'91XXXXXXXXXXXXXXXXX': {
  companyName: '新公司名称',
  downwardDepth: 3,
  upwardDepth: 2,
  childrenPerLevel: 5,
  shareholderCount: 3
}
```

### 连接真实 API
修改 `.env` 文件：

```
VITE_DATA_MODE=api
```

在 `src/api/equityPenetrationChart/index.js` 中实现真实 API 调用逻辑。

## 后续优化

1. **分页功能**：当公司数量增多时，添加分页或虚拟滚动
2. **筛选功能**：按行业、规模等维度筛选公司
3. **收藏功能**：支持收藏常用公司
4. **历史记录**：记录最近查看的公司
5. **数据统计**：在首页显示更多统计信息
6. **导出功能**：支持导出股权图为图片或 PDF

## 注意事项

1. 所有数据都是模拟生成的，不代表真实公司结构
2. 信用代码是随机生成的，仅用于演示
3. 子公司数和股东数是配置的近似值，实际生成可能略有差异
4. 搜索功能区分大小写（已转换为小写比较）
