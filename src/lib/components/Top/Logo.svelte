<!-- $lib/components/Header/Logo.svelte -->
<script>
  import { goto } from '$app/navigation'
  const navigateHome = () => {
    goto('/')
  }
</script>

<div class="mr-auto flex items-center">
  <button class="m-2 flex cursor-pointer items-center justify-center p-2" onclick={navigateHome} type="button">
    <img src="/logo.svg" alt="Logo" class="h-10 w-56" />
  </button>
</div>
