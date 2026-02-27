# Bug 修复：API 模式虚拟数据和导航判断

## Bug 1: API 模式下出现虚拟数据

### 问题描述

在 API 模式下，当查找不到指定公司时，系统会自动降级到生成器模式，显示虚拟的模拟数据。这是一个严重的问题，因为：

1. 用户期望看到真实的导入数据
2. 虚拟数据会误导用户
3. 无法区分真实数据和虚拟数据

### 问题原因

在 `src/api/equityPenetrationChart/index.js` 的 `fetchRealApiData` 函数中：

**问题代码：**
```javascript
try {
  // ... 查找和转换数据
  const treeData = ApiDataAdapter.convertToApiResponse(...)
  return treeData
} catch (error) {
  console.error('❌ API 模式加载失败:', error)
  console.log('降级到数据生成器模式')
  return generateMockDataWithGenerator(params)  // ❌ 自动降级
}
```

**问题：**
- 当找不到公司或数据转换失败时，自动降级到生成器模式
- 用户无法知道显示的是虚拟数据
- 没有明确的错误提示

### 解决方案

**修复后：**
```javascript
try {
  // 从 IndexedDB 获取最新的导入数据
  const importList = await ImportedDataService.getImportedList()
  
  if (importList.length === 0) {
    console.error('❌ 没有导入数据')
    throw new Error('请先导入 Excel 数据')  // ✅ 抛出明确错误
  }

  const importedData = await ImportedDataService.getImportedData(latestImport.id)
  
  if (!importedData || !importedData.rawData) {
    console.error('❌ 导入数据无效')
    throw new Error('导入数据无效，请重新导入')  // ✅ 抛出明确错误
  }

  // ... 转换数据
  const treeData = ApiDataAdapter.convertToApiResponse(...)
  return treeData
} catch (error) {
  console.error('❌ API 模式加载失败:', error)
  throw error  // ✅ 直接抛出错误，不降级
}
```

**改进：**
1. 没有导入数据时，抛出明确的错误信息
2. 数据无效时，提示用户重新导入
3. 不再自动降级到生成器模式
4. 错误会传递到 UI 层，用户可以看到错误提示

### 错误处理流程

```
API 模式
  ↓
检查是否有导入数据
  ├─ 没有 → 抛出错误："请先导入 Excel 数据"
  └─ 有 → 继续
       ↓
检查数据是否有效
  ├─ 无效 → 抛出错误："导入数据无效，请重新导入"
  └─ 有效 → 继续
       ↓
查找指定公司
  ├─ 找不到 → 抛出错误："未找到根节点"
  └─ 找到 → 生成树形数据
       ↓
返回真实数据 ✅
```

## Bug 2: 导航判断错误

### 问题描述

点击两次处于同一位置的子公司或股东查看股权图时，第二次会提示"这就是当前公司"，但实际上是不同的公司。

**场景示例：**
```
公司A（当前）
  ├─ 股东：公司B
  └─ 子公司：公司C

点击公司B → 查看公司B股权图 ✅
  ├─ 股东：公司D
  └─ 子公司：公司E

点击公司E → 提示"这就是当前公司" ❌（错误！）
```

### 问题原因

在 `src/views/EquityChartView.vue` 的 `viewThisCompany` 函数中：

**问题代码：**
```javascript
// 获取公司标识（优先使用 id，其次 companyCreditCode，最后 companyCode）
const companyIdentifier = nodeData.id || 
                         nodeData.companyCreditCode || 
                         nodeData.companyCode

// 检查是否是当前公司
const isCurrentCompany = 
  (companyIdentifier === creditCode.value) ||      // ❌ 可能匹配错误
  (companyIdentifier === companyCode.value) ||     // ❌ 可能匹配错误
  (nodeData.name === companyName.value)            // ❌ 公司名可能重复
```

**问题：**
1. `companyIdentifier` 可能是 `id`、`companyCreditCode` 或 `companyCode`，不确定
2. 使用多个条件判断，容易误判
3. 使用公司名称判断，可能有重名公司

### 解决方案

**修复后：**
```javascript
// 获取目标公司的客户编号（最准确的标识）
const targetCompanyCode = nodeData.companyCode || nodeData.id

if (!targetCompanyCode) {
  console.error('❌ 无法获取公司客户编号')
  alert('无法获取公司标识，无法跳转')
  return
}

console.log('✅ 目标公司客户编号:', targetCompanyCode)
console.log('📍 当前公司客户编号:', companyCode.value)

// 检查是否是当前公司（使用客户编号精确匹配）
if (targetCompanyCode === companyCode.value) {
  console.warn('⚠️ 这就是当前公司，无需跳转')
  alert('这就是当前公司')
  closeModal()
  return
}
```

**改进：**
1. 只使用客户编号（`companyCode`）进行判断
2. 客户编号是唯一标识，不会重复
3. 添加详细的日志输出，便于调试
4. 逻辑清晰，不会误判

### 为什么使用客户编号？

| 标识类型 | 唯一性 | 准确性 | 问题 |
|---------|--------|--------|------|
| 客户编号（companyCode） | ✅ 唯一 | ✅ 最准确 | 无 |
| 信用代码（companyCreditCode） | ✅ 唯一 | ⚠️ 可能为空 | 个人股东没有 |
| 公司名称（companyName） | ❌ 可能重复 | ❌ 不准确 | 重名公司 |
| 节点ID（id） | ⚠️ 不确定 | ⚠️ 不确定 | 可能是任意值 |

### 判断流程

```
用户点击节点
  ↓
获取节点的 companyCode
  ↓
与当前页面的 companyCode 比较
  ├─ 相同 → 提示"这就是当前公司" ✅
  └─ 不同 → 跳转到新公司 ✅
```

## 测试验证

### 测试场景 1：API 模式无数据

1. 清空所有导入数据
2. 访问股权图页面
3. ✅ 应该显示错误："请先导入 Excel 数据"
4. ❌ 不应该显示虚拟数据

### 测试场景 2：API 模式找不到公司

1. 导入数据
2. 访问不存在的公司
3. ✅ 应该显示错误："未找到根节点"
4. ❌ 不应该显示虚拟数据

### 测试场景 3：连续点击不同公司

```
公司A → 点击股东B → 公司B页面 → 点击子公司C → 公司C页面
✅ 每次都应该成功跳转
❌ 不应该提示"这就是当前公司"
```

### 测试场景 4：点击当前公司

```
公司A → 点击股东B（恰好是公司A） → 提示"这就是当前公司"
✅ 应该提示不能跳转
```

## 相关文件

- `src/api/equityPenetrationChart/index.js` - 修复 API 模式降级逻辑
- `src/views/EquityChartView.vue` - 修复导航判断逻辑

## 经验教训

### 1. 不要自动降级

在生产环境中，自动降级到虚拟数据是危险的：
- 用户无法区分真实数据和虚拟数据
- 可能导致错误决策
- 应该明确报错，让用户知道问题

### 2. 使用唯一标识

判断是否是同一个实体时：
- 使用唯一标识（如客户编号）
- 不要使用可能重复的字段（如名称）
- 不要使用不确定的字段（如 id）

### 3. 添加详细日志

调试复杂逻辑时：
- 添加详细的 console.log
- 记录关键变量的值
- 便于定位问题

### 4. 错误信息要明确

抛出错误时：
- 提供明确的错误信息
- 告诉用户如何解决
- 不要使用模糊的提示

## 后续优化

1. 添加错误边界组件，统一处理错误
2. 在 UI 上显示友好的错误提示
3. 提供"返回首页"或"重新导入"的快捷操作
4. 添加数据有效性检查，防止无效数据导入
