<script lang="ts">
  import type { Colors } from './Interface'

  export interface SeparatorProps {
    id?: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors | null
    }
    style?: {
      inlineStyle?: string
      color?: Colors
      visible?: boolean
    }
  }

  const defaultLabel = {
    text: '',
    align: 'center' as const,
    color: null,
  }

  const defaultStyle = {
    inlineStyle: '',
    color: 'blue' as Colors,
    visible: true,
  }

  let { id = '', label = defaultLabel, style = defaultStyle }: SeparatorProps = $props()

  label = { ...defaultLabel, ...label }
  style = { ...defaultStyle, ...style }
</script>

<hr {id} class={style.color} style="{style.inlineStyle} {style.visible ? '' : 'height: 1rem; border: none;'}" />
{#if label}
  <label for={id} class="label" style="text-align: {label.align}; color: var(--{label.color ? label.color : 'font'}-color);">{label.text}</label>
{/if}

<style>
  hr {
    border: 1px solid var(--color);
    width: 100%;
  }
</style>
