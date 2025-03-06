<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import Slider from '$lib/components/UI/Slider.svelte'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'
  import type { IWebSocketPacket, IOptionUI } from '../../stores/Interfaces'

  import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'

  const RadioGroupOption = [
    { id: '1', name: 'B1', color: 'bg-stone-400 border-2 !border-stone-400' },
    { id: '2', name: 'B2', color: 'bg-red-400 border-2 !border-red-400' },
    { id: '3', name: 'B3', color: 'bg-orange-400 border-2 !border-orange-400' },
    { id: '4', name: 'B4', color: 'bg-yellow-400 border-2 !border-yellow-400' },
    { id: '5', name: 'B5', color: 'bg-lime-400 border-2 !border-lime-400' },
    { id: '6', name: 'B6', color: 'bg-emerald-400 border-2 !border-emerald-400' },
    { id: '7', name: 'B7', color: 'bg-cyan-400 border-2 !border-cyan-400' },
    { id: '8', name: 'B8', color: 'bg-blue-400 border-2 !border-blue-400' },
    { id: '9', name: 'B9', color: 'bg-violet-400 border-2 !border-violet-400' },
    { id: '10', name: 'B10', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
  ]

  let radioButtonValue: string | null = $state('7')

  const handleRadioButton = (value: IOptionUI) => {
    console.log('ButtonGroup Value:', value)
    radioButtonValue = value.id
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

    const EncryptResponse = EncryptWebSocketPacket(packHeader, packArgument, parsedValue) as Uint8Array
    const DecryptResponse = DecryptWebSocketPacket(new Uint8Array(EncryptResponse)) as IWebSocketPacket

    console.info('Encrypt Data:', EncryptResponse)
    console.info('Decrypt Data:', DecryptResponse)
  }

  const handleProgressBar = (value: number) => {
    console.log('Slider Value:', value)
    sliderValue = value
  }

  let progressBarValue: number = $state(50)
  /* Функция для уменьшения значения прогресс-бара */
  const decreaseProgressBar = () => {
    if (progressBarValue > 0) {
      progressBarValue -= 10
    }
  }

  /* Функция для сброса прогресс-бара */
  const resetProgressBar = () => {
    progressBarValue = 50
  }

  /* Функция для увеличения значения прогресс-бара */
  const increaseProgressBar = () => {
    if (progressBarValue < 100) {
      progressBarValue += 10
    }
  }
</script>

<div class="flex h-full flex-col items-center overflow-hidden">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
  </div>

  <ButtonGroup
    id="TestButtonGroup"
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
</div>
