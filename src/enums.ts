// src/enums.ts

import { t } from '$lib/locales/i18n'

/* Роли пользователей */
export const DEFAULT_ROLES = [
  { id: 'USER', name: t('service.user.roles.user'), color: '' },
  { id: 'ENGINEER', name: t('service.user.roles.engineer'), color: '' },
  { id: 'MANAGER', name: t('service.user.roles.manager'), color: '' },
  { id: 'ADMIN', name: t('service.user.roles.admin'), color: '' },
]
export type UserRole = (typeof DEFAULT_ROLES)[number]['id']

/* Значения для Select DevID */
export const OPTION_DEV_CATEGORY = [
  { id: '0', name: t('common.devid.development'), color: '!bg-stone-400' },
  { id: '1', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '2', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '3', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '4', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '5', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '6', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '7', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '8', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: '9', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: 'A', name: t('common.devid.module'), color: '!bg-cyan-400' },
  { id: 'B', name: t('common.devid.water'), color: '!bg-violet-400' },
  { id: 'C', name: t('common.devid.ground'), color: '!bg-violet-400' },
  { id: 'D', name: t('common.devid.air'), color: '!bg-violet-400' },
  { id: 'E', name: t('common.devid.space'), color: '!bg-violet-400' },
  { id: 'F', name: t('common.devid.system'), color: '!bg-orange-400' },
]
export const OPTION_DEVID = [
  { id: '0', name: '0', color: '!border-blue-400' },
  { id: '1', name: '1', color: '!border-blue-400' },
  { id: '2', name: '2', color: '!border-blue-400' },
  { id: '3', name: '3', color: '!border-blue-400' },
  { id: '4', name: '4', color: '!border-blue-400' },
  { id: '5', name: '5', color: '!border-blue-400' },
  { id: '6', name: '6', color: '!border-blue-400' },
  { id: '7', name: '7', color: '!border-blue-400' },
  { id: '8', name: '8', color: '!border-blue-400' },
  { id: '9', name: '9', color: '!border-blue-400' },
  { id: 'A', name: 'A', color: '!border-blue-400' },
  { id: 'B', name: 'B', color: '!border-blue-400' },
  { id: 'C', name: 'C', color: '!border-blue-400' },
  { id: 'D', name: 'D', color: '!border-blue-400' },
  { id: 'E', name: 'E', color: '!border-blue-400' },
  { id: 'F', name: 'F', color: '!border-blue-400' },
]

/* Стандартные Теги */
export const DEFAULT_TAGS = [
  { id: 'tag-1', name: 'Tag 1', value: 'tag-1', color: 'bg-stone-400 border-2 !border-stone-400' },
  { id: 'tag-2', name: 'Tag 2', value: 'tag-2', color: 'bg-red-400 border-2 !border-red-400' },
  { id: 'tag-3', name: 'Tag 3', value: 'tag-3', color: 'bg-yellow-400 border-2 !border-yellow-400' },
  { id: 'tag-4', name: 'Tag 4', value: 'tag-4', color: 'bg-green-400 border-2 !border-green-400' },
  { id: 'tag-5', name: 'Tag 5', value: 'tag-5', color: 'bg-sky-400 border-2 !border-sky-400' },
  { id: 'tag-6', name: 'Tag 6', value: 'tag-6', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
]

/* Все возможные именованные цвета из Tailwind */
// { id: 'tag-1', name: 'Tag 1', color: 'bg-stone-400 border-2 !border-stone-400' },
// { id: 'tag-2', name: 'Tag 2', color: 'bg-red-400 border-2 !border-red-400' },
// { id: 'tag-3', name: 'Tag 3', color: 'bg-orange-400 border-2 !border-orange-400' },
// { id: 'tag-4', name: 'Tag 4', color: 'bg-amber-400 border-2 !border-amber-400' },
// { id: 'tag-5', name: 'Tag 5', color: 'bg-yellow-400 border-2 !border-yellow-400' },
// { id: 'tag-6', name: 'Tag 6', color: 'bg-lime-400 border-2 !border-lime-400' },
// { id: 'tag-7', name: 'Tag 7', color: 'bg-green-400 border-2 !border-green-400' },
// { id: 'tag-8', name: 'Tag 8', color: 'bg-emerald-400 border-2 !border-emerald-400' },
// { id: 'tag-9', name: 'Tag 9', color: 'bg-teal-400 border-2 !border-teal-400' },
// { id: 'tag-10', name: 'Tag 10', color: 'bg-cyan-400 border-2 !border-cyan-400' },
// { id: 'tag-11', name: 'Tag 11', color: 'bg-sky-400 border-2 !border-sky-400' },
// { id: 'tag-12', name: 'Tag 12', color: 'bg-blue-400 border-2 !border-blue-400' },
// { id: 'tag-13', name: 'Tag 13', color: 'bg-indigo-400 border-2 !border-indigo-400' },
// { id: 'tag-14', name: 'Tag 14', color: 'bg-violet-400 border-2 !border-violet-400' },
// { id: 'tag-15', name: 'Tag 15', color: 'bg-purple-400 border-2 !border-purple-400' },
// { id: 'tag-16', name: 'Tag 16', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
// { id: 'tag-17', name: 'Tag 17', color: 'bg-pink-400 border-2 !border-pink-400' },
// { id: 'tag-18', name: 'Tag 18', color: 'bg-rose-400 border-2 !border-rose-400' },
