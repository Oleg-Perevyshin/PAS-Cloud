<!-- $lib/components/Header/Theme.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { ThemeStore } from '../../../stores'
  import IconLightDark from '$lib/appIcons/IconLightDark.svelte'

  onMount(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('AppTheme') || 'light'
      ThemeStore.set(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)

      ThemeStore.subscribe((value) => {
        localStorage.setItem('AppTheme', value)
      })
    }

    /* Очистка подписок */
    return () => {}
  })

  const toggleTheme = () => {
    ThemeStore.update((currentTheme) => {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', newTheme)
      return newTheme
    })
  }
</script>

<div class="mx-4 flex items-center">
  <button
    onclick={toggleTheme}
    class={`flex cursor-pointer items-center opacity-100 transition-opacity duration-300 hover:opacity-50`}
  >
    <IconLightDark width="2rem" height="2rem" />
  </button>
</div>

<style></style>
