<!-- src/routes/service/news/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { UserStore, UserStoreTemp, ThemeStore } from '../../../stores'
  import type { IUser, INews } from '../../../stores/Interfaces'
  import { NewsStore, NewsListStore, NewsUpsert, NewsListClear, NewsClear, RemoveNewsFromStore, addMessage, LoaderStore } from '../../../stores'
  import { API_UserAddEditNews, API_NewsList, API_UserDeleteNews } from '$lib/utils/API'
  import { HandleImageUpload } from '$lib/utils/Common'
  import { get } from 'svelte/store'
  import Button from '$lib/components/UI/Button.svelte'
  import NewsEditorModal from '$lib/components/News/NewsEditorModal.svelte'
  import NewsList from '$lib/components/News/NewsList.svelte'

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
  let UserData: IUser | undefined = $state()
  let UserDataTemp: IUser
  let newsList: INews[] = $state([])
  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписка на изменение языка */
    const unsubscribeLanguage = Language.subscribe((value) => {
      currentLang = value
    })

    /* Подписка на изменение UserStore */
    const unsubscribeUserStore = UserStore.subscribe((value) => {
      UserData = value
    })

    /* Подписка на изменение UserStoreTemp */
    const unsubscribeUserStoreTemp = UserStoreTemp.subscribe((value) => {
      UserDataTemp = value
    })

    /* Подписка на изменение NewsListStore */
    NewsListClear()
    getNewsList()
    const unsubscribeNewsList = NewsListStore.subscribe((value) => {
      newsList = value || []
    })

    /* Подписка на ThemeStore */
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    /* Очистка подписок и обработчиков событий */
    return () => {
      unsubscribeLanguage()
      unsubscribeUserStore()
      unsubscribeUserStoreTemp()
      unsubscribeNewsList()
      unsubscribeTheme()
    }
  })

  /**
   * Получаем список всех новостей
   */
  const getNewsList = async () => {
    LoaderStore.set(true)
    try {
      const newsList = await API_NewsList('')
      if (newsList) {
        NewsListClear()
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

  /* Сброс формы */
  const cancelNews = () => {
    NewsClear()
    showEditorModal = false
  }

  /**
   * Удаляем новость по NewsID из базы данных
   */
  const deleteNews = async (NewsID: string) => {
    if (!UserData?.UserID) {
      return console.error('deleteNews UserData.UserID - не существует')
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

  /**
   * Сохранение / изменений новости пользователя
   */
  const saveNews = async (news: INews, published: boolean) => {
    if (!news || !news.NewsID) {
      return addMessage(t('service.news.save_no_data'))
    }
    /* Собираем пакет данных новости для отправки на сервер */
    const finalData: INews = {
      NewsID: news.NewsID || '',
      UserID: news.UserID || UserData?.UserID || '',
      Title: news.Title || '',
      Brief: news.Brief || '',
      Content: news.Content || '',
      ImageTitle: news.ImageTitle || '',
      ImageContent: news.ImageContent || '',
      Published: published || false,
      Author: news.Author || {
        NickName: UserData?.NickName,
        Avatar: UserData?.Avatar,
        FirstName: UserData?.FirstName,
        LastName: UserData?.LastName,
        EMail: UserData?.EMail,
      },
    }
    if (!finalData.Title || !finalData.Brief || !finalData.Content) {
      return addMessage(t('service.news.save_no_data'))
    }
    LoaderStore.set(true)
    try {
      const updatedNews = await API_UserAddEditNews(finalData)
      if (updatedNews) {
        NewsUpsert(updatedNews)
      }
      showEditorModal = false
    } catch (error) {
      console.error(`Ошибка добавления/редактирования новости ${UserDataTemp.UserID}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }
</script>

<!-- Блок всех новостей -->
{#if UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col overflow-hidden">
    <div class="sticky top-0 z-10">
      <h2>{t('service.news.title', currentLang)}</h2>
      <Button
        onClick={getNewsList}
        label={t('common.update', currentLang)}
        props={{ bgColor: currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-fuchsia-800' }}
        className="m-4 h-10 w-60 rounded-2xl"
      />
    </div>

    <div class="flex flex-col items-center justify-start overflow-y-auto">
      {#if currentLang}
        <NewsList {newsList} {currentLang} {isExpand} isAbilityEdit={true} onDelete={deleteNews} onEdit={editNews} onSaveEdit={saveNews} />
      {/if}
    </div>
  </div>
{/if}

<!-- Модальное окно для редактирования новости -->
{#if showEditorModal && currentLang && currentTheme}
  <NewsEditorModal {currentEditNews} {currentLang} {currentTheme} {HandleImageUpload} onCancel={cancelNews} onSave={saveNews} />
{/if}
