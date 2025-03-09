<!-- $lib/components/Navigation/Info.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import { ThemeStore, UserStore } from '../../../stores'
  import Button from '../UI/Button.svelte'
  import IconMenuInfo from '$lib/appIcons/MenuInfo.svelte'
  import type { IUser } from '../../../stores/Interfaces'

  /**
   * Подписки
   */
  let currentLang: string = $state('ru')
  let currentTheme: string = $state('light')
  let UserData: IUser | undefined = $state()
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value || 'ru')),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value || 'light')),
      User: UserStore.subscribe((value) => {
        UserData = value
      }),
    }

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  const changePage = (page: string) => {
    goto(`/news/${page}`)
  }
</script>

{#if UserData?.IsOnline}
  <div class="flex w-full flex-col items-center">
    <!-- Кнопка меню -->
    <Button
      onClick={() => changePage('')}
      label={t('nav.news', currentLang)}
      props={{ bgColor: currentTheme === 'light' ? 'bg-fuchsia-200' : 'bg-fuchsia-800', textAlignment: 'center' }}
      icon={IconMenuInfo}
      iconProps={{ width: '2rem', height: '2rem' }}
      className="m-1 h-12 w-[95%]"
    />
  </div>
{/if}
