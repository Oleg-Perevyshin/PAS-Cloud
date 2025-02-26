<!-- $lib/components/UI/Input.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import { ThemeStore } from '../../../stores'
  import PhEye from '$lib/appIcons/PhEye.svelte'
  import PhEyeSlash from '$lib/appIcons/PhEyeSlash.svelte'
  import Info from '$lib/appIcons/ButtonInfo.svelte'

  interface Props {
    id?: string
    label?: string
    className?: string
    type?: string
    value?: string | number | boolean | null
    info?: string
    props?: {
      lableAlign?: string
      placeholder?: string
      maxLength?: number
      minLength?: number | null
      disabled?: boolean
      autocomplete?:
        | 'on'
        | 'off'
        | 'given-name'
        | 'family-name'
        | 'name'
        | 'email'
        | 'username'
        | 'new-password'
        | 'current-password'
        | 'tel'
        | 'country-name'
        | 'address-level1'
        | 'address-level2'
        | 'street-address'
        | 'postal-code'
        | 'cc-name'
        | 'cc-number'
        | 'cc-exp'
        | 'cc-csc'
        | null
    }
    allowOnly?: RegExp | null
    validate?: (value: string) => boolean
    onUpdate?: (value: string) => void
    onKeyPress?: (key: string) => void
  }

  let {
    id = '',
    type = 'text',
    value = $bindable(null),
    info = '',
    props = {
      lableAlign: '',
      placeholder: '',
      maxLength: 1024,
      minLength: null,
      disabled: false,
      autocomplete: null,
    },
    label = '',
    validate = () => true,
    allowOnly = null,
    className = '',
    onUpdate = () => {},
    onKeyPress = () => {},
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    lableAlign: '',
    placeholder: '',
    maxLength: 1024,
    minLength: null,
    disabled: false,
    autocomplete: null,
    ...props,
  }

  let showPassword = $state(type === 'password')
  let showInfo = $state(false)
  let currentTheme: string | undefined = $state()
  let isValid = $state(true)

  onMount(() => {
    const subscriptions = {
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  function updateValue(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value
    const cleanedValue = allowOnly ? inputValue.replace(allowOnly, '') : inputValue
    value = cleanedValue
    isValid = !validate || validate(inputValue)
    onUpdate(value)
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword
  }

  function toggleInfoVisibility() {
    showInfo = !showInfo
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest('.info-container') && !target.closest('button[aria-label*="инфо"]')) {
      showInfo = false
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    onKeyPress(event.key)
  }

  /* Добавляем обработчик для кликов вне компонента */
  onMount(() => {
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  })
</script>

<div class={`relative inline-block w-full items-center border-0 px-4 ${className}`}>
  {#if label}
    <label for={id} class={`mx-4 block font-semibold ${props.lableAlign}`}>{label}</label>
  {/if}
  <div class="flex flex-row items-center">
    <input
      class={`h-auto w-full cursor-pointer rounded-2xl border border-blue-400 px-4 py-1 text-center text-base
        duration-300 hover:shadow-lg focus:border-blue-400 focus:outline-none
        ${props.disabled ? 'cursor-not-allowed opacity-60' : ''}
        ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}
        ${!isValid ? 'invalid' : ''}
      `}
      {id}
      placeholder={props.placeholder}
      bind:value
      autocomplete={props.autocomplete}
      disabled={props.disabled}
      oninput={updateValue}
      onkeydown={handleKeyDown}
      type={type === 'password' && showPassword ? 'password' : 'text'}
      maxlength={props.maxLength}
      minlength={props.minLength}
    />
    {#if type === 'password'}
      <button
        type="button"
        class="absolute right-6 flex cursor-pointer items-center"
        onclick={togglePasswordVisibility}
        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
      >
        <span class="inline-flex h-5 w-5 items-center justify-center">
          {#if showPassword}
            <PhEye class="h-full w-full" />
          {:else}
            <PhEyeSlash class="h-full w-full" />
          {/if}
        </span>
      </button>
    {/if}
    {#if info}
      <button
        type="button"
        class="absolute left-1 flex cursor-pointer items-center"
        onclick={toggleInfoVisibility}
        aria-label={showInfo ? 'Скрыть инфо' : 'Показать инфо'}
      >
        <Info class="h-8 w-8" />
      </button>
    {/if}
  </div>
  {#if showInfo}
    <div
      transition:fly={{ y: 15, duration: 300 }}
      class={`
        info-container absolute z-50 m-2 rounded border border-gray-300 p-1
        ${currentTheme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}
      `}
    >
      {info}
    </div>
  {/if}
</div>
