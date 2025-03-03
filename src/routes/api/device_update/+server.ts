// src/routes/api/device_update/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateDevSN, FormatDate } from '$lib/utils/Common'
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
    const DeviceSN = ValidateDevSN(DevSN)
    if (!DeviceSN) {
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

    /* Проверяем права доступа */
    const hasAccess = requester_user.UserID === requested_user.UserID || ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Извлекаем DevID из серийного номера и проверяем, существует ли устройство в каталоге */
    const DevID = DevSN.split('-')[0]
    const catalogDevice = await prisma.catalogDevice.findUnique({ where: { CatalogID: DevID } })
    if (!catalogDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    /* Проверяем, существует ли устройство с таким серийным номером в таблице Device, если нет - создаем */
    const existingUserDevice = await prisma.userDevice.findUnique({
      where: {
        UserID_DevSN: { UserID, DevSN },
      },
    })
    if (!existingUserDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND', lang)), { status: 404 })
    }

    /* Обновление тега устройства */
    await prisma.userDevice.update({
      where: {
        UserID_DevSN: { UserID, DevSN },
      },
      data: { TagID },
    })

    /* Получаем обновленное устройство с данными из каталога */
    const updatedUserDevice = await prisma.userDevice.findUnique({
      where: {
        UserID_DevSN: { UserID, DevSN },
      },
      include: {
        Device: {
          include: { Catalog: true },
        },
      },
    })
    if (!updatedUserDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND', lang)), { status: 404 })
    }

    /* Формируем ответ с данными об обновленном устройстве */
    const response = {
      DevSN: updatedUserDevice.DevSN,
      DevID: updatedUserDevice.Device.Catalog.CatalogID,
      DevName: updatedUserDevice.Device.DevName,
      DevFW: updatedUserDevice.Device.DevFW,
      TagID: updatedUserDevice.TagID,
      CatDevName: updatedUserDevice.Device.Catalog.CatalogName,
      CatBrief: updatedUserDevice.Device.Catalog.Brief,
      CatDescription: updatedUserDevice.Device.Catalog.Description,
      CatIcon: updatedUserDevice.Device.Catalog.Icon,
      CatVerFW: updatedUserDevice.Device.Catalog.VerFW,
      CatMetaData: updatedUserDevice.Device.Catalog.MetaData,
      CatCreated: FormatDate(updatedUserDevice.Device.Catalog.Created.toISOString()),
      CatUpdated: FormatDate(updatedUserDevice.Device.Catalog.Updated.toISOString()),
    }
    const responseData = { user_device: response }
    return new Response(JSON.stringify(ResponseManager('OK_USER_UPDATE_DEVICE', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка device_update', error)
    return new Response(JSON.stringify(ResponseManager('ER_USER_UPDATE_DEVICE', lang)), { status: 500 })
  }
}
