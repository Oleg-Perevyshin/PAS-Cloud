<!-- $lib/components/UserModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { LoaderStore } from '../../stores'
  import { ThemeStore } from '../../stores'
  import { API_UserGetInfo } from '$lib/utils/API'
  import type { IUser } from '../../stores/Interfaces'

  interface Props {
    UserID: string
    onClose: () => void
  }
  let { UserID, onClose }: Props = $props()

  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let userData: IUser | undefined = $state()

  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    getUser()

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  const getUser = async () => {
    LoaderStore.set(true)
    try {
      userData = await API_UserGetInfo(UserID)
    } catch (error) {
      console.error('Ошибка получения данных о пользователе: ', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  const handleBackgroundClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }
</script>

{#if userData}
  <button class="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onclick={handleBackgroundClick}>
    <div
      class={`flex max-h-[90vh] max-w-[90vw] flex-col overflow-auto rounded-2xl p-5 text-center
      ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
    >
      <h2>{t('common.dynamic.user', currentLang)}</h2>
      <div class="m-1 flex items-center justify-center p-2">
        {#if userData.Avatar}
          <div class="flex h-48 w-48 flex-shrink-0 items-center justify-center">
            <div class="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-white">
              <img src={`data:image/png;base64,${userData.Avatar}`} alt="avatar" class="h-full w-full object-cover" />
            </div>
          </div>
        {/if}
        <div class="ml-8 flex flex-col items-start">
          <p><strong>{t('common.dynamic.name', currentLang)}</strong> {userData.LastName} {userData.FirstName}</p>
          <p><strong>{t('common.dynamic.nickname', currentLang)}</strong> {userData.NickName}</p>
          <p><strong>{t('common.dynamic.department', currentLang)}</strong> {userData.Department}</p>
          <p><strong>{t('common.dynamic.email', currentLang)}</strong> {userData.EMail}</p>
          <p><strong>{t('common.dynamic.tel', currentLang)}</strong> {userData.PhoneNumber}</p>
          <p>
            <strong>{t('common.dynamic.role', currentLang)}</strong>
            {t(`service.user.roles.${userData.Role.toLowerCase()}`, currentLang)}
          </p>
          <p><strong>{t('common.dynamic.userid', currentLang)}</strong> {userData.UserID}</p>
          <p><strong>{t('common.dynamic.aboutme', currentLang)}</strong> {userData.AboutMe}</p>
        </div>
      </div>
    </div>
  </button>
{/if}
