<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import type { IWebSocketPacket, IOptionUI } from '../../stores/Interfaces'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'
  import ColorPicker from '$lib/components/UI/ColorPicker.svelte'
  import Switch from '$lib/components/UI/Switch.svelte'

  import Accordion from '$lib/UILibrary/Accordion.svelte'
  import UIInput from '$lib/UILibrary/Input.svelte'
  import UiIcon from '$lib/appIcons/UiIcon.svelte'
  import Separator from '$lib/UILibrary/Separator.svelte'
  import UISlider from '$lib/UILibrary/Slider.svelte'
  import FileInput from '$lib/UILibrary/FileInput.svelte'
  import Select from '$lib/UILibrary/Select.svelte'
  import UISwitch from '$lib/UILibrary/Switch.svelte'
  import type { Colors, IOption } from '$lib/UILibrary/Interface'
  import Graph from '$lib/UILibrary/Graph.svelte'
  import UIColorPicker from '$lib/UILibrary/ColorPicker.svelte'
  import UIButton from '$lib/UILibrary/Button.svelte'
  import Table from '$lib/UILibrary/Table.svelte'

  const wifiModeList: IOption[] = [
    { id: 1, name: 'Станция' },
    { id: 2, name: 'Точка доступа' },
    { id: 3, name: 'Гибрид', color: 'amber' },
  ]

  const accessPoints: IOption[] = [
    { id: 1, name: 'point1' },
    { id: 2, name: 'point2' },
  ]
  let ap: IOption = $state(accessPoints[0])

  let selectValue: IOption = $state(wifiModeList[0])
  let buttonItem: IOption = $state(wifiModeList[2])
  let inputString = $state('')
  let inputNumber = $state(4)
  let counter = $state(0)

  let sliderValue: number | [number, number] = $state(12)
  let text = $state(
    'Проблема в том, что груз задачи мешает работать. Мы ведь понимаем, что это надолго. А большую задачу делать не хочется... ' +
      'Поэтому мы ее откладываем, беремся за задачи поменьше. В итоге да, день прошел, а мы не успели закончить. ' +
      'А если не тратить время на размышления «сколько времени это у меня займет», а сосредоточиться на конкретной задаче (в данном случае — ' +
      'первом письме из стопки, потом втором...), то не успеете оглянуться, как уже всё разгребли!',
  )

  function clickItem(id: string) {
    console.log(id)
  }

  // данные для таблицы - массив колонок и строк
  interface Device {
    id: string
    name: string
    status: 'online' | 'offline'
    lastActive: Date
    action?: string
  }

  const rows: Device[] = [
    { id: '# 1', name: 'Device A', status: 'online', lastActive: new Date() },
    { id: '# 2', name: 'Device B', status: 'offline', lastActive: new Date(Date.now() - 86400000 * 4) },
    { id: '# 3', name: 'Device C', status: 'offline', lastActive: new Date(Date.now() - 86400000) },
  ]

  interface IColumn<T extends object> {
    label: string
    key: keyof T
    width?: string
    formatter?: (value: any, row: T) => string | number
    button?: {
      text?: string
      color?: Colors
      style?: string
      onClick?: (row: T) => void
      disabled?: (row: T) => boolean
    }
  }

  const columns: IColumn<Device>[] = [
    { label: 'ID', key: 'id', width: '10%' },
    { label: 'Name', key: 'name' },
    {
      label: 'Status',
      key: 'status',
      formatter: (value: string) => (value === 'online' ? '🟢 Online' : '🔴 Offline'),
    },
    {
      label: 'Last Active',
      key: 'lastActive',
      formatter: (value: { toLocaleDateString: () => any }) => value.toLocaleDateString(),
    },
    {
      label: 'Actions',
      key: 'action',
      button: {
        text: 'Click',
        color: 'red',
        onClick: (row) => clickItem(row.id),
      },
    },
  ]

  // генерация данных для графика
  const generateSmoothData = () => {
    let y = 0
    const data = []

    for (let x = 0; x < 100; x++) {
      y = 2 * Math.sin(x / 10) + Math.random() * 2
      data.push({ x, y })
    }

    return data
  }

  const data = generateSmoothData()

  import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'
  import { DEFAULT_TAGS } from '../../enums'

  const RadioGroupOption = [
    { id: 'tag-1', name: 'Tag 1', color: 'bg-stone-400 border-2 !border-stone-400' },
    { id: 'tag-2', name: 'Tag 2', color: 'bg-red-400 border-2 !border-red-400' },
    { id: 'tag-3', name: 'Tag 3', color: 'bg-orange-400 border-2 !border-orange-400' },
    { id: 'tag-4', name: 'Tag 4', color: 'bg-amber-400 border-2 !border-amber-400' },
    { id: 'tag-5', name: 'Tag 5', color: 'bg-yellow-400 border-2 !border-yellow-400' },
    { id: 'tag-6', name: 'Tag 6', color: 'bg-lime-400 border-2 !border-lime-400' },
    { id: 'tag-7', name: 'Tag 7', color: 'bg-green-400 border-2 !border-green-400' },
    { id: 'tag-8', name: 'Tag 8', color: 'bg-emerald-400 border-2 !border-emerald-400' },
    { id: 'tag-9', name: 'Tag 9', color: 'bg-teal-400 border-2 !border-teal-400' },
    { id: 'tag-10', name: 'Tag 10', color: 'bg-cyan-400 border-2 !border-cyan-400' },
    { id: 'tag-11', name: 'Tag 11', color: 'bg-sky-400 border-2 !border-sky-400' },
    { id: 'tag-12', name: 'Tag 12', color: 'bg-blue-400 border-2 !border-blue-400' },
    { id: 'tag-13', name: 'Tag 13', color: 'bg-indigo-400 border-2 !border-indigo-400' },
    { id: 'tag-14', name: 'Tag 14', color: 'bg-violet-400 border-2 !border-violet-400' },
    { id: 'tag-15', name: 'Tag 15', color: 'bg-purple-400 border-2 !border-purple-400' },
    { id: 'tag-16', name: 'Tag 16', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
    { id: 'tag-17', name: 'Tag 17', color: 'bg-pink-400 border-2 !border-pink-400' },
    { id: 'tag-18', name: 'Tag 18', color: 'bg-rose-400 border-2 !border-rose-400' },
  ]

  let radioButtonValue: IOptionUI | null = $state({ id: '7', name: 'B7', color: 'bg-cyan-400 border-2 !border-cyan-400' })
  const handleRadioButton = (value: IOptionUI) => {
    console.log('ButtonGroup Value:', value)
    radioButtonValue = value
  }

  let packHeader: string = $state('GET')
  let packArgument: string = $state('ConfigList')
  let packValue: string = $state('{"3":"4"}')

  const testCrypto = () => {
    if (!packHeader || !packArgument) {
      return console.log(`Поле Header или Argument не может быть пустым`)
    }
    const parsedValue = JSON.parse(packValue)
    if (!parsedValue) {
      return console.error('Ошибка содержимого поля Value')
    }
    const EncryptResponse = EncryptWebSocketPacket(packHeader, packArgument, parsedValue) as Uint8Array
    const DecryptResponse = DecryptWebSocketPacket(new Uint8Array(EncryptResponse)) as IWebSocketPacket
    console.info('Encrypt Data:', EncryptResponse)
    console.info('Decrypt Data:', DecryptResponse)
  }

  // const handleProgressBar = (value: number) => {
  //   console.log('Slider Value:', value)
  //   sliderValue = value
  // }

  let progressBarValue: number = $state(50)
  /* Функция для уменьшения значения прогресс-бара */
  const decreaseProgressBar = () => {
    if (progressBarValue > 0) {
      progressBarValue -= 10
    }
  }
  const resetProgressBar = () => {
    progressBarValue = 50
  }
  const increaseProgressBar = () => {
    if (progressBarValue < 100) {
      progressBarValue += 10
    }
  }

  /* Начальное значение цвета */
  let colorValue = $state([150, 250, 50])
  const handleColorUpdate = (newColor: number[]) => {
    colorValue = newColor
  }

  /* Switch */
  let switchValue: boolean | null = $state(false)
  const toggleSwitch = (value: boolean | number) => {
    // console.log('toggleSwitch Value:', value)
    switchValue = !!value
  }
</script>

<div class="flex h-full flex-col items-center overflow-hidden overflow-y-visible">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
  </div>

  <div class="flex flex-wrap items-start justify-center">
    <Accordion id="acc1" label={{ text: 'Graph component (в разработке)' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <Graph {data} width={800} label="График" xLabel="Время" yLabel="Значение" />
      <UIColorPicker id="ColorPicker" label={{ text: 'Test Color Picker' }} style={{ styleCSS: 'width: 25rem;' }} value={[255, 100, 0]} />
      <Separator visible={false} />
      <UIButton
        id="button1"
        validation={{ text: 'Сохранить' }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'green' }}
        onClick={() => counter++}
      />
    </Accordion>

    <Accordion id="acc2" label={{ text: 'Пример использования: Настройки WiFi' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: true }}>
      <UIButton
        id="button2"
        label={{ text: 'Режимы wifi' }}
        style={{ bgColor: 'blue', optionsWidth: 'max-option' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />

      <Accordion id="acc3" label={{ text: 'Настройки режима STA' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }} validation={{ initialState: false }}>
        <Select
          label="Точка доступа"
          options={accessPoints}
          value={ap}
          styleCSS="width: 20rem;"
          onUpdate={(value) => (selectValue = value)}
          showCustomOption
          color="white"
        />

        <UIInput
          id="sta-psk"
          label={{ text: 'Пароль' }}
          style={{ inlineStyle: 'width: 30%;' }}
          validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter password' }}
        />

        <Separator visible={false} />

        <UISwitch label="Режим IP" captionLeft="Статический" captionRight="Динамический" color="blue" />
        <Separator visible={false} />
        <UIInput
          label={{ text: 'IP Address' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-ip"
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
        />

        <UIInput
          label={{ text: 'Mask' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-ms"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />

        <UIInput
          label={{ text: 'Gateway' }}
          style={{ inlineStyle: 'width: 30%;' }}
          id="sta-gw"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />
      </Accordion>

      <Accordion id="acc4" label={{ text: 'Настройки режима AP' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }} validation={{ initialState: true }}>
        <UIInput
          id="input-ap-ssid"
          label={{ text: 'Имя точки доступа' }}
          style={{ inlineStyle: 'width: 30%;', color: 'green' }}
          validation={{ type: 'text', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter string' }}
        />
        <UIInput
          id="input-ap-psk"
          label={{ text: 'Пароль точки доступа' }}
          style={{ inlineStyle: 'width: 30%;' }}
          validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
          bind:value={inputString}
          help={{ placeholder: 'Enter password' }}
        />

        <Separator visible={false} />

        <UIInput
          label={{ text: 'IP Address' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-ip"
          validation={{
            type: 'text',
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
        />

        <UIInput
          label={{ text: 'Mask' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-ms"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />

        <UIInput
          label={{ text: 'Gateway' }}
          style={{ inlineStyle: 'width: 20rem;' }}
          id="ap-gw"
          help={{ placeholder: 'XXX.XXX.XXX.XXX' }}
          validation={{
            autocomplete: 'on',
            RegExp:
              /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
          }}
        />
      </Accordion>
      <UIButton
        id="button2"
        validation={{ text: 'Сохранить' }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'green' }}
        onClick={() => counter++}
      />
      <UIButton
        id="button3"
        validation={{ text: 'Перезагрузить' }}
        style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'red' }}
        onClick={() => counter++}
      />
    </Accordion>

    <Accordion id="acc5" label={{ text: 'Button component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: true }}>
      <div style="display: flex; flex-wrap: wrap; align-items: center;">
        <UIButton
          id="button4"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'blue', icon: UiIcon }}
          onClick={() => counter++}
        />
        <UIButton
          id="button5"
          style={{
            level_2: 'margin: 0.5rem; height: 5rem; width: 5rem; border-radius: 50%;',
            bgColor: 'primary',
            icon: UiIcon,
            iconProps: { height: '3rem', width: '3rem' },
          }}
          onClick={() => counter++}
        />
        <UIButton
          id="button6"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'white' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button7"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 6rem; margin: 0.5rem; border-radius: 0;', bgColor: 'amber' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button8"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 6rem; margin: 0.5rem; height: 4rem;', bgColor: 'red' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button9"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem; box-shadow: 0px 0px 10px red;', bgColor: 'orange' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button10"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'lime' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button11"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem; border-radius: 5px; border: 1px solid grey;', bgColor: 'green' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button12"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'sky' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button13"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'purple' }}
          onClick={() => counter++}
        />
        <UIButton
          id="button14"
          validation={{ text: 'counter' }}
          style={{ level_2: 'width: 10rem; margin: 0.5rem;', bgColor: 'pink' }}
          onClick={() => counter++}
        />
        <p style="flex: 1;">Kнопка нажата <strong>{counter}</strong> раз</p>
      </div>

      <UIButton
        id="button15"
        label={{ text: 'Режимы wifi (ширина по длинной опции)' }}
        style={{ bgColor: 'rose', optionsWidth: 'max-option', level_1: 'width: 60%' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />
      <p style="flex: 1;">Bыбранный режим: {buttonItem.name}</p>
      <Separator visible={false} />

      <UIButton
        id="button16"
        label={{ text: 'Режимы wifi (автоматическая ширина)' }}
        style={{ bgColor: 'white', optionsWidth: 'auto' }}
        validation={{ options: wifiModeList, value: buttonItem }}
        onChange={(value) => (buttonItem = value)}
      />
    </Accordion>

    <Accordion id="acc6" label={{ text: 'Input component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <UIInput
        id="input-string"
        label={{ text: 'Поле ввода строки' }}
        style={{ inlineStyle: 'width: 60%;' }}
        validation={{ type: 'password', RegExp: /^[0-9a-z]{0,5}$/ }}
        bind:value={inputString}
        help={{ placeholder: 'Enter string' }}
      />
      <p style="margin-top: 0; width: 40%;">Введенная строка: {inputString}</p>
      <UIInput
        id="input-number"
        label={{ text: 'Поле ввода числа' }}
        style={{ inlineStyle: 'width: 20%;' }}
        validation={{ type: 'number' }}
        bind:value={inputNumber}
        help={{ placeholder: 'Enter number', info: 'Проблема в том, что груз задачи мешает работать. Мы ведь понимаем, что это надолго.' }}
      />
      <p style="margin-top: 0; width: 20%;">Введенное число: {inputNumber}</p>
      <Separator visible={false} />

      <UIInput
        id="input-text"
        label={{ text: 'Поле ввода текста' }}
        style={{ inlineStyle: 'width: 50%;', rows: 5 }}
        validation={{ type: 'text-area', disabled: false }}
        bind:value={text}
        help={{ placeholder: 'Enter text', info: 'info about this input' }}
      />
      <p style="margin-top: 0; width: 40%;">Введенный текст: {text}</p>

      <Accordion id="acc7" label={{ text: 'File input' }} style={{ inlineStyle: 'width: 100%;', type: 'sub' }}>
        <FileInput id="default-file-input" label={{ text: 'Upload document' }} style={{ styleCSS: 'width: 60%;' }} validation={{ accept: '.pdf,.doc,.docx' }} />
        <FileInput
          id="image-file-input"
          validation={{ type: 'image', accept: 'image/*' }}
          style={{ styleCSS: 'width: 30%;' }}
          label={{ text: 'Profile picture' }}
        />
      </Accordion>
    </Accordion>

    <Accordion id="acc8" label={{ text: 'Slider component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <!-- vertical -->
      <UISlider
        label="label"
        value={[100, 500]}
        min={50}
        max={1200}
        step={10}
        orientation="vertical"
        styleCSS="height: 20rem;"
        thumbColor="purple"
        sliderColor="sky"
        onUpdate={(value) => (sliderValue = value)}
        showStepButtons
      />

      <UISlider
        label="label"
        value={800}
        min={50}
        max={1200}
        step={10}
        styleCSS="height: 20rem;"
        orientation="vertical"
        onUpdate={(value) => (sliderValue = value)}
        showStepButtons
      />

      <UISlider
        label="label"
        value={[100, 500]}
        min={50}
        max={1200}
        step={10}
        orientation="vertical"
        styleCSS="height: 10rem;"
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        label="label"
        value={800}
        min={50}
        max={1200}
        step={10}
        styleCSS="height: 15rem;"
        orientation="vertical"
        thumbColor="orange"
        sliderColor="amber"
        onUpdate={(value) => (sliderValue = value)}
      />

      <Separator visible={false} />

      <!-- horizontal -->
      <UISlider
        label="label"
        value={[500, 600]}
        min={50}
        max={1200}
        step={10}
        orientation="horizontal"
        styleCSS="width: 20rem;"
        onUpdate={(value) => (sliderValue = value)}
        showStepButtons
      />

      <UISlider
        label="label"
        value={150}
        min={50}
        max={1200}
        step={10}
        styleCSS="width: 20rem;"
        orientation="horizontal"
        thumbColor="green"
        sliderColor="lime"
        onUpdate={(value) => (sliderValue = value)}
      />

      <Separator visible={false} />

      <UISlider
        label="label"
        value={[500, 1000]}
        min={50}
        max={1200}
        step={10}
        orientation="horizontal"
        styleCSS="width: 30rem;"
        sliderColor="sky"
        onUpdate={(value) => (sliderValue = value)}
      />

      <UISlider
        label="label"
        value={800}
        min={50}
        max={1200}
        step={10}
        styleCSS="width: 12rem;"
        orientation="horizontal"
        thumbColor="rose"
        sliderColor="red"
        onUpdate={(value) => (sliderValue = value)}
      />
    </Accordion>

    <Accordion id="acc9" label={{ text: 'Table component' }} style={{ inlineStyle: 'width: 100%;' }} validation={{ initialState: false }}>
      <Table {rows} {columns} label="Устройства" />
    </Accordion>

    <Accordion id="acc10" label={{ text: 'Еще что то' }} style={{ inlineStyle: 'width: 40%; margin: 1rem;' }} validation={{ initialState: false }}></Accordion>
    <Accordion id="acc11" label={{ text: 'Еще что то' }} style={{ inlineStyle: 'width: 40%; margin: 1rem;' }} validation={{ initialState: false }}></Accordion>
  </div>

  <ButtonGroup
    id="TestButtonGroup-1"
    label="Component - ButtonGroup"
    className="m-4"
    options={RadioGroupOption}
    value={radioButtonValue}
    onChange={handleRadioButton}
    props={{ disabled: false }}
  />

  <ButtonGroup
    id="TestButtonGroup-2"
    label="Default Tags"
    className="m-4"
    options={DEFAULT_TAGS}
    value={radioButtonValue}
    onChange={handleRadioButton}
    props={{ disabled: false }}
  />

  <br />

  <div class="flex flex-row">
    <Input id="TestInputHeader" bind:value={packHeader} props={{ autocomplete: 'on', maxLength: 8 }} className="m-1" />
    <Input id="TestInputArgument" bind:value={packArgument} props={{ autocomplete: 'on', maxLength: 16 }} className="m-1" />
    <Input id="TestInputValue" bind:value={packValue} props={{ autocomplete: 'on', maxLength: 32 }} className="m-1" />
    <Button onClick={testCrypto} label="Отправить" props={{ bgColor: 'bg-lime-200' }} className="m-1 w-40 rounded-2xl" />
  </div>

  <br />

  <ProgressBar id="testProgressBar" label="Component - ProgressBar" className="" bind:value={progressBarValue} />
  <div class="mt-4 flex">
    <Button onClick={decreaseProgressBar} label="-10" className="m-1" />
    <Button onClick={resetProgressBar} label="Сбросить" className="m-1" />
    <Button onClick={increaseProgressBar} label="+10" className="m-1" />
  </div>

  <br />

  <ColorPicker id="ColorPicker" label="Test Color Picker" className="w-full" bind:value={colorValue} onUpdate={handleColorUpdate} />

  <br />

  <Switch id="Switch" label="Test Switch" value={switchValue} className="" onUpdate={toggleSwitch} />

  <Separator visible={false} />
</div>
