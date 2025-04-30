<script lang="ts">
  import type { Colors } from './Interface'

  interface FileInputProps {
    id: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
    }
    validation?: {
      disabled?: boolean
      accept?: string
      type?: 'default' | 'image'
    }
    style?: {
      styleCSS?: string
      color?: Colors
    }
    onFileChange?: (files: FileList | null) => void
  }

  let {
    id = `file-input-${Math.random().toString(36).substring(2, 9)}`,
    label = {
      text: '',
      align: 'center',
    },
    validation = {
      disabled: false,
      accept: '*/*',
      type: 'default',
    },
    style = {
      styleCSS: '',
      color: 'blue',
    },

    onFileChange = () => {},
  }: FileInputProps = $props()

  style = {
    styleCSS: '',
    color: 'blue',
    ...style,
  }

  let selectedFile = $state<File | null>(null)
  let previewUrl = $state<string | null>(null)

  function handleFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    selectedFile = file

    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file)
    }

    onFileChange(input.files)
  }

  function triggerFileInput() {
    const input = document.getElementById(id) as HTMLInputElement | null
    if (input) {
      input.click()
    }
  }
</script>

<div class="file-input-container {style.color}" style={style.styleCSS}>
  {#if label}
    <label for={id} class="label" style="text-align: {label.align};">{label.text}</label>
  {/if}

  {#if validation.type === 'image'}
    <div class="image-uploader">
      <button class="image-upload-button" onclick={triggerFileInput} disabled={validation.disabled}>
        {#if previewUrl}
          <img src={previewUrl} alt="Preview" class="image-preview" />
        {:else}
          <span class="placeholder-text">Click to upload image</span>
        {/if}
      </button>
      <input {id} type="file" class="hidden" accept={validation.accept} disabled={validation.disabled} onchange={handleFileChange} />
    </div>
  {:else}
    <label class="input-file">
      <input {id} type="file" class="input" accept={validation.accept} disabled={validation.disabled} onchange={handleFileChange} />
    </label>
  {/if}
</div>

<style>
  .file-input-container {
    width: 100%;
    margin: 0.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .label {
    margin: 0.25rem 0;
    color: var(--font-color);
    display: block;
  }

  .input-file {
    position: relative;
    display: inline-block;
    width: 100%;
    font-weight: normal;
  }

  .input-file input[type='file'] {
    height: 2rem;
    width: 100%;
    border: 1px solid var(--color);
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .input-file input[type='file']:invalid {
    border: 1px solid var(--red-color);
  }

  .input-file input[type='file']:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .input-file input[type='file']::-webkit-file-upload-button {
    background-color: var(--color);
    border: none;
    height: 100%;
    color: white;
    cursor: pointer;
    width: 30%;
  }

  .image-uploader {
    position: relative;
  }

  .image-upload-button {
    display: flex;
    height: 10rem;
    width: 10rem;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    border: 1px solid var(--border-color);
    background-color: var(--field-color);
    overflow: hidden;
    transition: all 0.2s;
  }

  .image-upload-button:hover:not(:disabled) {
    border-color: var(--color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .image-upload-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .image-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder-text {
    color: var(--font-color);
    font-size: 0.9rem;
  }

  .hidden {
    position: absolute;
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    z-index: -1;
  }
</style>
