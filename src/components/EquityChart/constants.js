// 图表配置常量
export const CHART_CONFIG = {
  // 节点间距
  dx: 130,
  dy: 90,
  
  // 节点尺寸
  rectWidth: 120,
  rectHeight: 80,
  rootRectHeight: 45,
  
  // 动画配置
  duration: 500,
  
  // 连接线长度
  linkLength: 90
}

// 节点颜色方案
export const NODE_COLORS = {
  root: {
    rectColor: '#FFF9F1',
    textColor: '#AD4903',
    borderColor: '#EBD1BB'
  },
  downward: {
    rectColor: '#6f90fb',
    textColor: '#ffffff',
    percentBarColor: '#95C3FF'
  },
  upward: {
    rectColor: '#feba07',
    textColor: '#000000',
    percentBarColor: '#fff9f1'
  }
}

// 箭头配置
export const MARKER_CONFIG = {
  down: {
    id: 'markerDown',
    refX: 38,
    refY: 0,
    orient: '90',
    color: '#9DA8BA'
  },
  up: {
    id: 'markerUp',
    refX: -32,
    refY: 0,
    orient: '90',
    color: '#9DA8BA'
  }
}
