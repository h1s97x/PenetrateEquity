import { createRouter, createWebHistory } from 'vue-router'
import EquityChartOld from '../index.vue'
import EquityChartNew from '../components/EquityChart/index.vue'
import Comparison from '../views/Comparison.vue'
import PerformanceTest from '../views/PerformanceTest.vue'
import V2DataTest from '../views/V2DataTest.vue'

const routes = [
  {
    path: '/',
    name: 'Comparison',
    component: Comparison
  },
  {
    path: '/new',
    name: 'EquityChartNew',
    component: EquityChartNew
  },
  {
    path: '/old',
    name: 'EquityChartOld',
    component: EquityChartOld
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
