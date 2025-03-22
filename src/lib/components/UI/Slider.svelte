<!-- $lib/components/UI/Slider.svelte -->
<script lang="ts">
  interface Props {
    id?: string
    label?: string
    value?: boolean | string | number | number[] | object | null
    props?: {
      min?: number
      max?: number
      step?: number
      disabled?: boolean
    }
    className?: string
    onUpdate?: (value: number) => void
  }

  let {
    id = '',
    label = '',
    props = {
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
    },
    value = null,
    className = '',
    onUpdate = () => {},
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    ...props,
  }

  let numericValue = $state(0)
  if (typeof value === 'number') {
    numericValue = Math.max(props.min!, Math.min(props.max!, value))
  }

  function updateValue(event: Event) {
    numericValue = Number((event.target as HTMLInputElement).value)
    numericValue = Math.max(props.min!, Math.min(props.max!, numericValue))
    onUpdate(numericValue)
  }
</script>

<div {id} class={`relative inline-block w-full border-0 px-4 ${className}`}>
  {#if label}
    <p class="mx-4 block font-semibold">{label}</p>
  {/if}
  <div class="flex flex-col items-center">
    <input
      type="range"
      min={props.min}
      max={props.max}
      step={props.step}
      disabled={props.disabled}
      bind:value={numericValue}
      onchange={updateValue}
      class={`h-1 w-full cursor-pointer appearance-none bg-gray-500 ${props.disabled ? 'cursor-not-allowed opacity-50' : ''} 
        rounded-l-full rounded-r-full focus:ring-0 focus:outline-none`}
    />
    <div class="mt-2 text-lg font-semibold">{value}</div>
  </div>
</div>

<style>
  /* Настройка стилей для ползунка */
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #4a90e2; /* Цвет ползунка */
    border-radius: 50%;
    cursor: pointer;
  }

  input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #4a90e2; /* Цвет ползунка */
    border-radius: 50%;
    cursor: pointer;
  }
</style>
