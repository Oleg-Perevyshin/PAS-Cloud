// src/routes/api/user_update/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import argon2 from 'argon2'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'
import { clearTimer } from '$lib/utils/TimeManager'

export const PATCH: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем язык и тело запроса */
    const body = await event.request.json()
    if (!body) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Извлекаем UserID из параметров запроса */
    const UserID = event.url.searchParams.get('UserID')
    if (!UserID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных, данные которого обновляем */
    let requested_user = await prisma.user.findUnique({
      where: { UserID: UserID },
      include: { Devices: true },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем права доступа */
    const hasAccess =
      requester_user.UserID === requested_user.UserID || ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Сохраняем данные пользователя */
    if (body.Password && body.Password.length > 6) {
      const hashedPassword = await argon2.hash(body.Password)
      await prisma.user.update({
        where: { UserID: requested_user.UserID },
        data: { Password: hashedPassword },
      })
    }
    requested_user = await prisma.user.update({
      where: { UserID: requested_user.UserID },
      data: {
        Role: body.Role,
        EMail: body.EMail,
        NickName: body.NickName,
        Avatar: body.Avatar,
        FirstName: body.FirstName,
        LastName: body.LastName,
        AboutMe: body.AboutMe,
        Country: body.Country,
        Region: body.Region,
        City: body.City,
        Address: body.Address,
        PostCode: body.PostCode,
        PhoneNumber: body.PhoneNumber,
        IsActivated: body.IsActivated,
        Tags: { set: body.Tags },
      },
      include: {
        Devices: true,
      },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ERR_USER_UPDATE', lang)), { status: 500 })
    }
    /* Проверяем активацию, удаляем таймер автоудаления (если есть) */
    if (requested_user.IsActivated === true) {
      clearTimer(requested_user.UserID)
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
    return new Response(JSON.stringify(ResponseManager('OK_USER_UPDATED', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка user_update', error)
    return new Response(JSON.stringify(ResponseManager('ER_USER_UPDATE', lang)), { status: 500 })
  }
}
