<!-- $lib/components/Catalog/DeviceList.svelte -->
<script lang="ts">
  import { t } from '$lib/locales/i18n'
  import type { ICatalogDevice } from '../../../stores/Interfaces'

  interface Props {
    catalogDeviceList: ICatalogDevice[]
    currentLang: string
    currentTheme: string
    onScroll: (event: Event) => void
    bindContainer: (element: HTMLElement | null) => void
  }
  let { catalogDeviceList, currentLang, currentTheme, onScroll, bindContainer }: Props = $props()
  let container: HTMLElement | null = $state(null)

  $effect(() => {
    bindContainer(container)
  })

  /**
   * СОРТИРОВКА ДАННЫХ В ТАБЛИЦЕ
   */
  let currentSortField: keyof ICatalogDevice | null = $state(null)
  let sortDirection: { [key: string]: 'asc' | 'desc' } = $state({ CatalogID: 'asc', CatalogName: 'asc' })
  const sortDevices = (field: keyof ICatalogDevice) => {
    const sortedDevices = [...catalogDeviceList]

    /* Определяем направление сортировки */
    if (currentSortField === field) {
      sortDirection[field] = sortDirection[field] === 'asc' ? 'desc' : 'asc'
    } else {
      sortDirection[field] = 'asc'
    }

    /* Сортировка по полю CatalogID с учетом HEX */
    sortedDevices.sort((a, b) => {
      let aValue, bValue

      if (field === 'CatalogID') {
        /* Преобразуем HEX в числовое значение для сравнения */
        aValue = parseInt(a[field], 16)
        bValue = parseInt(b[field], 16)
      } else {
        /* Для других полей (например, CatalogName) */
        aValue = typeof a[field] === 'string' ? a[field].toLowerCase() : String(a[field] ?? '')
        bValue = typeof b[field] === 'string' ? b[field].toLowerCase() : String(b[field] ?? '')

        /* Разбиваем строки для сравнения */
        const segmentsA = aValue.split(/(\d+)/).map((segment) => (isNaN(Number(segment)) ? segment : Number(segment)))
        const segmentsB = bValue.split(/(\d+)/).map((segment) => (isNaN(Number(segment)) ? segment : Number(segment)))

        for (let i = 0; i < Math.max(segmentsA.length, segmentsB.length); i++) {
          const valA = segmentsA[i] ?? ''
          const valB = segmentsB[i] ?? ''
          if (valA === undefined) return -1
          if (valB === undefined) return 1
          if (valA !== valB) {
            return valA < valB ? -1 : 1
          }
        }
        return 0 // Значения равны
      }

      /* Сравниваем значения для сортировки */
      return aValue < bValue ? -1 : 1
    })

    /* Обновление списка устройств в зависимости от направления сортировки */
    catalogDeviceList = sortDirection[field] === 'asc' ? sortedDevices : sortedDevices.reverse()
    currentSortField = field
  }
</script>

<!-- Таблица для отображения устройств -->
<div class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-400">
  <!-- Заголовок таблицы -->
  <div
    class={`sticky top-0 grid grid-cols-5 rounded-t-2xl border-gray-400
    ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`}
    style="grid-template-columns: 6rem 5rem 10rem 5rem 1fr;"
  >
    <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('catalog.icon', currentLang)}</div>
    <button
      class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
      ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
      onclick={() => sortDevices('CatalogID')}
    >
      {t('catalog.id', currentLang)}
      {currentSortField === 'CatalogID' ? (sortDirection.CatalogID === 'asc' ? '▲' : '▼') : ''}
    </button>
    <button
      class={`cursor-pointer border-r border-b border-gray-400 p-2 font-semibold
      ${currentTheme === 'light' ? 'bg-yellow-200' : 'bg-yellow-700'}`}
      onclick={() => sortDevices('CatalogName')}
    >
      {t('catalog.name', currentLang)}
      {currentSortField === 'CatalogName' ? (sortDirection.CatalogName === 'asc' ? '▲' : '▼') : ''}
    </button>
    <div class="border-r border-b border-gray-400 p-2 font-semibold">{t('catalog.verfw', currentLang)}</div>
    <div class="border-b border-gray-400 p-2 font-semibold">{t('catalog.brief', currentLang)}</div>
  </div>

  <!-- Тело таблицы с прокруткой -->
  <div class={`flex-grow overflow-y-auto ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`} bind:this={container} onscroll={onScroll}>
    {#each catalogDeviceList as device}
      <div class="grid grid-cols-5 items-center overflow-y-auto border-b border-gray-400" style="grid-template-columns: 6rem 5rem 10rem 5rem 1fr;">
        <div class="flex h-full flex-shrink-0 items-center justify-center overflow-hidden border-r border-gray-400">
          <div class="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden p-2">
            <img src={device.Icon} alt="Device Icon" class="m-2 h-full w-full object-cover" />
          </div>
        </div>
        <a
          class="flex h-full flex-shrink-0 cursor-pointer flex-col items-center justify-center border-r border-gray-400 p-2 hover:underline"
          href={`/products/${device.CatalogID}`}>{device.CatalogID}</a
        >
        <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
          {device.CatalogName}
        </div>
        <div class="flex h-full flex-shrink-0 flex-col items-center justify-center border-r border-gray-400 p-2">
          {device.VerFW}
        </div>
        <div class="flex h-full flex-shrink-0 p-2 text-justify">{device.Brief}</div>
      </div>
    {/each}
  </div>

  <!-- Информация о количестве устройств -->
  <div
    class={`flex h-8 items-center justify-center rounded-b-2xl border-t border-gray-400
    ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`}
  >
    <strong>{t('catalog.nums')} {catalogDeviceList.length}</strong>
  </div>
</div>
