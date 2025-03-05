// src/stores/UserInterfaces.ts
import type { UserRole } from '../enums'


/* Вспомогательный интерфейс для определения структуры Tag */
export interface IOptionUI {
  id: string
  name: string
  value?: string | null
  color?: string
}
/**
 * Вспомогательный интерфейс для привязки Тега к конкретному устройству из кабинета пользователя
 * Предназначен для селектора Тегов и привязки стилей к конкретному устройству пользователя
 */
export interface DeviceUser {
  serial_number: string                  // Уникальный серийный номер устройства
  tag_id: string                         // Идентификатор тега
}


/* Обязательная часть ответса от сервера (статус), данный ответ содержится только в HTTP/HTTPS запросах */
export interface StatusResponse {
  code: number
  message: string
}


/* ПОЛЬЗОВАТЕЛЬ: Интерфейс данных о пользователе */
export interface IUser {
  UserID: string                          // Уникальный идентификатор пользователя
  EMail: string                           // Электронная почта пользователя
  Password: string                        // Пароль пользователя
  NickName: string                        // Псевдоним пользователя
  Avatar: string                          // Аватар пользователя (данные SVG)
  Role: UserRole                          // Роль пользователя
  FirstName: string                       // Имя пользователя
  LastName: string                        // Фамилия пользователя
  Department: string                      // Подразделение
  AboutMe: string                         // О пользователе
  Country: string                         // Страна
  Region: string                          // Регион
  City: string                            // Город
  Address: string                         // Адрес
  PostCode: string                        // Почтовый индекс
  PhoneNumber: string                     // Номер телефона
  IsActivated: boolean                    // Статус активации пользователя
  Tags: {                                 // Теги пользователя
    id: string
    name: string
    value: string
    color: string
  }[]
  Devices: IUserDevice[]                  // Устройства, привязанные к пользователю
  IsOnline: boolean                       // Статус входа пользователя
  Created?: string                        // Дата создания пользователя (опционально)
  Updated?: string                        // Дата обновления пользователя (опционально)
}
export interface IUserTemp {
  UserID: string                          // Уникальный идентификатор пользователя
  EMail: string                           // Электронная почта пользователя
  Password: string                        // Пароль пользователя
  NickName: string                        // Псевдоним пользователя
  Avatar: string                          // Аватар пользователя (данные SVG)
  Role: UserRole                          // Роль пользователя
  FirstName: string                       // Имя пользователя
  LastName: string                        // Фамилия пользователя
  Department: string                      // Подразделение
  AboutMe: string                         // О пользователе
  Country: string                         // Страна
  Region: string                          // Регион
  City: string                            // Город
  Address: string                         // Адрес
  PostCode: string                        // Почтовый индекс
  PhoneNumber: string                     // Номер телефона
  IsActivated: boolean                    // Статус активации пользователя
  Tags: {                                 // Теги пользователя
    id: string
    name: string
    value: string
    color: string
  }[]
  Devices: IUserDevice[]                  // Устройства, привязанные к пользователю
  IsOnline: boolean                       // Статус входа пользователя
  Created?: string                        // Дата создания пользователя (опционально)
  Updated?: string                        // Дата обновления пользователя (опционально)
}


/* ПОЛЬЗОВАТЕЛЬ: Интерфейс устройства из кабинета пользователя */
export interface IUserDevice {
  DevSN: string                           // Серийный номер устройства
  DevID: string                           // Уникальный идентификатор устройства в каталоге
  DevName: string                         // Название устройства
  DevFW: string                           // Версия прошивки устройства
  IsOnline: boolean                       // Статус подключения устройства
  TagID: string                           // Идентификатор тега устройства
  CatDevName: string                      // Название категории устройства
  CatBrief: string                        // Краткая информация о категории
  CatDescription: string                  // Подробное описание категории
  CatIcon: string                         // Иконка категории
  CatVerFW: string                        // Версия прошивки категории
  CatMeta: string                         // Мета данные о прошивке
  CatCreated: string                      // Дата создания
  CatUpdated: string                      // Дата последнего обновления
}


/* КАТАЛОГ: Интерфейс устройства из каталога */
export interface ICatalogDevice {
  CatalogID: string                       // Уникальный идентификатор изделия / модуля
  CatalogName: string                     // Имя изделия / модуля (имя по умолчанию из каталога)
  Brief: string                           // Краткое описание
  Description: string                     // Подробное описание текущего устройства (с учетом версии прошивки)
  Icon: string                            // Иконка
  VerFW: string                           // Последняя версия прошивки на сервере
  Created?: string                        // Дата создания устройство
  Updated?: string                        // Дата изменения устройство
  Versions?: {                            // Все существующие версии прошивок на сервере
    VerFW?: string                        // Версия прошивки
    Description?: string                  // Подробное описание
    Created?: string                      // Дата создания
    Updated?: string                      // Дата последнего обновления
  }[] | []
  MetaData?: string                       // Мета данные о прошивке
  Firmware: File | null,                  // Прошивки
  Manual: File | null,                    // Руководство пользователя
  API: File | IDeviceModule | null,       // API
}


/* НОВОСТИ: Интерфейс новости */
export interface INews {
  NewsID: string                          // Уникальный идентификатор пользователя
  UserID?: string | null                  // Идентификатор пользователя, кому принадлежит новость
  Title: string                           // Заголовок новости
  Brief: string                           // Краткое описание новости
  Content: string                         // Основной контент новости
  ImageTitle: string | null               // Основное изображение новости
  ImageContent: string | null             // Изображение внутри новости
  Published: boolean                      // Статус публикации новости
  Author?: {                              // Объект данных об аторе
    NickName?: string                     // Псевдоним автора
    Avatar?: string                       // URL аватара (опционально)
    FirstName?: string                    // Имя автора (опционально)
    LastName?: string                     // Фамилия автора (опционально)
    EMail?: string                        // Email автора (опционально)
  } | null
  Created?: string                        // Дата создания новости (опционально)
  Updated?: string                        // Дата изменения новости (опционально)
}


/* СООБЩЕНИЯ: Интерфейс всплывающего сообщения */
export interface IPopUpMessage {
  id: number
  text: string
  createdAt: number
  timeoutId?: ReturnType<typeof setTimeout>
}


/* WEBSOCKET: Массив объектов со списком Модулей в Изделии */
export interface IReqModuleList {
  ClientID: string
  GroupID: string
  Data: object
  ModuleList: {
    DevSN: string
    DevName: string
    DevFW: string
  }[]
}
/* WEBSOCKET: Массив объектов с настройками Модулей в Изделии */
export interface IReqModuleConfig {
  ClientID: string
  GroupID: string
  Data: object
  ModuleConfig: {
    DevSN: string
    DevName: string
    DevFW: string
    [key: string]: string
  }
}

/* WEBSOCKET: Интерфейс при подключении к группе */
export interface IJoinGroup {
  ClientID: string
  GroupID: string
  GroupName: string | null
  Created: string | null
  Updated: string | null
}

/* WEBSOCKET: Интерфейс при отключении от группы */
export interface ILeaveGroup {
  ClientID: string
  GroupID: string
  GroupName: string | null
  Created: string | null
  Updated: string | null
}

/* WEBSOCKET: Интерфейс при создании группы */
export interface ICreateGroup {
  ClientID: string
  GroupID: string
  GroupName: string | null
  Created: string | null
  Updated: string | null
}

/* WEBSOCKET: Интерфейс списка групп */
export interface IGroupList {
  ClientID: string                // Идентификатор запросившего клиента
  GroupList: IGroup[]             // Массив групп
}

/* WEBSOCKET: Интерфейс группы */
export interface IGroup {
  GroupID: string                 // Идентификатор группы
  GroupName?: string | null       // Имя группы
  FirstName?: string | null       // Имя (для личной группы, чтоб удобнее отображать в интерфейсе)
  LastName?: string | null        // Фамилия (для личной группы, чтоб удобнее отображать в интерфейсе)
  Created?: string | null         // Дата создания группы
  Updated?: string | null         // Дата обновления данных в группе
}

/* WEBSOCKET: Интерфейс при удалении группы */
export interface IDeleteGroup {
  ClientID: string
  GroupID: string
}

/* WEBSOCKET: Интерфейс сообщения в группе */
export interface IGroupMessage {
  ClientID: string
  DevSN: string
  GroupID: string
  GroupName: string
  MessageID?: string
  Message?: string | object,
  Created?: string
  Author?: {
    UserID?: string
    NickName?: string
    FirstName?: string
    LastName?: string
  }
}

/* WEBSOCKET: Интерфейс сообщений в группе */
export interface IGroupMessageList {
  ClientID: string
  GroupID: string
  GroupName: string
  GroupMessages?: IGroupMessage[]
  HasMore?: boolean
}

/* WEBSOCKET: Интерфейс удаления сообщения из группы */
export interface IDeleteMessage {
  ClientID: string
  GroupID: string
  MessageID: string
}

/* Интерфейс расшифрованного и разобранного пакета */
export interface IWebSocketPacket {
  HEADER: string
  ARGUMENT: string
  VALUE: object
}


/* Интерфейс для сообщений состояния */
export interface IWebSocketValueStatus {
  ClientID: string
  GroupID: string
  Status: {
    Title?: string
    Message?: string
    NumVar?: number
    Changes?: { [key: string]: string | number | boolean | null }
  }
}


/* ИЗДЕЛИЕ целиком со всеми необходимыми полями для управления и контроля */
export interface IDevice {
  DevID: string                           // Уникальный идентификатор ИЗДЕЛИЯ по каталогу
  Icon: string                            // Иконка ИЗДЕЛИЯ из каталога по DevID
  DevSN: string                           // Серийный номер ИЗДЕЛИЯ
  DevName: string                         // Имя ИЗДЕЛИЯ (пользовательское имя)
  DevFW: string                           // Текущая версия прошивки (как правило шлюза)
  VerFW: string                           // Самая последняя версия прошивки на сервере
  Brief: string                           // Краткое описание из каталога
  IsOnline: boolean                       // Признак сетевой активности
  Modules : IDeviceModule[]               // Массив модулей в составе ИЗДЕЛИЯ (самый первый всегда шлюз)
}
/* МОДУЛЬ в составе изделии */
export interface IDeviceModule {
  DevID: string                           // Уникальный идентификатор МОДУЛЯ по каталогу
  Icon: string                            // Иконка МОДУЛЯ из каталога по DevID
  DevSN: string                           // Серийный номер МОДУЛЯ
  DevName: string                         // Имя МОДУЛЯ (пользовательское имя)
  DevFW: string                           // Текущая версия прошивки МОДУЛЯ
  VerFW: string                           // Самая последняя версия прошивки на сервере
  Brief: string                           // Краткое описание (из каталога)
  Versions: {                             // Версии прошивок на сервере
    VerFW: string
    Description: string
    Created: string
    Updated: string
  }[]
  Status: IWebSocketValueStatus           // Сообщения со статусом модуля
  UIBlocks: IDeviceBlock[]                // Массив логических блоки для построения Web интерфейса управления
}
/* Блок настроек или параметров модуля */
export interface IDeviceBlock {
  BlockID: string                         // Уникальный идентификатор блока параметров
  Label: string                           // Название блока
  Description?: string                    // Краткое описание блока (для информации)
  Parameters: IParameterSet[]             // Массив параметров блока
}
/* Параметр блока */
export interface IParameterSet {
  ParamID: string                         // Уникальный идентификатор параметра
  Label: string                           // Название раздела параметров
  Description?: string                    // Краткое описание раздела параметров (для информации)
  UIComponents: IUIComponent[]            // Массив UI компонентов для раздела параметров
}
/* UI Компонент */
export interface IUIComponent {
  Type: string                            // Тип компонента
  UiID: string                            // Уникальный идентификатор компонента
  Label?: string                          // Название компонента
  ClassName?: string                      // Стили оформления
  RegExp?: string                         // Регулярное выражение для Input и подобных
  Options?: IOptionUI[]                   // Опции для элемента Select
  Props?: object                          // Дополнительные свойства (у каждого компонента свой набор, смотреть в компонентах)
  EventHandler?: IUIComponentHandler      // Обработчик событий
}
/* Интерфейс обработчика для UI компонента */
export interface IUIComponentHandler {
  Action: string                          // Действие (имя функции, как правило отправка в WebSocket)
  Header?: string                         // Заголовок пакета
  Argument?: string                       // Аргумент
  Variables?: string[]                    // Массив переменных
  Payload?: string                        // Дополнительные данные
}


/**
 * Пример структуры изделия
 * ИЗДЕЛИЕ
 *   - Модуль 1: Модуль шлюза
 *       - Блок 1: Настройки Web
 *           - Набор параметров 1: Доступ к Web интерфейсу
 *               - UI компонент 1: Имя пользователя
 *               - UI компонент 2: Пароль
 *               - UI компонент 3: Кнопка СОХРАНИТЬ
 *           - Набор параметров 1: Имя модуля
 *               - UI компонент 1: Имя устройства
 *               - UI компонент 2: Имя Хоста
 *               - UI компонент 3: Кнопка СОХРАНИТЬ
 *       - Блок 2: Настройки WiFi
 *           - Набор параметров 1: Режим WiFi
 *               - UI компонент 1: Селектор выбора ражима WiFi
 *               - UI компонент 2: Кнопка СОХРАНИТЬ
 *           - Набор параметров 2: Настройки в режиме STA
 *               - UI компонент 1: Поле ввода для STA SSID
 *               - UI компонент 2: Поле ввода для пароля
 *               - UI компонент 3: Кнопки переключения режима IP адресов
 *               - UI компонент 4: Поле ввода для IP адреса
 *               - UI компонент 5: Поле ввода для маски сети
 *               - UI компонент 6: Поле ввода для IP адреса шлюза
 *               - UI компонент 7: Кнопка СОХРАНИТЬ
 *           - Набор параметров 3: Настройки в режиме AP
 *               - UI компонент 1: Поле ввода для AP SSID
 *               - UI компонент 2: Поле ввода для пароля
 *               - UI компонент 3: Кнопки переключения режима IP адресов
 *               - UI компонент 4: Поле ввода для IP адреса
 *               - UI компонент 5: Поле ввода для маски сети
 *               - UI компонент 6: Поле ввода для IP адреса шлюза
 *               - UI компонент 7: Кнопка СОХРАНИТЬ
 *       - Блок 3: Сервис
 *           - Набор параметров 1: Уровень логирования
 *               - UI компонент 1: Кнопки переключения уровня логирования
 *               - UI компонент 2: Слайдер изменения времени активного состояния
 *   - Модуль 2: Модуль управления мотором
 *       - Блок 1: Блок энкодера
 *           - Набор параметров 1: Разрешение и смещение
 *               - UI компонент 1: Селектор выбора разрешения
 *               - UI компонент 2: Поле ввода для указания смещения
 *               - UI компонент 3: Кнопка СОХРАНИТЬ
 *           - Набор параметров 2: Калибровка
 *               - UI компонент 1: Кнопка запуска грубой калибровки
 *               - UI компонент 2: Кнопка запуска точной калибровки
 *               - UI компонент 3: Кнопка СОХРАНИТЬ
 *       - Блок 2: Блок драйвера
 *           - Набор параметров 1: Главные параметры
 *               - UI компонент 1: Поле ввода для указания напряжения питания
 *               - UI компонент 2: Поле ввода для указания напряжения двигателя
 *               - UI компонент 2: Селектор выбора частоты ШИМ
 *               - UI компонент 3: Кнопка СОХРАНИТЬ
 */
