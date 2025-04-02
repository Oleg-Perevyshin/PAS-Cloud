<!-- $lib/components/UI/Switch.svelte -->
<script lang="ts">
  interface Props {
    id?: string
    label?: string
    value?: boolean | string | number | number[] | object | null
    props?: {
      disabled?: boolean
    }
    className?: string
    onUpdate?: (value: boolean | number) => void
  }

  let {
    id = '',
    label = '',
    value = false,
    props = {
      disabled: false,
    },
    className = '',
    onUpdate = () => {},
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    disabled: false,
    ...props,
  }

  /* Преобразуем значение в boolean */
  const isChecked = () => (typeof value === 'boolean' ? value : value === 1)

  function toggleSwitch() {
    if (props.disabled) return
    const newValue = !isChecked()
    onUpdate(newValue ? 1 : 0)
  }

  /* Обработчик клавиш */
  function handleKeyDown(event: KeyboardEvent) {
    if (props.disabled) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault() // Предотвращаем прокрутку страницы при нажатии пробела
    }
  }
</script>

<div {id} class={`relative inline-block w-full px-4 ${className}`}>
  {#if label}
    <p class="block font-semibold">{label}</p>
  {/if}
  <div class="flex items-center justify-center">
    <div
      class="relative inline-flex cursor-pointer items-center"
      role="switch"
      tabindex="0"
      onclick={toggleSwitch}
      onkeydown={handleKeyDown}
      aria-checked={isChecked()}
      aria-disabled={props.disabled}
    >
      <input type="checkbox" class="sr-only" checked={isChecked()} />
      <div class={`h-6 w-12 rounded-full transition ${isChecked() ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
      <div class={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition ${isChecked() ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </div>
    <span class="ml-3 font-semibold">{isChecked() ? 'Включено' : 'Выключено'}</span>
  </div>
</div>
