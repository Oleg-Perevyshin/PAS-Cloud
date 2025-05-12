<script lang="ts">
  import type { Snippet } from 'svelte'
  import { slide } from 'svelte/transition'
  import type { Colors } from './Interface'

  export interface AccordionProps {
    id: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors
    }
    validation?: {
      initialState?: boolean
    }
    style?: {
      type?: 'main' | 'sub'
      inlineStyle?: string
    }
    children?: Snippet
  }

  const props: AccordionProps = $props()

  let isOpen = $state(props.validation?.initialState ?? false)

  const toggle = () => (isOpen = !isOpen)
</script>

<div id={props.id} class="accordion-container {props.style?.type ?? 'main'}" transition:slide={{ duration: 300 }} style={props.style?.inlineStyle}>
  <button class="header-button" onclick={toggle}>
    <span class="toggle" style="text-align: {props.label?.align}; color: var(--{props.label?.color ? props.label.color : 'font'}-color);"
      >{props.label?.text}</span
    >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="arrow"
      width="1.1rem"
      height="1.1rem"
      viewBox="0 0 24 24"
      style="transform: rotate({isOpen ? 180 : 0}deg); transition: transform 0.3s;"
    >
      <path
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M18 12.5s-4.419 6-6 6s-6-6-6-6m12-7s-4.419 6-6 6s-6-6-6-6"
        color="currentColor"
      />
    </svg>
  </button>

  {#if isOpen}
    <div class="wrapper" transition:slide={{ duration: 300 }}>
      <div class="content">
        {@render props.children?.()}
      </div>
    </div>
  {/if}
</div>

<style>
  .accordion-container {
    margin-bottom: 1rem;
  }

  .main {
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    background-color: var(--conteiner-color);
    transition: box-shadow 0.3s;
  }

  .sub {
    border-bottom: 1px solid var(--border-color);
  }

  .main:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .header-button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    cursor: pointer;
    transition: box-shadow 0.2s;
    border: none;
    width: 100%;
    background-color: transparent;
  }

  .toggle {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--font-color);
    margin: 0;
    cursor: pointer;
  }

  .wrapper {
    padding: 1rem 1.5rem;
    width: 100%;
    border-top: 1px solid var(--border-color);
  }

  .content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }

  @media (max-width: 690px) {
    .header-button {
      padding: 0.8rem 1rem;
    }

    .content {
      padding: 0.8rem;
    }
  }
</style>
