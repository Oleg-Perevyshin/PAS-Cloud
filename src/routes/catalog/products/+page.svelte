<!-- src/routes/catalog/products/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'

  /**
   * Переменные компонента
   */

  /**
   * Подписка на изменения в UserStore и Language
   */
  let currentLang: string | undefined = $state()
  onMount(() => {
    /* Подписка на изменение языка */
    const unsubscribeLanguage = Language.subscribe((value) => {
      currentLang = value
    })

    /* Функция для очистки подписок */
    return () => {
      unsubscribeLanguage()
    }
  })
</script>

<div class="flex h-full flex-col items-center overflow-hidden">
  {#if currentLang}
    <h2>{t('catalog.products.title', currentLang)}</h2>
  {/if}
</div>
