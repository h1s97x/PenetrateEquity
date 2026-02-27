# Bug 修复：导入失败和弹窗功能

## 问题描述

用户报告了三个问题：

1. **导入失败**：上传 Excel 文件后显示错误 "XLSX is not defined"
2. **缺少返回按钮**：导入页面没有返回首页的选项，导入失败后无法返回
3. **弹窗按钮无效**：点击"查看此公司股权图"按钮没有反应

## 问题分析

### 问题 1：XLSX is not defined

**原因**：
- `ExcelImport.vue` 的 `importData()` 函数中使用了 `XLSX.read()` 和 `XLSX.utils.sheet_to_json()`
- 但是 `<script setup>` 部分没有导入 `xlsx` 库
- 导致运行时报错：`XLSX is not defined`

**影响**：
- 用户无法导入 Excel 文件
- 所有导入操作都会失败

### 问题 2：缺少返回按钮

**原因**：
- 导入页面设计时没有考虑到用户可能需要中途返回
- 特别是导入失败时，用户被困在导入页面

**影响**：
- 用户体验差
- 导入失败后只能刷新页面或使用浏览器后退按钮

### 问题 3：弹窗按钮无效

**原因**：
- `EquityChartView.vue` 中的 `viewThisCompany()` 函数使用了错误的路由名称
- 代码中使用 `name: 'EquityChart'`，但实际路由名称是 `name: 'EquityChartView'`
- 路由跳转失败，导致按钮点击无效

**影响**：
- 用户无法从弹窗中跳转到其他公司的股权图
- 降低了系统的可用性

## 解决方案

### 修复 1：导入 XLSX 库

**文件**：`src/views/ExcelImport.vue`

**修改前**：
```javascript
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ExcelImporter } from '@/lib/utils/excelImporter.js'
import { ImportedDataService } from '@/services/importedDataService.js'
```

**修改后**：
```javascript
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { ExcelImporter } from '@/lib/utils/excelImporter.js'
import { ImportedDataService } from '@/services/importedDataService.js'
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter.js'
```

**说明**：
- 添加了 `import * as XLSX from 'xlsx'` 导入 XLSX 库
- 同时添加了 `ApiDataAdapter` 的导入（在 `importData()` 函数中使用）

### 修复 2：添加返回首页按钮

**文件**：`src/views/ExcelImport.vue`

**模板修改**：
```vue
<div class="excel-import-page">
  <div class="container">
    <!-- 返回首页按钮 -->
    <button @click="goHome" class="btn-back">
      ← 返回首页
    </button>
    
    <h1>Excel 数据导入</h1>
    <!-- ... -->
  </div>
</div>
```

**脚本修改**：
```javascript
// 返回首页
function goHome() {
  router.push({ name: 'Home' })
}
```

**样式修改**：
```css
.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.btn-back {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.btn-back:hover {
  background: #667eea;
  color: white;
  transform: translateX(-4px);
}
```

**说明**：
- 在页面左上角添加了返回按钮
- 使用绝对定位，不影响原有布局
- 按钮样式与系统整体风格一致
- 悬停时有动画效果

### 修复 3：修正路由名称

**文件**：`src/views/EquityChartView.vue`

**修改前**：
```javascript
const viewThisCompany = () => {
  if (selectedNode.value && selectedNode.value.companyCreditCode) {
    router.push({
      name: 'EquityChart',  // ❌ 错误的路由名称
      query: {
        companyName: selectedNode.value.name,
        creditCode: selectedNode.value.companyCreditCode
      }
    })
    closeModal()
  }
}
```

**修改后**：
```javascript
const viewThisCompany = () => {
  if (selectedNode.value) {
    // 使用 companyCode 或 companyCreditCode
    const code = selectedNode.value.companyCode || selectedNode.value.companyCreditCode
    
    router.push({
      name: 'EquityChartView',  // ✅ 正确的路由名称
      query: {
        companyName: selectedNode.value.name,
        creditCode: selectedNode.value.companyCreditCode || code,
        companyCode: selectedNode.value.companyCode || ''
      }
    })
    closeModal()
  }
}
```

**说明**：
- 修正路由名称为 `EquityChartView`（与 `src/router/index.js` 中定义一致）
- 改进了条件判断，不再要求必须有 `companyCreditCode`
- 添加了 `companyCode` 参数，支持导入数据的公司跳转
- 使用备用值确保总能获取到有效的标识符

## 测试验证

### 测试场景 1：Excel 导入

**步骤**：
1. 访问导入页面
2. 下载模板
3. 填写数据
4. 上传文件

**预期结果**：
- ✅ 文件上传成功
- ✅ 数据预览正常显示
- ✅ 导入成功，显示统计信息
- ✅ 可以查看所有公司

### 测试场景 2：返回首页

**步骤**：
1. 在导入页面的任意步骤
2. 点击左上角"返回首页"按钮

**预期结果**：
- ✅ 成功返回首页
- ✅ 按钮在所有步骤都可见
- ✅ 导入失败时也能返回

### 测试场景 3：弹窗跳转

**步骤**：
1. 查看任意公司的股权穿透图
2. 点击图表中的企业节点
3. 在弹窗中点击"查看此公司股权图"按钮

**预期结果**：
- ✅ 弹窗正常显示
- ✅ 按钮可点击
- ✅ 成功跳转到该公司的股权图
- ✅ 弹窗自动关闭

## 相关文件

- `src/views/ExcelImport.vue` - Excel 导入页面
- `src/views/EquityChartView.vue` - 股权图查看页面
- `src/router/index.js` - 路由配置
- `package.json` - 依赖配置（确认 xlsx 库已安装）

## 注意事项

1. **XLSX 库版本**：确保 `package.json` 中已安装 `xlsx` 库
2. **路由名称一致性**：所有路由跳转都应使用 `router/index.js` 中定义的名称
3. **返回按钮位置**：使用绝对定位，确保不影响页面布局
4. **错误处理**：导入失败时显示清晰的错误信息

## 后续优化建议

1. **导入进度提示**：添加导入进度条，提升用户体验
2. **错误详情**：提供更详细的错误信息和解决建议
3. **批量操作**：支持批量导入多个 Excel 文件
4. **数据校验**：在前端进行更严格的数据格式校验
5. **导入历史**：在导入页面显示最近的导入记录
