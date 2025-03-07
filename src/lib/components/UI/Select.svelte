<!-- $lib/components/UI/Select.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { t } from '$lib/locales/i18n'
  import type { IOptionUI } from '../../../stores/Interfaces'

  interface Props {
    id?: string
    label?: string
    value?: IOptionUI | null
    options?: IOptionUI[]
    props?: {
      currentLang?: string
      bgColor?: string
      disabled?: boolean
    }
    className?: string

    onUpdate?: (value: IOptionUI | null) => void
  }

  let {
    options = [],
    value = { id: '', name: '', value: '', color: 'bg-gray-400' },
    label = '',
    props = {
      currentLang: 'ru',
      bgColor: '',
      disabled: false,
    },
    id = '',
    className = '',
    onUpdate,
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    currentLang: 'ru',
    bgColor: '',
    disabled: false,
    ...props,
  }

  let isDropdownOpen = $state(false)

  onMount(() => {
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

<div class={`relative inline-block w-full cursor-pointer px-4 ${className}`}>
  <label for={id} class="mx-4 block font-semibold">{label}</label>
  <button
    {id}
    value={value?.value}
    class={`w-full rounded-2xl border border-gray-400 p-1 text-center
      duration-300 hover:shadow-lg
      ${value?.color}
      ${props.disabled ? 'cursor-not-allowed opacity-50' : ''}
      ${props.bgColor}`}
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
      class={`absolute top-full left-1/2 z-50 -translate-x-1/2 transform rounded-b-2xl border border-gray-400`}
      style="width: calc(100% - 3.5rem);"
      transition:slide={{ duration: 300 }}
    >
      {#each options as option, index}
        <button
          id={option?.id}
          value={option.value}
          class={`flex h-full w-full cursor-pointer items-center justify-center p-1
            opacity-100 transition duration-300 hover:underline
            ${props.bgColor} ${option.color} ${index === options.length - 1 ? 'rounded-b-2xl' : ''}`}
          onclick={() => selectOption(option)}
          disabled={props.disabled}
        >
          {option.name}
        </button>
      {/each}
    </div>
  {/if}
</div>
