<!-- src/routes/test/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'
  import { t, Language } from '$lib/locales/i18n'
  import type { IWebSocketPacket, IOptionUI } from '../../stores/Interfaces'
  import Slider from '$lib/components/UI/Slider.svelte'
  import ButtonGroup from '$lib/components/UI/ButtonGroup.svelte'
  import Input from '$lib/components/UI/Input.svelte'
  import Button from '$lib/components/UI/Button.svelte'
  import ProgressBar from '$lib/components/UI/ProgressBar.svelte'
  import ColorPicker from '$lib/components/UI/ColorPicker.svelte'

  import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'
  import { DEFAULT_TAGS } from '../../enums'

  let currentLang: string = $state('ru')
  onMount(() => {
    const subscriptions = {
      Language: Language.subscribe((value) => (currentLang = value)),
    }

    return () => {
      Object.values(subscriptions).forEach((unsubscribe) => unsubscribe())
    }
  })

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

  /* Начальное значение цвета */
  let colorValue = $state([150, 250, 50])
  const handleColorUpdate = (newColor: number[]) => {
    colorValue = newColor
  }
</script>

<div class="flex h-full flex-col items-center overflow-hidden">
  <h2>Страница для тестирования UI компонентов</h2>
  <div class="flex w-full flex-row">
    <hr class="w-full border-t border-gray-400" />
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

  <br />

  <ColorPicker id="ColorPicker" label="Test Color Picker" className="w-full" bind:value={colorValue} onUpdate={handleColorUpdate} />
</div>
