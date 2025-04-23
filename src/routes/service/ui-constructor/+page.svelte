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

  const wifiModeList: IOption[] = [
    { id: 1, name: 'STA' },
    { id: 2, name: 'AP' },
    { id: 3, name: 'APSTA' },
  ]
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
</script>

<div class="flex h-full w-full flex-col items-stretch overflow-auto">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
  </div>

  <div>
    <Accordion label="Button component" styleCSS="width: 100%;" state={false}>
      <div style="display: flex; flex-wrap: wrap; align-items: center;">
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="blue" icon={UiIcon} onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="primary" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="white" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="amber" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="red" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="orange" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="lime" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="green" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="sky" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="purple" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="pink" onClick={() => counter++} />
        <Button text="counter" buttonCSS="width: 10rem; margin: 0.5rem;" color="rose" onClick={() => counter++} />
        <p style="flex: 1;">button has been pressed <strong>{counter}</strong> times</p>
      </div>
      <Button label="button group" color="rose" options={wifiModeList} value={buttonItem} optionWidth="max-width" onChange={(value) => (buttonItem = value)} />
    </Accordion>

    <Accordion label="Input component" styleCSS="width: 100%;" state={false}>
      <Input
        id="input-string"
        Label="string"
        styleCSS="width: 60%;"
        Type="text"
        bind:value={inputString}
        placeholder="Enter string"
        RegExp={/^[0-9a-z]{0,5}$/}
      />
      <p style="margin-top: 0; width: 40%;">entered string: {inputString}</p>
      <Input
        id="input-number"
        Label="number"
        styleCSS="width: 60%;"
        Type="number"
        bind:value={inputNumber}
        Info="info about this input"
        placeholder="Enter number"
      />
      <p style="margin-top: 0; width: 40%;">entered number: {inputNumber}</p>
      <Input id="input-text" Label="text" styleCSS="width: 60%;" Info="info about this input" Type="text-area" bind:value={text} placeholder="Enter text" />
      <Separator visible={false} />
      <p style="margin-top: 0; width: 40%;">entered text: {text}</p>

      <Accordion type="sub" label="File input" styleCSS="width: 100%;">
        <FileInput label="Upload document" styleCSS="width: 60%;" accept=".pdf,.doc,.docx" />
        <FileInput type="image" styleCSS="width: 30%;" label="Profile picture" accept="image/*" />
      </Accordion>
    </Accordion>

    <Accordion label="Slider component" styleCSS="width: 100%;" state={false}>
      <Slider
        label="label"
        value={[50, 500]}
        min={10}
        max={1200}
        step={50}
        orientation="vertical"
        styleCSS="height: 20rem;"
        onUpdate={(value) => (sliderValue = value)}
      />

      <Slider
        label="label"
        value={[50, 500]}
        min={10}
        max={1200}
        step={50}
        orientation="horizontal"
        styleCSS="width: 20rem;"
        onUpdate={(value) => (sliderValue = value)}
        showStepButtons
      />
      <Slider
        label="label"
        value={50}
        min={10}
        max={1200}
        step={50}
        styleCSS="width: 20rem;"
        orientation="horizontal"
        onUpdate={(value) => (sliderValue = value)}
      />

      <Slider
        label="label"
        value={50}
        min={10}
        max={1200}
        step={50}
        styleCSS="height: 20rem;"
        orientation="vertical"
        onUpdate={(value) => (sliderValue = value)}
        showStepButtons
      />
    </Accordion>

    <Accordion label="Select component" styleCSS="width: 100%;" state={true}>
      <Switch label="Select color" captionLeft="blue" captionRight="green" color="amber" checked={switchValue} />

      <Select
        label="wifi"
        Info="info"
        value={selectValue}
        options={wifiModeList}
        styleCSS=""
        onUpdate={(value) => (selectValue = value)}
        showCustomOption
        color="green"
      />
    </Accordion>
  </div>
</div>
