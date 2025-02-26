<!-- $lib/lib/components/Navigation/Catalog.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import { UserStore, ThemeStore } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import Button from '../UI/Button.svelte'
  import IconMenuCatalog from '$lib/appIcons/MenuCatalog.svelte'
  import IconModules from '$lib/appIcons/MenuCatalogModules.svelte'
  import IconProducts from '$lib/appIcons/MenuCatalogProducts.svelte'
  import IconSystemTools from '$lib/appIcons/MenuCatalogSystem.svelte'
  import IconDevelopment from '$lib/appIcons/MenuCatalogDevelopment.svelte'

  /* Определение интерфейса для кнопки */
  interface ButtonConfig {
    key: string
    label: string
    page: string
    icon: typeof IconMenuCatalog
    bgColor: string
    textColor: string
    role: string[]
  }

  let currentLang: string = $state('ru')
  let currentTheme: string = $state('light')
  let UserData: IUser | undefined = $state()
  let buttons: ButtonConfig[] = $state([])
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => {
        currentLang = value || 'ru'
        initializeButtons()
      }),
      ThemeStore: ThemeStore.subscribe((value) => {
        currentTheme = value || 'light'
        initializeButtons()
      }),
      UserStore: UserStore.subscribe((value) => (UserData = value)),
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
        key: 'nav.catalog.modules',
        label: '',
        page: 'modules',
        icon: IconModules,
        bgColor: currentTheme === 'light' ? 'bg-orange-200' : 'bg-orange-800',
        textColor: '',
        role: ['USER', 'ENGINEER', 'ADMIN'],
      },
      {
        key: 'nav.catalog.products',
        label: '',
        page: 'products',
        icon: IconProducts,
        bgColor: currentTheme === 'light' ? 'bg-orange-200' : 'bg-orange-800',
        textColor: '',
        role: ['USER', 'ENGINEER', 'ADMIN'],
      },
      {
        key: 'nav.catalog.system',
        label: '',
        page: 'system',
        icon: IconSystemTools,
        bgColor: currentTheme === 'light' ? 'bg-orange-200' : 'bg-orange-800',
        textColor: '',
        role: ['ENGINEER', 'ADMIN'],
      },
      {
        key: 'nav.catalog.development',
        label: '',
        page: 'development',
        icon: IconDevelopment,
        bgColor: currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-700',
        textColor: '',
        role: ['ENGINEER', 'ADMIN'],
      },
    ].map((button) => ({
      ...button,
      label: t(button.key, currentLang),
    }))
  }

  /* Переход по страницам */
  const changePage = (page: string) => {
    goto(`/catalog/${page}`)
  }

  /* Управление подменю */
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
      label={t('nav.catalog', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-orange-200' : 'bg-orange-800', textAlignment: 'center' }}
      icon={IconMenuCatalog}
      iconProps={{ width: '2rem', height: '2rem' }}
      className="m-1 mt-4 h-12 w-[95%] rounded-2xl text-left"
    />

    <!-- Кнопки подменю -->
    <div
      bind:this={submenuRef}
      class="flex w-full flex-col overflow-hidden transition-all duration-500"
      style="max-height: {submenuHeight};"
    >
      {#each buttons.filter((button) => UserData?.Role && button.role.includes(UserData.Role)) as button}
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
      {/each}
    </div>
  </div>
{/if}
