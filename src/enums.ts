// src/enums.ts

import { t } from '$lib/locales/i18n'

/* Роли пользователей */
export const DEFAULT_ROLES = [
  { id: 'USER', name: t('service.user.roles.user'), color: 'bg-stone border-blue-400' },
  { id: 'ENGINEER', name: t('service.user.roles.engineer'), color: 'bg-white border-blue-400' },
  { id: 'MANAGER', name: t('service.user.roles.manager'), color: 'bg-white border-blue-400' },
  { id: 'ADMIN', name: t('service.user.roles.admin'), color: 'bg-white border-blue-400' },
]
export type UserRole = (typeof DEFAULT_ROLES)[number]['id']

/* Значения для Select DevID */
// export const DEFAULT_OPTION_DEVID_CATEGORY = [
//   { id: 'select-devid-01', name: t('common.devid.development'), color: '!border-blue-400 !bg-stone-400' },
//   { id: 'select-devid-02', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-03', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-04', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-05', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-06', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-07', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-08', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-09', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-10', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-11', name: t('common.devid.module'), color: '!border-blue-400 !bg-cyan-400' },
//   { id: 'select-devid-12', name: t('common.devid.water'), color: '!border-blue-400 !bg-violet-400' },
//   { id: 'select-devid-13', name: t('common.devid.ground'), color: '!border-blue-400 !bg-violet-400' },
//   { id: 'select-devid-14', name: t('common.devid.air'), color: '!border-blue-400 !bg-violet-400' },
//   { id: 'select-devid-15', name: t('common.devid.space'), color: '!border-blue-400 !bg-violet-400' },
//   { id: 'select-devid-16', name: t('common.devid.system'), color: '!border-blue-400 !bg-orange-400' },
// ]
export const DEFAULT_OPTION_DEVID_CATEGORY = [
  { id: 'select-devid-01', name: '0', color: '!border-blue-400 !bg-stone-400' },
  { id: 'select-devid-02', name: '1', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-03', name: '2', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-04', name: '3', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-05', name: '4', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-06', name: '5', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-07', name: '6', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-08', name: '7', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-09', name: '8', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-10', name: '9', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-11', name: 'A', color: '!border-blue-400 !bg-cyan-400' },
  { id: 'select-devid-12', name: 'B', color: '!border-blue-400 !bg-violet-400' },
  { id: 'select-devid-13', name: 'C', color: '!border-blue-400 !bg-violet-400' },
  { id: 'select-devid-14', name: 'D', color: '!border-blue-400 !bg-violet-400' },
  { id: 'select-devid-15', name: 'E', color: '!border-blue-400 !bg-violet-400' },
  { id: 'select-devid-16', name: 'F', color: '!border-blue-400 !bg-orange-400' },
]
export const DEFAULT_OPTION_DEVID = [
  { id: 'select-devid-01', name: '0', color: '!border-blue-400' },
  { id: 'select-devid-02', name: '1', color: '!border-blue-400' },
  { id: 'select-devid-03', name: '2', color: '!border-blue-400' },
  { id: 'select-devid-04', name: '3', color: '!border-blue-400' },
  { id: 'select-devid-05', name: '4', color: '!border-blue-400' },
  { id: 'select-devid-06', name: '5', color: '!border-blue-400' },
  { id: 'select-devid-07', name: '6', color: '!border-blue-400' },
  { id: 'select-devid-08', name: '7', color: '!border-blue-400' },
  { id: 'select-devid-09', name: '8', color: '!border-blue-400' },
  { id: 'select-devid-10', name: '9', color: '!border-blue-400' },
  { id: 'select-devid-11', name: 'A', color: '!border-blue-400' },
  { id: 'select-devid-12', name: 'B', color: '!border-blue-400' },
  { id: 'select-devid-13', name: 'C', color: '!border-blue-400' },
  { id: 'select-devid-14', name: 'D', color: '!border-blue-400' },
  { id: 'select-devid-15', name: 'E', color: '!border-blue-400' },
  { id: 'select-devid-16', name: 'F', color: '!border-blue-400' },
]

/* Стандартные Теги */
export const DEFAULT_TAGS = [
  { id: '1', name: 'Tag 1', color: 'bg-stone-400 border-2 !border-stone-400' },
  { id: '2', name: 'Tag 2', color: 'bg-red-400 border-2 !border-red-400' },
  { id: '3', name: 'Tag 3', color: 'bg-orange-400 border-2 !border-orange-400' },
  { id: '4', name: 'Tag 4', color: 'bg-yellow-400 border-2 !border-yellow-400' },
  { id: '5', name: 'Tag 5', color: 'bg-lime-400 border-2 !border-lime-400' },
  { id: '6', name: 'Tag 6', color: 'bg-emerald-400 border-2 !border-emerald-400' },
  { id: '7', name: 'Tag 7', color: 'bg-cyan-400 border-2 !border-cyan-400' },
  { id: '8', name: 'Tag 8', color: 'bg-blue-400 border-2 !border-blue-400' },
  { id: '9', name: 'Tag 9', color: 'bg-violet-400 border-2 !border-violet-400' },
  { id: '10', name: 'Tag 10', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
]

/* Заголовки для пакета WebSocket */
export const DEFAULT_OPTION_WS_HEADER = [
  { id: '1', name: 'SYS', color: 'bg-fuchsia-300 !border-fuchsia-300' },
  { id: '2', name: 'GET', color: 'bg-blue-300 !border-blue-300' },
  { id: '3', name: 'SET', color: 'bg-yellow-300 !border-yellow-300' },
  { id: '4', name: 'OK!', color: 'bg-lime-300 !border-lime-300' },
  { id: '5', name: 'ER!', color: 'bg-red-300 !border-red-300' },
]
export enum HeaderOptions {
  SYS = 'SYS',
  GET = 'GET',
  SET = 'SET',
  OK = 'OK!',
  ER = 'ER!',
}
export const ARGUMENT_OPTIONS_MAP: Record<HeaderOptions, { id: string; name: string; color: string }[]> = {
  [HeaderOptions.SYS]: [
    { id: '1', name: 'Restart', color: 'bg-fuchsia-300 !border-fuchsia-300' },
    { id: '2', name: 'DefConfig', color: 'bg-fuchsia-300 !border-fuchsia-300' },
  ],
  [HeaderOptions.GET]: [
    { id: '1', name: 'Config', color: 'bg-blue-300 !border-blue-300' },
    { id: '2', name: 'DevList', color: 'bg-blue-300 !border-blue-300' },
    { id: '3', name: 'APList', color: 'bg-blue-300 !border-blue-300' },
  ],
  [HeaderOptions.SET]: [
    { id: '1', name: 'WiFiConfig', color: 'bg-yellow-300 !border-yellow-300' },
    { id: '2', name: 'SetMessagesToGroup', color: 'bg-yellow-300 !border-yellow-300' },
  ],
  [HeaderOptions.OK]: [{ id: '1', name: 'Config', color: 'bg-lime-300 !border-lime-300' }],
  [HeaderOptions.ER]: [{ id: '1', name: 'Config', color: 'bg-red-300 !border-red-300' }],
}

/* Все возможные именованные цвета из Tailwind */
// { name: 'Tag 1', color: 'bg-stone-400' },
// { name: 'Tag 2', color: 'bg-red-400' },
// { name: 'Tag 3', color: 'bg-orange-400' },
// { name: 'Tag 4', color: 'bg-amber-400' },
// { name: 'Tag 5', color: 'bg-yellow-400' },
// { name: 'Tag 6', color: 'bg-lime-400' },
// { name: 'Tag 7', color: 'bg-green-400' },
// { name: 'Tag 8', color: 'bg-emerald-400' },
// { name: 'Tag 9', color: 'bg-teal-400' },
// { name: 'Tag 10', color: 'bg-cyan-400' },
// { name: 'Tag 11', color: 'bg-sky-400' },
// { name: 'Tag 12', color: 'bg-blue-400' },
// { name: 'Tag 13', color: 'bg-indigo-400' },
// { name: 'Tag 14', color: 'bg-violet-400' },
// { name: 'Tag 15', color: 'bg-purple-400' },
// { name: 'Tag 16', color: 'bg-fuchsia-400' },
// { name: 'Tag 17', color: 'bg-pink-400' },
// { name: 'Tag 18', color: 'bg-rose-400' },
