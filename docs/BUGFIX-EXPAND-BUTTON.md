# Bug 修复：展开按钮无法点击

## 🐛 问题描述

新版本的股权穿透图中，点击节点上的加号（+）按钮无法展开子节点，而旧版本可以正常展开。

## 🔍 问题原因

新版本在重构时，展开按钮被正确渲染，但是**没有绑定点击事件**。

### 代码对比

#### 旧版本（src/index.vue）
```javascript
// 展开按钮有点击事件
.on("click", click)

function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
    update(d, originalData, g);
  } else {
    // 懒加载子节点
    getCompanyShareholder(params).then(res => {
      d.children = res.retInfo.downward;
      update(d, originalData, g);
    });
  }
}
```

#### 新版本（修复前）
```javascript
// 展开按钮没有点击事件 ❌
const btnG = nodeEnter
  .append('g')
  .attr('class', 'expand-btn')
  .style('cursor', 'pointer')
  // 缺少 .on('click', ...) ❌
```

## ✅ 修复方案

### 1. 修改 `useNodes.js`

添加 `onToggleNode` 参数，并给展开按钮绑定点击事件：

```javascript
// 函数签名添加 onToggleNode 参数
export function useNodes(gNodes, config, onNodeClick, onToggleNode) {
  
  // 绘制展开按钮时传递 onToggleNode
  renderExpandButton(nodeEnter, 'downward', onToggleNode)
  
  // 展开按钮添加点击事件
  function renderExpandButton(nodeEnter, direction, onToggleNode) {
    const btnG = nodeEnter
      .append('g')
      .attr('class', 'expand-btn')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation() // 阻止事件冒泡
        onToggleNode?.(d)       // 调用展开/折叠函数
      })
    
    // ... 其他代码
  }
}
```

### 2. 修改 `useEquityChart.js`

传递 `toggleNode` 函数给 `useNodes`：

```javascript
// 渲染节点时传递 toggleNode 函数
const { renderDownwardNodes, renderUpwardNodes } = useNodes(
  gNodes, 
  config, 
  handleNodeClickWithLazyLoad,
  toggleNode  // ✅ 传递展开/折叠函数
)
```

### 3. 修复按钮显示逻辑

修复按钮的显示条件，确保有子节点时显示：

```javascript
.style('display', d => {
  // 修复前：只检查 _children
  // if (d.depth === 0 || !d._children) return 'none'
  
  // 修复后：检查 _children 或 children
  if (d.depth === 0 || (!d._children && !d.children)) {
    return 'none'
  }
  return null
})
```

## 📝 修改的文件

1. `src/components/EquityChart/useNodes.js`
   - 添加 `onToggleNode` 参数
   - 给展开按钮绑定点击事件
   - 修复按钮显示逻辑

2. `src/components/EquityChart/useEquityChart.js`
   - 传递 `toggleNode` 函数给 `useNodes`

## 🧪 测试验证

### 测试步骤

1. 启动开发服务器
   ```bash
   npm run dev
   ```

2. 访问对比页面
   ```
   http://localhost:5173/
   ```

3. 切换到"新版本"标签

4. 测试展开功能
   - 点击根节点下方的子节点上的 **+** 按钮
   - 应该能看到子节点展开
   - 按钮变成 **-** 符号

5. 测试折叠功能
   - 点击已展开节点上的 **-** 按钮
   - 应该能看到子节点折叠
   - 按钮变回 **+** 符号

### 预期结果

✅ 点击 + 按钮，节点展开，显示子节点  
✅ 点击 - 按钮，节点折叠，隐藏子节点  
✅ 按钮符号正确切换（+ ↔ -）  
✅ 展开后自动居中到节点  
✅ 动画流畅，无卡顿  

## 🎯 功能说明

### toggleNode 函数

```javascript
const toggleNode = async (node) => {
  if (node.children) {
    // 折叠：隐藏子节点
    node._children = node.children
    node.children = null
  } else {
    // 展开：显示子节点
    
    // 如果未加载，先懒加载
    if (!lazyLoader.isNodeLoaded(node.data.id) && node._children) {
      const direction = node.data.direction || 'downward'
      const children = await lazyLoader.lazyLoadNode(node, direction)
      
      if (children && children.length > 0) {
        node._children = children.map(child => ({
          ...child,
          direction
        }))
      }
    }
    
    node.children = node._children
  }
  update(node)
}
```

### 关键特性

1. **事件冒泡阻止**
   - 使用 `event.stopPropagation()` 防止触发节点点击事件

2. **懒加载集成**
   - 首次展开时自动加载子节点数据
   - 已加载的节点直接展开，无需重复请求

3. **动画效果**
   - 展开/折叠带有平滑过渡动画
   - 自动居中到操作的节点

4. **状态同步**
   - 按钮符号自动更新（+ ↔ -）
   - 节点状态正确维护

## 🔄 与旧版本对比

| 特性 | 旧版本 | 新版本（修复后） |
|------|--------|------------------|
| 展开按钮点击 | ✅ 可用 | ✅ 可用 |
| 懒加载 | ✅ 支持 | ✅ 支持 + 优化 |
| 动画效果 | ✅ 有 | ✅ 更流畅 |
| 事件冒泡 | ⚠️ 未处理 | ✅ 已阻止 |
| 代码结构 | ⚠️ 耦合 | ✅ 模块化 |

## 📚 相关文档

- [组件使用文档](./src/components/EquityChart/README.md)
- [优化方案](./docs/equity-chart-optimization-plan.md)
- [快速启动指南](./QUICKSTART.md)

## 🎉 总结

展开按钮点击功能已修复！现在新版本的展开/折叠功能与旧版本一致，并且：

- ✅ 代码更模块化
- ✅ 支持懒加载
- ✅ 事件处理更规范
- ✅ 动画效果更流畅

---

**修复时间**: 2026-02-25  
**修复者**: AI Assistant
