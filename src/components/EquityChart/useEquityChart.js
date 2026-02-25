import * as d3 from 'd3'
import { CHART_CONFIG, MARKER_CONFIG } from './constants'
import { useZoom } from './useZoom'
import { useNodes } from './useNodes'
import { useLinks } from './useLinks'
import { useLazyLoad } from './useLazyLoad'
import { 
  PerformanceMonitor, 
  createThrottle,
  rafThrottle,
  calculateViewBox,
  isNodeInViewBox
} from './utils/performance'

/**
 * 股权穿透图核心逻辑
 */
export function useEquityChart(options = {}) {
  const config = { ...CHART_CONFIG, ...options.config }
  
  let svg = null
  let gAll = null
  let gLinks = null
  let gNodes = null
  let tree = null
  let rootOfDown = null
  let rootOfUp = null
  let zoom = null
  let currentTransform = { k: 1, x: 0, y: 0 }
  
  // 性能监控
  const perfMonitor = new PerformanceMonitor()
  
  // 懒加载
  const lazyLoader = useLazyLoad()
  
  // 可见节点缓存
  let visibleNodesCache = {
    down: new Set(),
    up: new Set()
  }

  /**
   * 初始化 SVG
   */
  const initSvg = (container, width, height) => {
    // 清除旧的 SVG
    d3.select(container).select('svg').remove()

    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 3, width, height])
      .style('user-select', 'none')
      .style('cursor', 'move')

    // 创建容器组
    gAll = svg.append('g').attr('id', 'all')
    gLinks = gAll.append('g').attr('id', 'linkGroup')
    gNodes = gAll.append('g').attr('id', 'nodeGroup')

    // 添加箭头标记
    createMarkers(svg)

    // 初始化缩放（带节流优化）
    zoom = useZoom(svg, gAll, createThrottle((transform) => {
      currentTransform = transform
      // 更新可见节点
      updateVisibleNodes()
    }, 16))

    return svg
  }

  /**
   * 创建箭头标记
   */
  const createMarkers = (svg) => {
    // 向下箭头
    svg.append('marker')
      .attr('id', MARKER_CONFIG.down.id)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', MARKER_CONFIG.down.refX)
      .attr('refY', MARKER_CONFIG.down.refY)
      .attr('markerWidth', 13)
      .attr('markerHeight', 13)
      .attr('orient', MARKER_CONFIG.down.orient)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', MARKER_CONFIG.down.color)

    // 向上箭头
    svg.append('marker')
      .attr('id', MARKER_CONFIG.up.id)
      .attr('markerUnits', 'userSpaceOnUse')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', MARKER_CONFIG.up.refX)
      .attr('refY', MARKER_CONFIG.up.refY)
      .attr('markerWidth', 13)
      .attr('markerHeight', 13)
      .attr('orient', MARKER_CONFIG.up.orient)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', MARKER_CONFIG.up.color)
  }

  /**
   * 绘制图表
   */
  const drawChart = (container, data, width, height) => {
    initSvg(container, width, height)

    // 创建树布局
    tree = d3.tree().nodeSize([config.dx, config.dy])

    // 创建层次结构
    rootOfDown = d3.hierarchy(data, d => d.children)
    rootOfUp = d3.hierarchy(data, d => d.parents)

    // 初始化节点位置
    rootOfDown.x0 = 0
    rootOfDown.y0 = 0
    rootOfUp.x0 = 0
    rootOfUp.y0 = 0

    // 折叠所有非根节点
    ;[rootOfDown, rootOfUp].forEach(root => {
      root.descendants().forEach(node => {
        node._children = node.children || null
        if (node.depth) {
          node.children = null
        }
      })
    })

    // 首次更新
    update({ x0: 0, y0: 0, x: 0, y: 0 })

    return {
      svg,
      rootOfDown,
      rootOfUp
    }
  }

  /**
   * 更新可见节点（性能优化）
   */
  const updateVisibleNodes = rafThrottle(() => {
    if (!svg || !rootOfDown || !rootOfUp) return

    const svgNode = svg.node()
    const rect = svgNode.getBoundingClientRect()
    const viewBox = calculateViewBox(currentTransform, rect.width, rect.height)

    // 计算可见节点
    const visibleDown = new Set()
    const visibleUp = new Set()

    rootOfDown.descendants().forEach(node => {
      if (isNodeInViewBox(node, viewBox)) {
        visibleDown.add(node.data.id)
      }
    })

    rootOfUp.descendants().forEach(node => {
      if (isNodeInViewBox(node, viewBox)) {
        visibleUp.add(node.data.id)
      }
    })

    visibleNodesCache = {
      down: visibleDown,
      up: visibleUp
    }

    // 触发可见节点变化回调
    options.onVisibleNodesChange?.(visibleNodesCache)
  })

  /**
   * 更新图表
   */
  const update = (source) => {
    if (!rootOfDown || !rootOfUp) return

    // 开始性能监控
    perfMonitor.startTimer('updateTime')

    // 计算节点位置
    const nodesOfDown = rootOfDown.descendants().reverse()
    const linksOfDown = rootOfDown.links()
    const nodesOfUp = rootOfUp.descendants().reverse()
    const linksOfUp = rootOfUp.links()

    // 更新性能指标
    perfMonitor.metrics.nodeCount = nodesOfDown.length + nodesOfUp.length
    perfMonitor.metrics.linkCount = linksOfDown.length + linksOfUp.length

    tree(rootOfDown)
    tree(rootOfUp)

    // 反转向上节点的 y 坐标
    nodesOfUp.forEach(node => {
      node.y = -node.y
    })

    // 创建过渡动画
    const transition = svg.transition()
      .duration(config.duration)
      .ease(d3.easeCubicOut)

    // 渲染节点和连接线
    const { renderDownwardNodes, renderUpwardNodes } = useNodes(
      gNodes, 
      config, 
      handleNodeClickWithLazyLoad,
      toggleNode
    )
    const { updateDownwardLinks, updateUpwardLinks } = useLinks(gLinks, config)

    renderDownwardNodes(nodesOfDown, source, transition)
    renderUpwardNodes(nodesOfUp, source, transition)
    updateDownwardLinks(linksOfDown, source, transition)
    updateUpwardLinks(linksOfUp, source, transition)

    // 更新展开按钮状态
    updateExpandButtons()

    // 保存旧位置
    rootOfDown.eachBefore(d => {
      d.x0 = d.x
      d.y0 = d.y
    })
    rootOfUp.eachBefore(d => {
      d.x0 = d.x
      d.y0 = d.y
    })

    // 居中到点击的节点
    if (source.x !== undefined && source.y !== undefined) {
      zoom.translateTo(source.x, source.y)
    }

    // 结束性能监控
    const updateTime = perfMonitor.endTimer('updateTime')
    console.log(`更新耗时: ${updateTime.toFixed(2)}ms`)

    // 更新可见节点
    updateVisibleNodes()
  }

  /**
   * 处理节点点击（集成懒加载）
   */
  const handleNodeClickWithLazyLoad = async (event, node) => {
    // 触发原始点击事件
    options.onNodeClick?.(event, node)

    // 如果节点有子节点但未加载，尝试懒加载
    if (node._children && !lazyLoader.isNodeLoaded(node.data.id)) {
      const direction = node.data.direction || 'downward'
      const children = await lazyLoader.lazyLoadNode(node, direction)
      
      if (children && children.length > 0) {
        // 更新节点数据
        node._children = children.map(child => ({
          ...child,
          direction
        }))
      }
    }
  }

  /**
   * 更新图表
   */
  const updateOld = (source) => {
    if (!rootOfDown || !rootOfUp) return

    // 计算节点位置
    const nodesOfDown = rootOfDown.descendants().reverse()
    const linksOfDown = rootOfDown.links()
    const nodesOfUp = rootOfUp.descendants().reverse()
    const linksOfUp = rootOfUp.links()

    tree(rootOfDown)
    tree(rootOfUp)

    // 反转向上节点的 y 坐标
    nodesOfUp.forEach(node => {
      node.y = -node.y
    })

    // 创建过渡动画
    const transition = svg.transition()
      .duration(config.duration)
      .ease(d3.easeCubicOut)

    // 渲染节点和连接线
    const { renderDownwardNodes, renderUpwardNodes } = useNodes(
      gNodes, 
      config, 
      options.onNodeClick,
      toggleNode
    )
    const { updateDownwardLinks, updateUpwardLinks } = useLinks(gLinks, config)

    renderDownwardNodes(nodesOfDown, source, transition)
    renderUpwardNodes(nodesOfUp, source, transition)
    updateDownwardLinks(linksOfDown, source, transition)
    updateUpwardLinks(linksOfUp, source, transition)

    // 更新展开按钮状态
    updateExpandButtons()

    // 保存旧位置
    rootOfDown.eachBefore(d => {
      d.x0 = d.x
      d.y0 = d.y
    })
    rootOfUp.eachBefore(d => {
      d.x0 = d.x
      d.y0 = d.y
    })

    // 居中到点击的节点
    if (source.x !== undefined && source.y !== undefined) {
      zoom.translateTo(source.x, source.y)
    }
  }

  /**
   * 更新展开按钮
   */
  const updateExpandButtons = () => {
    d3.selectAll('g.expand-btn')
      .select('text')
      .text(d => d.children ? '-' : '+')
  }

  /**
   * 节点展开/折叠（单个节点）
   */
  const toggleNode = async (node) => {
    if (node.children) {
      // 折叠：隐藏子节点
      node._children = node.children
      node.children = null
    } else if (node._children) {
      // 展开：显示子节点
      
      // 如果未加载，先懒加载
      if (!lazyLoader.isNodeLoaded(node.data.id)) {
        const direction = node.data.direction || 'downward'
        const children = await lazyLoader.lazyLoadNode(node, direction)
        
        if (children && children.length > 0) {
          // 将子节点数据添加到 node.data
          if (direction === 'downward') {
            node.data.children = children
          } else {
            node.data.parents = children
          }
          
          // 重新创建层次结构
          const accessor = direction === 'downward' ? d => d.children : d => d.parents
          const newHierarchy = d3.hierarchy(node.data, accessor)
          
          // 更新 _children，保持折叠状态
          if (newHierarchy.children) {
            newHierarchy.children.forEach(child => {
              child._children = child.children
              child.children = null
            })
            node._children = newHierarchy.children
          }
        }
      }
      
      // 只展开当前节点，不展开子节点
      node.children = node._children
      // 不要设置 node._children = null，保持引用以便折叠
    }
    
    update(node)
  }

  /**
   * 展开所有节点
   */  /**
   * 展开所有节点
   */
  const expandAll = () => {
    function expand(d) {
      if (d._children) {
        d.children = d._children
        d.children.forEach(expand)
        d._children = null
      }
    }
    
    if (rootOfDown) {
      rootOfDown.children = rootOfDown._children
      rootOfDown.children?.forEach(expand)
    }
    if (rootOfUp) {
      rootOfUp.children = rootOfUp._children
      rootOfUp.children?.forEach(expand)
    }
    
    update({ x: 0, y: 0, x0: 0, y0: 0 })
  }

  /**
   * 折叠所有节点
   */
  const collapseAll = () => {
    function collapse(d) {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }
    
    if (rootOfDown) {
      rootOfDown.children?.forEach(collapse)
      rootOfDown.children = null
    }
    if (rootOfUp) {
      rootOfUp.children?.forEach(collapse)
      rootOfUp.children = null
    }
    
    update({ x: 0, y: 0, x0: 0, y0: 0 })
  }

  /**
   * 获取性能指标
   */
  const getPerformanceMetrics = () => {
    return perfMonitor.getMetrics()
  }

  /**
   * 获取加载统计
   */
  const getLoadStats = () => {
    return lazyLoader.getLoadStats()
  }

  /**
   * 获取可见节点
   */
  const getVisibleNodes = () => {
    return visibleNodesCache
  }

  return {
    drawChart,
    update,
    toggleNode,
    expandAll,
    collapseAll,
    zoom,
    getPerformanceMetrics,
    getLoadStats,
    getVisibleNodes,
    lazyLoader
  }
}
