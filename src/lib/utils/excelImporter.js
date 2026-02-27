/**
 * Excel 导入工具
 * 用于读取 Excel 文件并转换为股权穿透图数据
 */

import * as XLSX from 'xlsx'
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter.js'

/**
 * Excel 导入器类
 */
export class ExcelImporter {
  /**
   * 读取 Excel 文件（优化版：支持大文件和进度回调）
   * @param {File} file - Excel 文件对象
   * @param {Object} options - 读取选项
   * @returns {Promise<Object>} 转换后的树形数据
   */
  static async readExcelFile(file, options = {}) {
    const { onProgress } = options
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          if (onProgress) onProgress({ stage: 'parsing', percent: 10, message: '正在解析 Excel 文件...' })
          
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'array' })
          
          if (onProgress) onProgress({ stage: 'converting', percent: 30, message: '正在转换数据...' })
          
          // 获取第一个工作表
          const sheetName = options.sheetName || workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // 转换为 JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          if (jsonData.length === 0) {
            reject(new Error('Excel 文件为空'))
            return
          }

          if (onProgress) onProgress({ stage: 'validating', percent: 50, message: `正在验证数据（共 ${jsonData.length} 行）...` })

          // 验证数据
          const validation = ApiDataAdapter.validateApiData(jsonData)
          if (!validation.valid) {
            reject(new Error(`数据格式错误: ${validation.error}`))
            return
          }

          if (onProgress) onProgress({ stage: 'extracting', percent: 70, message: '正在提取公司列表...' })

          // 提取所有公司（优化：使用 Map 去重）
          const allCompanies = this.extractAllCompanies(jsonData)

          if (onProgress) onProgress({ stage: 'statistics', percent: 90, message: '正在生成统计信息...' })

          // 获取数据统计
          const stats = ApiDataAdapter.getStatistics(jsonData)

          if (onProgress) onProgress({ stage: 'complete', percent: 100, message: '导入完成！' })

          resolve({
            success: true,
            data: null, // 不再预先生成树形数据，按需生成
            stats: stats,
            rawData: jsonData,
            allCompanies: allCompanies
          })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      // 使用 ArrayBuffer 替代已弃用的 readAsBinaryString
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 验证 Excel 文件格式
   * @param {File} file - Excel 文件对象
   * @returns {Promise<Object>} 验证结果
   */
  static async validateExcelFile(file) {
    // 检查文件类型
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12'
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      return {
        valid: false,
        error: '请上传 Excel 文件（.xlsx 或 .xls）'
      }
    }

    // 检查文件大小（限制 10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '文件大小不能超过 10MB'
      }
    }

    return {
      valid: true,
      error: null
    }
  }

  /**
   * 下载 Excel 模板
   * @param {String} filename - 文件名
   */
  static downloadTemplate(filename = '股权穿透数据模板.xlsx') {
    // 创建模板数据
    const templateData = [
      {
        '公司名称': '京海控股集团',
        '客户编号': 'C001',
        '统一社会信用代码': '91110000123456789X',
        '股东名称': '张三',
        '股东客户编号': 'S001',
        '股东类型': '个人',
        '持股比例': '60',
        '投资金额': '6000',
        '股东出资排名': '1'
      },
      {
        '公司名称': '京海控股集团',
        '客户编号': 'C001',
        '统一社会信用代码': '91110000123456789X',
        '股东名称': '李四投资有限公司',
        '股东客户编号': 'C002',
        '股东类型': '企业',
        '持股比例': '40',
        '投资金额': '4000',
        '股东出资排名': '2'
      },
      {
        '公司名称': '京海科技有限公司',
        '客户编号': 'C003',
        '统一社会信用代码': '91110000987654321Y',
        '股东名称': '京海控股集团',
        '股东客户编号': 'C001',
        '股东类型': '企业',
        '持股比例': '100',
        '投资金额': '10000',
        '股东出资排名': '1'
      }
    ]

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '股权数据')

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 20 }, // 公司名称
      { wch: 15 }, // 客户编号
      { wch: 25 }, // 统一社会信用代码
      { wch: 20 }, // 股东名称
      { wch: 15 }, // 股东客户编号
      { wch: 10 }, // 股东类型
      { wch: 12 }, // 持股比例
      { wch: 12 }, // 投资金额
      { wch: 12 }  // 股东出资排名
    ]

    // 下载文件
    XLSX.writeFile(workbook, filename)
  }

  /**
   * 导出当前数据为 Excel
   * @param {Array} data - 数据数组
   * @param {String} filename - 文件名
   */
  static exportToExcel(data, filename = '股权穿透数据.xlsx') {
    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '股权数据')

    // 下载文件
    XLSX.writeFile(workbook, filename)
  }

  /**
   * 获取 Excel 文件的工作表列表
   * @param {File} file - Excel 文件对象
   * @returns {Promise<Array>} 工作表名称列表
   */
  static async getSheetNames(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'array' })
          resolve(workbook.SheetNames)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 预览 Excel 数据（前几行）
   * @param {File} file - Excel 文件对象
   * @param {Number} rows - 预览行数
   * @returns {Promise<Array>} 预览数据
   */
  static async previewExcelData(file, rows = 5) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          resolve({
            sheetName: sheetName,
            totalRows: jsonData.length,
            previewData: jsonData.slice(0, rows),
            columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : []
          })
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('文件读取失败'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 从数据中提取所有公司
   * @param {Array} jsonData - JSON 数据
   * @returns {Array} 公司列表
   */
  static extractAllCompanies(jsonData) {
    const companiesMap = new Map()

    jsonData.forEach(row => {
      const clientCode = row['客户编号']
      const companyName = row['公司名称']
      const creditCode = row['统一社会信用代码']

      if (clientCode && companyName && !companiesMap.has(clientCode)) {
        // 统计该公司的股东和投资数量
        const shareholders = jsonData.filter(r => r['客户编号'] === clientCode)
        const investments = jsonData.filter(r => r['股东客户编号'] === clientCode)

        companiesMap.set(clientCode, {
          clientCode: clientCode,
          companyName: companyName,
          creditCode: creditCode || '',
          shareholderCount: shareholders.length,
          subsidiaryCount: investments.length
        })
      }
    })

    return Array.from(companiesMap.values())
  }
}

/**
 * 使用示例：
 * 
 * import { ExcelImporter } from '@/lib/utils/excelImporter'
 * 
 * // 1. 下载模板
 * ExcelImporter.downloadTemplate()
 * 
 * // 2. 读取 Excel 文件
 * const result = await ExcelImporter.readExcelFile(file, {
 *   rootClientCode: 'C001'
 * })
 * 
 * // 3. 使用数据
 * chartData.value = result.data
 * console.log('数据统计:', result.stats)
 */
