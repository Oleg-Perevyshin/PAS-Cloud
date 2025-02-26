// src/stores/CatalogStore.ts
import { writable } from 'svelte/store'
import type { ICatalogDevice } from './Interfaces'

const DefaultCatalog: ICatalogDevice = {
  DevID: '0000',
  DevName: 'PAS-Device',
  Brief: '',
  Description: '',
  Icon: '',
  VerFW: '0.1',
  MetaData: '',
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
export const CatalogStore = writable<ICatalogDevice>(DefaultCatalog)
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
export const RemoveDeviceFromStore = (DevID: string) => {
  CatalogListStore.update((currentDeviceList) => currentDeviceList.filter((device) => device.DevID !== DevID))
}

/**
 * Функция для добавления или обновления устройства в CatalogStore
 */
export const CatalogUpsertDevice = (device: Partial<ICatalogDevice>) => {
  CatalogListStore.update((currentDeviceList) => {
    /* Удаляем все дубликаты по DevID */
    const uniqueDeviceList = currentDeviceList.filter(
      (d, index, self) => index === self.findIndex((t) => t.DevID === d.DevID),
    )

    const existingIndex = uniqueDeviceList.findIndex((d) => d.DevID === device.DevID)
    if (existingIndex !== -1) {
      /* Устройство существует - обновляем */
      return uniqueDeviceList.map((d, index) => (index === existingIndex ? { ...d, ...device } : d))
    } else {
      /* Устройства нет - добавляем как новое */
      const newDevice: ICatalogDevice = {
        ...DefaultCatalog,
        ...device,
      }
      return [...uniqueDeviceList, newDevice]
    }
  })
}
