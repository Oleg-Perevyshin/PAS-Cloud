<!-- $lib/components/UI/ColorPicker.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { t } from '$lib/locales/i18n';

  interface Props {
    id?: string;
    label?: string;
    value?: { r: number; g: number; b: number } | null;
    className?: string;
    currentLang?: string;
    onUpdate?: (value: { r: number; g: number; b: number }) => void;
  }

  let {
    id = '',
    label = '',
    value = $bindable({ r: 0, g: 0, b: 0 }),
    className = '',
    currentLang = 'ru',
    onUpdate = () => {},
  }: Props = $props();

  let rgb = $state(value);
  let colorPalette = $state([]);
  let colorStripStyle = $state('');
  let isDragging = false;
  let brightness = $state(100); // Яркость от 0 до 100

  onMount(() => {
    generateColorPalette();
  });

  const generateColorPalette = () => {
    colorPalette = []; // Сброс палитры
    for (let i = 0; i <= 100; i++) {
      const r = Math.round((255 * i) / 100);
      const g = Math.round((255 * i) / 100);
      const b = Math.round((255 * i) / 100);
      colorPalette.push(`rgb(${r}, ${g}, ${b})`);
    }

    for (let i = 0; i < 360; i++) {
      const hue = i;
      const color = hslToRgb(hue / 360, 1, 0.5);
      colorPalette.push(`rgb(${color.r}, ${color.g}, ${color.b})`);
    }

    colorStripStyle = `background: linear-gradient(to right, ${colorPalette.join(', ')});`;
  };

  const hslToRgb = (h, s, l) => {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  };

  const updateColor = (index) => {
    const [r, g, b] = colorPalette[index].match(/\d+/g);
    rgb = { r: Math.max(0, Math.min(255, +r)), g: Math.max(0, Math.min(255, +g)), b: Math.max(0, Math.min(255, +b)) };
    applyBrightness(); // Применяем яркость
    onUpdate(rgb); // Обновляем значение родительскому компоненту
  };

  const applyBrightness = () => {
    const brightnessFactor = brightness / 100; // Приводим к диапазону от 0 до 1
    rgb = {
      r: Math.round(rgb.r * brightnessFactor),
      g: Math.round(rgb.g * brightnessFactor),
      b: Math.round(rgb.b * brightnessFactor)
    };
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const index = Math.floor((x / rect.width) * colorPalette.length);
      updateColor(index);
    }
  };

  const handleMouseDown = (event) => {
    isDragging = true;
    handleMouseMove(event);
  };

  const handleMouseUp = () => {
    isDragging = false;
  };
</script>

<!-- Разметка компонента -->
<div {id} class={`relative inline-block px-6 py-4 rounded-2xl border-1 border-gray-400 ${className}`}>
  <div class={`flex flex-col items-center`}>
    {#if label}
      <p class="mx-4 block font-semibold">{label}</p>
    {/if}
    <div class="flex flex-row w-full">
      <div class="flex flex-col w-2/3">
        <div class="mb-2 h-full flex-1" style="background: rgb({rgb.r}, {rgb.g}, {rgb.b});"></div>
        <div
          class="h-8 w-full cursor-pointer"
          style={colorStripStyle}
          role="slider"
          aria-valuemin="0"
          aria-valuemax="361"
          aria-valuenow={rgb.r}
          tabindex="0"
          onmousedown={handleMouseDown}
          onmousemove={handleMouseMove}
          onmouseup={handleMouseUp}
          onmouseleave={handleMouseUp}
        ></div>
        <input
          type="range"
          class="slider mt-4"
          min="0"
          max="100"
          step="1"
          bind:value={brightness}
          oninput={() => {
            applyBrightness()
            onUpdate(rgb)
          }}
        />
      </div>
      <div class="ml-8 p-2 flex flex-col w-1/3 items-start rounded-2xl border-1 border-gray-400">
        <div>{t('common.red', currentLang)}: {rgb.r}</div>
        <div>{t('common.green', currentLang)}: {rgb.g}</div>
        <div>{t('common.blue', currentLang)}: {rgb.b}</div>
        <div>{t('common.brightness', currentLang)}: {brightness}%</div>
      </div>
    </div>
  </div>
</div>