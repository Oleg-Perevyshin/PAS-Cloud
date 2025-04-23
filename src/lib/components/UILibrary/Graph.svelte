<script lang="ts">
  import { onMount } from 'svelte'

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

      // Vertical grid lines
      for (let x = xMin; x <= xMax; x += (xMax - xMin) / 5) {
        const screenX = margin + (x - xMin) * xScale
        ctx.beginPath()
        ctx.moveTo(screenX, margin)
        ctx.lineTo(screenX, height - margin)
        ctx.stroke()
      }

      // Horizontal grid lines
      for (let y = yMin; y <= yMax; y += (yMax - yMin) / 5) {
        const screenY = height - margin - (y - yMin) * yScale
        ctx.beginPath()
        ctx.moveTo(margin, screenY)
        ctx.lineTo(width - margin, screenY)
        ctx.stroke()
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
      ctx.fillText(xLabel, width / 2, height - 10)

      ctx.save()
      ctx.translate(20, height / 2)
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
        ctx.arc(x, y, 4, 0, Math.PI * 2)
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
  }
</script>

<div class="graph-container">
  <canvas bind:this={canvas} {width} {height} class="graph-canvas"></canvas>
</div>

<style>
  .graph-container {
    display: inline-block;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem;
    background: white;
  }

  .graph-canvas {
    display: block;
  }
</style>
