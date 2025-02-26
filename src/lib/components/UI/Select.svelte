<!-- $lib/components/UI/Select.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { t } from '$lib/locales/i18n'
  import { ThemeStore } from '../../../stores'
  import type { IOptionUI } from '../../../stores/Interfaces'

  interface Props {
    id?: string
    label?: string
    props?: {
      currentLang?: string
      disabled?: boolean
    }
    value?: IOptionUI | null
    options?: IOptionUI[]
    className?: string

    onUpdate?: (value: IOptionUI | null) => void
  }

  let {
    options = [],
    value = { id: '', name: '', color: '' },
    label = '',
    props = {
      currentLang: 'ru',
      disabled: false,
    },
    id = '',
    className = '',
    onUpdate,
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    currentLang: 'ru',
    disabled: false,
    ...props,
  }

  let isDropdownOpen = $state(false)
  let currentTheme: string | undefined = $state()

  onMount(() => {
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.relative')) {
        isDropdownOpen = false
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside)
    }

    return () => {
      unsubscribeTheme()
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleClickOutside)
      }
    }
  })

  const toggleDropdown = () => {
    if (!props.disabled) {
      isDropdownOpen = !isDropdownOpen
    }
  }

  const selectOption = (option: IOptionUI) => {
    if (!props.disabled) {
      value = option
      isDropdownOpen = false
      if (onUpdate) {
        onUpdate(value)
      }
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (props.disabled) return
    if (event.key === ' ') {
      toggleDropdown()
      event.preventDefault()
    }
  }
</script>

<div class={`relative m-2 inline-block cursor-pointer ${className}`}>
  <label for={id} class="mt-1 block font-semibold">{label}</label>
  <button
    {id}
    class={`w-full rounded-2xl border border-gray-400 p-1 text-center
      duration-300 hover:shadow-lg
      ${currentTheme === 'light' ? 'bg-white' : ''}
      ${value?.color}
      ${props.disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    onclick={toggleDropdown}
    onkeydown={handleKeydown}
    aria-haspopup="true"
    aria-expanded={isDropdownOpen}
    disabled={props.disabled}
  >
    {value?.name || t('common.select_tag', props.currentLang)}
  </button>

  {#if isDropdownOpen}
    <div
      class={`absolute top-full left-1/2 -translate-x-1/2 transform rounded-b-2xl border border-gray-400
      ${currentTheme === 'light' ? '!bg-white' : ''} z-50`}
      style="width: calc(100% - 1.5rem);"
      transition:slide={{ duration: 300 }}
    >
      {#each options as option, index}
        <button
          class={`flex h-full w-full cursor-pointer items-center justify-center p-1
            opacity-100 transition duration-300 hover:opacity-75 hover:shadow-lg
            ${option.color} ${index === options.length - 1 ? 'rounded-b-2xl' : ''}`}
          onclick={() => selectOption(option)}
          disabled={props.disabled}
        >
          {option.name}
        </button>
      {/each}
    </div>
  {/if}
</div>
