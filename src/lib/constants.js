// 图表配置常量
export const CHART_CONFIG = {
  // 节点间距
  dx: 200,
  dy: 150,
  
  // 节点尺寸
  rectWidth: 160,
  rectHeight: 95,
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
    refX: 5,
    refY: 0,
    orient: 'auto',
    color: '#9DA8BA'
  },
  up: {
    id: 'markerUp',
    refX: 5,
    refY: 0,
    orient: 'auto',
    color: '#9DA8BA'
  }
}
// 搜索功能配置
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  FUZZY_THRESHOLD: 0.6,
  MAX_RESULTS: 20,
  HIGHLIGHT_COLOR: '#ff6b6b',
  HIGHLIGHT_DURATION: 300
}

// 路径高亮配置
export const PATH_HIGHLIGHT_CONFIG = {
  PATH_COLOR: '#4dabf7',
  PATH_WIDTH: 3,
  DIMMED_OPACITY: 0.2,
  ANIMATION_DURATION: 300
}

// 图片导出配置
export const EXPORT_CONFIG = {
  BACKGROUND_COLOR: '#ffffff',
  SCALE: 2,
  QUALITY: 0.95,
  FORMAT: 'png'
}

// 全屏模式配置
export const FULLSCREEN_CONFIG = {
  EXIT_BUTTON_POSITION: 'top-right',
  SHOW_EXIT_BUTTON: true
}

// 缩略图导航配置
export const MINIMAP_CONFIG = {
  WIDTH: 200,
  HEIGHT: 150,
  POSITION: 'bottom-right',
  BACKGROUND_COLOR: '#f8f9fa',
  VIEWPORT_COLOR: '#4dabf7',
  SIMPLIFY_THRESHOLD: 1000
}
