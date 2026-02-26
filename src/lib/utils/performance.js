import { throttle, debounce } from 'lodash-es'

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      renderTime: [],
      updateTime: [],
      nodeCount: 0,
      linkCount: 0
    }
  }

  /**
   * 开始计时
   */
  startTimer(name) {
    this[`${name}Start`] = performance.now()
  }

  /**
   * 结束计时并记录
   */
  endTimer(name) {
    const start = this[`${name}Start`]
    if (start) {
      const duration = performance.now() - start
      if (!this.metrics[name]) {
        this.metrics[name] = []
      }
      this.metrics[name].push(duration)
      
      // 只保留最近 10 次记录
      if (this.metrics[name].length > 10) {
        this.metrics[name].shift()
      }
      
      return duration
    }
    return 0
  }

  /**
   * 获取平均时间
   */
  getAverageTime(name) {
    const times = this.metrics[name]
    if (!times || times.length === 0) return 0
    
    const sum = times.reduce((a, b) => a + b, 0)
    return (sum / times.length).toFixed(2)
  }

  /**
   * 获取所有指标
   */
  getMetrics() {
    return {
      avgRenderTime: this.getAverageTime('renderTime'),
      avgUpdateTime: this.getAverageTime('updateTime'),
      nodeCount: this.metrics.nodeCount,
      linkCount: this.metrics.linkCount,
      lastRenderTime: this.metrics.renderTime[this.metrics.renderTime.length - 1]?.toFixed(2) || 0,
      lastUpdateTime: this.metrics.updateTime[this.metrics.updateTime.length - 1]?.toFixed(2) || 0
    }
  }

  /**
   * 重置指标
   */
  reset() {
    this.metrics = {
      renderTime: [],
      updateTime: [],
      nodeCount: 0,
      linkCount: 0
    }
  }
}

/**
 * 创建节流函数
 */
export function createThrottle(fn, wait = 16) {
  return throttle(fn, wait, {
    leading: true,
    trailing: true
  })
}

/**
 * 创建防抖函数
 */
export function createDebounce(fn, wait = 300) {
  return debounce(fn, wait, {
    leading: false,
    trailing: true
  })
}

/**
 * 请求动画帧节流
 */
export function rafThrottle(fn) {
  let rafId = null
  let lastArgs = null

  return function throttled(...args) {
    lastArgs = args
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn.apply(this, lastArgs)
        rafId = null
      })
    }
  }
}

/**
 * 批量更新优化
 */
export class BatchUpdater {
  constructor(updateFn, delay = 50) {
    this.updateFn = updateFn
    this.delay = delay
    this.pending = []
    this.timer = null
  }

  /**
   * 添加更新任务
   */
  add(item) {
    this.pending.push(item)
    this.scheduleUpdate()
  }

  /**
   * 调度更新
   */
  scheduleUpdate() {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      this.flush()
    }, this.delay)
  }

  /**
   * 执行所有待处理的更新
   */
  flush() {
    if (this.pending.length > 0) {
      this.updateFn(this.pending)
      this.pending = []
    }
    this.timer = null
  }

  /**
   * 清除所有待处理的更新
   */
  clear() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pending = []
  }
}

/**
 * 内存优化 - 清理不可见的 DOM 元素
 */
export function cleanupInvisibleNodes(container, visibleIds) {
  const allNodes = container.querySelectorAll('[data-node-id]')
  
  allNodes.forEach(node => {
    const nodeId = node.getAttribute('data-node-id')
    if (!visibleIds.has(nodeId)) {
      // 移除不可见节点以释放内存
      node.remove()
    }
  })
}

/**
 * 计算可视区域
 */
export function calculateViewBox(transform, width, height) {
  const scale = transform.k || 1
  const x = transform.x || 0
  const y = transform.y || 0

  return {
    minX: -x / scale - width / (2 * scale),
    maxX: -x / scale + width / (2 * scale),
    minY: -y / scale - height / (2 * scale),
    maxY: -y / scale + height / (2 * scale),
    scale
  }
}

/**
 * 判断节点是否在可视区域内
 */
export function isNodeInViewBox(node, viewBox, padding = 200) {
  return (
    node.x >= viewBox.minX - padding &&
    node.x <= viewBox.maxX + padding &&
    node.y >= viewBox.minY - padding &&
    node.y <= viewBox.maxY + padding
  )
}
