<template>
  <div class="import-history-page">
    <div class="container">
      <div class="header">
        <h1>导入历史</h1>
        <div class="header-actions">
          <button @click="goBack" class="btn btn-secondary">
            ← 返回首页
          </button>
          <button @click="clearAll" class="btn btn-danger" v-if="importList.length > 0">
            清空所有
          </button>
        </div>
      </div>

      <!-- 存储信息 -->
      <div class="storage-info" v-if="storageInfo">
        <div class="info-item">
          <span class="label">已保存:</span>
          <span class="value">{{ storageInfo.count }} 条记录</span>
        </div>
        <div class="info-item">
          <span class="label">占用空间:</span>
          <span class="value">{{ storageInfo.totalSizeMB }} MB</span>
        </div>
      </div>

      <!-- 导入列表 -->
      <div v-if="importList.length > 0" class="import-list">
        <div 
          v-for="item in importList" 
          :key="item.id"
          class="import-card"
          @click="viewImportedData(item)"
        >
          <div class="card-icon">📊</div>
          <div class="card-content">
            <h3 class="company-name">{{ item.companyName }}</h3>
            <div class="card-details">
              <p class="detail-item">
                <span class="detail-label">客户编号:</span>
                <span class="detail-value">{{ item.companyCode || '-' }}</span>
              </p>
              <p class="detail-item">
                <span class="detail-label">信用代码:</span>
                <span class="detail-value">{{ item.creditCode || '-' }}</span>
              </p>
              <p class="detail-item">
                <span class="detail-label">导入时间:</span>
                <span class="detail-value">{{ item.importDate }}</span>
              </p>
              <p class="detail-item" v-if="item.stats">
                <span class="detail-label">数据量:</span>
                <span class="detail-value">
                  {{ item.stats.totalRecords }} 条记录 | 
                  {{ item.stats.uniqueCompanies }} 家公司 | 
                  {{ item.stats.uniqueShareholders }} 个股东
                </span>
              </p>
            </div>
          </div>
          <div class="card-actions">
            <button @click.stop="exportData(item)" class="btn-action" title="导出">
              💾
            </button>
            <button @click.stop="deleteData(item)" class="btn-action btn-delete" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无导入历史</p>
        <button @click="goToImport" class="btn btn-primary">
          导入 Excel 数据
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ImportedDataService } from '@/services/importedDataService.js'

const router = useRouter()
const importList = ref([])
const storageInfo = ref(null)

onMounted(() => {
  loadImportList()
  loadStorageInfo()
})

// 加载导入列表
function loadImportList() {
  importList.value = ImportedDataService.getImportedList()
}

// 加载存储信息
function loadStorageInfo() {
  storageInfo.value = ImportedDataService.getStorageInfo()
}

// 查看导入的数据
function viewImportedData(item) {
  router.push({
    name: 'EquityChartView',
    query: {
      source: 'excel',
      dataId: item.id,
      companyCode: item.companyCode
    }
  })
}

// 导出数据
function exportData(item) {
  try {
    ImportedDataService.exportToJson(item.id)
  } catch (error) {
    alert(`导出失败: ${error.message}`)
  }
}

// 删除数据
function deleteData(item) {
  if (confirm(`确定要删除 "${item.companyName}" 的导入数据吗？`)) {
    ImportedDataService.deleteImportedData(item.id)
    loadImportList()
    loadStorageInfo()
  }
}

// 清空所有
function clearAll() {
  if (confirm('确定要清空所有导入历史吗？此操作不可恢复！')) {
    ImportedDataService.clearAllImportedData()
    loadImportList()
    loadStorageInfo()
  }
}

// 返回首页
function goBack() {
  router.push({ name: 'Home' })
}

// 跳转到导入页面
function goToImport() {
  router.push({ name: 'ExcelImport' })
}
</script>

<style scoped>
.import-history-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: white;
  font-size: 32px;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: white;
  color: #667eea;
}

.btn-secondary:hover {
  background: #f0f0f0;
}

.btn-danger {
  background: #ff4444;
  color: white;
}

.btn-danger:hover {
  background: #cc0000;
}

.btn-primary {
  background: #667eea;
  color: white;
  margin-top: 20px;
}

.btn-primary:hover {
  background: #5568d3;
}

/* 存储信息 */
.storage-info {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  gap: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-item .label {
  color: #666;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

/* 导入列表 */
.import-list {
  display: grid;
  gap: 20px;
}

.import-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.import-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.company-name {
  color: #333;
  font-size: 20px;
  margin: 0 0 12px 0;
}

.card-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 8px;
}

.detail-item {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.detail-label {
  font-weight: bold;
  margin-right: 8px;
}

.detail-value {
  color: #333;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.3s;
}

.btn-action:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.btn-delete:hover {
  background: #ffebee;
}

/* 空状态 */
.empty-state {
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #666;
  font-size: 18px;
  margin: 0;
}
</style>
