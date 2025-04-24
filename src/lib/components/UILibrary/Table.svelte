<script lang="ts">
  export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'

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
    }
  }

  interface Props<T extends object> {
    id?: string
    label?: string
    labelAlign?: 'start' | 'center' | 'end'
    color?: string
    rows: T[]
    columns: IColumn<T>[]
  }

  let { id = '', label = '', labelAlign = 'center', color = 'blue', rows = [], columns = [] }: Props<any> = $props()
</script>

<div class="table-wrapper {color}" {id}>
  {#if label}
    <label for={id} class="label" style="text-align: {labelAlign};">{label}</label>
  {/if}

  <div class="table" style="grid-template-columns: {columns.map((c) => c.width || 'auto').join(' ')};">
    <div class="head">
      {#each columns as column}
        <div class="table-head_name">{column.label}</div>
      {/each}
    </div>

    <div class="table-body">
      {#each rows as row}
        <div class="striped table-row">
          {#each columns as column}
            <div class="table-column">
              {#if column.button}
                <button
                  class="action {column.button.color || 'blue'}"
                  style="border-radius: 1rem; {column.button.color == 'white' ? 'border: 1px solid var(--border-color);' : 'color: white; border: none;'}{column
                    .button.buttonCSS}"
                  onclick={() => column.button?.onClick?.(row)}>{column.button.text}</button
                >
              {:else if column.formatter}
                {column.formatter(row[column.key], row)}
              {:else}
                {row[column.key]}
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .table-wrapper {
    width: 100%;
  }

  .table {
    width: 100%;
    display: grid;
    border-collapse: collapse;
    min-width: max-content;
    border: 1px solid var(--color);
    overflow-x: auto;
    border-radius: 1rem;
  }

  .label {
    margin: 0.5rem 0;
    color: var(--font-color);
    display: block;
  }

  .head {
    display: contents;
    font-weight: 600;
    .table-head_name {
      padding: 0.8rem;
      background-color: var(--color);
      border: none;
      color: white;
      text-align: left;
      position: sticky;
      top: 0;
    }
  }

  .table-body {
    display: contents;

    .table-row {
      display: contents;

      .table-column {
        padding: 0.4rem 0.7rem;
        border: none;
        text-align: left;
        background-color: var(--back-color);
        display: flex;
        align-items: center;
      }

      &.striped:nth-child(even) .table-column {
        background-color: var(--field-color);
      }
    }
  }

  .action {
    padding: 0.25rem 1rem;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
    outline: none;
    color: black;
    transition: box-shadow 0.3s;
    background-color: var(--color);
    height: 2rem;
  }

  .action:hover {
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  }
</style>
