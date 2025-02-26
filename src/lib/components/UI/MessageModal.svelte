<!-- $lib/components/UI/MessageModal.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import { RemoveMessage, ThemeStore } from '../../../stores'
  interface Props {
    message: { id: number; text: string }
  }

  let { message }: Props = $props()

  let currentTheme: string | undefined = $state()
  onMount(() => {
    /* Подписка на ThemeStore */
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    /* Очистка подписок и обработчиков событий */
    return () => {
      unsubscribeTheme()
    }
  })

  const getMessageStyle = (text: string) => {
    if (text.startsWith('ERR: ')) return 'text-red-500'
    if (text.startsWith('INFO: ')) return 'text-lime-500'
    if (text.startsWith('WR: ')) return 'text-yellow-500'
    return 'text-stone-800'
  }

  const getMessageText = (text: string) => {
    if (text.startsWith('ERR: ')) return text.replace('ERR: ', '')
    if (text.startsWith('INFO: ')) return text.replace('INFO: ', '')
    if (text.startsWith('WR: ')) return text.replace('WR: ', '')
    return text
  }

  const closeMessage = () => {
    RemoveMessage(message.id)
  }
</script>

<div
  transition:fly={{ y: 25, duration: 200 }}
  class={`my-1 flex items-center justify-between rounded-2xl border border-gray-300 px-4 py-2 shadow-lg
  ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
>
  <p class={`font-semibold ${getMessageStyle(message.text)}`}>{getMessageText(message.text)}</p>
  <button class="ml-2 text-2xl" onclick={closeMessage}>&times;</button>
</div>
