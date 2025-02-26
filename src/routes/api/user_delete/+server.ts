// src/routes/api/user_delete/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { NODE_ENV } from '$env/static/private'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const DELETE: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем UserID для удаления и читаем данные из базы данных */
    const { UserID } = await event.request.json()
    if (!UserID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных */
    const requested_user = await prisma.user.findUnique({
      where: { UserID },
      include: { Devices: true },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем права доступа */
    const isSelfDeletion = requester_user.UserID === requested_user.UserID
    const isAdmin = requester_user.Role === 'MANAGER' || requester_user.Role === 'ADMIN'
    if (!isSelfDeletion && !isAdmin) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Удаляем устройства пользователя */
    const delete_user_devices = await prisma.userDevice.deleteMany({ where: { UserID } })
    if (!delete_user_devices) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_DELETE_DEVICES', lang)), { status: 500 })
    }

    /* Удаляем аккаунт пользователя */
    const delete_user = await prisma.user.delete({ where: { UserID } })
    if (!delete_user) {
      return new Response(JSON.stringify(ResponseManager('ER_DELETE_USER', lang)), { status: 500 })
    }

    /* Чистим куки, если пользователь удаляет себя */
    if (isSelfDeletion) {
      /* Удаляем куки из браузера (Access Token и Refresh Token) */
      const cookieOptions = {
        httpOnly: true,
        maxAge: -1,
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
        path: '/',
      }
      event.cookies.set('access_token', '', {
        ...cookieOptions,
      })
      event.cookies.set('refresh_token', '', {
        ...cookieOptions,
      })
    }
    return new Response(JSON.stringify(ResponseManager('OK_DELETE_USER', lang)), { status: 200 })
  } catch (error) {
    console.error('Ошибка user_delete', error)
    return new Response(JSON.stringify(ResponseManager('ER_DELETE_USER', lang)), { status: 500 })
  }
}
