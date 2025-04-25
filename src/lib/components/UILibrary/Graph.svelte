<script lang="ts">
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  export interface Point {
    x: number
    y: number
  }

  export interface GraphProps {
    data: Point[]
    width?: number
    height?: number
    margin?: number
    color?: string
    lineWidth?: number
    showAxes?: boolean
    showGrid?: boolean
    showPoints?: boolean
    xLabel?: string
    yLabel?: string
    label?: string
    scaleX?: number
    scaleY?: number
  }

  let {
    data = [],
    width = 500,
    height = 300,
    margin = 40,
    color = '#3b82f6',
    lineWidth = 2,
    showAxes = true,
    showGrid = true,
    showPoints = true,
    xLabel = 'X',
    yLabel = 'Y',
    label = '',
    scaleX = 10,
    scaleY = 1,
  }: GraphProps = $props()

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D

  // Вычисляемые свойства
  const xValues = $derived(data.map((p) => p.x))
  const yValues = $derived(data.map((p) => p.y))
  const xMin = $derived(Math.min(...xValues))
  const xMax = $derived(Math.max(...xValues))
  const yMin = $derived(Math.min(...yValues))
  const yMax = $derived(Math.max(...yValues))

  onMount(() => {
    ctx = canvas.getContext('2d')!
    drawGraph()
  })

  // Эффект для перерисовки при изменении данных или параметров
  $effect(() => {
    if (ctx) {
      drawGraph()
    }
  })

  let tooltip = $state({
    show: false,
    x: 0,
    y: 0,
    content: '',
    pointX: 0,
    pointY: 0,
  })

  function handleMouseMove(event: MouseEvent) {
    if (!data.length) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Проверяем попадание в точки
    const pointRadius = 8 // Радиус области вокруг точки
    const graphWidth = width - 2 * margin
    const graphHeight = height - 2 * margin
    const xScale = graphWidth / (xMax - xMin || 1)
    const yScale = graphHeight / (yMax - yMin || 1)

    let found = false

    data.forEach((point) => {
      const x = margin + (point.x - xMin) * xScale
      const y = height - margin - (point.y - yMin) * yScale

      if (Math.abs(mouseX - x) < pointRadius && Math.abs(mouseY - y) < pointRadius) {
        tooltip = {
          show: true,
          x: mouseX,
          y: mouseY,
          content: `X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}`,
          pointX: x,
          pointY: y,
        }
        found = true
        drawGraph()
      }
    })
    if (!found && tooltip.show) {
      tooltip.show = false
      drawGraph()
    }
  }

  function handleMouseLeave() {
    tooltip.show = false
    drawGraph()
  }

  function drawGraph() {
    if (!data.length) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Calculate scales
    const graphWidth = width - 2 * margin
    const graphHeight = height - 2 * margin
    const xScale = graphWidth / (xMax - xMin || 1)
    const yScale = graphHeight / (yMax - yMin || 1)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'

      // Vertical grid lines and X-axis labels
      for (let x = xMin; x <= xMax; x += scaleX) {
        const screenX = margin + (x - xMin) * xScale
        ctx.beginPath()
        ctx.moveTo(screenX, margin)
        ctx.lineTo(screenX, height - margin)
        ctx.stroke()
        ctx.fillText(x.toFixed(1), screenX, height - margin + 15)
      }

      // Horizontal grid lines and Y-axis labels
      ctx.textAlign = 'right'
      for (let y = yMin; y <= yMax; y += scaleY) {
        const screenY = height - margin - (y - yMin) * yScale
        ctx.beginPath()
        ctx.moveTo(margin, screenY)
        ctx.lineTo(width - margin, screenY)
        ctx.stroke()
        ctx.fillText(y.toFixed(1), margin - 10, screenY + 3)
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = 2

      // X axis
      ctx.beginPath()
      ctx.moveTo(margin, height - margin)
      ctx.lineTo(width - margin, height - margin)
      ctx.stroke()

      // Y axis
      ctx.beginPath()
      ctx.moveTo(margin, margin)
      ctx.lineTo(margin, height - margin)
      ctx.stroke()

      // Axes labels
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(xLabel, width / 2, height - 5)

      ctx.save()
      ctx.translate(10, height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = 'center'
      ctx.fillText(yLabel, 0, 0)
      ctx.restore()
    }

    // Draw graph line
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()

    data.forEach((point, i) => {
      const x = margin + (point.x - xMin) * xScale
      const y = height - margin - (point.y - yMin) * yScale

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw points
    if (showPoints) {
      ctx.fillStyle = color

      data.forEach((point) => {
        const x = margin + (point.x - xMin) * xScale
        const y = height - margin - (point.y - yMin) * yScale

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw title
    if (label) {
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(label, width / 2, 20)
    }

    if (tooltip.show) {
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(tooltip.pointX, tooltip.pointY, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }
</script>

<div class="graph-container">
  <canvas bind:this={canvas} {width} {height} class="graph-canvas" onmousemove={handleMouseMove} onmouseleave={handleMouseLeave}></canvas>
  {#if tooltip.show}
    <div class="tooltip" style="left: {tooltip.x + 10}px; top: {tooltip.y + 100}px;" transition:fade={{ duration: 200 }}>
      {tooltip.content}
    </div>
  {/if}
</div>

<style>
  .graph-container {
    display: inline-block;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.5rem;
    background: white;
  }

  .graph-canvas {
    display: block;
  }

  .tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    z-index: 100;
    transform: translate(0, -100%);
    max-width: 200px;
  }
</style>
