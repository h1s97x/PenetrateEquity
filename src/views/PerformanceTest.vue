<template>
  <div class="performance-test-page">
    <header class="page-header">
      <h1>性能测试与监控</h1>
      <p>实时查看股权穿透图的性能指标</p>
    </header>

    <div class="test-controls">
      <button @click="runTest" :disabled="testing" class="test-btn">
        {{ testing ? '测试中...' : '运行性能测试' }}
      </button>
      <button @click="clearResults" class="clear-btn">
        清除结果
      </button>
      <label class="checkbox-label">
        <input type="checkbox" v-model="autoRefresh" />
        自动刷新指标
      </label>
    </div>

    <div class="content-grid">
      <!-- 实时性能指标 -->
      <div class="metrics-card">
        <h3>实时性能指标</h3>
        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-label">渲染时间</div>
            <div class="metric-value" :class="getPerformanceClass(currentMetrics.lastRenderTime)">
              {{ currentMetrics.lastRenderTime || 0 }}ms
            </div>
            <div class="metric-avg">平均: {{ currentMetrics.avgRenderTime || 0 }}ms</div>
          </div>
          
          <div class="metric-box">
            <div class="metric-label">更新时间</div>
            <div class="metric-value" :class="getPerformanceClass(currentMetrics.lastUpdateTime)">
              {{ currentMetrics.lastUpdateTime || 0 }}ms
            </div>
            <div class="metric-avg">平均: {{ currentMetrics.avgUpdateTime || 0 }}ms</div>
          </div>
          
          <div class="metric-box">
            <div class="metric-label">节点数量</div>
            <div class="metric-value">
              {{ currentMetrics.nodeCount || 0 }}
            </div>
          </div>
          
          <div class="metric-box">
            <div class="metric-label">连接线数</div>
            <div class="metric-value">
              {{ currentMetrics.linkCount || 0 }}
            </div>
          </div>
          
          <div class="metric-box">
            <div class="metric-label">已加载节点</div>
            <div class="metric-value success">
              {{ loadStats.loadedCount || 0 }}
            </div>
          </div>
          
          <div class="metric-box">
            <div class="metric-label">加载中</div>
            <div class="metric-value" :class="loadStats.loadingCount > 0 ? 'warning' : ''">
              {{ loadStats.loadingCount || 0 }}
            </div>
          </div>
        </div>
      </div>

      <!-- 测试结果 -->
      <div class="results-card">
        <h3>测试结果</h3>
        <div v-if="testResults.length === 0" class="empty-state">
          点击"运行性能测试"开始测试
        </div>
        <div v-else class="results-list">
          <div v-for="(result, index) in testResults" :key="index" class="result-item">
            <div class="result-header">
              <span class="result-title">测试 #{{ testResults.length - index }}</span>
              <span class="result-time">{{ result.timestamp }}</span>
            </div>
            <div class="result-metrics">
              <span>渲染: {{ result.renderTime }}ms</span>
              <span>更新: {{ result.updateTime }}ms</span>
              <span>节点: {{ result.nodeCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <h3>股权穿透图（带性能监控）</h3>
      <EquityChart
        ref="chartRef"
        :height="600"
        :show-performance="true"
        @node-click="handleNodeClick"
      />
    </div>

    <!-- 性能建议 -->
    <div class="suggestions-card">
      <h3>性能优化建议</h3>
      <div class="suggestions-list">
        <div v-for="suggestion in suggestions" :key="suggestion.id" class="suggestion-item">
          <span class="suggestion-icon" :class="suggestion.type">
            {{ suggestion.type === 'success' ? '✓' : suggestion.type === 'warning' ? '⚠' : 'ℹ' }}
          </span>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-desc">{{ suggestion.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import EquityChart from '@/components/ui/EquityChart/index.vue'

const chartRef = ref(null)
const testing = ref(false)
const autoRefresh = ref(true)
const currentMetrics = ref({})
const loadStats = ref({})
const testResults = ref([])

let metricsTimer = null

/**
 * 获取性能等级样式
 */
const getPerformanceClass = (time) => {
  if (!time) return ''
  if (time < 100) return 'success'
  if (time < 300) return 'warning'
  return 'danger'
}

/**
 * 运行性能测试
 */
const runTest = async () => {
  testing.value = true
  
  try {
    // 模拟性能测试
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const result = {
      timestamp: new Date().toLocaleTimeString(),
      renderTime: currentMetrics.value.lastRenderTime || 0,
      updateTime: currentMetrics.value.lastUpdateTime || 0,
      nodeCount: currentMetrics.value.nodeCount || 0,
      linkCount: currentMetrics.value.linkCount || 0
    }
    
    testResults.value.unshift(result)
    
    // 只保留最近 10 次测试结果
    if (testResults.value.length > 10) {
      testResults.value = testResults.value.slice(0, 10)
    }
  } finally {
    testing.value = false
  }
}

/**
 * 清除测试结果
 */
const clearResults = () => {
  testResults.value = []
}

/**
 * 节点点击事件
 */
const handleNodeClick = (node) => {
  console.log('节点点击:', node)
}

/**
 * 更新性能指标
 */
const updateMetrics = () => {
  // 这里应该从图表实例获取真实指标
  // 暂时使用模拟数据
  currentMetrics.value = {
    lastRenderTime: Math.random() * 100 + 50,
    lastUpdateTime: Math.random() * 50 + 20,
    avgRenderTime: Math.random() * 80 + 40,
    avgUpdateTime: Math.random() * 40 + 15,
    nodeCount: Math.floor(Math.random() * 50 + 20),
    linkCount: Math.floor(Math.random() * 40 + 15)
  }
  
  loadStats.value = {
    loadedCount: Math.floor(Math.random() * 10 + 5),
    loadingCount: Math.floor(Math.random() * 3)
  }
}

/**
 * 性能建议
 */
const suggestions = computed(() => {
  const result = []
  
  const renderTime = currentMetrics.value.lastRenderTime || 0
  const nodeCount = currentMetrics.value.nodeCount || 0
  
  if (renderTime < 100) {
    result.push({
      id: 1,
      type: 'success',
      title: '渲染性能优秀',
      description: '当前渲染时间在最佳范围内，用户体验良好'
    })
  } else if (renderTime < 300) {
    result.push({
      id: 2,
      type: 'warning',
      title: '渲染性能一般',
      description: '建议减少节点数量或启用懒加载优化'
    })
  } else {
    result.push({
      id: 3,
      type: 'danger',
      title: '渲染性能较差',
      description: '强烈建议优化：启用懒加载、减少节点数量、使用虚拟滚动'
    })
  }
  
  if (nodeCount > 100) {
    result.push({
      id: 4,
      type: 'info',
      title: '节点数量较多',
      description: '建议启用懒加载和可视区域优化以提升性能'
    })
  }
  
  if (autoRefresh.value) {
    result.push({
      id: 5,
      type: 'info',
      title: '自动刷新已启用',
      description: '性能指标每秒自动更新，可能会略微影响性能'
    })
  }
  
  return result
})

onMounted(() => {
  // 启动自动刷新
  if (autoRefresh.value) {
    metricsTimer = setInterval(updateMetrics, 1000)
  }
  
  // 初始更新
  updateMetrics()
})

onBeforeUnmount(() => {
  if (metricsTimer) {
    clearInterval(metricsTimer)
  }
})
</script>

<style scoped>
.performance-test-page {
  min-height: 100vh;
  background: #f5f6f9;
  padding: 20px;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.test-controls {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-btn, .clear-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-btn {
  background: #6f90fb;
  color: white;
}

.test-btn:hover:not(:disabled) {
  background: #5a7de8;
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.clear-btn {
  background: #f0f0f0;
  color: #666;
}

.clear-btn:hover {
  background: #e0e0e0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  margin-left: auto;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.metrics-card, .results-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metrics-card h3, .results-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metric-box {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.metric-value.success {
  color: #2e7d32;
}

.metric-value.warning {
  color: #f57c00;
}

.metric-value.danger {
  color: #d32f2f;
}

.metric-avg {
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:last-child {
  border-bottom: none;
}

.result-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.result-title {
  font-weight: 600;
  color: #333;
}

.result-time {
  font-size: 12px;
  color: #999;
}

.result-metrics {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #666;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.suggestions-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.suggestions-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.suggestion-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.suggestion-icon.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.suggestion-icon.warning {
  background: #fff3e0;
  color: #f57c00;
}

.suggestion-icon.danger {
  background: #ffebee;
  color: #d32f2f;
}

.suggestion-icon.info {
  background: #e3f2fd;
  color: #1976d2;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.suggestion-desc {
  font-size: 13px;
  color: #666;
}

@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
