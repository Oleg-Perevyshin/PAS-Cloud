// src/routes/api/auth_logout/+server.ts
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { NODE_ENV } from '$env/static/private'
import { ValidateUser } from '$lib/utils/ValidateRequest.js'

export const GET = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

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

  if (requester_user && typeof requester_user === 'object' && 'UserID' in requester_user) {
    /* Проверяем наличия пользователя в БД по UserID */
    const user = await prisma.user.findUnique({
      where: { UserID: requester_user.UserID },
    })
    if (!user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 403 })
    }

    /* Очищаем Access и Refresh токены, а так же флаг IsOnline в базе данных для данного пользователя */
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        IsOnline: false,
        AccessToken: null,
        RefreshToken: null,
      },
    })

    return new Response(JSON.stringify(ResponseManager('OK_LOGOUT', lang)), { status: 200 })
  } else {
    return new Response(JSON.stringify(ResponseManager('ER_LOGOUT', lang)), { status: 401 })
  }
}
