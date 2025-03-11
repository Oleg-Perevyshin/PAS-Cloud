<!-- $lib/components/UI/ColorPicker.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    id: string
    label?: string
    value: number[]
    className?: string
    onUpdate?: (value: number[]) => void
  }

  let { id = '', label = '', value = $bindable([0, 0, 0]), className = '', onUpdate = () => {} }: Props = $props()

  let rgb = $state(value || [0, 0, 0])
  let originalRgb = $state( [value[0], value[1], value[2]] )
  let colorPalette: string[] = $state([])
  let colorStripStyle = $state('')
  let isDragging = false
  let brightness = $state(1)
  let cursorPosition = $state(0)

  onMount(() => {
    generateColorPalette()
    setCursorPosition()
  })

  const generateColorPalette = () => {
    colorPalette = []
    /* Генерация оттенком серого */
    for (let i = 0; i <= 100; i++) {
      const r = Math.round((255 * i) / 100)
      const g = Math.round((255 * i) / 100)
      const b = Math.round((255 * i) / 100)
      colorPalette.push(`rgb(${r}, ${g}, ${b})`)
    }

    /* Генерация основных цветов со смешиванием */
    // for (let h = 0; h < 360; h++) {
    //   for (let l = 0.4; l <= 1; l += 0.1) {
    //     const color = hslToRgb(h / 360, 1, l);
    //     colorPalette.push(`rgb(${color.r}, ${color.g}, ${color.b})`);
    //   }
    // }

    for (let i = 0; i < 360; i++) {
      const color = hslToRgb(i / 360, 1, 0.5)
      colorPalette.push(`rgb(${color.r}, ${color.g}, ${color.b})`)
    }

    colorStripStyle = `background: linear-gradient(to right, ${colorPalette.join(', ')});`
  }

  const setCursorPosition = () => {
    const colorString = `rgb(${originalRgb[0]}, ${originalRgb[1]}, ${originalRgb[2]})`
    const index = colorPalette.findIndex(color => color === colorString)
    cursorPosition = index !== -1 ? index : 0
  }

  const hslToRgb = (h: number, s: number, l: number) => {
    let r: number, g: number, b: number

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  const updateColor = (index: number) => {
    const match = colorPalette[index].match(/\d+/g)
    if (match) {
      const [r, g, b] = match.map(Number);
      originalRgb = [
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b)),
      ]
      rgb = applyBrightness(originalRgb, brightness)
      cursorPosition = index
      onUpdate(rgb)
    }
  }

  const applyBrightness = (color: number[], brightnessFactor: number) => {
    return color.map(channel => Math.round(channel * brightnessFactor));
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (isDragging) {
      event.preventDefault()
      const target = event.target as HTMLElement
      const rect = target.getBoundingClientRect()
      const x = event.clientX - rect.left
      const index = Math.floor((x / rect.width) * colorPalette.length)
      updateColor(index)
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    isDragging = true
    handleMouseMove(event)
  }

  const handleMouseUp = () => {
    isDragging = false
  }

  const handleSliderChange = (event: Event) => {
    brightness = parseFloat((event.target as HTMLInputElement).value)
    rgb = applyBrightness(originalRgb, brightness)
    onUpdate(rgb)
  }
</script>

<!-- Разметка компонента -->
<div {id} class={`relative inline-block border-0 px-4 ${className}`}>
  <div class={`flex flex-col items-center`}>
    {#if label}
      <p class="block font-semibold">{label}</p>
    {/if}
    <div class="flex w-full flex-col">
      <!-- Область предпросмотра цвета -->
      <div
        class="h-10 rounded-2xl border-1 border-gray-400"
        style="background: rgba({originalRgb[0]}, {originalRgb[1]}, {originalRgb[2]}, {brightness});"
      ></div>
      <!-- Палитра -->
      <div
        class="relative mt-4 h-6 w-full cursor-pointer"
        style={colorStripStyle}
        role="slider"
        aria-valuemin="0"
        aria-valuemax="360"
        aria-valuenow={rgb[0]}
        tabindex="0"
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseUp}
      >
        <!-- Треугольник под палитрой -->
        <div
          class="absolute cursor-none"
          style="left: {(cursorPosition / colorPalette.length) * 100}%;
                transform: translateX(-50%);
                bottom: -10px;
                width: 0;
                height: 0;
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-bottom: 10px solid;"
        ></div>
      </div>

      <!-- Регулировка яркости -->
      <input type="range" class="slider mt-4" min="0" max="1" step="0.01" bind:value={brightness} oninput={handleSliderChange} />

      <!-- Информация -->
      <div>HEX (RGB): {`#${[rgb[0], rgb[1], rgb[2]].map(value => (value !== undefined ? value : 0).toString(16).toUpperCase().padStart(2, '0')).join('')}`}</div>
      <div class="">Brightness: {(brightness * 100).toFixed(0)}%</div>
    </div>
  </div>
</div>
