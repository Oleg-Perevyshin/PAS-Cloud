<!-- $lib/components/Navigation/Company.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import Button from '../UI/Button.svelte'
  import { ThemeStore } from '../../../stores'

  /**
   * Подписки
   */
  let currentTheme: string = $state('light')
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      ThemeStore: ThemeStore.subscribe((value) => (currentTheme = value || 'light')),
    }

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  const changePage = (page: string) => {
    goto(`/test/${page}`)
  }
</script>

<div class="flex w-full flex-col items-center">
  <!-- Кнопка меню -->
  <Button
    onClick={() => changePage('')}
    label="UI Test Page"
    props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800', textAlignment: 'center' }}
    iconProps={{ width: '2rem', height: '2rem' }}
    className="m-1 h-12 w-[95%]"
  />
</div>
