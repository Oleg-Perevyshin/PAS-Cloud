// src/stores/UserStoreTemp.ts

import { writable } from 'svelte/store'
import type { IUserTemp, IUserDevice } from './Interfaces'

const DefaultUserTemp: IUserTemp = {
  UserID: '',
  EMail: '',
  Password: '',
  NickName: '',
  Avatar: '',
  Role: '',
  FirstName: '',
  LastName: '',
  Department: '',
  AboutMe: '',
  Country: '',
  Region: '',
  City: '',
  Address: '',
  PostCode: '',
  PhoneNumber: '',
  IsActivated: false,
  Tags: [],
  Devices: [],
  IsOnline: false,
}

/* Создание writable store */
export const UserStoreTemp = writable<IUserTemp>(DefaultUserTemp)
/**
 * Обновление данных временного пользователя
 */
export const UserUpdateTemp = (userData: Partial<IUserTemp>) => {
  UserStoreTemp.update((currentUser) => ({
    ...currentUser,
    ...userData,
    Password: userData.Password || currentUser.Password,
  }))
}

/**
 * Очистка данных временного пользователя
 */
export const UserClearTemp = () => {
  UserStoreTemp.set(DefaultUserTemp)
}

/**
 * Добавление или обновление устройства в личном кабинете
 */
export const UserUpsertDeviceTemp = (device: IUserDevice) => {
  UserStoreTemp.update((currentUser) => {
    const existingDeviceIndex = currentUser.Devices.findIndex((d) => d.DevSN === device.DevSN)
    if (existingDeviceIndex !== -1) {
      const updatedDevices = [...currentUser.Devices]
      updatedDevices[existingDeviceIndex] = device
      return {
        ...currentUser,
        Devices: updatedDevices,
      }
    } else {
      return {
        ...currentUser,
        Devices: [...currentUser.Devices, device],
      }
    }
  })
}

/**
 * Удаление устройства из кабинета пользователя временного пользователя
 */
export const UserRemoveDeviceTemp = (devSN: string) => {
  UserStoreTemp.update((currentUser) => ({
    ...currentUser,
    Devices: currentUser.Devices.filter((device) => device.DevSN !== devSN),
  }))
}
