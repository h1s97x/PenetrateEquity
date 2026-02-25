# 需求文档

## 简介

本文档定义股权穿透图可视化项目第三阶段的功能增强需求。该阶段在已完成的基础重构（阶段一）和性能优化（阶段二）基础上，增加五个核心交互功能：节点搜索、路径高亮、图片导出、全屏模式和缩略图导航。这些功能将显著提升用户在复杂股权结构分析中的体验和效率。

## 术语表

- **EquityChart**: 股权穿透图可视化组件
- **Node**: 图表中的节点，代表公司或股东实体
- **Link**: 连接两个节点的线条，表示股权关系
- **Path**: 从根节点到目标节点的完整路径，包含所有中间节点和连接线
- **Viewport**: 当前可视区域
- **SearchEngine**: 节点搜索引擎
- **HighlightManager**: 路径高亮管理器
- **ExportService**: 图片导出服务
- **FullscreenController**: 全屏控制器
- **MinimapNavigator**: 缩略图导航器

## 需求

### 需求 1: 节点搜索功能

**用户故事:** 作为用户，我想通过公司名称搜索节点，以便快速定位到目标公司在复杂股权结构中的位置。

#### 验收标准

1. WHEN 用户在搜索框中输入公司名称 THEN THE SearchEngine SHALL 返回所有匹配的节点列表
2. WHEN 用户输入的搜索关键词部分匹配节点名称 THEN THE SearchEngine SHALL 使用模糊匹配算法返回相关结果
3. WHEN 搜索返回结果 THEN THE EquityChart SHALL 高亮显示所有匹配的节点
4. WHEN 用户从搜索结果中选择一个节点 THEN THE EquityChart SHALL 自动平移和缩放视图使该节点居中显示
5. WHEN 用户清空搜索框 THEN THE EquityChart SHALL 移除所有搜索高亮效果
6. WHEN 搜索无结果 THEN THE SearchEngine SHALL 返回空列表并显示提示信息
7. WHEN 用户输入搜索关键词 THEN THE SearchEngine SHALL 在 300 毫秒内返回搜索结果

### 需求 2: 路径高亮功能

**用户故事:** 作为用户，我想点击节点时高亮显示从根节点到该节点的完整股权路径，以便清晰理解股权穿透关系。

#### 验收标准

1. WHEN 用户点击任意节点 THEN THE HighlightManager SHALL 计算从根节点到该节点的完整路径
2. WHEN 路径被计算出来 THEN THE EquityChart SHALL 高亮显示路径上的所有节点和连接线
3. WHEN 路径高亮显示时 THEN THE EquityChart SHALL 降低非路径节点和连接线的不透明度至 0.2
4. WHEN 用户再次点击已高亮的节点 THEN THE HighlightManager SHALL 取消高亮并恢复所有节点和连接线的正常显示
5. WHEN 用户点击空白区域 THEN THE HighlightManager SHALL 取消当前路径高亮
6. WHEN 用户点击不同的节点 THEN THE HighlightManager SHALL 取消前一个路径高亮并显示新路径高亮
7. WHEN 路径包含多个分支 THEN THE HighlightManager SHALL 仅高亮从根节点到目标节点的最短路径

### 需求 3: 导出图片功能

**用户故事:** 作为用户，我想将股权穿透图导出为图片，以便在报告和演示中使用。

#### 验收标准

1. WHEN 用户点击"导出当前视图"按钮 THEN THE ExportService SHALL 将当前可视区域渲染为 PNG 图片
2. WHEN 用户点击"导出完整图表"按钮 THEN THE ExportService SHALL 将整个图表结构渲染为 PNG 图片
3. WHEN 图片生成完成 THEN THE ExportService SHALL 保持所有节点样式、颜色和文本的清晰度
4. WHEN 图片生成完成 THEN THE ExportService SHALL 自动触发浏览器下载，文件名格式为 "equity-chart-YYYYMMDD-HHmmss.png"
5. WHEN 导出完整图表 THEN THE ExportService SHALL 设置合适的图片分辨率以确保大型图表的清晰度
6. WHEN 导出过程中发生错误 THEN THE ExportService SHALL 显示错误提示信息
7. WHEN 导出大型图表 THEN THE ExportService SHALL 在 5 秒内完成图片生成

### 需求 4: 全屏模式

**用户故事:** 作为用户，我想以全屏模式查看股权穿透图，以便在大屏幕上获得更好的分析体验。

#### 验收标准

1. WHEN 用户点击全屏按钮 THEN THE FullscreenController SHALL 将图表容器切换到全屏模式
2. WHEN 图表进入全屏模式 THEN THE EquityChart SHALL 保持所有交互功能（缩放、拖拽、搜索、高亮）正常工作
3. WHEN 图表处于全屏模式 THEN THE FullscreenController SHALL 在右上角显示退出全屏按钮
4. WHEN 用户点击退出全屏按钮 THEN THE FullscreenController SHALL 退出全屏模式并恢复原始布局
5. WHEN 用户按下 ESC 键且图表处于全屏模式 THEN THE FullscreenController SHALL 退出全屏模式
6. WHEN 全屏模式切换时 THEN THE EquityChart SHALL 自动调整画布尺寸以适应新的视口大小
7. WHEN 浏览器不支持全屏 API THEN THE FullscreenController SHALL 隐藏全屏按钮

### 需求 5: 缩略图导航

**用户故事:** 作为用户，我想通过缩略图查看完整的股权结构并快速导航，以便在复杂图表中保持方向感。

#### 验收标准

1. WHEN 图表渲染完成 THEN THE MinimapNavigator SHALL 在右下角显示缩略图
2. WHEN 缩略图显示时 THEN THE MinimapNavigator SHALL 渲染完整图表结构的简化版本
3. WHEN 缩略图显示时 THEN THE MinimapNavigator SHALL 用矩形框标识当前主视图的可视区域
4. WHEN 用户在主视图中平移或缩放 THEN THE MinimapNavigator SHALL 实时更新可视区域矩形框的位置和大小
5. WHEN 用户在缩略图上拖拽可视区域矩形框 THEN THE EquityChart SHALL 同步更新主视图的位置
6. WHEN 用户点击缩略图上的任意位置 THEN THE EquityChart SHALL 将主视图中心移动到该位置
7. WHEN 图表节点数量超过 1000 个 THEN THE MinimapNavigator SHALL 使用简化渲染以保持性能
8. WHEN 用户点击缩略图的折叠按钮 THEN THE MinimapNavigator SHALL 隐藏缩略图内容仅保留展开按钮
9. WHEN 缩略图隐藏时用户点击展开按钮 THEN THE MinimapNavigator SHALL 重新显示缩略图

### 需求 6: 组件集成

**用户故事:** 作为开发者，我想将新功能无缝集成到现有组件架构中，以便保持代码的可维护性和一致性。

#### 验收标准

1. WHEN 新功能模块被创建 THEN THE EquityChart SHALL 通过 Composition API 的 composable 函数集成这些模块
2. WHEN 搜索、高亮、导出、全屏和缩略图功能被实现 THEN THE EquityChart SHALL 保持现有的节点渲染、连接线、缩放和懒加载功能不受影响
3. WHEN 用户同时使用多个功能（如搜索+路径高亮） THEN THE EquityChart SHALL 正确处理功能间的交互和状态管理
4. WHEN 组件卸载时 THEN THE EquityChart SHALL 清理所有事件监听器和定时器以防止内存泄漏
5. WHEN 新功能添加配置选项 THEN THE EquityChart SHALL 在 constants.js 中定义默认配置值
6. WHEN 功能状态发生变化 THEN THE EquityChart SHALL 使用 Vue 3 的响应式系统管理状态更新

### 需求 7: 性能要求

**用户故事:** 作为用户，我想在使用新功能时保持流畅的交互体验，即使在处理大型股权结构图时也不会出现明显延迟。

#### 验收标准

1. WHEN 图表包含 500 个以上节点 THEN THE SearchEngine SHALL 在 300 毫秒内完成搜索操作
2. WHEN 用户触发路径高亮 THEN THE HighlightManager SHALL 在 100 毫秒内完成路径计算和渲染更新
3. WHEN 导出包含 1000 个节点的完整图表 THEN THE ExportService SHALL 在 5 秒内完成图片生成
4. WHEN 缩略图显示包含 1000 个以上节点的图表 THEN THE MinimapNavigator SHALL 使用节流或简化渲染保持 30 FPS 的更新频率
5. WHEN 用户在主视图中快速平移 THEN THE MinimapNavigator SHALL 使用防抖机制减少不必要的重绘
6. WHEN 多个功能同时激活 THEN THE EquityChart SHALL 保持整体帧率不低于 30 FPS
7. WHEN 组件初始化时 THEN THE EquityChart SHALL 延迟加载非关键功能模块以减少初始加载时间
