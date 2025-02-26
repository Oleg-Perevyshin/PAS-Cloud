<!-- src/routes/dashboard/devices/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { slide } from 'svelte/transition'
  import { t, Language } from '$lib/locales/i18n'
  import * as yaml from 'js-yaml'
  import { page } from '$app/stores'
  import type {
    IUser,
    IDevice,
    IOptionUI,
    IDeviceModule,
    IReqModuleList,
    IReqModuleConfig,
    IWebSocketValueStatus,
    IUIComponentHandler
  } from '../../../../stores/Interfaces'
  import { LoaderStore, ThemeStore, UserStore, WebSocketStore, DeviceStore } from '../../../../stores'
  import { API_CatalogDevice } from '$lib/utils/API'

  import Paragraph from '$lib/components/UI/Paragraph.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Select from '$lib/components/UI/Select.svelte'
  import Slider from '$lib/components/UI/Slider.svelte'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'

  const DevSN = $page.params.id
  let DevGroupID: string | null = $state(null)

  let isExpandedBlock: { [key: string]: boolean } = $state({})
  let isExpandedParameters: { [key: string]: boolean } = $state({})
  let currentLang: string | undefined = $state()
  let currentTheme: string | undefined = $state()
  let UserData: IUser | undefined = $state()
  let currentDevice: IDevice | null = $state(null)
  let selectedModule: IDeviceModule | null = $state(null)
  let StatusData: IWebSocketValueStatus | null = $state(null)

  let isInitialized: boolean = $state(false)
  let joinFetched = false
  let joinGroupFetched = false
  let moduleListFetched = false
  let moduleConfigFetched = false

  /* Динамические переменные */
  let dynamicValues: { [key: string]: string | number | boolean | null } = $state({})

  interface IModuleList {
    DevSN: string
    DevName: string
    DevFW: string
  }

  onMount(() => {
    /* Подписки на состояние */
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
      Theme: ThemeStore.subscribe((value) => (currentTheme = value)),
      User: UserStore.subscribe((value) => {
        UserData = value
        /* Ищем устройство по серийному номеру в хранилищи пользователя */
        const userDevice = value.Devices.find((device) => device.DevSN === DevSN)
        if (userDevice) {
          currentDevice = {
            DevID: userDevice.DevID,
            Icon: userDevice.CatIcon,
            DevSN: userDevice.DevSN,
            DevName: userDevice.DevName || userDevice.CatDevName,
            DevFW: userDevice.DevFW || '-',
            VerFW: userDevice.CatVerFW,
            Brief: userDevice.CatBrief,
            IsOnline: userDevice.IsOnline,
            Modules: [],
          }
          DeviceStore.update((store) => ({ ...store, apiData: currentDevice }))
        }
      }),

      Device: DeviceStore.subscribe((store) => {
        currentDevice = store.apiData
        dynamicValues = store.dynamicValues || {}
      }),

      WebSocket: WebSocketStore.subscribe(async (state) => {
        /* Обновление динамических значений при получении нового статуса */
        StatusData = state.status
        if (StatusData && StatusData.Status.Changes) {
          Object.entries(StatusData.Status.Changes).forEach(([key, value]) => {
            const dynamicKey = `${StatusData?.ClientID}_${key}`
            dynamicValues[dynamicKey] = value
            DeviceStore.update((store) => ({
              ...store,
              dynamicValues: { ...store.dynamicValues, [dynamicKey]: value },
            }))
          })
        }

        /* Находим группу изделия и подключаемся к ней */
        const group = state.groupList.find((g) => g.GroupName === DevSN)
        if (group && group.GroupID && DevGroupID !== group.GroupID) {
          DevGroupID = group.GroupID
          if (UserData?.UserID && DevGroupID && !joinFetched) {
            joinFetched = true
            WebSocketStore.sendPacket('SYS', 'JoinGroup', { ClientID: UserData.UserID, GroupID: DevGroupID })
          }
        }

        /* Подключились к группе изделия, запрашиваем состав изделия (список модулей: [{DevSN, DevName, DevFW},...,{DevSN, DevName, DevFW}]) */
        if (
          state.lastResponse?.HEADER === 'OK!' &&
          state.lastResponse.ARGUMENT === 'JoinGroup' &&
          'GroupID' in state.lastResponse.VALUE &&
          state.lastResponse.VALUE.GroupID === DevGroupID
        ) {
          if (UserData?.UserID && DevGroupID && !joinGroupFetched) {
            joinGroupFetched = true /* Запрос на присоединение к группе выполнен */
            WebSocketStore.sendPacket('GET', 'ModuleList', {
              ClientID: UserData.UserID,
              DevSN: DevSN,
              GroupID: DevGroupID,
            })
          }
        }

        /* Получили список модулей в изделии */
        if (
          state.lastResponse?.HEADER === 'OK!' &&
          state.lastResponse.ARGUMENT === 'ModuleList' &&
          'GroupID' in state.lastResponse.VALUE &&
          state.lastResponse.VALUE.GroupID === DevGroupID
        ) {
          if (UserData?.UserID && DevGroupID && !moduleListFetched) {
            moduleListFetched = true /* Запрос на получение списка модулей в изделии выполнен */
            const { ModuleList } = state.lastResponse.VALUE as IReqModuleList
            await getDevicesAPI(ModuleList)
            isInitialized = true
          }
        }

        /* Получили настройки модуля */
        if (
          state.lastResponse?.HEADER === 'OK!' &&
          state.lastResponse.ARGUMENT === 'ModuleConfig' &&
          'GroupID' in state.lastResponse.VALUE &&
          state.lastResponse.VALUE.GroupID === DevGroupID
        ) {
          if (UserData?.UserID && DevGroupID && !moduleConfigFetched) {
            moduleConfigFetched = true /* Запрос на получение настроек модуля выполнен */
            const { ModuleConfig } = state.lastResponse.VALUE as IReqModuleConfig

            /* Обновляем динамические переменные */
            if (typeof ModuleConfig === 'object' && ModuleConfig !== null) {
              Object.entries(ModuleConfig).forEach(([key, value]: [string, string | number | null]) => {
                const dynamicKey = `${ModuleConfig.DevSN}_${key}`
                dynamicValues[dynamicKey] = value
                DeviceStore.update((store) => ({
                  ...store,
                  dynamicValues: { ...store.dynamicValues, [dynamicKey]: value },
                }))
                // console.log(`Установлено значение: ${dynamicKey} = ${value}`)
              })
            } else {
              console.error('ModuleConfig не является объектом или пуст')
            }
          }
        }
      }),
    }

    /* Очистка подписок и обработчиков событий */
    return () => {
      if (UserData?.UserID && DevGroupID) {
        WebSocketStore.sendPacket('SYS', 'LeaveGroup', { ClientID: UserData.UserID, GroupID: DevGroupID })
      }
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

  /* Запрашиваем данные обо всех модулях в изделии из БД */
  const getDevicesAPI = async (moduleList: IModuleList[]): Promise<boolean> => {
    LoaderStore.set(true)
    try {
      /* Проверка наличия модулей в списке */
      if (!moduleList?.length) {
        throw new Error('Список модулей пуст')
      }

      /* Массив для хранения данных модулей и динамических ключей */
      const modulesApi: IDeviceModule[] = []
      const dynamicKeys: string[] = []

      /* Параллельный запрос для получения данных по каждому модулю */
      const moduleRequests = moduleList.map(async (module) => {
        const DevID = module.DevSN.substring(0, 4)
        const responseData = await API_CatalogDevice(DevID)
        if (!responseData?.catalog) {
          throw new Error(`Неверные данные для модуля: ${module.DevSN}`)
        }
        const { API } = responseData.catalog
        let parsedAPI
        try {
          parsedAPI = yaml.load(API)
        } catch {
          throw new Error(`Ошибка парсинга YAML для модуля: ${module.DevSN}`)
        }

        const moduleData: IDeviceModule = {
          ...parsedAPI,
          DevID: responseData.catalog.DevID || '',
          Icon: responseData.catalog.Icon || '',
          Brief: responseData.catalog.Brief || '',
          VerFW: responseData.catalog.VerFW || '',
          DevSN: module.DevSN || '',
          DevName: module.DevName || '',
          DevFW: module.DevFW || '',
        } as IDeviceModule

        /* Инициализация динамических переменных для каждого UI-компонента в каждом блоке */
        moduleData.UIBlocks.forEach((block) => {
          if (Array.isArray(block.Parameters)) {
            block.Parameters.forEach((parameter) => {
              parameter.UIComponents.forEach((component) => {
                const uniqueKey = `${module.DevSN}_${component.UiID}`
                DeviceStore.update((current) => ({
                  ...current,
                  dynamicValues: {
                    ...current.dynamicValues,
                    [uniqueKey]: '',
                  },
                }))
                dynamicKeys.push(uniqueKey)
              })
            })
          }
        })
        return moduleData
      })

      /* Ждем завершения всех запросов и обновляем DeviceStore с модулями */
      const resolvedModules = await Promise.all(moduleRequests)
      modulesApi.push(...resolvedModules)
      DeviceStore.update((store) => ({
        ...store,
        apiData: {
          ...store.apiData,
          Modules: modulesApi,
          DevID: modulesApi[0]?.DevID || '',
          Icon: modulesApi[0]?.Icon || '',
          DevSN: modulesApi[0]?.DevSN || '',
          DevName: modulesApi[0]?.DevName || '',
          DevFW: modulesApi[0]?.DevFW || '',
          VerFW: modulesApi[0]?.VerFW || '',
          Brief: modulesApi[0]?.Brief || '',
          IsOnline: true,
        },
      }))

      // console.log('Созданы переменные:', dynamicKeys)

      return true
    } catch (error) {
      console.error('Ошибка получения данных о модулях: ', error)
      return false
    } finally {
      LoaderStore.set(false)
    }
  }

  /* Обработчики для UI компонентов */
  const handleUIComponentEvent = (
    handler: IUIComponentHandler | null | undefined,
    value: {
      DynamicVariable: string
      SelectedValue: string | number | null
    } | null,
  ) => {
    if (handler && handler.Action) {
      switch (handler.Action) {
        case 'none': {
          break
        }

        /* Обновление значения динамической переменной в сторе */
        case 'updateValue': {
          if (value?.DynamicVariable) {
            const dynamicKey = value.DynamicVariable
            const newValue = value.SelectedValue
            DeviceStore.setDynamicValue(dynamicKey, newValue)
            dynamicValues[dynamicKey] = newValue
          }
          break
        }

        /* Обновление значения динамической переменной в сторе и отправка в WebSocket */
        case 'setValue': {
          if (handler.Header && handler.Argument && handler.Variables && value?.DynamicVariable) {
            const packetValue: { [key: string]: string | number | boolean | null } = {}
            const parts = value.DynamicVariable.split('_')
            const DevSN = parts[0]
            const dynamicKey = value.DynamicVariable
            const newValue = value.SelectedValue
            DeviceStore.setDynamicValue(dynamicKey, newValue)
            packetValue[parts[1]] = newValue
            WebSocketStore.sendPacket(handler.Header, handler.Argument, {
              ClientID: UserData?.UserID,
              DevSN: DevSN,
              GroupID: DevGroupID,
              Data: packetValue,
            })
          }
          break
        }

        /* Обновление значений динамических переменных в сторе и отправка в WebSocket */
        case 'setValues': {
          if (handler.Header && handler.Argument && handler.Variables && value?.DynamicVariable) {
            const packetValue: { [key: string]: string | number | boolean | null } = {}
            const parts = value.DynamicVariable.split('_')
            const DevSN = parts[0]
            handler.Variables.forEach((varName) => {
              const dynamicKey = `${DevSN}_${varName}`
              const dynamicValue = get(DeviceStore).dynamicValues[dynamicKey]
              packetValue[varName] = dynamicValue
              DeviceStore.setDynamicValue(dynamicKey, dynamicValue)
            })
            WebSocketStore.sendPacket(handler.Header, handler.Argument, {
              ClientID: UserData?.UserID,
              DevSN: DevSN,
              GroupID: DevGroupID,
              Data: packetValue,
            })
          }
          break
        }

        default:
          console.warn('handleUIComponentEvent Неизвестный тип обработчика:', handler.Action)
      }
    }
  }

  /* Переключение между модулями */
  const getModuleConfig = (module: IDeviceModule) => {
    if (DevSN && DevGroupID) {
      WebSocketStore.sendPacket('GET', 'ModuleConfig', {
        ClientID: UserData?.UserID,
        DevSN: DevSN,
        ModuleSN: module.DevSN,
        GroupID: DevGroupID,
      })
    }
    selectedModule = module
    moduleConfigFetched = false
  }
</script>

<!-- Разметка компонента -->
{#if UserData?.Role && ['ENGINEER', 'MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full flex-col">
    <h2 class="sticky top-0">{t('common.controls', currentLang)}</h2>
    <!-- Сборная информация о модуле -->
    {#if currentDevice}
      <br />
      <div class="m-1 flex flex-row items-center p-1">
        <!-- Иконка изделия из каталога -->
        <div class="flex h-20 w-20 flex-shrink-0 items-center justify-center">
          <img src={currentDevice.Icon} alt="Device Icon" class="h-full w-full object-cover" />
        </div>

        <!-- Краткая информация об изделии (Имя, серийный номер, версия прошивки) -->
        <div class="ml-6 flex w-1/4 flex-col items-start">
          <h4>{currentDevice?.DevName}</h4>
          <p class="text-xs text-gray-400">{currentDevice?.DevSN}</p>
          <p class="text-xs text-gray-400">{t('dashboard.device.devfw', currentLang)}: {currentDevice?.DevFW}</p>
        </div>

        <!-- Информация из каталога (Ссылка на изделие в каталоге, версия прошивки, краткое описание) -->
        <div class="flex w-3/4 flex-col items-start">
          <a href={`/products/${currentDevice.DevID}`} class="no-underline hover:no-underline">
            <p class="font-semibold">{t('dashboard.device.catid', currentLang)}: {currentDevice.DevID}</p>
          </a>
          <p>{t('dashboard.device.catverfw', currentLang)}: {currentDevice.VerFW}</p>
          <p class="text-justify text-gray-400">{currentDevice.Brief}</p>
        </div>
      </div>
      <hr class="my-2 border-gray-300" />
    {/if}

    {#if currentDevice && currentDevice.IsOnline && isInitialized}
      <!-- Блок кнопок для выбора конкретного модуля в изделии -->
      <div class={`overflow-none flex flex-grow flex-col items-center justify-start`}>
        <div class="mx-auto flex flex-wrap items-start justify-center p-2">
          {#if currentDevice.Modules.length > 0}
            {#each currentDevice.Modules as module}
              <button
                class={`m-1 w-52 cursor-pointer rounded-2xl border-3 p-1
              ${selectedModule && selectedModule.DevSN === module.DevSN ? 'border-blue-400' : 'border-gray-400'}
              ${currentTheme === 'light' ? '!bg-white' : '!bg-gray-600'}
            `}
                onclick={() => getModuleConfig(module)}
              >
                <div class={`flex h-10 items-start justify-between rounded-t-xl`}>
                  <div class="mt-1 ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    <img src={module.Icon} alt="Device Icon" class="h-full w-full object-cover" />
                  </div>
                  <div class={`mr-2 flex flex-col justify-center`}>
                    <h5 class="text-right underline">{module.DevName}</h5>
                    <p class="text-right text-xs text-gray-400">
                      {t('dashboard.device.devfw', currentLang)}: {module.DevFW}
                    </p>
                  </div>
                </div>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Область построения UI модуля -->
      <div class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-400">
        <!-- Верхнее поле -->
        <div
          class={`flex h-auto w-full flex-col justify-center border-b border-gray-400 p-1
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`}
        >
          {#if selectedModule}
            <div class="m-1 flex flex-col items-center rounded-2xl">
              <a href={`/products/${selectedModule.DevID}`} class="no-underline hover:no-underline">
                <p class="font-semibold text-center">
                  {t('dashboard.device.device_sn', currentLang)}: {selectedModule.DevSN}
                </p>
              </a>
              <div class="flex w-full justify-center mt-2">
                <div class="flex w-1/3 flex-col items-center">
                  <p>
                    {t('dashboard.device.devfw', currentLang)}: {selectedModule.DevFW} | {t(
                      'dashboard.device.catverfw',
                      currentLang,
                    )}: {selectedModule.VerFW}
                  </p>
                </div>
                <div class="flex w-2/3 flex-col items-center">
                  <p class="text-justify text-gray-400">{selectedModule.Brief}</p>
                </div>
              </div>
              <p class="text-justify font-semibold text-fuchsia-400">
                {StatusData?.Status.Title}: {StatusData?.Status.Message}
              </p>
            </div>
          {:else}
            <h5>{t('dashboard.device.selectmodule')}</h5>
          {/if}
        </div>
        <!-- Содержимое выбранного модуля -->
        <div
          class={`flex flex-grow flex-col items-center justify-start overflow-y-auto
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`}
        >
          <!-- Отображение содержимого выбранного модуля -->
          {#if selectedModule}
            <div class="mx-auto flex flex-wrap items-start justify-center p-2" transition:slide={{ duration: 300 }}>
              <!-- Массив блоков, которые имеет модуль -->
              {#each selectedModule.UIBlocks as block, blockIndex}
                <div
                  class={`m-2 flex w-72 flex-col items-center justify-center rounded-2xl border border-gray-400
                shadow transition-shadow duration-250 hover:shadow
              `}
                >
                  <button
                    class={`
                  flex w-full flex-col items-center justify-between border last:rounded-b-2xl last:border-b-0
                  ${currentTheme === 'light' ? '!bg-yellow-100' : '!bg-yellow-700'}
                  ${isExpandedBlock[`${selectedModule.DevSN}_${blockIndex}`] ? 'rounded-t-2xl' : 'rounded-2xl'}
                `}
                    onclick={() => {
                      isExpandedBlock[`${selectedModule?.DevSN}_${blockIndex}`] =
                        !isExpandedBlock[`${selectedModule?.DevSN}_${blockIndex}`]
                    }}
                  >
                    <h4>{block.Label}</h4>
                    <p class="text-xs">{block.Description}</p>
                  </button>
                  {#if Array.isArray(block.Parameters)}
                    <!-- Массив наборов объединенных параметров -->
                    {#each block.Parameters as parameter, parameterIndex}
                      {#if isExpandedBlock[`${selectedModule?.DevSN}_${blockIndex}`]}
                        <div
                          class={`
                        flex w-full flex-col items-center justify-center border-b-2 border-gray-400 last:rounded-b-2xl
                        last:border-b-0
                      `}
                          transition:slide={{ duration: 300 }}
                        >
                          <button
                            class={`
                          flex w-full flex-col items-center justify-between
                        `}
                            onclick={() => {
                              isExpandedParameters[`${selectedModule?.DevSN}_${parameterIndex}_${parameter.ParamID}`] =
                                !isExpandedParameters[`${selectedModule?.DevSN}_${parameterIndex}_${parameter.ParamID}`]
                            }}
                          >
                            <h5>{parameter.Label}</h5>
                            <p class="text-xs text-gray-400">{parameter.Description}</p>
                          </button>
                          {#if Array.isArray(parameter.UIComponents)}
                            {#each parameter.UIComponents as component}
                              <!-- Содержимое блока с настройками и UI компонентами -->
                              {#if isExpandedParameters[`${selectedModule?.DevSN}_${parameterIndex}_${parameter.ParamID}`]}
                                <div
                                  class={`flex w-full flex-col items-center justify-center last:mb-4`}
                                  transition:slide={{ duration: 300 }}
                                >
                                  {#if component.Type === 'Paragraph'}
                                    <Paragraph
                                      id={component.UiID}
                                      label={component.Label}
                                      value={dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]}
                                      className={component.ClassName}
                                    />
                                  {:else if component.Type === 'ProgressBar'}
                                    <ProgressBar
                                      id={component.UiID}
                                      label={component.Label}
                                      className={component.ClassName}
                                      bind:value={dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]}
                                    />
                                  {:else if component.Type === 'Button'}
                                    <Button
                                      id={component.UiID}
                                      props={component.Props}
                                      label={component.Label}
                                      className={component.ClassName}
                                      onClick={() => {
                                        const dynamicKey = `${selectedModule?.DevSN}_${component.UiID}`
                                        handleUIComponentEvent(component.EventHandler, {
                                          DynamicVariable: dynamicKey,
                                          SelectedValue: null,
                                        })
                                      }}
                                    />
                                  {:else if component.Type === 'Input'}
                                    <Input
                                      id={component.UiID}
                                      props={component.Props}
                                      label={component.Label}
                                      className={component.ClassName}
                                      bind:value={dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]}
                                      onUpdate={(value) => {
                                        const dynamicKey = `${selectedModule?.DevSN}_${component.UiID}`
                                        handleUIComponentEvent(component.EventHandler, {
                                          DynamicVariable: dynamicKey,
                                          SelectedValue: value,
                                        })
                                      }}
                                    />
                                  {:else if component.Type === 'Select'}
                                    <Select
                                      id={component.UiID}
                                      label={component.Label}
                                      props={component.Props}
                                      value={{
                                        id: component.UiID,
                                        name: String(dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]),
                                        color: '',
                                      }}
                                      options={component.Options}
                                      className={component.ClassName}
                                      onUpdate={(value: IOptionUI | null) => {
                                        const dynamicKey = `${selectedModule?.DevSN}_${component.UiID}`
                                        handleUIComponentEvent(component.EventHandler, {
                                          DynamicVariable: dynamicKey,
                                          SelectedValue: value?.name ?? null,
                                        })
                                      }}
                                    />
                                  {:else if component.Type === 'Slider'}
                                    <Slider
                                      id={component.UiID}
                                      label={component.Label}
                                      props={component.Props}
                                      className={component.ClassName}
                                      value={dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]}
                                      onUpdate={(value) => {
                                        const dynamicKey = `${selectedModule?.DevSN}_${component.UiID}`
                                        handleUIComponentEvent(component.EventHandler, {
                                          DynamicVariable: dynamicKey,
                                          SelectedValue: value,
                                        })
                                      }}
                                    />
                                  {:else if component.Type === 'ButtonGroup'}
                                    <ButtonGroup
                                      id={component.UiID}
                                      label={component.Label}
                                      value={dynamicValues[`${selectedModule.DevSN}_${component.UiID}`]}
                                      props={component.Props}
                                      options={component.Options}
                                      onChange={(value) => {
                                        const dynamicKey = `${selectedModule?.DevSN}_${component.UiID}`
                                        handleUIComponentEvent(component.EventHandler, {
                                          DynamicVariable: dynamicKey,
                                          SelectedValue: value.id ?? null,
                                        })
                                      }}
                                    />
                                  {:else}
                                    <p>{t('dashboard.device.unknownui', currentLang)}: {component.Type}</p>
                                  {/if}
                                </div>
                              {/if}
                            {/each}
                          {/if}
                        </div>
                      {/if}
                    {/each}
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Нижнее поле для сводной информации -->
        <div
          class={`flex h-8 items-center justify-center border-t border-gray-400
            ${currentTheme === 'light' ? '!bg-white' : 'bg-gray-600'}`}
        >
          {#if currentDevice && currentDevice.Modules && currentDevice.Modules.length > 0}
            <h5>{t('dashboard.device.modules_num')} {currentDevice?.Modules.length}</h5>
          {:else}
            <h5>{t('dashboard.device.modules_num')} 0</h5>
          {/if}
        </div>
      </div>
    {:else}
      <h3>{t('dashboard.device.loadproblem')}</h3>
    {/if}
  </div>
{/if}
