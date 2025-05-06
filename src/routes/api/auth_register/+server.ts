// src/routes/api/auth_register/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import argon2 from 'argon2'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { DEFAULT_TAGS } from '../../../enums'
import { startTimer } from '$lib/utils/TimeManager'
import { ValidateEmail, ValidatePassword, GenerateUniqueID } from '$lib/utils/ServerUtils'

const TIME_FOR_ACTIVATION = 1800 // Время на активацию аккаунта 30 минут, потом автоудаление из БД

export const POST: RequestHandler = async (event) => {
  /* Получаем язык */
  const lang = event.request.headers.get('Accept-Language') || 'ru'

  /* Обрабатываем запрос */
  try {
    /* Получаем тело запроса, проверяем EMail и Password */
    const body = await event.request.json()
    const { EMail, Password } = body
    if (!EMail || !Password) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }
    ValidateEmail(EMail)
    ValidatePassword(Password)

    /* Проверяем, существует ли пользователь с указанным EMail в базе данных */
    const user = await prisma.user.findUnique({
      where: { EMail },
      include: { Devices: true },
    })
    if (user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_EXISTS', lang)), { status: 409 })
    }

    /* Хешируем пароль */
    const hashedPassword = await argon2.hash(Password)

    /* Создаем нового пользователя */
    const newUser = await prisma.user.create({
      data: {
        UserID: await GenerateUniqueID('user', 4, 4),
        EMail: EMail,
        Password: hashedPassword,
        NickName: EMail.split('@')[0],
        Tags: DEFAULT_TAGS,
      },
    })
    if (!newUser) {
      return new Response(JSON.stringify(ResponseManager('ER_CREATING_ACCOUNT', lang)), { status: 500 })
    }

    /* Запускаем таймер авто удаления аккаунта, если активация не произойдет в течении TIME_FOR_ACTIVATION секунд */
    startTimer(
      newUser.UserID,
      async () => {
        try {
          await prisma.user.delete({ where: { UserID: newUser.UserID } })
        } catch (error) {
          console.error('Ошибка при удалении аккаунта:', error)
        }
      },
      TIME_FOR_ACTIVATION * 1000,
    )

    /* Формируем ответы */
    return new Response(JSON.stringify(ResponseManager('OK_SIGNUP', lang)), { status: 201 })
  } catch (error) {
    console.error('Ошибка auth_register', error)
    return new Response(JSON.stringify(ResponseManager('ER_SIGNUP', lang)), { status: 500 })
  }
}
