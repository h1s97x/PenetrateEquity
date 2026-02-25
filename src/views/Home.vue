<template>
  <div class="home-container">
    <div class="header">
      <h1>股权穿透图可视化系统</h1>
      <p class="subtitle">企业股权结构分析工具</p>
    </div>

    <div class="company-list">
      <div class="search-box">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索公司名称或信用代码..."
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
            <p class="company-code">{{ company.creditCode }}</p>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')

// 模拟公司数据
const companies = ref([
  {
    id: 1,
    name: '京海控股集团有限公司',
    creditCode: '91310000123456789X',
    subsidiaryCount: 8,
    shareholderCount: 3
  },
  {
    id: 2,
    name: '阿里巴巴集团控股有限公司',
    creditCode: '91330000MA27XYZ123',
    subsidiaryCount: 156,
    shareholderCount: 12
  },
  {
    id: 3,
    name: '腾讯控股有限公司',
    creditCode: '91440300MA5ABC1234',
    subsidiaryCount: 234,
    shareholderCount: 8
  },
  {
    id: 4,
    name: '字节跳动科技有限公司',
    creditCode: '91110108MA01DEF567',
    subsidiaryCount: 89,
    shareholderCount: 15
  },
  {
    id: 5,
    name: '华为技术有限公司',
    creditCode: '91440300618520018E',
    subsidiaryCount: 178,
    shareholderCount: 2
  },
  {
    id: 6,
    name: '小米科技有限责任公司',
    creditCode: '91110108551385082Q',
    subsidiaryCount: 67,
    shareholderCount: 9
  },
  {
    id: 7,
    name: '美团科技有限公司',
    creditCode: '91110108MA00GHI890',
    subsidiaryCount: 45,
    shareholderCount: 11
  },
  {
    id: 8,
    name: '京东集团股份有限公司',
    creditCode: '91110000633674814D',
    subsidiaryCount: 123,
    shareholderCount: 7
  },
  {
    id: 9,
    name: '百度在线网络技术有限公司',
    creditCode: '91110000802100433B',
    subsidiaryCount: 98,
    shareholderCount: 6
  },
  {
    id: 10,
    name: '网易（杭州）网络有限公司',
    creditCode: '91330000MA27JKL456',
    subsidiaryCount: 54,
    shareholderCount: 5
  }
])

// 搜索过滤
const filteredCompanies = computed(() => {
  if (!searchKeyword.value) {
    return companies.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return companies.value.filter(company => 
    company.name.toLowerCase().includes(keyword) ||
    company.creditCode.toLowerCase().includes(keyword)
  )
})

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const viewCompany = (company) => {
  router.push({
    name: 'EquityChart',
    query: {
      companyName: company.name,
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
  margin: 0;
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
