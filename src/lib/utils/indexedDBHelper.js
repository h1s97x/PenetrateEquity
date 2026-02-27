/**
 * IndexedDB 辅助工具
 * 用于存储大量数据，替代 localStorage
 */

const DB_NAME = 'EquityChartDB'
const DB_VERSION = 1
const STORE_NAME = 'importedData'

export class IndexedDBHelper {
  static db = null

  /**
   * 初始化数据库
   */
  static async initDB() {
    if (this.db) {
      return this.db
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(new Error('无法打开数据库'))
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('importTime', 'metadata.importTime', { unique: false })
          objectStore.createIndex('companyName', 'metadata.companyName', { unique: false })
        }
      }
    })
  }

  /**
   * 保存数据
   */
  static async saveData(id, data) {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.put({ id, ...data })

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(new Error('保存数据失败'))
    })
  }

  /**
   * 获取数据
   */
  static async getData(id) {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('读取数据失败'))
    })
  }

  /**
   * 获取所有数据列表（仅元数据）
   */
  static async getAllMetadata() {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const results = request.result.map(item => ({
          id: item.id,
          ...item.metadata
        }))
        // 按导入时间倒序排序
        results.sort((a, b) => b.importTime - a.importTime)
        resolve(results)
      }
      request.onerror = () => reject(new Error('读取列表失败'))
    })
  }

  /**
   * 删除数据
   */
  static async deleteData(id) {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('删除数据失败'))
    })
  }

  /**
   * 清空所有数据
   */
  static async clearAll() {
    const db = await this.initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(STORE_NAME)
      const request = objectStore.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('清空数据失败'))
    })
  }

  /**
   * 获取数据库大小估算
   */
  static async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
        quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
        percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      }
    }
    return null
  }
}
