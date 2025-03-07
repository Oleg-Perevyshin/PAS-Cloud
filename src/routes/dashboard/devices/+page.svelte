<!-- src/routes/dashboard/devices/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { t, Language } from '$lib/locales/i18n'
  import { UserStore, ThemeStore, UserRemoveDevice, WebSocketStore, LoaderStore } from '../../../stores'
  import type { IUser, IOptionUI } from '../../../stores/Interfaces'
  import { API_UserGetDevices, API_UserAddDevice, API_UserDeleteDevice, API_UpdateDeviceTagID } from '$lib/utils/API'

  import ConfirmDelete from '$lib/components/UI/ConfirmDelete.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Select from '$lib/components/UI/Select.svelte'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import { addMessage } from '../../../stores'

  let UserData: IUser | undefined = $state()
  let currentLang: string | undefined = $state('ru')
  let currentTheme: string | undefined = $state()
  let UserGroupID: string | null = $state(null)
  let isExpanded: { [key: number]: boolean } = $state({})
  let selectedTag: IOptionUI | null = $state(null)
  let selectedTags: (IOptionUI | null)[] = $state([])
  let filteredDevices: IUser['Devices'] = $state([])

  /* Подписка на изменения в UserStore и Language */
  let isDataFetched = false
  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => {
        currentLang = value
        selectedTag = {
          id: 'tag-all',
          name: t('dashboard.device.reset', currentLang),
          value: 'tag-all',
          color: 'bg-pink-400 border-2 !border-pink-400',
        }
      }),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      User: UserStore.subscribe((value) => {
        UserData = value
        if (UserData.UserID && UserData.Devices && UserData.Tags) {
          selectedTags = UserData.Devices.map((device) => UserData?.Tags.find((tag) => tag.value === device.TagID) || null)
          filteredDevices = UserData.Devices
          if (isDataFetched === false) {
            getDeviceList(true)
            isDataFetched = true
          }
        } else {
          selectedTags = []
          filteredDevices = []
        }
      }),

      WebSocket: WebSocketStore.subscribe((state) => {
        /* Отслеживание списка групп */
        const group = state.groupList.find((g) => g.GroupName === UserData?.UserID)
        if (group && group.GroupID && UserGroupID !== group.GroupID) {
          UserGroupID = group.GroupID
          if (UserData?.UserID) {
            WebSocketStore.sendPacket('SYS', 'GroupList', { ClientID: UserData.UserID, GroupID: UserGroupID })
          }
        }
      }),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /* Получаем устройства пользователя */
  const getDeviceList = async (isCurrentUser: boolean) => {
    isExpanded = {}
    if (UserData === undefined) {
      return console.error('Не существует UserData.UserID')
    }
    LoaderStore.set(true)
    try {
      await API_UserGetDevices(UserData.UserID, isCurrentUser)
      /* Установливаем Тег по умолчанию в Select */
      if (UserData.Tags && UserData.Tags.length > 0) {
        selectedTagAdd = UserData.Tags[0]
      }
    } catch (error) {
      console.error('Ошибка получения списка устройств пользователя:', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Добавляем устройство в кабинет пользователя */
  let serial_number = $state('')
  let selectedTagAdd: IOptionUI | null = $state(null)
  const handleAddDevice = async () => {
    if (!serial_number || !UserData?.UserID || !selectedTagAdd?.id) {
      addMessage(`ERR: ${t('dashboard.device.err_data', currentLang)}`)
      console.error('handleAddDevice Неверные входные данные')
      return
    }

    LoaderStore.set(true)
    try {
      await API_UserAddDevice(UserData.UserID, serial_number, selectedTagAdd.id, true)
      selectedTags = UserData?.Devices.map((device) => UserData?.Tags.find((tag) => tag.value === device.TagID) || null) || []
      serial_number = ''
      getDeviceList(true)
    } catch (error) {
      console.error(`Ошибка добавления устройства ${serial_number}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Обновляем Тег устройства */
  const updateDeviceTag = async (index: number, tag: IOptionUI | null) => {
    if (!UserData) {
      return console.error('Ошибка updateDeviceTag - UserData не существует')
    }
    if (!tag?.value) {
      return console.error('Ошибка updateDeviceTag - tag не существует')
    }
    LoaderStore.set(true)
    try {
      await API_UpdateDeviceTagID(UserData.UserID, UserData.Devices[index].DevSN, tag.value, true)
      selectedTags[index] = tag
    } catch (error) {
      console.error(`Ошибка updateDeviceTag - обновление TagID устройства ${UserData.Devices[index]?.DevSN}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Обработчик для фильтрации устройств по тегу */
  const filterDevicesByTag = (tag: IOptionUI | null) => {
    if (!UserData) {
      console.error('Ошибка filterDevicesByTag - UserData не существует')
      filteredDevices = []
      selectedTags = []
      return
    }
    filteredDevices = tag ? UserData.Devices.filter((device) => device.TagID === tag.value) : UserData.Devices
    selectedTags = filteredDevices.map((device) => UserData?.Tags.find((tag) => tag.value === device.TagID) || null)
    isExpanded = {}
  }

  /* Удаление устройства пользователя */
  let deviceToDelete = $state({ UserID: '', DevSN: '' })
  let showModalDelete = $state(false)
  const openModal = (UserID: string, DevSN: string) => {
    deviceToDelete = { UserID: UserID, DevSN: DevSN }
    showModalDelete = true
  }
  const confirmDelete = async () => {
    LoaderStore.set(true)
    const responseData = await API_UserDeleteDevice(deviceToDelete.UserID, deviceToDelete.DevSN)
    if (responseData?.status.code === 200) {
      UserRemoveDevice(deviceToDelete.DevSN)
      showModalDelete = false
    }
    isExpanded = {}
    LoaderStore.set(false)
  }
</script>

<!-- Блок работы с устройствами пользователя -->
{#if UserData?.Role && ['ENGINEER', 'MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col">
    <h2>{t('dashboard.device.title', currentLang)}</h2>

    <!-- Блок добавления устройства -->
    <div class={`mt-4`}>
      <div class="flex w-full items-center justify-center">
        <Input
          id="add_device"
          props={{ autocomplete: 'on', maxLength: 32, placeholder: t('dashboard.device.device_sn', currentLang) }}
          bind:value={serial_number}
          className="flex-grow mx-4 w-96"
        />
        {#if UserData && UserData.Tags}
          <Select
            value={selectedTagAdd}
            onUpdate={(value) => (selectedTagAdd = value)}
            options={UserData.Tags}
            className="h-auto w-64"
            props={{ currentLang: currentLang }}
          />
        {/if}
        <Button
          onClick={handleAddDevice}
          label={t('dashboard.device.add', currentLang)}
          props={{ bgColor: currentTheme === 'light' ? 'bg-lime-200' : 'bg-lime-800' }}
          className="mx-4 w-48 rounded-2xl"
        />
      </div>
    </div>

    <!-- Селектор устройств (фильтрация по тегам) -->
    <div class={`mt-4 flex flex-col items-center`}>
      <p class="text-xl font-medium">{t('dashboard.device.tags', currentLang)}</p>
      <ButtonGroup
        id="tag-selector"
        className="m-1"
        options={[
          ...(UserData.Tags?.map((tag) => ({
            id: tag.value,
            name: tag.name,
            value: tag.value,
            color: tag.color,
          })) || []),
        ].reduce<IOptionUI[]>((acc, tag, index) => {
          acc.push(tag)
          if (index === 2) {
            acc.push({
              id: 'tag-all',
              name: t('dashboard.device.reset', currentLang),
              value: 'tag-all',
              color: 'bg-pink-400 border-2 !border-pink-400',
            })
          }
          return acc
        }, [])}
        value={selectedTag?.value}
        onChange={(value) => {
          selectedTag = value
          if (value.value === 'tag-all') {
            filterDevicesByTag(null)
          } else {
            filterDevicesByTag(value)
          }
        }}
      />
      <div class="flex flex-row">
        <Button
          label={t('common.update', currentLang)}
          props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800' }}
          className="m-2 w-40 rounded-2xl"
          onClick={() => getDeviceList(true)}
        />
      </div>
    </div>

    <!-- Блок отображения устройств -->
    <div class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-400">
      <!-- Тело блока устройств -->
      <div class={`flex flex-grow flex-col items-center justify-start overflow-y-auto ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}>
        <div class="mx-auto flex flex-wrap items-start justify-center p-2">
          {#if UserData && filteredDevices && filteredDevices.length > 0}
            {#each filteredDevices as device, index}
              <!-- Карточка устройства -->
              <div
                class={`
                  m-1 flex w-64 flex-col rounded-2xl border-4
                  ${UserData.Tags.find((tag) => tag.value === device.TagID)?.color || 'border-gray-400'}
                  shadow transition-shadow duration-250 hover:shadow
                  ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}
                  ${device.IsOnline === null ? '!bg-gray-300 backdrop-blur-sm' : ''}
                `}
              >
                <!-- Заголовок карточки -->
                <a
                  href={device.IsOnline ? `/dashboard/devices/${device.DevSN}` : '#'}
                  class={`flex h-16 items-start justify-between rounded-t-xl ${device.IsOnline ? 'cursor-pointer' : 'pointer-events-none'}`}
                >
                  <div class="mt-2 ml-2 flex h-14 w-14 flex-shrink-0 items-center justify-center">
                    <img src={device.CatIcon} alt="Device Icon" class="h-full w-full object-cover" style="object-fit: contain;" />
                  </div>
                  <div class="mt-2 mr-2 flex flex-col items-end justify-end">
                    <h5 class={`text-right underline ${device.IsOnline ? '' : 'text-gray-500'}`}>{device.DevName}</h5>
                    {#if device.IsOnline === false}
                      <p class="font-bold text-red-400 no-underline hover:no-underline focus:no-underline">OffLine</p>
                    {:else}
                      <p class="font-bold text-emerald-400 no-underline hover:no-underline focus:no-underline">OnLine</p>
                    {/if}
                  </div>
                </a>
                <hr class="border-gray-400" />
                <p class="m-1 text-xs text-gray-400">{device.DevSN}</p>
                <button
                  class="text-blue-500 hover:underline focus:outline-none"
                  onclick={() => {
                    isExpanded[index] = !isExpanded[index]
                  }}
                >
                  {isExpanded[index] ? t('common.collapse', currentLang) : t('common.expand', currentLang)}
                </button>

                {#if UserData && isExpanded[index]}
                  <div class="border-t" transition:slide={{ duration: 300 }}>
                    {#if UserData && UserData.Tags}
                      <Select
                        label={t('dashboard.device.change_tag', currentLang)}
                        value={selectedTags[index]}
                        onUpdate={(value) => {
                          selectedTags[index] = value
                          updateDeviceTag(index, value)
                        }}
                        options={UserData?.Tags || []}
                        className="m-2 h-auto w-56"
                        props={{ currentLang: currentLang }}
                      />
                    {/if}
                    <p>
                      <strong>DevID:</strong>
                      <a href={`/products/${device.DevID}`} class="text-blue-600 hover:underline"> {device.DevID} </a>
                    </p>
                    <p>{device.DevFW} | {device.CatVerFW}</p>
                    <div class="my-4 flex flex-col items-center justify-center gap-4">
                      <Button
                        onClick={() => openModal(UserData!.UserID, UserData!.Devices[index].DevSN)}
                        label={t('common.delete', currentLang)}
                        props={{ bgColor: 'bg-red-200' }}
                        className="w-48 rounded-2xl"
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/each}
          {:else}
            <p class="text-center text-gray-500">У пользователя нет устройств</p>
          {/if}
        </div>
      </div>

      <!-- Нижнее поле для сводной информации -->
      <div
        class={`flex h-8 items-center justify-center rounded-b-2xl border-t border-gray-400
        ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
      >
        <strong>{t('dashboard.device.devs_num')} {filteredDevices.length}</strong>
      </div>
    </div>
  </div>
{/if}

<!-- Модальное окно удаления устройства -->
{#if currentLang}
  <ConfirmDelete
    show={showModalDelete}
    item={deviceToDelete.DevSN}
    {currentLang}
    onConfirm={confirmDelete}
    onCancel={() => (showModalDelete = false)}
  />
{/if}
