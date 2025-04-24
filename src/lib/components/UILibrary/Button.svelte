<script lang="ts">
  import { onMount, type SvelteComponent } from 'svelte'

  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'
  export interface IOption {
    id?: number
    value?: string | number
    name?: string
  }

  interface Props {
    id?: string
    label?: string
    labelAlign?: 'start' | 'center' | 'end'
    text?: string
    buttonCSS?: string
    textCSS?: string
    color?: Colors
    disabled?: boolean
    options?: IOption[] | null
    value?: IOption | null
    optionWidth?: 'auto' | 'max-width'
    icon?: (new (...args: any[]) => SvelteComponent) | null
    iconProps?: Record<string, unknown>
    onClick?: (event: MouseEvent) => void
    onChange?: (value: IOption) => void
  }

  let {
    id = '',
    label = '',
    labelAlign = 'center',
    text = '',
    buttonCSS = '',
    textCSS = '',
    color = 'white',
    disabled = false,
    options = null,
    value = null,
    optionWidth = 'auto',
    icon = null,
    iconProps = {},
    onClick = () => {},
    onChange = () => {},
  }: Props = $props()

  let isActive = $state(false)
  let maxWidth = $state('auto')

  function handleClick(event: MouseEvent) {
    if (!disabled) {
      isActive = !isActive
      onClick(event)
    }
  }

  const updateValue = (item: IOption) => {
    if (onChange) {
      onChange(item)
    }
  }

  onMount(() => {
    if (options && optionWidth === 'max-width') {
      const maxLength = options.reduce((max, option) => {
        return Math.max(max, option.name!.length)
      }, 0)

      maxWidth = `${maxLength * 0.9}rem`
    }
  })
</script>

<div class="button-conteiner">
  {#if label}
    <label for={id} class="label" style="text-align: {labelAlign};">{label}</label>
  {/if}
  {#if options}
    <div class="group">
      {#each options as item, index}
        <button
          value={item.value}
          class={`button button-option ${color}
          ${index === 0 ? 'first' : ''}
          ${index === options.length - 1 ? 'last' : ''}
          ${item.name === value?.name ? 'active' : 'not-active'}
        `}
          onclick={() => updateValue(item)}
          style="width: {maxWidth}; {color == 'white' ? 'border: 1px solid var(--border-color);' : 'color: white; border: none; margin: 0 1px;'}"
          {disabled}
        >
          {item.name}
        </button>
      {/each}
    </div>
  {:else}
    <button
      {id}
      class={`button ${disabled ? 'disabled' : ''} ${color}`}
      style="border-radius: 1rem; min-width: max-content; {color == 'white'
        ? 'border: 1px solid var(--border-color);'
        : 'color: white; border: none;'} {buttonCSS}"
      onclick={handleClick}
      {disabled}
    >
      <span class="button-content">
        {#if icon}
          {@const IconComponent = icon}
          <IconComponent {...iconProps} />
        {/if}
        {#if text}
          <span class="text" style={textCSS}>
            {text}
          </span>
        {/if}
      </span>
    </button>
  {/if}
</div>

<style>
  .button-conteiner {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label {
    margin: 0.25rem 0;
    color: var(--font-color);
  }

  .button {
    padding: 0.25rem 1rem;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
    outline: none;
    color: black;
    transition: box-shadow 0.3s;
    background-color: var(--color);
    height: 2rem;
  }

  .button:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .button-content {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .text {
    flex: 1;
  }

  .group {
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  .button-option {
    flex: 1;
    cursor: pointer;
    text-align: center;
    transition: all 0.3s ease;
    padding: 0.25rem 0.5rem;
    user-select: none;
    background-color: var(--color);

    &:hover {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    }
  }

  .first {
    border-radius: 1rem 0 0 1rem;
  }
  .last {
    border-radius: 0 1rem 1rem 0;
  }

  .active {
    opacity: 1;
  }

  .not-active {
    opacity: 0.8;
  }
</style>
