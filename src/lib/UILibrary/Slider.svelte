<script lang="ts">
  import type { Colors } from './Interface'

  interface SliderProps {
    id?: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors | null
    }
    validation?: {
      value?: number | [number, number]
      min?: number
      max?: number
      step?: number
      disabled?: boolean
    }
    style?: {
      inlineStyle?: string
      thumbColor?: Colors
      sliderColor?: Colors
      orientation?: 'vertical' | 'horizontal'
      showStepButtons?: boolean
    }
    onUpdate?: (value: number | [number, number]) => void
  }

  const defaultLabel = {
    text: '',
    align: 'center' as const,
    color: null,
  }

  const defaultValidation = {
    value: 0,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  }

  const defaultStyle = {
    inlineStyle: '',
    thumbColor: 'blue' as Colors,
    sliderColor: 'primary' as Colors,
    orientation: 'horizontal' as const,
    showStepButtons: false,
  }

  let { id = '', label = defaultLabel, validation = defaultValidation, style = defaultStyle, onUpdate = () => {} }: SliderProps = $props()

  // Объединяем с дефолтными значениями
  label = { ...defaultLabel, ...label }
  validation = { ...defaultValidation, ...validation }
  style = { ...defaultStyle, ...style }

  // Реактивные состояния
  const isRange = $derived(Array.isArray(validation.value) && validation.value.length === 2)
  const min = $derived(validation.min ?? 0)
  const max = $derived(validation.max ?? 100)
  const step = $derived(validation.step ?? 1)

  let singleValue = $state(typeof validation.value === 'number' ? validation.value : 50)
  let lowerValue = $derived(isRange ? (validation.value as [number, number])[0] : 25)
  let upperValue = $derived(isRange ? (validation.value as [number, number])[1] : 75)

  // Позиции для range слайдера
  const lowerPosition = $derived(((lowerValue - min) / (max - min)) * 100)
  const upperPosition = $derived(((upperValue - min) / (max - min)) * 100)

  // Обновление значений
  const updateSingleValue = (e: Event) => {
    singleValue = Number((e.target as HTMLInputElement).value)
    validation = { ...validation, value: singleValue }
    onUpdate(singleValue)
  }

  const updateLowerValue = (e: Event) => {
    const newValue = Math.min(Number((e.target as HTMLInputElement).value), upperValue)
    lowerValue = newValue
    validation = { ...validation, value: [lowerValue, upperValue] }
    onUpdate([lowerValue, upperValue])
  }

  const updateUpperValue = (e: Event) => {
    const newValue = Math.max(Number((e.target as HTMLInputElement).value), lowerValue)
    upperValue = newValue
    validation = { ...validation, value: [lowerValue, upperValue] }
    onUpdate([lowerValue, upperValue])
  }

  const adjustValue = (target: 'lower' | 'upper' | 'single', direction: 'increment' | 'decrement') => {
    const stepValue = direction === 'increment' ? step : -step

    if (isRange && target !== 'single') {
      if (target === 'lower') {
        lowerValue = Math.max(min, Math.min(lowerValue + stepValue, upperValue))
      } else {
        upperValue = Math.min(max, Math.max(upperValue + stepValue, lowerValue))
      }
      validation = { ...validation, value: [lowerValue, upperValue] }
      onUpdate([lowerValue, upperValue])
    } else {
      singleValue = Math.max(min, Math.min(singleValue + stepValue, max))
      validation = { ...validation, value: singleValue }
      onUpdate(singleValue)
    }
  }

  // Синхронизация с внешними изменениями
  $effect(() => {
    if (Array.isArray(validation.value)) {
      lowerValue = validation.value[0]
      upperValue = validation.value[1]
    } else if (typeof validation.value === 'number') {
      singleValue = validation.value
    }
  })
</script>

<div
  class="wrapper {style.orientation}"
  style={`--slider-color: var(--${style.sliderColor}-color); --thumb-color: var(--${style.thumbColor}-color); --thumb-hover-color: color-mix(in srgb, var(--${style.thumbColor}-color) 25%, transparent); --thumb-active-color: color-mix(in srgb, var(--${style.thumbColor}-color) 40%, transparent)`}
>
  {#if label?.text}
    <label for={id} class="label" style="text-align: {label.align}; color: var(--{label.color ?? 'font'}-color);">
      {label.text}
    </label>
  {/if}

  <div class="content-container {style.orientation}">
    <div class="slider-container {style.orientation}" {id} style={style.inlineStyle}>
      {#if isRange}
        <div class="slider-track {style.orientation}">
          <div
            class="slider-range {style.orientation}"
            style={style.orientation === 'horizontal'
              ? `left: ${lowerPosition}%; right: ${100 - upperPosition}%`
              : `top: ${100 - upperPosition}%; bottom: ${lowerPosition}%`}
          ></div>
        </div>
        <input
          type="range"
          {min}
          {max}
          {step}
          bind:value={lowerValue}
          oninput={updateLowerValue}
          disabled={validation.disabled}
          class="slider-thumb lower {style.orientation}"
        />
        <input
          type="range"
          {min}
          {max}
          {step}
          bind:value={upperValue}
          oninput={updateUpperValue}
          disabled={validation.disabled}
          class="slider-thumb upper {style.orientation}"
        />
      {:else}
        <div class="slider-track single {style.orientation}">
          <div
            class="slider-range single {style.orientation}"
            style={style.orientation === 'horizontal'
              ? `width: ${((singleValue - min) / (max - min)) * 100}%`
              : `height: ${((singleValue - min) / (max - min)) * 100}%`}
          ></div>
        </div>
        <input
          type="range"
          {min}
          {max}
          {step}
          bind:value={singleValue}
          oninput={updateSingleValue}
          disabled={validation.disabled}
          class="slider-thumb single {style.orientation}"
        />
      {/if}
    </div>

    <div class="values {style.orientation}" style={style.inlineStyle}>
      {#if isRange}
        <div class="value {style.orientation}">
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('lower', 'decrement')} disabled={validation.disabled || lowerValue <= min}>-</button>
          {/if}
          {lowerValue}
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('lower', 'increment')} disabled={validation.disabled || lowerValue >= upperValue}>+</button>
          {/if}
        </div>
        <div class="value {style.orientation}">
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('upper', 'decrement')} disabled={validation.disabled || upperValue <= lowerValue}>-</button>
          {/if}
          {upperValue}
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('upper', 'increment')} disabled={validation.disabled || upperValue >= max}>+</button>
          {/if}
        </div>
      {:else}
        <div class="value {style.orientation}">
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('single', 'decrement')} disabled={validation.disabled || singleValue <= min}>-</button>
          {/if}
          {singleValue}
          {#if style.showStepButtons}
            <button class="change" onclick={() => adjustValue('single', 'increment')} disabled={validation.disabled || singleValue >= max}>+</button>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0.25rem;
  }

  .wrapper.vertical {
    display: flex;
    flex-direction: column;
  }

  .content-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .content-container.vertical {
    flex-direction: row;
    align-items: center;
  }

  .label {
    margin: 0 0 0.5rem 0;
    display: block;
  }

  .slider-container {
    position: relative;
    height: 0.5rem;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  .slider-container.vertical {
    width: 0.5rem;
    height: 10rem;
  }

  .slider-track {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--slider-color);
    border-radius: 0.25rem;
  }

  .slider-track.vertical {
    width: 100%;
    height: 100%;
  }

  .slider-track.single {
    background-color: color-mix(in srgb, var(--slider-color) 50%, transparent);
    display: flex;
    flex-direction: column;
    justify-content: end;
  }

  .slider-range {
    position: absolute;
    background-color: var(--thumb-color);
    border-radius: 0.25rem;
  }

  .slider-range.horizontal {
    height: 100%;
    left: 0;
  }

  .slider-range.vertical {
    width: 100%;
  }

  .slider-range.single {
    background-color: var(--slider-color);
  }

  .slider-thumb {
    position: absolute;
    width: 100%;
    height: 100%;
    margin: 0;
    appearance: none;
    background: transparent;
    pointer-events: none;
    z-index: 2;
  }

  .slider-thumb.lower {
    z-index: 3;
  }

  .slider-thumb.horizontal {
    top: 50%;
    transform: translateY(-50%);
  }

  .slider-thumb.vertical {
    width: 0.25rem;
    height: 100%;
    left: 50%;
    transform: translateX(-50%);
    writing-mode: vertical-lr;
    direction: rtl;
    appearance: none;
  }

  .slider-thumb::-webkit-slider-thumb {
    pointer-events: auto;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--thumb-color);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .slider-thumb::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 0.5rem var(--thumb-hover-color);
  }

  .slider-thumb::-webkit-slider-thumb:active {
    transform: scale(1.1);
    box-shadow: 0 0 0 0.75rem var(--thumb-active-color);
  }

  .slider-thumb::-moz-range-thumb {
    pointer-events: auto;
    appearance: none;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--thumb-color);
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
  }

  .slider-thumb::-moz-range-thumb:hover {
    box-shadow: 0 0 0 0.5rem var(--thumb-hover-color);
  }

  .slider-thumb::-moz-range-thumb:active {
    transform: scale(1.1);
    box-shadow: 0 0 0 0.75rem var(--thumb-active-color);
  }

  .values {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .values.vertical {
    flex-direction: column-reverse;
    height: 100%;
    padding-top: 0;
    width: auto;
    margin-top: 0;
  }

  .value {
    background-color: var(--thumb-color);
    color: white;
    width: fit-content;
    border-radius: 1rem;
    padding: 0.5rem;
  }

  .value.horizontal {
    margin-top: 0.5rem;
  }

  .value.vertical {
    margin-left: 1rem;
    display: flex;
    flex-direction: column-reverse;
  }

  .change {
    background-color: transparent;
    color: white;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    height: max-content;
    &:hover {
      transform: scale(1.4);
    }
  }
</style>
