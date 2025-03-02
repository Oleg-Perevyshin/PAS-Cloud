// src/routes/api/device_list/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Извлекаем UserID из параметров запроса */
    const UserID = event.url.searchParams.get('UserID')
    if (!UserID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных */
    const requested_user = await prisma.user.findUnique({
      where: { UserID: UserID },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем права доступа */
    const hasAccess = requester_user.UserID === requested_user.UserID || ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Читаем данные обо всех устройствах пользователя и подгружаем данные из каталога */
    const userDevices = await prisma.userDevice.findMany({
      where: { UserID: UserID },
      include: {
        Device: {
          include: {
            Catalog: true,
          },
        },
      },
    })

    /* Формируем ответ с данными об устройствах пользователя */
    const devices = userDevices.map((ud) => ({
      DevSN: ud.DevSN,
      DevID: ud.Device.Catalog.DevID,
      DevName: ud.Device.DevName,
      DevFW: ud.Device.DevFW,
      TagID: ud.TagID,
      IsOnline: ud.Device.IsOnline,
      CatDevName: ud.Device.Catalog.DevName,
      CatBrief: ud.Device.Catalog.Brief,
      CatDescription: ud.Device.Catalog.Description,
      CatIcon: ud.Device.Catalog.Icon,
      CatVerFW: ud.Device.Catalog.VerFW,
      CatMeta: ud.Device.Catalog.MetaData,
      CatCreated: FormatDate(ud.Device.Catalog.Created.toISOString()),
      CatUpdated: FormatDate(ud.Device.Catalog.Updated.toISOString()),
    }))
    const responseData = { user_devices: devices }
    return new Response(JSON.stringify(ResponseManager('OK_GET_USER_DEVICE_LIST', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка device_list', error)
    return new Response(JSON.stringify(ResponseManager('ER_USER_GET_DEVICE_LIST', lang)), { status: 500 })
  }
}
