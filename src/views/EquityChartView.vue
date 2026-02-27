<template>
  <div class="equity-chart-view">
    <div class="top-bar">
      <button class="back-btn" @click="goBack">
        ← 返回首页
      </button>
      <div class="company-title">
        <h2>{{ companyName }}</h2>
        <p class="credit-code">{{ creditCode }}</p>
      </div>
      <div class="spacer"></div>
    </div>

    <div class="chart-container">
      <EquityChart
        :key="chartKey"
        :company-name="companyName"
        :company-credit-code="creditCode"
        :company-code="companyCode"
        :height="chartHeight"
        :show-performance="false"
        @node-click="handleNodeClick"
      />
    </div>

    <!-- 节点详情弹窗 -->
    <div v-if="selectedNode" class="node-detail-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedNode.name }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="detail-item">
            <span class="label">信用代码：</span>
            <span class="value">{{ selectedNode.companyCreditCode || '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">类型：</span>
            <span class="value">{{ selectedNode.type === 1 ? '个人' : '企业' }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.ratio">
            <span class="label">持股比例：</span>
            <span class="value highlight">{{ selectedNode.ratio }}</span>
          </div>
          <div class="detail-item" v-if="selectedNode.amount && selectedNode.amount !== '0'">
            <span class="label">投资金额：</span>
            <span class="value">{{ selectedNode.amount }} 万元</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" @click="viewThisCompany" v-if="selectedNode.type === 2">
            查看此公司股权图
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EquityChart from '@/components/ui/EquityChart/index.vue'

const router = useRouter()
const route = useRoute()

const companyName = ref('')
const creditCode = ref('')
const companyCode = ref('')
const selectedNode = ref(null)
const chartHeight = ref(600)
const chartKey = ref(0) // 用于强制重新渲染图表

// 加载公司信息
const loadCompanyInfo = () => {
  companyName.value = route.query.companyName || '示例科技有限公司'
  // 优先使用 companyCode（客户编号），其次使用 creditCode 或 companyCreditCode（信用代码）
  companyCode.value = route.query.companyCode || route.query.clientCode || ''
  creditCode.value = route.query.companyCreditCode || route.query.creditCode || ''
  
  // 更新 key 强制重新渲染
  chartKey.value++
  
  console.log('📊 加载公司信息:', {
    companyName: companyName.value,
    companyCode: companyCode.value,
    creditCode: creditCode.value,
    chartKey: chartKey.value
  })
}

onMounted(() => {
  // 从路由参数获取公司信息
  loadCompanyInfo()
  
  // 计算图表高度
  updateChartHeight()
  window.addEventListener('resize', updateChartHeight)
})

// 监听路由变化
watch(() => route.query, (newQuery, oldQuery) => {
  // 当路由参数变化时重新加载
  if (newQuery.companyName !== oldQuery.companyName || 
      newQuery.creditCode !== oldQuery.creditCode ||
      newQuery.companyCode !== oldQuery.companyCode) {
    console.log('🔄 路由参数变化，重新加载')
    loadCompanyInfo()
  }
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', updateChartHeight)
})

const updateChartHeight = () => {
  chartHeight.value = window.innerHeight - 120
}

const goBack = () => {
  router.push({ name: 'Home' })
}

const handleNodeClick = (node) => {
  console.log('🖱️ 节点点击事件:', {
    name: node.name,
    type: node.type,
    companyCreditCode: node.companyCreditCode,
    companyCode: node.companyCode,
    id: node.id,
    fullNode: node
  })
  selectedNode.value = node
}

const closeModal = () => {
  selectedNode.value = null
}

const viewThisCompany = () => {
  if (!selectedNode.value) {
    console.warn('⚠️ 没有选中的节点')
    return
  }
  
  // 先保存节点数据的副本，因为 closeModal 会清空 selectedNode
  const nodeData = { ...selectedNode.value }
  
  console.log('🔍 准备查看公司:', nodeData)
  
  // 只有企业类型才能查看股权图
  if (nodeData.type !== 2) {
    console.warn('⚠️ 只有企业类型才能查看股权图')
    alert('只有企业类型才能查看股权图')
    return
  }
  
  // 获取目标公司的客户编号（最准确的标识）
  const targetCompanyCode = nodeData.companyCode || nodeData.id
  
  if (!targetCompanyCode) {
    console.error('❌ 无法获取公司客户编号')
    alert('无法获取公司标识，无法跳转')
    return
  }
  
  console.log('✅ 目标公司客户编号:', targetCompanyCode)
  console.log('📍 当前公司客户编号:', companyCode.value)
  
  // 检查是否是当前公司（使用客户编号精确匹配）
  if (targetCompanyCode === companyCode.value) {
    console.warn('⚠️ 这就是当前公司，无需跳转')
    alert('这就是当前公司')
    closeModal()
    return
  }
  
  // 关闭弹窗
  closeModal()
  
  // 构建新的查询参数
  const newQuery = {
    companyName: nodeData.name,
    companyCode: targetCompanyCode,                    // 客户编号（优先）
    companyCreditCode: nodeData.companyCreditCode,     // 信用代码
    creditCode: nodeData.companyCreditCode,            // 兼容旧参数
    t: Date.now() // 添加时间戳确保路由变化
  }
  
  console.log('🚀 跳转参数:', newQuery)
  
  // 跳转到新的公司
  router.push({
    name: 'EquityChartView',
    query: newQuery
  }).then(() => {
    console.log('✅ 路由跳转成功')
  }).catch(err => {
    console.error('❌ 路由跳转失败:', err)
  })
}
</script>

<style scoped>
.equity-chart-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f9;
}

.top-bar {
  display: flex;
  align-items: center;
  padding: 20px 30px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  gap: 20px;
}

.back-btn {
  padding: 10px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
}

.back-btn:hover {
  background: #5568d3;
  transform: translateX(-2px);
}

.company-title {
  flex: 1;
  text-align: center;
}

.company-title h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.credit-code {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #999;
  font-family: 'Courier New', monospace;
}

.spacer {
  width: 100px;
}

.chart-container {
  flex: 1;
  overflow: hidden;
}

/* 弹窗样式 */
.node-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 24px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  color: #666;
  font-size: 14px;
}

.detail-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.detail-item .value.highlight {
  color: #667eea;
  font-weight: 600;
  font-size: 16px;
}

.modal-footer {
  padding: 16px 24px 24px 24px;
  text-align: center;
}

.action-btn {
  padding: 12px 32px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 768px) {
  .top-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .spacer {
    display: none;
  }
  
  .company-title h2 {
    font-size: 18px;
  }
}
</style>
