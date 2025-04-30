<script lang="ts">
  import { onMount, type SvelteComponent } from 'svelte'
  import type { Colors, IOption } from './Interface'

  interface ButtonProps {
    id: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      itemColor?: Colors | null
    }
    validation?: {
      disabled?: boolean
      options?: IOption[] | null
      value?: IOption | null
      text?: string
    }
    style?: {
      level_1?: string
      level_2?: string
      bgColor?: Colors
      optionWidth?: 'auto' | 'max-option'
      icon?: (new (...args: any[]) => SvelteComponent) | null
      iconProps?: Record<string, unknown>
    }

    onClick?: (event: MouseEvent) => void
    onChange?: (value: IOption) => void
  }

  let {
    id = '',
    label = {
      text: '',
      align: 'center',
      itemColor: null,
    },
    validation = {
      text: '',
      disabled: false,
      options: null,
      value: null,
    },
    style = {
      level_1: '',
      level_2: '',
      bgColor: 'white',
      optionWidth: 'auto',
      icon: null,
      iconProps: {},
    },

    onClick = () => {},
    onChange = () => {},
  }: ButtonProps = $props()

  let isActive = $state(false)
  let maxWidth = $state('auto')

  function handleClick(event: MouseEvent) {
    if (!validation.disabled) {
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
    if (validation.options && style.optionWidth === 'max-option') {
      const maxLength = validation.options.reduce((max, option) => {
        return Math.max(max, option.name!.length)
      }, 0)

      maxWidth = `${maxLength * 0.9}rem`
    }
  })
</script>

<div class="button-conteiner" style={style.level_1}>
  {#if label}
    <label for={id} class="label" style="text-align: {label.align}; color: var(--{label.itemColor ? label.itemColor : 'font'}-color);">{label.text}</label>
  {/if}
  {#if validation.options}
    <div class="group {validation.disabled ? 'disabled' : ''}" {id}>
      {#each validation.options as item, index}
        <button
          value={item.value}
          class={`button button-option ${style.bgColor}
          ${index === 0 ? 'first' : ''}
          ${index === validation.options.length - 1 ? 'last' : ''}
          ${item.name === validation.value?.name ? 'active' : 'not-active'}
        `}
          onclick={() => updateValue(item)}
          style="width: {maxWidth}; {style.bgColor == 'white'
            ? 'border: 1px solid var(--border-color);'
            : 'color: white; border: none; margin: 0 1px;'} {validation.disabled ? 'cursor: not-allowed;' : ''}"
          disabled={validation.disabled}
        >
          {item.name}
        </button>
      {/each}
    </div>
  {:else}
    <button
      {id}
      class={`button ${validation.disabled ? 'disabled' : ''} ${style.bgColor}`}
      style="border-radius: 1rem; min-width: max-content; {style.bgColor == 'white'
        ? 'border: 1px solid var(--border-color);'
        : 'color: white; border: none;'} {style.level_2}"
      onclick={handleClick}
      disabled={validation.disabled}
    >
      <span class="button-content">
        {#if style.icon}
          {@const IconComponent = style.icon}
          <IconComponent {...style.iconProps} />
        {/if}
        {#if validation.text}
          <span class="text">
            {validation.text}
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
