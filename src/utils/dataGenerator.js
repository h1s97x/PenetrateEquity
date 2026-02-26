/**
 * 数据生成器
 * 用于生成测试数据和大数据量场景
 */

/**
 * 公司名称生成器
 */
class NameGenerator {
  static prefixes = ['京海', '上海', '深圳', '北京', '广州', '杭州', '成都', '武汉']
  static types = ['科技', '投资', '实业', '控股', '集团', '网络', '数据', '智能']
  static suffixes = ['有限公司', '股份有限公司', '集团有限公司', '科技有限公司']
  static personNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  static generateCompanyName() {
    const prefix = this.prefixes[Math.floor(Math.random() * this.prefixes.length)]
    const type = this.types[Math.floor(Math.random() * this.types.length)]
    const suffix = this.suffixes[Math.floor(Math.random() * this.suffixes.length)]
    return `${prefix}${type}${suffix}`
  }

  static generatePersonName() {
    return this.personNames[Math.floor(Math.random() * this.personNames.length)]
  }
}

/**
 * 数据生成器主类
 */
export class DataGenerator {
  /**
   * 生成完整的公司树形数据
   * @param {Object} options - 配置选项
   * @returns {Object} 树形数据
   */
  static generateCompanyTree(options = {}) {
    const {
      downwardDepth = 3,      // 向下层级深度
      upwardDepth = 2,        // 向上层级深度
      childrenPerLevel = 5,   // 每层子节点数量
      shareholderCount = 3,   // 股东数量
      companyName = '测试集团有限公司',
      companyCreditCode = '91000000000000001X'
    } = options

    const root = {
      id: 'ROOT001',
      name: companyName,
      ratio: '100.00%',
      amount: '100000',
      type: 2,
      companyCreditCode: companyCreditCode,
      companyCode: 'ROOT001',
      direction: 'root',
      children: [],
      parents: []
    }

    // 生成向下数据（子公司）
    root.children = this.generateDownwardNodes(downwardDepth, childrenPerLevel, 1)
    
    // 生成向上数据（股东）
    root.parents = this.generateUpwardNodes(upwardDepth, shareholderCount, 1)

    return root
  }

  /**
   * 生成向下节点（子公司）
   * @param {Number} depth - 剩余深度
   * @param {Number} count - 节点数量
   * @param {Number} level - 当前层级
   * @returns {Array} 节点数组
   */
  static generateDownwardNodes(depth, count, level) {
    if (depth === 0) return null

    const nodes = []
    for (let i = 0; i < count; i++) {
      const id = `SUB_L${level}_${i + 1}`
      const ratio = this.generateRatio()
      
      const node = {
        id,
        name: NameGenerator.generateCompanyName(),
        ratio: `${ratio}%`,
        amount: `${Math.floor(Math.random() * 50000 + 1000)}`,
        type: 2, // 企业
        companyCreditCode: this.generateCreditCode(),
        companyCode: id,
        direction: 'downward',
        status: depth > 1 ? 1 : 0,
        children: depth > 1 
          ? this.generateDownwardNodes(depth - 1, Math.max(2, count - 1), level + 1)
          : null
      }
      
      nodes.push(node)
    }

    return nodes
  }

  /**
   * 生成向上节点（股东）
   * @param {Number} depth - 剩余深度
   * @param {Number} count - 节点数量
   * @param {Number} level - 当前层级
   * @returns {Array} 节点数组
   */
  static generateUpwardNodes(depth, count, level) {
    if (depth === 0) return null

    const nodes = []
    
    // 生成持股比例，确保总和为 100%
    const ratios = this.generateRatiosSum100(count)
    
    for (let i = 0; i < count; i++) {
      const isPerson = Math.random() > 0.5
      const id = `${isPerson ? 'PERSON' : 'SHARE'}_L${level}_${i + 1}`
      const ratio = ratios[i]
      
      const node = {
        id,
        name: isPerson 
          ? NameGenerator.generatePersonName()
          : NameGenerator.generateCompanyName(),
        ratio: `${ratio}%`,
        amount: `${Math.floor(ratio * 1000)}`, // 金额与持股比例相关
        type: isPerson ? 1 : 2, // 1: 个人, 2: 企业
        companyCreditCode: isPerson ? '' : this.generateCreditCode(),
        companyCode: id,
        direction: 'upward',
        status: depth > 1 && !isPerson ? 1 : 0,
        // 修复：向上穿透应该使用 parents 而不是 children
        parents: depth > 1 && !isPerson
          ? this.generateUpwardNodes(depth - 1, Math.max(1, count - 1), level + 1)
          : null
      }
      
      nodes.push(node)
    }

    return nodes
  }

  /**
   * 生成持股比例（单个，随机）
   * @returns {String} 比例
   */
  static generateRatio() {
    const ratio = Math.random() * 100
    return ratio.toFixed(2)
  }

  /**
   * 生成多个持股比例，确保总和为 100%
   * @param {Number} count - 股东数量
   * @returns {Array<Number>} 比例数组
   */
  static generateRatiosSum100(count) {
    if (count === 1) {
      return [100.00]
    }

    // 生成随机数
    const randoms = []
    let sum = 0
    for (let i = 0; i < count; i++) {
      const random = Math.random()
      randoms.push(random)
      sum += random
    }

    // 归一化到 100%
    const ratios = randoms.map(r => {
      const ratio = (r / sum) * 100
      return parseFloat(ratio.toFixed(2))
    })

    // 修正舍入误差，确保总和精确为 100
    const actualSum = ratios.reduce((a, b) => a + b, 0)
    const diff = parseFloat((100 - actualSum).toFixed(2))
    if (diff !== 0) {
      ratios[0] = parseFloat((ratios[0] + diff).toFixed(2))
    }

    return ratios
  }

  /**
   * 生成统一社会信用代码
   * @returns {String} 信用代码
   */
  static generateCreditCode() {
    const prefix = '91'
    const random = Math.floor(Math.random() * 1000000000000000).toString().padStart(16, '0')
    return prefix + random
  }

  /**
   * 生成大数据量测试数据
   * @param {Number} totalNodes - 总节点数（近似）
   * @returns {Object} 树形数据
   */
  static generateLargeDataset(totalNodes = 1000) {
    // 计算合适的深度和宽度
    const depth = Math.ceil(Math.log(totalNodes) / Math.log(5))
    const width = Math.ceil(Math.pow(totalNodes, 1 / depth))

    console.log(`生成大数据集: 深度=${depth}, 宽度=${width}, 预计节点数=${Math.pow(width, depth)}`)

    return this.generateCompanyTree({
      downwardDepth: depth,
      upwardDepth: Math.max(2, Math.floor(depth / 2)),
      childrenPerLevel: width,
      shareholderCount: Math.max(3, Math.floor(width / 2)),
      companyName: '大型测试集团有限公司',
      companyCreditCode: '91000000000000001X'
    })
  }

  /**
   * 生成扁平化数据（用于 V2 格式）
   * @param {Number} count - 节点数量
   * @returns {Array} 扁平化数据数组
   */
  static generateFlatData(count = 100) {
    const data = []
    
    // 根节点
    const root = {
      id: 'BG00001',
      name: '测试集团有限公司',
      percent: '100.00',
      childrenIdList: []
    }

    // 生成子节点
    for (let i = 2; i <= count; i++) {
      const id = `BG${String(i).padStart(5, '0')}`
      const node = {
        id,
        name: NameGenerator.generateCompanyName(),
        percent: this.generateRatio(),
        childrenIdList: ''
      }

      // 随机分配父节点
      if (i <= 10) {
        root.childrenIdList.push(id)
      }

      data.push(node)
    }

    root.childrenIdList = root.childrenIdList.join(',')
    data.unshift(root)

    return data
  }

  /**
   * 生成预设场景数据
   */
  static generateScenario(scenarioName) {
    const scenarios = {
      // 简单场景：2层，少量节点
      simple: {
        downwardDepth: 2,
        upwardDepth: 1,
        childrenPerLevel: 3,
        shareholderCount: 2,
        companyName: '简单测试公司'
      },
      
      // 中等场景：3层，中等节点
      medium: {
        downwardDepth: 3,
        upwardDepth: 2,
        childrenPerLevel: 5,
        shareholderCount: 3,
        companyName: '中等测试集团'
      },
      
      // 复杂场景：4层，大量节点
      complex: {
        downwardDepth: 4,
        upwardDepth: 3,
        childrenPerLevel: 8,
        shareholderCount: 5,
        companyName: '复杂测试集团'
      },
      
      // 深度场景：深层级，少节点
      deep: {
        downwardDepth: 6,
        upwardDepth: 4,
        childrenPerLevel: 2,
        shareholderCount: 2,
        companyName: '深度测试公司'
      },
      
      // 广度场景：浅层级，多节点
      wide: {
        downwardDepth: 2,
        upwardDepth: 1,
        childrenPerLevel: 15,
        shareholderCount: 8,
        companyName: '广度测试集团'
      }
    }

    const scenario = scenarios[scenarioName] || scenarios.medium
    return this.generateCompanyTree(scenario)
  }
}

/**
 * 数据统计工具
 */
export class DataStatistics {
  /**
   * 统计树形数据
   * @param {Object} treeData - 树形数据
   * @returns {Object} 统计信息
   */
  static analyze(treeData) {
    const stats = {
      totalNodes: 0,
      maxDepth: 0,
      downwardNodes: 0,
      upwardNodes: 0,
      companyNodes: 0,
      personNodes: 0,
      leafNodes: 0
    }

    const traverse = (node, depth, direction) => {
      if (!node) return

      stats.totalNodes++
      stats.maxDepth = Math.max(stats.maxDepth, depth)

      if (direction === 'downward') stats.downwardNodes++
      if (direction === 'upward') stats.upwardNodes++
      if (node.type === 1) stats.personNodes++
      if (node.type === 2) stats.companyNodes++

      const children = node.children || []
      if (children.length === 0) {
        stats.leafNodes++
      } else {
        children.forEach(child => traverse(child, depth + 1, direction))
      }
    }

    // 统计向下
    if (treeData.children) {
      treeData.children.forEach(child => traverse(child, 1, 'downward'))
    }

    // 统计向上
    if (treeData.parents) {
      treeData.parents.forEach(parent => traverse(parent, 1, 'upward'))
    }

    return stats
  }

  /**
   * 打印统计信息
   */
  static printStats(treeData) {
    const stats = this.analyze(treeData)
    
    console.log('========== 数据统计 ==========')
    console.log(`总节点数: ${stats.totalNodes}`)
    console.log(`最大深度: ${stats.maxDepth}`)
    console.log(`向下节点: ${stats.downwardNodes}`)
    console.log(`向上节点: ${stats.upwardNodes}`)
    console.log(`企业节点: ${stats.companyNodes}`)
    console.log(`个人节点: ${stats.personNodes}`)
    console.log(`叶子节点: ${stats.leafNodes}`)
    console.log('============================')

    return stats
  }
}

// 使用示例
export const examples = {
  // 简单示例
  simple: () => DataGenerator.generateScenario('simple'),
  
  // 中等示例
  medium: () => DataGenerator.generateScenario('medium'),
  
  // 复杂示例
  complex: () => DataGenerator.generateScenario('complex'),
  
  // 大数据量示例
  large: () => DataGenerator.generateLargeDataset(1000),
  
  // 自定义示例
  custom: (options) => DataGenerator.generateCompanyTree(options)
}
