// $lib/utils/ValidateRequest.ts
import type { RequestEvent } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_MAX_AGE, NODE_ENV } from '$env/static/private'
import { prisma } from '$lib/Prisma'
import { generateTokens } from './TokenManager'

export const ValidateUser = async (event: RequestEvent) => {
  /* Получаем язык из заголовка и токены из куки */
  const lang = event.request.headers.get('Accept-Language') || 'ru'
  const accessToken = event.cookies.get('access_token')
  const refreshToken = event.cookies.get('refresh_token')

  /* Внутренний мотод проверки токена */
  const validateRequest = async (token: string, secret: string) => {
    if (!secret) {
      throw new Error('Secret не предоставлен')
    }

    const isRefreshToken = secret.startsWith('Refresh')
    let userData
    try {
      /* Проверяем токен пользователя на основании секретной фразы */
      userData = jwt.verify(token, secret)
    } catch (error) {
      const tokenType = isRefreshToken ? 'RefreshToken' : 'AccessToken'
      throw new Error(`Невалидный ${tokenType}, err: ${error}`)
    }

    /* Проверяем формат токена (userData имеет поля UserID, EMail, iat, exp) */
    if (typeof userData !== 'object' || !userData.UserID) {
      throw new Error('Пользователь не авторизован')
    }

    /* Проверяем наличие пользователя в БД по UserID */
    const user = await prisma.user.findUnique({
      where: { UserID: userData.UserID },
    })
    if (!user) {
      throw new Error('Пользователь не найден')
    }

    const validToken = isRefreshToken ? user.RefreshToken : user.AccessToken
    if (token !== validToken) {
      throw new Error('Пользователь не авторизован')
    }

    /* Проверка, активирован ли аккаунт пользователя */
    if (!user.IsActivated) {
      throw new Error('Пользователь не активирован')
    }

    return user
  }

  /* Проверяем наличие accessToken */
  if (accessToken) {
    try {
      const requester_user = await validateRequest(accessToken, JWT_ACCESS_SECRET)
      return { lang, requester_user, status: 200 }
    } catch (error) {
      console.error('Ошибка ValidateRequest - accessToken', error)
    }
  }

  /* accessToken не валиден, проверяем refreshToken */
  if (refreshToken) {
    try {
      /* refreshToken валидный, генерируем новую пару */
      const requester_user = await validateRequest(refreshToken, JWT_REFRESH_SECRET)
      const tokens = await generateTokens(requester_user.UserID, requester_user.EMail)
      if (!tokens) {
        throw new Error('Ошибка генерации токенов')
      }
      /* Сохраняем токены в БД и установливаем в куки */
      await prisma.user.update({
        where: { UserID: requester_user.UserID },
        data: {
          AccessToken: tokens.accessToken,
        },
      })
      const cookieOptions = {
        httpOnly: true,
        sameSite: 'strict',
        secure: NODE_ENV === 'production',
        path: '/',
      }
      event.cookies.set('access_token', tokens.accessToken, {
        ...cookieOptions,
        maxAge: Number(JWT_ACCESS_MAX_AGE) || 900,
      })
      return { lang, requester_user, status: 200 }
    } catch (error) {
      console.error('Ошибка ValidateRequest - refreshToken', error)
    }
  }

  /* Оба токена недействительны */
  return { lang, requester_user: null, status: 401 }
}
