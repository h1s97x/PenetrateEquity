<template>
  <div class="demo-page">
    <header class="page-header">
      <h1>股权穿透图 - 功能演示</h1>
      <div class="nav-links">
        <router-link to="/chart" class="nav-link">主页</router-link>
        <router-link to="/performance" class="nav-link">性能测试</router-link>
        <router-link to="/v2-test" class="nav-link">V2数据测试</router-link>
      </div>
      <div class="version-tabs">
        <button 
          :class="['tab-btn', { active: currentMode === 'basic' }]"
          @click="currentMode = 'basic'"
        >
          基础功能
        </button>
        <button 
          :class="['tab-btn', { active: currentMode === 'performance' }]"
          @click="currentMode = 'performance'"
        >
          性能监控
        </button>
        <button 
          :class="['tab-btn', { active: currentMode === 'large-data' }]"
          @click="currentMode = 'large-data'"
        >
          大数据量
        </button>
      </div>
    </header>

    <div class="content-wrapper">
      <div class="demo-view">
        <div class="version-info">
          <h2>{{ getModeTitle() }}</h2>
          <div class="features">
            <span class="feature-tag">✅ D3.js v7</span>
            <span class="feature-tag">✅ Composition API</span>
            <span class="feature-tag">✅ 模块化架构</span>
            <span class="feature-tag">✅ 性能优化</span>
            <span class="feature-tag">✅ 懒加载</span>
            <span class="feature-tag">✅ 缓存机制</span>
          </div>
          <div class="mode-description">
            {{ getModeDescription() }}
          </div>
        </div>
        
        <EquityChart 
          :height="600"
          :show-performance="currentMode === 'performance'"
          :scenario="getScenario()"
          @node-click="handleNodeClick"
        />
      </div>
    </div>

    <!-- 节点信息面板 -->
    <div v-if="selectedNode" class="node-info-panel">
      <div class="panel-header">
        <h3>节点信息</h3>
        <button @click="selectedNode = null" class="close-btn">×</button>
      </div>
      <div class="panel-content">
        <div class="info-item">
          <span class="label">名称:</span>
          <span class="value">{{ selectedNode.data.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">持股比例:</span>
          <span class="value">{{ selectedNode.data.ratio }}</span>
        </div>
        <div class="info-item">
          <span class="label">类型:</span>
          <span class="value">{{ selectedNode.data.type === 1 ? '个人' : '企业' }}</span>
        </div>
        <div class="info-item">
          <span class="label">层级:</span>
          <span class="value">{{ selectedNode.depth }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EquityChart from '@/components/EquityChart/index.vue'

const currentMode = ref('basic')
const selectedNode = ref(null)

const getModeTitle = () => {
  const titles = {
    basic: '基础功能演示',
    performance: '性能监控演示',
    'large-data': '大数据量演示'
  }
  return titles[currentMode.value]
}

const getModeDescription = () => {
  const descriptions = {
    basic: '展示股权穿透图的基本功能：节点展开/折叠、缩放拖拽、节点点击等',
    performance: '实时显示性能指标：渲染时间、节点数量、加载状态等',
    'large-data': '使用复杂场景数据，展示大数据量下的流畅渲染能力'
  }
  return descriptions[currentMode.value]
}

const getScenario = () => {
  const scenarios = {
    basic: 'medium',
    performance: 'complex',
    'large-data': 'wide'
  }
  return scenarios[currentMode.value]
}

const handleNodeClick = (event, node) => {
  selectedNode.value = node
  console.log('点击节点:', node)
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.page-header {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0 0 20px 0;
  font-size: 28px;
  color: #333;
  text-align: center;
}

.nav-links {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
}

.nav-link {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 6px;
  text-decoration: none;
  color: #666;
  font-size: 14px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: #6f90fb;
  color: white;
}

.nav-link.router-link-active {
  background: #6f90fb;
  color: white;
}

.version-tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.tab-btn {
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: #6f90fb;
  color: #6f90fb;
}

.tab-btn.active {
  background: #6f90fb;
  border-color: #6f90fb;
  color: white;
}

.content-wrapper {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.demo-view {
  width: 100%;
}

.version-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.version-info h2 {
  margin: 0 0 12px 0;
  font-size: 22px;
  color: #333;
}

.features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.feature-tag {
  padding: 6px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.mode-description {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.node-info-panel {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #6f90fb;
  color: white;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
}

.close-btn:hover {
  opacity: 0.8;
}

.panel-content {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #999;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}
</style>
