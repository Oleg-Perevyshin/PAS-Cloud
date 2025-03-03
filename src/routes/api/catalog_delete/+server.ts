// src/routes/api/catalog_delete/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { Prisma } from '@prisma/client'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const DELETE: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Проверяем права доступа */
    if (requester_user && !['MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем DevID и VerFW для удаления */
    const { DevID, VerFW } = await event.request.json()
    if (!DevID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    if (VerFW) {
      await prisma.catalogVersion.deleteMany({ where: { DeviceID: DevID, VerFW } })
      console.info(`Удалена версия ${VerFW} устройства`)
    } else {
      await prisma.catalogVersion.deleteMany({ where: { DeviceID: DevID } })
      console.info('Удалены все версии устройства')
    }

    /* Удаляем устройство у всех пользователей */
    await prisma.userDevice.deleteMany({ where: { Device: { DevID } } })
    console.info('Устройство удалено у всех пользователей')

    /* Находим устройства по DevID, чтобы получить DevSN */
    const devices = await prisma.device.findMany({ where: { DevID } })
    const deviceSNs = devices.map((device) => device.DevSN)

    /* Удаляем устройство из таблицы Devices */
    await prisma.device.deleteMany({ where: { DevSN: { in: deviceSNs } } })
    console.info('Устройство удалено из таблицы Devices')

    /* Удаляем устройство из каталога */
    await prisma.catalogDevice.deleteMany({ where: { CatalogID: DevID } })
    console.info('Устройство полностью удалено')

    return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return new Response(JSON.stringify(ResponseManager('ER_FOREIGN_KEY_CONSTRAINT', lang)), { status: 400 })
    }
    console.log('catalog_delete Ошибка удаления устройства', error)
    return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 500 })
  }
}
