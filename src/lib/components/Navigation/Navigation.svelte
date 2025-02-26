<!-- $lib/components/Navigation/Navigation.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import type { IUser } from '../../../stores/Interfaces'
  import { UserStore, ThemeStore } from '../../../stores'
  import { goto } from '$app/navigation'
  import Button from '$lib/components/UI/Button.svelte'
  import Company from '$lib/components/Navigation/Company.svelte'
  import Catalog from '$lib/components/Navigation/Catalog.svelte'
  import Dashboard from '$lib/components/Navigation/Dashboard.svelte'
  import News from '$lib/components/Navigation/News.svelte'
  import Service from '$lib/components/Navigation/Service.svelte'
  import TestPage from './TestPage.svelte'

  import IconMenuOpen from '$lib/appIcons/MenuOpen.svelte'
  import IconMenuClose from '$lib/appIcons/MenuClose.svelte'

  import IconMenuCompany from '$lib/appIcons/MenuCompany.svelte'
  import IconMenuCatalog from '$lib/appIcons/MenuCatalog.svelte'
  import IconMenuDashboard from '$lib/appIcons/MenuDashboard.svelte'
  import IconMenuChat from '$lib/appIcons/MenuDashboardChat.svelte'
  import IconMenuInfo from '$lib/appIcons/MenuInfo.svelte'
  import IconService from '$lib/appIcons/MenuService.svelte'

  /**
   * Подписки
   */
  let currentTheme: string = $state('light')
  let UserData: IUser | undefined = $state()
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      ThemeStore: ThemeStore.subscribe((value) => (currentTheme = value || 'light')),
      UserStore: UserStore.subscribe((value) => (UserData = value)),
    }

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* Управление сварачиванием меню */
  let isExpanded = $state(true)
  const toggleNavigation = () => {
    isExpanded = !isExpanded
  }

  /* Переход по разделам меню */
  const changePage = (page: string) => {
    goto(`${page}`)
  }
</script>

<nav
  class={`m-2 ml-4 flex flex-col items-center rounded-xl p-2 text-center transition-all duration-500 select-none
       ${currentTheme === 'light' ? 'bg-gray-50' : 'bg-gray-800'} overflow-y-auto `}
  style="width: {isExpanded ? '16rem' : '7em'};"
>
  <!-- Кнопки сварачивания меню -->
  <button onclick={toggleNavigation} class="my-2 flex items-center justify-center">
    {#if isExpanded}
      <IconMenuClose width="2rem" height="2rem" />
    {:else}
      <IconMenuOpen width="2rem" height="2rem" />
    {/if}
  </button>

  <!-- Элементы меню -->
  {#if isExpanded}
    <Company />
    <News />
    <Catalog />
    <Dashboard />
    {#if UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role) && localStorage.getItem('IsOnline')}
      <Service />
    {/if}
    <TestPage />
  {:else}
    <div class="flex w-full flex-col items-center">
      <Button
        onClick={() => changePage('/company')}
        label="..."
        props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800', textAlignment: 'center' }}
        icon={IconMenuCompany}
        iconProps={{ width: '2rem', height: '2rem' }}
        className="m-1 h-12 w-[95%] rounded-2xl text-left"
      />

      {#if UserData?.IsOnline}
        <Button
          onClick={() => changePage('/news')}
          label="..."
          props={{ bgColor: currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-fuchsia-800', textAlignment: 'center' }}
          icon={IconMenuInfo}
          iconProps={{ width: '2rem', height: '2rem' }}
          className="m-1 h-12 w-[95%] rounded-2xl text-left"
        />

        <Button
          onClick={() => changePage('/catalog/modules')}
          label="..."
          props={{ bgColor: currentTheme === 'light' ? 'bg-orange-200' : 'bg-orange-800', textAlignment: 'center' }}
          icon={IconMenuCatalog}
          iconProps={{ width: '2rem', height: '2rem' }}
          className="m-1 mt-4 h-12 w-[95%] rounded-2xl text-left"
        />

        <Button
          onClick={() => changePage('/dashboard/profile')}
          label="..."
          props={{ bgColor: currentTheme === 'light' ? 'bg-green-200' : 'bg-green-800', textAlignment: 'center' }}
          icon={IconMenuDashboard}
          iconProps={{ width: '2rem', height: '2rem' }}
          className="m-1 h-12 w-[95%] rounded-2xl text-left"
        />

        <Button
          onClick={() => changePage('/chat')}
          label="..."
          props={{ bgColor: currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-800', textAlignment: 'center' }}
          icon={IconMenuChat}
          iconProps={{ width: '2rem', height: '2rem' }}
          className="m-1 h-12 w-[95%] rounded-2xl text-left"
        />

        {#if UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role)}
          <Button
            onClick={() => changePage('/service/catalog')}
            label="..."
            props={{ bgColor: currentTheme === 'light' ? 'bg-red-200' : 'bg-red-800', textAlignment: 'center' }}
            icon={IconService}
            iconProps={{ width: '2rem', height: '2rem' }}
            className="m-1 mt-4 h-12 w-[95%] rounded-2xl text-left"
          />
        {/if}
      {/if}
    </div>
  {/if}
</nav>
