<!-- src/routes/dashboard/news/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { UserStore, ThemeStore } from '../../../stores'
  import type { IUser, INews } from '../../../stores/Interfaces'
  import { NewsStore, NewsListStore, NewsUpsert, NewsListClear, NewsClear, RemoveNewsFromStore, addMessage, LoaderStore } from '../../../stores'
  import { API_UserAddEditNews, API_NewsList, API_UserDeleteNews } from '$lib/utils/API'
  import { HandleImageUpload } from '$lib/utils/Common'
  import { get } from 'svelte/store'
  import Button from '$lib/components/UI/Button.svelte'
  import NewsList from '$lib/components/News/NewsList.svelte'
  import NewsEditorModal from '$lib/components/News/NewsEditorModal.svelte'

  /**
   * Переменные компонента
   */
  let showEditorModal = $state(false)
  let currentEditNews: INews | null = $state(null)
  let isExpand: { [key: string]: boolean } = {}

  /**
   * Подписки
   */
  let currentLang: string | undefined = $state()
  let UserData: IUser
  let newsList: INews[] = $state([])
  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value)),
      UserStore: UserStore.subscribe((value) => (UserData = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      NewsList: NewsListStore.subscribe((value) => (newsList = value || [])),
    }

    NewsListClear()
    getUserNewsList()

    /* Функция для очистки подписок */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* Создание новой новости */
  const createNews = () => {
    NewsClear()
    showEditorModal = true
  }

  /**
   * Сохранение/изменение новости пользователя
   */
  const saveEditNews = async (news: INews, published: boolean) => {
    if (!UserData?.UserID) {
      addMessage(t('UserID - Undefined'))
      return console.error('saveEditNews UserData.UserID - не существует')
    }
    LoaderStore.set(true)
    /* Собираем пакет данных новости для отправки на сервер */
    const finalData: INews = {
      NewsID: news.NewsID || '',
      UserID: UserData.UserID,
      Title: news.Title || '',
      Brief: news.Brief || '',
      Content: news.Content || '',
      ImageTitle: news.ImageTitle || '',
      ImageContent: news.ImageContent || '',
      Published: published,
      Author: news.Author,
    }
    if (!finalData.Title || !finalData.Brief || !finalData.Content) {
      return addMessage(t('dashboard.news.'))
    }
    try {
      const updatedNews = await API_UserAddEditNews(finalData)
      if (updatedNews) {
        NewsUpsert(updatedNews)
      }
      showEditorModal = false
    } catch (error) {
      console.error(`Ошибка добавления/редактирования новости ${UserData.UserID}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /**
   * Получаем список всех новостей
   */
  const getUserNewsList = async () => {
    LoaderStore.set(true)
    NewsListClear()
    try {
      const newsList = await API_NewsList(UserData.UserID)
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

  /**
   * Удаляем новость по NewsID из базы данных
   */
  const deleteNews = async (NewsID: string) => {
    if (!UserData?.UserID) {
      return console.error('saveEditNews UserData.UserID - Undefined')
    }
    LoaderStore.set(true)
    try {
      const respons = await API_UserDeleteNews(UserData.UserID, NewsID)
      if (respons?.status.code === 200) {
        RemoveNewsFromStore(NewsID)
      }
    } catch (error) {
      console.error(`Ошибка удаления новости ${NewsID}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /**
   * Редактирование новости
   */
  const editNews = (NewsID: string) => {
    currentEditNews = get(NewsListStore).find((news) => news.NewsID === NewsID) || null
    if (currentEditNews) {
      NewsStore.set(currentEditNews)
      showEditorModal = true
    }
  }
</script>

<!-- Блок всех новостей с возможностями пользователя -->
<div class="flex h-full flex-col overflow-hidden">
  <div class="sticky top-0">
    <h2>{t('dashboard.news.title', currentLang)}</h2>
    <Button
      onClick={createNews}
      label={t('common.create', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-violet-700' }}
      className="m-4 h-10 w-60 rounded-2xl"
    />
    <Button
      onClick={getUserNewsList}
      label={t('common.update', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-violet-700' }}
      className="m-4 h-10 w-60 rounded-2xl"
    />
  </div>

  <div class="flex flex-col items-center justify-start overflow-y-auto">
    {#if currentLang}
      <NewsList {newsList} {currentLang} {isExpand} isAbilityEdit={true} onDelete={deleteNews} onEdit={editNews} onSaveEdit={saveEditNews} />
    {/if}
  </div>
</div>

<!-- Модальное окно для создания/редактирования новости -->
{#if showEditorModal && currentLang && currentTheme}
  <NewsEditorModal
    {currentEditNews}
    {currentLang}
    {currentTheme}
    {HandleImageUpload}
    onCancel={() => {
      showEditorModal = false
      NewsClear()
    }}
    onSave={saveEditNews}
  />
{/if}
