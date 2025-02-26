<!-- $lib/components/UI/Loader.svelte -->
<script lang="ts">
  import LoaderRotate from '$lib/appIcons/LoaderRotate.svelte'

  interface Props {
    show?: boolean
  }

  let { show = false }: Props = $props()
</script>

{#if show}
  <div class="absolute inset-0 z-50 flex items-center justify-center">
    <LoaderRotate width="5rem" height="5rem" />
  </div>
{/if}
