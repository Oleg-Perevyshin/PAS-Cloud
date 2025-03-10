// src/ws.server.ts
import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { prisma } from './lib/Prisma'
import { EncryptWebSocketPacket, DecryptWebSocketPacket, ValidateDevSN } from './lib/utils/Common'
import { parse } from 'url'
import { JoinGroup, GetGroupList, CreateGroup, DeleteGroup, SetMessage, GetMessages, DeleteMessage } from './lib/utils/WebSocket'
import type { ILeaveGroup, IWebSocketPacket } from './stores/Interfaces'

/**
 * Структура хранит информацию о группах WebSocket соединений
 * string - идентификатор группы
 * Set<WebSocket> - коллекция WebSocket соединений группы
 */
const wsGroups = new Map<string, Set<WebSocket>>()

/**
 * Структура хранит информацию о группах, к которым принадлежит каждый WebSocket клиент
 * WebSocket - объект WebSocket подключенного клиента
 * Set<string> - коллекция идентификаторов групп, в которых участвует клиент
 */
const clientsGroups = new Map<WebSocket, Set<string>>()

/* Карта для хранения клиентов */
const clients = new Map<WebSocket, { userID?: string; devSN?: string }>()

/* Отправляем пакет клиентам (в группы) */
const sendToGroup = (
  GroupID: string,
  message: Uint8Array | null,
  option: 'ToRequester' | 'ToGroup' | 'ToGroupExceptRequester',
  requester?: WebSocket,
) => {
  if (!message) {
    return console.warn(`sendToGroup Нет сообщения для передачи`)
  }
  const wsGroup = wsGroups.get(GroupID)
  wsGroup?.forEach((client: WebSocket) => {
    if (client.readyState === client.OPEN) {
      if (option === 'ToRequester' && client === requester) {
        client.send(message)
      } else if (option === 'ToGroup') {
        client.send(message)
      } else if (option === 'ToGroupExceptRequester' && client !== requester) {
        client.send(message)
      }
    }
  })
  // console.info(`Server:`, Array.from(message).map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' '))
  console.info('↑', DecryptWebSocketPacket(message) as IWebSocketPacket)
}

/* Подключение клиента к комнате */
const joinGroup = (ws: WebSocket, GroupID: string) => {
  const userGroups = clientsGroups.get(ws) || new Set()
  if (userGroups.has(GroupID)) {
    return
  }
  userGroups.add(GroupID)
  if (!wsGroups.has(GroupID)) {
    wsGroups.set(GroupID, new Set())
  }
  wsGroups.get(GroupID)?.add(ws)
  clientsGroups.set(ws, userGroups)
}

/* Выход клиента из указанной группы или из всех групп */
const leaveGroups = async (ws: WebSocket, GroupID?: string) => {
  const userGroups = clientsGroups.get(ws) || new Set()

  /* Получаем ID группы System */
  const groupSystem = await prisma.group.findUnique({
    where: { GroupName: 'System' },
  })
  const systemGroupID = groupSystem ? groupSystem.GroupID : ''

  if (GroupID) {
    if (userGroups.has(GroupID)) {
      const clients = wsGroups.get(GroupID)
      if (clients) {
        clients.delete(ws)
        if (clients.size === 0 && GroupID !== systemGroupID) {
          wsGroups.delete(GroupID)
        }
      }
      userGroups.delete(GroupID)
      if (userGroups.size === 0) {
        clientsGroups.delete(ws)
      }
    }
  } else {
    userGroups.forEach((group) => {
      const clients = wsGroups.get(group)
      if (clients) {
        clients.delete(ws)
        if (clients.size === 0 && group !== systemGroupID) {
          wsGroups.delete(group)
        }
      }
    })
    clientsGroups.delete(ws)
  }
}

/* Вывод всех GroupID и количества клиентов в ргуппах (для отладки) */
const logGroups = (TAG?: string) => {
  const logMessage = Array.from(wsGroups.entries())
    .map(([GroupID, clients]) => `${GroupID} (${clients.size})`)
    .join(' | ')
  if (logMessage !== '') {
    if (TAG) {
      console.info(`${TAG} | GroupList: ${logMessage}`)
    } else {
      console.info(`GroupList: ${logMessage}`)
    }
  }
}

/* ************************************************************************* */
/* Функция обработки ошибок */
const handleError = (error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Произошла неизвестная ошибка'
  console.error(`Error WebSocket: ${errorMessage}`)
}

/* Обработчик пакетов с заголовком SYS */
const handlerSYS = async (ws: WebSocket, argument: string, value: string) => {
  switch (argument) {
    /* Присоединиться к указанной группе, а так же к личной и System  */
    case 'JoinGroup': {
      const { ClientID, GroupID } = JSON.parse(value.toString())
      if (!ClientID || !GroupID) {
        handleError(new Error(`Обработчик SYS: Отсутствует ClientID или GroupID`))
        return
      }

      /* Выход из всех групп */
      leaveGroups(ws)

      /* Подключаемся к группе System */
      const existingGroupSystem = await prisma.group.findUnique({
        where: { GroupName: 'System' },
      })
      if (existingGroupSystem) {
        joinGroup(ws, existingGroupSystem.GroupID)
      }

      /* Подключаемся к личной группе */
      const existingGroupPersonal = await prisma.group.findUnique({
        where: { GroupName: ClientID },
      })
      if (existingGroupPersonal) {
        joinGroup(ws, existingGroupPersonal.GroupID)
      }

      /* Подключаемся к указанной группе */
      try {
        const createGroupResponsePacket = await JoinGroup(ClientID, GroupID)
        const createGroupResponse = DecryptWebSocketPacket(new Uint8Array(createGroupResponsePacket)) as IWebSocketPacket

        if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
          const groupID = createGroupResponse.VALUE.GroupID as string
          if (groupID) {
            if (!wsGroups.has(groupID)) {
              wsGroups.set(groupID, new Set<WebSocket>())
            }
            joinGroup(ws, groupID)
            /* Отвечаем всем в группе */
            sendToGroup(groupID, createGroupResponsePacket, 'ToGroup', ws)
          } else {
            handleError(new Error(`Ошибка SYS JoinGroup: VALUE.GroupID undefined`))
          }
        }
      } catch (error) {
        handleError(new Error(`Обработчик SYS JoinGroup: ${error}`))
      }
      break
    }

    /* Покинуть все группы */
    case 'LeaveGroups': {
      leaveGroups(ws)
      break
    }

    /* Покинуть группу */
    case 'LeaveGroup': {
      const { ClientID, GroupID } = JSON.parse(value.toString())
      if (!ClientID || !GroupID) {
        handleError(new Error(`Обработчик SYS LeaveGroup: Отсутствует ClientID или GroupID`))
        break
      }
      /* Ответ в WS */
      const LeaveGroupResponse = EncryptWebSocketPacket('OK!', 'LeaveGroup', {
        ClientID,
        GroupID,
      } as ILeaveGroup)
      if (LeaveGroupResponse) {
        sendToGroup(GroupID, LeaveGroupResponse, 'ToGroup')
        leaveGroups(ws, GroupID)
      }
      break
    }

    /* Создать новую группу */
    case 'CreateGroup': {
      const { ClientID, GroupName } = JSON.parse(value.toString())
      if (!ClientID || !GroupName) {
        handleError(new Error(`Обработчик SYS CreateGroup: Отсутствует ClientID или GroupName`))
        break
      }

      /* Выходим из всех групп */
      await leaveGroups(ws)

      /* Подключаемся к личной группе */
      joinGroup(ws, ClientID)

      /* Подключаемся к группе System */
      const existingGroup = await prisma.group.findUnique({
        where: { GroupName: 'System' },
      })
      if (existingGroup) {
        joinGroup(ws, existingGroup.GroupID)
      }

      try {
        const createdGroup = await CreateGroup(ClientID, null, GroupName)
        const createGroupResponse = DecryptWebSocketPacket(new Uint8Array(createdGroup)) as IWebSocketPacket
        if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
          const groupID = createGroupResponse.VALUE.GroupID as string
          if (groupID) {
            if (!wsGroups.has(groupID)) {
              wsGroups.set(groupID, new Set<WebSocket>())
            }
            joinGroup(ws, groupID)
            sendToGroup(groupID, createdGroup, 'ToGroup')
          } else {
            console.warn('Ошибка Connection: VALUE.GroupID undefined')
          }
        } else {
          console.error('Ошибка при создании группы: неверный ответ', createGroupResponse)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        if (errorMessage === 'ER_GROUP_ALREADY_EXISTS') {
          const existingGroup = await prisma.group.findUnique({
            where: { GroupName },
          })
          if (existingGroup) {
            const groupResponse = EncryptWebSocketPacket('OK!', 'CreateGroup', {
              ClientID,
              GroupID: existingGroup.GroupID,
              GroupName: existingGroup.GroupName,
            })
            if (groupResponse) {
              if (!wsGroups.has(existingGroup.GroupID)) {
                wsGroups.set(existingGroup.GroupID, new Set<WebSocket>())
              }
              joinGroup(ws, existingGroup.GroupID)
              /* Отвечаем всем в группе */
              sendToGroup(ClientID, groupResponse, 'ToGroup')
            }
          }
        } else {
          handleError(new Error(`Обработчик SYS CreateGroup: ${error}`))
        }
      }
      break
    }

    /* Возвращаем список групп */
    case 'GroupList': {
      const { ClientID, GroupID } = JSON.parse(value.toString())
      if (!ClientID || !GroupID) {
        handleError(new Error(`Обработчик SYS GroupList: Отсутствует ClientID или GroupID`))
        break
      }
      try {
        const groupResponse = (await GetGroupList(ClientID)) as Uint8Array
        sendToGroup(GroupID, groupResponse, 'ToRequester', ws)
      } catch (error) {
        handleError(new Error(`Обработчик GET GroupList: ${error}`))
      }
      break
    }

    /* Удалить указанную группу и все сообщения в ней */
    case 'DeleteGroup': {
      const { ClientID, GroupID } = JSON.parse(value.toString())
      if (!ClientID || !GroupID) {
        handleError(new Error(`Обработчик SYS DeleteGroup: Отсутствует ClientID или GroupID`))
        break
      }
      try {
        const deleteGroupResponse = await DeleteGroup(ClientID, GroupID)
        const clientGroupResponse = await prisma.group.findUnique({ where: { GroupName: ClientID } })
        if (deleteGroupResponse && clientGroupResponse) {
          sendToGroup(clientGroupResponse.GroupID, deleteGroupResponse, 'ToGroup')
          leaveGroups(ws, GroupID)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SYS DeleteGroup: ${error}`))
      }
      break
    }

    /* Сообщение о состоянии, не записываем в БД */
    case 'Status': {
      const { DevSN, GroupID, Status } = JSON.parse(value.toString())
      if (!DevSN || !GroupID || !Status) {
        handleError(new Error(`Обработчик SYS Status: Неверный набор данных`))
      }
      const groupResponse = EncryptWebSocketPacket('SYS', 'Status', {
        ClientID: DevSN,
        DevSN: DevSN,
        GroupID: GroupID,
        Status: Status,
      })
      if (groupResponse) {
        sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
      }
      break
    }

    default: {
      const { ClientID, DevSN, GroupID, Data } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик SYS GroupMessage: Отсутствует GroupID`))
        break
      }
      try {
        let groupResponse = null
        if (ClientID) {
          groupResponse = await SetMessage(ClientID, null, GroupID, argument, Data)
        }
        if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, argument, Data)
        }
        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('SYS', argument, { ClientID, DevSN, GroupID, ...Data })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SYS GroupMessage: ${error}`))
      }
      break
    }
  }
}

/* Обработчик пакетов с заголовком GET */
const handlerGET = async (ws: WebSocket, argument: string, value: string) => {
  switch (argument) {
    /* Сохранить сообщение на запрос списка модулей в группу */
    case 'ModuleList': {
      const { ClientID, DevSN, GroupID } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик GET ModuleList: Недостаточно данных`))
        break
      }
      try {
        let groupResponse = null
        if (ClientID) {
          groupResponse = await SetMessage(ClientID, null, GroupID, 'ModuleList', '')
        } else if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, 'ModuleList', '')
        } else {
          handleError(new Error(`Обработчик GET ModuleList: Отсутствует ClientID и DevSN`))
          break
        }
        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('GET', 'ModuleList', { ClientID, DevSN, GroupID })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик GET ModuleList: ${error}`))
      }
      break
    }

    /* Сохранить сообщение на запрос списка модулей в группу */
    case 'ModuleConfig': {
      const { ClientID, DevSN, ModuleSN, GroupID } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик GET ModuleConfig: Отсутствует GroupID`))
        break
      }

      try {
        let groupResponse = null
        if (ClientID) {
          groupResponse = await SetMessage(ClientID, null, GroupID, 'ModuleConfig', ModuleSN)
        } else if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, 'ModuleConfig', ModuleSN)
        } else {
          handleError(new Error(`Обработчик GET ModuleConfig: Отсутствует ClientID и DevSN`))
          break
        }
        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('GET', 'ModuleConfig', { ClientID, DevSN, ModuleSN, GroupID })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик GET ModuleConfig: ${error}`))
      }
      break
    }

    /* Возвращаем список сообщений из указанной группы (пагинациейй на основании курсорв) */
    case 'GroupMessages': {
      const { ClientID, GroupID, Cursor } = JSON.parse(value.toString())
      if (!ClientID || !GroupID) {
        handleError(new Error(`Обработчик GET MessagesFromGroup: Отсутствует ClientID или GroupID`))
        return
      }
      try {
        const groupResponse = await GetMessages(ClientID, GroupID, Cursor || null, 25)
        if (groupResponse) {
          sendToGroup(GroupID, groupResponse, 'ToRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик GET MessagesFromGroup: ${error}`))
      }
      break
    }

    default: {
      break
    }
  }
}

/* Обработчик пакетов с заголовком SET */
const handlerSET = async (ws: WebSocket, argument: string, value: string) => {
  switch (argument) {
    /*  Сохранить сообщение в группу*/
    case 'GroupMessage': {
      const { ClientID, DevSN, GroupID, Message } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик SET GroupMessage: Отсутствует GroupID`))
        break
      }
      try {
        let groupResponse = null
        if (ClientID) {
          groupResponse = await SetMessage(ClientID, null, GroupID, 'GroupMessage', Message)
        }
        if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, 'GroupMessage', Message)
        }
        if (groupResponse) {
          sendToGroup(GroupID, groupResponse, 'ToGroup', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SET GroupMessage: ${error}`))
      }
      break
    }

    /* Удалить сообщение из группы */
    case 'DeleteMessage': {
      const { ClientID, GroupID, MessageID } = JSON.parse(value.toString())
      if (!ClientID || !GroupID || !MessageID) {
        handleError(new Error(`Обработчик SET DeleteMessage: Отсутствует ClientID, GroupID или MessageID`))
        break
      }
      try {
        const groupResponse = await DeleteMessage(ClientID, MessageID)
        if (groupResponse) {
          sendToGroup(GroupID, groupResponse, 'ToGroup')
        }
      } catch (error) {
        handleError(new Error(`Обработчик SET DeleteMessage: ${error}`))
      }
      break
    }

    default: {
      const { ClientID, DevSN, GroupID, Data } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик SET GroupMessage: Отсутствует GroupID`))
        break
      }
      try {
        let groupResponse = null
        if (ClientID) {
          groupResponse = await SetMessage(ClientID, null, GroupID, argument, Data)
        }
        if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, argument, Data)
        }
        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('SET', argument, { ClientID, DevSN, GroupID, ...Data })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SET GroupMessage: ${error}`))
      }
      break
    }
  }
}

/* Обработчик пакетов с заголовком OK! */
const handlerOK = async (ws: WebSocket, argument: string, value: string) => {
  switch (argument) {
    /* Получили ответ со списком модулей в изделии, сохраняем в БД и транслируем в группу */
    case 'ModuleList': {
      const { DevSN, GroupID, ModuleList } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик OK ModuleList: Отсутствует GroupID`))
        break
      }
      try {
        let groupResponse = null
        if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, 'ModuleList', ModuleList)
        }

        /* Обновляем устройства в таблице device */
        const existingDevice = await prisma.device.update({
          where: { DevSN },
          data: { Modules: ModuleList, IsOnline: true },
        })
        if (!existingDevice) {
          console.error(`handlerOK: Ошибка обновления модулей устройства ${DevSN}`)
          break
        }

        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('OK!', 'ModuleList', {
            ClientID: DevSN,
            DevSN: DevSN,
            GroupID: GroupID,
            ModuleList: ModuleList,
          })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик OK ModuleList: ${error}`))
      }
      break
    }

    /* Получили ответ со списком настроек Изделия, сохраняем и транслируем в группу */
    case 'ModuleConfig': {
      const { DevSN, GroupID, ModuleConfig } = JSON.parse(value.toString())
      if (!GroupID) {
        handleError(new Error(`Обработчик OK ModuleConfig: Отсутствует GroupID`))
        break
      }

      try {
        let groupResponse = null
        if (DevSN) {
          groupResponse = await SetMessage(null, DevSN, GroupID, 'ModuleConfig', ModuleConfig)
        }
        if (groupResponse) {
          groupResponse = EncryptWebSocketPacket('OK!', 'ModuleConfig', {
            ClientID: DevSN,
            GroupID: GroupID,
            ModuleConfig: ModuleConfig,
          })
          sendToGroup(GroupID, groupResponse, 'ToGroupExceptRequester', ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик OK ModuleConfig: ${error}`))
      }
      break
    }

    default: {
      break
    }
  }
}

/* Обработчик пакетов с заголовком ER! */
const handlerER = (ws: WebSocket, argument: string, value: string) => {
  console.error(`HandlerER: ${argument} | ${value}`)
}

/* ************************************************************************* */
/* Создаем экземпляр WebSocketServer на основе существующего http сервера */
const wss = new WebSocketServer({ noServer: true })

/* Обработчик событий WebSocket */
wss.on('connection', async (ws, req) => {
  /* Попытка подключения, извлекаем параметры из запроса */
  const { query } = parse(req.url || '', true)
  const UserID = (query.UserID as string) || undefined
  const DevSN = (query.DevSN as string) || undefined
  const DevName = (query.DevName as string) || undefined
  const DevFW = (query.DevFW as string) || undefined

  /* Отключаем клиента от всех групп, если подключен */
  leaveGroups(ws)

  /* Функция для проверки и обработки группы */
  const handleGroupConnection = async (ClientType: string, ClientID: string) => {
    if (!ClientID) {
      console.error(`handleGroupConnection: Неверный ClientID - ${ClientID}`)
      ws.close(1008, `Invalid ${ClientType}`)
      return false
    }

    /* Если это пользователь - проверяем UserID и подключаем к группе System */
    if (ClientType === 'UserID') {
      const PatternUserID = /^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/
      if (!PatternUserID.test(ClientID)) {
        console.error(`handleGroupConnection: Некорректный UserID - ${ClientID}`)
        ws.close(1008, 'Invalid UserID')
        return false
      }
      const existingGroup = await prisma.group.findUnique({
        where: { GroupName: 'System' },
      })
      if (existingGroup) {
        joinGroup(ws, existingGroup.GroupID)
      } else {
        return false
      }
    }

    /* Если это изделие - создаем/обновляем устройство в БД */
    if (ClientType === 'DevSN') {
      if (!DevName || !DevFW) {
        return console.error(`handleGroupConnection: Отсутствует DevName или DevFW`), false
      }

      const DevSN = ValidateDevSN(ClientID)
      if (!DevSN) {
        console.error(`handleGroupConnection: Некорректный DevSN - ${ClientID}`)
        ws.close(1008, 'Invalid DevSN')
        return false
      }

      const DevID = DevSN.substring(0, 4)
      const catalogDevID = await prisma.catalogDevice.findUnique({
        where: { CatalogID: DevID },
      })
      if (!catalogDevID) {
        return console.error(`handleGroupConnection: Устройство ${DevID} не существует в каталоге`), false
      }

      /* Создаем/обновляем устройства в таблице device */
      const existingDevice = await prisma.device.upsert({
        where: { DevSN },
        update: { DevName, DevFW, IsOnline: true },
        create: { DevSN, DevID, DevName, DevFW, IsOnline: true },
      })
      if (!existingDevice) {
        return console.error(`handleGroupConnection: Ошибка создания/обновления устройства ${DevSN}`), false
      }
    }

    /* Подключаем клиента к личной группе, ClientID - может быть UserID или DevSN */
    const handleGroupResponse = async (responsePacket: Uint8Array, ClientID: string) => {
      const response = DecryptWebSocketPacket(new Uint8Array(responsePacket)) as IWebSocketPacket
      if (response && response.VALUE && 'GroupID' in response.VALUE && 'GroupName' in response.VALUE) {
        const GroupID = response.VALUE.GroupID as string
        const GroupName = response.VALUE.GroupName as string
        if (GroupID) {
          joinGroup(ws, GroupID)
          const packet = EncryptWebSocketPacket('OK!', 'JoinGroup', {
            ClientID: ClientID || null,
            DevSN: DevSN || null,
            GroupID,
            GroupName,
          })
          sendToGroup(GroupID, packet, 'ToRequester', ws)
        } else {
          console.warn('Ошибка Connection: VALUE.GroupID не существует')
        }
      } else {
        console.error('Ошибка при создании группы: неверный ответ', response)
      }
    }

    const group = await prisma.group.findUnique({ where: { GroupName: ClientID } })
    if (group) {
      const joinGroupResponsePacket = await JoinGroup(ClientID, group.GroupID)
      if (joinGroupResponsePacket) {
        await handleGroupResponse(joinGroupResponsePacket, ClientID)
      }
    } else {
      /* Создаем личную группу и подключаем клиента */
      let createGroupResponsePacket = null
      if (ClientType === 'UserID') {
        createGroupResponsePacket = await CreateGroup(ClientID, '', ClientID)
      } else if (ClientType === 'DevSN') {
        createGroupResponsePacket = await CreateGroup('', ClientID, ClientID)
      } else {
        console.error(`Тип ${ClientType} неизвестен, личная группа не создана`)
        return false
      }
      await handleGroupResponse(createGroupResponsePacket, ClientID)
    }
    return true
  }

  /* Проверяем параметры подключения */
  if (UserID && (await handleGroupConnection('UserID', UserID))) {
    const groupResponse = (await GetGroupList(UserID)) as Uint8Array
    const createGroupResponse = DecryptWebSocketPacket(new Uint8Array(groupResponse)) as IWebSocketPacket
    if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
      sendToGroup(createGroupResponse.VALUE.GroupID as string, groupResponse, 'ToGroup')
    }
    console.info(`Пользователь ${UserID} подключился к WebSocket`)
  } else if (DevSN && (await handleGroupConnection('DevSN', DevSN))) {
    console.info(`Изделие ${DevSN} подключилось к WebSocket`)
  } else {
    ws.close(1008, 'Invalid connection parameters')
    console.error('Получен невалидный UserID или DevSN при попытке подключения')
  }

  // logGroups('CONNECTION')

  /* Получено сообщение */
  ws.on('message', async (data) => {
    try {
      let receivedData
      if (Buffer.isBuffer(data)) {
        receivedData = new Uint8Array(data)
      } else if (data instanceof ArrayBuffer) {
        receivedData = new Uint8Array(data)
      } else {
        if (typeof data === 'string') {
          const encoder = new TextEncoder()
          receivedData = encoder.encode(data)
        } else {
          throw new Error('Сервер получил данные не Buffer, не ArrayBuffer и не строку')
        }
      }

      /* Проверяем, что данные являются Uint8Array */
      if (!(receivedData instanceof Uint8Array)) {
        throw new Error('Сервер получил данные не Uint8Array')
      }

      /* Расшифровываем пакет */
      const decryptedPacket = DecryptWebSocketPacket(receivedData) as IWebSocketPacket
      if (!decryptedPacket) {
        console.log('Сервер получил неверный пакет данных')
        return
      }

      const { HEADER, ARGUMENT, VALUE } = decryptedPacket
      console.log('↓', HEADER, ARGUMENT, VALUE)
      switch (HEADER) {
        case 'SYS':
          handlerSYS(ws, ARGUMENT, JSON.stringify(VALUE))
          break
        case 'GET':
          handlerGET(ws, ARGUMENT, JSON.stringify(VALUE))
          break
        case 'SET':
          handlerSET(ws, ARGUMENT, JSON.stringify(VALUE))
          break
        case 'OK!':
          handlerOK(ws, ARGUMENT, JSON.stringify(VALUE))
          break
        case 'ER!':
          handlerER(ws, ARGUMENT, JSON.stringify(VALUE))
          break
        default:
          handleError(new Error(`Неизвестный HEADER: ${HEADER}`))
          break
      }
    } catch (error) {
      console.error(`Сервер получил неверные данные`, error)
    }
  })

  /* Отслеживание состояния подкючения клиентов */
  /* Добавляем клиента в карту и инициализируем переменные */
  clients.set(ws, { userID: UserID, devSN: DevSN })

  const pingInterval = 30000
  const pingTimeoutDuration = 5000
  let timeout: NodeJS.Timeout

  const handlePong = () => {
    /* Очищаем таймер при получении pong */
    clearTimeout(timeout)
  }
  ws.on('pong', handlePong)

  /* Функция для обновления статуса IsOnline в БД */
  const updateOnlineStatus = async (id: string, type: 'user' | 'device') => {
    try {
      const updateData = type === 'user' ? { UserID: id } : { DevSN: id }
      let closedRecord
      if (type === 'user') {
        closedRecord = await prisma.user.updateMany({
          where: updateData,
          data: { IsOnline: false },
        })
      } else if (type === 'device') {
        closedRecord = await prisma.device.updateMany({
          where: updateData,
          data: { IsOnline: false },
        })
      }
      if (closedRecord && closedRecord.count > 0) {
        console.info(`Произошло отключение от WebSocket: ${type === 'user' ? 'Пользователь' : 'Изделие'} ${id}`)
      }
    } catch (error) {
      console.error(`Ошибка установки флага IsOnline для ${type}: ${error}`)
    }
  }

  const pingTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping()
      timeout = setTimeout(async () => {
        ws.terminate()
        clearInterval(pingTimer)
        clients.delete(ws)
        leaveGroups(ws)
        if (UserID) {
          await updateOnlineStatus(UserID, 'user')
        } else if (DevSN) {
          await updateOnlineStatus(DevSN, 'device')
        } else {
          console.error(`Что-то отключилось от WebSocket и это не имеет UserID или DevSN`)
        }
      }, pingTimeoutDuration)
    }
  }, pingInterval)

  /* Соединение WebSocket закрыто (корректно) */
  ws.on('close', async () => {
    /* Очищаем таймер, удаляем клиента из карты, выходим из всех групп и удаляем слушателей при закрытии */
    clearInterval(pingTimer)
    clients.delete(ws)
    leaveGroups(ws)
    ws.removeListener('pong', handlePong)
    /* Проверяем клиента в базе данных, если есть - устанавливаем флаг IsOnline в false */
    if (UserID) {
      updateOnlineStatus(UserID, 'user')
    } else if (DevSN) {
      updateOnlineStatus(DevSN, 'device')
    } else {
      console.error(`Что-то отключилось от WebSocket и это не имеет UserID или DevSN`)
    }
  })

  /* Ошибки в WebSocket */
  ws.on('error', (error) => {
    clearInterval(pingTimer) // Очищаем таймер в случае ошибки
    console.error(`Ошибка WebSocket: ${error}`)
  })
})

/* Инициализация WebSocket как плагина */
export default async function WebSocketPlugin(server: Server) {
  /* Проверяем существование группы System в базе данных */
  try {
    const existingGroup = await prisma.group.findUnique({
      where: { GroupName: 'System' },
    })
    if (!existingGroup) {
      const groupSystem = await CreateGroup('SYSTEM_WEBSOCKET_USER', null, 'System')
      if (!groupSystem) {
        console.error(`Ошибка инициализации WebSocket: группа System не создана`)
      }
    }
  } catch (error) {
    console.error(`Ошибка инициализации WebSocket: группа System: ${error}`)
  }

  /* Загрузка и инициализация всех групп из базы данных */
  try {
    const groupResponse = await GetGroupList('SYSTEM_WEBSOCKET_USER')
    if (Array.isArray(groupResponse)) {
      groupResponse.forEach(({ GroupID }) => {
        if (GroupID && !wsGroups.has(GroupID)) {
          wsGroups.set(GroupID, new Set<WebSocket>())
        }
      })
    } else {
      console.warn('Ошибка инициализации WebSocket: не получен массив групп')
    }
  } catch (error) {
    console.error(`Ошибка инициализации WebSocket: ${error}`)
  }

  server.on('upgrade', function (req, socket, head) {
    if (req.url?.startsWith('/ws')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
    }
  })
  logGroups('WebSocketPlugin')
}
