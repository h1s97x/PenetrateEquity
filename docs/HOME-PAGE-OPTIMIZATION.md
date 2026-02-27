# 首页优化和示例数据分离

## 概述

本次优化将首页改为只显示导入的数据，并将示例公司数据移到单独的页面，简化了用户体验和数据流。

## 主要改动

### 1. Excel 导入流程优化

**文件**: `src/views/ExcelImport.vue`

**改动内容**:
- 移除了步骤 3（选择根节点公司）
- 导入后直接提取所有公司，不需要用户选择
- 简化了导入流程：下载模板 → 上传文件 → 查看结果
- 移除了相关的 UI 组件和变量（`rootClientCode`, `rootCompanyName`）

**用户体验**:
- 步骤从 4 步减少到 3 步
- 导入后可以直接查看所有公司列表
- 更加直观和高效

### 2. 首页数据显示优化

**文件**: `src/views/Home.vue`

**改动内容**:
- 移除了示例公司数据（10 个示例公司）
- 首页只显示从 localStorage 读取的最新导入数据
- 添加了空状态页面，引导用户导入数据或查看示例
- 简化了数据加载逻辑，不再需要 `dataId` 参数

**数据流**:
```
用户访问首页
  ↓
检查 localStorage 是否有导入数据
  ↓
有数据 → 显示导入的公司列表
  ↓
无数据 → 显示空状态，引导用户操作
```

**空状态功能**:
- 显示欢迎信息
- 提供两个操作按钮：
  - 导入 Excel 数据（主要操作）
  - 查看示例数据（次要操作）

### 3. 示例数据独立页面

**文件**: `src/views/ExampleCompanies.vue`（新建）

**功能**:
- 展示 10 个示例公司数据
- 提供搜索功能
- 点击公司卡片可以查看股权穿透图
- 提供返回首页按钮

**示例公司列表**:
1. 京海控股集团有限公司
2. 阿里巴巴集团控股有限公司
3. 腾讯控股有限公司
4. 字节跳动科技有限公司
5. 华为技术有限公司
6. 小米科技有限责任公司
7. 美团科技有限公司
8. 京东集团股份有限公司
9. 百度在线网络技术有限公司
10. 网易（杭州）网络有限公司

### 4. 路由配置更新

**文件**: `src/router/index.js`

**新增路由**:
```javascript
{
  path: '/examples',
  name: 'ExampleCompanies',
  component: ExampleCompanies
}
```

### 5. API 配置优化

**文件**: `src/api/equityPenetrationChart/index.js`

**改动内容**:
- 将示例公司配置导出为 `EXAMPLE_COMPANY_CONFIGS`
- 移除了未使用的临时数据注入代码（`temporaryDataInjection`）
- 保持 API 模式的降级逻辑不变

## 用户流程

### 新用户流程

1. 访问首页 → 看到空状态
2. 点击"导入 Excel 数据" → 进入导入页面
3. 下载模板 → 填写数据 → 上传文件
4. 导入成功 → 查看所有公司
5. 点击公司卡片 → 查看股权穿透图

### 体验示例数据流程

1. 访问首页 → 点击"查看示例数据"
2. 进入示例公司页面
3. 浏览 10 个示例公司
4. 点击公司卡片 → 查看股权穿透图

### 已有数据用户流程

1. 访问首页 → 自动显示最新导入的公司列表
2. 搜索或浏览公司
3. 点击公司卡片 → 查看股权穿透图
4. 可以点击"查看示例数据"切换到示例

## 数据存储

### localStorage 结构

```javascript
{
  "equity_chart_imports": [
    {
      "id": "import_1234567890",
      "timestamp": 1234567890000,
      "companyName": "京海控股集团",
      "companyCode": "C001",
      "creditCode": "91310000123456789X",
      "stats": {
        "totalRecords": 100,
        "uniqueCompanies": 20,
        "uniqueShareholders": 50,
        "personShareholders": 30,
        "corporateShareholders": 20
      }
    }
  ],
  "equity_chart_data_import_1234567890": {
    "data": { /* 树形数据 */ },
    "metadata": { /* 元数据 */ },
    "rawData": [ /* 原始 Excel 数据 */ ],
    "allCompanies": [ /* 所有公司列表 */ ]
  }
}
```

## 技术细节

### 数据模式

当前系统使用 `api` 模式（通过环境变量 `VITE_DATA_MODE=api` 配置）：

1. API 模式从 localStorage 读取导入数据
2. 使用 `ApiDataAdapter` 根据 `companyCode` 动态生成树形数据
3. 如果没有导入数据，自动降级到 `generator` 模式（使用示例公司配置）

### 降级策略

```
API 模式
  ↓
检查 localStorage 是否有导入数据
  ↓
有数据 → 使用 ApiDataAdapter 转换
  ↓
无数据 → 降级到 generator 模式
  ↓
使用 EXAMPLE_COMPANY_CONFIGS 生成示例数据
```

## 优势

1. **清晰的数据分离**: 导入数据和示例数据完全分离
2. **简化的用户流程**: 减少了导入步骤，提高效率
3. **更好的引导**: 空状态页面清晰地引导用户操作
4. **灵活的体验**: 用户可以随时切换查看示例数据
5. **统一的数据流**: 所有数据都通过 API 接口，保持一致性

## 后续优化建议

1. 添加导入数据的管理功能（删除、重命名等）
2. 支持多个导入数据集的切换
3. 添加数据导出功能
4. 优化搜索功能（支持拼音搜索、模糊匹配等）
5. 添加公司详情预览（不进入图表页面）

## 相关文件

- `src/views/ExcelImport.vue` - Excel 导入页面
- `src/views/Home.vue` - 首页
- `src/views/ExampleCompanies.vue` - 示例公司页面
- `src/router/index.js` - 路由配置
- `src/api/equityPenetrationChart/index.js` - API 接口
- `src/services/importedDataService.js` - 数据存储服务
- `src/data/adapters/apiDataAdapter.js` - API 数据适配器

## 测试建议

1. 测试首页空状态显示
2. 测试导入流程（跳过步骤 3）
3. 测试导入后首页显示
4. 测试示例公司页面
5. 测试搜索功能
6. 测试页面间的跳转
7. 测试 localStorage 数据持久化
