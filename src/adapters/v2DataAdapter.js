/**
 * V2 数据适配器
 * 将 equity-penetration-chart-v2 的扁平化数据转换为树形结构
 */

/**
 * V2 数据转换器
 */
export class V2DataAdapter {
  /**
   * 将 V2 扁平化数据转换为树形结构
   * @param {Array} flatData - V2 扁平化数据
   * @param {String} rootId - 根节点 ID（默认第一个）
   * @returns {Object} 树形数据
   */
  static convertToTree(flatData, rootId = null) {
    if (!flatData || flatData.length === 0) {
      throw new Error('数据为空')
    }

    // 创建 ID 到节点的映射
    const nodeMap = new Map()
    flatData.forEach(item => {
      nodeMap.set(item.id, { ...item })
    })

    // 获取根节点
    const rootNode = rootId 
      ? nodeMap.get(rootId) 
      : flatData[0]

    if (!rootNode) {
      throw new Error('找不到根节点')
    }

    // 构建树形结构
    const treeData = {
      id: rootNode.id,
      name: rootNode.name,
      ratio: `${rootNode.percent}%`,
      amount: '0',
      type: 2,
      companyCreditCode: rootNode.id,
      companyCode: rootNode.id,
      direction: 'root',
      children: this.buildChildren(rootNode, nodeMap, 'downward'),
      parents: [] // V2 数据没有向上数据，可以手动添加
    }

    return treeData
  }

  /**
   * 递归构建子节点
   * @param {Object} node - 当前节点
   * @param {Map} nodeMap - 节点映射
   * @param {String} direction - 方向
   * @returns {Array} 子节点数组
   */
  static buildChildren(node, nodeMap, direction) {
    if (!node.childrenIdList || node.childrenIdList === '') {
      return null
    }

    const childrenIds = node.childrenIdList.split(',')
    const children = []

    for (const childId of childrenIds) {
      const childNode = nodeMap.get(childId)
      if (childNode) {
        const child = {
          id: childNode.id,
          name: childNode.name,
          ratio: `${childNode.percent}%`,
          amount: '0',
          type: 2,
          companyCreditCode: childNode.id,
          companyCode: childNode.id,
          direction: direction,
          status: childNode.childrenIdList && childNode.childrenIdList !== '' ? 1 : 0,
          children: this.buildChildren(childNode, nodeMap, direction)
        }
        children.push(child)
      }
    }

    return children.length > 0 ? children : null
  }

  /**
   * 转换为 API 响应格式
   * @param {Array} flatData - V2 扁平化数据
   * @param {String} rootId - 根节点 ID
   * @returns {Object} API 响应格式
   */
  static convertToApiResponse(flatData, rootId = null) {
    const treeData = this.convertToTree(flatData, rootId)

    return {
      code: 1,
      retInfo: {
        main: {
          name: treeData.name,
          companyCreditCode: treeData.companyCreditCode,
          companyCode: treeData.companyCode,
          amount: treeData.amount
        },
        upward: treeData.parents || [],
        downward: treeData.children || []
      }
    }
  }

  /**
   * 获取指定节点的子节点（用于懒加载）
   * @param {Array} flatData - V2 扁平化数据
   * @param {String} nodeId - 节点 ID
   * @param {String} direction - 方向
   * @returns {Array} 子节点数组
   */
  static getNodeChildren(flatData, nodeId, direction = 'downward') {
    const nodeMap = new Map()
    flatData.forEach(item => {
      nodeMap.set(item.id, { ...item })
    })

    const node = nodeMap.get(nodeId)
    if (!node) {
      return []
    }

    const children = this.buildChildren(node, nodeMap, direction)
    return children || []
  }

  /**
   * 统计数据信息
   * @param {Array} flatData - V2 扁平化数据
   * @returns {Object} 统计信息
   */
  static getStatistics(flatData) {
    let totalNodes = flatData.length
    let nodesWithChildren = 0
    let leafNodes = 0
    let maxChildrenCount = 0

    flatData.forEach(node => {
      if (node.childrenIdList && node.childrenIdList !== '') {
        nodesWithChildren++
        const childrenCount = node.childrenIdList.split(',').length
        maxChildrenCount = Math.max(maxChildrenCount, childrenCount)
      } else {
        leafNodes++
      }
    })

    return {
      totalNodes,
      nodesWithChildren,
      leafNodes,
      maxChildrenCount
    }
  }

  /**
   * 添加模拟的股东数据（向上）
   * @param {Object} treeData - 树形数据
   * @param {Number} shareholderCount - 股东数量
   * @returns {Object} 添加股东后的树形数据
   */
  static addMockShareholders(treeData, shareholderCount = 3) {
    const shareholders = []
    const shareholderNames = ['张三', '李四', '王五', '赵六', '钱七']
    const companyNames = ['投资公司A', '投资公司B', '投资公司C']

    for (let i = 0; i < shareholderCount; i++) {
      const isPerson = Math.random() > 0.5
      const ratio = (Math.random() * 50 + 10).toFixed(2)

      shareholders.push({
        id: `SHAREHOLDER_${i + 1}`,
        name: isPerson 
          ? shareholderNames[i % shareholderNames.length]
          : companyNames[i % companyNames.length],
        ratio: `${ratio}%`,
        amount: `${Math.floor(parseFloat(ratio) * 100)}`,
        type: isPerson ? 1 : 2,
        companyCreditCode: isPerson ? '' : `91000000000000${i}`,
        companyCode: `SHAREHOLDER_${i + 1}`,
        direction: 'upward',
        status: 0,
        children: null
      })
    }

    treeData.parents = shareholders
    return treeData
  }
}

/**
 * V2 数据加载器
 */
export class V2DataLoader {
  constructor() {
    this.data = null
    this.loaded = false
  }

  /**
   * 加载 V2 数据
   * @returns {Promise<Array>} 扁平化数据
   */
  async loadData() {
    if (this.loaded && this.data) {
      return this.data
    }

    try {
      // 动态导入 V2 数据
      const module = await import('../../equity-penetration-chart-v2-master/实验数据.js')
      this.data = module.data || module.default
      this.loaded = true
      
      console.log('✅ V2 数据加载成功，节点数:', this.data.length)
      
      // 打印统计信息
      const stats = V2DataAdapter.getStatistics(this.data)
      console.log('📊 数据统计:', stats)
      
      return this.data
    } catch (error) {
      console.error('❌ V2 数据加载失败:', error)
      throw new Error('无法加载 V2 数据文件')
    }
  }

  /**
   * 获取根节点数据
   * @returns {Promise<Object>} API 响应格式
   */
  async getRootData() {
    const flatData = await this.loadData()
    const apiResponse = V2DataAdapter.convertToApiResponse(flatData)
    
    // 添加模拟股东
    const treeData = V2DataAdapter.convertToTree(flatData)
    V2DataAdapter.addMockShareholders(treeData, 3)
    
    apiResponse.retInfo.upward = treeData.parents
    
    return apiResponse
  }

  /**
   * 获取子节点数据（懒加载）
   * @param {String} nodeId - 节点 ID
   * @param {String} direction - 方向
   * @returns {Promise<Object>} API 响应格式
   */
  async getChildrenData(nodeId, direction = 'downward') {
    const flatData = await this.loadData()
    const children = V2DataAdapter.getNodeChildren(flatData, nodeId, direction)

    return {
      code: 1,
      retInfo: {
        main: {
          name: '',
          companyCreditCode: nodeId
        },
        upward: direction === 'upward' ? children : [],
        downward: direction === 'downward' ? children : []
      }
    }
  }

  /**
   * 搜索节点
   * @param {String} keyword - 搜索关键词
   * @returns {Promise<Array>} 匹配的节点
   */
  async searchNodes(keyword) {
    const flatData = await this.loadData()
    return flatData.filter(node => 
      node.name.includes(keyword) || node.id.includes(keyword)
    )
  }
}

// 导出单例
export const v2DataLoader = new V2DataLoader()
