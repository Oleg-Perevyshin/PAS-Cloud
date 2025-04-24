<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import Accordion from '$lib/components/UILibrary/Accordion.svelte'
  import Button, { type IOption } from '$lib/components/UILibrary/Button.svelte'
  import Input from '$lib/components/UILibrary/Input.svelte'
  import UiIcon from '$lib/appIcons/UiIcon.svelte'
  import Separator from '$lib/components/UILibrary/Separator.svelte'
  import Slider from '$lib/components/UILibrary/Slider.svelte'
  import FileInput from '$lib/components/UILibrary/FileInput.svelte'
  import Select from '$lib/components/UILibrary/Select.svelte'
  import Switch from '$lib/components/UILibrary/Switch.svelte'
  import Table, { type Colors } from '$lib/components/UILibrary/Table.svelte'
  import Graph from '$lib/components/UILibrary/Graph.svelte'
    import ColorPicker from '$lib/components/UILibrary/ColorPicker.svelte'

  const wifiModeList: IOption[] = [
    { id: 1, name: 'Станция' },
    { id: 2, name: 'Точка доступа' },
    { id: 3, name: 'Гибрид' },
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
  let switchValue = $state(false)

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
      buttonCSS?: string
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
      y = 2 * Math.sin(x / 10) + Math.random()
      data.push({ x, y })
    }

    return data
  }

  const data = generateSmoothData()
</script>

<div class="flex h-full w-full flex-col items-stretch overflow-auto">
  <h2>Страница для тестирования UI компонентов</h2>
  <Separator visible={false} />

  <div class="flex flex-wrap justify-center">
    <Accordion label="Пример использования: Настройки WiFi" styleCSS="width: 100%;" state={false}>
      <Button label="Режимы wifi" color="blue" options={wifiModeList} value={buttonItem} optionWidth="max-width" onChange={(value) => (buttonItem = value)} />

      <Accordion type="sub" label="Настройки режима STA" styleCSS="width: 100%;" state={false}>
        <Select
          label="Точка доступа"
          options={accessPoints}
          value={ap}
          styleCSS="width: 20rem;"
          onUpdate={(value) => (selectValue = value)}
          showCustomOption
          color="blue"
        />

        <Input label="Пароль" styleCSS="width: 30%;" Type="password" bind:value={inputString} placeholder="Enter password" RegExp={/^[0-9a-z]{0,5}$/} />

        <Separator visible={false} />

        <Switch label="Режим IP" captionLeft="Статический" captionRight="Динамический" color="blue" />
        <Separator visible={false} />
        <Input
          label="IP Address"
          styleCSS="width: 20rem;"
          id="sta-ip"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />

        <Input
          label="Mask"
          styleCSS="width: 20rem;"
          id="sta-ms"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />

        <Input
          label="Gateway"
          styleCSS="width: 20rem;"
          id="sta-gw"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />
      </Accordion>

      <Accordion type="sub" label="Настройки режима AP" styleCSS="width: 100%;" state={false}>
        <Input id="input-ap-ssid" label="Имя точки доступа" styleCSS="width: 30%;" Type="text" bind:value={inputString} placeholder="Enter string" RegExp={/^[0-9a-z]{0,5}$/} />
        <Input
          id="input-ap-psk"
          label="Пароль точки доступа"
          styleCSS="width: 30%;"
          Type="password"
          bind:value={inputString}
          placeholder="Enter string"
          RegExp={/^[0-9a-z]{0,5}$/}
        />

        <Separator visible={false} />
        <Input
          label="IP Address"
          styleCSS="width: 20rem;"
          id="ap-ip"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />

        <Input
          label="Mask"
          styleCSS="width: 20rem;"
          id="ap-ms"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />

        <Input
          label="Gateway"
          styleCSS="width: 20rem;"
          id="ap-gw"
          autocomplete="on"
          placeholder="XXX.XXX.XXX.XXX"
          RegExp={/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/}
        />
      </Accordion>
      <Button text="Сохранить" buttonCSS="width: 10rem; margin: 0.5rem;" color="green" onClick={() => counter++} />
      <Button text="Перезагрузить" buttonCSS="width: 10rem; margin: 0.5rem;" color="red" onClick={() => counter++} />
    </Accordion>

    <Accordion label="Button component" styleCSS="width: 100%;" state={false}>
      <div style="display: flex; flex-wrap: wrap; align-items: center;">
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="blue" icon={UiIcon} onClick={() => counter++} />
        <Button
          buttonCSS="margin: 0.5rem; height: 5rem; width: 5rem; border-radius: 50%;"
          color="primary"
          icon={UiIcon}
          iconProps={{ height: '3rem', width: '3rem' }}
          onClick={() => counter++}
        />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="white" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 6rem; margin: 0.5rem; border-radius: 0;" color="amber" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 6rem; margin: 0.5rem; height: 4rem;" textCSS="font-weight: bold;" color="red" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem; box-shadow: 0px 0px 10px red;" color="orange" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" textCSS="color: black; font-style: italic;" color="lime" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem; border-radius: 5px; border: 1px solid grey;" color="green" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="sky" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="purple" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="pink" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="rose" onClick={() => counter++} />
        <p style="flex: 1;">Kнопка нажата <strong>{counter}</strong> раз</p>
      </div>
      <Button label="Режимы wifi" color="rose" options={wifiModeList} value={buttonItem} optionWidth="max-width" onChange={(value) => (buttonItem = value)} />
      <p style="flex: 1;">Bыбранный режим: {buttonItem.name}</p>
    </Accordion>

    <Accordion label="Input component" styleCSS="width: 100%;" state={false}>
      <Input
        id="input-string"
        label="Поле ввода строки"
        styleCSS="width: 60%;"
        Type="password"
        bind:value={inputString}
        placeholder="Enter string"
        RegExp={/^[0-9a-z]{0,5}$/}
      />
      <p style="margin-top: 0; width: 40%;">Введенная строка: {inputString}</p>
      <Input
        id="input-number"
        label="Поле ввода числа"
        styleCSS="width: 20%;"
        Type="number"
        bind:value={inputNumber}
        Info=" Проблема в том, что груз задачи мешает работать. Мы ведь понимаем, что это надолго."
        placeholder="Enter number"
      />
      <p style="margin-top: 0; width: 20%;">Введенное число: {inputNumber}</p>
      <Separator visible={false} />

      <Input
        id="input-text"
        label="Поле ввода текста"
        styleCSS="width: 50%;"
        Info="info about this input"
        Type="text-area"
        bind:value={text}
        disabled
        placeholder="Enter text"
      />
      <p style="margin-top: 0; width: 40%;">Введенный текст: {text}</p>

      <Accordion type="sub" label="File input" styleCSS="width: 100%;">
        <FileInput label="Upload document" styleCSS="width: 60%;" accept=".pdf,.doc,.docx" />
        <FileInput type="image" styleCSS="width: 30%;" label="Profile picture" accept="image/*" />
      </Accordion>
    </Accordion>

    <Accordion label="Slider component" styleCSS="width: 100%;" state={false}>
      <!-- vertical -->
      <Slider
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

      <Slider
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

      <Slider
        label="label"
        value={[100, 500]}
        min={50}
        max={1200}
        step={10}
        orientation="vertical"
        styleCSS="height: 10rem;"
        onUpdate={(value) => (sliderValue = value)}
      />

      <Slider
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
      <Slider
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

      <Slider
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

      <Slider
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

      <Slider
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

    <Accordion label="Table component" styleCSS="width: 100%;" state={false}>
      <Table {rows} {columns} label="Устройства" />
    </Accordion>

    <Accordion label="Graph component (в разработке)" styleCSS="width: 100%;" state={false}>
      <Graph {data} height={300} width={600} label="График" xLabel="Время" yLabel="Значение" />
      <ColorPicker id="ColorPicker" label="Test Color Picker" styleCSS="width: 25rem;" />
      <Separator visible={false} />
      <Button text="Сохранить" buttonCSS="width: 10rem; margin: 0.5rem;" color="green" onClick={() => counter++} />
    </Accordion>

    <Accordion label="Еще что то" styleCSS="width: 40%; margin: 1rem;" state={false}></Accordion>
    <Accordion label="Еще что то" styleCSS="width: 40%; margin: 1rem;" state={false}></Accordion>
  </div>
</div>
