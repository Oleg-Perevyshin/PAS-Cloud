// src/routes/api/auth_login/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import argon2 from 'argon2'
import { generateTokens } from '$lib/utils/TokenManager'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { NODE_ENV, JWT_ACCESS_MAX_AGE, JWT_REFRESH_MAX_AGE } from '$env/static/private'
import { FormatDate } from '$lib/utils/Common'
import { ValidateEmail, ValidatePassword } from '$lib/utils/ServerUtils'

export const POST: RequestHandler = async (event) => {
  /* Получаем язык */
  const lang = event.request.headers.get('Accept-Language') || 'ru'

  /* Обрабатываем запрос */
  try {
    /* Получаем тело запроса и проверяем наличие полей EMail и Password */
    const body = await event.request.json()
    const { EMail, Password } = body
    if (!EMail || !Password) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }
    ValidateEmail(EMail)
    ValidatePassword(Password)

    /* Проверяем, существует ли пользователь с указанным EMail в базе данных */
    const userCheck = await prisma.user.findUnique({
      where: { EMail },
    })
    if (!userCheck) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем, активирован ли аккаунт пользователя */
    if (!userCheck.IsActivated) {
      return new Response(JSON.stringify(ResponseManager('ER_ACTIVATION_ACCOUNT', lang)), { status: 403 })
    }

    /* Сравниваем хеш пароля */
    const isPasswordValid = await argon2.verify(userCheck.Password, Password)
    if (!isPasswordValid) {
      return new Response(JSON.stringify(ResponseManager('ER_INCORRECT_PASSWORD', lang)), { status: 403 })
    }

    /* Генерируем уникальные Access и Refresh токены на основании UserID и EMail */
    const tokens = await generateTokens(userCheck.UserID, userCheck.EMail)
    if (!tokens) {
      return new Response(JSON.stringify(ResponseManager('ER_TOKEN_GENERATOR', lang)), { status: 500 })
    }

    /* Сохраняем Access и Refresh токены, а так же флаг IsOnline в базе данных для данного пользователя */
    const tokens_save = await prisma.user.update({
      where: { UserID: userCheck.UserID },
      data: {
        IsOnline: true,
        AccessToken: tokens.accessToken,
        RefreshToken: tokens.refreshToken,
      },
    })
    if (!tokens_save) {
      return new Response(JSON.stringify(ResponseManager('ER_TOKEN_SAVE', lang)), { status: 500 })
    }

    /* Устанавливаем Access Token и Refresh Token в куки */
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
    event.cookies.set('refresh_token', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: Number(JWT_REFRESH_MAX_AGE) || 86400,
    })

    /* Получаем обновленные данные о пользователе из базе данных */
    const user = await prisma.user.findUnique({
      where: { EMail },
      include: { Devices: true },
    })
    if (!user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Формируем ответ с данными пользователя */
    const response = {
      UserID: user.UserID,
      IsActivated: user.IsActivated,
      IsOnline: user.IsOnline,
      Role: user.Role,
      EMail: user.EMail,
      // Password: user.Password,
      NickName: user.NickName,
      Avatar: user.Avatar,
      FirstName: user.FirstName,
      LastName: user.LastName,
      AboutMe: user.AboutMe,
      Country: user.Country,
      Region: user.Region,
      City: user.City,
      Address: user.Address,
      PostCode: user.PostCode,
      PhoneNumber: user.PhoneNumber,
      Tags: user.Tags,
      Devices: user.Devices,
      Created: FormatDate(user.Created.toISOString()),
      Updated: FormatDate(user.Updated.toISOString()),
    }
    const responseData = { user: response }
    return new Response(JSON.stringify(ResponseManager('OK_LOGIN', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка auth_login', error)
    return new Response(JSON.stringify(ResponseManager('ER_LOGIN', lang)), { status: 500 })
  }
}
