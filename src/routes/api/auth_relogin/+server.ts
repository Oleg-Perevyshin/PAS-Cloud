// src/routes/api/auth_relogin/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { FormatDate } from '$lib/utils/Common'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем данные о пользователе по UserID, включая краткий пакет принадлежащих устройств */
    const requested_user = await prisma.user.findUnique({
      where: { UserID: requester_user.UserID },
      include: {
        Devices: true,
      },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Формируем ответ с данными пользователя */
    const response = {
      UserID: requested_user.UserID,
      IsActivated: requested_user.IsActivated,
      IsOnline: requested_user.IsOnline,
      Role: requested_user.Role,
      EMail: requested_user.EMail,
      // Password: requested_user.Password,
      NickName: requested_user.NickName,
      Avatar: requested_user.Avatar,
      FirstName: requested_user.FirstName,
      LastName: requested_user.LastName,
      AboutMe: requested_user.AboutMe,
      Country: requested_user.Country,
      Region: requested_user.Region,
      City: requested_user.City,
      Address: requested_user.Address,
      PostCode: requested_user.PostCode,
      PhoneNumber: requested_user.PhoneNumber,
      Tags: requested_user.Tags,
      Devices: requested_user.Devices,
      Created: FormatDate(requested_user.Created.toISOString()),
      Updated: FormatDate(requested_user.Updated.toISOString()),
    }
    const responseData = { user: response }
    return new Response(JSON.stringify(ResponseManager('OK_LOGIN', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка auth_relogin', error)
    return new Response(JSON.stringify(ResponseManager('ER_LOGIN', lang)), { status: 500 })
  }
}
