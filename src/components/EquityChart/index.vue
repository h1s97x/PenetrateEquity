<template>
  <div class="equity-chart-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="handleExpandAll" class="toolbar-btn">
        <span>📂</span> 全部展开
      </button>
      <button @click="handleCollapseAll" class="toolbar-btn">
        <span>📁</span> 全部折叠
      </button>
    </div>

    <!-- 性能监控面板 -->
    <div v-if="showPerformance" class="performance-panel">
      <div class="perf-item">
        <span class="perf-label">渲染时间:</span>
        <span class="perf-value">{{ performanceMetrics.lastRenderTime }}ms</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">更新时间:</span>
        <span class="perf-value">{{ performanceMetrics.lastUpdateTime }}ms</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">节点数:</span>
        <span class="perf-value">{{ performanceMetrics.nodeCount }}</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">已加载:</span>
        <span class="perf-value">{{ loadStats.loadedCount }}</span>
      </div>
      <div class="perf-item">
        <span class="perf-label">加载中:</span>
        <span class="perf-value">{{ loadStats.loadingCount }}</span>
      </div>
    </div>

    <div 
      ref="chartRef" 
      class="chart-wrapper"
      :style="{ height: height + 'px' }"
    ></div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useEquityChart } from './useEquityChart'
import { getCompanyShareholder } from '@/api/equityPenetrationChart/index'

const props = defineProps({
  companyCreditCode: {
    type: String,
    default: '91310000123456789X'
  },
  companyName: {
    type: String,
    default: '示例科技有限公司'
  },
  height: {
    type: Number,
    default: 600
  },
  showPerformance: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['updateLoading', 'hasData', 'nodeClick'])

const chartRef = ref(null)
const loading = ref(false)
const chartData = ref(null)
const performanceMetrics = ref({
  lastRenderTime: 0,
  lastUpdateTime: 0,
  nodeCount: 0,
  linkCount: 0
})
const loadStats = ref({
  loadedCount: 0,
  loadingCount: 0
})

let chartInstance = null
let perfUpdateTimer = null

/**
 * 获取数据
 */
const getData = async () => {
  try {
    loading.value = true
    emit('updateLoading', true)

    const params = {
      companyCreditCode: props.companyCreditCode,
      companyName: props.companyName,
      type: 0
    }

    const res = await getCompanyShareholder(params)
    
    if (res.code === 1) {
      const { downward, upward, main } = res.retInfo
      
      // 构建树形数据
      chartData.value = {
        id: main.companyCreditCode,
        name: main.name,
        ratio: '100.00%',
        type: 2,
        children: downward || [],
        parents: upward || []
      }

      emit('hasData', downward.length > 0 || upward.length > 0)
      
      // 绘制图表
      drawChart()
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
    emit('updateLoading', false)
  }
}

/**
 * 绘制图表
 */
const drawChart = () => {
  if (!chartRef.value || !chartData.value) return

  const rect = chartRef.value.getBoundingClientRect()
  
  const { 
    drawChart, 
    toggleNode, 
    getPerformanceMetrics,
    getLoadStats
  } = useEquityChart({
    onNodeClick: handleNodeClick,
    onVisibleNodesChange: handleVisibleNodesChange
  })

  chartInstance = drawChart(
    chartRef.value,
    chartData.value,
    rect.width,
    props.height
  )

  // 绑定展开按钮事件
  bindExpandEvents(toggleNode)

  // 启动性能监控更新
  if (props.showPerformance) {
    startPerformanceMonitoring(getPerformanceMetrics, getLoadStats)
  }
}

/**
 * 绑定展开按钮事件
 */
const bindExpandEvents = (toggleNode) => {
  const buttons = chartRef.value.querySelectorAll('.expand-btn')
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const nodeData = btn.__data__
      if (nodeData) {
        await toggleNode(nodeData)
        // 重新绑定事件（因为 DOM 更新了）
        setTimeout(() => bindExpandEvents(toggleNode), 100)
      }
    })
  })
}

/**
 * 节点点击事件
 */
const handleNodeClick = (event, node) => {
  console.log('节点点击:', node.data)
  emit('nodeClick', node.data)
}

/**
 * 可见节点变化
 */
const handleVisibleNodesChange = (visibleNodes) => {
  console.log('可见节点数:', visibleNodes.down.size + visibleNodes.up.size)
}

/**
 * 启动性能监控
 */
const startPerformanceMonitoring = (getMetrics, getStats) => {
  const updateMetrics = () => {
    performanceMetrics.value = getMetrics()
    loadStats.value = getStats()
  }

  // 每秒更新一次
  perfUpdateTimer = setInterval(updateMetrics, 1000)
  updateMetrics()
}

/**
 * 监听属性变化
 */
/**
 * 全部展开
 */
const handleExpandAll = () => {
  if (chartInstance) {
    chartInstance.expandAll()
  }
}

/**
 * 全部折叠
 */
const handleCollapseAll = () => {
  if (chartInstance) {
    chartInstance.collapseAll()
  }
}

watch(() => props.companyName, () => {
  getData()
})

watch(() => props.companyCreditCode, () => {
  getData()
})

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  // 清理
  if (chartRef.value) {
    chartRef.value.innerHTML = ''
  }
  if (perfUpdateTimer) {
    clearInterval(perfUpdateTimer)
  }
})
</script>

<style scoped>
.equity-chart-container {
  position: relative;
  width: 100%;
  background: #F5F6F9;
  border-radius: 8px;
  overflow: hidden;
}

.toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-btn:hover {
  background: #6f90fb;
  color: white;
  border-color: #6f90fb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(111, 144, 251, 0.3);
}

.toolbar-btn:active {
  transform: translateY(0);
}

.toolbar-btn span {
  font-size: 16px;
}

.performance-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  font-size: 12px;
  min-width: 150px;
}

.perf-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  line-height: 1.5;
}

.perf-item:last-child {
  margin-bottom: 0;
}

.perf-label {
  color: #666;
  margin-right: 8px;
}

.perf-value {
  color: #2e7d32;
  font-weight: 600;
}

.chart-wrapper {
  width: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6f90fb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

/* 全局样式 - 影响 D3 生成的元素 */
:deep(.node-text) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:deep(.expand-btn:hover circle) {
  fill: #D5E8FF;
  stroke: #6f90fb;
  stroke-width: 2;
}

:deep(.nodeOfDownItemGroup:hover rect),
:deep(.nodeOfUpItemGroup:hover rect) {
  filter: drop-shadow(0 4px 12px rgba(32, 52, 128, 0.25));
}

:deep(.linkOfDownItem),
:deep(.linkOfUpItem) {
  transition: stroke 0.3s ease;
}

:deep(.linkOfDownItem:hover),
:deep(.linkOfUpItem:hover) {
  stroke: #128bed;
  stroke-width: 3;
}
</style>
