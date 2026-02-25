import * as d3 from 'd3'
import { MARKER_CONFIG } from './constants'

/**
 * 连接线渲染逻辑
 */
export function useLinks(gLinks, config) {
  /**
   * 绘制直角连接线
   */
  const drawLink = ({ source, target }) => {
    const halfDistance = (target.y - source.y) / 2
    const halfY = source.y + halfDistance
    return `M${source.x},${source.y} L${source.x},${halfY} ${target.x},${halfY} ${target.x},${target.y}`
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
        return drawLink(o)
      })
      .attr('fill', 'none')
      .attr('stroke', '#9DA8BA')
      .attr('stroke-width', 2)
      .attr('marker-end', `url(#${MARKER_CONFIG.up.id})`)
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

  return {
    drawLink,
    updateDownwardLinks,
    updateUpwardLinks
  }
}
