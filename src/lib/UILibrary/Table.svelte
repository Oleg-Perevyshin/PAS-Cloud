<script lang="ts">
  import type { Colors } from './Interface'

  // Интерфейс для определения вида колонок - заголовок, ключ из интерфейса строки и содержимое
  export interface ITableColumn<T extends object> {
    label: string
    key: keyof T
    width?: string
    formatter?: (value: any, row: T) => string | number
    sortable?: boolean
    buttons?: {
      text?: string
      color?: Colors
      styleCSS?: string
      onClick?: (row: T) => void
    }[]
    image?: {
      src: string | ((row: T) => string)
      alt?: string | ((row: T) => string)
      width?: string | number
      height?: string | number
      style?: string
    }
  }

  interface TableProps<T extends object> {
    id: string
    label?: {
      text?: string
      align?: 'start' | 'center' | 'end'
      color?: Colors | null
    }
    style?: {
      color?: Colors
      width?: string
    }
    rows: T[]
    columns: ITableColumn<T>[]
  }

  const defaultLabel = {
    text: '',
    align: 'center' as const,
    color: null,
  }
  const defaultStyle = {
    color: 'primary' as Colors,
    width: '100%',
  }

  let { id = '', label = defaultLabel, style = defaultStyle, rows = [], columns = [] }: TableProps<any> = $props()
  label = { ...defaultLabel, ...label }
  style = { ...defaultStyle, ...style }

  // Состояние и функция сортировки
  let sortState: {
    key: string | null
    direction: 'asc' | 'desc' | null
  } = {
    key: null,
    direction: null,
  }

  const sortRows = (key: string) => {
    if (sortState.key === key) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
    } else {
      sortState.key = key
      sortState.direction = 'asc'
    }

    rows = [...rows].sort((a, b) => {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortState.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortState.direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime()
      }

      const strA = String(aValue).toLowerCase()
      const strB = String(bValue).toLowerCase()

      return sortState.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })
  }
</script>

<div class="table-wrapper {style.color}" {id} style="width: {style.width};">
  {#if label}
    <label for={id} class="label" style="text-align: {label.align};">{label.text}</label>
  {/if}

  <div class="table" style="grid-template-columns: {columns.map((c) => c.width || 'auto').join(' ')};">
    <div class="head">
      {#each columns as column}
        <div class="table-head_name">
          {column.label}
          {#if column.sortable}
            <button class="sort-simbol" onclick={() => sortRows(column.key as string)}>↑↓</button>
          {/if}
        </div>
      {/each}
    </div>

    <div class="table-body">
      {#each rows as row}
        <div class="striped table-row">
          {#each columns as column}
            <div class="table-column">
              {#if column.buttons}
                <div class="buttons-conteiner">
                  {#each column.buttons as button}
                    <button
                      class="action {button.color || 'blue'}"
                      style="border-radius: 1rem; {button.color == 'white'
                        ? 'border: 1px solid var(--border-color);'
                        : 'color: white; border: none;'}{button.styleCSS}"
                      onclick={() => button?.onClick?.(row)}>{button.text}</button
                    >
                  {/each}
                </div>
              {:else if column.formatter}
                {column.formatter(row[column.key], row)}
              {:else if column.image}
                <img
                  src={typeof column.image.src === 'function' ? column.image.src(row) : column.image.src}
                  alt={typeof column.image.alt === 'function' ? column.image.alt(row) : column.image.alt}
                  width={column.image.width}
                  height={column.image.height}
                  style={column.image.style}
                  loading="lazy"
                />
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
  }

  .table-head_name {
    padding: 0.8rem;
    background-color: var(--color);
    border: none;
    color: white;
    text-align: left;
    position: sticky;
    top: 0;
  }

  .table-body {
    display: contents;
  }

  .table-row {
    display: contents;
  }

  .table-column {
    padding: 0.4rem 0.7rem;
    border: none;
    text-align: left;
    background-color: var(--back-color);
    display: flex;
    align-items: center;
  }

  .table-row.striped:nth-child(even) .table-column {
    background-color: var(--field-color);
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

  .table-column img {
    object-fit: contain;
    display: block;
  }

  .buttons-conteiner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sort-simbol {
    font-weight: bold;
    padding-left: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    &:hover {
      transform: scale(1.4);
    }
  }
</style>
