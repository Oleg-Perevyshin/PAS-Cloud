// src/routes/api/device_add/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateDevSN } from '$lib/utils/Common'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const PATCH: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем тело запроса и проверяем наличие полей UserID, DevSN и TagID */
    const body = await event.request.json()
    const { UserID, DevSN, TagID } = body
    if (!UserID || !DevSN || !TagID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем серийный номер */
    const SerialNumber = ValidateDevSN(DevSN)
    if (!SerialNumber) {
      return new Response(JSON.stringify(ResponseManager('ER_DEV_SN', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных */
    const requested_user = await prisma.user.findUnique({
      where: { UserID: UserID },
      include: { Devices: true },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Извлекаем DevID из серийного номера и проверяем, существует ли устройство в каталоге */
    const DevID = SerialNumber.split('-')[0]
    const catalogDevice = await prisma.catalogDevice.findUnique({ where: { CatalogID: DevID } })
    if (!catalogDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    /* Проверяем, существует ли устройство с таким серийным номером в таблице Device, если нет - создаем */
    let existingDevice = await prisma.device.findUnique({ where: { DevSN } })
    if (!existingDevice) {
      existingDevice = await prisma.device.create({
        data: {
          DevSN: SerialNumber,
          DevID,
          DevName: catalogDevice.CatalogName,
          DevFW: catalogDevice.VerFW,
        },
      })
    }

    /* Проверяем, существует ли связь между пользователем и устройством */
    const existingUserDevice = await prisma.userDevice.findUnique({
      where: {
        UserID_DevSN: { UserID, DevSN },
      },
    })
    if (existingUserDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_ALREADY_ADDED', lang)), { status: 400 })
    }

    /* Добавляем новое устройство в промежуточную таблицу UserDevice */
    await prisma.userDevice.create({
      data: {
        UserID,
        DevSN,
        TagID,
      },
    })

    /* Получаем добавленное устройство с полями из каталога */
    const userDevice = await prisma.userDevice.findUnique({
      where: { UserID_DevSN: { UserID, DevSN } },
      include: {
        Device: {
          include: {
            Catalog: true,
          },
        },
      },
    })
    if (!userDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_DEVICE_NOT_FOUND', lang)), { status: 404 })
    }

    /* Формируем ответ с данными об устройстве пользователя */
    const response = {
      DevSN: userDevice.DevSN,
      DevID: userDevice.Device.Catalog.CatalogID,
      DevName: userDevice.Device.DevName,
      DevFW: userDevice.Device.DevFW,
      TagID: userDevice.TagID,
      IsOnline: userDevice.Device.IsOnline,
      CatIcon: userDevice.Device.Catalog.Icon,
      CatVerFW: userDevice.Device.Catalog.VerFW,
    }
    const responseData = { user_device: response }

    /* Проверяем права доступа */
    const isSameUser = requester_user.UserID === requested_user.UserID
    const isAdmin = requester_user.Role === 'MANAGER' || requester_user.Role === 'ADMIN'
    if (isSameUser || isAdmin) {
      return new Response(JSON.stringify(ResponseManager('OK_USER_ADD_DEVICE', lang, responseData)), { status: 200 })
    }
    return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
  } catch (error) {
    console.error('Ошибка device_add', error)
    return new Response(JSON.stringify(ResponseManager('ER_USER_ADD_DEVICE', lang)), { status: 500 })
  }
}
