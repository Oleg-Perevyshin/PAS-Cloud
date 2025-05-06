// src/routes/api/device_delete/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateDevSN } from '$lib/utils/Common'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const DELETE: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем тело запроса и проверяем наличие полей UserID, DevSN */
    const body = await event.request.json()
    const { UserID, DevSN } = body
    if (!UserID || !DevSN) {
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

    /* Удаляем устройство из профиля пользователя */
    await prisma.userDevice
      .delete({
        where: {
          UserID_DevSN: { UserID, DevSN },
        },
      })
      .catch((error) => {
        if (error.code === 'P2025') {
          return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND', lang)), { status: 404 })
        }
        throw error
      })
    return new Response(JSON.stringify(ResponseManager('OK_USER_UPDATE_DEVICE', lang)), { status: 200 })
  } catch (error) {
    console.error('Ошибка device_delete', error)
    return new Response(JSON.stringify(ResponseManager('ER_USER_UPDATE_DEVICE', lang)), { status: 500 })
  }
}
