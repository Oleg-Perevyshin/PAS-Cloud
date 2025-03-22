<!-- $lib/components/UI/ProgressBar.svelte -->
<script lang="ts">
  interface Props {
    id: string
    label?: string
    value?: boolean | string | number | number[] | object | null
    props?: {
      min?: number
      max?: number
      units?: string
    }
    className?: string
  }

  let {
    id = '',
    label = '',
    value = $bindable(0),
    props = {
      min: 0,
      max: 100,
      units: '%',
    },
    className = '',
  }: Props = $props()

  let numericValue = $state(0)
  const min = props.min ?? 0
  const max = props.max ?? 100

  if (typeof value === 'number' && !isNaN(value)) {
    numericValue = Math.max(min, Math.min(max, value))
  } else if (typeof value === 'string') {
    const parsedValue = parseFloat(value)
    if (!isNaN(parsedValue)) {
      numericValue = Math.max(min, Math.min(max, parsedValue))
    }
  } else {
    numericValue = min
  }
</script>

<div {id} class={`relative inline-block w-full border-0 px-2 ${className}`}>
  {#if label}
    <p class="mx-4 block font-semibold">{label}</p>
  {/if}
  <div class="flex flex-col items-center">
    <div class="relative h-4 w-full rounded bg-gray-200">
      <div class="absolute top-0 left-0 h-full rounded bg-blue-500" style="width: {value}%;"></div>
    </div>
    <span class="ml-2 font-semibold">{numericValue}{props.units}</span>
  </div>
</div>
