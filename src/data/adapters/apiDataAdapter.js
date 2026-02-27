/**
 * API 数据适配器
 * 将 SQL/Excel 导出的数据转换为股权穿透图所需的树形结构
 * 
 * 数据结构说明：
 * - 通过"客户编号"和"股东客户编号"建立层级关系
 * - 使用"股东出资排名"进行排序
 * - 自动生成节点ID（基于客户编号）
 */

/**
 * 核心字段映射配置
 * 根据实际 SQL/Excel 表格字段调整
 */
const FIELD_MAPPING = {
  // 公司基本信息
  companyName: '公司名称',
  clientCode: '客户编号',
  creditCode: '统一社会信用代码',
  
  // 股东信息
  shareholderName: '股东名称',
  shareholderClientCode: '股东客户编号',
  shareholderType: '股东类型',
  shareholdingRatio: '持股比例',
  investmentAmount: '投资金额',
  investmentRank: '股东出资排名'
}

/**
 * 股东类型映射
 */
const SHAREHOLDER_TYPE_MAP = {
  '个人': 1,
  '企业': 2,
  '自然人': 1,
  '法人': 2,
  '公司': 2
}

/**
 * API 数据适配器类
 */
export class ApiDataAdapter {
  /**
   * 将 API 返回的扁平数据转换为树形结构
   * @param {Array} apiData - API 返回的数据数组
   * @param {Object} options - 转换选项
   * @returns {Object} 树形数据结构
   */
  static convertToTree(apiData, options = {}) {
    if (!apiData || apiData.length === 0) {
      throw new Error('API 数据为空')
    }

    const {
      rootCompanyName = null,
      rootCreditCode = null,
      rootClientCode = null
    } = options

    // 查找根节点
    const rootNode = this.findRootNode(apiData, rootCompanyName, rootCreditCode, rootClientCode)
    
    if (!rootNode) {
      throw new Error('未找到根节点')
    }

    // 获取根节点的客户编号
    const rootClientCodeValue = this.getFieldValue(rootNode, 'clientCode')
    
    // 构建客户编号到节点的映射
    const clientCodeMap = this.buildClientCodeMap(apiData)
    
    // 构建树形结构
    const treeData = {
      id: rootClientCodeValue || this.getFieldValue(rootNode, 'creditCode'),
      name: this.getFieldValue(rootNode, 'companyName'),
      ratio: '100.00%',
      amount: this.getFieldValue(rootNode, 'investmentAmount') || '0',
      type: 2, // 企业
      companyCreditCode: this.getFieldValue(rootNode, 'creditCode'),
      companyCode: rootClientCodeValue,
      direction: 'root',
      status: 1, // 根节点可以展开
      children: this.buildChildren(rootClientCodeValue, apiData, clientCodeMap, 'downward'),
      parents: this.buildParents(rootClientCodeValue, apiData, clientCodeMap, 'upward')
    }

    return treeData
  }

  /**
   * 查找根节点
   */
  static findRootNode(apiData, companyName, creditCode, clientCode) {
    if (clientCode) {
      return apiData.find(item => 
        this.getFieldValue(item, 'clientCode') === clientCode
      )
    }
    
    if (companyName) {
      return apiData.find(item => 
        this.getFieldValue(item, 'companyName') === companyName
      )
    }
    
    if (creditCode) {
      return apiData.find(item => 
        this.getFieldValue(item, 'creditCode') === creditCode
      )
    }

    // 默认返回第一个节点
    return apiData[0]
  }

  /**
   * 构建客户编号映射
   * 将所有记录按客户编号分组
   */
  static buildClientCodeMap(apiData) {
    const map = new Map()
    
    apiData.forEach(item => {
      const clientCode = this.getFieldValue(item, 'clientCode')
      
      if (clientCode) {
        if (!map.has(clientCode)) {
          map.set(clientCode, [])
        }
        map.get(clientCode).push(item)
      }
    })

    return map
  }

  /**
   * 构建子节点（向下 - 该公司投资的公司）
   * 通过查找"股东客户编号"等于当前"客户编号"的记录
   */
  static buildChildren(currentClientCode, apiData, clientCodeMap, direction) {
    const children = []
    
    // 查找所有"股东客户编号"等于当前"客户编号"的记录
    // 这些记录表示当前公司作为股东投资的其他公司
    apiData.forEach(item => {
      const shareholderClientCode = this.getFieldValue(item, 'shareholderClientCode')
      
      if (shareholderClientCode === currentClientCode) {
        // 这条记录的"客户编号"就是被投资的公司
        const targetClientCode = this.getFieldValue(item, 'clientCode')
        const companyName = this.getFieldValue(item, 'companyName')
        const ratio = this.getFieldValue(item, 'shareholdingRatio')
        const amount = this.getFieldValue(item, 'investmentAmount')
        const rank = this.getFieldValue(item, 'investmentRank')
        
        const child = {
          id: targetClientCode,
          name: companyName,
          ratio: this.formatRatio(ratio),
          amount: this.formatAmount(amount),
          type: 2, // 被投资的都是企业
          companyCreditCode: this.getFieldValue(item, 'creditCode') || '',
          companyCode: targetClientCode,
          direction: direction,
          status: 1, // 企业可以继续穿透
          rank: rank || 0,
          children: null // 懒加载，初始为 null
        }
        
        children.push(child)
      }
    })
    
    // 按出资排名排序
    children.sort((a, b) => (a.rank || 0) - (b.rank || 0))
    
    return children.length > 0 ? children : null
  }

  /**
   * 构建父节点（向上 - 该公司的股东）
   * 通过查找"客户编号"等于当前"客户编号"的记录，获取其"股东"信息
   */
  static buildParents(currentClientCode, apiData, clientCodeMap, direction) {
    const parents = []
    const shareholderMap = new Map() // 用于去重
    
    // 查找所有"客户编号"等于当前"客户编号"的记录
    // 这些记录的"股东"就是当前公司的股东
    apiData.forEach(item => {
      const clientCode = this.getFieldValue(item, 'clientCode')
      
      if (clientCode === currentClientCode) {
        const shareholderName = this.getFieldValue(item, 'shareholderName')
        const shareholderClientCode = this.getFieldValue(item, 'shareholderClientCode')
        const shareholderType = this.getFieldValue(item, 'shareholderType')
        const ratio = this.getFieldValue(item, 'shareholdingRatio')
        const amount = this.getFieldValue(item, 'investmentAmount')
        const rank = this.getFieldValue(item, 'investmentRank')
        
        // 使用股东客户编号或股东名称作为唯一标识
        const shareholderId = shareholderClientCode || shareholderName
        
        if (shareholderId && !shareholderMap.has(shareholderId)) {
          const nodeType = this.getNodeType(shareholderType)
          
          const parent = {
            id: shareholderClientCode || `shareholder_${shareholderName}`,
            name: shareholderName,
            ratio: this.formatRatio(ratio),
            amount: this.formatAmount(amount),
            type: nodeType,
            companyCreditCode: '', // 股东可能没有信用代码（个人）
            companyCode: shareholderClientCode || '',
            direction: direction,
            status: nodeType === 2 ? 1 : 0, // 企业股东可以继续穿透，个人不能
            rank: rank || 0,
            parents: null // 懒加载，初始为 null
          }
          
          parents.push(parent)
          shareholderMap.set(shareholderId, parent)
        }
      }
    })
    
    // 按出资排名排序
    parents.sort((a, b) => (a.rank || 0) - (b.rank || 0))
    
    return parents.length > 0 ? parents : null
  }

  /**
   * 获取字段值（支持多种字段名）
   */
  static getFieldValue(apiNode, fieldKey) {
    const fieldName = FIELD_MAPPING[fieldKey]
    
    if (!fieldName) {
      return apiNode[fieldKey]
    }

    // 尝试多种可能的字段名
    return apiNode[fieldName] || 
           apiNode[fieldKey] || 
           apiNode[fieldName.toLowerCase()] ||
           apiNode[fieldKey.toLowerCase()] ||
           null
  }

  /**
   * 获取节点类型
   */
  static getNodeType(shareholderType) {
    if (!shareholderType) {
      return 2 // 默认企业
    }

    return SHAREHOLDER_TYPE_MAP[shareholderType] || 2
  }

  /**
   * 格式化持股比例
   */
  static formatRatio(ratio) {
    if (!ratio) {
      return '0.00%'
    }

    // 如果已经包含 %，直接返回
    if (typeof ratio === 'string' && ratio.includes('%')) {
      return ratio
    }

    // 转换为数字并格式化
    const numRatio = parseFloat(ratio)
    
    if (isNaN(numRatio)) {
      return '0.00%'
    }

    // 注释掉小数格式支持（0-1），因为用户数据是百分比数值格式
    // 如果需要支持小数格式，取消下面的注释
    // if (numRatio <= 1) {
    //   return `${(numRatio * 100).toFixed(2)}%`
    // }

    // 百分比数值格式（0-100）
    // 例如：1 表示 1%，60 表示 60%，100 表示 100%
    return `${numRatio.toFixed(2)}%`
  }

  /**
   * 格式化金额
   */
  static formatAmount(amount) {
    if (!amount) {
      return '0'
    }

    const numAmount = parseFloat(amount)
    
    if (isNaN(numAmount)) {
      return '0'
    }

    // 将元转换为万元（除以 10000）
    const amountInWan = numAmount / 10000
    
    // 保留2位小数，并添加千分位分隔符
    return amountInWan.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  /**
   * 转换为 API 响应格式
   */
  static convertToApiResponse(apiData, options = {}) {
    const treeData = this.convertToTree(apiData, options)

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
   * 验证 API 数据格式
   */
  static validateApiData(apiData) {
    if (!Array.isArray(apiData)) {
      return {
        valid: false,
        error: 'API 数据必须是数组格式'
      }
    }

    if (apiData.length === 0) {
      return {
        valid: false,
        error: 'API 数据为空'
      }
    }

    // 检查必需字段
    const requiredFields = ['companyName', 'clientCode']
    const firstItem = apiData[0]
    
    for (const fieldKey of requiredFields) {
      const fieldName = FIELD_MAPPING[fieldKey]
      if (!firstItem[fieldName] && !firstItem[fieldKey]) {
        return {
          valid: false,
          error: `缺少必需字段: ${fieldName || fieldKey}`
        }
      }
    }

    return {
      valid: true,
      error: null
    }
  }

  /**
   * 打印数据统计信息
   */
  static getStatistics(apiData) {
    const stats = {
      totalRecords: apiData.length,
      companies: new Set(),
      shareholders: new Set(),
      persons: 0,
      corporates: 0
    }

    apiData.forEach(item => {
      const companyName = this.getFieldValue(item, 'companyName')
      const clientCode = this.getFieldValue(item, 'clientCode')
      const shareholderName = this.getFieldValue(item, 'shareholderName')
      const shareholderType = this.getFieldValue(item, 'shareholderType')
      
      if (companyName && clientCode) {
        stats.companies.add(clientCode)
      }
      
      if (shareholderName) {
        stats.shareholders.add(shareholderName)
        
        const nodeType = this.getNodeType(shareholderType)
        if (nodeType === 1) {
          stats.persons++
        } else {
          stats.corporates++
        }
      }
    })

    return {
      totalRecords: stats.totalRecords,
      uniqueCompanies: stats.companies.size,
      uniqueShareholders: stats.shareholders.size,
      personShareholders: stats.persons,
      corporateShareholders: stats.corporates
    }
  }
}

/**
 * 创建字段映射配置工具
 * 用于在实际使用时调整字段映射
 */
export function createFieldMapping(customMapping = {}) {
  return {
    ...FIELD_MAPPING,
    ...customMapping
  }
}

/**
 * 使用示例：
 * 
 * import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter'
 * 
 * // 1. 从 SQL 或 Excel 导出的数据（实际格式）
 * const sqlData = [
 *   // 京海控股的股东记录
 *   { 
 *     '公司名称': '京海控股', 
 *     '客户编号': 'C001', 
 *     '统一社会信用代码': '91110000xxx',
 *     '股东名称': '张三', 
 *     '股东客户编号': 'S001',
 *     '股东类型': '个人', 
 *     '持股比例': '60', 
 *     '投资金额': '6000',
 *     '股东出资排名': 1
 *   },
 *   { 
 *     '公司名称': '京海控股', 
 *     '客户编号': 'C001',
 *     '统一社会信用代码': '91110000xxx',
 *     '股东名称': '李四投资', 
 *     '股东客户编号': 'C002',
 *     '股东类型': '企业', 
 *     '持股比例': '40', 
 *     '投资金额': '4000',
 *     '股东出资排名': 2
 *   },
 *   // 京海控股投资的子公司记录
 *   { 
 *     '公司名称': '京海科技', 
 *     '客户编号': 'C003',
 *     '统一社会信用代码': '91110000yyy',
 *     '股东名称': '京海控股', 
 *     '股东客户编号': 'C001',
 *     '股东类型': '企业', 
 *     '持股比例': '100', 
 *     '投资金额': '10000',
 *     '股东出资排名': 1
 *   }
 * ]
 * 
 * // 2. 验证数据
 * const validation = ApiDataAdapter.validateApiData(sqlData)
 * if (!validation.valid) {
 *   console.error(validation.error)
 *   return
 * }
 * 
 * // 3. 查看数据统计
 * const stats = ApiDataAdapter.getStatistics(sqlData)
 * console.log('数据统计:', stats)
 * // { totalRecords: 3, uniqueCompanies: 2, uniqueShareholders: 3, ... }
 * 
 * // 4. 转换数据
 * const treeData = ApiDataAdapter.convertToApiResponse(sqlData, {
 *   rootClientCode: 'C001'  // 使用客户编号指定根节点
 *   // 或 rootCompanyName: '京海控股'
 *   // 或 rootCreditCode: '91110000xxx'
 * })
 * 
 * // 5. 使用转换后的数据
 * chartData.value = {
 *   id: treeData.retInfo.main.companyCode,
 *   name: treeData.retInfo.main.name,
 *   ratio: '100.00%',
 *   type: 2,
 *   children: treeData.retInfo.downward || [],
 *   parents: treeData.retInfo.upward || []
 * }
 * 
 * // 6. 自定义字段映射（如果 SQL/Excel 字段名不同）
 * const customMapping = createFieldMapping({
 *   companyName: 'company_name',
 *   clientCode: 'client_id',
 *   shareholderName: 'shareholder_name',
 *   shareholderClientCode: 'shareholder_id'
 * })
 */
