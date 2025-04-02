<!-- src/routes/service/users/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import { SmartRequest } from '$lib/utils/SmartRequest'
  import { UserStore, UserStoreTemp, ThemeStore, UserUpdateTemp, UserClearTemp } from '../../../stores'
  import type { IUser, IOptionUI, IUserTemp } from '../../../stores/Interfaces'
  import { addMessage, LoaderStore } from '../../../stores'
  import { API_UserUpdate, API_UserDelete, API_UserAddDevice, API_ROUTES } from '$lib/utils/API'
  import { HandleImageUpload } from '$lib/utils/Common'

  import { DEFAULT_ROLES } from '../../../enums'
  import ConfirmDelete from '$lib/components/UI/ConfirmDelete.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Select from '$lib/components/UI/Select.svelte'
  import TextArea from '$lib/components/UI/TextArea.svelte'
  import IconProfile from '$lib/appIcons/MenuDashboardProfile.svelte'

  /* Подписки */
  let currentLang: string = $state('ru')
  let UserData: IUser | null = $state(null)
  let UserDataTemp: IUserTemp | null = $state(null)
  let currentTheme: string = $state('light')
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value)),
      User: UserStore.subscribe((value) => (UserData = value)),
      UserTemp: UserStoreTemp.subscribe((value) => (UserDataTemp = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    /* Получаем список пользователей */
    handleUsersListStart()

    /* Функция для очистки подписок */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* ПОЛУЧЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ (с авто пагинацией) */
  let container: HTMLElement | null = $state(null)
  let cursor: string | null = null
  const quantity: number = 15
  let user_list: IUser[] = $state([])
  const handleUsersListStart = async () => {
    currentSortField = null
    user_list = []
    cursor = null
    querySearch = ''
    await handleUserList()
  }
  const handleUserList = async () => {
    LoaderStore.set(true)
    const cursorParam = cursor ? `cursor=${cursor}` : 'cursor=null'
    try {
      const responseData = await SmartRequest(`${API_ROUTES.USER_LIST}?${cursorParam}&quantity=${quantity}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })

      if (!responseData?.user_list) {
        throw new Error('Invalid Response Data')
      }

      const newUsers: IUser[] = responseData.user_list.map((user: IUser) => ({
        UserID: user.UserID,
        EMail: user.EMail,
        Password: user.Password || '',
        NickName: user.NickName,
        Avatar: user.Avatar,
        Role: user.Role,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Department: user.Department,
        AboutMe: user.AboutMe,
        Country: user.Country,
        Region: user.Region,
        City: user.City,
        Address: user.Address,
        PostCode: user.PostCode,
        PhoneNumber: user.PhoneNumber,
        IsActivated: user.IsActivated,
        Tags: user.Tags || [],
        Devices: user.Devices || [],
        IsOnline: user.IsOnline || false,
      }))

      if (newUsers.length > 0) {
        user_list = [...user_list, ...newUsers]
        cursor = newUsers[newUsers.length - 1].UserID ?? null
      } else {
        cursor = null
      }
    } catch (error) {
      console.error('Ошибка handleUserList', error)
    } finally {
      LoaderStore.set(false)
    }
  }
  function handleScroll() {
    if (container) {
      const { scrollTop, clientHeight, scrollHeight } = container
      if (scrollTop + clientHeight >= scrollHeight - 50 && cursor !== null && !get(LoaderStore)) {
        handleUserList()
      }
    }
  }

  /* Активация аккаунта пользователя */
  const handleUserActDeactivation = async (UserID: string) => {
    const user = user_list.find((u) => u.UserID === UserID)
    if (!user?.UserID) return console.error(`handleUserActDeactivation ${UserID} - не существует`)
    LoaderStore.set(true)
    try {
      const updatedUser = {
        ...user,
        IsActivated: !user.IsActivated,
      }
      const responseUser = await API_UserUpdate(updatedUser, user.UserID, false)
      user_list = user_list.map((u) => (u.UserID === UserID ? responseUser : u))
    } catch (error) {
      console.error(`Ошибка активации пользователя ${UserID}: `, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Удаление профиля пользователя */
  let showModalDelete = $state(false)
  const handleUserDelete = (user: IUser) => {
    UserDataTemp = user
    showModalDelete = true
  }
  const confirmDelete = async () => {
    LoaderStore.set(true)
    try {
      const userId = UserDataTemp?.UserID
      if (!userId) {
        return console.error('UserDataTemp.UserID - не существует')
      }

      const responseData = await API_UserDelete(userId)
      if (responseData?.status.code === 200) {
        user_list = user_list.filter((u) => u.UserID !== userId)
      }
    } catch (error) {
      console.error(`Ошибка удаления аккаунта: `, error)
    } finally {
      UserClearTemp()
      UserDataTemp = null
      showModalDelete = false
      LoaderStore.set(false)
    }
  }

  /* Редактирование профиля пользователя */
  let selectedRole: IOptionUI | null = $state(null)
  let showModalEdit = $state(false)
  const handleUserEdit = (user: IUserTemp) => {
    if (!user) {
      console.log('handleUserEdit no user', user)
    }
    UserDataTemp = { ...user }
    const userTempRole = UserDataTemp.Role
    if (userTempRole === undefined) {
      return console.error('UserDataTemp.Role - не существует')
    }
    UserUpdateTemp(user)
    selectedRole = DEFAULT_ROLES.find((opt) => opt.id === userTempRole) || null
    showModalEdit = true
  }
  const saveUserChanges = async () => {
    if (!selectedRole || !UserDataTemp) {
      return console.error('saveUserChanges selectedRole or UserDataTemp - не существует')
    }
    UserDataTemp.Role = selectedRole.id
    try {
      const { UserID } = UserDataTemp
      if (!UserID) {
        return console.error('UserDataTemp.UserID - не существует')
      }
      const updatedUser = await API_UserUpdate(UserDataTemp, UserID, false)
      user_list = user_list.map((u) => (u.UserID === UserID ? updatedUser : u))
    } catch (error) {
      console.error(`Ошибка обновления профиля`, error)
    } finally {
      showModalEdit = false
      UserClearTemp()
    }
  }
  const cancelEdit = () => {
    showModalEdit = false
    UserClearTemp()
    UserDataTemp = null
  }

  /* Поиск профиля в базе данных */
  let querySearch = $state('')
  const handleUsersSearch = async () => {
    if (!querySearch) {
      return addMessage('ERR: Поисковый запрос пуст')
    }
    LoaderStore.set(true)
    try {
      const responseData = await SmartRequest(`${API_ROUTES.USER_SEARCH}?search=${encodeURIComponent(querySearch)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })
      if (responseData?.status.message) addMessage(responseData.status.message)
      if (!responseData?.user_list) {
        throw new Error('Invalid Response Data')
      }
      user_list = responseData?.user_list
      if (!Array.isArray(user_list)) {
        throw new Error('Invalid Response Data')
      }

      const newUsers: IUser[] = user_list.map((user: IUser) => ({
        UserID: user.UserID,
        EMail: user.EMail,
        Password: user.Password || '',
        NickName: user.NickName,
        Avatar: user.Avatar,
        Role: user.Role,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Department: user.Department,
        AboutMe: user.AboutMe,
        Country: user.Country,
        Region: user.Region,
        City: user.City,
        Address: user.Address,
        PostCode: user.PostCode,
        PhoneNumber: user.PhoneNumber,
        IsActivated: user.IsActivated,
        Tags: user.Tags || [],
        Devices: user.Devices || [],
        IsOnline: user.IsOnline || false,
      }))

      /* Очищаем стор и обновляем хранилище */
      user_list = []
      if (newUsers.length > 0) {
        user_list = [...user_list, ...newUsers]
      }
    } catch (error) {
      console.error(`Ошибка поиска ${querySearch}: `, error)
    } finally {
      querySearch = ''
      cursor = null
      LoaderStore.set(false)
    }
  }

  /* Добавление устройства в профиль пользователя */
  let serial_number = $state('')
  let selectedTag: IOptionUI | null = $state(null)
  const handleAddDevice = async () => {
    if (!serial_number || !UserDataTemp?.UserID || selectedTag?.id === undefined) {
      return console.error('handleAddDevice Неверные входные данные')
    }
    LoaderStore.set(true)
    try {
      await API_UserAddDevice(UserDataTemp.UserID, serial_number, selectedTag.id, false)
    } catch (error) {
      console.error(`Ошибка добавления устройства ${serial_number}`, error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Активный Tab по умолчанию */
  let activeTab = $state('main')

  /* Состояние и функции для сортировки */
  let currentSortField: keyof IUser | null = $state(null)
  let sortDirection: { [key: string]: 'asc' | 'desc' } = $state({
    NickName: 'asc',
    LastName: 'asc',
    Role: 'asc',
  })
  const sortUsers = (field: keyof IUser) => {
    const sortedUsers = [...user_list]
    if (currentSortField === field) {
      sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc'
    } else {
      sortDirection[field] = 'asc'
    }
    sortedUsers.sort((a, b) => {
      const aValue = typeof a[field] === 'string' ? a[field].toLowerCase() : String(a[field] ?? '')
      const bValue = typeof b[field] === 'string' ? b[field].toLowerCase() : String(b[field] ?? '')
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
      return 0
    })
    user_list = sortDirection[field] === 'asc' ? sortedUsers : sortedUsers.reverse()
    currentSortField = field
  }
</script>

<!-- Модуль работы с пользователями -->
{#if UserData?.IsOnline && UserData?.Role && ['MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Поиск по БД и ручной запрос списка пользователей -->
    <div class="sticky top-0 z-10">
      <h2>{t('service.user.title', currentLang)}</h2>
      <label for="search" class="mt-4 block">{t('service.user.title.search', currentLang)}</label>
      <div class="flex w-full items-center justify-center">
        <Input id="search" props={{ autocomplete: 'on', maxLength: 64 }} type="text" bind:value={querySearch} className="flex-grow mx-4 min-w-72" />
        <Button
          onClick={handleUsersSearch}
          label={t('common.search', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
          className="mx-4 w-48 rounded-2xl"
        />
        <Button
          onClick={() => handleUsersListStart()}
          label={t('common.update', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
          className="m-8 w-48 rounded-2xl"
        />
      </div>
    </div>

    <!-- Кастомизированная таблица для отображения устройств -->
    <div class="flex flex-grow flex-col overflow-hidden rounded-2xl border border-gray-400">
      <!-- Заголовок таблицы -->
      <div
        class={`sticky top-0 z-10 grid grid-cols-5 rounded-t-2xl border-gray-400 ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
        style="grid-template-columns: 10rem 10rem 20rem 15rem 1fr;"
      >
        <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('service.user.icon', currentLang)}</div>
        <button
          class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
          ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
          onclick={() => sortUsers('Role')}
        >
          {t('service.user.role_tabl', currentLang)}
          {currentSortField === 'Role' ? (sortDirection.Role === 'asc' ? '▼' : '▲') : ''}
        </button>
        <button
          class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
          ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
          onclick={() => sortUsers('LastName')}
        >
          {t('service.user.info', currentLang)}
          {currentSortField === 'LastName' ? (sortDirection.LastName === 'asc' ? '▼' : '▲') : ''}
        </button>
        <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('service.user.action', currentLang)}</div>
        <div class="border-b border-gray-400 p-2 font-semibold">{t('service.user.aboutme', currentLang)}</div>
      </div>

      <!-- Тело таблицы с прокруткой -->
      <div class={`flex-grow overflow-y-auto ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`} bind:this={container} onscroll={handleScroll}>
        {#each user_list as user (user.UserID)}
          <div class="grid grid-cols-5 items-center border-b border-gray-400" style="grid-template-columns: 10rem 10rem 20rem 15rem 1fr;">
            <div class="flex flex-shrink-0 items-center justify-center overflow-hidden border-r border-gray-400 p-2">
              <div class="flex h-32 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                <img src={`data:image/png;base64,${user.Avatar}`} alt="User Avatar" class="m-2 h-full w-full object-cover" />
              </div>
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              {t(`service.user.roles.${user.Role.toLowerCase()}`, currentLang)}
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              {user.LastName}
              {user.FirstName}<br />
              {user.PhoneNumber}<br />
              {user.EMail}<br />
              {user.UserID}
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
              {#if user.UserID !== $UserStore.UserID}
                <Button
                  onClick={() => handleUserEdit(user)}
                  label={t('common.edit', currentLang)}
                  props={currentTheme === 'light' ? { bgColor: 'bg-yellow-200' } : { bgColor: 'bg-yellow-800' }}
                  className="m-1 w-48 rounded-2xl"
                />
                <Button
                  onClick={() => user.UserID && handleUserActDeactivation(user.UserID)}
                  label={user.IsActivated ? t('common.block', currentLang) : t('common.activate', currentLang)}
                  props={{
                    bgColor: user.IsActivated
                      ? currentTheme === 'light'
                        ? 'bg-lime-200'
                        : 'bg-lime-800'
                      : currentTheme === 'light'
                        ? 'bg-yellow-200'
                        : 'bg-yellow-800',
                  }}
                  className="m-1 w-48 rounded-2xl"
                />
                <Button
                  onClick={() => handleUserDelete(user)}
                  label={t('common.delete', currentLang)}
                  props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
                  className="m-1 w-48 rounded-2xl"
                />
              {:else}
                <Button
                  onClick={() => goto(`/dashboard/profile`)}
                  label={t('service.user.edit_my_profile', currentLang)}
                  props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
                  className="m-1 h-20 w-48 rounded-2xl overflow-auto"
                  icon={IconProfile}
                  iconProps={{ width: '2rem', height: '2rem' }}
                />
              {/if}
            </div>
            <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-gray-400 p-2">
              {user.AboutMe}
            </div>
          </div>
        {/each}
      </div>

      <!-- Нижнее поле для сводной информации -->
      <div class={`z-10 flex h-8 items-center justify-center rounded-b-2xl border-t border-gray-400 ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}>
        <strong>{t('service.user.user_num')} {user_list.length}</strong>
      </div>
    </div>
  </div>
{/if}

<!-- Модальное окно удаления аккаунта -->
{#if UserDataTemp && currentLang}
  <ConfirmDelete
    show={showModalDelete}
    item={`${UserDataTemp?.LastName} ${UserDataTemp?.FirstName}`}
    {currentLang}
    onConfirm={confirmDelete}
    onCancel={() => {
      showModalDelete = false
      UserClearTemp()
      UserDataTemp = null
    }}
  />
{/if}

<!-- Модальное окно редактора аккаунта -->
{#if showModalEdit}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div
      class={`flex h-[70%] w-[80%] flex-col overflow-auto rounded-2xl p-5 text-center
      ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
    >
      <h2>{t('service.user.mod_title', currentLang)}</h2>

      <!-- Табы -->
      <div class="mb-4 flex justify-center space-x-4">
        <Button
          onClick={() => (activeTab = 'main')}
          label={t('service.user.main', currentLang)}
          props={{
            bgColor:
              activeTab === 'main' ? (currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800') : currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-800',
          }}
          className="m-2 w-60 h-12 rounded-2xl"
        />
        <Button
          onClick={() => (activeTab = 'location')}
          label={t('service.user.location', currentLang)}
          props={{
            bgColor:
              activeTab === 'location' ? (currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800') : currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-800',
          }}
          className="m-2 w-60 h-12 rounded-2xl"
        />
        <Button
          onClick={() => (activeTab = 'tags')}
          label={t('service.user.tags', currentLang)}
          props={{
            bgColor:
              activeTab === 'tags' ? (currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800') : currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-800',
          }}
          className="m-2 w-60 h-12 rounded-2xl"
        />
        <Button
          onClick={() => (activeTab = 'devices')}
          label={t('service.user.devices', currentLang)}
          props={{
            bgColor:
              activeTab === 'devices' ? (currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800') : currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-800',
          }}
          className="m-2 w-60 h-12 rounded-2xl"
        />
      </div>

      <!-- Основные данные -->
      {#if activeTab === 'main' && UserDataTemp}
        <div class="flex flex-col flex-wrap justify-center gap-4 md:flex-row">
          <!-- Первая колонка -->
          <div
            class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center p-2 
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
          >
            <label for="avatar" class="mb-1 block font-semibold">{t('service.user.avatar', currentLang)}</label>
            <div class="flex h-48 w-48 flex-shrink-0 items-center justify-center">
              <button
                class="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-white
                shadow transition-shadow duration-250 hover:shadow"
                onclick={() => {
                  const input = document.getElementById('avatar')
                  if (input) input.click()
                }}
              >
                {#if UserDataTemp.Avatar}
                  <img src={`data:image/png;base64,${UserDataTemp.Avatar}`} alt="avatar" class="h-full w-full object-cover" />
                {/if}
              </button>
              <input id="avatar" type="file" accept="image/*" class="hidden" onchange={(event) => HandleImageUpload(event, 'Avatar', UserStoreTemp)} />
              <input id="avatar" type="file" accept="image/*" class="hidden" onchange={(event) => HandleImageUpload(event, 'Avatar', UserStoreTemp)} />
            </div>
            <Input
              id="userId"
              props={{ autocomplete: 'off', maxLength: 64, disabled: true }}
              label={t('service.user.userid', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.UserID}
            />
            <Input
              id="nickName"
              props={{ autocomplete: 'username', maxLength: 64 }}
              label={t('service.user.nickname', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.NickName}
            />
            <Select
              id="Role"
              label={t('service.user.role', currentLang)}
              props={currentTheme === 'light' ? { bgColor: '!bg-blue-200', currentLang: currentLang } : { bgColor: '!bg-blue-800', currentLang: currentLang }}
              options={DEFAULT_ROLES}
              value={selectedRole}
              onUpdate={(value) => (selectedRole = value)}
              className="w-96"
            />
          </div>

          <!-- Вторая колонка -->
          <div
            class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center p-2 
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
          >
            <Input
              id="firstName"
              props={{ autocomplete: 'given-name', maxLength: 64 }}
              label={t('service.user.firstname', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.FirstName}
            />
            <Input
              id="lastName"
              props={{ autocomplete: 'family-name', maxLength: 64 }}
              label={t('service.user.lastname', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.LastName}
            />
            <Input
              id="department"
              props={{ autocomplete: 'off', maxLength: 64 }}
              label={t('service.user.department', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.Department}
            />
            <TextArea
              id="Description"
              props={{ maxLength: 250, rows: 2 }}
              className="w-96"
              label={t('service.user.aboutme', currentLang)}
              bind:value={UserDataTemp.AboutMe}
            />
            <Input
              id="email"
              props={{ autocomplete: 'email', maxLength: 64 }}
              label={t('service.user.email', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.EMail}
            />
            <Input
              id="phoneNumber"
              props={{ autocomplete: 'tel', maxLength: 64 }}
              label={t('service.user.tel', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.PhoneNumber}
            />
            <Input
              id="userPassword"
              type="password"
              props={{ autocomplete: 'new-password', maxLength: 64 }}
              label={t('service.user.password', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.Password}
            />
          </div>
        </div>
      {/if}

      <!-- Адрес -->
      {#if activeTab === 'location' && UserDataTemp}
        <div class="flex flex-col flex-wrap justify-center gap-4 md:flex-row">
          <div
            class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center p-2
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
          >
            <Input
              id="country"
              props={{ autocomplete: 'country-name', maxLength: 64 }}
              label={t('service.user.country', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.Country}
            />
            <Input
              id="region"
              props={{ autocomplete: 'address-level1', maxLength: 64 }}
              label={t('service.user.region', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.Region}
            />
            <Input
              id="city"
              props={{ autocomplete: 'address-level2', maxLength: 64 }}
              label={t('service.user.city', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.City}
            />
            <Input
              id="address"
              props={{ autocomplete: 'street-address', maxLength: 128 }}
              label={t('service.user.address', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.Address}
            />
            <Input
              id="postCode"
              props={{ autocomplete: 'postal-code', maxLength: 64 }}
              label={t('service.user.postcode', currentLang)}
              className="w-96"
              bind:value={UserDataTemp.PostCode}
            />
          </div>
        </div>
      {/if}

      <!-- Теги -->
      {#if activeTab === 'tags'}
        <div class="flex flex-col flex-wrap justify-center gap-4 md:flex-row">
          <div
            class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center p-2
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
          >
            <p class="mb-2 text-xl font-medium">{t('service.user.title_tags', currentLang)}</p>
            {#if UserDataTemp && Array.isArray(UserDataTemp.Tags)}
              {#each UserDataTemp.Tags as tag, index (tag.id)}
                <div class="mb-2 flex w-full items-center justify-center">
                  <Input
                    id={`${UserDataTemp.UserID}-Tag-${tag.id}`}
                    props={{ maxLength: 20 }}
                    bind:value={UserDataTemp.Tags[index].name}
                    className={`m-1 rounded-full ${tag.color}`}
                  />
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}

      <!-- Устройства -->
      {#if activeTab === 'devices' && UserDataTemp}
        <div class="flex flex-col flex-wrap justify-center gap-4 md:flex-row">
          <label for="add_device" class="mb-1 block font-semibold">{t('service.user.title_devices', currentLang)}</label>
          <div class="flex w-full items-center justify-center">
            <Input id="add_device" props={{ autocomplete: 'on', maxLength: 64 }} bind:value={serial_number} className="flex-grow mx-4 w-96" />
            <Select
              id="Tag"
              options={UserDataTemp.Tags}
              value={selectedTag}
              onUpdate={(value) => (selectedTag = value)}
              className="h-auto w-60"
              props={{ currentLang: currentLang }}
            />
            <Button
              onClick={handleAddDevice}
              label={t('common.add', currentLang)}
              props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
              className="mx-4 w-48 rounded-2xl"
            />
          </div>

          <br />
          <div class="w-full">
            <h3>{t('service.user.devices_list', currentLang)}</h3>
            {#if UserDataTemp && UserDataTemp.Devices.length > 0}
              {#each UserDataTemp.Devices as device (device.DevSN)}
                <p>{device.DevSN}</p>
              {/each}
            {:else}
              <p>{t('service.user.no_devices', currentLang)}</p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Кнопки -->
      <div class="mt-auto mb-4 flex justify-center">
        <Button
          onClick={cancelEdit}
          label={t('common.cancel', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
          className="m-2 w-60 rounded-2xl"
        />
        <Button
          onClick={saveUserChanges}
          label={t('common.save', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
          className="m-2 w-60 rounded-2xl"
        />
      </div>
    </div>
  </div>
{/if}
