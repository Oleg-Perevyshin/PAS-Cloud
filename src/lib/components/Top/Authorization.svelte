<!-- $lib/components/Header/Authorization.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import { API_ROUTES } from '$lib/utils/API'
  import { WebSocketStore, DeviceListClear, addMessage, LoaderStore } from '../../../stores'
  import { SmartRequest } from '$lib/utils/SmartRequest'
  import IconRegistration from '$lib/appIcons/AuthRegistration.svelte'
  import IconLogin from '$lib/appIcons/AuthLogin.svelte'
  import IconLogout from '$lib/appIcons/LogOut.svelte'
  import Input from '../UI/Input.svelte'
  import Button from '../UI/Button.svelte'
  import { UserStore, ThemeStore, UserUpdate, UserClear, UserClearTemp, NewsListClear } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import type { IResponseData } from '$lib/utils/SmartRequest'
  import { slide } from 'svelte/transition'
  import { DEFAULT_TAGS } from '../../../enums'

  /**
   * Переменные компонента авторизации
   */
  let emailField: string = $state('user_1@gmail.com')
  let passwordField: string = $state('1Qaz2Wsx')
  let showUserCardModal = $state(false)

  /**
   * Подписки
   */
  let UserData: IUser | undefined = $state()
  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let groups: { GroupID: string; GroupName: string; FirstName: string; LastName: string }[] = $state([])
  onMount(() => {
    /* Установка значений по умолчанию в localStorage */
    if (localStorage.getItem('IsOnline') === null) {
      localStorage.setItem('IsOnline', 'false')
    }

    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      User: UserStore.subscribe((value) => (UserData = value)),
      WebSocket: WebSocketStore.subscribe((state) => {
        groups = state.groupList.map((group) => ({
          GroupID: group.GroupID ?? '',
          GroupName: group.GroupName ?? '',
          FirstName: group.FirstName ?? '',
          LastName: group.LastName ?? '',
        }))
      }),
    }

    /* Определяем личную группу и подключаемся к ней */
    if (UserData) {
      const defaultGroup = groups.find((group) => group.GroupName === UserData?.UserID)
      if (defaultGroup) {
        WebSocketStore.sendPacket('SYS', 'JoinGroup', { ClientID: UserData.UserID, GroupID: defaultGroup.GroupID })
      }
    }

    /* Обработка кликов вне модального окна */
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target && !target.closest('.modal-user-card') && !target.closest('.icon-user')) {
        showUserCardModal = false
      }
    }

    /* Добавление обработчика события клика */
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside)
    }

    /* Проверка на локальное хранилище */
    if (localStorage.getItem('IsOnline') === 'true') {
      Relogin()
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handleClickOutside)
      }
    }
  })

  /* Регистрация пользователя */
  const Register = async () => {
    LoaderStore.set(true)
    try {
      const response = await fetch(`${API_ROUTES.AUTH_REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        body: JSON.stringify({ EMail: emailField, Password: passwordField }),
      })
      if (!response) throw new Error('Invalid Response Data')
      const responseData = await response.json()
      if (responseData?.status.message) addMessage(responseData.status.message)
    } catch (error) {
      console.error('Ошибка регистрации пользователя', error)
    } finally {
      showUserCardModal = false
      localStorage.clear()
      UserClear()
      UserClearTemp()
      DeviceListClear()
      goto('/')
      LoaderStore.set(false)
    }
  }

  /* Авторизация на портале */
  const Login = async () => {
    LoaderStore.set(true)
    try {
      const response = await fetch(`${API_ROUTES.AUTH_LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        body: JSON.stringify({ EMail: emailField, Password: passwordField }),
      })
      if (!response.ok) {
        const responseData: IResponseData = await response.json()
        return addMessage(responseData.status.message)
      }
      const responseData: IResponseData = await response.json()
      if (responseData?.status.message) addMessage(responseData.status.message)
      if (responseData.status.code === 201) {
        /* Создаем объект UserData */
        const UserData = {
          ...responseData.user,
          Devices: Array.isArray(responseData.user.Devices) ? responseData.user.Devices : [],
          Tags: Array.isArray(responseData.user.Tags) ? responseData.user.Tags : DEFAULT_TAGS,
        } as IUser
        UserUpdate(UserData)
        localStorage.setItem('IsOnline', responseData.user.IsOnline.toString())
        WebSocketStore.connect(import.meta.env.VITE_WS_URL, UserData.UserID)
      } else {
        showUserCardModal = false
        WebSocketStore.disconnect()
        UserClear()
        UserClearTemp()
        DeviceListClear()
        goto('/')
      }
    } catch (error) {
      console.error('Ошибка при Login', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Выход из личного кабинета */
  const Logout = async () => {
    LoaderStore.set(true)
    try {
      await fetch(`${API_ROUTES.AUTH_LOGOUT}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })
    } catch (error) {
      console.error('Ошибка при Logout', error)
    } finally {
      /* Выход из всех комнат перед отключением */
      WebSocketStore.sendPacket('SYS', 'LeaveGroups', {})
      WebSocketStore.disconnect()
      localStorage.clear()
      showUserCardModal = false
      UserClear()
      UserClearTemp()
      DeviceListClear()
      NewsListClear()
      goto('/')
      LoaderStore.set(false)
    }
  }

  /* Повторная авторизация, реализована через Refresh Token (например при перезагрузке страницы) */
  const Relogin = async () => {
    LoaderStore.set(true)
    try {
      const responseData = await SmartRequest(`${API_ROUTES.AUTH_RELOGIN}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
        },
        credentials: 'include',
      })
      if (responseData?.status.message) addMessage(responseData.status.message)
      if (!responseData?.user) {
        localStorage.clear()
        showUserCardModal = false
        WebSocketStore.disconnect()
        UserClear()
        UserClearTemp()
        DeviceListClear()
        goto('/')
        throw new Error('Relogin: Неверный ответ от сервера')
      }
      /* Создаем объект UserData */
      const UserData = {
        ...responseData.user,
        Devices: Array.isArray(responseData.user.Devices) ? responseData.user.Devices : [],
        Tags: Array.isArray(responseData.user.Tags) ? responseData.user.Tags : DEFAULT_TAGS,
      } as IUser
      UserUpdate(UserData)
      localStorage.setItem('IsOnline', responseData.user.IsOnline.toString())
      WebSocketStore.connect(import.meta.env.VITE_WS_URL, UserData.UserID)
    } catch (error) {
      console.error('Ошибка при Relogin', error)
    } finally {
      LoaderStore.set(false)
    }
  }
</script>

<!-- Разметка компонента -->
<div class="relative flex flex-row flex-nowrap items-center justify-end">
  {#if UserData?.IsOnline}
    {#if showUserCardModal}
      <div
        class={`modal-user-card static z-50 h-14 w-64 rounded-2xl border border-gray-400 bg-gray-200 px-1
        ${currentTheme === 'light' ? 'bg-gray-100' : 'bg-gray-500'}`}
        transition:slide={{ duration: 300, axis: 'y' }}
      >
        <div class="flex h-full flex-wrap items-center justify-between p-2">
          <div class="flex flex-col items-start justify-center">
            <p class="text-base font-bold">{UserData.NickName}</p>
            <p class="text-xs italic">{`ID: ${UserData.UserID}`}</p>
          </div>
          <button class="cursor-pointer" onclick={Logout}><IconLogout width="1.5rem" height="1.5rem" /></button>
        </div>
      </div>
    {/if}

    <button
      class="icon-user relative m-1 flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-gray-400"
      tabindex="0"
      onclick={() => {
        showUserCardModal = !showUserCardModal
      }}
    >
      {#if $UserStore.Avatar}
        <img src={`data:image/png;base64,${$UserStore.Avatar}`} alt="avatar" class="h-full w-full object-cover" />
      {/if}
    </button>
  {/if}

  {#if !UserData?.IsOnline}
    <div class="grid grid-cols-2 gap-1">
      <div class="flex items-center justify-center">
        <Input
          className="w-full max-w-xs"
          id="email"
          props={{ autocomplete: 'email', maxLength: 64, placeholder: t('auth.email', currentLang) }}
          bind:value={emailField}
        />
      </div>
      <div class="flex items-center justify-center">
        <Button
          label={t('auth.register', currentLang)}
          props={{ bgColor: 'bg-blue-400' }}
          onClick={Register}
          icon={IconRegistration}
          className="w-full max-w-xs rounded-2xl"
        />
      </div>

      <div class="flex items-center justify-center">
        <Input
          className="w-full max-w-xs"
          id="password"
          props={{ autocomplete: 'current-password', maxLength: 64, placeholder: t('auth.password', currentLang) }}
          bind:value={passwordField}
          onKeyPress={(key) => key === 'Enter' && Login()}
          type="password"
        />
      </div>
      <div class="flex items-center justify-center">
        <Button
          label={t('auth.login', currentLang)}
          props={{ bgColor: 'bg-green-400' }}
          onClick={Login}
          icon={IconLogin}
          className="w-full max-w-xs rounded-2xl"
        />
      </div>
    </div>
  {/if}
</div>
