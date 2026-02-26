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
        :company-name="companyName"
        :company-credit-code="creditCode"
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EquityChart from '@/components/ui/EquityChart/index.vue'

const router = useRouter()
const route = useRoute()

const companyName = ref('')
const creditCode = ref('')
const selectedNode = ref(null)
const chartHeight = ref(600)

onMounted(() => {
  // 从路由参数获取公司信息
  companyName.value = route.query.companyName || '示例科技有限公司'
  creditCode.value = route.query.creditCode || '91310000123456789X'
  
  // 计算图表高度
  updateChartHeight()
  window.addEventListener('resize', updateChartHeight)
})

const updateChartHeight = () => {
  chartHeight.value = window.innerHeight - 120
}

const goBack = () => {
  router.push({ name: 'Home' })
}

const handleNodeClick = (node) => {
  selectedNode.value = node
}

const closeModal = () => {
  selectedNode.value = null
}

const viewThisCompany = () => {
  if (selectedNode.value && selectedNode.value.companyCreditCode) {
    router.push({
      name: 'EquityChart',
      query: {
        companyName: selectedNode.value.name,
        creditCode: selectedNode.value.companyCreditCode
      }
    })
    closeModal()
  }
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
