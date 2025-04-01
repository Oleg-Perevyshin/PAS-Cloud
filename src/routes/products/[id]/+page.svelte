<!-- src/routes/products/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import { page } from '$app/stores'
  import type { IUser, ICatalogDevice, IOptionUI } from '../../../stores/Interfaces'
  import { LoaderStore, ThemeStore, UserStore, CatalogUpsertDevice } from '../../../stores'
  import { API_CatalogDevice } from '$lib/utils/API'
  import { RenderMarkdown } from '$lib/utils/Common'
  import Select from '$lib/components/UI/Select.svelte'

  const CatalogID = $page.params.id

  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let UserData: IUser | undefined = $state()
  let SelectedVerFWs: IOptionUI | null = $state(null)

  let product: ICatalogDevice | null = $state(null)
  let renderedDescription: string = $state('') /* Отрендеренное описание */
  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      User: UserStore.subscribe((value) => (UserData = value)),
    }

    /* Запрос списка устройств */
    getCatalogDevice('')

    /* Очистка подписок и обработчиков событий */
    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /* Получение данных об устройствте */
  const getCatalogDevice = async (VerFW: string) => {
    LoaderStore.set(true)
    try {
      const responseData = await API_CatalogDevice(CatalogID, VerFW)
      if (!responseData?.catalog) {
        throw new Error('Invalid Response Data')
      }
      CatalogUpsertDevice(responseData.catalog)
      product = responseData.catalog

      const matchedVersion = product.Versions?.find((version) => version.VerFW === product?.VerFW)
      SelectedVerFWs = matchedVersion ? { id: matchedVersion.VerFW || '', name: matchedVersion.VerFW || 'Unknown Version', color: '' } : null

      /* Рендерим Markdown после загрузки продукта */
      if (product) {
        try {
          renderedDescription = await RenderMarkdown(product.Description)
        } catch (error) {
          console.error('Ошибка при рендеринге Markdown:', error)
          renderedDescription = '<p>Ошибка при рендеринге описания</p>'
        }
      }
    } catch (error) {
      console.error('Ошибка получения данных об устройстве: ', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /**
   * Функция для скачивания файла
   * @param type - запрашиваемый ресурс (файл прошивки или документ с описанием)
   */
  const downloadFile = async (type: 'Firmware' | 'Manual' | 'API') => {
    try {
      const response = await fetch(`/api/catalog_file?CatalogID=${CatalogID}&DataType=${type}&VerFW=${SelectedVerFWs?.name}`)
      if (!response.ok) {
        throw new Error('Ошибка получения файла: ' + response.statusText)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      if (type === 'Firmware') {
        a.download = `${product?.CatalogID}-Core-v${SelectedVerFWs?.name}.bin`
      } else if (type === 'Manual') {
        a.download = `${product?.CatalogID}-Manual-v${SelectedVerFWs?.name}.pdf`
      } else if (type === 'API') {
        a.download = `${product?.CatalogID}-API-v${SelectedVerFWs?.name}.yaml`
      } else {
        console.error('Неизвестный тип данных для скачивания')
      }
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка при скачивании файла: ', error)
    }
  }
</script>

{#if UserData?.IsOnline}
  <div class="flex h-full flex-col items-center overflow-hidden">
    <div class="sticky top-0">
      <h2>{t('common.dynamic.device', currentLang)}</h2>
    </div>

    {#if product}
      <!-- Шапка информации об устройстве -->
      <div class="sticky flex h-full w-[95%] flex-col md:h-[12rem] md:flex-row">
        <!-- Иконка -->
        <div class="flex h-36 w-36 flex-shrink-0 items-center justify-center">
          <button class="flex h-full w-full cursor-pointer items-center justify-center rounded-2xl border border-gray-400 bg-white p-2">
            <img src={product.Icon} alt="Device Icon" class="h-full w-full object-cover" />
          </button>
        </div>

        <!-- Информация об устройстве -->
        <div class="mx-4 flex w-full flex-grow flex-col">
          <!-- ID устройства -->
          <div class="mb-2 grid grid-cols-2 gap-2 rounded-2xl border border-gray-400 md:grid-cols-4">
            <div class="flex flex-col">
              <p class="block font-semibold">{t('products.category', currentLang)}</p>
              <p>{product.CatalogID[0]}</p>
            </div>
            <div class="flex flex-col">
              <p class="block font-semibold">{t('products.type', currentLang)}</p>
              <p>{product.CatalogID[1]}</p>
            </div>
            <div class="flex flex-col">
              <p class="block font-semibold">{t('products.model', currentLang)}</p>
              <p>{product.CatalogID[2]}</p>
            </div>
            <div class="flex flex-col">
              <p class="block font-semibold">{t('products.revision', currentLang)}</p>
              <p>{product.CatalogID[3]}</p>
            </div>
          </div>

          <!-- Имя устройства и версия прошивки -->
          <div class="mb-2 grid grid-cols-4 items-center gap-2 py-2">
            <div class="col-span-3 flex flex-col rounded-2xl border border-gray-400">
              <p class="block font-semibold">{t('products.devname', currentLang)}</p>
              <p>{product.CatalogName}</p>
            </div>
            <div class="flex flex-col rounded-2xl border border-gray-400">
              <Select
                id="VerFWs"
                label={t('products.verfw', currentLang)}
                props={{
                  currentLang: currentLang,
                  bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800',
                }}
                options={product.Versions?.map((version) => ({
                  id: version.VerFW || '',
                  name: version.VerFW || '',
                  color: '',
                }))}
                value={SelectedVerFWs}
                onUpdate={(VerFW) => {
                  if (VerFW) {
                    getCatalogDevice(VerFW.name)
                  }
                }}
              />
            </div>
          </div>

          <!-- Блок для скачивания инструкции, прошивки и файла API -->
          <div class="grid grid-cols-1 justify-items-center gap-2 md:grid-cols-3">
            <p
              class={`col-span-1 mx-4 flex w-48 flex-col rounded-2xl border border-gray-400 p-2 px-4
              ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-500'}
            `}
            >
              <a
                href={`/api/catalog_file?CatalogID=${CatalogID}&DataType=Manual&VerFW=${SelectedVerFWs?.name}`}
                class="!text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{t('products.manual', currentLang)}</strong>
              </a>
            </p>
            <p
              class={`col-span-1 mx-4 flex w-48 flex-col rounded-2xl border border-gray-400 p-2 px-4
              ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-500'}
            `}
            >
              <button class="text-blue-600 hover:underline" onclick={() => downloadFile('Firmware')}>
                <strong>{t('products.firmware', currentLang)}</strong>
              </button>
            </p>
            <p
              class={`col-span-1 mx-4 flex w-48 flex-col rounded-2xl border border-gray-400 p-2 px-4
              ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-500'}
            `}
            >
              <button class="text-blue-600 hover:underline" onclick={() => downloadFile('API')}>
                <strong>{t('products.api', currentLang)}</strong>
              </button>
            </p>
          </div>
        </div>

        <!-- Дата создания, дата обновления -->
        <div class="flex h-full flex-col justify-start rounded-2xl border border-gray-400 p-2">
          <div>
            <p class="block font-semibold">{t('products.created', currentLang)}</p>
            <p>{product.Created}</p>
          </div>
          <div>
            <p class="block font-semibold">{t('products.updated', currentLang)}</p>
            <p>{product.Updated}</p>
          </div>
        </div>
      </div>

      <br />

      <!-- Поля Brief, Description -->
      <div class="sticky flex w-full flex-col px-2 text-justify">
        <h3 class="block text-center font-semibold">{t('products.brief', currentLang)}</h3>
        <h5>{product.Brief}</h5>
        <hr class="my-2 border-gray-300" />
      </div>
      <div class="flex w-full flex-col overflow-y-auto px-2 text-justify">
        <h3 class="block text-center font-semibold">{t('products.description', currentLang)}</h3>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p>{@html renderedDescription}</p>
      </div>

      <!-- Доп. блок, всегда внизу и видим -->
      <div class="bottom-4 my-4 flex flex-wrap justify-center"></div>
    {/if}
  </div>
{/if}
