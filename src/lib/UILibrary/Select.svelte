<script lang="ts">
  import { onMount } from 'svelte'
  import { slide, fly } from 'svelte/transition'
  import type { Colors, IOption } from './Interface'

  interface SelectProps {
    id?: string
    value?: IOption | null
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors | null
    }
    validation?: {
      disabled?: boolean
      options?: IOption[] | null
      showCustomOption?: boolean
    }
    style?: {
      inlineStyle?: string
      color?: Colors
    }
    help?: {
      placeholder?: string
      info?: string
    }

    onUpdate?: (value: IOption) => void
  }

  const defaultLabel = {
    text: '',
    align: 'center' as const,
    color: null,
  }

  const defaultValidation = {
    disabled: false,
    value: null,
    options: null,
    showCustomOption: false,
  }

  const defaultStyle = {
    inlineStyle: '',
    color: 'blue' as Colors,
  }

  const defaultHelp = {
    placeholder: '',
    info: '',
  }

  // Деструктуризация с явным слиянием
  let {
    id = '',
    value = null,
    label = defaultLabel,
    validation = defaultValidation,
    style = defaultStyle,
    help = defaultHelp,
    onUpdate = () => {},
  }: SelectProps = $props()

  // Явное слияние переданных пропсов с дефолтными значениями
  label = { ...defaultLabel, ...label }
  validation = { ...defaultValidation, ...validation }
  style = { ...defaultStyle, ...style }
  help = { ...defaultHelp, ...help }

  let isDropdownOpen = $state(false)
  let customOption = $state('')
  let showInfo = $state(false)

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.select-container')) {
        isDropdownOpen = false
      }
    }
    window.addEventListener('click', handleClickOutside)

    const handleClickOutsideInfo = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.info-container') && !target.closest('.button-info')) {
        showInfo = false
      }
    }
    window.addEventListener('click', handleClickOutsideInfo)

    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('click', handleClickOutsideInfo)
    }
  })

  const toggleDropdown = () => {
    if (!validation.disabled) {
      isDropdownOpen = !isDropdownOpen
    }
  }

  const selectOption = (option: IOption) => {
    if (!validation.disabled) {
      value = option
      isDropdownOpen = false
      if (onUpdate) {
        onUpdate(value)
      }
    }
  }

  const handleCustomInput = (event: Event) => {
    value = { id: -1, name: (event.target as HTMLInputElement).value } as IOption
    if (onUpdate) onUpdate(value)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (validation.disabled) return
    if (event.key === ' ') {
      toggleDropdown()
      event.preventDefault()
    }
  }

  function toggleInfoVisibility() {
    showInfo = !showInfo
  }
</script>

<div class="select-container {style.color}" style="{style.inlineStyle} --border: {style.color == 'white' ? 'var(--border-color)' : 'white'};">
  <label for={id} class="select-label" style="margin: {label ? '0.25rem 0' : '0'};  color: var(--{label.color ? label.color : 'font'}-color);"
    >{label.text}</label
  >
  <button
    {id}
    class="select-button"
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    aria-haspopup="true"
    aria-expanded={isDropdownOpen}
    disabled={validation.disabled}
    style="color: {style.color != 'white' ? 'white' : 'black'}; border: {style.color != 'white' ? 'none' : '1px solid var(--border)'};"
  >
    {value?.name || help.placeholder}
  </button>
  {#if help.info}
    <button
      type="button"
      class="button-info"
      onclick={toggleInfoVisibility}
      style="top: {label ? '1.6' : '0.2'}rem;"
      aria-label={showInfo ? 'Скрыть инфо' : 'Показать инфо'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" width="1.5rem" color={style.color != 'white' ? 'white' : 'black'} viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M12 16.5q.214 0 .357-.144T12.5 16v-4.5q0-.213-.144-.356T11.999 11t-.356.144t-.143.356V16q0 .213.144.356t.357.144M12 9.577q.262 0 .439-.177t.176-.438t-.177-.439T12 8.346t-.438.177t-.177.439t.177.438t.438.177M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
        /></svg
      >
    </button>
  {/if}
  {#if showInfo}
    <div transition:fly={{ y: -15, duration: 300 }} class="info-container">
      {help.info}
    </div>
  {/if}

  {#if isDropdownOpen}
    <div class="select-dropdown" transition:slide={{ duration: 300 }}>
      {#each validation.options ?? [] as option, index}
        <button
          class={`select-option ${index === validation.options!.length - 1 && !validation.showCustomOption ? 'last-option' : ''}`}
          onclick={() => selectOption(option)}
          disabled={validation.disabled}
          style="color: {style.color != 'white' ? 'white' : 'black'};{style.color != 'white'
            ? 'border-top: 1px solid var(--border); border-left: none; border-right: none; border-bottom: none;'
            : '    border: 1px solid var(--border); border-top: none;'}"
        >
          {option.name}
        </button>
      {/each}
      {#if validation.showCustomOption}
        <input
          type="text"
          bind:value={customOption}
          oninput={handleCustomInput}
          class={`select-option last-option`}
          placeholder="Enter value"
          style={style.color != 'white'
            ? 'border-top: 1px solid var(--border); border-left: none; border-right: none; border-bottom: none; background-color: color-mix(in srgb, var(--color) 70%, transparent); color: white'
            : 'border: 1px solid var(--border); border-top: none;'}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .select-container {
    position: relative;
    width: 50%;
  }

  .select-label {
    display: block;
  }

  .select-button {
    width: 100%;
    min-height: 2rem;
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 0.25rem 1rem;
    text-align: center;
    background-color: var(--color);
    transition: box-shadow 0.3s;
    cursor: pointer;
  }

  .select-button:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .select-dropdown {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    border-radius: 0.5rem;
    width: calc(100% - 1.7rem);
    z-index: 49;
    background-color: white;
  }

  .select-option {
    display: flex;
    justify-content: center;
    padding: 0.25rem;
    width: 100%;
    cursor: pointer;
    transition: all 0.3s;
    background-color: color-mix(in srgb, var(--color) 100%, transparent);
  }

  .select-option:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }

  .last-option {
    border-radius: 0 0 1rem 1rem;
    text-align: center;
  }

  .last-option:focus {
    outline: none;
  }

  input::placeholder {
    color: var(--border);
  }

  .select-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .button-info {
    position: absolute;
    display: flex;
    align-items: center;
    left: 0.25rem;
    margin-top: 0.65rem;
    border: none;
    background-color: transparent;
    cursor: pointer;
  }

  .info-container {
    position: absolute;
    z-index: 50;
    border-radius: 0.25rem;
    border: 1px solid var(--border-color);
    padding: 0.25rem;
    background-color: var(--field-color);
  }
</style>
