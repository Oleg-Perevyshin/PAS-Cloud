<!-- $lib/components/Navigation/Dashboard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { UserStore, ThemeStore } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import { goto } from '$app/navigation'
  import Button from '../UI/Button.svelte'

  import IconService from '$lib/appIcons/MenuService.svelte'
  import IconMenuCatalog from '$lib/appIcons/MenuCatalog.svelte'
  import IconProfile from '$lib/appIcons/MenuDashboardProfile.svelte'
  import IconNews from '$lib/appIcons/MenuDashboardNews.svelte'
  import IconWebSocket from '$lib/appIcons/WebSocket.svelte'

  /* Определение интерфейса для кнопки */
  interface ButtonConfig {
    key: string
    label: string
    page: string
    icon: typeof IconService
    bgColor: string
    textColor: string
    role: string[]
  }

  /**
   * Подписки
   */
  let UserData: IUser | undefined = $state()
  let currentLang: string | undefined = $state()
  let currentTheme: string = $state('light')
  let buttons: ButtonConfig[] = $state([])
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => {
        currentLang = value || 'ru'
        initializeButtons()
      }),
      Theme: ThemeStore.subscribe((value) => {
        currentTheme = value || 'light'
        initializeButtons()
      }),
      User: UserStore.subscribe((value) => {
        UserData = value
      }),
    }

    /* Инициализация кнопок при монтировании */
    initializeButtons()

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  const initializeButtons = () => {
    buttons = [
      {
        key: 'nav.service.catalog',
        label: '',
        page: '/service/catalog',
        icon: IconMenuCatalog,
        bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
        textColor: '',
        role: ['ADMIN'],
      },
      {
        key: 'nav.service.ui-constructor',
        label: '',
        page: '/service/ui-constructor',
        icon: IconWebSocket,
        bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
        textColor: '',
        role: ['MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.service.users',
        label: '',
        page: '/service/users',
        icon: IconProfile,
        bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
        textColor: '',
        role: ['MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.service.info',
        label: '',
        page: '/service/news',
        icon: IconNews,
        bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
        textColor: '',
        role: ['MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.service.websocket',
        label: '',
        page: '/service/websocket',
        icon: IconWebSocket,
        bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800',
        textColor: '',
        role: ['MANAGER', 'ADMIN'],
      },
    ].map((button) => ({
      ...button,
      label: t(button.key, currentLang),
    }))
  }

  const changePage = (page: string) => {
    goto(`${page}`)
  }

  let isExpanded = false
  let submenuHeight: string = $state('0')
  let submenuRef: HTMLElement | undefined = $state()
  const toggleExpand = () => {
    isExpanded = !isExpanded
    submenuHeight = isExpanded ? `${submenuRef?.scrollHeight}px` : '0'
  }
</script>

{#if UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex w-full flex-col items-center">
    <!-- Кнопка меню -->
    <Button
      onClick={toggleExpand}
      label={t('nav.service', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800', textAlignment: 'center' }}
      icon={IconService}
      iconProps={{ width: '2rem', height: '2rem' }}
      className="m-1 mt-4 h-12 w-[95%]"
    />

    <!-- Кнопки подменю -->
    <div bind:this={submenuRef} class="flex w-full flex-col overflow-hidden transition-all duration-500" style="max-height: {submenuHeight};">
      {#each buttons as button (button.key)}
        {#if button.role.includes(UserData.Role)}
          <div class="mb-1">
            <Button
              onClick={() => changePage(button.page)}
              label={button.label}
              props={{ bgColor: button.bgColor, textColor: button.textColor, textAlignment: 'center' }}
              icon={button.icon}
              iconProps={{ width: '1.5rem', height: '1.5rem' }}
              className="m-0 h-10 !w-[80%]"
            />
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}
