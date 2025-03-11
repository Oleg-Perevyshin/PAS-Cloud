// src/stores/DeviceStore.ts
import { writable, get } from 'svelte/store'
import type { IDevice } from './Interfaces'

/* Определяем интерфейс для объединенного стора */
interface IDeviceComplete {
  apiData: IDevice | null
  dynamicValues: { [key: string]: string | number | number[] | boolean | null }
}

const createDeviceStore = () => {
  const { subscribe, set, update } = writable<IDeviceComplete>({
    apiData: null,
    dynamicValues: {},
  })

  return {
    subscribe,
    set,
    update,
    reset: () => set({ apiData: null, dynamicValues: {} }),

    setDynamicValue: (key: string, value: string | number | number[] | boolean | null) =>
      update((store) => ({
        ...store,
        dynamicValues: {
          ...store.dynamicValues,
          [key]: value,
        },
      })),

    removeDynamicValue: (key: string) =>
      update((store) => {
        const dynamicValues = Object.fromEntries(Object.entries(store.dynamicValues).filter(([k]) => k !== key))
        return { ...store, dynamicValues }
      }),

    getDynamicValue: (key: string): string | number | number[] | boolean | null => {
      const store = get({ subscribe })
      return store.dynamicValues[key] ?? null
    },
  }
}

export const DeviceStore = createDeviceStore()
