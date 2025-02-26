<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { Language } from '$lib/locales/i18n'
  import { ThemeStore } from '../stores'

  /**
   * Подписки
   */
  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    /* Установка значений по умолчанию в localStorage */
    if (localStorage.getItem('IsOnline') === null) {
      localStorage.setItem('IsOnline', 'false')
    }

    /* Установка значений по умолчанию в localStorage */
    if (localStorage.getItem('AppLanguage') === null) {
      localStorage.setItem('AppLanguage', 'ru')
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })
</script>

<div></div>
