import * as d3 from 'd3'
import { MARKER_CONFIG } from './constants'

/**
 * 连接线渲染逻辑
 */
export function useLinks(gLinks, config) {
  /**
   * 绘制直角连接线（从节点边缘开始）
   */
  const drawLink = ({ source, target }) => {
    // 计算起点和终点，考虑节点高度
    const sourceY = source.y + (config.rectHeight / 2) + 5  // 从节点底部开始，留5px间隙
    const targetY = target.y - (config.rectHeight / 2) - 5  // 到节点顶部，留5px间隙
    
    const halfDistance = (targetY - sourceY) / 2
    const halfY = sourceY + halfDistance
    
    return `M${source.x},${sourceY} L${source.x},${halfY} ${target.x},${halfY} ${target.x},${targetY}`
  }

  /**
   * 绘制向上的连接线（从节点边缘开始）
   */
  const drawUpwardLink = ({ source, target }) => {
    // 向上的连接线，方向相反
    const sourceY = source.y - (config.rectHeight / 2) - 5  // 从节点顶部开始
    const targetY = target.y + (config.rectHeight / 2) + 5  // 到节点底部
    
    const halfDistance = (targetY - sourceY) / 2
    const halfY = sourceY + halfDistance
    
    return `M${source.x},${sourceY} L${source.x},${halfY} ${target.x},${halfY} ${target.x},${targetY}`
  }

  /**
   * 更新向下的连接线
   */
  const updateDownwardLinks = (links, source, transition) => {
    const link = gLinks
      .selectAll('path.linkOfDownItem')
      .data(links, d => d.target.data.id + d.target.data.unique)

    // Enter
    const linkEnter = link
      .enter()
      .append('path')
      .attr('class', 'linkOfDownItem')
      .attr('d', () => {
        const o = {
          source: { x: source.x0, y: source.y0 },
          target: { x: source.x0, y: source.y0 }
        }
        return drawLink(o)
      })
      .attr('fill', 'none')
      .attr('stroke', '#9DA8BA')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#${MARKER_CONFIG.down.id})`)
      .style('opacity', 0)

    // Update
    link.merge(linkEnter)
      .transition(transition)
      .attr('d', drawLink)
      .style('opacity', 1)

    // Exit
    link.exit()
      .transition(transition)
      .attr('d', () => {
        const o = {
          source: { x: source.x, y: source.y },
          target: { x: source.x, y: source.y }
        }
        return drawLink(o)
      })
      .style('opacity', 0)
      .remove()
  }

  /**
   * 更新向上的连接线
   */
  const updateUpwardLinks = (links, source, transition) => {
    const link = gLinks
      .selectAll('path.linkOfUpItem')
      .data(links, d => d.target.data.id + d.target.data.xh)

    // Enter
    const linkEnter = link
      .enter()
      .append('path')
      .attr('class', 'linkOfUpItem')
      .attr('d', () => {
        const o = {
          source: { x: source.x0, y: source.y0 },
          target: { x: source.x0, y: source.y0 }
        }
        return drawUpwardLink(o)
      })
      .attr('fill', 'none')
      .attr('stroke', '#9DA8BA')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#${MARKER_CONFIG.up.id})`)
      .style('opacity', 0)

    // Update
    link.merge(linkEnter)
      .transition(transition)
      .attr('d', drawUpwardLink)
      .style('opacity', 1)

    // Exit
    link.exit()
      .transition(transition)
      .attr('d', () => {
        const o = {
          source: { x: source.x, y: source.y },
          target: { x: source.x, y: source.y }
        }
        return drawUpwardLink(o)
      })
      .style('opacity', 0)
      .remove()
  }

  return {
    drawLink,
    updateDownwardLinks,
    updateUpwardLinks
  }
}
