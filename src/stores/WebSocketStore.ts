// src/stores/WebsocketStore.ts
import { writable } from 'svelte/store'
import { EncryptWebSocketPacket, DecryptWebSocketPacket } from '$lib/utils/Common'
import type {
  IWebSocketPacket,
  IGroup,
  IJoinGroup,
  IGroupList,
  IDeleteGroup,
  ICreateGroup,
  IGroupMessage,
  IDeleteMessage,
  IGroupMessageList,
  IReqModuleList,
  IReqModuleConfig,
  ILeaveGroup,
  IWebSocketValueStatus,
} from './Interfaces'
import { UserStore } from './UserStore'

interface IWebSocketState {
  socket: WebSocket | null
  connected: boolean
  groupList: IGroup[]
  moduleList: object[]
  moduleConfig: object
  valueContent: Map<string, IGroupMessage[]>
  personalMessages: IGroupMessage[]
  systemMessages: IGroupMessage | null
  storeUserID: string | null
  lastResponse: IWebSocketPacket | null
  status: IWebSocketValueStatus | null
}

const createWebSocketStore = () => {
  const { update, subscribe } = writable<IWebSocketState>({
    socket: null /* Экземплят WebSocket */,
    connected: false /* Флаг состояния соединения WebSockey */,
    groupList: [] /* Массив доступных групп */,
    moduleList: [] /* Массив объектов всех модулей изделия */,
    moduleConfig: {} /* Объект всех настроек модуля */,
    valueContent: new Map() /* Содержимое Value */,
    personalMessages: [] /* Массив личных сообщений */,
    systemMessages: null /* Служебное сообщение */,
    storeUserID: null /* Идентификатор пользователя, нужен для обработки личных сообщений */,
    lastResponse: null /* Последний ответ от сервера */,
    status: null /* Сообщение с каким либо состоянием */,
  })

  /* Подписка на UserStore */
  const unsubscribeUserStore = UserStore.subscribe((userData) => {
    update((state) => ({
      ...state,
      storeUserID: userData?.UserID || null,
    }))
  })

  /* Запуск происходит в компоненте $lib/components/Header/Authorization.svelte */
  let socket: WebSocket | null = null
  let reconnectInterval: ReturnType<typeof setInterval> | null = null
  let WebSocketURL: string
  let UserID: string
  const connect = (url: string, userId: string) => {
    const connectSocket = () => {
      WebSocketURL = url
      UserID = userId
      socket = new WebSocket(`${WebSocketURL}?UserID=${UserID}`)

      socket.onopen = () => {
        console.info(`WebSocket для ${UserID} открыт`)
        update((state) => ({ ...state, socket, connected: true }))
        if (reconnectInterval) {
          clearInterval(reconnectInterval)
          reconnectInterval = null
        }
      }

      socket.onmessage = (event) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            const receivedData = new Uint8Array(e.target.result as ArrayBuffer)
            const jsonData = DecryptWebSocketPacket(receivedData) as IWebSocketPacket
            if (!jsonData) {
              return console.log('Ошибка при расшифровке пакета')
            }

            update((state) => ({ ...state, lastResponse: jsonData }))
            console.info('↓', jsonData)

            try {
              switch (jsonData.HEADER) {
                case 'SYS':
                  handlerSYS(jsonData)
                  break
                case 'GET':
                  handlerGET(jsonData)
                  break
                case 'SET':
                  handlerSET(jsonData)
                  break
                case 'OK!':
                  handlerOK(jsonData)
                  break
                case 'ER!':
                  handlerER(jsonData)
                  break
                default:
                  console.warn(`Неизвестный HEADER: ${jsonData.HEADER}`)
              }
            } catch (error) {
              console.error(`Ошибка WebSocket пакета: ${error}`)
            }
          } else {
            console.error('Ошибка: результат чтения равен null')
          }
        }
        reader.readAsArrayBuffer(event.data)
      }

      socket.onclose = () => {
        console.info(`WebSocket для ${UserID} закрыт`)
        update((state) => ({
          ...state,
          socket: null,
          connected: false,
          groupList: [],
          moduleList: [],
          valueContent: new Map(),
          personalMessages: [],
          systemMessages: null,
          storeUserID: null,
          lastResponse: null,
          status: null,
        }))

        if (!reconnectInterval) {
          reconnectInterval = setInterval(() => {
            if (socket === null) {
              console.info(`Попытка переподключения к WebSocket для ${UserID}...`)
              connectSocket()
            }
          }, 2500)
        }
      }

      socket.onerror = (error) => {
        console.error(`Ошибка WebSocket: ${error}`)
      }
    }

    connectSocket()
  }

  /* Обработка пакетов с заголовком SYS */
  const handlerSYS = (packet: IWebSocketPacket) => {
    switch (packet.ARGUMENT) {
      case 'Status': {
        const { ClientID, GroupID, Status } = packet.VALUE as IWebSocketValueStatus
        if (!Status) {
          console.warn('Обработчик SYS Status: Отсутствует Status')
          break
        }

        /* Обновляем состояние */
        update((state) => ({ ...state, status: { ClientID, GroupID, Status } }))
        break
      }

      default:
        break
    }
  }

  /* Обработка пакетов с заголовком GET */
  const handlerGET = (packet: IWebSocketPacket) => {
    switch (packet.ARGUMENT) {
      default:
        break
    }
  }

  /* Обработка пакетов с заголовком SET */
  const handlerSET = (packet: IWebSocketPacket) => {
    switch (packet.ARGUMENT) {
      /* Получено новое сообщение из группы */
      case 'GroupMessage': {
        const groupMessage = packet.VALUE as IGroupMessage
        const { GroupID, GroupName, Message } = groupMessage
        if (!GroupName || !GroupID || !Message) {
          console.warn('Обработчик OK! GroupMessage: Отсутствует GroupName, GroupID или Message')
          break
        }
        manageMessagesInGroup(GroupID, groupMessage, 'add', '', true)

        /* Проверяем, личное ли сообщение */
        const storeUserID = getUserID()
        if (storeUserID === GroupName) {
          update((state) => ({
            ...state,
            personalMessages: [...state.personalMessages, groupMessage],
          }))
        }

        /* Проверяем, служебное ли сообщение */
        if (GroupName === 'System') {
          update((state) => ({
            ...state,
            systemMessages: groupMessage,
          }))
        }
        break
      }

      default:
        break
    }
  }

  const handlerOK = (packet: IWebSocketPacket) => {
    switch (packet.ARGUMENT) {
      /* Пользователь присоединился группу */
      case 'JoinGroup': {
        const { ClientID, GroupID, GroupName, Created, Updated } = packet.VALUE as IJoinGroup
        if (!ClientID || !GroupID) {
          console.warn('Обработчик OK! JoinGroup: Отсутствует ClientID или GroupID')
          break
        }
        update((state) => {
          const groupExists = state.groupList.some((group: IGroup) => group.GroupID === GroupID)
          if (!groupExists) {
            const newGroup: IGroup = { GroupID, GroupName, Created, Updated }
            const updatedGroupList = [...state.groupList, newGroup]
            return { ...state, groupList: updatedGroupList }
          }
          return state
        })
        break
      }

      /* Пользователь покинул группу */
      case 'LeaveGroup': {
        const { ClientID, GroupID } = packet.VALUE as ILeaveGroup
        if (!ClientID || !GroupID) {
          console.warn('Обработчик OK! LeaveGroup: Отсутствует ClientID или GroupID')
          break
        }
        console.log(`ClientID: ${ClientID} покинул группу ${GroupID}`)
        break
      }

      /* Создана новая группа на сервере */
      case 'CreateGroup': {
        const { ClientID, GroupID, GroupName } = packet.VALUE as ICreateGroup
        if (!ClientID || !GroupID) {
          console.warn('Обработчик OK! CreateGroup: Отсутствует ClientID или GroupID')
          break
        }
        if (!GroupName) {
          console.error('JoinGroup не имеет требуемых свойств')
          break
        }
        update((state) => {
          const groupExists = state.groupList.some((group: IGroup) => group.GroupID === GroupID)
          if (!groupExists) {
            const newGroup: IGroup = { GroupID, GroupName }
            const newGroupList = [...state.groupList, newGroup]
            return { ...state, groupList: newGroupList }
          }
          return state
        })
        break
      }

      /* Получен список групп с сервера */
      case 'GroupList': {
        const { GroupList } = packet.VALUE as IGroupList
        if (!GroupList) {
          console.warn('Обработчик OK! GroupList: Отсутствует GroupList')
          break
        }
        update((state) => {
          const uniqueGroups = new Set(state.groupList.map((group) => group.GroupID))
          if (Array.isArray(GroupList) && GroupList.length > 0) {
            GroupList.forEach((group: IGroup) => {
              if (typeof group === 'object' && group !== null && 'GroupID' in group && typeof (group as IGroup).GroupID === 'string') {
                uniqueGroups.add((group as IGroup).GroupID)
              }
            })
          }
          const updatedGroupList = Array.from(uniqueGroups)
            .map((chatId) => {
              return (
                GroupList.find((group: IGroup) => {
                  return typeof group === 'object' && group !== null && (group as IGroup).GroupID === chatId
                }) || null
              )
            })
            .filter((group): group is IGroup => group !== null)
          return { ...state, groupList: updatedGroupList }
        })
        break
      }

      /* Удалена группа на сервере */
      case 'DeleteGroup': {
        const { ClientID, GroupID } = packet.VALUE as IDeleteGroup
        if (!ClientID || !GroupID) {
          console.warn('Обработчик OK! CreateGroup: Отсутствует ClientID или GroupID')
          break
        }
        update((state) => {
          const updatedGroupList = state.groupList.filter((group: IGroup) => group.GroupID !== GroupID)
          return { ...state, groupList: updatedGroupList }
        })
        break
      }

      /* Получено новое сообщение из группы */
      case 'GroupMessage': {
        const groupMessage = packet.VALUE as IGroupMessage
        const { GroupID, GroupName, Message } = groupMessage
        if (!GroupName || !GroupID || !Message) {
          console.warn('Обработчик OK! GroupMessage: Отсутствует GroupName, GroupID или Message')
          break
        }
        manageMessagesInGroup(GroupID, groupMessage, 'add', '', true)

        /* Проверяем, личное ли сообщение */
        const storeUserID = getUserID()
        if (storeUserID === GroupName) {
          update((state) => ({
            ...state,
            personalMessages: [...state.personalMessages, groupMessage],
          }))
        }

        /* Проверяем, служебное ли сообщение */
        if (GroupName === 'System') {
          update((state) => ({
            ...state,
            systemMessages: groupMessage,
          }))
        }
        /* Проверяем что в сообщении */
        break
      }

      /* Получен массив сообщений из группы */
      case 'GroupMessages': {
        const { GroupID, GroupMessages } = packet.VALUE as IGroupMessageList
        if (!GroupID || !GroupMessages || !Array.isArray(GroupMessages)) {
          console.warn('Обработчик OK! GroupMessage: Отсутствует GroupID или GroupMessages')
          break
        }
        GroupMessages.forEach((message: IGroupMessage) => {
          manageMessagesInGroup(GroupID, message, 'add', '', false)
        })
        break
      }

      /* Удалено сообщение из группы */
      case 'DeleteMessage': {
        const { GroupID, MessageID } = packet.VALUE as IDeleteMessage
        if (!MessageID || !GroupID) {
          console.warn('Обработчик OK! DeleteMessage: Отсутствует MessageID или GroupID')
          break
        }
        manageMessagesInGroup(GroupID, null, 'delete', MessageID, false)
        break
      }

      /* Получен список модулей от изделия */
      case 'ModuleList': {
        const { ModuleList } = packet.VALUE as IReqModuleList
        if (!ModuleList) {
          console.warn('Обработчик OK! ModuleList: Отсутствует ModuleList')
          break
        }
        /* Обновляем состояние с модулями */
        update((state) => ({ ...state, moduleList: ModuleList }))
        break
      }

      /* Получен список модулей от изделия */
      case 'ModuleConfig': {
        const { ModuleConfig } = packet.VALUE as IReqModuleConfig
        if (!ModuleConfig) {
          console.warn('Обработчик OK! ModuleConfig: Отсутствует ModuleConfig')
          break
        }
        /* Обновляем состояние с модулями */
        update((state) => ({ ...state, moduleConfig: ModuleConfig }))
        break
      }

      default:
        break
    }
  }

  /* Обработка пакетов с заголовком ER! */
  const handlerER = (packet: IWebSocketPacket) => {
    switch (packet.ARGUMENT) {
      case 'WebSocket': {
        if (packet.VALUE && 'Message' in packet.VALUE) {
          const message = packet.VALUE.Message;
          if (typeof message === 'string' && message.trim() !== '') {
            console.warn(`Ошибка WebSocket: ${message}`);
          } else {
            console.warn('Message не является строкой или пустой');
          }
        } else {
          console.warn('VALUE отсутствует или не является объектом');
        }
        break;
      }
      default:
        break
    }
  }

  /* Функция для получения UserID */
  const getUserID = () => {
    let currentUserId: string | null = null
    subscribe((state) => {
      currentUserId = state.storeUserID
    })()
    return currentUserId
  }

  /* Обработчик сообщений в группе */
  const manageMessagesInGroup = (
    GroupID: string,
    message: IGroupMessage | null,
    action: 'add' | 'update' | 'delete',
    messageIdToDelete?: string,
    isNewMessage: boolean = false,
  ) => {
    update((state) => {
      const currentMessages = state.valueContent.get(GroupID) || []
      let updatedMessages: IGroupMessage[]

      switch (action) {
        case 'add':
          if (message && !currentMessages.some((msg) => msg.MessageID === message.MessageID)) {
            updatedMessages = isNewMessage ? [message, ...currentMessages] : [...currentMessages, message]
          } else {
            updatedMessages = currentMessages
          }
          break

        case 'update':
          if (message) {
            updatedMessages = currentMessages.map((msg) => (msg.MessageID === message.MessageID ? message : msg))
          } else {
            updatedMessages = currentMessages
          }
          break

        case 'delete':
          if (messageIdToDelete) {
            updatedMessages = currentMessages.filter((msg) => msg.MessageID !== messageIdToDelete)
          } else {
            updatedMessages = currentMessages
          }
          break

        default:
          console.warn(`Неизвествное действие для manageMessagesInGroup: ${action}`)
          return state
      }

      state.valueContent.set(GroupID, updatedMessages)
      return { ...state, valueContent: new Map(state.valueContent) }
    })
  }

  /* Отправляем пакет на сервер */
  const sendPacket = (header: string, argument: string, value: object) => {
    update((state) => {
      if (state.socket && state.socket.readyState === WebSocket.OPEN) {
        const wsPackage = EncryptWebSocketPacket(header, argument, value)
        if (wsPackage) {
          state.socket.send(wsPackage)
          // console.info(`Client:`, Array.from(wsPackage).map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' '))
          console.info('↑', { HEADER: header, ARGUMENT: argument, VALUE: value })
        }
      } else {
        console.error(`Отправка невозможно, WebSocket закрыт`)
      }
      return state
    })
  }

  /* Удалить сообщение  */
  const deleteMessage = (UserID: string, MessageID: string) => {
    update((state) => {
      sendPacket('SET', 'DeleteMessage', { UserID, DeletedMessage: { MessageID } })
      return state
    })
  }

  const clearSystemMessages = () => {
    update((state) => ({
      ...state,
      systemMessages: null,
    }))
  }

  const disconnect = () => {
    if (reconnectInterval) {
      clearInterval(reconnectInterval)
      reconnectInterval = null
    }
    console.log('WebSocket отключен')

    update((state) => {
      if (state.socket) {
        state.socket.close()
      }
      return {
        ...state,
        socket: null,
        connected: false,
        groupList: [],
        valueContent: new Map(),
      }
    })
  }

  return {
    subscribe,
    update,
    connect,
    sendPacket,
    deleteMessage,
    clearSystemMessages,
    disconnect,
    cleanup: () => {
      unsubscribeUserStore()
    },
  }
}

export const WebSocketStore = createWebSocketStore()
