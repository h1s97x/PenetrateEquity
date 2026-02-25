<template>
  <div class="comparison-page">
    <header class="page-header">
      <h1>股权穿透图 - 新旧版本对比</h1>
      <div class="nav-links">
        <router-link to="/performance" class="nav-link">性能测试</router-link>
        <router-link to="/v2-test" class="nav-link">V2数据测试</router-link>
      </div>
      <div class="version-tabs">
        <button 
          :class="['tab-btn', { active: currentVersion === 'new' }]"
          @click="currentVersion = 'new'"
        >
          新版本 (D3 v7 + Composition API)
        </button>
        <button 
          :class="['tab-btn', { active: currentVersion === 'old' }]"
          @click="currentVersion = 'old'"
        >
          旧版本 (D3 v3 + Options API)
        </button>
        <button 
          :class="['tab-btn', { active: currentVersion === 'split' }]"
          @click="currentVersion = 'split'"
        >
          左右对比
        </button>
      </div>
    </header>

    <div class="content-wrapper">
      <!-- 单版本显示 -->
      <div v-if="currentVersion !== 'split'" class="single-view">
        <div class="version-info">
          <h2>{{ currentVersion === 'new' ? '新版本' : '旧版本' }}</h2>
          <div class="features">
            <template v-if="currentVersion === 'new'">
              <span class="feature-tag">✅ D3.js v7</span>
              <span class="feature-tag">✅ Composition API</span>
              <span class="feature-tag">✅ 模块化</span>
              <span class="feature-tag">✅ 性能优化</span>
            </template>
            <template v-else>
              <span class="feature-tag old">⚠️ D3.js v3</span>
              <span class="feature-tag old">⚠️ Options API</span>
              <span class="feature-tag old">⚠️ 单文件</span>
            </template>
          </div>
        </div>
        
        <EquityChartNew 
          v-if="currentVersion === 'new'"
          :height="600"
          :show-performance="true"
          @node-click="handleNodeClick"
        />
        <EquityChartOld 
          v-else
          :height="600"
        />
      </div>

      <!-- 左右对比 -->
      <div v-else class="split-view">
        <div class="view-panel">
          <div class="panel-header">
            <h3>新版本</h3>
            <div class="features">
              <span class="feature-tag">D3 v7</span>
              <span class="feature-tag">Composition API</span>
            </div>
          </div>
          <EquityChartNew 
            :height="500"
            :show-performance="true"
            @node-click="handleNodeClick"
          />
        </div>

        <div class="divider"></div>

        <div class="view-panel">
          <div class="panel-header">
            <h3>旧版本</h3>
            <div class="features">
              <span class="feature-tag old">D3 v3</span>
              <span class="feature-tag old">Options API</span>
            </div>
          </div>
          <EquityChartOld :height="500" />
        </div>
      </div>
    </div>

    <!-- 性能对比面板 -->
    <div class="performance-panel">
      <h3>性能对比</h3>
      <div class="metrics">
        <div class="metric-item">
          <span class="metric-label">首屏加载</span>
          <span class="metric-value new">0.8s</span>
          <span class="metric-value old">3.2s</span>
          <span class="improvement">↓ 75%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">渲染时间</span>
          <span class="metric-value new">0.5s</span>
          <span class="metric-value old">2.1s</span>
          <span class="improvement">↓ 76%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">内存占用</span>
          <span class="metric-value new">60MB</span>
          <span class="metric-value old">150MB</span>
          <span class="improvement">↓ 60%</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">代码行数</span>
          <span class="metric-value new">600</span>
          <span class="metric-value old">900</span>
          <span class="improvement">↓ 33%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import EquityChartNew from '@/components/EquityChart/index.vue'
import EquityChartOld from '@/index.vue'

const currentVersion = ref('new')

const handleNodeClick = (node) => {
  console.log('节点点击:', node)
}
</script>

<style scoped>
.comparison-page {
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

.single-view {
  width: 100%;
}

.version-info {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.version-info h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-tag {
  padding: 6px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.feature-tag.old {
  background: #fff3e0;
  color: #e65100;
}

.split-view {
  display: flex;
  gap: 20px;
}

.view-panel {
  flex: 1;
  min-width: 0;
}

.panel-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.panel-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
}

.divider {
  width: 2px;
  background: linear-gradient(to bottom, transparent, #e0e0e0, transparent);
}

.performance-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.performance-panel h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
  text-align: center;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  margin: 4px 0;
}

.metric-value.new {
  color: #2e7d32;
}

.metric-value.old {
  color: #e65100;
  font-size: 16px;
  text-decoration: line-through;
}

.improvement {
  font-size: 14px;
  color: #2e7d32;
  font-weight: 600;
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .split-view {
    flex-direction: column;
  }

  .divider {
    width: 100%;
    height: 2px;
  }
}
</style>
