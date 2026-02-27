# Bug 修复：弹窗跳转显示假数据

## 问题描述

用户从弹窗点击"查看此公司股权图"跳转时，显示的是模拟的假数据，而不是导入的真实数据。

## 问题原因

### 1. 参数传递问题

在 `EquityChartView.vue` 的 `viewThisCompany` 函数中：

**问题代码：**
```javascript
const newQuery = {
  companyName: nodeData.name,
  creditCode: nodeData.companyCreditCode || companyIdentifier,  // ❌ 错误的参数名
  companyCode: nodeData.companyCode || companyIdentifier,       // ❌ 可能传递错误的值
  t: Date.now()
}
```

**问题：**
- 使用了 `creditCode` 作为参数名，但 API 接口期望的是 `companyCreditCode`
- `companyCode` 应该传递客户编号（clientCode），但可能传递了信用代码

### 2. API 参数优先级问题

在 `src/api/equityPenetrationChart/index.js` 的 `fetchRealApiData` 函数中：

**问题代码：**
```javascript
let rootClientCode = params.companyCode || params.companyCreditCode  // ❌ 优先级错误
```

**问题：**
- 当 `companyCode` 和 `companyCreditCode` 都存在时，应该优先使用 `companyCode`（客户编号）
- 但原代码使用了 `||` 运算符，导致如果 `companyCode` 为空字符串时会降级使用 `companyCreditCode`

### 3. 参数读取问题

在 `EquityChartView.vue` 的 `loadCompanyInfo` 函数中：

**问题代码：**
```javascript
creditCode.value = route.query.creditCode || route.query.companyCode || '91310000123456789X'
companyCode.value = route.query.companyCode || route.query.clientCode || ''
```

**问题：**
- `creditCode` 的降级逻辑不正确，应该优先读取 `companyCreditCode`
- 参数名不一致导致无法正确读取

## 解决方案

### 1. 修复 viewThisCompany 参数传递

**修复后：**
```javascript
const newQuery = {
  companyName: nodeData.name,
  companyCode: nodeData.companyCode || nodeData.id,  // ✅ 客户编号（优先）
  companyCreditCode: nodeData.companyCreditCode,     // ✅ 信用代码
  creditCode: nodeData.companyCreditCode,            // ✅ 兼容旧参数
  t: Date.now()
}
```

**改进：**
- 明确传递 `companyCode`（客户编号）和 `companyCreditCode`（信用代码）
- 添加 `creditCode` 作为兼容参数
- 确保 `companyCode` 优先使用 `nodeData.companyCode` 或 `nodeData.id`

### 2. 修复 API 参数优先级

**修复后：**
```javascript
// 优先使用 companyCode（客户编号），其次是 companyCreditCode（信用代码）
let rootClientCode = params.companyCode
let rootCompanyName = params.companyName
let rootCreditCode = params.companyCreditCode
```

**改进：**
- 分别处理三个参数，不使用 `||` 运算符
- 明确优先级：`companyCode` > `companyName` > `companyCreditCode`
- 添加详细的日志输出，便于调试

### 3. 修复参数读取逻辑

**修复后：**
```javascript
// 优先使用 companyCode（客户编号），其次使用 creditCode 或 companyCreditCode（信用代码）
companyCode.value = route.query.companyCode || route.query.clientCode || ''
creditCode.value = route.query.companyCreditCode || route.query.creditCode || ''
```

**改进：**
- `companyCode` 优先读取 `route.query.companyCode`
- `creditCode` 优先读取 `route.query.companyCreditCode`
- 参数名保持一致

## 数据流说明

### 完整的数据流

1. **用户点击弹窗按钮**
   ```
   selectedNode = {
     id: 'C001',                    // 客户编号
     name: '京海科技',
     companyCode: 'C001',           // 客户编号
     companyCreditCode: '91110000xxx'  // 信用代码
   }
   ```

2. **viewThisCompany 构建参数**
   ```javascript
   {
     companyName: '京海科技',
     companyCode: 'C001',           // ✅ 客户编号
     companyCreditCode: '91110000xxx',  // ✅ 信用代码
     creditCode: '91110000xxx'      // 兼容参数
   }
   ```

3. **路由跳转**
   ```
   /equity-chart?companyName=京海科技&companyCode=C001&companyCreditCode=91110000xxx
   ```

4. **EquityChartView 读取参数**
   ```javascript
   companyName.value = '京海科技'
   companyCode.value = 'C001'      // ✅ 客户编号
   creditCode.value = '91110000xxx'  // ✅ 信用代码
   ```

5. **EquityChart 组件调用 API**
   ```javascript
   const params = {
     companyName: '京海科技',
     companyCode: 'C001',           // ✅ 客户编号
     companyCreditCode: '91110000xxx',  // ✅ 信用代码
     type: 0
   }
   ```

6. **API 接口处理**
   ```javascript
   // fetchRealApiData
   rootClientCode = 'C001'          // ✅ 使用客户编号
   rootCompanyName = '京海科技'
   rootCreditCode = '91110000xxx'
   ```

7. **ApiDataAdapter 查找根节点**
   ```javascript
   // findRootNode 优先使用 clientCode
   return apiData.find(item => 
     this.getFieldValue(item, 'clientCode') === 'C001'  // ✅ 匹配成功
   )
   ```

8. **生成树形数据**
   ```javascript
   // 从 rawData 中查找所有相关记录
   // 构建完整的股权穿透图
   ```

## 关键点

### 参数命名规范

| 参数名 | 含义 | 示例 | 优先级 |
|--------|------|------|--------|
| `companyCode` | 客户编号 | C001 | 最高 |
| `companyName` | 公司名称 | 京海科技 | 中 |
| `companyCreditCode` | 信用代码 | 91110000xxx | 低 |
| `creditCode` | 信用代码（兼容） | 91110000xxx | 兼容 |

### 查找优先级

`ApiDataAdapter.findRootNode` 的查找顺序：
1. 客户编号（`clientCode`）- 最精确
2. 公司名称（`companyName`）- 可能重名
3. 信用代码（`creditCode`）- 备选方案

### 为什么优先使用客户编号？

1. **唯一性**：客户编号是系统内部唯一标识
2. **准确性**：避免公司名称重名问题
3. **性能**：客户编号查找更快
4. **一致性**：与数据库主键对应

## 测试验证

### 测试场景 1：从首页跳转

```
首页 → 点击公司卡片 → 查看股权图
✅ 应该显示导入的真实数据
```

### 测试场景 2：从弹窗跳转

```
股权图 → 点击节点 → 弹窗 → 查看此公司股权图
✅ 应该显示导入的真实数据
✅ 不应该显示模拟数据
```

### 测试场景 3：连续跳转

```
公司A → 弹窗 → 公司B → 弹窗 → 公司C
✅ 每次跳转都应该显示正确的公司数据
```

### 验证方法

1. 打开浏览器控制台
2. 查看日志输出：
   ```
   🌐 使用 API 模式（导入数据）
   📋 查询参数: { companyCode: 'C001', ... }
   🔍 查找公司: { rootClientCode: 'C001', ... }
   ✅ 成功生成树形数据: 京海科技
   ```
3. 如果看到 `⚠️ 没有导入数据，降级到生成器模式`，说明有问题

## 相关文件

- `src/views/EquityChartView.vue` - 修复参数传递和读取
- `src/api/equityPenetrationChart/index.js` - 修复 API 参数优先级
- `src/data/adapters/apiDataAdapter.js` - 数据适配器（无需修改）

## 后续优化

1. 统一参数命名规范，避免 `creditCode` 和 `companyCreditCode` 混用
2. 添加参数验证，确保必要参数存在
3. 改进错误提示，明确告知用户为什么显示模拟数据
4. 添加单元测试，覆盖各种跳转场景
