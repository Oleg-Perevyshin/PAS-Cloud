<!-- $lib/components/UI/Paragraph.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { ThemeStore } from '../../../stores'

  interface Props {
    id: string
    label?: string
    value?: string | number | number[] | boolean | null
    className?: string
  }

  let { id = '', label = '', value = null, className = '' }: Props = $props()

  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })
</script>

<div {id} class={`relative inline-block border-0 px-2 ${className}`}>
  {#if label}
    <p class={`mx-4 block font-semibold`}>{label}</p>
  {/if}
  <div class="flex flex-row items-center">
    <p class={`h-auto w-full cursor-pointer text-center text-base`}>
      {value !== null && value !== undefined ? value : t('common.nodata', currentLang)}
    </p>
  </div>
</div>
