// src/routes/api/user_get/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'

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
    const hasAccess = requester_user.UserID === requested_user.UserID || ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Формируем ответ с данными пользователя */
    const response = {
      UserID: requested_user.UserID,
      IsActivated: null,
      IsOnline: null,
      Role: requested_user.Role,
      EMail: requested_user.EMail,
      // Password: requested_user.Password,
      NickName: requested_user.NickName,
      Avatar: requested_user.Avatar,
      FirstName: requested_user.FirstName,
      LastName: requested_user.LastName,
      Department: requested_user.Department,
      AboutMe: requested_user.AboutMe,
      Country: '',
      Region: '',
      City: '',
      Address: '',
      PostCode: '',
      PhoneNumber: requested_user.PhoneNumber,
      Tags: [],
      Devices: [],
      Created: '',
      Updated: '',
    }
    const responseData = { user_info: response }
    return new Response(JSON.stringify(ResponseManager('OK_GET_USER', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка user_get', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_USER', lang)), { status: 500 })
  }
}
