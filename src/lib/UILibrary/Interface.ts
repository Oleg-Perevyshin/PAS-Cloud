/* UI Компонент */
import type { Snippet, SvelteComponent } from 'svelte'

export interface Point {
  x: number
  y: number
}

export interface IUIComponent<T extends object> {
  // Общие свойства
  id: string // Уникальный идентификатор компонента
  label?: {
    text?: string
    align?: 'start' | 'center' | 'end'
  } // Название компонента

  style?: {
    styleCSS?: string
    textCSS?: string
    color?: Colors
    optionWidth?: 'auto' | 'max-option'
    icon?: (new (...args: any[]) => SvelteComponent) | null
    iconProps?: Record<string, unknown>
  } // Кастомные стили

  validation?: {
    disabled?: boolean
    options?: IOption[] | null
    value?: IOption | null
    text?: string
    type?: 'default' | 'sub'
    state?: boolean
  }

  children?: Snippet
  onClick?: (event: MouseEvent) => void
  onChange?: (value: IOption) => void

  rows: T[] // Строки таблицы
  columns: IColumn<T>[] // Колонки таблицы
}

export interface IColumn<T extends object> {
  label: string // Заголовок колонки
  key: keyof T // Ключ, соответствующий полю в строке
  width?: string // Ширина колонки (CSS)
  formatter?: (value: T[keyof T], row: T) => string | number // Форматтер для значения ячейки
  button?: {
    text?: string // Текст кнопки
    color?: Colors // Цвет кнопки
    styleCSS?: string // Дополнительные стили для кнопки
    onClick?: (row: T) => void // Обработчик клика по кнопке
  }
}

/* Интерфейс обработчика для UI компонента */
export interface IUIComponentHandler {
  Action: string // Действие (имя функции, как правило отправка в WebSocket)
  Header?: string // Заголовок пакета
  Argument?: string // Аргумент
  Variables?: string[] // Массив переменных
}

export interface IOption {
  id?: number
  value?: string | number
  name?: string
}

export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'
