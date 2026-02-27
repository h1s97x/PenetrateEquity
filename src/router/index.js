import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import EquityChartView from '../views/EquityChartView.vue'
import Comparison from '../views/Comparison.vue'
import PerformanceTest from '../views/PerformanceTest.vue'
import V2DataTest from '../views/V2DataTest.vue'
import ExcelImport from '../views/ExcelImport.vue'
import ImportHistory from '../views/ImportHistory.vue'
import ExampleCompanies from '../views/ExampleCompanies.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/chart',
    name: 'EquityChartView',
    component: EquityChartView
  },
  {
    path: '/excel-import',
    name: 'ExcelImport',
    component: ExcelImport
  },
  {
    path: '/import-history',
    name: 'ImportHistory',
    component: ImportHistory
  },
  {
    path: '/examples',
    name: 'ExampleCompanies',
    component: ExampleCompanies
  },
  {
    path: '/comparison',
    name: 'Comparison',
    component: Comparison
  },
  {
    path: '/performance',
    name: 'PerformanceTest',
    component: PerformanceTest
  },
  {
    path: '/v2-test',
    name: 'V2DataTest',
    component: V2DataTest
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router
