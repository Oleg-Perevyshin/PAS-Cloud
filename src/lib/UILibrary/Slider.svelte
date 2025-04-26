<script lang="ts">
  import type { Colors } from './Interface'

  interface Props {
    id?: string
    label?: string
    value?: number | [number, number]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    styleCSS?: string
    thumbColor?: Colors
    sliderColor?: Colors
    orientation?: 'vertical' | 'horizontal'
    showStepButtons?: boolean
    onUpdate?: (value: number | [number, number]) => void
  }

  let {
    id = '',
    label = '',
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    value = 0,
    styleCSS = '',
    thumbColor = 'blue',
    sliderColor = 'primary',
    orientation = 'horizontal',
    showStepButtons = false,
    onUpdate = () => {},
  }: Props = $props()

  const isRange = Array.isArray(value) && value.length === 2

  let singleValue = $state(typeof value === 'number' ? value : 50)
  let lowerValue = $state(isRange ? (value as [number, number])[0] : 25)
  let upperValue = $state(isRange ? (value as [number, number])[1] : 75)

  let lowerPosition = $derived(((lowerValue - min) / (max - min)) * 100)
  let upperPosition = $derived(((upperValue - min) / (max - min)) * 100)

  function updateSingleValue(e: Event) {
    singleValue = Number((e.target as HTMLInputElement).value)
    onUpdate(singleValue)
  }

  function updateLowerValue(e: Event) {
    const newValue = Math.min(Number((e.target as HTMLInputElement).value), upperValue)
    lowerValue = newValue
    onUpdate([lowerValue, upperValue])
  }

  function updateUpperValue(e: Event) {
    const newValue = Math.max(Number((e.target as HTMLInputElement).value), lowerValue)
    upperValue = newValue
    onUpdate([lowerValue, upperValue])
  }

  function adjustValue(target: 'lower' | 'upper' | 'single', direction: 'increment' | 'decrement') {
    const stepValue = direction === 'increment' ? step : -step

    if (isRange && target !== 'single') {
      if (target === 'lower') {
        const newValue = Math.max(min, Math.min(lowerValue + stepValue, upperValue))
        lowerValue = newValue
      } else {
        const newValue = Math.min(max, Math.max(upperValue + stepValue, lowerValue))
        upperValue = newValue
      }
      onUpdate([lowerValue, upperValue])
    } else {
      const newValue = Math.max(min, Math.min(singleValue + stepValue, max))
      singleValue = newValue
      onUpdate(singleValue)
    }
  }
</script>

<div
  {id}
  class="wrapper {orientation}"
  style={`--slider-color: var(--${sliderColor}-color); --thumb-color: var(--${thumbColor}-color); --thumb-hover-color: color-mix(in srgb, var(--${thumbColor}-color) 25%, transparent); --thumb-active-color: color-mix(in srgb, var(--${thumbColor}-color) 40%, transparent)`}
>
  {#if label}
    <p class="label">{label}</p>
  {/if}

  <div class="content-container {orientation}">
    <div class="slider-container {orientation}" style={styleCSS}>
      {#if isRange}
        <div class="slider-track {orientation}">
          <div
            class="slider-range {orientation}"
            style={`
            ${
              orientation === 'horizontal'
                ? `left: ${lowerPosition}%; right: ${100 - upperPosition}%`
                : `top: ${100 - upperPosition}%; bottom: ${lowerPosition}%`
            }`}
          ></div>
        </div>
        <input type="range" {min} {max} {step} {disabled} bind:value={lowerValue} oninput={updateLowerValue} class="slider-thumb lower {orientation}" />
        <input type="range" {min} {max} {step} {disabled} bind:value={upperValue} oninput={updateUpperValue} class="slider-thumb upper {orientation}" />
      {:else}
        <div class="slider-track single {orientation}">
          <div
            class="slider-range single {orientation}"
            style={`
            ${orientation === 'horizontal' ? `width: ${((singleValue - min) / (max - min)) * 100}%` : `height: ${((singleValue - min) / (max - min)) * 100}%`}`}
          ></div>
        </div>
        <input type="range" {min} {max} {step} {disabled} bind:value={singleValue} oninput={updateSingleValue} class="slider-thumb single {orientation}" />
      {/if}
    </div>

    {#if isRange}
      <div class="values {orientation}" style={styleCSS}>
        <div class="value {orientation}">
          {#if showStepButtons}
            <button class="change" onclick={() => adjustValue(isRange ? 'lower' : 'single', 'decrement')} disabled={disabled || lowerValue <= min}>-</button>
          {/if}
          {lowerValue}
          {#if showStepButtons}
            <button class="change" onclick={() => adjustValue(isRange ? 'lower' : 'single', 'increment')} disabled={disabled || lowerValue >= upperValue}
              >+</button
            >
          {/if}
        </div>
        <div class="value {orientation}">
          {#if showStepButtons}
            <button class="change" onclick={() => adjustValue('upper', 'decrement')} disabled={disabled || upperValue <= lowerValue}>-</button>
          {/if}
          {upperValue}
          {#if showStepButtons}
            <button class="change" onclick={() => adjustValue('upper', 'increment')} disabled={disabled || upperValue >= max}>+</button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="value {orientation}">
        {#if showStepButtons}
          <button class="change" onclick={() => adjustValue(isRange ? 'lower' : 'single', 'decrement')} disabled={disabled || singleValue <= min}>-</button>
        {/if}
        {singleValue}
        {#if showStepButtons}
          <button class="change" onclick={() => adjustValue(isRange ? 'lower' : 'single', 'increment')} disabled={disabled || singleValue >= max}>+</button>
        {/if}
      </div>
    {/if}
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
    justify-content: space-between;
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
    transition: all 0.3s ease;
    height: max-content;
    &:hover {
      transform: scale(1.3);
    }
  }
</style>
