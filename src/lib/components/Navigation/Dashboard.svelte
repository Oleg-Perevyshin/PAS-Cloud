<!-- $lib/components/Navigation/Dashboard.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { UserStore, ThemeStore } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import { goto } from '$app/navigation'
  import Button from '../UI/Button.svelte'

  import IconDashboard from '$lib/appIcons/MenuDashboard.svelte'
  import IconProfile from '$lib/appIcons/MenuDashboardProfile.svelte'
  import IconDevices from '$lib/appIcons/MenuDashboardDevices.svelte'
  import IconNews from '$lib/appIcons/MenuDashboardNews.svelte'
  import IconChat from '$lib/appIcons/MenuDashboardChat.svelte'

  /* Определение интерфейса для кнопки */
  interface ButtonConfig {
    key: string
    label: string
    page: string
    icon: typeof IconDashboard
    bgColor: string
    textColor: string
    role: string[]
  }

  /**
   * Подписки
   */
  let UserData: IUser | undefined = $state()
  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let buttons: ButtonConfig[] = $state([])
  onMount(() => {
    /* Подписка на изменение языка */
    const unsubscribeLanguage = Language.subscribe((value) => {
      currentLang = value
      initializeButtons()
    })

    /* Подписка на изменение UserStore */
    const unsubscribeUserStore = UserStore.subscribe((value) => {
      UserData = value
    })

    /* Подписка на ThemeStore */
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
      initializeButtons()
    })

    /* Инициализация кнопок при монтировании */
    initializeButtons()

    /* Очистка подписок и обработчиков событий */
    return () => {
      unsubscribeLanguage()
      unsubscribeUserStore()
      unsubscribeTheme()
    }
  })

  const initializeButtons = () => {
    buttons = [
      {
        key: 'nav.dashboard.profile',
        label: '',
        page: 'profile',
        icon: IconProfile,
        bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800',
        textColor: '',
        role: ['USER', 'ENGINEER', 'MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.dashboard.devices',
        label: '',
        page: 'devices',
        icon: IconDevices,
        bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800',
        textColor: '',
        role: ['ENGINEER', 'MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.dashboard.news',
        label: '',
        page: 'news',
        icon: IconNews,
        bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800',
        textColor: '',
        role: ['ENGINEER', 'MANAGER', 'ADMIN'],
      },
      {
        key: 'nav.dashboard.chat',
        label: '',
        page: 'chat',
        icon: IconChat,
        bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800',
        textColor: '',
        role: ['ENGINEER', 'MANAGER', 'ADMIN'],
      },
    ].map((button) => ({
      ...button,
      label: t(button.key, currentLang),
    }))
  }

  const changePage = (page: string) => {
    goto(`/dashboard/${page}`)
  }

  let isExpanded = false
  let submenuHeight: string = $state('0')
  let submenuRef: HTMLElement | undefined = $state()
  const toggleExpand = () => {
    isExpanded = !isExpanded
    submenuHeight = isExpanded ? `${submenuRef?.scrollHeight}px` : '0'
  }
</script>

{#if UserData?.IsOnline}
  <div class="flex w-full flex-col items-center">
    <!-- Кнопка меню -->
    <Button
      onClick={toggleExpand}
      label={t('nav.dashboard', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800', textAlignment: 'center' }}
      icon={IconDashboard}
      iconProps={{ width: '2rem', height: '2rem' }}
      className="m-1 h-12 w-[95%] rounded-2xl text-left"
    />

    <!-- Кнопки подменю -->
    <div bind:this={submenuRef} class="flex w-full flex-col overflow-hidden transition-all duration-500" style="max-height: {submenuHeight};">
      {#each buttons as button}
        {#if button.role.includes(UserData.Role)}
          <div class="mb-1">
            <Button
              onClick={() => changePage(button.page)}
              label={button.label}
              props={{ bgColor: button.bgColor, textColor: button.textColor, textAlignment: 'center' }}
              icon={button.icon}
              iconProps={{ width: '1.5rem', height: '1.5rem' }}
              className="m-0 h-10 w-[80%] rounded-2xl text-right"
            />
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}
