<script lang="ts">
  import { page } from '$app/stores'
</script>

<section class="text-center">
  <h2 class="p-4 text-red-600">Error</h2>
  <pre class="bg-yellow-100 text-red-600">{$page.status}: {$page?.error?.message}</pre>
  <br />
  <a href="/">Home</a>
</section>
