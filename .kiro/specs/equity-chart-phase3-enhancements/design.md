# 设计文档

## 概述

本设计文档描述股权穿透图第三阶段功能增强的技术实现方案。基于 Vue 3 Composition API 和 D3.js v7，我们将实现五个核心功能模块：节点搜索、路径高亮、图片导出、全屏模式和缩略图导航。

设计遵循以下原则：
- 模块化：每个功能作为独立的 composable 函数
- 可组合性：功能间通过明确的接口协作
- 性能优先：针对大型图表优化渲染和计算
- 渐进增强：功能可独立启用或禁用

## 架构

### 整体架构

```
EquityChart (index.vue)
├── useEquityChart.js (核心编排)
├── useNodes.js (节点渲染)
├── useLinks.js (连接线渲染)
├── useZoom.js (缩放控制)
├── useLazyLoad.js (懒加载)
├── useSearch.js (新增：搜索功能)
├── usePathHighlight.js (新增：路径高亮)
├── useExport.js (新增：图片导出)
├── useFullscreen.js (新增：全屏模式)
├── useMinimap.js (新增：缩略图导航)
└── constants.js (配置常量)
```

### 模块依赖关系

```
useEquityChart
  ├─> useNodes
  ├─> useLinks
  ├─> useZoom
  ├─> useLazyLoad
  ├─> useSearch ──> useNodes (高亮节点)
  ├─> usePathHighlight ──> useNodes, useLinks (高亮路径)
  ├─> useExport ──> D3 Selection (导出 SVG)
  ├─> useFullscreen ──> DOM API
  └─> useMinimap ──> useZoom (同步视图)
```

## 组件和接口

### 1. useSearch.js - 节点搜索

**职责：** 提供节点搜索、模糊匹配和结果高亮功能

**接口：**

```typescript
interface SearchOptions {
  caseSensitive: boolean;
  fuzzyThreshold: number; // 0-1, 模糊匹配阈值
  highlightColor: string;
  highlightDuration: number; // 高亮动画持续时间(ms)
}

interface SearchResult {
  node: Node;
  score: number; // 匹配分数
  matchedText: string;
}

function useSearch(
  nodes: Ref<Node[]>,
  svgSelection: Ref<D3Selection>,
  options: SearchOptions
) {
  const searchQuery = ref('');
  const searchResults = ref<SearchResult[]>([]);
  const selectedResult = ref<SearchResult | null>(null);

  // 执行搜索
  function search(query: string): SearchResult[];
  
  // 高亮搜索结果
  function highlightResults(results: SearchResult[]): void;
  
  // 定位到指定节点
  function focusNode(node: Node): void;
  
  // 清除搜索高亮
  function clearHighlight(): void;

  return {
    searchQuery,
    searchResults,
    selectedResult,
    search,
    highlightResults,
    focusNode,
    clearHighlight
  };
}
```

**实现细节：**

1. **模糊搜索算法：** 使用 Levenshtein 距离或简化的字符串相似度算法
2. **搜索优化：** 
   - 对节点名称建立索引（Map<string, Node>）
   - 使用防抖（debounce）减少搜索频率
   - 限制返回结果数量（默认 20 条）
3. **高亮实现：**
   - 为匹配节点添加 CSS 类 `search-highlight`
   - 使用 D3 transition 实现脉冲动画效果
4. **视图定位：**
   - 计算节点在 SVG 中的坐标
   - 使用 useZoom 的 API 平滑过渡到目标位置

### 2. usePathHighlight.js - 路径高亮

**职责：** 计算和高亮从根节点到目标节点的路径

**接口：**

```typescript
interface PathHighlightOptions {
  pathColor: string;
  pathWidth: number;
  dimmedOpacity: number; // 非路径元素的不透明度
  animationDuration: number;
}

interface PathData {
  nodes: Node[];
  links: Link[];
}

function usePathHighlight(
  nodes: Ref<Node[]>,
  links: Ref<Link[]>,
  svgSelection: Ref<D3Selection>,
  options: PathHighlightOptions
) {
  const activePath = ref<PathData | null>(null);
  const isHighlighting = ref(false);

  // 计算从根到目标节点的路径
  function calculatePath(targetNode: Node): PathData;
  
  // 高亮路径
  function highlightPath(path: PathData): void;
  
  // 取消高亮
  function clearHighlight(): void;
  
  // 处理节点点击
  function handleNodeClick(node: Node): void;

  return {
    activePath,
    isHighlighting,
    highlightPath,
    clearHighlight,
    handleNodeClick
  };
}
```

**实现细节：**

1. **路径计算算法：**
   - 使用广度优先搜索（BFS）从根节点到目标节点
   - 构建父节点映射以回溯路径
   - 时间复杂度：O(V + E)，V 为节点数，E 为边数
   
2. **高亮渲染：**
   - 路径节点：添加 CSS 类 `path-highlight`，增加描边宽度
   - 路径连接线：增加线宽，改变颜色
   - 非路径元素：降低 opacity 至 0.2
   - 使用 D3 transition 实现平滑过渡

3. **状态管理：**
   - 记录当前高亮路径
   - 点击同一节点时切换高亮状态
   - 点击空白区域清除高亮

4. **性能优化：**
   - 缓存路径计算结果
   - 使用 CSS 类而非内联样式
   - 批量更新 DOM

### 3. useExport.js - 图片导出

**职责：** 将 SVG 图表导出为 PNG 图片

**接口：**

```typescript
interface ExportOptions {
  backgroundColor: string;
  scale: number; // 导出图片的缩放比例
  quality: number; // 0-1, JPEG 质量
  format: 'png' | 'jpeg';
}

function useExport(
  svgSelection: Ref<D3Selection>,
  options: ExportOptions
) {
  const isExporting = ref(false);
  const exportProgress = ref(0);

  // 导出当前视图
  function exportCurrentView(filename?: string): Promise<void>;
  
  // 导出完整图表
  function exportFullChart(filename?: string): Promise<void>;
  
  // 生成文件名
  function generateFilename(prefix: string): string;

  return {
    isExporting,
    exportProgress,
    exportCurrentView,
    exportFullChart
  };
}
```

**实现细节：**

1. **SVG 转 PNG 流程：**
   ```
   SVG Element
     ↓ 序列化
   SVG String
     ↓ 创建 Blob
   Data URL
     ↓ 加载到 Image
   Canvas Context
     ↓ toBlob()
   PNG Blob
     ↓ 下载
   File
   ```

2. **导出当前视图：**
   - 获取当前 SVG 的 viewBox 和 transform
   - 克隆 SVG 元素
   - 应用内联样式（CSS 不会被导出）
   - 设置背景色

3. **导出完整图表：**
   - 计算所有节点的边界框（bounding box）
   - 临时重置 transform 和 viewBox
   - 调整 SVG 尺寸以包含所有内容
   - 根据节点数量动态调整分辨率

4. **样式内联化：**
   - 遍历所有元素
   - 获取计算后的样式（getComputedStyle）
   - 将样式写入 style 属性
   - 处理外部字体和图片

5. **性能优化：**
   - 使用 OffscreenCanvas（如果支持）
   - 大图表分块渲染
   - 显示进度条

### 4. useFullscreen.js - 全屏模式

**职责：** 控制图表容器的全屏显示

**接口：**

```typescript
interface FullscreenOptions {
  exitButtonPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showExitButton: boolean;
}

function useFullscreen(
  containerRef: Ref<HTMLElement>,
  options: FullscreenOptions
) {
  const isFullscreen = ref(false);
  const isSupported = ref(false);

  // 进入全屏
  function enterFullscreen(): Promise<void>;
  
  // 退出全屏
  function exitFullscreen(): Promise<void>;
  
  // 切换全屏状态
  function toggleFullscreen(): Promise<void>;
  
  // 监听全屏变化
  function onFullscreenChange(callback: (isFullscreen: boolean) => void): void;

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen
  };
}
```

**实现细节：**

1. **全屏 API 兼容性：**
   ```javascript
   const fullscreenAPI = {
     request: element.requestFullscreen 
       || element.webkitRequestFullscreen 
       || element.mozRequestFullScreen 
       || element.msRequestFullscreen,
     exit: document.exitFullscreen 
       || document.webkitExitFullscreen 
       || document.mozCancelFullScreen 
       || document.msExitFullscreen,
     element: document.fullscreenElement 
       || document.webkitFullscreenElement 
       || document.mozFullScreenElement 
       || document.msFullscreenElement,
     change: 'fullscreenchange' 
       || 'webkitfullscreenchange' 
       || 'mozfullscreenchange' 
       || 'MSFullscreenChange'
   };
   ```

2. **事件监听：**
   - 监听 fullscreenchange 事件
   - 监听 ESC 键（keydown）
   - 组件卸载时清理监听器

3. **尺寸调整：**
   - 全屏时触发 resize 事件
   - 通知 useZoom 重新计算视口
   - 更新 SVG 尺寸

4. **退出按钮：**
   - 使用绝对定位的浮动按钮
   - 仅在全屏模式下显示
   - 提供关闭图标和提示文本

### 5. useMinimap.js - 缩略图导航

**职责：** 显示完整图表的缩略图并支持导航

**接口：**

```typescript
interface MinimapOptions {
  width: number;
  height: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  backgroundColor: string;
  viewportColor: string;
  simplifyThreshold: number; // 节点数量超过此值时简化渲染
}

function useMinimap(
  nodes: Ref<Node[]>,
  links: Ref<Link[]>,
  mainSvg: Ref<D3Selection>,
  zoomTransform: Ref<D3ZoomTransform>,
  options: MinimapOptions
) {
  const minimapSvg = ref<D3Selection | null>(null);
  const isCollapsed = ref(false);
  const viewportRect = ref({ x: 0, y: 0, width: 0, height: 0 });

  // 初始化缩略图
  function initialize(container: HTMLElement): void;
  
  // 渲染缩略图内容
  function render(): void;
  
  // 更新视口矩形
  function updateViewport(transform: D3ZoomTransform): void;
  
  // 处理缩略图交互
  function handleMinimapClick(event: MouseEvent): void;
  function handleViewportDrag(event: MouseEvent): void;
  
  // 折叠/展开
  function toggle(): void;

  return {
    minimapSvg,
    isCollapsed,
    viewportRect,
    initialize,
    render,
    updateViewport,
    toggle
  };
}
```

**实现细节：**

1. **缩略图渲染：**
   - 创建独立的 SVG 元素
   - 计算完整图表的边界框
   - 按比例缩放所有节点和连接线
   - 简化渲染：节点用圆点，连接线用细线

2. **视口矩形：**
   - 根据主视图的 transform 计算位置和大小
   - 使用 rect 元素表示，添加描边和半透明填充
   - 实时同步主视图的缩放和平移

3. **交互实现：**
   - **点击导航：** 将点击位置映射到主视图坐标，调用 useZoom 的 API
   - **拖拽导航：** 使用 D3 drag behavior，实时更新主视图位置
   - **防抖优化：** 拖拽时使用 requestAnimationFrame 节流

4. **性能优化：**
   - 节点数 > simplifyThreshold 时：
     - 仅渲染节点位置（不渲染文本）
     - 使用更小的圆点
     - 减少连接线数量（仅渲染主要路径）
   - 使用 Canvas 代替 SVG（可选）
   - 延迟渲染（初始化后 100ms）

5. **折叠功能：**
   - 折叠时仅显示展开按钮（小图标）
   - 展开时显示完整缩略图
   - 状态保存到 localStorage

## 数据模型

### Node 扩展

```typescript
interface Node {
  id: string;
  name: string;
  type: 'company' | 'person';
  x: number;
  y: number;
  // 新增字段
  searchScore?: number; // 搜索匹配分数
  isInPath?: boolean; // 是否在高亮路径中
  isSearchHighlighted?: boolean; // 是否被搜索高亮
}
```

### Link 扩展

```typescript
interface Link {
  source: Node;
  target: Node;
  value: number; // 持股比例
  // 新增字段
  isInPath?: boolean; // 是否在高亮路径中
}
```

### 配置扩展 (constants.js)

```javascript
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  FUZZY_THRESHOLD: 0.6,
  MAX_RESULTS: 20,
  HIGHLIGHT_COLOR: '#ff6b6b',
  HIGHLIGHT_DURATION: 300
};

export const PATH_HIGHLIGHT_CONFIG = {
  PATH_COLOR: '#4dabf7',
  PATH_WIDTH: 3,
  DIMMED_OPACITY: 0.2,
  ANIMATION_DURATION: 300
};

export const EXPORT_CONFIG = {
  BACKGROUND_COLOR: '#ffffff',
  SCALE: 2,
  QUALITY: 0.95,
  FORMAT: 'png'
};

export const FULLSCREEN_CONFIG = {
  EXIT_BUTTON_POSITION: 'top-right',
  SHOW_EXIT_BUTTON: true
};

export const MINIMAP_CONFIG = {
  WIDTH: 200,
  HEIGHT: 150,
  POSITION: 'bottom-right',
  BACKGROUND_COLOR: '#f8f9fa',
  VIEWPORT_COLOR: '#4dabf7',
  SIMPLIFY_THRESHOLD: 1000
};
```

