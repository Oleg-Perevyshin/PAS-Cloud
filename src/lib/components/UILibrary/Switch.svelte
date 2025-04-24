<script lang="ts">
  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'

  interface Props {
    color?: Colors
    checked?: boolean
    disabled?: boolean
    label?: string
    textAlign?: 'center' | 'end' | 'start'
    height?: string
    captionLeft?: string
    captionRight?: string
    onChange?: (value: boolean) => void
  }

  let {
    color = 'primary',
    checked = false,
    disabled = false,
    label = '',
    textAlign = 'center',
    height = '1.5rem',
    captionLeft = '',
    captionRight = '',
    onChange,
  }: Props = $props()

  const handleToggle = (event: Event) => {
    if (disabled) return
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

  let maxCaptionWidth: string = $derived(
    (() => {
      const leftWidth = captionLeft.length > 0 ? `${captionLeft.length}ch` : 'auto'
      const rightWidth = captionRight.length > 0 ? `${captionRight.length}ch` : 'auto'
      return captionLeft.length > captionRight.length ? leftWidth : rightWidth
    })(),
  )
</script>

<div class="wrapper">
  {#if label}
    <label class="label-container" style="justify-content: {textAlign};">
      <span>{label}</span>
      <input type="checkbox" class="checkbox" bind:checked {disabled} onchange={handleToggle} />
    </label>
  {/if}

  <div style="display: flex; align-items: center;">
    {#if captionLeft}
      <button class="caption" style="margin-right: 1rem; width: {maxCaptionWidth}; text-align: end;" onclick={() => updateChecked(false)}>{captionLeft}</button>
    {/if}
    <label class="toggle-container {disabled ? 'disabled' : ''}">
      <input type="checkbox" class="toggle-input" bind:checked {disabled} onchange={handleToggle} />
      <span class="slider {color}" style="--switch-height: {height};"></span>
    </label>
    {#if captionRight}
      <button class="caption" style="margin-left: 1rem; width: {maxCaptionWidth}; text-align: start;" onclick={() => updateChecked(true)}>{captionRight}</button
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
