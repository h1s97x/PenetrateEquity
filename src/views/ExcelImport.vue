<template>
  <div class="excel-import-page">
    <div class="container">
      <!-- 返回首页按钮 -->
      <button @click="goHome" class="btn-back">
        ← 返回首页
      </button>
      
      <h1>Excel 数据导入</h1>
      
      <!-- 步骤指示 -->
      <div class="steps">
        <div class="step" :class="{ active: currentStep === 1 }">
          <div class="step-number">1</div>
          <div class="step-title">下载模板</div>
        </div>
        <div class="step" :class="{ active: currentStep === 2 }">
          <div class="step-number">2</div>
          <div class="step-title">填写数据</div>
        </div>
        <div class="step" :class="{ active: currentStep === 3 }">
          <div class="step-number">3</div>
          <div class="step-title">上传文件</div>
        </div>
        <div class="step" :class="{ active: currentStep === 4 }">
          <div class="step-number">4</div>
          <div class="step-title">查看图表</div>
        </div>
      </div>

      <!-- 步骤 1: 下载模板 -->
      <div v-if="currentStep === 1" class="step-content">
        <h2>步骤 1: 下载 Excel 模板</h2>
        <p>点击下方按钮下载 Excel 模板，模板中包含示例数据和字段说明。</p>
        
        <button @click="downloadTemplate" class="btn btn-primary">
          <span>📥</span> 下载模板
        </button>

        <div class="field-description">
          <h3>字段说明</h3>
          <table>
            <thead>
              <tr>
                <th>字段名</th>
                <th>说明</th>
                <th>示例</th>
                <th>必填</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>公司名称</td>
                <td>公司或被投资公司名称</td>
                <td>京海控股集团</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>客户编号</td>
                <td>公司的唯一标识</td>
                <td>C001</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>统一社会信用代码</td>
                <td>企业信用代码</td>
                <td>91110000xxx</td>
                <td>❌</td>
              </tr>
              <tr>
                <td>股东名称</td>
                <td>股东名称</td>
                <td>张三 / 李四投资</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>股东客户编号</td>
                <td>股东的客户编号</td>
                <td>S001 / C002</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>股东类型</td>
                <td>个人或企业</td>
                <td>个人 / 企业</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>持股比例</td>
                <td>持股百分比（数值格式）</td>
                <td>1 或 60 或 100</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>投资金额</td>
                <td>投资金额（元）</td>
                <td>60000000</td>
                <td>✅</td>
              </tr>
              <tr>
                <td>股东出资排名</td>
                <td>股东排序（数字越小越靠前）</td>
                <td>1, 2, 3...</td>
                <td>❌</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button @click="currentStep = 3" class="btn btn-secondary">
          下一步：上传文件
        </button>
      </div>

      <!-- 步骤 3: 上传文件 -->
      <div v-if="currentStep === 3" class="step-content">
        <h2>步骤 3: 上传 Excel 文件</h2>
        
        <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleDrop" @dragover.prevent>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".xlsx,.xls" 
            @change="handleFileSelect"
            style="display: none"
          />
          
          <div v-if="!selectedFile" class="upload-placeholder">
            <span class="upload-icon">📁</span>
            <p>点击或拖拽 Excel 文件到此处</p>
            <p class="upload-hint">支持 .xlsx 和 .xls 格式，文件大小不超过 10MB</p>
          </div>

          <div v-else class="file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button @click.stop="removeFile" class="btn-remove">✕</button>
          </div>
        </div>

        <!-- 预览数据 -->
        <div v-if="previewData" class="preview-section">
          <h3>数据预览</h3>
          <p>工作表: {{ previewData.sheetName }} | 总行数: {{ previewData.totalRows }}</p>
          
          <div class="preview-table-wrapper">
            <table class="preview-table">
              <thead>
                <tr>
                  <th v-for="col in previewData.columns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData.previewData" :key="index">
                  <td v-for="col in previewData.columns" :key="col">{{ row[col] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="preview-hint">仅显示前 5 行数据</p>
        </div>

        <div v-if="error" class="error-message">
          ❌ {{ error }}
        </div>

        <!-- 导入进度条 -->
        <div v-if="importProgress.show" class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: importProgress.percent + '%' }"></div>
          </div>
          <p class="progress-message">{{ importProgress.message }}</p>
        </div>

        <div class="button-group">
          <button @click="currentStep = 1" class="btn btn-secondary">
            上一步
          </button>
          <button 
            @click="importData" 
            :disabled="!selectedFile || loading"
            class="btn btn-primary"
          >
            <span v-if="loading">⏳ 导入中...</span>
            <span v-else>✅ 导入数据</span>
          </button>
        </div>
      </div>

      <!-- 步骤 4: 查看结果 -->
      <div v-if="currentStep === 4" class="step-content">
        <h2>✅ 导入成功！</h2>
        
        <div class="success-info">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">{{ importResult?.stats?.totalRecords || 0 }}</div>
              <div class="stat-label">总记录数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ importResult?.stats?.uniqueCompanies || 0 }}</div>
              <div class="stat-label">公司数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ importResult?.stats?.uniqueShareholders || 0 }}</div>
              <div class="stat-label">股东数量</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ importResult?.stats?.personShareholders || 0 }}</div>
              <div class="stat-label">个人股东</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ importResult?.stats?.corporateShareholders || 0 }}</div>
              <div class="stat-label">企业股东</div>
            </div>
          </div>

          <div class="company-info">
            <h3>导入信息</h3>
            <p><strong>导入名称:</strong> {{ importResult?.data?.retInfo?.main?.name || '批量导入' }}</p>
            <p><strong>公司数量:</strong> {{ importResult?.allCompanies?.length || 0 }} 家</p>
            <p><strong>数据ID:</strong> {{ importResult?.dataId || '-' }}</p>
          </div>
        </div>

        <div class="button-group">
          <button @click="resetImport" class="btn btn-secondary">
            重新导入
          </button>
          <button @click="viewAllCompanies" class="btn btn-primary">
            查看所有公司 ({{ importResult?.allCompanies?.length || 0 }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { ExcelImporter } from '@/lib/utils/excelImporter.js'
import { ImportedDataService } from '@/services/importedDataService.js'
import { ApiDataAdapter } from '@/data/adapters/apiDataAdapter.js'

const router = useRouter()

const currentStep = ref(1)
const selectedFile = ref(null)
const previewData = ref(null)
const loading = ref(false)
const error = ref('')
const importResult = ref(null)
const fileInput = ref(null)
const importProgress = ref({
  show: false,
  stage: '',
  percent: 0,
  message: ''
})

// 下载模板
function downloadTemplate() {
  ExcelImporter.downloadTemplate()
  currentStep.value = 3
}

// 返回首页
function goHome() {
  router.push({ name: 'Home' })
}

// 触发文件选择
function triggerFileInput() {
  fileInput.value?.click()
}

// 处理文件选择
async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    await processFile(file)
  }
}

// 处理拖拽上传
async function handleDrop(event) {
  const file = event.dataTransfer.files[0]
  if (file) {
    await processFile(file)
  }
}

// 处理文件
async function processFile(file) {
  error.value = ''
  
  // 验证文件
  const validation = await ExcelImporter.validateExcelFile(file)
  if (!validation.valid) {
    error.value = validation.error
    return
  }

  selectedFile.value = file

  // 预览数据
  try {
    previewData.value = await ExcelImporter.previewExcelData(file, 5)
  } catch (err) {
    error.value = `文件读取失败: ${err.message}`
    selectedFile.value = null
  }
}

// 移除文件
function removeFile() {
  selectedFile.value = null
  previewData.value = null
  error.value = ''
}

// 导入数据（优化版：支持大文件和进度显示）
async function importData() {
  if (!selectedFile.value) {
    error.value = '请先选择文件'
    return
  }

  loading.value = true
  error.value = ''
  importProgress.value.show = true

  try {
    // 使用优化后的 readExcelFile，支持进度回调
    const result = await ExcelImporter.readExcelFile(selectedFile.value, {
      onProgress: (progress) => {
        importProgress.value = {
          show: true,
          ...progress
        }
      }
    })

    if (!result.success) {
      throw new Error('导入失败')
    }

    // 保存到 IndexedDB
    importProgress.value.message = '正在保存数据...'
    const dataId = await ImportedDataService.saveImportedData(null, {
      rawData: result.rawData,
      allCompanies: result.allCompanies,
      stats: result.stats,
      companyName: `批量导入 (${result.allCompanies.length} 家公司)`,
      companyCode: 'BATCH_IMPORT',
      source: 'excel'
    })

    importResult.value = {
      dataId: dataId,
      stats: result.stats,
      allCompanies: result.allCompanies,
      data: { retInfo: { main: { 
        name: `批量导入 (${result.allCompanies.length} 家公司)`,
        companyCode: 'BATCH_IMPORT',
        companyCreditCode: ''
      }}}
    }

    currentStep.value = 4
    importProgress.value.show = false
  } catch (err) {
    error.value = `导入失败: ${err.message}`
    importProgress.value.show = false
  } finally {
    loading.value = false
  }
}

// 查看所有公司
function viewAllCompanies() {
  // 跳转到首页，显示导入的所有公司
  router.push({
    name: 'Home',
    query: {
      dataId: importResult.value.dataId
    }
  })
}

// 重置导入
function resetImport() {
  currentStep.value = 1
  selectedFile.value = null
  previewData.value = null
  error.value = ''
  importResult.value = null
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>

<style scoped>
.excel-import-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
}

.btn-back {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
}

.btn-back:hover {
  background: #667eea;
  color: white;
  transform: translateX(-4px);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 40px;
  font-size: 32px;
}

/* 步骤指示器 */
.steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 10%;
  right: 10%;
  height: 2px;
  background: #e0e0e0;
  z-index: 0;
}

.step {
  flex: 1;
  text-align: center;
  position: relative;
  z-index: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-weight: bold;
  transition: all 0.3s;
}

.step.active .step-number {
  background: #667eea;
  color: white;
  transform: scale(1.1);
}

.step-title {
  font-size: 14px;
  color: #666;
}

.step.active .step-title {
  color: #667eea;
  font-weight: bold;
}

/* 步骤内容 */
.step-content {
  margin-top: 40px;
}

.step-content h2 {
  color: #333;
  margin-bottom: 20px;
}

.step-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

/* 按钮 */
.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.button-group {
  display: flex;
  gap: 16px;
  margin-top: 30px;
}

/* 字段说明表格 */
.field-description {
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.field-description h3 {
  margin-bottom: 16px;
  color: #333;
}

.field-description table {
  width: 100%;
  border-collapse: collapse;
}

.field-description th,
.field-description td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.field-description th {
  background: #667eea;
  color: white;
  font-weight: bold;
}

.field-description tr:hover {
  background: #f0f0f0;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #667eea;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin: 20px 0;
}

.upload-area:hover {
  border-color: #5568d3;
  background: #f8f9ff;
}

.upload-placeholder {
  color: #666;
}

.upload-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.upload-hint {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.file-icon {
  font-size: 48px;
}

.file-details {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.file-size {
  font-size: 14px;
  color: #999;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #ff4444;
  color: white;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
}

.btn-remove:hover {
  background: #cc0000;
  transform: scale(1.1);
}

/* 预览表格 */
.preview-section {
  margin: 30px 0;
}

.preview-section h3 {
  margin-bottom: 12px;
  color: #333;
}

.preview-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin: 16px 0;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.preview-table th,
.preview-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
  white-space: nowrap;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: bold;
  color: #333;
}

.preview-hint {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

/* 错误消息 */
.error-message {
  padding: 16px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  margin: 20px 0;
}

/* 进度条 */
.progress-section {
  margin: 20px 0;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.progress-message {
  font-size: 14px;
  color: #666;
  text-align: center;
}

/* 成功信息 */
.success-info {
  margin: 30px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.company-info {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.company-info h3 {
  margin-bottom: 16px;
  color: #333;
}

.company-info p {
  margin: 8px 0;
  color: #666;
}
</style>
