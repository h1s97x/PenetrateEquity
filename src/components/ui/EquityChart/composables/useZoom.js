import * as d3 from 'd3'

/**
 * 缩放和拖拽功能
 */
export function useZoom(svg, gAll, onZoomChange) {
  const zoomBehavior = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      gAll.attr('transform', event.transform)
      
      // 触发缩放变化回调
      if (onZoomChange) {
        onZoomChange(event.transform)
      }
    })

  // 应用缩放行为
  svg.call(zoomBehavior)
    .on('dblclick.zoom', null) // 禁用双击缩放

  /**
   * 平移到指定节点
   */
  const translateTo = (x, y, duration = 500) => {
    svg.transition()
      .duration(duration)
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(-x, -y)
      )
  }

  /**
   * 缩放到指定比例
   */
  const scaleTo = (scale, duration = 500) => {
    svg.transition()
      .duration(duration)
      .call(
        zoomBehavior.scaleTo,
        scale
      )
  }

  /**
   * 重置视图
   */
  const reset = () => {
    svg.transition()
      .duration(500)
      .call(
        zoomBehavior.transform,
        d3.zoomIdentity
      )
  }

  return {
    zoomBehavior,
    translateTo,
    scaleTo,
    reset
  }
}
