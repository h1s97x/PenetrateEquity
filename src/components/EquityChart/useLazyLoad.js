import { ref } from 'vue'
import { getCompanyShareholder } from '@/api/equityPenetrationChart/index'

/**
 * 节点懒加载逻辑
 */
export function useLazyLoad() {
  const loadingNodes = ref(new Set())
  const loadedNodes = ref(new Set())

  /**
   * 检查节点是否已加载
   */
  const isNodeLoaded = (nodeId) => {
    return loadedNodes.value.has(nodeId)
  }

  /**
   * 检查节点是否正在加载
   */
  const isNodeLoading = (nodeId) => {
    return loadingNodes.value.has(nodeId)
  }

  /**
   * 懒加载节点数据
   */
  const lazyLoadNode = async (node, direction = 'downward') => {
    const nodeId = node.data.id

    // 如果已加载或正在加载，直接返回
    if (isNodeLoaded(nodeId) || isNodeLoading(nodeId)) {
      return node.children || []
    }

    // 如果节点已经有子节点数据，标记为已加载
    if (node.children && node.children.length > 0) {
      loadedNodes.value.add(nodeId)
      return node.children
    }

    try {
      // 标记为加载中
      loadingNodes.value.add(nodeId)

      const params = {
        companyCreditCode: node.data.companyCreditCode || '',
        companyName: node.data.name,
        companyCode: node.data.companyCode || '',
        type: direction === 'upward' ? '1' : '2'
      }

      const res = await getCompanyShareholder(params)

      if (res.code === 1) {
        const children = direction === 'upward' 
          ? res.retInfo.upward 
          : res.retInfo.downward

        // 标记为已加载
        loadedNodes.value.add(nodeId)
        loadingNodes.value.delete(nodeId)

        return children || []
      }

      loadingNodes.value.delete(nodeId)
      return []
    } catch (error) {
      console.error('懒加载节点失败:', error)
      loadingNodes.value.delete(nodeId)
      return []
    }
  }

  /**
   * 预加载节点（提前加载可能需要的数据）
   */
  const preloadNode = async (node, direction = 'downward') => {
    const nodeId = node.data.id

    // 如果已加载或正在加载，跳过
    if (isNodeLoaded(nodeId) || isNodeLoading(nodeId)) {
      return
    }

    // 静默加载，不阻塞 UI
    try {
      await lazyLoadNode(node, direction)
    } catch (error) {
      // 预加载失败不影响主流程
      console.warn('预加载节点失败:', error)
    }
  }

  /**
   * 批量预加载节点
   */
  const batchPreload = async (nodes, direction = 'downward', maxConcurrent = 3) => {
    const chunks = []
    for (let i = 0; i < nodes.length; i += maxConcurrent) {
      chunks.push(nodes.slice(i, i + maxConcurrent))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(node => preloadNode(node, direction))
      )
    }
  }

  /**
   * 清除加载状态
   */
  const clearLoadingState = () => {
    loadingNodes.value.clear()
  }

  /**
   * 重置所有状态
   */
  const reset = () => {
    loadingNodes.value.clear()
    loadedNodes.value.clear()
  }

  /**
   * 获取加载统计
   */
  const getLoadStats = () => {
    return {
      loadedCount: loadedNodes.value.size,
      loadingCount: loadingNodes.value.size
    }
  }

  return {
    loadingNodes,
    loadedNodes,
    isNodeLoaded,
    isNodeLoading,
    lazyLoadNode,
    preloadNode,
    batchPreload,
    clearLoadingState,
    reset,
    getLoadStats
  }
}

/**
 * 智能预加载策略
 */
export class SmartPreloader {
  constructor(lazyLoader) {
    this.lazyLoader = lazyLoader
    this.preloadQueue = []
    this.isPreloading = false
  }

  /**
   * 添加到预加载队列
   */
  addToQueue(node, direction, priority = 0) {
    this.preloadQueue.push({ node, direction, priority })
    this.preloadQueue.sort((a, b) => b.priority - a.priority)
    this.processQueue()
  }

  /**
   * 处理预加载队列
   */
  async processQueue() {
    if (this.isPreloading || this.preloadQueue.length === 0) {
      return
    }

    this.isPreloading = true

    while (this.preloadQueue.length > 0) {
      const { node, direction } = this.preloadQueue.shift()
      
      try {
        await this.lazyLoader.preloadNode(node, direction)
      } catch (error) {
        console.warn('预加载失败:', error)
      }

      // 避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isPreloading = false
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.preloadQueue = []
  }

  /**
   * 根据可见节点智能预加载
   */
  preloadVisibleNeighbors(visibleNodes, direction) {
    visibleNodes.forEach(node => {
      if (node._children && !this.lazyLoader.isNodeLoaded(node.data.id)) {
        this.addToQueue(node, direction, 1)
      }
    })
  }
}
