<script lang="ts">
  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'

  interface Props {
    id?: string
    Label?: string
    styleCSS?: string
    LabelAlign?: 'start' | 'center' | 'end'
    color?: Colors
    visible?: boolean
  }

  let { id = '', Label = '', styleCSS = '', LabelAlign = 'center', color = 'primary', visible = true }: Props = $props()
</script>

<hr {id} class={color} style="{styleCSS} {visible ? '' : 'border: none;'}" />
{#if Label}
  <label for={id} class="label" style="text-align: {LabelAlign};">{Label}</label>
{/if}

<style>
  hr {
    border: 1px solid var(--color);
    width: 100%;
  }
</style>
