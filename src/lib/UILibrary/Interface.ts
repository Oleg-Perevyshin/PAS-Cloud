/* UI Компонент */
import type { Snippet, SvelteComponent } from 'svelte'

export interface Point {
  x: number
  y: number
}

export interface IUIComponent<T extends object> {
  id: string // Уникальный идентификатор компонента

  //название компонента
  label?: {
    text?: string //текст названия
    align?: 'start' | 'center' | 'end' //выравнивание
    bgColor?: Colors | null //цвет фона - должен быть в аккордеоне
    itemColor?: Colors | null // цвет текста
  }

  //внешний вид компонента
  style?: {
    level_1?: string //стили для обертки компонента
    level_2?: string // стили для внутреннего содержимого
    icon?: SvelteComponent | null //иконка в кнопке
    iconProps?: Record<string, unknown> //ее стили
    bgColor?: Colors // цвет фона компонента
    itemColor?: Colors //цвет текста или активного элемента компоненты
    rows?: number // количество строк в textarea
    placeholder?: string // для инпута
    info?: string // вспомогательная информация в селекте или инпуте
    optionWidth?: 'auto' | 'max-option' // ширина кнопок в группе кнопок - автоматическая по ширине содержимого или все равняются по максимальной ширине
  }

  //валидация данных
  validation?: {
    disabled?: boolean //кликабельно или нет
    type?: 'default' | 'main' | 'sub' | 'image' | 'text' | 'password' | 'number' | 'text-area' // тип в различных компонентах
    state?: boolean // состояние аккордеона
    accept?: string // типы файлов для file input
    required?: boolean //обязательный или нет
    readonly?: boolean // изменяемый или нет
    autocomplete?: // автозаполнение для инпута
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
    RegExp?: RegExp // валидация содержимого с помощью регулярного выражения
    step?: number // шаг для числовых диапазонов
    minNum?: number // минимальное числовое значение
    maxNum?: number // максимальное числовое значение
  }

  data?: {
    text?: string //текст кнопки
    options?: IOption[] | null // список опций
    value?: IOption | boolean | string | number | number[] | object | null //текущее значение/опция
    rows: T[] // Строки таблицы
    columns: IColumn<T>[] // Колонки таблицы
  }

  children?: Snippet //содержамое аккордеона
  onClick?: (event: MouseEvent) => void
  onChange?: (value: IOption | number[]) => void
  onFileChange?: (files: FileList | null) => void
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
  id: number | string
  value?: string | number //| object
  name?: string
}

export type Colors = 'primary' | 'white' | 'red' | 'orange' | 'amber' | 'lime' | 'green' | 'sky' | 'blue' | 'purple' | 'pink' | 'rose'

export interface SeparatorProps {
  id?: string
  label?: string
  styleCSS?: string
  labelAlign?: 'start' | 'center' | 'end'
  color?: Colors
  visible?: boolean
}
