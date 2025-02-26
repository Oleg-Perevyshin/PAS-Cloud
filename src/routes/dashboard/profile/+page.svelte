<!-- src/dashboard/profile/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import {
    UserStore,
    ThemeStore,
    UserClear,
    UserClearTemp,
    DeviceListClear,
    NewsListClear,
    LoaderStore,
    addMessage,
  } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import { API_UserGetProfile, API_UserUpdate, API_UserDelete } from '$lib/utils/API'
  import { HandleImageUpload } from '$lib/utils/Common'

  import ConfirmDelete from '$lib/components/UI/ConfirmDelete.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import TextArea from '$lib/components/UI/TextArea.svelte'

  /**
   * Подписки
   */
  let currentLang: string | undefined = $state()
  let UserData: IUser | undefined = $state()
  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value)),
      User: UserStore.subscribe((value) => (UserData = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    if (UserData?.UserID) {
      handleUserGet(true)
    }

    /* Функция для очистки подписок */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* Запрос данных о пользователе */
  const handleUserGet = async (isCurrentUser: boolean) => {
    if (UserData?.UserID === undefined) return addMessage('ERR: UserID не определен')
    LoaderStore.set(true)
    try {
      await API_UserGetProfile(UserData.UserID, isCurrentUser)
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Обновление данных пользователя */
  const handleUserUpdate = async () => {
    if (UserData?.UserID === undefined) return addMessage('ERR: UserID не определен')
    LoaderStore.set(true)
    try {
      await API_UserUpdate(UserData, UserData.UserID, true)
    } catch (error) {
      console.error('Ошибка обновления данных пользователя:', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Удаление аккаунта */
  let showModalDelete = $state(false)
  const confirmDelete = async () => {
    if (UserData?.UserID === undefined) return addMessage('ERR: UserID не определен')
    LoaderStore.set(true)
    try {
      await API_UserDelete(UserData.UserID)
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error)
    } finally {
      /* Очищаем все */
      localStorage.clear()
      UserClear()
      UserClearTemp()
      DeviceListClear()
      NewsListClear()
      goto('/')
      LoaderStore.set(false)
    }
    showModalDelete = false
  }
</script>

<!-- Основной контент -->
<div class="flex h-full flex-col items-center overflow-hidden">
  <div class="sticky top-0">
    <h2>{t('dashboard.profile.title', currentLang)}</h2>
  </div>

  <div class="flex flex-wrap items-start justify-center overflow-y-auto">
    <!-- Основные данные -->
    <div
      class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center rounded-2xl border p-4
      ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}`}
    >
      <p class="text-xl font-medium">{t('dashboard.profile.main', currentLang)}</p>
      <Input
        id="userId"
        props={{ autocomplete: 'off', lableAlign: 'text-center', disabled: true }}
        label={t('dashboard.profile.userid', currentLang)}
        className="w-full"
        bind:value={$UserStore.UserID}
      />

      <label for="avatar" class="mt-2 block font-semibold">{t('dashboard.profile.avatar', currentLang)}</label>
      <div class="flex h-48 w-48 flex-shrink-0 items-center justify-center">
        <button
          class="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-white"
          onclick={() => {
            const input = document.getElementById('avatar')
            if (input) input.click()
          }}
        >
          {#if $UserStore.Avatar}
            <img src={`data:image/png;base64,${$UserStore.Avatar}`} alt="avatar" class="h-full w-full object-cover" />
          {/if}
        </button>
        <input
          id="avatar"
          type="file"
          accept="image/png, image/jpeg"
          class="hidden"
          onchange={(event) => HandleImageUpload(event, 'Avatar', UserStore)}
        />
      </div>

      <Input
        id="nickName"
        props={{ autocomplete: 'username', maxLength: 64 }}
        label={t('dashboard.profile.nickname', currentLang)}
        className="w-full"
        bind:value={$UserStore.NickName}
      />
      <Input
        id="firstName"
        props={{ autocomplete: 'given-name', maxLength: 64 }}
        label={t('dashboard.profile.firstname', currentLang)}
        className="w-full"
        bind:value={$UserStore.FirstName}
      />
      <Input
        id="lastName"
        props={{ autocomplete: 'family-name', maxLength: 64 }}
        label={t('dashboard.profile.lastname', currentLang)}
        className="w-full"
        bind:value={$UserStore.LastName}
      />
      <TextArea
        id="aboutMe"
        props={{ maxLength: 250, rows: 2 }}
        label={t('dashboard.profile.aboutme', currentLang)}
        className="w-full"
        bind:value={$UserStore.AboutMe}
      />
      <Input
        id="email"
        props={{ autocomplete: 'email', maxLength: 64 }}
        label={t('dashboard.profile.email', currentLang)}
        className="w-full"
        bind:value={$UserStore.EMail}
      />
      <Input
        id="phoneNumber"
        props={{ autocomplete: 'tel', maxLength: 64 }}
        label={t('dashboard.profile.tel', currentLang)}
        className="w-full"
        bind:value={$UserStore.PhoneNumber}
      />
      <Input
        id="userPassword"
        type="password"
        props={{ autocomplete: 'new-password', maxLength: 64 }}
        label={t('dashboard.profile.password', currentLang)}
        className="w-full"
        bind:value={$UserStore.Password}
      />
    </div>

    <!-- Адрес -->
    <div
      class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center rounded-2xl border p-4
      ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}`}
    >
      <p class="text-xl font-medium">{t('dashboard.profile.location', currentLang)}</p>
      <Input
        id="country"
        props={{ autocomplete: 'country-name', maxLength: 64 }}
        label={t('dashboard.profile.country', currentLang)}
        className="w-full"
        bind:value={$UserStore.Country}
      />
      <Input
        id="region"
        props={{ autocomplete: 'address-level1', maxLength: 64 }}
        label={t('dashboard.profile.region', currentLang)}
        className="w-full"
        bind:value={$UserStore.Region}
      />
      <Input
        id="city"
        props={{ autocomplete: 'address-level2', maxLength: 64 }}
        label={t('dashboard.profile.city', currentLang)}
        className="w-full"
        bind:value={$UserStore.City}
      />
      <Input
        id="address"
        props={{ autocomplete: 'street-address', maxLength: 128 }}
        label={t('dashboard.profile.address', currentLang)}
        className="w-full"
        bind:value={$UserStore.Address}
      />
      <Input
        id="postCode"
        props={{ autocomplete: 'postal-code', maxLength: 32 }}
        label={t('dashboard.profile.postcode', currentLang)}
        className="w-full"
        bind:value={$UserStore.PostCode}
      />
    </div>

    <!-- Теги -->
    <div
      class={`m-2 flex max-w-[30rem] min-w-[20rem] flex-grow flex-col items-center rounded-2xl border p-4
      ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-700'}`}
    >
      <p class="text-xl font-medium">{t('dashboard.profile.tags', currentLang)}</p>
      {#if Array.isArray(UserData?.Tags)}
        {#each UserData.Tags as tag, index}
          <Input
            id={`${UserData.UserID}-Tag-${tag.id}`}
            props={{ maxLength: 20 }}
            bind:value={UserData.Tags[index].name}
            className={`m-1 rounded-full ${tag.color}`}
          />
        {/each}
      {/if}
    </div>
  </div>

  <!-- Кнопки УДАЛИТЬ и СОХРАНИТЬ -->
  <div class="mt-auto mb-8 flex flex-wrap justify-center">
    <!-- Кнопка УДАЛИТЬ -->
    <Button
      onClick={() => (showModalDelete = true)}
      label={t('dashboard.profile.delete', currentLang)}
      props={{ bgColor: 'bg-red-300' }}
      className="m-8 h-12 w-72 rounded-2xl"
    />

    <!-- Кнопка СОХРАНИТЬ -->
    <Button
      onClick={handleUserUpdate}
      label={t('dashboard.profile.save', currentLang)}
      props={{ bgColor: 'bg-green-300' }}
      className="m-8 h-12 w-72 rounded-2xl"
    />
  </div>
</div>

<!-- Модальное окно удаления аккаунта -->
{#if currentLang && UserData}
  <ConfirmDelete
    show={showModalDelete}
    item={UserData.UserID}
    {currentLang}
    onConfirm={confirmDelete}
    onCancel={() => (showModalDelete = false)}
  />
{/if}
