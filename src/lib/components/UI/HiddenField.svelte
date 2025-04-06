<!-- $lib/components/UI/HiddenField.svelte -->
<script lang="ts">
  interface Props {
    id?: string
    value?: boolean | string | number | number[] | object | null
  }

  let { id = '', value = $bindable(null) }: Props = $props()
</script>

<!-- Разметка компонента -->
<input type="hidden" {id} bind:value class="hidden" />
