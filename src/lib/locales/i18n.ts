// $lib/locales/i18n.ts
import { writable } from 'svelte/store'
import translations from './translations'
import CircleFlagsRu from './CircleFlagsRu.svelte'
import CircleFlagsEn from './CircleFlagsEn.svelte'
import CircleFlagsZh from './CircleFlagsZh.svelte'

/**
 * Язык по умолчанию
 */
let initialLanguage = 'ru'

/**
 * Проверяем, доступен ли localStorage (выполняется ли код на клиенте)
 */
if (typeof window !== 'undefined') {
  initialLanguage = localStorage.getItem('AppLanguage') || 'ru'
}

/**
 * Создаем хранилище с начальным значением языка
 */
export const Language = writable(initialLanguage)

/**
 * Функция для изменения языка
 */
export function setLanguage(newLang: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('AppLanguage', newLang)
  }
  Language.set(newLang)
}

/**
 * Поддерживаемые языки (код, название языка, флаг)
 */
export const LOCALES = [
  { code: 'ru', name: 'Русский', component: CircleFlagsRu },
  { code: 'en', name: 'English', component: CircleFlagsEn },
  { code: 'zh', name: '中国人', component: CircleFlagsZh },
]

/**
 * Функция для перевода
 */
function translate(key: string, language: string): string {
  if (!key) return 'No Key Provided'
  const text = translations[language]?.[key]
  /* Если перевод не найден, возвращаем ключ */
  if (!text) {
    return key
  }
  return text
}

/* Экспортируемая функция для получения перевода */
export const t = (key: string, currentLang: string = 'ru'): string => {
  return translate(key, currentLang)
}
