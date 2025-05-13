<script lang="ts">
  import type { Colors } from './Interface'

  interface SwitchProps {
    id: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors | null
      captionLeft?: string
      captionRight?: string
    }
    style?: {
      color?: Colors
      height?: string
    }
    validation?: {
      checked?: boolean
      disabled?: boolean
    }

    onChange?: (value: boolean) => void
  }

  let defaultLabel = {
    text: '',
    align: 'center' as const,
    color: null,
    captionLeft: '',
    captionRight: '',
  }
  let defaultStyle = {
    color: 'blue' as Colors,
    height: '1.5rem',
  }
  const defaultValidation = {
    disabled: false,
    checked: false,
  }

  let { id = '', label = defaultLabel, style = defaultStyle, validation = defaultValidation, onChange }: SwitchProps = $props()

  label = { ...defaultLabel, ...label }
  style = { ...defaultStyle, ...style }
  validation = { ...defaultValidation, ...validation }

  // Реактивное состояние для checked
  let checked = $state(validation.checked)
  $effect(() => {
    checked = validation.checked ?? false
  })

  const handleToggle = (event: Event) => {
    if (validation.disabled) return
    checked = (event.target as HTMLInputElement).checked
    if (onChange) {
      onChange(checked)
    }
  }

  const updateChecked = (value: boolean) => {
    checked = value
    if (onChange) {
      onChange(checked)
    }
  }

  const maxCaptionWidth = $derived(
    Math.max(label.captionLeft?.length ?? 0, label.captionRight?.length ?? 0) > 0
      ? `${Math.max(label.captionLeft?.length ?? 0, label.captionRight?.length ?? 0)}ch`
      : 'auto',
  )
</script>

<div class="wrapper">
  {#if label}
    <label class="label-container" style="justify-content: {label.align}; color: var(--{label.color ? label.color : 'font'}-color);">
      <span>{label.text}</span>
      <input type="checkbox" class="checkbox" bind:checked disabled={validation.disabled} onchange={handleToggle} />
    </label>
  {/if}

  <div style="display: flex; align-items: center;" {id}>
    {#if label.captionLeft}
      <button
        class="caption"
        style="margin-right: 1rem; width: {maxCaptionWidth}; text-align: end; color: var(--{label.color ? label.color : 'font'}-color);"
        onclick={() => updateChecked(false)}>{label.captionLeft}</button
      >
    {/if}
    <label class="toggle-container {validation.disabled ? 'disabled' : ''}">
      <input type="checkbox" class="toggle-input" bind:checked disabled={validation.disabled} onchange={handleToggle} />
      <span class="slider {style.color}" style="--switch-height: {style.height};"></span>
    </label>
    {#if label.captionRight}
      <button
        class="caption"
        style="margin-left: 1rem; width: {maxCaptionWidth}; text-align: start; color: var(--{label.color ? label.color : 'font'}-color);"
        onclick={() => updateChecked(true)}>{label.captionRight}</button
      >
    {/if}
  </div>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label-container {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  .checkbox {
    display: none;
  }

  .toggle-container {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .toggle-input {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    height: 100%;
    appearance: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .caption {
    border: none;
    background-color: transparent;
    font-size: 1rem;
    padding: 0;
    cursor: pointer;
    color: var(--font-color);
  }

  .slider {
    width: calc(var(--switch-height) * 1.9);
    height: var(--switch-height);
    display: flex;
    align-items: center;
    background-color: var(--border-color);
    border-radius: 999px;
    transition: all 0.3s ease-in-out;
    position: relative;
  }

  .toggle-input:hover + .slider:not(.disabled) {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .slider::after {
    content: '';
    width: calc(var(--switch-height) * 0.8);
    height: calc(var(--switch-height) * 0.8);
    margin: 0 calc(var(--switch-height) * 0.13);
    background-color: white;
    border-radius: 999px;
    transition:
      transform 0.3s ease-in-out,
      background-color 0.3s ease;
  }

  .toggle-input:checked + .slider:not(.disabled) {
    background-color: var(--color);
  }

  .toggle-input:checked + .slider::after {
    transform: translateX(calc(var(--switch-height) * 0.87));
  }

  .disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .toggle-input:disabled + .slider {
    opacity: 0.6;
    box-shadow: none !important;
  }

  .toggle-input:disabled + .slider::after {
    opacity: 0.6;
  }
</style>
