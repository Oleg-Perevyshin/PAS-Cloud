<!-- $lib/components/Navigation/Company.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { goto } from '$app/navigation'
  import Button from '../UI/Button.svelte'
  import IconMenuCompany from '$lib/appIcons/MenuCompany.svelte'
  import { ThemeStore } from '../../../stores'

  /**
   * Подписки
   */
  let currentLang: string = $state('ru')
  let currentTheme: string = $state('light')
  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      Language: Language.subscribe((value) => (currentLang = value || 'ru')),
      ThemeStore: ThemeStore.subscribe((value) => (currentTheme = value || 'light')),
    }

    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  const changePage = (page: string) => {
    goto(`/company/${page}`)
  }
</script>

<div class="flex w-full flex-col items-center">
  <!-- Кнопка меню -->
  <Button
    onClick={() => changePage('')}
    label={t('nav.company', currentLang)}
    props={{ bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800', textAlignment: 'center' }}
    icon={IconMenuCompany}
    iconProps={{ width: '2rem', height: '2rem' }}
    className="m-1 h-12 w-[95%]"
  />
</div>
