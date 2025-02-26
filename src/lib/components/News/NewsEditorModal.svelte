<!-- $lib/components/News/NewsEditorModal.svelte -->
<script lang="ts">
  import { t } from '$lib/locales/i18n'
  import type { INews } from '../../../stores/Interfaces'
  import Input from '../UI/Input.svelte'
  import TextArea from '../UI/TextArea.svelte'
  import Button from '../UI/Button.svelte'
  import { NewsStore } from '../../../stores'

  interface Props {
    currentEditNews?: INews | null
    currentLang: string
    currentTheme: string
    HandleImageUpload: (event: Event, type: string, store: typeof NewsStore) => void
    onCancel: () => void
    onSave: (news: INews, published: boolean) => void
  }

  let { currentEditNews = null, currentLang, currentTheme, HandleImageUpload, onCancel, onSave }: Props = $props()

  const openFileDialog = (elementId: string) => {
    const input = document.getElementById(elementId) as HTMLInputElement | null
    if (input) {
      input.click()
    }
  }
</script>

<div class="editorModal bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black">
  <div
    class={`flex h-auto w-[55rem] flex-col overflow-auto rounded-2xl p-5 text-center ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
  >
    <h2>
      {currentEditNews ? t('dashboard.news.title_edit', currentLang) : t('dashboard.news.title_create', currentLang)}
    </h2>

    <div class="mb-4 flex items-start">
      <div class="flex h-32 w-32 flex-shrink-0 items-center justify-center">
        <button
          class="mt-12 flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-white shadow hover:shadow"
          onclick={() => openFileDialog('ImageTitle')}
        >
          {#if $NewsStore.ImageTitle}
            <img
              src={`data:image/png;base64,${$NewsStore.ImageTitle}`}
              alt="ImageTitle"
              class="h-full w-full object-cover"
            />
          {/if}
        </button>
        <input
          id="ImageTitle"
          type="file"
          accept="image/png, image/jpeg"
          class="hidden"
          onchange={(event) => HandleImageUpload(event, 'ImageTitle', NewsStore)}
        />
      </div>

      <div class="ml-4 flex-grow">
        <Input
          id="Title"
          props={{ autocomplete: 'off', maxLength: 120 }}
          label={t('dashboard.news.header', currentLang)}
          className="w-full"
          bind:value={$NewsStore.Title}
        />
        <TextArea
          id="Brief"
          props={{ maxLength: 2000, rows: 3 }}
          className="w-full text-justify"
          label={t('dashboard.news.brief', currentLang)}
          bind:value={$NewsStore.Brief}
        />
      </div>
    </div>

    <hr class="m-4 border-gray-400" />

    <div class="mb-4 flex">
      <div class="mr-4 flex-grow">
        <TextArea
          id="Content"
          props={{ maxLength: 15000, rows: 12 }}
          label={t('dashboard.news.content', currentLang)}
          bind:value={$NewsStore.Content}
          className="w-full"
        />
      </div>

      <div class="mt-6 flex h-40 w-40 flex-shrink-0 items-center justify-center">
        <button
          class="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-gray-400 bg-white shadow hover:shadow"
          onclick={() => openFileDialog('ImageContent')}
        >
          {#if $NewsStore.ImageContent}
            <img
              src={`data:image/png;base64,${$NewsStore.ImageContent}`}
              alt="ImageContent"
              class="h-full w-full object-cover"
            />
          {/if}
        </button>
        <input
          id="ImageContent"
          type="file"
          accept="image/png, image/jpeg"
          class="hidden"
          onchange={(event) => HandleImageUpload(event, 'ImageContent', NewsStore)}
        />
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <Button
        onClick={onCancel}
        label={t('common.cancel', currentLang)}
        props={{ bgColor: currentTheme === 'light' ? 'bg-red-300' : 'bg-red-900' }}
        className="m-4 h-10 w-60 rounded-2xl"
      />
      <Button
        onClick={() => onSave($NewsStore, false)}
        label={t('common.save', currentLang)}
        props={{ bgColor: currentTheme === 'light' ? 'bg-emerald-300' : 'bg-emerald-900' }}
        className="m-4 h-10 w-60 rounded-2xl"
      />
    </div>
  </div>
</div>
