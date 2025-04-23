<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '../../locales/i18n'
  import { slide, fly } from 'svelte/transition'

  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'
  export interface IOption {
    id?: number
    value?: string | number
    name?: string
  }

  interface Props {
    options?: IOption[]
    value?: IOption | null
    label?: string
    id?: string
    styleCSS?: string
    color?: Colors
    Info?: string
    disabled?: boolean
    currentLanguage?: string
    placeholder?: string
    onUpdate?: (value: IOption) => void
    showCustomOption?: boolean
  }

  let {
    options = [],
    value = null,
    label = '',
    id = '',
    styleCSS = '',
    color = 'white',
    Info = '',
    disabled = false,
    currentLanguage = 'ru',
    placeholder = t('select.select_tag', currentLanguage),
    onUpdate,
    showCustomOption = false,
  }: Props = $props()

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
    if (!disabled) {
      isDropdownOpen = !isDropdownOpen
    }
  }

  const selectOption = (option: IOption) => {
    if (!disabled) {
      value = option
      isDropdownOpen = false
      if (onUpdate) {
        onUpdate(value)
      }
    }
  }

  const handleCustomInput = (event: Event) => {
    customOption = (event.target as HTMLInputElement).value
    value = { id: -1, name: customOption } as IOption
    if (onUpdate) onUpdate(value)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled) return
    if (event.key === ' ') {
      toggleDropdown()
      event.preventDefault()
    }
  }

  function toggleInfoVisibility() {
    showInfo = !showInfo
  }
</script>

<div class="select-container {color}" style="{styleCSS} --border: {color == 'white' ? 'var(--border-color)' : 'white'};">
  <label for={id} class="select-label" style="margin: {label ? '0.25rem 0' : '0'}; color: var(--font-color);">{label}</label>
  <button
    {id}
    class="select-button"
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    aria-haspopup="true"
    aria-expanded={isDropdownOpen}
    {disabled}
    style="color: {color != 'white' ? 'white' : 'black'}; border: {color != 'white' ? 'none' : '1px solid var(--border)'};"
  >
    {value?.name || placeholder}
  </button>
  {#if Info}
    <button
      type="button"
      class="button-info"
      onclick={toggleInfoVisibility}
      style="top: {label ? '1.6' : '0.2'}rem;"
      aria-label={showInfo ? 'Скрыть инфо' : 'Показать инфо'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="1.5rem" width="1.5rem" color={color != 'white' ? 'white' : 'black'} viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M12 16.5q.214 0 .357-.144T12.5 16v-4.5q0-.213-.144-.356T11.999 11t-.356.144t-.143.356V16q0 .213.144.356t.357.144M12 9.577q.262 0 .439-.177t.176-.438t-.177-.439T12 8.346t-.438.177t-.177.439t.177.438t.438.177M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
        /></svg
      >
    </button>
  {/if}
  {#if showInfo}
    <div transition:fly={{ y: -15, duration: 300 }} class="info-container">
      {Info}
    </div>
  {/if}

  {#if isDropdownOpen}
    <div class="select-dropdown" transition:slide={{ duration: 300 }}>
      {#each options as option, index}
        <button
          class={`select-option ${index === options.length - 1 && !showCustomOption ? 'last-option' : ''}`}
          onclick={() => selectOption(option)}
          {disabled}
          style="color: {color != 'white' ? 'white' : 'black'};{color != 'white'
            ? 'border-top: 1px solid var(--border); border-left: none; border-right: none; border-bottom: none;'
            : '    border: 1px solid var(--border); border-top: none;'}"
        >
          {option.name}
        </button>
      {/each}
      {#if showCustomOption}
        <input
          type="text"
          bind:value={customOption}
          oninput={handleCustomInput}
          class={`select-option last-option`}
          placeholder={t('select.custom', currentLanguage)}
          style={color != 'white'
            ? 'border-top: 1px solid var(--border); border-left: none; border-right: none; border-bottom: none; background-color: color-mix(in srgb, var(--color) 70%, transparent);'
            : 'border: 1px solid var(--border); border-top: none;'}
        />
      {/if}
    </div>
  {/if}
</div>

<style>
  .select-container {
    position: relative;
    margin: 0.25rem;
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
