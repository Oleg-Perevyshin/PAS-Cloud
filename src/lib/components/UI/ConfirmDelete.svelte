<!-- $lib/components/UI/ConfirmDelete.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '../../locales/i18n'
  import Button from '../UI/Button.svelte'
  import { ThemeStore } from '../../../stores'

  interface Props {
    show?: boolean
    item: string
    currentLang: string
    onConfirm: () => void
    onCancel: () => void
  }

  let { show = false, item, currentLang, onConfirm, onCancel }: Props = $props()
  let currentTheme: string | undefined = $state()

  onMount(() => {
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    return () => {
      unsubscribeTheme()
    }
  })
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div class={`rounded-2xl p-8 text-center ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}>
      <p class="mt-2">{t('common.delete_item', currentLang)}{item}?</p>
      <Button
        onClick={onCancel}
        label={t('common.cancel', currentLang)}
        props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
        className="m-4 h-10 w-60 rounded-2xl"
      />
      <Button
        onClick={onConfirm}
        label={t('common.delete', currentLang)}
        props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
        className="m-4 h-10 w-60 rounded-2xl"
      />
    </div>
  </div>
{/if}
