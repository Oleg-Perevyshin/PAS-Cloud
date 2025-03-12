<!-- $lib/components/UI/TextArea.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { ThemeStore } from '../../../stores'

  interface Props {
    id?: string
    label?: string
    props?: {
      maxLength?: number
      rows?: number
      disabled?: boolean
      autocomplete?: 'on' | 'off' | null
    }
    value?: string
    className?: string
    onUpdateValue?: (value: string) => void
    onKeyDown?: (event: KeyboardEvent) => void
  }

  let {
    id = '',
    label = '',
    props = {
      maxLength: 1024,
      rows: 4,
      autocomplete: null,
      disabled: false,
    },
    value = $bindable(''),
    className = '',
    onUpdateValue,
    onKeyDown = () => {},
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    maxLength: 1024,
    rows: 4,
    autocomplete: null,
    disabled: false,
    ...props,
  }

  let currentTheme: string | undefined = $state()

  onMount(() => {
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    return () => {
      unsubscribeTheme()
    }
  })

  function updateValue(event: Event) {
    value = (event.target as HTMLTextAreaElement).value
    if (onUpdateValue) {
      onUpdateValue(value)
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    onKeyDown(event)
    onKeyDown(event)
  }
</script>

<div class="relative flex w-full flex-col items-center">
  <label for={id} class="mt-1 block font-semibold">{label}</label>
  <textarea
    class={`relative resize-none rounded-2xl border border-blue-400 px-4 py-1 text-justify text-base
    opacity-100 transition duration-300 hover:opacity-75 hover:shadow-lg
    ${className}
    ${props.disabled ? 'cursor-not-allowed opacity-75' : ''}
    ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}`}
    {id}
    bind:value
    autocomplete={props.autocomplete}
    disabled={props.disabled}
    rows={props.rows}
    oninput={updateValue}
    maxlength={props.maxLength}
    onkeydown={handleKeyDown}
  ></textarea>
</div>
