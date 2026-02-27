# API 数据集成指南

## 概述

本文档说明如何将 SQL 查询或 Excel 导出的数据集成到股权穿透图中。

## 数据格式要求

### 必需字段

| 字段名 | 说明 | 示例 | 备注 |
|--------|------|------|------|
| 公司名称 | 公司或被投资公司名称 | 京海控股集团 | 必需 |
| 客户编号 | 公司的唯一标识 | C001 | 必需，用于建立层级关系 |
| 统一社会信用代码 | 企业信用代码 | 91110000xxx | 可选 |
| 股东名称 | 股东名称 | 张三 / 李四投资 | 必需 |
| 股东客户编号 | 股东的客户编号 | S001 / C002 | 必需，用于建立层级关系 |
| 股东类型 | 个人/企业 | 个人、企业 | 必需 |
| 持股比例 | 持股百分比（数值格式） | 1 或 60 或 100 | 必需 |
| 投资金额 | 投资金额（万元） | 6000 | 必需 |
| 股东出资排名 | 股东排序 | 1, 2, 3... | 可选，用于排序 |

### 重要说明

1. **不需要节点ID和父节点ID**：系统通过"客户编号"和"股东客户编号"自动建立层级关系
2. **客户编号是关键**：用于唯一标识公司和建立投资关系
3. **股东客户编号**：
   - 如果股东是企业，填写该企业的客户编号
   - 如果股东是个人，可以填写个人编号或留空
4. **股东出资排名**：用于控制股东显示顺序，数字越小越靠前

## 数据关系说明

### 向上穿透（查看股东）

查找所有"客户编号"等于目标公司的记录，这些记录的"股东"就是该公司的股东。

```
记录: { 公司名称: '京海控股', 客户编号: 'C001', 股东名称: '张三', 股东客户编号: 'S001' }
      ↓
结果: 张三(S001) 是 京海控股(C001) 的股东
```

### 向下穿透（查看投资）

查找所有"股东客户编号"等于目标公司客户编号的记录，这些记录的"公司"就是该公司投资的公司。

```
记录: { 公司名称: '京海科技', 客户编号: 'C003', 股东名称: '京海控股', 股东客户编号: 'C001' }
      ↓
结果: 京海控股(C001) 投资了 京海科技(C003)
```

## SQL 查询示例

```sql
-- 查询公司股权结构
SELECT 
  company_name AS '公司名称',
  client_code AS '客户编号',
  credit_code AS '统一社会信用代码',
  shareholder_name AS '股东名称',
  shareholder_client_code AS '股东客户编号',
  shareholder_type AS '股东类型',
  shareholding_ratio AS '持股比例',
  investment_amount AS '投资金额',
  investment_rank AS '股东出资排名'
FROM equity_structure
WHERE company_name = '京海控股集团'
   OR shareholder_client_code IN (
     SELECT client_code FROM equity_structure WHERE company_name = '京海控股集团'
   )
ORDER BY investment_rank ASC;
```

## Excel 导出格式

### 表头示例

| 公司名称 | 客户编号 | 统一社会信用代码 | 股东名称 | 股东客户编号 | 股东类型 | 持股比例 | 投资金额 | 股东出资排名 |
|---------|---------|----------------|---------|-------------|---------|---------|---------|------------|
| 京海控股 | C001 | 91110000xxx | 张三 | S001 | 个人 | 60% | 6000 | 1 |
| 京海控股 | C001 | 91110000xxx | 李四投资 | C002 | 企业 | 40% | 4000 | 2 |
| 京海科技 | C003 | 91110000yyy | 京海控股 | C001 | 企业 | 100% | 10000 | 1 |

### 数据说明

- 第1行：张三(S001) 持有 京海控股(C001) 60%股份，排名第1
- 第2行：李四投资(C002) 持有 京海控股(C001) 40%股份，排名第2
- 第3行：京海控股(C001) 持有 京海科技(C003) 100%股份

## 代码集成

### 1. 导入适配器

```javascript
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter'
```

### 2. 准备数据

```javascript
// 从 SQL 或 Excel 导出的数据
const sqlData = [
  {
    '公司名称': '京海控股',
    '客户编号': 'C001',
    '统一社会信用代码': '91110000xxx',
    '股东名称': '张三',
    '股东客户编号': 'S001',
    '股东类型': '个人',
    '持股比例': '60',
    '投资金额': '6000',
    '股东出资排名': 1
  },
  {
    '公司名称': '京海控股',
    '客户编号': 'C001',
    '统一社会信用代码': '91110000xxx',
    '股东名称': '李四投资',
    '股东客户编号': 'C002',
    '股东类型': '企业',
    '持股比例': '40',
    '投资金额': '4000',
    '股东出资排名': 2
  },
  {
    '公司名称': '京海科技',
    '客户编号': 'C003',
    '统一社会信用代码': '91110000yyy',
    '股东名称': '京海控股',
    '股东客户编号': 'C001',
    '股东类型': '企业',
    '持股比例': '100',
    '投资金额': '10000',
    '股东出资排名': 1
  }
]
```

### 3. 验证和转换

```javascript
// 验证数据格式
const validation = ApiDataAdapter.validateApiData(sqlData)
if (!validation.valid) {
  console.error('数据格式错误:', validation.error)
  return
}

// 查看数据统计
const stats = ApiDataAdapter.getStatistics(sqlData)
console.log('数据统计:', stats)
// {
//   totalRecords: 3,
//   uniqueCompanies: 2,
//   uniqueShareholders: 3,
//   personShareholders: 1,
//   corporateShareholders: 2
// }

// 转换为树形结构
const treeData = ApiDataAdapter.convertToApiResponse(sqlData, {
  rootClientCode: 'C001'  // 使用客户编号指定根节点
  // 或 rootCompanyName: '京海控股'
  // 或 rootCreditCode: '91110000xxx'
})

// 使用转换后的数据
chartData.value = {
  id: treeData.retInfo.main.companyCode,
  name: treeData.retInfo.main.name,
  ratio: '100.00%',
  type: 2,
  children: treeData.retInfo.downward || [],
  parents: treeData.retInfo.upward || []
}
```

### 4. 自定义字段映射

如果你的 SQL/Excel 字段名不同，可以自定义映射：

```javascript
import { createFieldMapping } from '@/data/adapters/apiDataAdapter'

// 自定义字段映射
const customMapping = createFieldMapping({
  companyName: 'company_name',           // 你的字段名
  clientCode: 'client_id',               // 你的字段名
  shareholderName: 'shareholder',        // 你的字段名
  shareholderClientCode: 'shareholder_id' // 你的字段名
})

// 然后修改 FIELD_MAPPING 常量使用自定义映射
```

## 在 API 中使用

### 修改 `src/api/equityPenetrationChart/index.js`

```javascript
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter'

export async function getEquityPenetrationChart(companyName, clientCode) {
  try {
    // 1. 从后端 API 获取 SQL 数据
    const response = await fetch(`/api/equity?clientCode=${clientCode}`)
    const sqlData = await response.json()
    
    // 2. 验证数据
    const validation = ApiDataAdapter.validateApiData(sqlData)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    // 3. 转换数据
    const treeData = ApiDataAdapter.convertToApiResponse(sqlData, {
      rootClientCode: clientCode
    })
    
    return treeData
  } catch (error) {
    console.error('获取股权数据失败:', error)
    throw error
  }
}
```

## 数据更新

### 实时更新

```javascript
// 定时刷新数据
setInterval(async () => {
  const newData = await getEquityPenetrationChart(companyName, clientCode)
  chartData.value = newData
}, 60000) // 每分钟更新一次
```

### 手动刷新

```javascript
async function refreshData() {
  loading.value = true
  try {
    const newData = await getEquityPenetrationChart(companyName, clientCode)
    chartData.value = newData
  } catch (error) {
    console.error('刷新失败:', error)
  } finally {
    loading.value = false
  }
}
```

## 注意事项

1. **客户编号唯一性**：每个公司的客户编号必须唯一
2. **股东客户编号**：
   - 企业股东必须填写客户编号
   - 个人股东可以使用个人编号或留空
3. **持股比例格式**：使用数值格式（1 表示 1%，60 表示 60%，100 表示 100%）
4. **股东类型**：支持"个人"、"企业"、"自然人"、"法人"、"公司"等
5. **数据完整性**：确保所有必需字段都有值
6. **股东出资排名**：数字越小越靠前，用于控制显示顺序

## 常见问题

### Q: 没有节点ID和父节点ID怎么办？

A: 不需要！系统通过"客户编号"和"股东客户编号"自动建立层级关系。

### Q: 如何处理多层级股权结构？

A: 只要数据中包含完整的"客户编号"和"股东客户编号"关系，系统会自动递归构建多层级结构。

### Q: 持股比例总和不是 100% 怎么办？

A: 适配器会保留原始比例，不会自动归一化。建议在 SQL 查询时确保比例正确。

### Q: 如何支持向上穿透（查看股东）？

A: 在数据中包含公司的股东信息，适配器会自动构建 `parents` 数组。

### Q: Excel 数据如何导入？

A: 使用 JavaScript 库（如 xlsx）读取 Excel 文件，转换为 JSON 数组后传给适配器。

```javascript
import * as XLSX from 'xlsx'

function readExcel(file) {
  const workbook = XLSX.read(file, { type: 'binary' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet)
  
  return ApiDataAdapter.convertToApiResponse(jsonData, {
    rootClientCode: 'C001'
  })
}
```

### Q: 股东出资排名有什么用？

A: 用于控制股东在图表中的显示顺序，数字越小越靠前。如果不提供，系统会按数据原始顺序显示。

## 完整示例

参考 `src/data/adapters/apiDataAdapter.js` 文件中的使用示例。
