// $lib/utils/SmartRequest.ts
import { goto } from '$app/navigation'
import type { StatusResponse, IUser, IUserDevice, INews, ICatalogDevice } from '../../stores/Interfaces'
import { UserClear, UserClearTemp, DeviceListClear, NewsListClear } from '../../stores'
import { addMessage } from '../../stores'

/**
 * Интерфейсы ответов от сервера
 */
export interface IResponseData {
  /* Получение данных статуса от сервера */
  status: StatusResponse

  /* Получение данных пользователя */
  user: IUser

  /* Получение общедоступные данных пользователя */
  user_info: IUser

  /* Получение массива пользователей */
  user_list: IUser[]

  /* Получение устройства пользователя */
  user_device: IUserDevice

  /* Получение массива устройств пользователя */
  user_devices: IUserDevice[]

  /* Получение новости пользователя */
  news: INews

  /* Получение массива новостей пользователя */
  news_list: INews[]

  /* Получение устройства из каталога */
  catalog: ICatalogDevice

  /* Получение массива устройств из каталога */
  catalog_list: ICatalogDevice[]
}

/* Интерфейс запроса */
export interface IRequestConfig {
  method: string
  headers?: Record<string, string>
  body?: BodyInit | null
  credentials?: RequestCredentials
}

/* Запрос на сервер */
export const SmartRequest = async (url: string, config: IRequestConfig) => {
  try {
    /* Формируем запрос */
    const response = await fetch(url, {
      ...config,
      headers: {
        ...config.headers,
      },
    })
    const responseData: IResponseData = await response.json()
    if (!responseData?.status.code || !responseData?.status.message) {
      addMessage('SmartRequest: Неверный ответ от сервера')
      throw new Error('ERR: Неверный ответ от сервера')
    }

    if (responseData.status.code === 401) {
      localStorage.clear()
      UserClear()
      UserClearTemp()
      DeviceListClear()
      NewsListClear()
      goto('/')
    }
    return responseData
  } catch (error) {
    console.error('Ошибка в SmartRequest', error)
    throw error
  }
}
