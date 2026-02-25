# Bug 修复：展开按钮和连接线问题

## 问题描述

用户报告了两个主要问题：
1. 点击展开按钮后，节点显示在同一层（层级结构错误）
2. 连接线和节点太近，完全看不到

## 根本原因

通过对比 V2 参考版本 (`reference/equity-penetration-chart-v2-master/StockTreeVertical.js`)，发现了以下问题：

1. **展开逻辑过于复杂**：之前的实现试图手动管理节点的展开/折叠状态，而 V2 版本使用了非常简单直接的方式
2. **连接线位置不正确**：连接线从节点中心开始，导致与节点重叠

## 解决方案

### 1. 简化展开逻辑

参考 V2 版本，直接在点击事件中切换 `children` 和 `_children`：

```javascript
// V2 版本的实现（参考）
.on('click', (e, d) => {
  e.stopPropagation()
  if (d.children) {
    d._children = d.children
    d.children = null
  } else {
    d.children = d._children
  }
  this.update(d)
})
```

我们的实现：

```javascript
const toggleNode = (event, node) => {
  if (event) {
    event.stopPropagation()
  }
  
  if (node.children) {
    node._children = node.children
    node.children = null
  } else {
    node.children = node._children
  }
  
  update(node)
}
```

### 2. 修复连接线位置

修改 `drawLink` 函数，让连接线从节点边缘开始，而不是中心：

```javascript
const drawLink = ({ source, target }) => {
  // 计算节点高度的一半
  const nodeHalfHeight = config.rectHeight / 2
  
  // 向下的连接线：从 source 底部到 target 顶部
  const sourceY = source.y > target.y ? source.y - nodeHalfHeight : source.y + nodeHalfHeight
  const targetY = target.y > source.y ? target.y - nodeHalfHeight : target.y + nodeHalfHeight
  
  const halfDistance = (targetY - sourceY) / 2
  const halfY = sourceY + halfDistance
  
  return `M${source.x},${sourceY} L${source.x},${halfY} ${target.x},${halfY} ${target.x},${targetY}`
}
```

### 3. 移除不必要的代码

- 删除了 `updateOld` 函数（未使用）
- 删除了 `bindExpandEvents` 函数（不再需要手动绑定事件）
- 简化了 `index.vue` 中的图表初始化逻辑

## 修改的文件

1. `src/components/EquityChart/useEquityChart.js`
   - 简化 `toggleNode` 函数
   - 删除 `updateOld` 函数
   - 传递 `rectHeight` 参数给 `useLinks`

2. `src/components/EquityChart/useLinks.js`
   - 修改 `drawLink` 函数，从节点边缘开始绘制连接线

3. `src/components/EquityChart/useNodes.js`
   - 更新展开按钮的点击事件，传递 `event` 参数

4. `src/components/EquityChart/index.vue`
   - 删除 `bindExpandEvents` 函数
   - 简化图表初始化逻辑

## 测试要点

1. ✅ 单个节点展开/折叠功能正常
2. ✅ 全部展开/全部折叠功能正常
3. ✅ 节点层级显示正确
4. ✅ 连接线从节点边缘开始，不与节点重叠
5. ✅ 展开按钮点击不会触发节点点击事件

## 参考

- V2 版本实现：`reference/equity-penetration-chart-v2-master/StockTreeVertical.js`
- 关键代码行：
  - 展开逻辑：第 329-340 行（向下树）、第 524-535 行（向上树）
  - 连接线绘制：第 577-581 行

## 经验教训

1. **保持简单**：V2 版本的实现非常简单有效，不要过度复杂化
2. **参考原版**：遇到问题时，先查看参考版本的实现方式
3. **事件处理**：D3 的事件处理已经很完善，不需要额外的手动绑定
4. **几何计算**：连接线的起止点需要考虑节点的实际尺寸
