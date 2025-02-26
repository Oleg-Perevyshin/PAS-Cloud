<!-- $lib/components/Header/Theme.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { WebSocketStore } from '../../../stores'
  import type { IGroupMessage } from '../../../stores/Interfaces'
  import IconNotifications from '$lib/appIcons/Notifications.svelte'

  let newPersonalMessages: IGroupMessage[] = $state([])
  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      WebSocketStore: WebSocketStore.subscribe((state) => {
        newPersonalMessages = state.personalMessages
      }),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /* Обработчик нажатия на кнопку уведомления */
  const changePage = (page: string) => {
    WebSocketStore.update((state) => ({
      ...state,
      personalMessages: [],
    }))
    goto(`${page}`)
  }
</script>

<div class="relative mx-4 flex items-start">
  <!-- Уведомление о новых личных сообщениях -->
  <button
    class="flex cursor-pointer items-center opacity-100 transition-opacity duration-300 hover:opacity-50"
    onclick={() => changePage('/chat')}
    aria-label="Notifications"
  >
    <div class="relative">
      <IconNotifications width="3rem" height="3rem" />
      {#if newPersonalMessages.length > 0}
        <span
          class="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
        >
          {newPersonalMessages.length}
        </span>
      {/if}
    </div>
  </button>
</div>

<style></style>
