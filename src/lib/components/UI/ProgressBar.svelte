<!-- $lib/components/UI/ProgressBar.svelte -->
<script lang="ts">
  // import { onMount } from 'svelte'
  // import { t, Language } from '$lib/locales/i18n'
  // import { ThemeStore } from '../../../stores'

  interface Props {
    id: string
    label?: string
    value?: string | number | boolean | null
    className?: string
  }

  let { id = '', label = '', value = $bindable(0), className = '' }: Props = $props()

  // let currentLang: string | undefined = $state()
  // let currentTheme: string | undefined = $state()

  // onMount(() => {
  //   /* Подписки на состояние */
  //   const subscriptions = {
  //     Language: Language.subscribe((value) => (currentLang = value)),
  //     Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
  //   }

  //   /* Очистка подписок и обработчиков событий */
  //   return () => {
  //     Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
  //   }
  // })
</script>

<div {id} class={`relative inline-block w-full border-0 px-2 ${className}`}>
  {#if label}
    <p class="mx-4 block font-semibold">{label}</p>
  {/if}
  <div class="flex flex-col items-center">
    <div class="relative h-4 w-full rounded bg-gray-200">
      <div class="absolute top-0 left-0 h-full rounded bg-blue-500" style="width: {value}%;"></div>
    </div>
    <span class="ml-2 font-semibold">{value}%</span>
  </div>
</div>
