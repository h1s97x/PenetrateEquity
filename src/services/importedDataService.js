/**
 * 导入数据管理服务
 * 用于管理 Excel 导入的数据，支持持久化存储
 * 优化版：使用 IndexedDB 存储大数据，支持分页加载
 */

import { IndexedDBHelper } from '@/lib/utils/indexedDBHelper.js'

const STORAGE_KEY = 'equity_imported_data'
const STORAGE_LIST_KEY = 'equity_imported_list'
const USE_INDEXEDDB = true // 使用 IndexedDB 替代 localStorage

/**
 * 导入数据管理类
 */
export class ImportedDataService {
  /**
   * 保存导入的数据
   * @param {Object} data - 导入的数据（可以为 null，批量导入时不需要预生成树形数据）
   * @param {Object} metadata - 元数据（公司信息、导入时间等）
   * @returns {String} 数据ID
   */
  static async saveImportedData(data, metadata = {}) {
    const dataId = this.generateDataId()
    const timestamp = Date.now()
    
    const importedData = {
      id: dataId,
      data: data,
      rawData: metadata.rawData || [],
      allCompanies: metadata.allCompanies || [],
      metadata: {
        companyName: metadata.companyName || data?.retInfo?.main?.name || '未知公司',
        companyCode: metadata.companyCode || data?.retInfo?.main?.companyCode || '',
        creditCode: metadata.creditCode || data?.retInfo?.main?.companyCreditCode || '',
        importTime: timestamp,
        importDate: new Date(timestamp).toLocaleString('zh-CN'),
        stats: metadata.stats || {},
        source: metadata.source || 'excel',
        totalCompanies: metadata.allCompanies?.length || 0,
        totalRecords: metadata.rawData?.length || 0
      }
    }

    try {
      if (USE_INDEXEDDB) {
        // 使用 IndexedDB 存储大数据
        await IndexedDBHelper.saveData(dataId, importedData)
        return dataId
      } else {
        // 使用 localStorage（小数据）
        localStorage.setItem(`${STORAGE_KEY}_${dataId}`, JSON.stringify(importedData))
        this.addToImportList(importedData)
        return dataId
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      throw new Error('存储数据失败，请检查浏览器存储空间')
    }
  }

  /**
   * 获取导入的数据
   * @param {String} dataId - 数据ID
   * @returns {Object|null} 导入的数据
   */
  static async getImportedData(dataId) {
    try {
      if (USE_INDEXEDDB) {
        const data = await IndexedDBHelper.getData(dataId)
        return data || null
      } else {
        const data = localStorage.getItem(`${STORAGE_KEY}_${dataId}`)
        return data ? JSON.parse(data) : null
      }
    } catch (error) {
      console.error('读取数据失败:', error)
      return null
    }
  }

  /**
   * 获取所有导入的数据列表
   * @returns {Array} 导入数据列表
   */
  static async getImportedList() {
    try {
      if (USE_INDEXEDDB) {
        return await IndexedDBHelper.getAllMetadata()
      } else {
        const list = localStorage.getItem(STORAGE_LIST_KEY)
        return list ? JSON.parse(list) : []
      }
    } catch (error) {
      console.error('读取列表失败:', error)
      return []
    }
  }

  /**
   * 删除导入的数据
   * @param {String} dataId - 数据ID
   */
  static async deleteImportedData(dataId) {
    try {
      if (USE_INDEXEDDB) {
        await IndexedDBHelper.deleteData(dataId)
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_${dataId}`)
        this.removeFromImportList(dataId)
      }
    } catch (error) {
      console.error('删除数据失败:', error)
    }
  }

  /**
   * 清空所有导入的数据
   */
  static async clearAllImportedData() {
    try {
      if (USE_INDEXEDDB) {
        await IndexedDBHelper.clearAll()
      } else {
        const list = this.getImportedList()
        list.forEach(item => {
          localStorage.removeItem(`${STORAGE_KEY}_${item.id}`)
        })
        localStorage.removeItem(STORAGE_LIST_KEY)
      }
    } catch (error) {
      console.error('清空数据失败:', error)
    }
  }

  /**
   * 添加到导入列表
   * @param {Object} importedData - 导入的数据
   */
  static addToImportList(importedData) {
    const list = this.getImportedList()
    
    // 检查是否已存在
    const existingIndex = list.findIndex(item => item.id === importedData.id)
    if (existingIndex !== -1) {
      list[existingIndex] = {
        id: importedData.id,
        ...importedData.metadata
      }
    } else {
      list.unshift({
        id: importedData.id,
        ...importedData.metadata
      })
    }

    // 限制列表长度（最多保存 50 条）
    if (list.length > 50) {
      const removed = list.splice(50)
      // 删除超出的数据
      removed.forEach(item => {
        localStorage.removeItem(`${STORAGE_KEY}_${item.id}`)
      })
    }

    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(list))
  }

  /**
   * 从导入列表中移除
   * @param {String} dataId - 数据ID
   */
  static removeFromImportList(dataId) {
    const list = this.getImportedList()
    const newList = list.filter(item => item.id !== dataId)
    localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(newList))
  }

  /**
   * 生成数据ID
   * @returns {String} 数据ID
   */
  static generateDataId() {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理旧数据（保留最近 20 条）
   */
  static cleanOldData() {
    const list = this.getImportedList()
    if (list.length > 20) {
      const toRemove = list.slice(20)
      toRemove.forEach(item => {
        localStorage.removeItem(`${STORAGE_KEY}_${item.id}`)
      })
      const newList = list.slice(0, 20)
      localStorage.setItem(STORAGE_LIST_KEY, JSON.stringify(newList))
    }
  }

  /**
   * 获取存储使用情况
   * @returns {Object} 存储信息
   */
  static async getStorageInfo() {
    if (USE_INDEXEDDB) {
      const estimate = await IndexedDBHelper.getStorageEstimate()
      const list = await this.getImportedList()
      return {
        count: list.length,
        ...estimate
      }
    } else {
      const list = this.getImportedList()
      let totalSize = 0

      list.forEach(item => {
        const data = localStorage.getItem(`${STORAGE_KEY}_${item.id}`)
        if (data) {
          totalSize += data.length
        }
      })

      return {
        count: list.length,
        totalSize: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
      }
    }
  }

  /**
   * 获取导入数据中的所有公司列表（支持分页）
   * @param {String} dataId - 数据ID
   * @param {Object} options - 分页选项
   * @returns {Object} 公司列表和分页信息
   */
  static async getCompaniesFromImport(dataId, options = {}) {
    const { page = 1, pageSize = 50, search = '' } = options
    
    const importedData = await this.getImportedData(dataId)
    if (!importedData || !importedData.allCompanies) {
      return {
        companies: [],
        total: 0,
        page: 1,
        pageSize: pageSize,
        totalPages: 0
      }
    }

    let companies = importedData.allCompanies

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      companies = companies.filter(company => 
        company.companyName.toLowerCase().includes(searchLower) ||
        company.clientCode.toLowerCase().includes(searchLower)
      )
    }

    const total = companies.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedCompanies = companies.slice(start, end)

    return {
      companies: paginatedCompanies,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: totalPages
    }
  }

  /**
   * 导出数据为 JSON 文件
   * @param {String} dataId - 数据ID
   */
  static exportToJson(dataId) {
    const importedData = this.getImportedData(dataId)
    if (!importedData) {
      throw new Error('数据不存在')
    }

    const jsonStr = JSON.stringify(importedData, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importedData.metadata.companyName}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 从 JSON 文件导入数据
   * @param {File} file - JSON 文件
   * @returns {Promise<String>} 数据ID
   */
  static async importFromJson(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)
          
          // 验证数据格式
          if (!importedData.data || !importedData.metadata) {
            reject(new Error('JSON 文件格式不正确'))
            return
          }

          // 生成新的 ID
          const newId = this.generateDataId()
          importedData.id = newId
          importedData.metadata.importTime = Date.now()
          importedData.metadata.importDate = new Date().toLocaleString('zh-CN')

          // 保存数据
          localStorage.setItem(`${STORAGE_KEY}_${newId}`, JSON.stringify(importedData))
          this.addToImportList(importedData)

          resolve(newId)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsText(file)
    })
  }
}

/**
 * 使用示例：
 * 
 * import { ImportedDataService } from '@/services/importedDataService'
 * 
 * // 1. 保存导入的数据
 * const dataId = ImportedDataService.saveImportedData(treeData, {
 *   companyName: '京海控股',
 *   companyCode: 'C001',
 *   stats: { totalRecords: 100 }
 * })
 * 
 * // 2. 获取导入的数据
 * const data = ImportedDataService.getImportedData(dataId)
 * 
 * // 3. 获取所有导入列表
 * const list = ImportedDataService.getImportedList()
 * 
 * // 4. 删除数据
 * ImportedDataService.deleteImportedData(dataId)
 */
