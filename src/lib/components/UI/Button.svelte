<!-- $lib/components/UI/Button.svelte -->
<script lang="ts">
  import type { SvelteComponent } from 'svelte'

  interface Props {
    id?: string
    label?: string
    className?: string
    props?: {
      textAlignment?: string
      bgColor?: string
      textColor?: string
      hoverBgColor?: string
      activeBgColor?: string
      disabled?: boolean
    }
    icon?: typeof SvelteComponent | null
    iconProps?: Record<string, string>
    onClick?: (event: MouseEvent) => void
  }

  let {
    id = '',
    label = '',
    className = '',
    props = {
      textAlignment: 'center',
      bgColor: '',
      textColor: '',
      hoverBgColor: '',
      activeBgColor: '',
      disabled: false,
    },
    icon = null,
    iconProps = {},
    onClick = () => {},
  }: Props = $props()

  /* Применяем значение по умолчанию, если props не передан */
  props = {
    textAlignment: 'center',
    bgColor: '',
    textColor: '',
    hoverBgColor: '',
    activeBgColor: '',
    disabled: false,
    ...props,
  }
</script>

<!-- Разметка компонента -->
<button
  {id}
  class={`relative inline-block cursor-pointer items-center rounded-2xl border border-gray-400 font-medium select-none mx-2 px-2 py-1
    ${props.disabled ? 'cursor-not-allowed opacity-75' : ''}
    transition duration-300 hover:shadow-lg
    ${props.bgColor} ${props.textColor}
    ${!props.disabled ? props.hoverBgColor : ''} ${!props.disabled ? props.activeBgColor : ''}
    ${className}
  `}
  onclick={props.disabled ? undefined : onClick}
  disabled={props.disabled}
>
  <span class="flex items-center">
    {#if icon}
      {@const IconComponent = icon}
      <IconComponent {...iconProps} />
    {/if}
    <span class={`flex-1 text-${props.textAlignment}`}>
      {label}
    </span>
  </span>
</button>

<!-- <div class={`relative inline-block w-full items-center border-0 px-4`}>
  <button
    {id}
    class={`cursor-pointer relative inline-block items-center rounded-2xl border border-gray-400 w-full px-2 py-1 font-medium select-none
      ${props.disabled ? 'cursor-not-allowed opacity-75' : ''}
      transition duration-300 hover:shadow-lg
      ${props.bgColor} ${props.textColor}
      ${!props.disabled ? props.hoverBgColor : ''} ${!props.disabled ? props.activeBgColor : ''}
      ${className}
    `}
    onclick={props.disabled ? undefined : onClick}
    disabled={props.disabled}
  >
    <span class="flex items-center">
      {#if icon}
        {@const IconComponent = icon}
        <IconComponent {...iconProps} />
      {/if}
      <span class={`flex-1 text-${props.textAlignment}`}>
        {label}
      </span>
    </span>
  </button>
</div> -->
