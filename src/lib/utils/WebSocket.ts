// $lib/utils/WebSocket.ts
import { prisma } from '../Prisma'
import { EncryptWebSocketPacket, FormatDate, ValidateDevSN } from './Common'
import { GenerateUniqueID } from './ServerUtils'
import type {
  IWebSocketPacketMain,
  IJoinGroup,
  ICreateGroup,
  IGroupList,
  IDeleteGroup,
  IGroupMessage,
  IDeleteMessage,
  IGroupMessageList,
} from '../../stores/Interfaces'

/**
 * Присоединение к группе
 * @param UserID - идентификатор пользователя
 * @param GroupID - имя группы
 */
export const JoinGroup = async (ClientID: string, GroupID: string): Promise<IWebSocketPacketMain> => {
  /* Проверяем пользователя и устройство */
  const [requesterUser, requesterDevice, existingGroup] = await Promise.all([
    prisma.user.findUnique({ where: { UserID: ClientID } }),
    prisma.device.findUnique({ where: { DevSN: ClientID } }),
    prisma.group.findUnique({ where: { GroupID } }),
  ])

  /* Проверяем группу и форматируем данные */
  if (!existingGroup) {
    throw new Error('ER_GROUP_NOT_FOUND')
  }

  /* Проверяем права доступа для пользователя */
  if (requesterUser !== null) {
    const hasAccess = ['USER', 'ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
    if (!hasAccess) {
      throw new Error('ER_USER_FORBIDDEN')
    }
    const packet = EncryptWebSocketPacket('OK!', 'JoinGroup', {
      ClientID: requesterUser.UserID,
      GroupID: existingGroup.GroupID,
      GroupName: existingGroup.GroupName,
    } as IJoinGroup)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет JoinGroup')
    }
  }

  /* Если устройство существует, возвращаем данные о группе */
  if (requesterDevice !== null) {
    const packet = EncryptWebSocketPacket('OK!', 'JoinGroup', {
      ClientID: requesterDevice.DevSN,
      GroupID: existingGroup.GroupID,
      GroupName: existingGroup.GroupName,
    } as IJoinGroup)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет JoinGroup')
    }
  }

  /* Если ни пользователь, ни устройство не найдены */
  const packet = EncryptWebSocketPacket('ER!', 'JoinGroup', {
    ClientID,
    GroupID,
    GroupName: null,
  } as IJoinGroup)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет JoinGroup')
  }
}

/**
 * Создание нового чата
 * @param UserID - идентификатор пользователя
 * @param  - имя группы
 */
export const CreateGroup = async (UserID: string | null, DeviceID: string | null, GroupName: string | null): Promise<IWebSocketPacketMain> => {
  if (!GroupName) {
    const packet = EncryptWebSocketPacket('ER!', 'CreateGroup', {
      ClientID: UserID || DeviceID,
      GroupID: '',
      GroupName: null,
    } as ICreateGroup)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет CreateGroup')
    }
  }

  /* Проверяем существование группы с таким именем */
  const existingGroup = await prisma.group.findUnique({ where: { GroupName } })
  if (existingGroup) {
    throw new Error('ER_GROUP_ALREADY_EXISTS')
  }

  /* Если это системный пользователь, сразу создаем групп */
  if (UserID === 'SYSTEM_WS_USER') {
    const newGroup = await prisma.group.create({
      data: {
        GroupID: await GenerateUniqueID('group', 3, 4),
        GroupName,
      },
    })
    if (!newGroup) {
      throw new Error('ER_CREATING_GROUP')
    }

    /* Ответ в WS */
    const packet = EncryptWebSocketPacket('OK!', 'CreateGroup', {
      ClientID: UserID,
      GroupID: newGroup.GroupID,
      GroupName: newGroup.GroupName,
    } as ICreateGroup)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет CreateGroup')
    }
  } else if (UserID) {
    /* Проверяем пользователя и права доступа */
    const requesterUser = await prisma.user.findUnique({ where: { UserID } })
    if (!requesterUser) {
      throw new Error('ER_USER_NOT_FOUND')
    }
    const hasAccess = ['USER', 'ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
    if (!hasAccess) {
      throw new Error('ER_USER_FORBIDDEN')
    }
  } else if (!DeviceID) {
    const packet = EncryptWebSocketPacket('ER!', 'CreateGroup', {
      ClientID: UserID || DeviceID || 'SYSTEM_WS_USER',
      GroupID: '',
      GroupName: null,
    } as ICreateGroup)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет CreateGroup')
    }
  }

  /* Создаем новую группу */
  const newGroup = await prisma.group.create({
    data: {
      GroupID: await GenerateUniqueID('group', 3, 4),
      GroupName,
    },
  })
  if (!newGroup) {
    throw new Error('ER_CREATING_GROUP')
  }

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('OK!', 'CreateGroup', {
    ClientID: UserID || DeviceID || '',
    GroupID: newGroup.GroupID,
    GroupName: newGroup.GroupName,
  } as ICreateGroup)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет CreateGroup')
  }
}

/**
 * Получение списка всех групп в БД
 * @param UserID - идентификатор пользователя
 */
export const GetGroupList = async (ClientID: string): Promise<IWebSocketPacketMain | { GroupID: string; GroupName: string }[]> => {
  /* Если это системный пользователь, сразу возвращаем список групп */
  if (ClientID === 'SYSTEM_WS_USER') {
    return await prisma.group.findMany({
      select: {
        GroupID: true,
        GroupName: true,
      },
    })
  }

  /* Проверяем пользователя и права доступа */
  const requesterUser = await prisma.user.findUnique({
    where: { UserID: ClientID },
  })
  if (!requesterUser) {
    throw new Error('ER_USER_NOT_FOUND')
  }
  const hasAccess = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
  if (!hasAccess) {
    throw new Error('ER_USER_FORBIDDEN')
  }

  /* Получаем обновленный список всех групп */
  const groupList = await prisma.group.findMany({
    select: {
      GroupID: true,
      GroupName: true,
    },
  })

  /* Получаем имя и фамилию пользователя, которому принадлежит группа */
  const groupDetails = await Promise.all(
    groupList.map(async (group) => {
      const user = await prisma.user.findUnique({
        where: { UserID: group.GroupName },
        select: {
          FirstName: true,
          LastName: true,
        },
      })

      return {
        ...group,
        FirstName: user?.FirstName || null,
        LastName: user?.LastName || null,
      }
    }),
  )

  /* Проверяем личную группу клиента по имени */
  const group = await prisma.group.findUnique({
    where: { GroupName: ClientID },
  })
  if (!group) {
    throw new Error('ER_USER_GROUP_NOT_FOUND')
  }

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('OK!', 'GroupList', {
    ClientID,
    GroupList: groupDetails,
  } as IGroupList)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет GroupList')
  }
}

/**
 * Удаление группы со всеми сообщениями
 * @param UserID - идентификатор пользователя
 * @param  - имя группы
 */
export const DeleteGroup = async (ClientID: string, GroupID: string): Promise<IWebSocketPacketMain> => {
  /* Проверяем пользователя и права доступа */
  const requesterUser = await prisma.user.findUnique({
    where: { UserID: ClientID },
  })
  if (!requesterUser) {
    throw new Error('ER_USER_NOT_FOUND')
  }
  const hasAccess = ['MANAGER', 'ADMIN'].includes(requesterUser.Role)
  if (!hasAccess) {
    throw new Error('ER_USER_FORBIDDEN')
  }

  /* Проверяем, существует ли группа */
  const existingGroup = await prisma.group.findUnique({
    where: { GroupID },
  })
  if (!existingGroup) {
    throw new Error('ER_GROUP_NOT_FOUND')
  }

  /* Удаляем все сообщения из чата */
  await prisma.groupMessage.deleteMany({
    where: { GroupID: existingGroup.GroupID },
  })

  /* Удаляем саму группу */
  const deletedGroup = await prisma.group.delete({
    where: { GroupID: existingGroup.GroupID },
  })
  if (!deletedGroup) {
    throw new Error('ER_DELETE_GROUP')
  }

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('OK!', 'DeleteGroup', {
    ClientID,
    GroupID,
  } as IDeleteGroup)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет DeleteGroup')
  }
}

/**
 * Сохранение сообщения в группу БД
 * @param UserID - идентификатор пользователя
 * @param  - имя группы
 * @param Message - сообщение
 */
export const SetMessage = async (
  ClientID: string | null,
  DevSN: string | null,
  GroupID: string,
  Argument: string,
  Message: string | object | null | undefined,
): Promise<IWebSocketPacketMain> => {
  let requesterUser = null
  let requesterDevice = null

  /* Проверка пользователя, если UserID предоставлен */
  if (ClientID) {
    requesterUser = await prisma.user.findUnique({ where: { UserID: ClientID } })
    if (!requesterUser) {
      throw new Error('ER_USER_NOT_FOUND')
    }
    const hasAccess = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
    if (!hasAccess) {
      throw new Error('ER_USER_FORBIDDEN')
    }
  } else if (DevSN) {
    /* Проверка серийного номера, если DevSN предоставлен */
    const requesterDevSN = ValidateDevSN(DevSN)
    if (!requesterDevSN) {
      throw new Error('ER_VALIDATE_DEVSN')
    }
    const DevID = DevSN.substring(0, 4)
    requesterDevice = await prisma.catalog.findUnique({
      where: { DevID },
    })
    if (!requesterDevice) {
      throw new Error('ER_DEVICE_NOT_FOUND')
    }
  } else {
    /* Нет ClientID и DevSN, возвращаем ошибку */
    const packet = EncryptWebSocketPacket('ER!', Argument, {
      ClientID: ClientID || null,
      DevSN: DevSN || null,
      GroupID,
    } as IGroupMessage)
    if (packet) {
      return packet
    } else {
      throw new Error('Не удалось создать пакет GroupMessage')
    }
  }

  /* Проверяем, существует ли группа */
  const existingGroup = await prisma.group.findUnique({ where: { GroupID } })
  if (!existingGroup) {
    throw new Error('ER_GROUP_NOT_FOUND')
  }

  /* Сохраняем сообщение в БД */
  const messageString = [Argument ? Argument : null, typeof Message === 'object' ? JSON.stringify(Message) : Message || null]
    .filter(Boolean)
    .join(' | ')
  const newMessage = await prisma.groupMessage.create({
    data: {
      UserID: ClientID || null,
      DevSN: DevSN || null,
      GroupID: existingGroup.GroupID,
      Message: messageString,
    },
  })
  if (!newMessage) {
    throw new Error('ER_GROUP_NOT_FOUND')
  }

  /* Функция для безопасного парсинга JSON */
  const parseMessage = (msg: string) => {
    try {
      return JSON.parse(msg)
    } catch {
      return msg
    }
  }

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('SET', Argument, {
    ClientID: ClientID || null,
    DevSN: DevSN || null,
    GroupID: existingGroup.GroupID,
    GroupName: existingGroup.GroupName,
    MessageID: newMessage.MessageID,
    Message: parseMessage(newMessage.Message),
    Created: FormatDate(newMessage.Created.toISOString()),
    Author: {
      UserID: requesterUser?.UserID || DevSN || '',
      NickName: requesterUser?.NickName || '',
      FirstName: requesterUser?.FirstName || '',
      LastName: requesterUser?.LastName || '',
    },
  } as IGroupMessage)
  if (packet) {
    return packet
  } else {
    throw new Error(`Не удалось создать пакет ${Argument}`)
  }
}

/**
 * Получение сообщений из БД
 * @param UserID - идентификатор пользователя
 * @param  - имя группы
 * @param cursor - курсок на сообщение
 * @param limit - количество сообщений
 */
export const GetMessages = async (UserID: string, GroupID: string, cursor?: string | null, limit: number = 10): Promise<IWebSocketPacketMain> => {
  /* Проверяем пользователя и права доступа */
  const requesterUser = await prisma.user.findUnique({
    where: { UserID },
  })
  if (!requesterUser) {
    throw new Error('ER_USER_NOT_FOUND')
  }
  const hasAccess = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
  if (!hasAccess) {
    throw new Error('ER_USER_FORBIDDEN')
  }

  /* Проверяем, существует ли группа */
  const existingGroup = await prisma.group.findFirst({
    where: {
      OR: [{ GroupID: GroupID }, { GroupName: GroupID }],
    },
  })
  if (!existingGroup) {
    throw new Error('ER_GROUP_NOT_FOUND')
  }

  /* Получаем последние сообщения из указанной группы с использованием курсора */
  const lastMessages = await prisma.groupMessage.findMany({
    where: {
      GroupID: existingGroup.GroupID,
      /* Если курсор предоставлен, фильтруем по MessageID */
      ...(cursor ? { MessageID: { lt: cursor } } : {}),
    },
    orderBy: {
      Created: 'desc' /* Сортировка по времени создания (от свежих сообщений в более старым) */,
    },
    take: limit /* Ограничиваем количество сообщений до указанного лимита */,
    include: {
      /* Включаем информацию об авторе сообщения */
      Author: {
        select: {
          UserID: true,
          NickName: true,
          Avatar: false,
          FirstName: true,
          LastName: true,
        },
      },
    },
  })

  /* Форматируем сообщения для отправки */
  const formattedMessages = lastMessages.map((message) => ({
    ClientID: message.UserID || message.DevSN,
    GroupID: message.GroupID,
    GroupName: existingGroup.GroupName,
    MessageID: message.MessageID,
    Message: message.Message,
    Created: FormatDate(message.Created.toISOString()),
    Author: {
      UserID: message.Author?.UserID || '',
      NickName: message.Author?.NickName || '',
      FirstName: message.Author?.FirstName || '',
      LastName: message.Author?.LastName || '',
    },
  }))

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('OK!', 'GroupMessages', {
    ClientID: UserID,
    GroupID: existingGroup.GroupID,
    GroupName: existingGroup.GroupName,
    GroupMessages: formattedMessages,
    HasMore: lastMessages.length === limit,
  } as IGroupMessageList)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет GroupMessages')
  }
}

/**
 * Удаление сообщения из группы в БД
 * @param UserID - идентификатор пользователя
 * @param  - имя группы
 * @param MessageID - уникальный идентификатор сообщения
 */
export const DeleteMessage = async (ClientID: string, MessageID: string): Promise<IWebSocketPacketMain> => {
  /* Проверяем пользователя и права доступа */
  const requesterUser = await prisma.user.findUnique({
    where: { UserID: ClientID },
  })
  if (!requesterUser) {
    throw new Error('ER_USER_NOT_FOUND')
  }
  const hasAccess = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requesterUser.Role)
  if (!hasAccess) {
    throw new Error('ER_USER_FORBIDDEN')
  }

  /* Проверяем, существует ли сообщение с таким MessageID в группе */
  const existingMessage = await prisma.groupMessage.findUnique({
    where: { MessageID },
  })
  if (!existingMessage) {
    throw new Error('ER_MESSAGE_NOT_FOUND')
  }

  /* Удаляем сообщение из БД */
  const deletedMessage = await prisma.groupMessage.delete({
    where: { MessageID },
  })

  /* Ответ в WS */
  const packet = EncryptWebSocketPacket('OK!', 'DeleteMessage', {
    ClientID,
    GroupID: deletedMessage.GroupID,
    MessageID: deletedMessage.MessageID,
  } as IDeleteMessage)
  if (packet) {
    return packet
  } else {
    throw new Error('Не удалось создать пакет DeleteMessage')
  }
}
