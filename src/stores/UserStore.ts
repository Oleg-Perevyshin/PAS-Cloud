// src/stores/UserStore.ts
import { writable } from 'svelte/store'
import type { IUser, IUserDevice } from './Interfaces'

const DefaultUser: IUser = {
  UserID: '',
  EMail: '',
  Password: '',
  NickName: '',
  Avatar: '',
  Role: '',
  FirstName: '',
  LastName: '',
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

/**
 * Создание writable store
 */
export const UserStore = writable<IUser>(DefaultUser)

/**
 * Обновление данных пользователя
 */
export const UserUpdate = (userData: Partial<IUser>) => {
  UserStore.update((currentUser) => ({
    ...currentUser,
    ...userData,
    Password: userData.Password || currentUser.Password,
  }))
}

/**
 * Очистка данных пользователя
 */
export const UserClear = () => {
  UserStore.set(DefaultUser)
}

/**
 * Добавление или обновление устройства в личном кабинете
 */
export const UserUpsertDevice = (device: IUserDevice) => {
  UserStore.update((currentUser) => {
    const existingDeviceIndex = currentUser.Devices.findIndex((d) => d.DevSN === device.DevSN)
    if (existingDeviceIndex !== -1) {
      /* Устройство найдено - обновляем */
      const updatedDevices = [...currentUser.Devices]
      updatedDevices[existingDeviceIndex] = device
      return {
        ...currentUser,
        Devices: updatedDevices,
      }
    } else {
      /* Устройство не найдено - добавляем */
      return {
        ...currentUser,
        Devices: [...currentUser.Devices, device],
      }
    }
  })
}

/**
 * Удаление устройства из кабинета пользователя
 */
export const UserRemoveDevice = (devSN: string) => {
  UserStore.update((currentUser) => ({
    ...currentUser,
    Devices: currentUser.Devices.filter((device) => device.DevSN !== devSN),
  }))
}
