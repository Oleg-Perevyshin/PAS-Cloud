<!-- src/routes/news/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { API_NewsList } from '$lib/utils/API'
  import { NewsListStore, NewsListClear, NewsUpsert, LoaderStore } from '../../stores'
  import type { INews } from '../../stores/Interfaces'
  import NewsList from '$lib/components/News/NewsList.svelte'

  /**
   * Подписки
   */
  let currentLang: string | undefined = $state()
  let newsList: INews[] = $state([])
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value)),
      NewsList: NewsListStore.subscribe((value) => (newsList = value || [])),
    }

    NewsListClear()
    getNewsList()

    /* Функция для очистки подписок */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /**
   * Получаем список всех новостей
   */
  const getNewsList = async () => {
    LoaderStore.set(true)
    NewsListClear()
    try {
      const newsList = await API_NewsList('')
      if (newsList) {
        newsList.forEach((news) => {
          NewsUpsert(news)
        })
      }
    } catch (error) {
      console.error('Ошибка чтения списка новостей: ', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  let isExpand: { [key: string]: boolean } = {}
</script>

<!-- Блок всех опубликованных новостей -->
<div class="flex h-full flex-col overflow-hidden">
  <div class="sticky top-0">
    <h2>{t('news.title', currentLang)}</h2>
  </div>

  <div class="flex flex-col items-center justify-start overflow-y-auto">
    {#if currentLang}
      <NewsList {newsList} {currentLang} {isExpand} isAbilityEdit={false} />
    {/if}
  </div>
</div>
