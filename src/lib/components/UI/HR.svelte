<!-- $lib/components/UI/HR.svelte -->
<script lang="ts">
  interface Props {
    id?: string
    className?: string
  }

  let { id = '', className = '' }: Props = $props()
</script>

<!-- Разметка компонента -->
<hr {id} class={`my-4 w-full border-gray-400 ${className}`} />
