<script lang="ts">
  import { onMount } from 'svelte'

  interface Props {
    id?: string
    label?: string
    value?: boolean | string | number | number[] | object | null
    styleCSS?: string
    onUpdate?: (value: number[]) => void
  }

  let { id = '', label = '', value = $bindable([0, 0, 0]), styleCSS = '', onUpdate = () => {} }: Props = $props()

  let rgb = $state(Array.isArray(value) ? value : [0, 0, 0])
  let colorPalette: string[] = $state([])
  let colorStripStyle = $state('')
  let isDragging = false
  let pointerPosition = $state({ x: 0, y: 0 })

  onMount(() => {
    generateColorPalette()
    setPointerPositionFromRGB(rgb)
  })

  const generateColorPalette = () => {
    colorPalette = []
    for (let h = 0; h < 360; h++) {
      const color = hslToRgb(h / 360, 1, 0.5)
      colorPalette.push(`rgb(${color.r}, ${color.g}, ${color.b})`)
    }
    colorStripStyle = `background: linear-gradient(to right, ${colorPalette.join(', ')});`
  }

  const hslToRgb = (h: number, s: number, l: number) => {
    if (s === 0) {
      const rgbValue = Math.round(l * 255)
      return { r: rgbValue, g: rgbValue, b: rgbValue }
    }

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    }
  }

  const updateColor = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    let x = event.clientX - rect.left
    let y = event.clientY - rect.top

    x = Math.max(0, Math.min(x, rect.width))
    y = Math.max(0, Math.min(y, rect.height))

    const colorIndex = Math.floor((x / rect.width) * 360)
    const brightnessFactor = 1 - y / rect.height

    const color = hslToRgb(colorIndex / 360, 1, brightnessFactor)
    rgb = [Math.min(255, Math.max(0, color.r)), Math.min(255, Math.max(0, color.g)), Math.min(255, Math.max(0, color.b))]
    onUpdate(rgb)
    pointerPosition = {
      x: Math.max(0, Math.min((x / rect.width) * 100, 100)),
      y: Math.max(0, Math.min((y / rect.height) * 100, 100)),
    }
  }

  const setPointerPositionFromRGB = (rgb: number[]) => {
    let [r, g, b] = rgb.map((value) => value / 255)
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l: number = (max + min) / 2
    let h: number = 0

    if (max !== min) {
      const d = max - min
      h = (() => {
        switch (max) {
          case r:
            return (g - b) / d + (g < b ? 6 : 0)
          case g:
            return (b - r) / d + 2
          case b:
            return (r - g) / d + 4
          default:
            return 0
        }
      })()
    }

    pointerPosition = {
      x: (Math.round((h / 6) * 360) / 360) * 100,
      y: (1 - l) * 100,
    }
  }
</script>

<!-- Разметка компонента -->
<div class="picker-conteiner" style={styleCSS}>
  <div class="picker-wrapper">
    {#if label}
      <label for={id} class="label">{label}</label>
    {/if}
    <div
      {id}
      class="field"
      onmousedown={(event: MouseEvent) => {
        isDragging = true
        updateColor(event)
      }}
      onmousemove={(event: MouseEvent) => {
        if (isDragging) {
          event.preventDefault()
          updateColor(event)
        }
      }}
      onmouseup={() => (isDragging = false)}
      onmouseleave={() => (isDragging = false)}
      style={colorStripStyle}
      role="slider"
      aria-valuemin="0"
      aria-valuemax="360"
      aria-valuenow={Math.round((rgb[0] / 255) * 360)}
      tabindex="0"
    >
      <!-- Градиент яркости -->
      <!-- <div class="gradient" style="background: linear-gradient(white, black); mix-blend-mode: multiply;"></div> -->
      <div class="gradient" style="background: linear-gradient(white, black); mix-blend-mode: screen;"></div>

      <!-- Область предпросмотра цвета -->
      <div class="color" style="left: {pointerPosition.x}%; top: {pointerPosition.y}%; background: rgba({rgb[0]}, {rgb[1]}, {rgb[2]}, 1);"></div>
    </div>

    <!-- Информация -->
    <p>
      HEX (RGB): {`#${rgb.map((value) => (value !== undefined ? value : 0).toString(16).toUpperCase().padStart(2, '0')).join('')}`}
    </p>
  </div>
</div>

<style>
  .picker-conteiner {
    display: inline-block;
    position: relative;
  }

  .picker-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label {
    display: block;
  }

  .field {
    position: relative;
    height: 10rem;
    width: 16rem;
    cursor: pointer;
    border-radius: 1rem;
    border-color: rgb(156, 163, 175);
  }

  .gradient {
    position: absolute;
    left: 0px;
    top: 0px;
    height: 100%;
    width: 100%;
    border-radius: 1rem;
  }

  .color {
    position: absolute;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
  }
</style>
