// src/stores/CatalogStore.ts
import { writable } from 'svelte/store'
import type { ICatalogDevice } from './Interfaces'

const DefaultCatalog: ICatalogDevice = {
  CatalogID: '0000',
  CatalogName: 'PAS-Device',
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
export const RemoveDeviceFromStore = (CatalogID: string) => {
  CatalogListStore.update((currentDeviceList) => currentDeviceList.filter((device) => device.CatalogID !== CatalogID))
}

/* Функция для добавления или обновления устройства в CatalogStore */
export const CatalogUpsertDevice = (device: Partial<ICatalogDevice>) => {
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
      const newDevice: ICatalogDevice = {
        ...DefaultCatalog,
        ...device,
      }
      CatalogStore.set(newDevice)
      return [...uniqueDeviceList, newDevice]
    }
  })
}
