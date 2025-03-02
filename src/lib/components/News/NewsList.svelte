<!-- $lib/components/News/NewsList.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { RenderMarkdown } from '$lib/utils/Common'
  import { NewsListStore, ThemeStore } from '../../../stores'
  import type { INews } from '../../../stores/Interfaces'
  import { slide } from 'svelte/transition'
  import ImageModal from './ImageModal.svelte'
  import Button from '../UI/Button.svelte'
  import UserModal from '../UserModal.svelte'

  interface Props {
    isExpand?: { [key: string]: boolean }
    isAbilityEdit?: boolean
    currentLang: string
    newsList?: INews[]
    onDelete?: (NewsID: string) => void
    onEdit?: (NewsID: string) => void
    onSaveEdit?: (news: INews, published: boolean) => void
  }

  let { isExpand = {}, isAbilityEdit = false, currentLang, newsList = [], onDelete, onEdit, onSaveEdit }: Props = $props()

  let currentTheme: string | undefined = $state()
  let renderedContents: string[] = $state([])

  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      News: NewsListStore.subscribe((value) => {
        newsList = value || []
        renderAllNews()
      }),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /* Прогон сообщений через парсер MD */
  const renderAllNews = async () => {
    try {
      renderedContents = await Promise.all(newsList.map(async (news) => await RenderMarkdown(news.Content)))
    } catch (error) {
      console.error('Ошибка при рендеринге Markdown:', error)
      renderedContents = renderedContents.map(() => '<p>Ошибка при рендеринге содержимого.</p>')
    }
  }

  const toggleExpand = (NewsID: string) => {
    isExpand = { ...isExpand, [NewsID]: !isExpand[NewsID] }
  }

  let selectedImage = $state('')

  let showModal = $state(false)
  let selectedUserID: string = $state('')
  const openModal = (UserID: string) => {
    selectedUserID = UserID
    showModal = true
  }
</script>

<!-- Разметка компонента -->
{#each newsList as news, index}
  <div class={`flex w-full flex-grow flex-col items-center justify-start`}>
    <div class={`m-2 mb-4 w-full overflow-hidden rounded-2xl border ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}>
      <div
        class={`mb-2 flex flex-row items-center justify-between border-b px-4
        ${news.Published ? (currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-violet-700') : 'bg-gray-400'}`}
      >
        <p>
          <strong>{t('news.author', currentLang)}</strong>
          <Button
            className={`border-0 rounded-2xl`}
            onClick={() => openModal(`${news.UserID}`)}
            label={`${news.Author?.LastName} ${news.Author?.FirstName}`}
          />
        </p>
        <p><strong>{t('news.date', currentLang)}</strong>{news.Updated}</p>
      </div>
      <div class="flex items-start">
        {#if news.ImageTitle}
          <button
            class="ml-2 flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-400"
            onclick={() => {
              selectedImage = `data:image/png;base64,${news.ImageTitle}`
            }}
          >
            <img src={`data:image/png;base64,${news.ImageTitle}`} alt="ImageTitle" class="h-full w-full object-cover" />
          </button>
        {/if}
        <div class="mx-4 flex flex-grow items-start justify-between">
          <div class="w-full text-left">
            <h4>{news.Title}</h4>
            <p class="text-justify">{news.Brief}</p>
          </div>
        </div>
      </div>

      <button class="text-blue-500 hover:underline" onclick={() => toggleExpand(news.NewsID)}>
        {isExpand[news.NewsID] ? t('common.collapse', currentLang) : t('common.expand', currentLang)}
      </button>

      {#if isExpand[news.NewsID]}
        <div class="mt-2" transition:slide={{ duration: 300 }}>
          <hr class="mb-4 border-gray-300" />
          <div class="m-2">
            <div class="text-justify text-sm">
              {#if news.ImageContent}
                <div class="float-right mb-2 ml-4 flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-400">
                  <button
                    onclick={() => {
                      selectedImage = `data:image/png;base64,${news.ImageContent}`
                    }}
                  >
                    <img src={`data:image/png;base64,${news.ImageContent}`} alt="ImageContent" class="h-full w-full object-cover" />
                  </button>
                </div>
              {/if}
              <!-- eslint-disable-next-line svelte/no-at-html-tags -->
              {@html renderedContents[index]}
            </div>
          </div>
          <div class="clear-both"></div>
          {#if isAbilityEdit}
            <hr class="mt-4 border-gray-300" />
            <div class="m-4 flex flex-row items-center justify-center">
              <Button
                onClick={() => onDelete?.(news.NewsID)}
                label={t('common.delete', currentLang)}
                props={{ bgColor: 'bg-red-300' }}
                className="m-1 w-40 rounded-2xl"
              />
              <Button
                onClick={() => onEdit?.(news.NewsID)}
                label={t('common.edit', currentLang)}
                props={{ bgColor: 'bg-yellow-300' }}
                className="m-1 w-40 rounded-2xl"
              />
              <Button
                onClick={() => onSaveEdit?.(news, !news.Published)}
                label={news.Published ? t('common.disable', currentLang) : t('common.publish', currentLang)}
                props={{ bgColor: news.Published ? 'bg-red-300' : 'bg-emerald-300' }}
                className="m-1 w-40 rounded-2xl"
              />
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/each}

<ImageModal
  imageSrc={selectedImage}
  onClose={() => {
    selectedImage = ''
  }}
/>

{#if showModal}
  <UserModal
    UserID={selectedUserID}
    onClose={() => {
      showModal = false
    }}
  />
{/if}
