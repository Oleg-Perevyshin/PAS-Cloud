// src/stores/CatalogStore.ts
import { writable } from 'svelte/store'
import type { ICatalogDevice, ICatalogAddEditDevice } from './Interfaces'

const DefaultCatalog: ICatalogAddEditDevice = {
  Icon: '',
  CatalogID: '0000',
  CatalogName: 'PAS-Device',
  DataLanguage: 'ru',
  VerFW: '',
  Brief: 'Введите краткое описание',
  Description: 'Введите полное описание',

  Firmware: null,
  Manual: null,
  API: null,

  Created: '',
  Updated: '',
}

const DefaultCatalogList: ICatalogDevice[] = []

/**
 * Создание writable store
 */
export const CatalogStore = writable<ICatalogAddEditDevice>(DefaultCatalog)
export const CatalogListStore = writable<ICatalogDevice[]>(DefaultCatalogList)

/**
 * Подготовка модального окна для создания нового устройства
 */
export const CatalogDeviceDefault = () => {
  CatalogStore.set(DefaultCatalog)
}

/**
 * Удаление всех устройств
 */
export const DeviceListClear = () => {
  CatalogListStore.set([])
}

/**
 * Удаление устрорйства из CatalogStore
 */
export const RemoveDeviceFromStore = (CatalogID: string) => {
  CatalogListStore.update((currentDeviceList) => currentDeviceList.filter((device) => device.CatalogID !== CatalogID))
}

/* Функция для добавления или обновления устройства в CatalogStore */
export const CatalogUpsertDevice = (device: Partial<ICatalogAddEditDevice>) => {
  CatalogListStore.update((currentDeviceList) => {
    const uniqueDeviceList = currentDeviceList.filter((d, index, self) => index === self.findIndex((t) => t.CatalogID === d.CatalogID))
    const existingIndex = uniqueDeviceList.findIndex((d) => d.CatalogID === device.CatalogID)
    if (existingIndex !== -1) {
      /* Устройство существует - обновляем */
      const updatedDeviceList = uniqueDeviceList.map((d, index) => (index === existingIndex ? { ...d, ...device } : d))
      CatalogStore.set({ ...updatedDeviceList[existingIndex] })
      return updatedDeviceList
    } else {
      /* Устройства нет - добавляем как новое */
      const newDevice: ICatalogAddEditDevice = {
        ...DefaultCatalog,
        ...device,
      }
      CatalogStore.set(newDevice)
      return [...uniqueDeviceList, newDevice]
    }
  })
}
