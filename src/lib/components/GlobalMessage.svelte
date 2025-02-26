<!-- $lib/components/UI/GlobalMessage.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '../locales/i18n'
  import { RenderMarkdown } from '$lib/utils/Common'
  import Button from './UI/Button.svelte'
  import { ThemeStore } from '../../stores'
  import type { IGroupMessage } from '../../stores/Interfaces'

  interface Props {
    show: boolean
    message: IGroupMessage | null | undefined
    currentLang: string
    onConfirm: () => void
  }

  let { show = false, message, currentLang, onConfirm }: Props = $props()
  let currentTheme: string | undefined = $state()
  let renderedContents: string = $state('')

  $effect(() => {
    renderAllMessage()
  })

  onMount(() => {
    /* Подписки */
    const unsubscribe = {
      theme: ThemeStore.subscribe((value) => (currentTheme = value)),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(unsubscribe).forEach((unsub) => unsub())
    }
  })

  /* Прогон сообщений через парсер MD */
  const renderAllMessage = async () => {
    try {
      if (message && message.Message) {
        renderedContents = await RenderMarkdown(message.Message as string)
        return await RenderMarkdown(message.Message as string)
      } else {
        renderedContents = '<p>Сообщение отсутствует</p>'
      }
    } catch (error) {
      console.error('Ошибка при рендеринге Markdown:', error)
      renderedContents = '<p>Ошибка при рендеринге содержимого</p>'
    }
  }
</script>

{#if show}
  <div class="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black">
    <div class={`w-[80%] rounded-2xl p-4 text-center ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}>
      <h3>{t('common.system.message', currentLang)}</h3>
      <hr />
      <p class="m-4">{message?.Author?.FirstName} {message?.Author?.LastName} | {message?.Created}</p>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html renderedContents}
      <hr />
      <Button
        onClick={onConfirm}
        label={t('common.ok', currentLang)}
        props={{ bgColor: 'bg-green-200' }}
        className="m-2 mt-4 h-10 w-60 rounded-2xl"
      />
    </div>
  </div>
{/if}
