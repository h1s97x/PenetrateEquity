import * as d3 from 'd3'
import { NODE_COLORS, CHART_CONFIG } from './constants'

/**
 * 节点渲染逻辑
 */
export function useNodes(gNodes, config, onNodeClick, onToggleNode) {
  let nodeId = 0
  let tooltip = null

  /**
   * 创建悬浮提示框
   */
  const createTooltip = () => {
    if (!tooltip) {
      tooltip = d3.select('body')
        .append('div')
        .attr('class', 'equity-chart-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '8px')
        .style('padding', '12px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '10000')
        .style('max-width', '300px')
        .style('font-size', '14px')
        .style('pointer-events', 'none')
    }
    return tooltip
  }

  /**
   * 显示悬浮提示
   */
  const showTooltip = (event, d) => {
    const tip = createTooltip()
    
    let html = `
      <div style="margin-bottom: 8px; font-weight: bold; color: #333; font-size: 15px;">
        ${d.data.name}
      </div>
    `
    
    if (d.depth !== 0 && d.data.ratio) {
      html += `
        <div style="margin-bottom: 4px; color: #666;">
          <span style="color: #999;">持股比例：</span>
          <span style="color: #6f90fb; font-weight: 500;">${d.data.ratio}</span>
        </div>
      `
    }
    
    if (d.data.amount && d.data.amount !== '0') {
      html += `
        <div style="margin-bottom: 4px; color: #666;">
          <span style="color: #999;">金额：</span>
          <span>${d.data.amount} 万元</span>
        </div>
      `
    }
    
    html += `
      <div style="margin-bottom: 4px; color: #666;">
        <span style="color: #999;">类型：</span>
        <span>${d.data.type === 1 ? '个人' : '企业'}</span>
      </div>
    `
    
    if (d.data.companyCreditCode) {
      html += `
        <div style="color: #666; font-size: 12px;">
          <span style="color: #999;">信用代码：</span>
          <span>${d.data.companyCreditCode}</span>
        </div>
      `
    }
    
    tip.html(html)
      .style('visibility', 'visible')
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 10) + 'px')
  }

  /**
   * 隐藏悬浮提示
   */
  const hideTooltip = () => {
    if (tooltip) {
      tooltip.style('visibility', 'hidden')
    }
  }

  /**
   * 渲染向下的节点（子公司）
   */
  const renderDownwardNodes = (nodes, source, transition) => {
    const node = gNodes
      .selectAll('g.nodeOfDownItemGroup')
      .data(nodes, d => d.data.id + (d.data.unique || ''))

    // Enter
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'nodeOfDownItemGroup')
      .attr('transform', () => `translate(${source.x0},${source.y0})`)
      .attr('fill-opacity', 0)
      .style('opacity', 0)
      .style('cursor', d => d.depth === 0 ? 'default' : 'pointer')
      .on('click', (event, d) => {
        if (d.depth !== 0) {
          onNodeClick?.(event, d)
        }
      })
      .on('mouseenter', (event, d) => {
        showTooltip(event, d)
      })
      .on('mousemove', (event) => {
        if (tooltip) {
          tooltip
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
        }
      })
      .on('mouseleave', () => {
        hideTooltip()
      })

    // 绘制节点矩形
    renderNodeRect(nodeEnter, 'downward')
    
    // 绘制节点文本
    renderNodeText(nodeEnter, 'downward')
    
    // 绘制持股比例
    renderPercentBar(nodeEnter, 'downward')
    
    // 绘制展开按钮
    renderExpandButton(nodeEnter, 'downward', onToggleNode)

    // Update
    node.merge(nodeEnter)
      .transition(transition)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill-opacity', 1)
      .style('opacity', 1)

    // Exit
    node.exit()
      .transition(transition)
      .attr('transform', () => `translate(${source.x},${source.y})`)
      .attr('fill-opacity', 0)
      .style('opacity', 0)
      .remove()

    return node
  }

  /**
   * 渲染向上的节点（股东）
   */
  const renderUpwardNodes = (nodes, source, transition) => {
    const node = gNodes
      .selectAll('g.nodeOfUpItemGroup')
      .data(nodes, d => d.data.id + (d.data.xh || ''))

    // Enter
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'nodeOfUpItemGroup')
      .attr('transform', () => `translate(${source.x0},${source.y0})`)
      .attr('fill-opacity', 0)
      .style('opacity', 0)
      .style('cursor', 'pointer')
      .style('display', d => d.depth === 0 ? 'none' : null)
      .on('click', (event, d) => {
        onNodeClick?.(event, d)
      })
      .on('mouseenter', (event, d) => {
        showTooltip(event, d)
      })
      .on('mousemove', (event) => {
        if (tooltip) {
          tooltip
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY - 10) + 'px')
        }
      })
      .on('mouseleave', () => {
        hideTooltip()
      })

    // 绘制节点矩形
    renderNodeRect(nodeEnter, 'upward')
    
    // 绘制节点文本
    renderNodeText(nodeEnter, 'upward')
    
    // 绘制持股比例
    renderPercentBar(nodeEnter, 'upward')
    
    // 绘制展开按钮
    renderExpandButton(nodeEnter, 'upward', onToggleNode)

    // Update
    node.merge(nodeEnter)
      .transition(transition)
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .attr('fill-opacity', 1)
      .style('opacity', 1)

    // Exit
    node.exit()
      .transition(transition)
      .attr('transform', () => `translate(${source.x},${source.y})`)
      .attr('fill-opacity', 0)
      .style('opacity', 0)
      .remove()

    return node
  }

  /**
   * 绘制节点矩形
   */
  function renderNodeRect(nodeEnter, direction) {
    const colors = direction === 'downward' ? NODE_COLORS.downward : NODE_COLORS.upward

    nodeEnter
      .append('rect')
      .attr('width', d => {
        if (d.depth === 0) {
          return (d.data.name.length + 4) * 16
        }
        return config.rectWidth
      })
      .attr('height', d => {
        if (d.depth === 0) {
          return config.rootRectHeight
        }
        return config.rectHeight
      })
      .attr('x', d => {
        if (d.depth === 0) {
          return (-(d.data.name.length + 4) * 16) / 2
        }
        return -config.rectWidth / 2
      })
      .attr('y', d => {
        if (d.depth === 0) {
          return -config.rootRectHeight / 2
        }
        return -config.rectHeight / 2
      })
      .attr('rx', 8)
      .attr('fill', d => {
        if (d.depth === 0) {
          return NODE_COLORS.root.rectColor
        }
        return colors.rectColor
      })
      .attr('stroke', d => {
        if (d.depth === 0) {
          return NODE_COLORS.root.borderColor
        }
        return 'none'
      })
      .attr('stroke-width', d => d.depth === 0 ? 2 : 0)
  }

  /**
   * 绘制节点文本
   */
  function renderNodeText(nodeEnter, direction) {
    const colors = direction === 'downward' ? NODE_COLORS.downward : NODE_COLORS.upward
    const yOffset = direction === 'downward' ? 0 : 5

    nodeEnter
      .append('foreignObject')
      .attr('width', d => {
        if (d.depth === 0) {
          return (d.data.name.length + 4) * 16
        }
        return config.rectWidth
      })
      .attr('height', d => {
        if (d.depth === 0) {
          return config.rootRectHeight
        }
        return config.rectHeight
      })
      .attr('x', d => {
        if (d.depth === 0) {
          return (-(d.data.name.length + 4) * 16) / 2
        }
        return -config.rectWidth / 2
      })
      .attr('y', d => {
        if (d.depth === 0) {
          return -config.rootRectHeight / 2
        }
        return -config.rectHeight / 2 + yOffset
      })
      .append('xhtml:div')
      .attr('class', 'node-text')
      .style('font-size', d => d.depth === 0 ? '17px' : '15px')
      .style('color', d => {
        if (d.depth === 0) {
          return NODE_COLORS.root.textColor
        }
        return colors.textColor
      })
      .style('line-height', d => {
        if (d.depth === 0) {
          return `${config.rootRectHeight}px`
        }
        return '2'
      })
      .style('text-align', d => d.depth === 0 ? 'center' : 'left')
      .style('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
      .style('padding', '0 5px 0 12px')
      .style('overflow', 'hidden')
      .style('white-space', 'nowrap')
      .style('text-overflow', 'ellipsis')
      .attr('title', d => d.data.name)
      .text(d => d.data.name)
  }

  /**
   * 绘制持股比例条
   */
  function renderPercentBar(nodeEnter, direction) {
    const colors = direction === 'downward' ? NODE_COLORS.downward : NODE_COLORS.upward
    const yOffset = direction === 'downward' ? 15 : 18

    const percentG = nodeEnter
      .append('g')
      .attr('class', 'percent-group')
      .attr('transform', `translate(0, ${yOffset})`)
      .style('display', d => d.depth === 0 ? 'none' : null)

    // 标签和百分比值放在同一行，避免重叠
    percentG
      .append('text')
      .attr('fill', colors.textColor)
      .attr('x', -config.rectWidth / 2 + 12)
      .style('font-size', '11px')
      .text('持股')

    // 百分比值
    percentG
      .append('text')
      .attr('fill', colors.textColor)
      .attr('text-anchor', 'end')
      .attr('x', config.rectWidth / 2 - 12)
      .style('font-size', '12px')
      .style('font-weight', '500')
      .text(d => d.depth !== 0 && d.data.ratio ? d.data.ratio : '')

    const barWidth = config.rectWidth - 24

    // 背景条
    percentG
      .append('rect')
      .attr('class', 'percent-bar-bg')
      .attr('fill', 'rgba(0,0,0,0.1)')
      .attr('x', -config.rectWidth / 2 + 12)
      .attr('y', 8)
      .attr('width', barWidth)
      .attr('height', 5)
      .attr('rx', 2.5)

    // 进度条
    percentG
      .append('rect')
      .attr('class', 'percent-bar-fill')
      .attr('fill', colors.percentBarColor)
      .attr('x', -config.rectWidth / 2 + 12)
      .attr('y', 8)
      .attr('width', d => {
        if (d.data.ratio) {
          const percent = parseFloat(d.data.ratio.replace('%', ''))
          return barWidth * (percent / 100)
        }
        return 0
      })
      .attr('height', 5)
      .attr('rx', 2.5)
  }

  /**
   * 绘制展开/折叠按钮
   */
  function renderExpandButton(nodeEnter, direction, onToggleNode) {
    const yOffset = direction === 'downward' 
      ? config.rectHeight / 2 
      : -(config.rectHeight / 2 + 5)

    const btnG = nodeEnter
      .append('g')
      .attr('class', 'expand-btn')
      .attr('transform', `translate(0, ${yOffset})`)
      .style('display', d => {
        if (d.depth === 0 || (!d._children && !d.children)) {
          return 'none'
        }
        return null
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onToggleNode?.(event, d)
      })

    // 圆形背景
    btnG
      .append('circle')
      .attr('r', 12)
      .attr('fill', '#EAF3FF')
      .attr('stroke', '#9EA9BB')
      .attr('stroke-width', 1)

    // +/- 符号
    btnG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#9EA9BB')
      .attr('y', direction === 'downward' ? 10 : 11)
      .style('font-size', '30px')
      .style('font-family', '黑体')
      .text(d => d.children ? '-' : '+')
  }

  return {
    renderDownwardNodes,
    renderUpwardNodes
  }
}
