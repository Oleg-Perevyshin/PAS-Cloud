<script lang="ts">
  import { onMount } from 'svelte'
  import { fly } from 'svelte/transition'
  import type { Colors } from './Interface'

  interface InputProps {
    value?: boolean | string | number | number[] | object | null
    id: string
    Type?: 'text' | 'password' | 'number' | 'text-area'
    placeholder?: string
    Info?: string
    label?: string
    labelAlign?: 'start' | 'center' | 'end'
    styleCSS?: string
    color?: Colors
    disabled?: boolean
    required?: boolean
    readonly?: boolean
    autocomplete?:
      | 'on'
      | 'off'
      | 'given-name'
      | 'family-name'
      | 'name'
      | 'email'
      | 'username'
      | 'new-password'
      | 'current-password'
      | 'tel'
      | 'country-name'
      | 'address-level1'
      | 'address-level2'
      | 'street-address'
      | 'postal-code'
      | 'cc-name'
      | 'cc-number'
      | 'cc-exp'
      | 'cc-csc'
      | null
    onUpdate?: (value: string) => void
    RegExp?: RegExp
    step?: number
    minNum?: number
    maxNum?: number
    rows?: number
  }

  let {
    value = $bindable(null),
    id = '',
    Type = 'text',
    placeholder = '',
    Info = '',
    label = '',
    labelAlign = 'center',
    styleCSS = '',
    color = 'blue',
    disabled = false,
    required = false,
    readonly = false,
    autocomplete = null,
    onUpdate = () => {},
    RegExp = /./,
    step = 0.1,
    minNum = 1,
    maxNum = 10,
    rows = 5,
  }: InputProps = $props()

  let showPassword = $state(Type === 'password')
  let isValid = $state(true)
  let showInfo = $state(false)

  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.info-container') && !target.closest('.button-info')) {
        showInfo = false
      }
    }
    window.addEventListener('click', handleClickOutside)

    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  })

  function updateValue(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value
    isValid = RegExp && RegExp.test(inputValue) ? true : false
    value = inputValue
    onUpdate(value)
  }

  function togglePasswordVisibility() {
    showPassword = !showPassword
  }

  function toggleInfoVisibility() {
    showInfo = !showInfo
  }

  function increment() {
    if (typeof value === 'number') {
      let newValue = value + step
      newValue = Math.min(newValue, maxNum)

      const decimalPlaces = countDecimalPlaces(step)
      value = parseFloat(newValue.toFixed(decimalPlaces))
    }
  }

  function decrement() {
    if (typeof value === 'number') {
      let newValue = value - step
      newValue = Math.max(newValue, minNum)

      const decimalPlaces = countDecimalPlaces(step)
      value = parseFloat(newValue.toFixed(decimalPlaces))
    }
  }

  function countDecimalPlaces(num: number): number {
    const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
    if (!match) return 0
    const decimalPart = match[1] ? match[1].length : 0
    const exponentPart = match[2] ? parseInt(match[2], 10) : 0
    return Math.max(0, decimalPart - exponentPart)
  }
</script>

<div class="input-container {color}" style={styleCSS}>
  {#if label}
    <label for={id} class="label" style="text-align: {labelAlign};">{label}</label>
  {/if}
  <div class="input-wrapper">
    {#if Type === 'text' || Type === 'password' || Type === 'number'}
      <input
        class={`input ${disabled ? 'disabled' : ''} ${required ? 'required' : ''} ${!isValid ? 'invalid' : ''}`}
        {id}
        {placeholder}
        bind:value
        {autocomplete}
        {disabled}
        oninput={updateValue}
        type={Type === 'password' && showPassword ? 'password' : Type === 'number' ? 'number' : 'text'}
        min={minNum}
        max={maxNum}
        {step}
      />
      {#if Type === 'number'}
        <div class="number-controls">
          <button type="button" class="number-btn up" aria-label="increment" onclick={increment}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 5L5 1L9 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
          <button type="button" class="number-btn down" aria-label="decrement" onclick={decrement}>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      {/if}
    {:else}
      <textarea
        name="area"
        class="text-area {disabled ? 'disabled' : ''}"
        {id}
        bind:value
        {readonly}
        {autocomplete}
        {disabled}
        {rows}
        style="padding: {Info ? '0.25rem 0.5rem 0.25rem 2.6rem' : '0.25rem 1rem'};"
        oninput={updateValue}
      ></textarea>
    {/if}

    {#if Type === 'password'}
      <button type="button" class="toggle-button" onclick={togglePasswordVisibility} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
        {#if showPassword}
          <svg xmlns="http://www.w3.org/2000/svg" width="1.3rem" height="1.3rem" viewBox="0 0 24 24" class="icon-eye"
            ><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              ><path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0" /><path d="M21 12q-3.6 6-9 6t-9-6q3.6-6 9-6t9 6" /></g
            ></svg
          >
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="icon-eye-slash" width="1.3rem" height="1.3rem" viewBox="0 0 24 24"
            ><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              ><path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" /><path
                d="M16.681 16.673A8.7 8.7 0 0 1 12 18q-5.4 0-9-6q1.908-3.18 4.32-4.674m2.86-1.146A9 9 0 0 1 12 6q5.4 0 9 6q-1 1.665-2.138 2.87M3 3l18 18"
              /></g
            ></svg
          >
        {/if}
      </button>
    {/if}
    {#if Info}
      <button type="button" class="button-info" onclick={toggleInfoVisibility} aria-label={showInfo ? 'Скрыть инфо' : 'Показать инфо'}>
        <svg xmlns="http://www.w3.org/2000/svg" class="info" height="1.5rem" width="1.5rem" viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12 16.5q.214 0 .357-.144T12.5 16v-4.5q0-.213-.144-.356T11.999 11t-.356.144t-.143.356V16q0 .213.144.356t.357.144M12 9.577q.262 0 .439-.177t.176-.438t-.177-.439T12 8.346t-.438.177t-.177.439t.177.438t.438.177M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"
          /></svg
        >
      </button>
    {/if}
  </div>
  {#if showInfo}
    <div transition:fly={{ y: 15, duration: 300 }} class="info-container" style="top: {label ? '4.5rem' : '2.5rem'};">
      {Info}
    </div>
  {/if}
</div>

<style>
  .input-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    position: relative;
  }

  .label {
    margin: 0.25rem 0;
    color: var(--font-color);
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .input {
    padding: 0.25rem 1rem;
    min-height: 2rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    text-align: center;
    cursor: pointer;
    outline: none;
    width: 100%;
    transition: box-shadow 0.3s;
    color: var(--font-color);
    background-color: var(--field-color);
  }

  .input:focus {
    border: 1px solid var(--color);
  }

  .input:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .input.invalid {
    border: 1px solid var(--red-color);
  }

  .disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .toggle-button {
    position: absolute;
    right: 0.3rem;
    cursor: pointer;
    background-color: transparent;
    border: none;
    display: flex;
  }

  .icon {
    height: 1.25rem;
    width: 1.25rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .icon-eye,
  .icon-eye-slash {
    height: 100%;
    width: 100%;
    color: var(--font-color);
  }

  .button-info {
    position: absolute;
    display: flex;
    align-items: center;
    left: 0.25rem;
    top: 0.4rem;
    border: none;
    background-color: transparent;
    cursor: pointer;
  }

  .info-container {
    position: absolute;
    z-index: 50;
    border-radius: 0.25rem;
    border: 1px solid var(--border-color);
    padding: 0.25rem;
    background-color: var(--info-color);
  }

  .number-button {
    position: absolute;
    right: 0.3rem;
    cursor: pointer;
    background-color: transparent;
    border: none;
    display: flex;

    &.first {
      top: 0;
    }
    &.second {
      bottom: 0;
    }
  }

  .text-area {
    display: inline-block;
    background-color: var(--field-color);
    resize: vertical;
    cursor: text;
    border-radius: 1rem;
    border: 1px solid var(--border-color);
    transition: box-shadow 0.3s;
    width: 100%;
    scrollbar-color: var(--color) transparent;
    outline: none;
    height: 100%;
  }

  .text-area:focus {
    border: 1px solid var(--color);
    outline: none;
  }

  .text-area:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .text-area::-webkit-resizer {
    background: linear-gradient(315deg, #0000 26%, var(--color) 26% 33%, #0000 33% 43%, var(--color) 43% 50%, #0000 50% 100%) no-repeat;
    background-size: 80% 80%;
  }

  input[type='number']::-webkit-inner-spin-button,
  input[type='number']::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .number-controls {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .number-btn {
    width: 0.6rem;
    height: 0.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--font-color);
    transition: all 0.2s;
  }

  .number-btn:hover {
    color: var(--primary-color);
  }

  .number-btn svg {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 690px) {
    .text-area {
      font-size: 12px;
    }
  }
</style>
