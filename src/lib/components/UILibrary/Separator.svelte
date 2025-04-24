<script lang="ts">
  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'

  interface Props {
    id?: string
    label?: string
    styleCSS?: string
    labelAlign?: 'start' | 'center' | 'end'
    color?: Colors
    visible?: boolean
  }

  let { id = '', label = '', styleCSS = '', labelAlign = 'center', color = 'primary', visible = true }: Props = $props()
</script>

<hr {id} class={color} style="{styleCSS} {visible ? '' : 'height: 1rem; border: none;'}" />
{#if label}
  <label for={id} class="label" style="text-align: {labelAlign};">{label}</label>
{/if}

<style>
  hr {
    border: 1px solid var(--color);
    width: 100%;
  }
</style>
