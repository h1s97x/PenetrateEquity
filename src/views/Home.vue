<template>
  <div class="home-container">
    <div class="header">
      <h1>股权穿透图可视化系统</h1>
      <p class="subtitle">企业股权结构分析工具</p>
      
      <!-- Excel 导入入口 -->
      <div class="action-buttons">
        <button @click="goToImportHistory" class="btn-import-history">
          <span class="icon">📚</span>
          <span>导入历史</span>
        </button>
        <button @click="goToExcelImport" class="btn-excel-import">
          <span class="icon">📥</span>
          <span>导入 Excel 数据</span>
        </button>
      </div>
    </div>

    <!-- 有导入数据时显示公司列表 -->
    <div v-if="importedCompanies.length > 0" class="company-list">
      <div class="data-source-indicator">
        <span class="indicator-icon">📊</span>
        <span class="indicator-text">
          当前显示：导入的数据 ({{ importedCompanies.length }} 家公司)
        </span>
        <button @click="goToExamples" class="btn-switch">
          查看示例数据
        </button>
      </div>

      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索公司名称或客户编号..."
          @input="handleSearch"
        />
        <span class="search-icon">🔍</span>
      </div>

      <div class="company-grid">
        <div 
          v-for="company in filteredCompanies" 
          :key="company.id"
          class="company-card"
          @click="viewCompany(company)"
        >
          <div class="company-icon">🏢</div>
          <div class="company-info">
            <h3 class="company-name">{{ company.name }}</h3>
            <p class="company-code">{{ company.clientCode }}</p>
            <div class="company-stats">
              <span class="stat-item">
                <span class="stat-label">子公司：</span>
                <span class="stat-value">{{ company.subsidiaryCount }}</span>
              </span>
              <span class="stat-item">
                <span class="stat-label">股东：</span>
                <span class="stat-value">{{ company.shareholderCount }}</span>
              </span>
            </div>
          </div>
          <div class="view-btn">查看 →</div>
        </div>
      </div>

      <div v-if="filteredCompanies.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>未找到匹配的公司</p>
      </div>
    </div>

    <!-- 没有导入数据时显示空状态 -->
    <div v-else class="empty-state-large">
      <div class="empty-icon-large">📊</div>
      <h2>欢迎使用股权穿透图系统</h2>
      <p>请导入 Excel 数据开始使用，或查看示例数据了解功能</p>
      <div class="empty-actions">
        <button @click="goToExcelImport" class="btn-large btn-primary">
          <span class="icon">📥</span>
          <span>导入 Excel 数据</span>
        </button>
        <button @click="goToExamples" class="btn-large btn-secondary">
          <span class="icon">👁️</span>
          <span>查看示例数据</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ImportedDataService } from '@/services/importedDataService.js'

const router = useRouter()
const route = useRoute()
const searchKeyword = ref('')
const importedCompanies = ref([])
const currentPage = ref(1)
const pageSize = ref(50)
const totalCompanies = ref(0)
const loading = ref(false)

onMounted(async () => {
  await loadLatestImportedCompanies()
})

// 加载最新导入的公司列表（优化版：支持分页）
async function loadLatestImportedCompanies() {
  loading.value = true
  try {
    const importList = await ImportedDataService.getImportedList()
    
    if (importList.length === 0) {
      console.log('📭 没有导入数据')
      loading.value = false
      return
    }

    // 获取最新的导入数据
    const latestImport = importList[0]
    const result = await ImportedDataService.getCompaniesFromImport(latestImport.id, {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value
    })
    
    console.log('📦 加载公司列表:', result)
    
    importedCompanies.value = result.companies.map(company => ({
      id: company.clientCode,
      name: company.companyName,
      creditCode: company.creditCode || '',
      clientCode: company.clientCode,
      subsidiaryCount: company.subsidiaryCount || 0,
      shareholderCount: company.shareholderCount || 0
    }))
    
    totalCompanies.value = result.total
    console.log(`✅ 加载了 ${importedCompanies.value.length} 家公司，共 ${totalCompanies.value} 家`)
  } catch (error) {
    console.error('加载公司列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到示例数据页面
function goToExamples() {
  router.push({ name: 'ExampleCompanies' })
}

// 跳转到 Excel 导入页面
function goToExcelImport() {
  router.push({ name: 'ExcelImport' })
}

// 跳转到导入历史页面
function goToImportHistory() {
  router.push({ name: 'ImportHistory' })
}

// 搜索过滤（优化版：直接显示当前页数据）
const filteredCompanies = computed(() => {
  return importedCompanies.value
})

const handleSearch = async () => {
  currentPage.value = 1
  await loadLatestImportedCompanies()
}

// 加载更多
async function loadMore() {
  if (importedCompanies.value.length >= totalCompanies.value) {
    return
  }
  currentPage.value++
  await loadLatestImportedCompanies()
}

const viewCompany = (company) => {
  router.push({
    name: 'EquityChartView',
    query: {
      companyName: company.name,
      companyCode: company.clientCode,
      creditCode: company.creditCode
    }
  })
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.header {
  text-align: center;
  color: white;
  margin-bottom: 50px;
}

.header h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 30px 0;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

.btn-excel-import {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: white;
  color: #667eea;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-excel-import:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  background: #f8f9ff;
}

.btn-excel-import .icon {
  font-size: 20px;
}

.btn-import-history {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.9);
  color: #764ba2;
  border: 2px solid white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-import-history:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  background: white;
}

.btn-import-history .icon {
  font-size: 20px;
}

/* 数据源指示器 */
.data-source-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.indicator-icon {
  font-size: 24px;
}

.indicator-text {
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.btn-switch {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-switch:hover {
  background: #5568d3;
  transform: translateY(-1px);
}

/* 空状态 - 大尺寸 */
.empty-state-large {
  max-width: 600px;
  margin: 80px auto;
  text-align: center;
  color: white;
  padding: 60px 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.empty-icon-large {
  font-size: 120px;
  margin-bottom: 30px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.empty-state-large h2 {
  font-size: 32px;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.empty-state-large p {
  font-size: 18px;
  opacity: 0.9;
  margin: 0 0 40px 0;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-large {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-large.btn-primary {
  background: white;
  color: #667eea;
}

.btn-large.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  background: #f8f9ff;
}

.btn-large.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
}

.btn-large.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.btn-large .icon {
  font-size: 24px;
}

.company-list {
  max-width: 1200px;
  margin: 0 auto;
}

.search-box {
  position: relative;
  margin-bottom: 30px;
}

.search-box input {
  width: 100%;
  padding: 16px 50px 16px 20px;
  font-size: 16px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  outline: none;
  transition: all 0.3s;
}

.search-box input:focus {
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  pointer-events: none;
}

.company-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.company-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.company-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.company-icon {
  font-size: 48px;
  text-align: center;
}

.company-info {
  flex: 1;
}

.company-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-code {
  font-size: 13px;
  color: #999;
  margin: 0 0 12px 0;
  font-family: 'Courier New', monospace;
}

.company-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 13px;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #667eea;
  font-weight: 600;
}

.view-btn {
  text-align: right;
  color: #667eea;
  font-weight: 600;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 18px;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 32px;
  }
  
  .company-grid {
    grid-template-columns: 1fr;
  }
}
</style>
