<!-- $lib/components/UI/RadioGroup.svelte -->
<script lang="ts">
  import type { IOptionUI } from '../../../stores/Interfaces'

  interface Props {
    id?: string
    label?: string
    value?: string | number | boolean | null
    options?: IOptionUI[]
    className?: string
    props?: {
      disabled?: boolean
    }
    onChange?: (value: IOptionUI) => void
  }

  let {
    id = '',
    label = '',
    value = null,
    options = [],
    className = '',
    props = {
      disabled: false,
    },
    onChange = () => {},
  }: Props = $props()

  const updateValue = (item: IOptionUI) => {
    if (onChange) {
      onChange(item)
    }
  }

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    disabled: false,
    ...props,
  }
</script>

<div {id} class={`relative inline-block w-full border-0 px-4 ${className}`}>
  {#if label}
    <p class="mx-4 block font-semibold">{label}</p>
  {/if}
  <div class="flex flex-row items-center">
    {#each options as item, index}
      <button
        type="button"
        class={`flex-1 cursor-pointer border border-gray-400 bg-blue-300 px-2 py-1 text-center transition duration-300
          select-none hover:opacity-75 hover:shadow-lg
          ${item.id === value ? 'opacity-100' : 'opacity-50'}
          ${index === 0 ? 'rounded-l-full' : ''}
          ${index === options.length - 1 ? 'rounded-r-full' : ''}
          ${item.color}
        `}
        onclick={() => updateValue(item)}
        disabled={props.disabled}
      >
        {item.name}
      </button>
    {/each}
  </div>
</div>
