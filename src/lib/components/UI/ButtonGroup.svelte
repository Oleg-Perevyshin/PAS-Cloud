<!-- $lib/components/UI/ButtonGroup.svelte -->
<script lang="ts">
  import type { IOptionUI } from '../../../stores/Interfaces'

  interface Props {
    id?: string
    label?: string
    value?: IOptionUI | null
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
    options = [],
    value = { id: '', name: '', value: '', color: '' },
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
  <label for={id} class="mx-4 block font-semibold">{label}</label>
  <div class="flex flex-row items-stretch">
    {#each options as item, index (item.id)}
      <button
        id={item.id}
        value={item.value}
        type="button"
        class={`flex-1 cursor-pointer px-2 py-1 text-center transition duration-300
          select-none hover:shadow-lg
          ${index === 0 ? 'rounded-l-full' : ''}
          ${index === options.length - 1 ? 'rounded-r-full' : ''}
          ${item.color}
          ${String(item.value) === value?.value ? 'font-bold text-white opacity-100' : 'opacity-75'}
        `}
        onclick={() => updateValue(item)}
        disabled={props.disabled}
      >
        {item.name}
      </button>
    {/each}
  </div>
</div>
