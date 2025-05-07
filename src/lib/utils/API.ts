// $lib/utils/API.ts
import { SmartRequest } from './SmartRequest'
import { addMessage } from '../../stores/MessageStore'
import { UserStore, UserUpdate, UserStoreTemp, UserUpdateTemp, UserUpsertDevice, UserUpsertDeviceTemp } from '../../stores'
import type { IUser, INews, IUserTemp } from '../../stores/Interfaces'
import { ValidateDevSN } from './Common'
import { DEFAULT_TAGS } from '../../enums'

/**
 * Все пути для формирования запросов
 */
export const API_ROUTES = {
  AUTH_REGISTER: '/api/auth_register',
  AUTH_LOGIN: '/api/auth_login',
  AUTH_RELOGIN: '/api/auth_relogin',
  AUTH_LOGOUT: '/api/auth_logout',
  USER_PROFILE: '/api/user',
  USER_INFO: '/api/user_info',
  USER_LIST: '/api/user_list',
  USER_SEARCH: '/api/user_search',
  USER_UPDATE: '/api/user_update',
  USER_DELETE: '/api/user_delete',
  DEVICE_LIST: '/api/device_list',
  DEVICE_ADD: '/api/device_add',
  DEVICE_DELETE: '/api/device_delete',
  DEVICE_UPDATE: '/api/device_update',
  NEWS_EDIT: '/api/news_edit',
  NEWS_LIST: '/api/news_list',
  NEWS_DELETE: '/api/news_delete',
  CATALOG_EDIT_DEVICE: '/api/catalog_edit',
  CATALOG_ADD_DEVICE: '/api/catalog_add',
  CATALOG_GET_DEVICE: '/api/catalog_id',
  CATALOG_DELETE_DEVICE: '/api/catalog_delete',
}

/**
 * Получить данные пользователя по UserID
 * @param UserID - идентификатор пользователя
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UserGetProfile = async (UserID: string, isCurrentUser: boolean) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.USER_PROFILE}?UserID=${UserID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    if (!responseData?.user) {
      throw new Error('Invalid Response Data')
    }

    /* Создаем объект userData */
    const userData = {
      ...responseData.user,
      Devices: Array.isArray(responseData.user.Devices) ? responseData.user.Devices : [],
      Tags: Array.isArray(responseData.user.Tags) ? responseData.user.Tags : DEFAULT_TAGS,
      IsOnline: true,
    } as IUser | IUserTemp

    /* Обновляем состояние пользователя */
    if (isCurrentUser) {
      UserUpdate(userData)
    } else {
      UserUpdateTemp(userData)
    }
  } catch (error) {
    console.error('Ошибка API_UserGetProfile', error)
    throw new Error('Failed API_UserGetProfile')
  }
}

/**
 * Получить данные пользователя по UserID (минимальный пакет)
 * @param UserID - идентификатор пользователя
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UserGetInfo = async (UserID: string): Promise<IUser> => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.USER_INFO}?UserID=${UserID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    if (!responseData?.user_info) {
      throw new Error('Invalid Response Data')
    }

    /* Создаем объект userData */
    const userData = {
      ...responseData.user_info,
    } as IUser

    /* Обновляем состояние пользователя */
    // UserStoreTemp.update((currentUser: IUser) => ({ ...currentUser }))
    UserStoreTemp.update((currentUser: IUser) => ({ ...currentUser, ...userData }))
    UserUpdateTemp(userData)
    return userData
  } catch (error) {
    console.error('Ошибка API_UserGetInfo', error)
    addMessage('ERR: API_UserGetInfo')
    throw new Error('Failed API_UserGetInfo')
  }
}

/**
 * Обновление данных пользователя
 * @param UserData - полный пакет данных пользователя
 * @param UserID - идентификатор пользователя
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UserUpdate = async (UserData: IUser, UserID: string, isCurrentUser: boolean) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.USER_UPDATE}?UserID=${UserID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify(UserData),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    if (!responseData?.user) {
      throw new Error('Invalid Response Data')
    }

    let userData
    if (isCurrentUser) {
      userData = { ...responseData.user, IsOnline: true } as IUser
      if (!Array.isArray(responseData.user.Devices)) {
        userData.Devices = []
      }
      UserUpdate(userData)
    } else {
      userData = { ...responseData.user } as IUser
      if (!Array.isArray(responseData.user.Devices)) {
        userData.Devices = []
      }
      UserUpdateTemp(userData)
    }
    return userData
  } catch (error) {
    console.error('Ошибка API_UserUpdate', error)
    addMessage('ERR: API_UserUpdate')
    throw new Error('Failed API_UserUpdate')
  }
}

/**
 * Удаление аккаунта
 * @param UserID - идентификатор пользователя для удаления
 */
export const API_UserDelete = async (UserID: string) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.USER_DELETE}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ UserID: UserID }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UserDelete', error)
    addMessage('ERR: API_UserDelete')
    throw new Error('Failed API_UserDelete')
  }
}

/**
 * Получить список устройств пользователя по UserID
 * @param UserID - идентификатор пользователя
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UserGetDevices = async (UserID: string, isCurrentUser: boolean) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.DEVICE_LIST}?UserID=${UserID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    const devices = responseData?.user_devices
    if (!Array.isArray(devices)) {
      throw new Error('Invalid Response Data')
    }

    /* Обновление устройств */
    devices.forEach(UserUpsertDevice)

    /* Обновляем состояние пользователя */
    if (isCurrentUser) {
      UserStore.update((currentUser: IUser) => ({ ...currentUser, Devices: devices, IsOnline: true }))
    } else {
      UserStoreTemp.update((currentUser: IUser) => ({ ...currentUser, Devices: devices }))
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UserGetDevices', error)
    throw new Error('Failed API_UserGetDevices')
  }
}

/**
 * Добавление устройства в кабинет пользователя
 * @param UserID - идентификатор пользователя
 * @param DevSN - серийный номер устройства
 * @param TagID - ID установленного тега
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UserAddDevice = async (UserID: string, DevSN: string, TagID: string, isCurrentUser: boolean) => {
  /* Проверяем серийного номера */
  const SerialNumber = ValidateDevSN(DevSN)
  if (!SerialNumber) {
    console.error('Ошибка API_UserAddDevice: Неверный серийный номер')
    addMessage('WR: API_UserAddDevice')
    return null
  }
  try {
    const responseData = await SmartRequest(`${API_ROUTES.DEVICE_ADD}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ UserID: UserID, DevSN: SerialNumber, TagID: TagID }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    if (!responseData?.user_device) {
      throw new Error('Invalid Response Data')
    }

    if (isCurrentUser) {
      UserUpsertDevice(responseData.user_device)
    } else {
      UserUpsertDeviceTemp(responseData.user_device)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UserAddDevice', error)
    addMessage('ERR: API_UserAddDevice')
    throw new Error('Failed API_UserAddDevice')
  }
}

/**
 * Удаление устройство из профиля пользователя
 * @param UserID - идентификатор пользователя
 * @param DevSN - серийный номер устройства для удаления
 */
export const API_UserDeleteDevice = async (UserID: string, DevSN: string) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.DEVICE_DELETE}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ UserID: UserID, DevSN: DevSN }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UserDeleteDevice', error)
    addMessage('ERR: API_UserDeleteDevice')
    throw new Error('Failed API_UserDeleteDevice')
  }
}

/**
 * Обновление тега устройства
 * @param UserID - идентификатор пользователя
 * @param DevSN - серийный номер устройства
 * @param TagID - ID установленного тега
 * @param isCurrentUser - флаг определения пользователя
 */
export const API_UpdateDeviceTagID = async (UserID: string, DevSN: string, TagID: string, isCurrentUser: boolean) => {
  /* Проверяем серийного номера */
  const SerialNumber = ValidateDevSN(DevSN)
  if (!SerialNumber) {
    console.error('Ошибка API_UpdateDeviceTagID: Неверный серийный номер')
    addMessage('WR: API_UpdateDeviceTagID')
    return null
  }
  try {
    const responseData = await SmartRequest(`${API_ROUTES.DEVICE_UPDATE}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ UserID: UserID, DevSN: DevSN, TagID: TagID }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    if (!responseData?.user_device) {
      throw new Error('Invalid Response Data')
    }

    /* Обновляем Tag устройство в зависимости от того, является ли пользователь текущим */
    if (isCurrentUser) {
      UserUpsertDevice(responseData.user_device)
    } else {
      UserUpsertDeviceTemp(responseData.user_device)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UpdateDeviceTagID', error)
    addMessage('ERR: API_UpdateDeviceTagID')
    throw new Error('Failed API_UpdateDeviceTagID')
  }
}

/**
 * Сохранение новости пользователя
 * @param UserNews - полный пакет данных новости
 */
export const API_UserAddEditNews = async (UserNews: INews) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.NEWS_EDIT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify(UserNews),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    /* Проверяем наличие данных о новости */
    if (!responseData?.news) {
      throw new Error('Invalid Response Data')
    }
    return responseData.news
  } catch (error) {
    console.error('Ошибка API_UserAddEditNews', error)
    throw new Error('Failed API_UserAddEditNews')
  }
}

/**
 * Получение списка новостей
 * @param UserID - идентификатор пользователя, запросившего список новостей
 */
export const API_NewsList = async (UserID: string) => {
  try {
    const responseData = await SmartRequest(UserID ? `${API_ROUTES.NEWS_LIST}?UserID=${UserID}` : API_ROUTES.NEWS_LIST, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }

    /* Проверяем наличие данных о новости */
    if (!responseData?.news_list) {
      throw new Error('Invalid Response Data')
    }
    return responseData.news_list
  } catch (error) {
    console.error('Ошибка API_NewsList', error)
    addMessage('ERR: API_NewsList')
    throw new Error('Failed API_NewsList')
  }
}

/**
 * Удаление новости из профиля пользователя
 * @param UserID - идентификатор пользователя
 * @param NewsID - идентификатор новости для удаления
 */
export const API_UserDeleteNews = async (UserID: string, NewsID: string) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.NEWS_DELETE}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ UserID: UserID, NewsID: NewsID }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_UserDeleteNews', error)
    addMessage('ERR: API_UserDeleteNews')
    throw new Error('Failed API_UserDeleteNews')
  }
}

/**
 * Редактирование устройства в каталоге
 * @param DeviceData - полный пакет данных об устройстве
 */
export const API_CatalogUpdateDevice = async (DeviceData: FormData) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.CATALOG_EDIT_DEVICE}`, {
      method: 'POST',
      headers: {
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: DeviceData,
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_CatalogUpdateDevice', error)
    addMessage('ERR: API_CatalogUpdateDevice')
    throw new Error('Failed API_CatalogUpdateDevice')
  }
}

/**
 * Создание устройства в каталоге
 * @param DeviceData - полный пакет данных об устройстве
 */
export const API_CatalogAddDevice = async (DeviceData: FormData) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.CATALOG_ADD_DEVICE}`, {
      method: 'POST',
      headers: {
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: DeviceData,
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_CatalogAddDevice', error)
    addMessage('ERR: API_CatalogAddDevice')
    throw new Error('Failed API_CatalogAddDevice')
  }
}

/**
 * Создание/Редактирование устройства в каталоге
 * @param DeviceData - полный пакет данных об устройстве
 */
export const API_CatalogDevice = async (CatalogID: string, VerFW: string) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.CATALOG_GET_DEVICE}?CatalogID=${CatalogID}&VerFW=${VerFW}`, {
      method: 'GET',
      headers: {
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_CatalogDevice', error)
    addMessage('ERR: API_CatalogDevice')
    throw new Error('Failed API_CatalogDevice')
  }
}

/**
 * Удаление устройства из каталога
 * @param DevID - идентификатор устройства
 */
export const API_CatalogDeleteDevice = async (CatalogID: string, VerFW: string | null) => {
  try {
    const responseData = await SmartRequest(`${API_ROUTES.CATALOG_DELETE_DEVICE}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': typeof window !== 'undefined' ? localStorage.getItem('AppLanguage') || 'ru' : 'ru',
      },
      body: JSON.stringify({ CatalogID, VerFW }),
      credentials: 'include',
    })

    if (responseData?.status.message) {
      addMessage(responseData.status.message)
    }
    return responseData
  } catch (error) {
    console.error('Ошибка API_CatalogDeleteDevice', error)
    addMessage('ERR: API_CatalogDeleteDevice')
    throw new Error('Failed API_CatalogDeleteDevice')
  }
}
