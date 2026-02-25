/**
 * 数据服务层
 * 负责数据的获取、转换和管理
 */

import { getCompanyShareholder } from '@/api/equityPenetrationChart/index'

/**
 * 数据转换器
 * 将 API 返回的数据转换为图表所需的格式
 */
export class DataTransformer {
  /**
   * 转换 API 响应为树形结构
   * @param {Object} apiResponse - API 响应数据
   * @returns {Object} 树形数据
   */
  static transformToTree(apiResponse) {
    if (!apiResponse || apiResponse.code !== 1) {
      return null
    }

    const { downward, upward, main } = apiResponse.retInfo

    return {
      // 根节点信息
      id: main.companyCreditCode || main.id,
      name: main.name,
      ratio: '100.00%',
      amount: main.amount || '0',
      type: 2, // 2: 企业
      companyCreditCode: main.companyCreditCode,
      companyCode: main.companyCode,
      direction: 'root',
      
      // 子公司（向下）
      children: this.transformNodes(downward || [], 'downward'),
      
      // 股东（向上）
      parents: this.transformNodes(upward || [], 'upward')
    }
  }

  /**
   * 转换节点数组
   * @param {Array} nodes - 节点数组
   * @param {String} direction - 方向 (upward/downward)
   * @returns {Array} 转换后的节点数组
   */
  static transformNodes(nodes, direction) {
    return nodes.map(node => ({
      id: node.id,
      name: node.name,
      ratio: node.percent || node.ratio || '0.00%',
      amount: node.amount || '0',
      type: node.type || 2, // 1: 个人, 2: 企业
      companyCreditCode: node.companyCreditCode || '',
      companyCode: node.companyCode || '',
      direction: direction,
      status: node.status || 0, // 0: 无子节点, 1: 有子节点
      
      // 递归转换子节点
      children: node.children 
        ? this.transformNodes(node.children, direction)
        : (node.status === 1 ? [] : null),
      
      // 保留原始数据
      _raw: node
    }))
  }

  /**
   * 验证数据格式
   * @param {Object} data - 待验证的数据
   * @returns {Boolean} 是否有效
   */
  static validateData(data) {
    if (!data) return false
    if (!data.id || !data.name) return false
    if (!Array.isArray(data.children) && !Array.isArray(data.parents)) return false
    return true
  }
}

/**
 * 数据服务类
 * 提供数据获取和管理功能
 */
export class DataService {
  constructor() {
    this.cache = new Map()
    this.cacheDuration = 5 * 60 * 1000 // 5分钟
  }

  /**
   * 获取公司股权数据
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 树形数据
   */
  async getCompanyData(params) {
    const cacheKey = this.getCacheKey(params)
    
    // 检查缓存
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      console.log('使用缓存数据:', cacheKey)
      return cached
    }

    try {
      // 从 API 获取数据
      const response = await getCompanyShareholder(params)
      
      // 转换数据格式
      const treeData = DataTransformer.transformToTree(response)
      
      // 验证数据
      if (!DataTransformer.validateData(treeData)) {
        throw new Error('数据格式无效')
      }

      // 缓存数据
      this.setCache(cacheKey, treeData)
      
      return treeData
    } catch (error) {
      console.error('获取数据失败:', error)
      throw error
    }
  }

  /**
   * 获取子节点数据（懒加载）
   * @param {Object} node - 父节点
   * @param {String} direction - 方向
   * @returns {Promise<Array>} 子节点数组
   */
  async getChildrenData(node, direction = 'downward') {
    const params = {
      companyCreditCode: node.companyCreditCode || '',
      companyName: node.name,
      companyCode: node.companyCode || '',
      type: direction === 'upward' ? '1' : '2'
    }

    try {
      const response = await getCompanyShareholder(params)
      
      if (response.code === 1) {
        const children = direction === 'upward' 
          ? response.retInfo.upward 
          : response.retInfo.downward

        return DataTransformer.transformNodes(children || [], direction)
      }

      return []
    } catch (error) {
      console.error('获取子节点失败:', error)
      return []
    }
  }

  /**
   * 生成缓存键
   */
  getCacheKey(params) {
    return `${params.companyCreditCode || ''}_${params.companyName || ''}_${params.type || 0}`
  }

  /**
   * 从缓存获取数据
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  /**
   * 设置缓存
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * 清除过期缓存
   */
  clearExpiredCache() {
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheDuration) {
        this.cache.delete(key)
      }
    }
  }
}

// 导出单例
export const dataService = new DataService()
