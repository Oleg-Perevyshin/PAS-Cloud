// src/ws.server.ts
import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { prisma } from './lib/Prisma'
import { EncryptWebSocketPacket, DecryptWebSocketPacket, ValidateDevSN } from './lib/utils/Common'
import { parse } from 'url'
import {
  JoinGroup,
  GetGroupList,
  CreateGroup,
  DeleteGroup,
  SetMessage,
  GetMessages,
  DeleteMessage,
} from './lib/utils/WebSocket'
import type { ILeaveGroup, IWebSocketPacket, IWebSocketPacketMain } from './stores/Interfaces'

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

/**
 * Все клиенты WebSocket
 */
// const clients = new Map<WebSocket, { userID?: string; devSN?: string; lastPing: number }>()

/* Отправить сообщение в группу */
enum SendOptions {
  ToRequester /* Отправить только запрашивающему */,
  ToGroup /* Отправить всей группе */,
  ToGroupExceptRequester /* Отправить всем, кроме запрашивающего */,
}

/* Отправка пакета в группы */
const sendToGroup = (
  GroupID: string,
  message: { Data: Uint8Array } | null,
  option: SendOptions,
  requester?: WebSocket,
) => {
  if (!message?.Data) {
    return console.warn(`sendToGroup Нет сообщения для передачи`)
  }

  const wsGroup = wsGroups.get(GroupID)
  wsGroup?.forEach((client: WebSocket) => {
    if (client.readyState === client.OPEN) {
      if (option === SendOptions.ToRequester && client === requester) {
        client.send(JSON.stringify({ Data: Array.from(message.Data) }))
      } else if (option === SendOptions.ToGroup) {
        client.send(JSON.stringify({ Data: Array.from(message.Data) }))
      } else if (option === SendOptions.ToGroupExceptRequester && client !== requester) {
        client.send(JSON.stringify({ Data: Array.from(message.Data) }))
      }
    }
  })
  console.log('Server:', DecryptWebSocketPacket(new Uint8Array(message.Data)) as IWebSocketPacket)
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
        const createGroupResponse = DecryptWebSocketPacket(
          new Uint8Array(createGroupResponsePacket.Data),
        ) as IWebSocketPacket

        if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
          const groupID = createGroupResponse.VALUE.GroupID as string
          if (groupID) {
            if (!wsGroups.has(groupID)) {
              wsGroups.set(groupID, new Set<WebSocket>())
            }
            joinGroup(ws, groupID)
            /* Отвечаем всем в группе */
            sendToGroup(groupID, createGroupResponsePacket, SendOptions.ToGroup, ws)
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
        sendToGroup(GroupID, LeaveGroupResponse, SendOptions.ToGroup)
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
        const createdGroup = (await CreateGroup(ClientID, null, GroupName)) as IWebSocketPacketMain
        const createGroupResponse = DecryptWebSocketPacket(new Uint8Array(createdGroup.Data)) as IWebSocketPacket
        if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
          const groupID = createGroupResponse.VALUE.GroupID as string
          if (groupID) {
            if (!wsGroups.has(groupID)) {
              wsGroups.set(groupID, new Set<WebSocket>())
            }
            joinGroup(ws, groupID)
            sendToGroup(groupID, createdGroup, SendOptions.ToGroup)
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
              sendToGroup(ClientID, groupResponse, SendOptions.ToGroup)
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
        const groupResponse = (await GetGroupList(ClientID)) as IWebSocketPacketMain
        sendToGroup(GroupID, groupResponse, SendOptions.ToRequester, ws)
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
          sendToGroup(clientGroupResponse.GroupID, deleteGroupResponse, SendOptions.ToGroup)
          leaveGroups(ws, GroupID)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SYS DeleteGroup: ${error}`))
      }
      break
    }

    /* Сообщение о состоянии, не записываем в БД */
    case 'Status': {
      const { DevSN, GroupID, GroupName, Status } = JSON.parse(value.toString())
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
        sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          groupResponse = EncryptWebSocketPacket('SYS', argument, { ClientID, DevSN, GroupID, ...Data })
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
        }
      } catch (error) {
        handleError(new Error(`Обработчик SET GroupMessage: ${error}`))
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroup)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
          sendToGroup(GroupID, groupResponse, SendOptions.ToGroupExceptRequester, ws)
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
  switch (argument) {
    default: {
      break
    }
  }
}

/* ************************************************************************* */
/* Создаем экземпляр WebSocketServer на основе существующего http сервера */
const wss = new WebSocketServer({ noServer: true })

/* Обработчик событий WebSocket */
wss.on('connection', async (ws, req) => {
  /* Извлекаем параметры из URL */
  const { query } = parse(req.url || '', true)
  const UserID = (query.UserID as string) || undefined
  const DevSN = (query.DevSN as string) || undefined
  const DevName = (query.DevName as string) || undefined
  const DevFW = (query.DevFW as string) || undefined

  /* Добавляем клиента в карту */
  // clients.set(ws, { userID: UserID, devSN: DevSN, lastPing: Date.now() })

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
      const catalogDevID = await prisma.catalog.findUnique({
        where: { DevID },
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
    const handleGroupResponse = async (responsePacket: IWebSocketPacketMain, ClientID: string) => {
      const response = DecryptWebSocketPacket(new Uint8Array(responsePacket.Data)) as IWebSocketPacket
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
          sendToGroup(GroupID, packet, SendOptions.ToRequester, ws)
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
  const clientConnected = UserID && (await handleGroupConnection('UserID', UserID))
  const deviceConnected = DevSN && (await handleGroupConnection('DevSN', DevSN))
  if (!clientConnected && !deviceConnected) {
    console.error('Невалидный UserID или DevSN')
    ws.close(1008, 'Invalid connection parameters')
  }
  if (clientConnected) {
    console.info(`Пользователь ${UserID} подключился к WebSocket`)
  }
  if (deviceConnected) {
    console.info(`Изделие ${DevSN} подключилось к WebSocket`)
  }

  /* Отправляем список групп клиенту (пользователю) */
  if (UserID) {
    const groupResponse = (await GetGroupList(UserID)) as IWebSocketPacketMain
    const createGroupResponse = DecryptWebSocketPacket(new Uint8Array(groupResponse.Data)) as IWebSocketPacket
    if (createGroupResponse && createGroupResponse.VALUE && 'GroupID' in createGroupResponse.VALUE) {
      sendToGroup(createGroupResponse.VALUE.GroupID as string, groupResponse, SendOptions.ToGroup)
    }
  }

  // logGroups('CONNECTION')

  /* Получено сообщение */
  let buffer = ''
  let timeoutId: NodeJS.Timeout | null = null
  ws.on('message', async (data) => {
    try {
      /* Добавляем новые данные в буфер */
      buffer += data.toString()

      if (buffer.length > 4 * 1024 * 1024) {
        // 4MB
        return console.error('Переполнение буфера, сброс'), (buffer = '')
      }

      let startIndex = 0
      while (startIndex < buffer.length) {
        const endIndex = buffer.indexOf('}', startIndex)
        if (endIndex === -1) {
          break
        }

        const json = buffer.slice(startIndex, endIndex + 1)
        try {
          const parsedData = JSON.parse(json)
          const base64Data = parsedData.Data
          if (typeof base64Data !== 'string') {
            throw new Error('Данные не являются строкой Base64')
          }

          /* Декодирование строки Base64 в массив байтов */
          const binaryString = atob(base64Data)
          const byteNumbers = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            byteNumbers[i] = binaryString.charCodeAt(i)
          }

          const receivedData = new Uint8Array(byteNumbers);

          if (!(receivedData instanceof Uint8Array) || !base64Data) {
            throw new Error('Данные не являются Uint8Array');
          }

          /* Расшифровываем пакет */
          const decryptedPacket = DecryptWebSocketPacket(receivedData) as IWebSocketPacket;
          if (!decryptedPacket) {
            console.log('Неверный пакет данных');
            return;
          }

          // const receivedData = new Uint8Array(parsedData.Data)

          // // console.log('Client:', parsedData)

          // if (!(receivedData instanceof Uint8Array) || !parsedData.Data) {
          //   throw new Error('Данные не являются Uint8Array')
          // }

          // /* Расшифровываем пакета */
          // const decryptedPacket = DecryptWebSocketPacket(receivedData) as IWebSocketPacket
          // if (!decryptedPacket) {
          //   console.log('Неверный пакет данных')
          //   return
          // }

          const { HEADER, ARGUMENT, VALUE } = decryptedPacket
          console.log('Client:', HEADER, ARGUMENT, VALUE)
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

          /* Обновляем индекс для обработки следующего сообщения */
          startIndex = endIndex + 1
        } catch (error) {
          console.error(`Сервер получил неверные данные`, error)
          break
        }
      }

      /* Удаляем обработанные данные из буфера */
      buffer = buffer.slice(startIndex)

      /* Удаляем таймер, если данные приходят */
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      /* Устанавливаем новый таймер для очистки буфера */
      timeoutId = setTimeout(() => {
        buffer = ''
        timeoutId = null
      }, 2500)

      // /* Обновляем время последней активности */
      // const clientInfo = clients.get(ws)
      // if (clientInfo) {
      //   clientInfo.lastPing = Date.now()
      // }
    } catch (error) {
      handleError(new Error(`Ошибка WebSocket пакета: ${error}`))
    }
  })

  /* Закрыто соединение WebSocket */
  ws.on('close', async () => {
    /* Выходим из всех групп */
    leaveGroups(ws)
    // clients.delete(ws)

    /* Проверяем пользователя в базе данных, если есть - устанавливаем флаг IsOnline в false */
    if (UserID) {
      try {
        const closedUser = await prisma.user.updateMany({
          where: { UserID },
          data: { IsOnline: false },
        })
        if (closedUser.count > 0) {
          console.info(`Пользователь ${UserID} отключился от WebSocket`)
        }
      } catch (error) {
        console.error(`Ошибка установки флага IsOnline для пользователя: ${error}`)
      }
    } else if (DevSN) {
      /* Проверяем изделие в базе данных, если есть - устанавливаем флаг IsOnline в false */
      // try {
      //   const closedDevice = await prisma.device.updateMany({
      //     where: { DevSN },
      //     data: { IsOnline: false },
      //   })
      //   if (closedDevice.count > 0) {
      //     console.info(`Изделие ${DevSN} отключилось от WebSocket`)
      //   }
      // } catch (error) {
      //   console.error(`Ошибка установки флага IsOnline для устройства: ${error}`)
      // }
    } else {
      console.warn(`Что то отключилось от WebSocket`)
    }
  })

  /* Ошибки в WebSocket */
  ws.on('error', (error) => {
    console.error(`Ошибка WebSocket: ${error}`)
  })
})

// /* Таймаут для проверки "мертвых" соединений */
// setInterval(() => {
//   const now = Date.now()
//   clients.forEach((clientInfo, ws) => {
//     if (now - clientInfo.lastPing > 30000) {
//       console.warn(`Пользователь ${clientInfo.userID || clientInfo.devSN} не отвечает, отключение...`)
//       ws.close()
//     }
//   })
// }, 10000)

/* Инициализация WebSocket как плагина */
export default async function WebSocketPlugin(server: Server) {
  /* Проверяем существование группы System в базе данных */
  try {
    const existingGroup = await prisma.group.findUnique({
      where: { GroupName: 'System' },
    })
    if (!existingGroup) {
      const groupSystem = await CreateGroup('SYSTEM_WS_USER', null, 'System')
      if (!groupSystem) {
        console.error(`Ошибка инициализации WebSocket: создание группы System`)
      }
    }
  } catch (error) {
    console.error(`Ошибка инициализации WebSocket: группа System: ${error}`)
  }

  /* Загрузка и инициализация всех групп из базы данных */
  try {
    const groupResponse = await GetGroupList('SYSTEM_WS_USER')
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
