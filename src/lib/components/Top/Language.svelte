<!-- $lib/components/Header/Language.svelte -->
<script lang="ts">
  import { Language, LOCALES } from '$lib/locales/i18n'
  import { fade } from 'svelte/transition'
  import { onMount } from 'svelte'
  import { ThemeStore } from '../../../stores'

  let showLanguageModal = $state(false)
  let currentLanguage = $state(LOCALES[0])
  let currentTheme: string | undefined = $state()

  /* Загрузка языка из локального хранилища при монтировании компонента */
  onMount(() => {
    const savedLanguage = localStorage.getItem('AppLanguage')
    if (savedLanguage) {
      const lang = LOCALES.find((lang) => lang.code === savedLanguage)
      if (lang) {
        currentLanguage = lang
        Language.set(lang.code)
      }
    }

    /* Подписка на ThemeStore */
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    /* Удаление обработчика при размонтировании */
    return () => {
      unsubscribeTheme()
    }
  })

  /* Переключение языка */
  function switchLanguage(code: string) {
    const lang = LOCALES.find((lang) => lang.code === code)
    if (lang) {
      Language.set(lang.code)
      currentLanguage = lang
      localStorage.setItem('AppLanguage', lang.code)
      showLanguageModal = false
    }
  }

  function handleMouseEnter() {
    showLanguageModal = true
  }

  function handleMouseLeave() {
    showLanguageModal = false
  }
</script>

<div
  class="relative inline-block"
  role="button"
  tabindex="0"
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
>
  <div
    id="language-button"
    class="m-1 flex cursor-pointer items-center justify-center rounded-full text-2xl duration-300 hover:shadow-xl"
    aria-haspopup="true"
    aria-expanded={showLanguageModal}
  >
    <currentLanguage.component class="h-8 w-8" />
  </div>
  {#if showLanguageModal}
    <div
      class={`languageModal absolute left-1/2 z-50 w-44 -translate-x-1/2 transform rounded-lg border border-gray-400
      ${currentTheme === 'light' ? 'bg-gray-200' : 'bg-gray-500'}`}
      role="menu"
      aria-labelledby="language-button"
      transition:fade={{ duration: 300 }}
    >
      <ul class="list-none p-2">
        {#each LOCALES as lang (lang.code)}
          <li class="cursor-pointer rounded-lg p-2 transition duration-300 hover:shadow-lg">
            <button
              class="flex items-center"
              onclick={() => switchLanguage(lang.code)}
              aria-label={`Switch to ${lang.name}`}
              role="menuitem"
            >
              <lang.component class="h-6 w-6" />
              <span class="pl-4">{lang.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>

<style>
  ul {
    list-style-type: none;
  }
</style>
