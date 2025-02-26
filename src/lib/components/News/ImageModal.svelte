<!-- $lib/components/News/ImageModal.svelte -->
<script lang="ts">
  interface Props {
    imageSrc?: string
    onClose: () => void
  }

  let { imageSrc = '', onClose }: Props = $props()
  const handleBackgroundClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }
</script>

{#if imageSrc}
  <button
    class="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black"
    onclick={handleBackgroundClick}
  >
    <div
      class="relative flex flex-shrink-0 items-center justify-center
      overflow-hidden rounded-2xl border border-gray-400"
    >
      <img src={imageSrc} alt="Full ImageContent" class="max-size object-contain" />
    </div>
  </button>
{/if}

<style>
  .max-size {
    max-width: 75vw;
    max-height: 60vw;
  }
</style>
