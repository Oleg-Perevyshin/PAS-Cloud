<!-- src/routes/catalog/system/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { t, Language } from '$lib/locales/i18n'
  import type { ICatalogDevice, IUser } from '../../../stores/Interfaces'
  import { ThemeStore, CatalogListStore, DeviceListClear, UserStore, LoaderStore, addMessage, CatalogUpsertDevice } from '../../../stores'
  import { SmartRequest } from '$lib/utils/SmartRequest'
  import DeviceList from '$lib/components/Catalog/DeviceList.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'

  /* Настройки компонента */
  const startCursor: string = 'F000' /* Начало диапазона DevID для данной категории */
  const endCursor: string = 'FFFF' /* Конец диапазона DevID для данной категории */
  const quantity: number = 10 /* Размер данных при пагинации */

  let catalogDeviceList: ICatalogDevice[] = $state([])
  let UserData: IUser | undefined = $state()
  let currentLang: string = $state('ru')
  let currentTheme: string = $state('light')
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value || 'ru')),
      ThemeStore: ThemeStore.subscribe((value) => (currentTheme = value || 'light')),
      UserStore: UserStore.subscribe((value) => (UserData = value)),
      CatalogListStore: CatalogListStore.subscribe((value) => (catalogDeviceList = value || [])),
    }

    /* Получаем список устройств */
    handleDeviceListStart()

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* ПОИСК УСТРОЙСТВ В КАТАЛОГЕ */
  let querySearch = $state('')
  const handleDevicesSearch = async () => {
    if (!querySearch) {
      return addMessage('ERR: Поисковый запрос пуст')
    }
    LoaderStore.set(true)
    try {
      const responseData = await SmartRequest(`/api/catalog_search?search=${encodeURIComponent(querySearch)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })
      if (responseData?.status.message) {
        addMessage(responseData.status.message)
      }

      /* Проверяем, список устройств должен быть массивом */
      const catalog = responseData?.catalog_list
      if (!Array.isArray(catalog)) {
        throw new Error('Invalid Response Data')
      }

      /* Обновляем хранилище, заменяя существующие устройства */
      DeviceListClear()
      catalog.forEach((device) => {
        CatalogUpsertDevice(device)
      })
    } catch (error) {
      console.error(`handleDevicesSearch Ошибка поиска ${querySearch}: `, error)
    } finally {
      querySearch = ''
      LoaderStore.set(false)
    }
  }

  /* СПИСОК УСТРОЙСТВ ИЗ КАТАЛОГА */
  let cursor: string | null = null
  const handleDeviceListStart = async () => {
    DeviceListClear()
    catalogDeviceList = []
    cursor = null
    querySearch = ''
    await getDeviceList()
  }
  const getDeviceList = async () => {
    LoaderStore.set(true)
    try {
      let responseData = null
      responseData = await SmartRequest(`/api/catalog_list?startCursor=${startCursor}&endCursor=${endCursor}&cursor=${cursor}&quantity=${quantity}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })

      /* Проверяем, список устройств должен быть массивом */
      const catalog = responseData?.catalog_list
      if (!Array.isArray(catalog)) {
        throw new Error('Invalid Response Data')
      }

      /* Обновляем хранилище, заменяя существующие устройства */
      catalog.forEach((device) => {
        CatalogUpsertDevice(device)
      })

      /* Обновляем курсор, если были получены новые устройства */
      if (catalog.length > 0) {
        cursor = catalog[catalog.length - 1].CatalogID ?? null
      } else {
        cursor = null
      }
    } catch (error) {
      console.error('getDeviceList Ошибка при получении списка устройств', error)
      addMessage('ERR: Ошибка при получении списка устройств')
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Обработчик запросов при пагинации */
  let container: HTMLElement | null
  function handleScroll() {
    if (container) {
      const { scrollTop, clientHeight, scrollHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 50 && cursor !== null && !get(LoaderStore)) {
        getDeviceList()
      }
    }
  }
</script>

<!-- Разметка компонента -->
<h2>{t('catalog.system.title', currentLang)}</h2>
{#if UserData?.Role && ['ENGINEER', 'MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Модуль поиска по каталогу -->
    <div class="sticky top-0">
      <div class="flex w-full items-center justify-center">
        <Input id="search" props={{ autocomplete: 'on', maxLength: 64 }} bind:value={querySearch} className="flex-grow mx-4 min-w-72" />
        <Button
          onClick={handleDevicesSearch}
          label={t('common.search', currentLang)}
          props={{ bgColor: currentTheme === 'light' ? 'bg-lime-200' : 'bg-lime-800' }}
          className="mx-4 w-48 rounded-2xl"
        />
        <Button
          onClick={handleDeviceListStart}
          label={t('common.update', currentLang)}
          props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800' }}
          className="m-8 w-48 rounded-2xl"
        />
      </div>
    </div>

    <!-- Таблица для отображения устройств -->
    <DeviceList
      {catalogDeviceList}
      {currentLang}
      {currentTheme}
      onScroll={handleScroll}
      bindContainer={(element) => {
        container = element
      }}
    />
  </div>
{/if}
