<!-- $lib/components/Catalog/CatalogAddEdit.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '$lib/locales/i18n'
  import { OPTION_DEVID, OPTION_DEV_CATEGORY } from '../../../enums'
  import { LoaderStore, CatalogStore, CatalogUpsertDevice, RemoveDeviceFromStore } from '../../../stores'
  import type { ICatalogDevice, IOptionUI } from '../../../stores/Interfaces'
  import { API_CatalogDevice, API_CatalogDeleteDevice } from '$lib/utils/API'
  import ConfirmDelete from '../UI/ConfirmDelete.svelte'
  import Select from '../UI/Select.svelte'
  import Input from '../UI/Input.svelte'
  import TextArea from '../UI/TextArea.svelte'
  import Button from '../UI/Button.svelte'

  onMount(() => {
    const subscriptions = {
      Catalog: CatalogStore.subscribe((value) => (currentDevice = value)),
    }

    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  interface Props {
    currentDevice?: ICatalogDevice | null
    currentLang: string
    currentTheme: string
    isEditing: boolean

    onCancel: () => void
    onSave: (device: ICatalogDevice) => void
  }
  let { currentDevice, currentLang, currentTheme, isEditing, onCancel, onSave }: Props = $props()

  /* Реактивные переменные для полей */
  let SelectedVerFWs: IOptionUI | null = $state(null)
  let showNewVersionInput = $state(false)

  let DevCategory: IOptionUI = $state(OPTION_DEV_CATEGORY.find((opt: IOptionUI) => opt.id === currentDevice?.CatalogID[0]) || OPTION_DEV_CATEGORY[0])
  let DevType: IOptionUI = $state(OPTION_DEVID.find((opt) => opt.id === currentDevice?.CatalogID[1]) || OPTION_DEVID[0])
  let DevModel: IOptionUI = $state(OPTION_DEVID.find((opt) => opt.id === currentDevice?.CatalogID[2]) || OPTION_DEVID[0])
  let DevRevision: IOptionUI = $state(OPTION_DEVID.find((opt) => opt.id === currentDevice?.CatalogID[3]) || OPTION_DEVID[0])

  /* Установка версии прошивки на основе currentDevice.VerFW */
  if (currentDevice?.Versions && currentDevice.Versions.length > 0) {
    const matchedVersion = currentDevice.Versions.find((version) => version.VerFW === currentDevice?.VerFW)
    SelectedVerFWs = matchedVersion ? { id: matchedVersion.VerFW || '', name: matchedVersion.VerFW || 'Unknown Version', color: '' } : null
  }

  /* Собираем данные об устройстве для отправки на сервер */
  const handleAddDevice = () => {
    $CatalogStore.CatalogID = `${DevCategory.id}${DevType.id}${DevModel.id}${DevRevision.id}`

    const fieldsToCheck: { key: keyof ICatalogDevice; id: string }[] = [
      { key: 'CatalogName', id: 'CatalogName' },
      { key: 'Brief', id: 'Brief' },
      { key: 'Description', id: 'Description' },
      { key: 'Icon', id: 'newIcon' },
      { key: 'Firmware', id: 'Firmware' },
      { key: 'Manual', id: 'Manual' },
      { key: 'API', id: 'API' },
    ]

    if (isEditing) {
      const selectedVersion = SelectedVerFWs?.name
      if (selectedVersion !== '+') {
        fieldsToCheck.push({ key: 'Versions', id: 'Versions' })
      } else {
        fieldsToCheck.push({ key: 'VerFW', id: 'VerFW' }) // Добавляем новое поле для новой версии
      }
    } else {
      fieldsToCheck.push({ key: 'VerFW', id: 'VerFW' }) // Если новое устройство, добавляем новое поле версии
    }

    const isValid = fieldsToCheck.every(({ key, id }) => {
      const value = $CatalogStore[key]
      const element = document.getElementById(id)

      if (!element) {
        console.warn(`Элемент с id: ${id} не найден`)
        return false
      }

      const isInvalid = !value
      element.classList.toggle('border-red-500', isInvalid)

      if (isInvalid) {
        console.warn(`Проблема с полем: ${key}, ID: ${id}`)
      }

      return !!value
    })

    if (isValid) {
      onSave($CatalogStore)
    }
  }

  /* Получение данных об устройстве с учетом версии прошивки */
  const getCatalogDevice = async (VerFW: string) => {
    if (currentDevice?.CatalogID === null || currentDevice?.CatalogID === undefined) {
      return
    }
    LoaderStore.set(true)
    try {
      const responseData = await API_CatalogDevice(currentDevice.CatalogID, VerFW)
      if (!responseData?.catalog) {
        throw new Error('Invalid Response Data')
      }
      CatalogUpsertDevice(responseData.catalog)
    } catch (error) {
      console.error('Ошибка получения данных об устройстве: ', error)
    } finally {
      LoaderStore.set(false)
    }
  }

  /* ОБРАБОТКА ПРИКРЕПЛЕНИЯ ФАЙЛОВ */
  const handleFileChange = (e: Event, field: 'Icon' | 'Firmware' | 'Manual' | 'API') => {
    const target = e.target as HTMLInputElement | null
    if (target && target.files) {
      const file = target.files[0]
      if (file) {
        const reader = new FileReader()
        if (field === 'Icon') {
          reader.onload = (event) => {
            if (event.target?.result) {
              $CatalogStore.Icon = event.target.result as string
            }
          }
          reader.readAsDataURL(file)
        } else if (field === 'Firmware' || field === 'Manual' || field === 'API') {
          $CatalogStore[field] = file
        }
      }
    }
  }
  const handleIconChange = (e: Event) => handleFileChange(e, 'Icon')
  const handleCoreFileChange = (e: Event) => handleFileChange(e, 'Firmware')
  const handleManualFileChange = (e: Event) => handleFileChange(e, 'Manual')
  const handleAPIFileChange = (e: Event) => handleFileChange(e, 'API')

  /* Метод для валидации значения VerFW */
  function validateVerFW(value: string) {
    let cleanedValue = value.replace(/[^0-9.]/g, '')
    const parts = cleanedValue.split('.')
    if (parts.length > 2) {
      cleanedValue = parts[0] + '.' + parts.slice(1).join('')
    }
    if (cleanedValue !== $CatalogStore.VerFW) {
      $CatalogStore.VerFW = cleanedValue
    }
  }

  /* Обработчик опций для версии устройства */
  const handleVerFWChange = (value: IOptionUI | null) => {
    showNewVersionInput = value?.name === '+'
    SelectedVerFWs = value
    if (value && value.name !== '+') {
      getCatalogDevice(value.name)
    }
  }

  /* Удаление версии устройства из каталога */
  let showModalDelete = $state(false)
  const handleDeleteVersion = () => {
    showModalDelete = true
  }
  const confirmDeleteDevice = async () => {
    if (currentDevice?.CatalogID === undefined) return console.error('Ошибка confirmDeleteDevice - currentDevice.CatalogID не существует')
    try {
      const responseData = await API_CatalogDeleteDevice(currentDevice.CatalogID, SelectedVerFWs?.name || '')
      if (responseData?.status.code == 200) {
        RemoveDeviceFromStore(currentDevice.CatalogID)
      }
      showModalDelete = false
    } catch (error) {
      console.error('Ошибка при удалении устройства:', error)
    }
  }
</script>

<!-- Разметка компонента -->
{#if $CatalogStore}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div
      class={`flex w-[75%] flex-col overflow-auto rounded-2xl p-5 text-center
      ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-800'}`}
    >
      {#if isEditing}
        <h2>{t('service.catalog.title_edit', currentLang)}</h2>
      {:else}
        <h2>{t('service.catalog.title_create', currentLang)}</h2>
      {/if}

      <!-- Иконка, CatalogID, CatalogName, Created, Updated, VerFW -->
      <div
        class={`m-1 flex items-start rounded-2xl border border-gray-400 p-2
        ${currentTheme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}
      >
        <!-- Иконка -->
        <div class="flex h-40 w-40 flex-shrink-0 items-center justify-center">
          <button
            class={`flex h-full w-full cursor-pointer items-center justify-center rounded-2xl border border-gray-400 p-2
              ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
            onclick={() => {
              const input = document.getElementById('newIcon') as HTMLInputElement | null
              if (input) {
                input.click()
              }
            }}
          >
            <img src={$CatalogStore.Icon} alt="Device Icon" class="h-full w-full object-cover" />
          </button>
          <input id="newIcon" type="file" accept=".svg" class="hidden" onchange={handleIconChange} />
        </div>

        <!-- Информация об устройстве -->
        <div class="mx-4 flex w-2/3 flex-grow flex-col">
          <!-- CatalogID -->
          <div class="mb-2 grid grid-cols-4 gap-2">
            <Select
              id="Category"
              label={t('service.catalog.category', currentLang)}
              props={{
                currentLang: currentLang,
                bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800',
                disabled: isEditing ?? false,
              }}
              options={OPTION_DEV_CATEGORY}
              value={DevCategory}
              onUpdate={(value) => {
                if (value) DevCategory = value
              }}
              className="w-full"
            />
            <Select
              id="Type"
              label={t('service.catalog.type', currentLang)}
              props={{
                currentLang: currentLang,
                bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800',
                disabled: isEditing ?? false,
              }}
              options={OPTION_DEVID}
              value={DevType}
              onUpdate={(value) => {
                if (value) DevType = value
              }}
              className="w-full"
            />
            <Select
              id="Model"
              label={t('service.catalog.model', currentLang)}
              props={{
                currentLang: currentLang,
                bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800',
                disabled: isEditing ?? false,
              }}
              options={OPTION_DEVID}
              value={DevModel}
              onUpdate={(value) => {
                if (value) DevModel = value
              }}
              className="w-full"
            />
            <Select
              id="Revision"
              label={t('service.catalog.revision', currentLang)}
              props={{
                currentLang: currentLang,
                bgColor: currentTheme === 'light' ? 'bg-blue-200' : 'bg-blue-800',
                disabled: isEditing ?? false,
              }}
              options={OPTION_DEVID}
              value={DevRevision}
              onUpdate={(value) => {
                if (value) DevRevision = value
              }}
              className="w-full"
            />
          </div>

          <!-- CatalogName, VerFW -->
          <div class="grid grid-cols-4 items-start gap-2">
            <div class="col-span-3 flex flex-col">
              <Input
                id="CatalogName"
                props={{ autocomplete: 'on', maxLength: 16 }}
                allowOnly={/[^0-9a-zA-Z- _.]/g}
                label={t('service.catalog.devname', currentLang)}
                className="w-full"
                bind:value={$CatalogStore.CatalogName}
              />
            </div>
            <div class="col-span-1 flex flex-col items-center">
              <Select
                id="Versions"
                label={t('service.catalog.verfw', currentLang)}
                props={currentTheme === 'light' ? { bgColor: '!bg-blue-200', currentLang: currentLang } : { bgColor: '!bg-blue-800', currentLang: currentLang }}
                options={[
                  ...($CatalogStore.Versions?.map((version) => ({
                    id: version.VerFW || '',
                    name: version.VerFW || '',
                    color: '',
                  })) || []),
                  { id: 'CreatingNewVersion', name: '+', color: '' },
                ]}
                value={SelectedVerFWs}
                onUpdate={(value) => handleVerFWChange(value)}
                className="w-full"
              />

              {#if showNewVersionInput}
                <Input
                  id="VerFW"
                  props={{ autocomplete: 'off', maxLength: 7 }}
                  allowOnly={/[^0-9.]/g}
                  label={t('service.catalog.verfw', currentLang)}
                  className="w-full"
                  bind:value={$CatalogStore.VerFW}
                  onUpdate={validateVerFW}
                />
              {/if}

              {#if isEditing}
                <Button
                  onClick={() => handleDeleteVersion()}
                  label={t('common.delete', currentLang)}
                  props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
                  className="mt-2 w-full"
                />
              {/if}
            </div>
          </div>
        </div>

        <!-- Дата создания, дата обновления -->
        <div class="mx-4 flex h-full flex-col justify-center">
          <div>
            <label for="Created" class="block font-semibold">{t('service.catalog.created', currentLang)}</label>
            <p>{$CatalogStore.Created}</p>
          </div>
          <div>
            <label for="Updated" class="block font-semibold">{t('service.catalog.updated', currentLang)}</label>
            <p>{$CatalogStore.Updated}</p>
          </div>
        </div>
      </div>

      <!-- Поля Brief, Description, Firmware, Manual, API -->
      <div
        class={`m-1 mt-2 rounded-2xl border border-gray-400 p-2
        ${currentTheme === 'light' ? 'bg-gray-50' : 'bg-gray-700'}`}
      >
        <Input
          id="Brief"
          props={{ autocomplete: 'on', maxLength: 250 }}
          label={t('service.catalog.brief', currentLang)}
          className="w-full"
          bind:value={$CatalogStore.Brief}
        />
        <TextArea
          id="Description"
          props={{ maxLength: 10000, rows: 10 }}
          className="w-full"
          label={t('service.catalog.description', currentLang)}
          bind:value={$CatalogStore.Description}
        />

        <!-- Прикрепление файла прошивки и руководства пользователя -->
        <div class="m-4 grid grid-cols-2 gap-2">
          <div class="flex items-center">
            <label for="Firmware" class="font-semibold">{t('service.catalog.append_core', currentLang)}</label>
          </div>
          <div class="flex items-center">
            <input
              id="Firmware"
              type="file"
              accept=".bin"
              onchange={handleCoreFileChange}
              class="w-full rounded-lg border-2 border-blue-400 p-2 hover:border-blue-400 focus:border-blue-500"
            />
          </div>

          <div class="flex items-center">
            <label for="Manual" class="font-semibold">{t('service.catalog.append_manual', currentLang)}</label>
          </div>
          <div class="flex items-center">
            <input
              id="Manual"
              type="file"
              accept=".pdf"
              onchange={handleManualFileChange}
              class="w-full rounded-lg border-2 border-blue-400 p-2 hover:border-blue-400 focus:border-blue-500"
            />
          </div>

          <div class="flex items-center">
            <label for="API" class="font-semibold">{t('service.catalog.append_api', currentLang)}</label>
          </div>
          <div class="flex items-center">
            <input
              id="API"
              type="file"
              accept=".yaml"
              onchange={handleAPIFileChange}
              class="w-full rounded-lg border-2 border-blue-400 p-2 hover:border-blue-400 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <div class="mt-auto mb-4 flex justify-center">
        <Button
          onClick={onCancel}
          label={t('common.cancel', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-red-200' } : { bgColor: 'bg-red-900' }}
          className="m-1 mx-4 w-48 rounded-2xl"
        />
        <Button
          onClick={handleAddDevice}
          label={t('common.save', currentLang)}
          props={currentTheme === 'light' ? { bgColor: 'bg-lime-200' } : { bgColor: 'bg-lime-800' }}
          className="m-1 mx-4 w-48 rounded-2xl"
        />
      </div>
    </div>
  </div>
{/if}

<!-- Модальное окно подтверждения удаления устройства из каталога -->
{#if currentLang && currentDevice}
  <ConfirmDelete
    show={showModalDelete}
    item={currentDevice?.CatalogID}
    {currentLang}
    onConfirm={confirmDeleteDevice}
    onCancel={() => (showModalDelete = false)}
  />
{/if}
