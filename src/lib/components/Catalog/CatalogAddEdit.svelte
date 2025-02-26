<!-- $lib/components/Catalog/CatalogAddEdit.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t } from '$lib/locales/i18n'
  import { DEFAULT_OPTION_DEVID, DEFAULT_OPTION_DEVID_CATEGORY } from '../../../enums'
  import { CatalogStore } from '../../../stores'
  import type { ICatalogDevice, IOptionUI } from '../../../stores/Interfaces'
  import Select from '../UI/Select.svelte'
  import Input from '../UI/Input.svelte'
  import TextArea from '../UI/TextArea.svelte'
  import Button from '../UI/Button.svelte'

  onMount(() => {
    if (currentEditDevice) {
      setDeviceData(currentEditDevice)
    }
  })

  interface Props {
    currentEditDevice?: ICatalogDevice | null
    currentLang: string
    currentTheme: string
    isEditing: boolean

    onCancel: () => void
    onSave: (device: ICatalogDevice) => void
  }
  let { currentEditDevice, currentLang, currentTheme, isEditing, onCancel, onSave }: Props = $props()

  const openFileDialog = (elementId: string) => {
    const input = document.getElementById(elementId) as HTMLInputElement | null
    if (input) {
      input.click()
    }
  }

  /* Реактивные переменные для полей */
  let device: DEVICE_DATA
  let SelectedCategory: IOptionUI | null = $state(null)
  let SelectedType: IOptionUI | null = $state(null)
  let SelectedModel: IOptionUI | null = $state(null)
  let SelectedRevision: IOptionUI | null = $state(null)

  interface DEVICE_DATA {
    DevID: string
    DevCategory: string
    DetType: string
    DevModel: string
    DevRevision: string
    DevName: string
    Brief: string
    Description: string
    Icon: string
    VerFW: string
    Firmware: File | null
    Manual: File | null
    API: File | string | null
    Created: string
    Updated: string
  }

  /* Устанавливаем данные устройства (полученные или по умолчанию) */
  const setDeviceData = (currentEditDevice: ICatalogDevice) => {
    const devIDChars = currentEditDevice.DevID.split('')
    device = {
      DevID: currentEditDevice.DevID,
      DevCategory: devIDChars[0],
      DetType: devIDChars[1],
      DevModel: devIDChars[2],
      DevRevision: devIDChars[3],
      DevName: currentEditDevice.DevName,
      Brief: currentEditDevice.Brief,
      Description: currentEditDevice.Description,
      Icon: currentEditDevice.Icon,
      VerFW: currentEditDevice.VerFW,
      Firmware: null,
      Manual: null,
      API: null,
      Created: currentEditDevice.Created || '',
      Updated: currentEditDevice.Updated || '',
    }
    SelectedCategory = DEFAULT_OPTION_DEVID_CATEGORY.find((opt) => opt.name === device.DevCategory) || DEFAULT_OPTION_DEVID_CATEGORY[0]
    SelectedType = DEFAULT_OPTION_DEVID.find((opt) => opt.name === device.DetType) || DEFAULT_OPTION_DEVID[0]
    SelectedModel = DEFAULT_OPTION_DEVID.find((opt) => opt.name === device.DevModel) || DEFAULT_OPTION_DEVID[0]
    SelectedRevision = DEFAULT_OPTION_DEVID.find((opt) => opt.name === device.DevRevision) || DEFAULT_OPTION_DEVID[0]
  }

  const handleAddDevice = () => {
    $CatalogStore.DevID = `${SelectedCategory?.name}${SelectedType?.name}${SelectedModel?.name}${SelectedRevision?.name}`

    /* Проверяем поля */
    const fieldsToCheck: Array<{ key: keyof ICatalogDevice; id: string }> = [
      { key: 'DevID', id: 'DevID' },
      { key: 'DevName', id: 'DevName' },
      { key: 'Brief', id: 'Brief' },
      { key: 'Description', id: 'Description' },
      { key: 'Icon', id: 'newIcon' },
      { key: 'VerFW', id: 'VerFW' },
      { key: 'Firmware', id: 'Firmware' },
      { key: 'Manual', id: 'Manual' },
      { key: 'API', id: 'API' },
    ]

    fieldsToCheck.forEach(({ key, id }) => {
      const value = $CatalogStore[key]
      const element = document.getElementById(id)
      if (element) {
        element.classList.toggle('border-red-500', !value)
      }
    })

    /* Проверка на заполнение всех обязательных полей перед сохранением */
    const isValid = fieldsToCheck.every(({ key }) => !!$CatalogStore[key])
    if (isValid) {
      onSave($CatalogStore)
    }
  }

  /**
   * ОБРАБОТКА ПРИКРЕПЛЕНИЯ ФАЙЛОВ
   */
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
</script>

{#if $CatalogStore}
  <div class="bg-opacity-80 fixed inset-0 z-50 flex items-center justify-center bg-black">
    <div
      class={`flex h-[75%] max-w-[160rem] min-w-[60rem] flex-col overflow-auto rounded-2xl p-5 text-center
      ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
    >
      <h2>{t('service.catalog.title_edit', currentLang)}</h2>

      <!-- Иконка, DevID, DevName, Created, Updated, VerFW -->
      <div
        class={`m-1 flex items-start rounded-2xl border border-gray-400 p-2
        ${currentTheme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}
      >
        <!-- Иконка -->
        <div class="flex h-40 w-40 flex-shrink-0 items-center justify-center">
          <button
            class={`flex h-full w-full cursor-pointer items-center justify-center rounded-2xl border border-gray-400 p-2
              ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-700'}`}
            onclick={() => openFileDialog('newIcon')}
          >
            <img src={$CatalogStore.Icon} alt="Device Icon" class="h-full w-full object-cover" />
          </button>
          <input id="newIcon" type="file" accept=".svg" class="hidden" onchange={handleIconChange} />
        </div>

        <!-- Информация об устройстве -->
        <div class="mx-4 flex w-2/3 flex-grow flex-col">
          <!-- DevID -->
          <div class="mb-2 grid grid-cols-4 gap-2">
            <Select
              id="Category"
              label={t('service.catalog.category', currentLang)}
              props={{ disabled: isEditing ?? false, currentLang: currentLang }}
              options={DEFAULT_OPTION_DEVID_CATEGORY}
              value={SelectedCategory}
              onUpdate={(value) => (SelectedCategory = value)}
              className="w-full"
            />
            <Select
              id="Type"
              label={t('service.catalog.type', currentLang)}
              props={{ disabled: isEditing ?? false, currentLang: currentLang }}
              options={DEFAULT_OPTION_DEVID}
              value={SelectedType}
              onUpdate={(value) => (SelectedType = value)}
              className="w-full"
            />
            <Select
              id="Model"
              label={t('service.catalog.model', currentLang)}
              props={{ disabled: isEditing ?? false, currentLang: currentLang }}
              options={DEFAULT_OPTION_DEVID}
              value={SelectedModel}
              onUpdate={(value) => (SelectedModel = value)}
              className="w-full"
            />
            <Select
              id="Revision"
              label={t('service.catalog.revision', currentLang)}
              props={{ disabled: isEditing ?? false, currentLang: currentLang }}
              options={DEFAULT_OPTION_DEVID}
              value={SelectedRevision}
              onUpdate={(value) => (SelectedRevision = value)}
              className="w-full"
            />
          </div>

          <!-- DevName, VerFW -->
          <div class="grid grid-cols-4 gap-2">
            <div class="col-span-3 flex flex-col">
              <Input
                id="DevName"
                props={{ autocomplete: 'on', maxLength: 16 }}
                allowOnly={/[^0-9a-zA-Z- _.#]/g}
                label={t('service.catalog.devname', currentLang)}
                className="w-full"
                bind:value={$CatalogStore.DevName}
              />
            </div>
            <div class="flex flex-col">
              <Input
                id="VerFW"
                props={{ autocomplete: 'on', maxLength: 7 }}
                allowOnly={/[^0-9.]/g}
                label={t('service.catalog.verfw', currentLang)}
                className="w-full"
                bind:value={$CatalogStore.VerFW}
                onUpdate={validateVerFW}
              />
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
        class={`m-1 rounded-2xl border border-gray-400 p-2
        ${currentTheme === 'light' ? 'bg-gray-50' : 'bg-gray-600'}`}
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

      <div class="mt-auto mb-4 flex justify-center">
        <Button
          onClick={onCancel}
          label={t('common.cancel', currentLang)}
          props={{ bgColor: 'bg-red-200' }}
          className="m-1 mx-4 w-48 rounded-2xl"
        />
        <Button
          onClick={handleAddDevice}
          label={t('common.save', currentLang)}
          props={{ bgColor: 'bg-green-200' }}
          className="m-1 mx-4 w-48 rounded-2xl"
        />
      </div>
    </div>
  </div>
{/if}
