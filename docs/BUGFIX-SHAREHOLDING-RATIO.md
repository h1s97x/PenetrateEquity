# Bug 修复：股东持股比例和向上穿透

## 问题描述

用户发现了两个重要的数据问题：

### 问题 1: 股东持股比例超过 100%

**现象**:
```
李四: 77.05%
李四: 17.40%
钱七: 3.77%
深圳投资集团: 38.89%
上海网络科技: 43.54%
-------------------
总计: 180.65% ❌ (超过 100%)
```

**原因**:
数据生成器使用 `Math.random() * 100` 为每个股东独立生成持股比例，没有考虑总和约束。

```javascript
// 错误的实现
static generateRatio() {
  const ratio = Math.random() * 100  // 每个股东独立生成 0-100%
  return ratio.toFixed(2)
}
```

### 问题 2: 股东无法继续向上穿透

**现象**:
- 企业股东节点没有展开按钮
- 点击企业股东无法查看其背后的股东
- 向上穿透只有一层

**原因**:
1. 向上节点错误地使用了 `children` 属性，应该使用 `parents`
2. 企业股东的 `status` 设置为 0，表示没有更多数据

```javascript
// 错误的实现
children: depth > 1 && !isPerson
  ? this.generateUpwardNodes(depth - 1, ...)
  : null
```

## 解决方案

### 1. 确保持股比例总和为 100%

新增 `generateRatiosSum100` 方法，使用归一化算法：

```javascript
/**
 * 生成多个持股比例，确保总和为 100%
 * @param {Number} count - 股东数量
 * @returns {Array<Number>} 比例数组
 */
static generateRatiosSum100(count) {
  if (count === 1) {
    return [100.00]
  }

  // 1. 生成随机数
  const randoms = []
  let sum = 0
  for (let i = 0; i < count; i++) {
    const random = Math.random()
    randoms.push(random)
    sum += random
  }

  // 2. 归一化到 100%
  const ratios = randoms.map(r => {
    const ratio = (r / sum) * 100
    return parseFloat(ratio.toFixed(2))
  })

  // 3. 修正舍入误差
  const actualSum = ratios.reduce((a, b) => a + b, 0)
  const diff = parseFloat((100 - actualSum).toFixed(2))
  if (diff !== 0) {
    ratios[0] = parseFloat((ratios[0] + diff).toFixed(2))
  }

  return ratios
}
```

**算法说明**:

1. **生成随机数**: 为每个股东生成一个随机数
2. **归一化**: 将随机数按比例缩放，使总和为 100
3. **修正误差**: 由于浮点数精度问题，可能存在微小误差，将误差加到第一个股东上

**示例**:
```javascript
// 3 个股东
generateRatiosSum100(3)
// 可能返回: [45.23, 32.18, 22.59]
// 总和: 100.00 ✅
```

### 2. 修复向上穿透逻辑

```javascript
static generateUpwardNodes(depth, count, level) {
  // ...
  
  const node = {
    // ...
    status: depth > 1 && !isPerson ? 1 : 0,  // 企业股东可以继续穿透
    // 修复：使用 parents 而不是 children
    parents: depth > 1 && !isPerson
      ? this.generateUpwardNodes(depth - 1, Math.max(1, count - 1), level + 1)
      : null
  }
  
  // ...
}
```

**关键改动**:
- `children` → `parents`: 向上穿透使用正确的属性名
- `status: 1`: 企业股东标记为可展开

### 3. 关联投资金额与持股比例

```javascript
amount: `${Math.floor(ratio * 1000)}`  // 金额与持股比例相关
```

之前金额是随机生成的，现在与持股比例成正比，更符合实际情况。

## 修改的文件

1. **src/utils/dataGenerator.js**
   - 新增 `generateRatiosSum100` 方法
   - 修改 `generateUpwardNodes` 方法
   - 修复 `children` → `parents`

2. **src/adapters/v2DataAdapter.js**
   - 新增 `generateRatiosSum100` 方法
   - 修改 `addMockShareholders` 方法
   - 修复股东数据生成逻辑

## 验证结果

### 修复前
```
股东 A: 77.05%
股东 B: 17.40%
股东 C: 3.77%
股东 D: 38.89%
股东 E: 43.54%
-------------------
总计: 180.65% ❌
```

### 修复后
```
股东 A: 35.23%
股东 B: 28.45%
股东 C: 19.87%
股东 D: 10.12%
股东 E: 6.33%
-------------------
总计: 100.00% ✅
```

## 数据结构对比

### 修复前
```javascript
{
  name: '投资公司A',
  ratio: '77.05%',  // 随机生成
  type: 2,
  status: 0,        // 无法展开
  children: [...]   // 错误的属性名
}
```

### 修复后
```javascript
{
  name: '投资公司A',
  ratio: '35.23%',  // 归一化后的比例
  type: 2,
  status: 1,        // 可以展开
  parents: [...]    // 正确的属性名
}
```

## 向上穿透示例

修复后，可以实现多层向上穿透：

```
                最终受益人（个人）
                      ↓
                  投资公司 A
                      ↓
                  投资公司 B
                      ↓
                  目标公司
```

每一层企业股东都可以继续展开，查看其背后的股东。

## 测试建议

1. **持股比例测试**
   ```javascript
   // 生成 5 个股东
   const ratios = DataGenerator.generateRatiosSum100(5)
   const sum = ratios.reduce((a, b) => a + b, 0)
   console.log('总和:', sum)  // 应该精确等于 100.00
   ```

2. **向上穿透测试**
   - 点击企业股东节点
   - 检查是否显示展开按钮
   - 点击展开按钮，查看上层股东
   - 验证多层穿透功能

3. **边界情况测试**
   - 1 个股东：应该是 100%
   - 2 个股东：总和应该是 100%
   - 10 个股东：总和应该是 100%

## 相关文档

- [数据配置说明](./DATA-CONFIGURATION.md)
- [数据流和格式](./data-flow-and-format.md)
- [股权穿透图组件文档](../src/components/EquityChart/README.md)

## 注意事项

1. **浮点数精度**: 由于 JavaScript 浮点数精度问题，可能存在 0.01% 的误差，已通过误差修正解决
2. **个人股东**: 个人股东通常没有上层股东，`parents` 为 `null`
3. **企业股东**: 企业股东可以继续向上穿透，`status` 为 1
4. **缓存清理**: 修改数据生成逻辑后，建议清除缓存重新加载

## 后续优化

1. **真实数据验证**: 连接真实 API 后，验证实际数据的持股比例是否合理
2. **持股比例显示**: 考虑在界面上显示总持股比例，方便用户验证
3. **穿透深度限制**: 可以配置最大穿透深度，避免无限递归
4. **循环持股检测**: 检测并处理循环持股的情况
