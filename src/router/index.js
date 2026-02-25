import { createRouter, createWebHistory } from 'vue-router'
import EquityChartNew from '../components/EquityChart/index.vue'
import Comparison from '../views/Comparison.vue'
import PerformanceTest from '../views/PerformanceTest.vue'
import V2DataTest from '../views/V2DataTest.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/chart'
  },
  {
    path: '/chart',
    name: 'EquityChart',
    component: EquityChartNew
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
  history: createWebHistory(),
  routes
})

export default router
