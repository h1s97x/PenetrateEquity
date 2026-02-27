import { DataGenerator } from '@/data/generators/dataGenerator.js'
import { v2DataLoader } from '@/data/adapters/v2DataAdapter.js'
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter.js'
import { ImportedDataService } from '@/services/importedDataService.js'

// API 缓存
const apiCache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

// 数据模式配置
export const DATA_MODE = {
  MOCK: 'mock',           // 使用简单模拟数据
  GENERATOR: 'generator', // 使用数据生成器
  V2: 'v2',               // 使用 V2 实验数据
  API: 'api'              // 使用真实 API
}

// 当前数据模式（可以通过环境变量配置）
const CURRENT_MODE = import.meta.env.VITE_DATA_MODE || DATA_MODE.GENERATOR

console.log('当前数据模式:', CURRENT_MODE)

/**
 * 示例公司的数据配置（用于 generator 模式）
 */
export const EXAMPLE_COMPANY_CONFIGS = {
  '91310000123456789X': {
    companyName: '京海控股集团有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 4,
    shareholderCount: 3
  },
  '91330000MA27XYZ123': {
    companyName: '阿里巴巴集团控股有限公司',
    downwardDepth: 4,
    upwardDepth: 2,
    childrenPerLevel: 8,
    shareholderCount: 4
  },
  '91440300MA5ABC1234': {
    companyName: '腾讯控股有限公司',
    downwardDepth: 4,
    upwardDepth: 2,
    childrenPerLevel: 7,
    shareholderCount: 3
  },
  '91110108MA01DEF567': {
    companyName: '字节跳动科技有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 6,
    shareholderCount: 5
  },
  '91440300618520018E': {
    companyName: '华为技术有限公司',
    downwardDepth: 4,
    upwardDepth: 1,
    childrenPerLevel: 9,
    shareholderCount: 2
  },
  '91110108551385082Q': {
    companyName: '小米科技有限责任公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 5,
    shareholderCount: 4
  },
  '91110108MA00GHI890': {
    companyName: '美团科技有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 4,
    shareholderCount: 4
  },
  '91110000633674814D': {
    companyName: '京东集团股份有限公司',
    downwardDepth: 4,
    upwardDepth: 2,
    childrenPerLevel: 6,
    shareholderCount: 3
  },
  '91110000802100433B': {
    companyName: '百度在线网络技术有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 6,
    shareholderCount: 2
  },
  '91330000MA27JKL456': {
    companyName: '网易（杭州）网络有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 4,
    shareholderCount: 2
  }
}

/**
 * 生成缓存键
 */
function getCacheKey(params) {
  return `${params.companyCreditCode || ''}_${params.companyName || ''}_${params.type || 0}`
}

/**
 * 获取缓存数据
 */
function getCache(key) {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  apiCache.delete(key)
  return null
}

/**
 * 设置缓存数据
 */
function setCache(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * 清除所有缓存
 */
export function clearCache() {
  apiCache.clear()
}

/**
 * 使用真实 API 数据（从 IndexedDB 读取导入的数据）
 */
async function fetchRealApiData(params) {
  try {
    // 从 IndexedDB 获取最新的导入数据
    const importList = await ImportedDataService.getImportedList()
    
    if (importList.length === 0) {
      console.error('❌ 没有导入数据')
      throw new Error('请先导入 Excel 数据')
    }

    // 获取最新的导入数据
    const latestImport = importList[0]
    const importedData = await ImportedDataService.getImportedData(latestImport.id)
    
    if (!importedData || !importedData.rawData) {
      console.error('❌ 导入数据无效')
      throw new Error('导入数据无效，请重新导入')
    }

    console.log('🌐 使用 API 模式（导入数据）')
    console.log('📋 查询参数:', params)
    
    // 根据查询参数确定要查询的公司
    // 优先使用 companyCode（客户编号），其次是 companyCreditCode（信用代码）
    let rootClientCode = params.companyCode
    let rootCompanyName = params.companyName
    let rootCreditCode = params.companyCreditCode
    
    // 如果没有指定，使用第一个公司
    if (!rootClientCode && !rootCompanyName && !rootCreditCode && importedData.allCompanies && importedData.allCompanies.length > 0) {
      rootClientCode = importedData.allCompanies[0].clientCode
      console.log('📌 使用第一个公司:', rootClientCode)
    }

    console.log('🔍 查找公司:', {
      rootClientCode,
      rootCompanyName,
      rootCreditCode
    })

    // 使用 ApiDataAdapter 转换数据
    const treeData = ApiDataAdapter.convertToApiResponse(importedData.rawData, {
      rootClientCode: rootClientCode,
      rootCompanyName: rootCompanyName,
      rootCreditCode: rootCreditCode
    })

    console.log('✅ 成功生成树形数据:', treeData.retInfo.main.name)
    return treeData
  } catch (error) {
    console.error('❌ API 模式加载失败:', error)
    // 不再降级到生成器模式，直接抛出错误
    throw error
  }
}

/**
 * 使用 V2 实验数据
 */
async function generateV2Data(params) {
  try {
    // 如果是懒加载子节点
    if (params.type === '1' || params.type === '2') {
      const direction = params.type === '1' ? 'upward' : 'downward'
      const nodeId = params.companyCode || params.companyCreditCode
      return await v2DataLoader.getChildrenData(nodeId, direction)
    }

    // 初始加载根节点
    return await v2DataLoader.getRootData()
  } catch (error) {
    console.error('V2 数据加载失败:', error)
    // 降级到生成器模式
    return generateMockDataWithGenerator(params)
  }
}

/**
 * 使用数据生成器生成数据
 */
function generateMockDataWithGenerator(params) {
  const { companyCreditCode, companyName } = params
  
  // 根据 type 参数决定生成什么数据
  if (params.type === '1' || params.type === '2') {
    // 懒加载子节点
    return {
      code: 1,
      retInfo: {
        main: {
          name: companyName || '示例科技有限公司',
          companyCreditCode: companyCreditCode || '91310000123456789X'
        },
        upward: params.type === '1' ? DataGenerator.generateUpwardNodes(2, 3, 1) : [],
        downward: params.type === '2' ? DataGenerator.generateDownwardNodes(2, 5, 1) : []
      }
    }
  }

  // 获取公司配置
  const config = EXAMPLE_COMPANY_CONFIGS[companyCreditCode] || {
    companyName: companyName || '示例科技有限公司',
    downwardDepth: 3,
    upwardDepth: 2,
    childrenPerLevel: 5,
    shareholderCount: 3
  }
  
  // 生成数据
  const treeData = DataGenerator.generateCompanyTree({
    ...config,
    companyCreditCode
  })
  
  return {
    code: 1,
    retInfo: {
      main: {
        name: config.companyName,
        companyCreditCode: companyCreditCode,
        type: 2
      },
      downward: treeData.children || [],
      upward: treeData.parents || []
    }
  }
}

/**
 * 生成简单的模拟数据
 */
function generateSimpleMockData(params) {
  const mockData = {
    code: 1,
    retInfo: {
      main: {
        name: params.companyName || '示例科技有限公司',
        companyCreditCode: params.companyCreditCode || '91310000123456789X'
      },
      upward: [
        {
          name: '张三',
          percent: '60.00',
          amount: '600',
          type: 1,
          id: 'person001',
          companyCreditCode: '',
          companyCode: 'person001',
          status: 1
        },
        {
          name: '李四投资有限公司',
          percent: '40.00',
          amount: '400',
          type: 2,
          id: 'company001',
          companyCreditCode: '91310000987654321Y',
          companyCode: 'company001',
          status: 1
        }
      ],
      downward: [
        {
          name: '子公司A科技有限公司',
          percent: '100.00',
          amount: '1000',
          type: 2,
          id: 'sub001',
          companyCreditCode: '91310000111111111A',
          companyCode: 'sub001',
          status: 1
        },
        {
          name: '子公司B网络科技',
          percent: '51.00',
          amount: '510',
          type: 2,
          id: 'sub002',
          companyCreditCode: '91310000222222222B',
          companyCode: 'sub002',
          status: 1
        }
      ]
    }
  }

  // 如果是请求子节点数据
  if (params.type === '1') {
    // 向上查询股东
    mockData.retInfo.upward = [
      {
        name: '王五',
        percent: '80.00',
        amount: '800',
        type: 1,
        id: 'person002',
        companyCreditCode: '',
        companyCode: 'person002',
        status: 0
      }
    ]
  } else if (params.type === '2') {
    // 向下查询投资
    mockData.retInfo.downward = [
      {
        name: '孙公司C',
        percent: '100.00',
        amount: '500',
        type: 2,
        id: 'subsub001',
        companyCreditCode: '91310000333333333C',
        companyCode: 'subsub001',
        status: 0
      }
    ]
  }

  return mockData
}

/**
 * 模拟股权穿透图表 API
 * @param {Object} params - 查询参数
 * @param {String} params.companyName - 公司名称
 * @param {String} params.companyCreditCode - 统一社会信用代码
 * @param {String} params.type - 查询类型: '0'-初始, '1'-向上, '2'-向下
 * @returns {Promise<Object>} API 响应
 */
export async function getCompanyShareholder(params) {
  // 检查缓存
  const cacheKey = getCacheKey(params)
  const cached = getCache(cacheKey)
  if (cached) {
    console.log('✅ 使用缓存数据:', cacheKey)
    return Promise.resolve(cached)
  }

  // V2 模式需要异步处理
  if (CURRENT_MODE === DATA_MODE.V2) {
    console.log('📊 使用 V2 实验数据')
    const mockData = await generateV2Data(params)
    setCache(cacheKey, mockData)
    return mockData
  }

  // API 模式：调用真实 API
  if (CURRENT_MODE === DATA_MODE.API) {
    console.log('🌐 使用真实 API 数据')
    const apiData = await fetchRealApiData(params)
    setCache(cacheKey, apiData)
    return apiData
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      let mockData

      // 根据配置的数据模式返回不同的数据
      if (CURRENT_MODE === DATA_MODE.GENERATOR) {
        console.log('🎲 使用数据生成器')
        mockData = generateMockDataWithGenerator(params)
      } else {
        console.log('📝 使用简单模拟数据')
        mockData = generateSimpleMockData(params)
      }

      // 设置缓存
      setCache(cacheKey, mockData)
      
      resolve(mockData)
    }, 300)
  })
}

/**
 * 切换数据模式（用于测试）
 */
export function setDataMode(mode) {
  if (Object.values(DATA_MODE).includes(mode)) {
    console.log('切换数据模式:', mode)
    return true
  }
  return false
}
