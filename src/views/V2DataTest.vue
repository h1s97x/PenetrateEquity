<template>
  <div class="v2-data-test">
    <div class="header">
      <h1>V2 实验数据测试</h1>
      <div class="stats" v-if="stats">
        <div class="stat-item">
          <span class="label">总节点数:</span>
          <span class="value">{{ stats.totalNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="label">有子节点:</span>
          <span class="value">{{ stats.nodesWithChildren }}</span>
        </div>
        <div class="stat-item">
          <span class="label">叶子节点:</span>
          <span class="value">{{ stats.leafNodes }}</span>
        </div>
        <div class="stat-item">
          <span class="label">最多子节点:</span>
          <span class="value">{{ stats.maxChildrenCount }}</span>
        </div>
      </div>
      <div class="status" :class="statusClass">
        {{ statusMessage }}
      </div>
    </div>

    <div class="chart-container">
      <EquityChart
        v-if="loaded"
        company-name="京海控股集团有限公司"
        :show-performance="true"
      />
      <div v-else class="loading">
        加载中...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import EquityChart from '@/components/ui/EquityChart/index.vue'
import { v2DataLoader, V2DataAdapter } from '@/data/adapters/v2DataAdapter.js'

const loaded = ref(false)
const stats = ref(null)
const statusMessage = ref('正在加载 V2 数据...')
const statusClass = ref('loading')

onMounted(async () => {
  try {
    // 加载 V2 数据
    const data = await v2DataLoader.loadData()
    
    // 获取统计信息
    stats.value = V2DataAdapter.getStatistics(data)
    
    // 更新状态
    statusMessage.value = '✅ V2 数据加载成功！'
    statusClass.value = 'success'
    loaded.value = true
    
    console.log('V2 数据加载成功:', {
      节点数: data.length,
      统计信息: stats.value,
      前5个节点: data.slice(0, 5)
    })
  } catch (error) {
    statusMessage.value = `❌ 加载失败: ${error.message}`
    statusClass.value = 'error'
    console.error('V2 数据加载失败:', error)
  }
})
</script>

<style scoped>
.v2-data-test {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #333;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.stat-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #1890ff;
}

.status {
  padding: 10px 15px;
  border-radius: 4px;
  font-weight: 500;
}

.status.loading {
  background: #e6f7ff;
  color: #1890ff;
}

.status.success {
  background: #f6ffed;
  color: #52c41a;
}

.status.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.chart-container {
  flex: 1;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  color: #999;
}
</style>
