<!-- $lib/components/UI/Slider.svelte -->
<script lang="ts">
  interface Props {
    id?: string
    label?: string
    props?: {
      min?: number
      max?: number
      step?: number
      disabled?: boolean
    }
    value?: string | number | boolean | null
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

  function updateValue(event: Event) {
    value = Number((event.target as HTMLInputElement).value)
    onUpdate(value)
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
      bind:value
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
