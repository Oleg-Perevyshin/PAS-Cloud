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
    const hasAccess = ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем DevID для удаления */
    const { DevID } = await event.request.json()
    if (!DevID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Удаляем устройство у всех пользователей */
    try {
      await prisma.userDevice.deleteMany({
        where: {
          Device: { DevID },
        },
      })
    } catch (error) {
      console.error('catalog_delete Ошибка удаления устройства у пользователей', error)
      return new Response(JSON.stringify(ResponseManager('ER_USER_DELETE_DEVICES', lang)), { status: 500 })
    }

    /* Находим устройства по DevID, чтобы получить DevSN */
    let deviceSNs = []
    try {
      const devices = await prisma.device.findMany({ where: { DevID } })
      deviceSNs = devices.map((device) => device.DevSN)
    } catch (error) {
      console.error('catalog_delete Ошибка при поиске устройства', error)
      return new Response(JSON.stringify(ResponseManager('ER_FIND_DEVICE', lang)), { status: 500 })
    }

    /* Удаляем устройство из таблицы Devices */
    try {
      for (const devSN of deviceSNs) {
        await prisma.device.delete({ where: { DevSN: devSN } })
      }
    } catch (error) {
      console.error('catalog_delete Ошибка удаления устройства из таблицы Devices', error)
      return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_DEVICES', lang)), { status: 500 })
    }

    /* Удаляем устройство из каталога */
    try {
      await prisma.catalog.delete({ where: { DevID } })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
      }
      console.error('catalog_delete Ошибка удаления устройства из таблицы Catalog', error)
      return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 500 })
    }

    return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 200 })
  } catch (error) {
    console.log('catalog_delete Ошибка удаления устройства', error)
    return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 500 })
  }
}
