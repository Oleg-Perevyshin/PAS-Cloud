<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import * as yaml from 'js-yaml'
  import { t, Language, LOCALES } from '$lib/locales/i18n'
  import { LoaderStore, ThemeStore, UserStore } from '../../../stores'
  import type { IUser } from '../../../stores/Interfaces'
  import type { IOption, IUIComponent } from '$lib/UILibrary/Interface'
  import { Accordion, Button, ColorPicker, FileInput, Graph, Input, Select, Separator, Slider, Switch, Table } from '$lib/UILibrary/index'
  import { API_CatalogDevice } from '$lib/utils/API'

  let currentLang: string | undefined = $state('ru')
  let currentTheme: string | undefined = $state()
  let UserData: IUser | undefined = $state()

  onMount(() => {
    /* Подписка на изменение языка */
    const unsubscribeLanguage = Language.subscribe((value) => {
      currentLang = value
    })

    /* Подписка на ThemeStore */
    const unsubscribeTheme = ThemeStore.subscribe((value) => {
      currentTheme = value
    })

    /* Подписка на изменение UserStore */
    const unsubscribeUserStore = UserStore.subscribe((value) => {
      UserData = value
    })

    /* Очистка подписок и обработчиков событий */
    return () => {
      unsubscribeLanguage()
      unsubscribeTheme()
      unsubscribeUserStore()
    }
  })

  let dataFromAPIFile: string | unknown = $state('')
  const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement | null
    if (target && target.files) {
      const file = target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            dataFromAPIFile = event.target.result as string
          }
        }
        reader.onerror = () => {
          console.error('Error reading file')
          dataFromAPIFile = ''
        }
        reader.readAsText(file)
      }
    }
  }

  let deviceID = $state('FFFF')
  let currentAPILanguage: IOption = $state({ id: 'ru', value: 'ru', name: 'ru' })
  let currentAPIVersion = $state('0.1')
  /* Запрашиваем данные обо всех модулях в изделии из каталога */
  const handlerGetAPI = async () => {
    LoaderStore.set(true)
    try {
      /* Проверка наличия модулей в списке */
      if (!deviceID || deviceID.length !== 4 || !currentAPILanguage.id || !currentAPIVersion) {
        throw new Error('Неверные входные данные')
      }
      const dynamicKeys: string[] = []
      const responseData = await API_CatalogDevice(deviceID.toUpperCase(), currentAPIVersion, currentAPILanguage.id as string)
      if (!responseData?.catalog) {
        return null
      }

      console.log(`Ответ от сервера: ${responseData.catalog}`)

      const { API } = responseData.catalog
      try {
        if (API) {
          dataFromAPIFile = yaml.load(API as string)
          console.log(dataFromAPIFile)
        } else {
          throw new Error(`Ошибка API для модуля: ${deviceID.toUpperCase() + '-' + currentAPILanguage.id + '-' + currentAPIVersion + '.yaml'}`)
        }
      } catch {
        throw new Error(`Ошибка парсинга YAML для модуля: ${deviceID.toUpperCase() + '-' + currentAPILanguage.id + '-' + currentAPIVersion + '.yaml'}`)
      }
    } catch (error) {
      console.error('Ошибка получения данных о модулях: ', error)
      return false
    } finally {
      LoaderStore.set(false)
    }
  }

  const handlerSaveAPI = () => {}
</script>

{#if UserData?.Role && ['ENGINEER', 'MANAGER', 'ADMIN'].includes(UserData.Role)}
  <div class="flex h-full w-full flex-col items-stretch overflow-auto">
    <h2>{t('service.constructor.title', currentLang)}</h2>
    <div class="flex w-full flex-row">
      <hr class="w-full border-t border-gray-400" />
    </div>

    <div class="flex flex-row items-end justify-center">
      <FileInput
        id="yaml-input"
        label={{ text: t('service.constructor.yaml_input', currentLang) }}
        style={{ styleCSS: 'width: 30rem; margin: 0 1rem;' }}
        validation={{ accept: '.yaml' }}
        onFileChange={(e: Event) => handleFileChange(e)}
      />
      <Input
        id="device-id"
        styleCSS="width: 10rem; margin: 0 1rem;"
        bind:value={deviceID}
        label={t('service.constructor.api_name', currentLang)}
        RegExp={/^[0-9a-fA-F]{0,4}$/}
      />
      <Select
        id="api-lang"
        label={t('service.constructor.api_lang', currentLang)}
        options={LOCALES.map((locale, index) => ({
          id: index + 1,
          value: locale.id,
          name: locale.id,
        }))}
        value={currentAPILanguage}
        styleCSS="width: 6rem;"
      />
      <Input
        id="device-id"
        styleCSS="width: 10rem; margin: 0 1rem;"
        bind:value={currentAPIVersion}
        label={t('service.constructor.api_name', currentLang)}
        RegExp={/^[0-9]*.[0-9]*$/}
      />
      <Button
        id="load-button"
        style={{ level_1: 'width: 10rem;', bgColor: 'blue' }}
        validation={{ text: t('service.constructor.load', currentLang) }}
        onClick={() => handlerGetAPI()}
      />
      <Button
        id="save-button"
        style={{ level_1: 'width: 10rem;', bgColor: 'blue' }}
        validation={{ text: t('service.constructor.save', currentLang) }}
        onClick={() => handlerSaveAPI()}
      />
    </div>

    <Separator label="Название" color="blue" />
    <p>{dataFromAPIFile}</p>
  </div>
{/if}
