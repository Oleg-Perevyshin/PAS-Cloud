<!-- src/routes/service/catalog/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { t, Language } from '$lib/locales/i18n'
  import { SmartRequest } from '$lib/utils/SmartRequest'
  import { ThemeStore, addMessage } from '../../../stores'
  import { API_CatalogUpdateDevice, API_CatalogDeleteDevice, API_CatalogDevice } from '$lib/utils/API'

  import type { ICatalogDevice, IOptionUI, IUser } from '../../../stores/Interfaces'
  import {
    CatalogStore,
    CatalogListStore,
    CatalogUpsertDevice,
    RemoveDeviceFromStore,
    CatalogDeviceDefault,
    DeviceListClear,
    UserStore,
    LoaderStore,
  } from '../../../stores'

  import ConfirmDelete from '$lib/components/UI/ConfirmDelete.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import CatalogAddEdit from '$lib/components/Catalog/CatalogAddEdit.svelte'
  import Select from '$lib/components/UI/Select.svelte'

  let showEditorModal = $state(false)
  let isEditing = $state(false)

  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let currentDevice: ICatalogDevice | null = $state(null)
  let catalogDeviceList: ICatalogDevice[] = $state([])
  let UserData: IUser | undefined = $state()

  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      Catalog: CatalogStore.subscribe(() => (currentDevice = get(CatalogStore))),
      CatalogList: CatalogListStore.subscribe((value) => (catalogDeviceList = value || [])),
      User: UserStore.subscribe((value) => (UserData = value)),
    }

    DeviceListClear()
    getDeviceList()

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /**
   * СОЗДАНИЕ / РЕДАКТИРОВАНИЕ УСТРОЙСТВА В КАТАЛОГЕ
   */
  const editDevice = (CatalogID: string) => {
    currentDevice = get(CatalogListStore).find((device) => device.CatalogID === CatalogID) || null
    if (currentDevice) {
      CatalogStore.set(currentDevice)
      isEditing = true
      showEditorModal = true
    }
  }
  const createDevice = () => {
    CatalogDeviceDefault()
    currentDevice = {
      Icon: '',
      CatalogID: '0000',
      CatalogName: 'PAS-Device',
      LatestFW: '0.1',
      CurrentFW: '',
      Versions: [],
      Language: 'ru',
      Brief: '',
      Description: '',

      Firmware: null,
      Manual: null,
      API: null,
      MetaData: '',

      Created: '',
      Updated: '',
    }
    isEditing = false
    showEditorModal = true
  }
  const cancelDevice = () => {
    CatalogDeviceDefault()
    cursor = null
    getDeviceList()
    isEditing = false
    showEditorModal = false
  }

  const saveDevice = async (updatedDevice: ICatalogDevice) => {
    if (!updatedDevice || !updatedDevice.CatalogID) {
      return addMessage(t('service.catalog.save_no_data'))
    }

    const formData = new FormData()
    Object.entries(updatedDevice).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value)
      }
    })

    try {
      const responseData = await API_CatalogUpdateDevice(formData)
      if (!responseData?.catalog) {
        throw new Error('Invalid Response Data')
      }
      cursor = null
      getDeviceList()
    } catch (error) {
      console.error('Ошибка при добавлении устройства:', error)
    } finally {
      CatalogDeviceDefault()
      isEditing = false
      showEditorModal = false
    }
  }

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

      /* Очищаем стор и обновляем хранилище */
      DeviceListClear()
      catalog.forEach((device) => {
        CatalogUpsertDevice(device)
      })
      cursor = null
    } catch (error) {
      console.error(`handleDevicesSearch Ошибка поиска ${querySearch}: `, error)
    } finally {
      cursor = null
      LoaderStore.set(false)
    }
  }

  /* УДАЛЕНИЕ УСТРОЙСТВА ИЗ КАТАЛОГА */
  let showModalDelete = $state(false)
  const handleDeleteDevice = (device: ICatalogDevice) => {
    currentDevice = device
    showModalDelete = true
  }
  const confirmDeleteDevice = async () => {
    if (currentDevice?.CatalogID === undefined) return console.error('Ошибка confirmDeleteDevice - currentDevice.CatalogID не существует')
    try {
      const responseData = await API_CatalogDeleteDevice(currentDevice.CatalogID, null)
      if (responseData?.status.code == 200) {
        RemoveDeviceFromStore(currentDevice.CatalogID)
      }
      showModalDelete = false
    } catch (error) {
      console.error('Ошибка при удалении устройства:', error)
    }
  }

  /* ПОЛУЧЕНИЕ СПИСКА УСТРОЙСТВ ИЗ КАТАЛОГА */
  let container: HTMLElement | null = $state(null)
  let cursor: string | null = null
  const quantity: number = 15
  const getDeviceList = async () => {
    currentSortField = null
    querySearch = ''
    LoaderStore.set(true)
    try {
      const responseData = await SmartRequest(`/api/catalog_list?${cursor ? `cursor=${cursor}` : 'cursor=null'}&quantity=${quantity}`, {
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
        cursor = catalog[catalog.length - 1].CatalogID || null
      } else {
        cursor = null
      }
    } catch (error) {
      console.error(error)
      addMessage('ERR: Ошибка при получении списка устройств')
    } finally {
      LoaderStore.set(false)
    }
  }
  function handleScroll() {
    if (!container) return
    const { scrollTop, clientHeight, scrollHeight } = container
    if (scrollTop + clientHeight >= scrollHeight - 50 && cursor !== null && !get(LoaderStore)) {
      getDeviceList()
    }
  }

  /* СОРТИРОВКА ДАННЫХ В ТАБЛИЦЕ */
  let currentSortField: keyof ICatalogDevice | null = $state(null)
  let sortDirection: { [key: string]: 'asc' | 'desc' } = $state({ CatalogID: 'asc', CatalogName: 'asc' })
  const sortDevices = (field: keyof ICatalogDevice) => {
    const sortedDevices = [...catalogDeviceList]

    /* Определяем направление сортировки */
    if (currentSortField === field) {
      sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc'
    } else {
      sortDirection[field] = 'asc'
    }

    /* Сортировка по полю CatalogID с учетом HEX */
    sortedDevices.sort((a, b) => {
      let aValue, bValue

      if (field === 'CatalogID') {
        /* Преобразуем HEX в числовое значение для сравнения */
        aValue = parseInt(a[field], 16)
        bValue = parseInt(b[field], 16)
      } else {
        /* Для других полей (например, CatalogName) */
        aValue = typeof a[field] === 'string' ? a[field].toLowerCase() : String(a[field] ?? '')
        bValue = typeof b[field] === 'string' ? b[field].toLowerCase() : String(b[field] ?? '')

        /* Разбиваем строки для сравнения */
        const segmentsA = aValue.split(/(\d+)/).map((segment) => (isNaN(Number(segment)) ? segment : Number(segment)))
        const segmentsB = bValue.split(/(\d+)/).map((segment) => (isNaN(Number(segment)) ? segment : Number(segment)))

        for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
          const valA = segmentsA[i] ?? ''
          const valB = segmentsB[i] ?? ''
          if (valA === undefined) return -1
          if (valB === undefined) return 1
          if (valA !== valB) {
            return valA < valB ? -1 : 1
          }
        }
        return 0 // Значения равны
      }

      /* Сравниваем значения для сортировки */
      return aValue < bValue ? -1 : 1
    })

    /* Обновление списка устройств в зависимости от направления сортировки */
    catalogDeviceList = sortDirection[field] === 'asc' ? sortedDevices : sortedDevices.reverse()
    currentSortField = field
  }
</script>

<!-- Модуль работы с каталогом -->
{#if UserData?.IsOnline && UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Модуль поиска по каталогу -->
    <div class="sticky top-0">
      <h2>{t('service.catalog.title', currentLang)}</h2>
      <div class="flex w-full items-center justify-center">
        <Button
          onClick={getDeviceList}
          label={t('common.update', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-blue-200' } : { bgColor: 'bg-blue-800' }}
          className="m-8 w-48 rounded-2xl"
        />
        <Input id="search" props={{ autocomplete: 'on', maxLength: 64 }} bind:value={querySearch} className="flex-grow mx-4 min-w-72" />
        <Button
          onClick={handleDevicesSearch}
          label={t('common.search', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
          className="mx-4 w-48 rounded-2xl"
        />
      </div>
      <Button
        onClick={createDevice}
        label={t('service.catalog.create', currentLang)}
        props={currentTheme === 'light' ? { bgColor: 'bg-blue-200' } : { bgColor: 'bg-blue-800' }}
        className="mb-4 h-14 w-72 rounded-2xl"
      />
    </div>

    <!-- Таблица для отображения устройств -->
    <div class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-400">
      <!-- Заголовок таблицы -->
      <div
        class={`grid-cols-6" sticky top-0 grid rounded-t-2xl border-gray-400
        ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
        style="grid-template-columns: 6rem 5rem 10rem 5rem 15rem 1fr;"
      >
        <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('catalog.icon', currentLang)}</div>
        <button
          class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
          ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
          onclick={() => sortDevices('CatalogID')}
        >
          {t('catalog.id', currentLang)}
          {currentSortField === 'CatalogID' ? (sortDirection.CatalogID === 'asc' ? '▲' : '▼') : ''}
        </button>
        <button
          class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
          ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
          onclick={() => sortDevices('CatalogName')}
        >
          {t('catalog.name', currentLang)}
          {currentSortField === 'CatalogName' ? (sortDirection.CatalogName === 'asc' ? '▲' : '▼') : ''}
        </button>
        <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('catalog.verfw', currentLang)}</div>
        <div class="border-r border-b border-gray-400 p-2 font-semibold">
          {t('service.catalog.action', currentLang)}
        </div>
        <div class="border-b border-gray-400 p-2 font-semibold">{t('catalog.brief', currentLang)}</div>
      </div>

      <!-- Тело таблицы с прокруткой -->
      <div class={`flex-grow overflow-y-auto ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`} bind:this={container} onscroll={handleScroll}>
        {#each catalogDeviceList as device (device.CatalogID)}
          <div class="grid grid-cols-6 items-center overflow-y-auto border-b border-gray-400" style="grid-template-columns: 6rem 5rem 10rem 5rem 15rem 1fr;">
            <div class="flex h-full flex-shrink-0 items-center justify-center overflow-hidden border-r border-gray-400">
              <div class="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden">
                <img src={device.Icon} alt="Device Icon" class="m-2 h-full w-full object-cover" />
              </div>
            </div>
            <a
              class="flex h-full flex-shrink-0 cursor-pointer flex-col items-center justify-center border-r border-gray-400 p-2 hover:underline"
              href={`/products/${device.CatalogID}`}>{device.CatalogID}</a
            >
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              {device.CatalogName}
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              <p>{device.LatestFW}</p>
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              <Button
                onClick={() => editDevice(device.CatalogID)}
                label={t('common.edit', currentLang)}
                props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
                className="m-1 w-48 rounded-2xl"
              />
              <Button
                onClick={() => handleDeleteDevice(device)}
                label={t('common.delete', currentLang)}
                props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
                className="m-1 w-48 rounded-2xl"
              />
            </div>
            <div class="flex h-full flex-shrink-0 p-2 text-justify">{device.Brief}</div>
          </div>
        {/each}
      </div>

      <!-- Нижнее поле для сводной информации -->
      <div
        class={`flex h-8 items-center justify-center rounded-b-2xl border-t border-gray-400
        ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
      >
        <strong>{t('catalog.nums')} {catalogDeviceList.length}</strong>
      </div>
    </div>
  </div>
{/if}

<!-- Модальное окно подтверждения удаления устройства из каталога -->
{#if currentLang && currentDevice}
  <ConfirmDelete
    show={showModalDelete}
    item={currentDevice?.CatalogID}
    {currentLang}
    onConfirm={confirmDeleteDevice}
    onCancel={() => (showModalDelete = false)}
  />
{/if}

<!-- Модальное окно для создания/редактирования устройства -->
{#if showEditorModal && currentLang && currentTheme}
  <CatalogAddEdit {currentDevice} {currentLang} {currentTheme} {isEditing} onCancel={cancelDevice} onSave={saveDevice} />
{/if}
