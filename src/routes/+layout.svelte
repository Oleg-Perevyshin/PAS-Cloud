<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css'
  import { title, description } from '../appConfig'
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import LogoModule from '$lib/components/Top/Logo.svelte'
  import AuthorizationModule from '$lib/components/Top/Authorization.svelte'
  import NotificationsModule from '$lib/components/Top/Notifications.svelte'
  import LanguageModule from '$lib/components/Top/Language.svelte'
  import ThemeModule from '$lib/components/Top/Theme.svelte'
  import Navigation from '$lib/components/Navigation/Navigation.svelte'
  import { WebSocketStore, MessagesStore, ThemeStore, LoaderStore } from '../stores'
  import type { IPopUpMessage, IGroupMessage } from '../stores/Interfaces'
  import Loader from '$lib/components/UI/Loader.svelte'
  import MessageModal from '$lib/components/UI/MessageModal.svelte'
  import GlobalMessage from '$lib/components/GlobalMessage.svelte'
  interface Props {
    children?: import('svelte').Snippet
  }

  let { children }: Props = $props()

  /* Состояние для уведомления о новых сообщениях */
  let systemMessages: IGroupMessage | null | undefined = $state()

  /* Состояние для отображения модального окна */
  let showModal = $state(false)

  /* Подписки */
  let currentLang: string | undefined = $state()
  let messages: IPopUpMessage[] = $state([])
  let currentTheme: string | undefined = $state()
  let loading = $state(false)
  onMount(() => {
    /* Устанавливаем заголовки и метатеги */
    document.title = title
    const metaTags = [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
    ]

    metaTags.forEach(({ name, property, content }) => {
      const meta = document.querySelector(`meta${property ? `[property="${property}"]` : `[name="${name}"]`}`)
      if (meta) {
        meta.setAttribute('content', content)
      } else {
        const newMeta = document.createElement('meta')
        if (property) {
          newMeta.setAttribute('property', property)
        } else if (name) {
          newMeta.name = name
        }
        newMeta.content = content
        document.head.appendChild(newMeta)
      }
    })

    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      Messages: MessagesStore.subscribe((value) => (messages = value)),
      Loader: LoaderStore.subscribe((value) => (loading = value)),
      WebSocket: WebSocketStore.subscribe((state) => {
        systemMessages = state.systemMessages
        if (systemMessages !== null && systemMessages !== undefined) {
          showModal = true
        }
      }),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
      WebSocketStore.disconnect()
      WebSocketStore.cleanup()
    }
  })

  const children_render = $derived(children)
</script>

<!-- Разметка компонента layout -->
<div class={`mx-auto flex h-screen max-w-[1600px] flex-col justify-between ${currentTheme} transition-all duration-500`}>
  <!-- Header -->
  <div
    class={`m-2 mt-4 mr-4 ml-4 flex h-20 items-center justify-between rounded-xl p-1
    ${currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'}`}
  >
    <LogoModule />
    <div class="ml-auto flex items-center">
      <AuthorizationModule />
      <NotificationsModule />
      <LanguageModule />
      <ThemeModule />
    </div>
  </div>

  <!-- Center -->
  <div class={`flex flex-1 overflow-hidden`}>
    <!-- Панель навигации -->
    <Navigation />

    <!-- Основной контент с модальным окном загрузчика -->
    <main class={`relative m-2 mr-4 flex-1 overflow-hidden rounded-xl p-4 ${currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
      {@render children_render?.()}
      <Loader show={loading} />

      <!-- Всплывающие сообщения состояния -->
      <div class="absolute right-2 bottom-2 z-50 flex w-full flex-col-reverse items-end">
        {#each messages as message}
          <MessageModal {message} />
        {/each}
      </div>
    </main>
  </div>

  <!-- Footer -->
  <div
    class={`m-2 mr-4 mb-4 ml-4 flex h-10 items-center justify-center rounded-xl p-4 shadow-md
    ${currentTheme === 'light' ? 'bg-white' : 'bg-gray-800'}`}
  >
    <p class={`font-semibold`}>
      {t('common.footer', currentLang)}
      <a href="https://peleng.by" target="_blank" rel="noopener noreferrer">ОАО "Пеленг"</a>
      1974-{new Date().getFullYear()}
    </p>
  </div>

  <!-- Модальное окно с системным сообщением в группе System -->
  {#if currentLang}
    <GlobalMessage
      show={showModal}
      message={systemMessages}
      {currentLang}
      onConfirm={() => {
        showModal = false
        WebSocketStore.clearSystemMessages()
      }}
    />
  {/if}
</div>

<style>
  /* Стили для светлой темы */
  :global([data-theme='light']) {
    background-color: #def; /* Цвет фона для светлой темы */
    color: #333; /* Цвет текста для светлой темы */
  }

  /* Стили для темной темы */
  :global([data-theme='dark']) {
    background-color: #012; /* Цвет фона для темной темы */
    color: #fff; /* Цвет текста для темной темы */
  }
</style>
