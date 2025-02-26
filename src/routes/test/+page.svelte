<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import Slider from '$lib/components/UI/Slider.svelte'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'
  import type { IWebSocketPacket, IOptionUI, IWebSocketPacketMain } from '../../stores/Interfaces'

  import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'

  const RadioGroupOption = [
    { id: '1', name: 'Param 1', color: '' },
    { id: '2', name: 'Param 2', color: '' },
    { id: '3', name: 'Param 3', color: '' },
    { id: '4', name: 'Param 4', color: '' },
    { id: '5', name: 'Param 5', color: '' },
  ]

  let radioButtonValue: string | null = $state('Param 4')

  const handleRadioButton = (value: IOptionUI) => {
    console.log('ButtonGroup Value:', value)
    radioButtonValue = value.name
  }

  let sliderValue: number | null = $state(23)
  const handleSlider = (value: number) => {
    console.log('Slider Value:', value)
    sliderValue = value
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

    const EncryptResponse = EncryptWebSocketPacket(packHeader, packArgument, parsedValue) as IWebSocketPacketMain
    const DecryptResponse = DecryptWebSocketPacket(new Uint8Array(EncryptResponse.Data)) as IWebSocketPacket

    console.info('Encrypt Data:', EncryptResponse)
    console.info('Decrypt Data:', DecryptResponse)
  }

  let progressBarValue: number | null = $state(23)
  const handleProgressBar = (value: number) => {
    console.log('Slider Value:', value)
    sliderValue = value
  }
</script>

<div class="flex h-full flex-col items-center overflow-hidden">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
  </div>

  <ButtonGroup
    id="test"
    label="Component - ButtonGroup"
    className="m-4"
    options={RadioGroupOption}
    value={radioButtonValue ?? ''}
    onChange={handleRadioButton}
    props={{ disabled: false }}
  />

  <br />

  <Slider
    id="TestSlider"
    label="Component - Slider"
    props={{ min: 0, max: 100, step: 1, disabled: false }}
    className="m-4"
    value={sliderValue ?? 0}
    onUpdate={handleSlider}
  />

  <br />

  <div class="flex flex-row">
    <Input id="testInputHeader" bind:value={packHeader} props={{ autocomplete: 'on', maxLength: 8 }} className="m-1" />
    <Input
      id="testInputArgument"
      bind:value={packArgument}
      props={{ autocomplete: 'on', maxLength: 16 }}
      className="m-1"
    />
    <Input id="testInputValue" bind:value={packValue} props={{ autocomplete: 'on', maxLength: 32 }} className="m-1" />
    <Button
      onClick={testCrypto}
      label="Отправить"
      props={{ bgColor: 'bg-lime-300' }}
      className="m-1 w-40 rounded-2xl"
    />
  </div>

  <br />

  <ProgressBar id="testProgressBar" label="Component - ProgressBar" className="" bind:value={progressBarValue} />
</div>
