// src/routes/api/user_list_get/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунта */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Проверяем права доступа */
    if (requester_user && !['MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Формируем пакеты с пользователями с учетом пагинации */
    const cursorUserID = event.url.searchParams.get('cursor')
    const actualCursorID = cursorUserID === 'null' ? null : cursorUserID

    const pageSize = Math.max(Number(event.url.searchParams.get('quantity')) || 10, 1)

    /* Определяем тип для queryOptions */
    const queryOptions: {
      take: number
      orderBy: { NickName: 'asc' }
      select: {
        UserID: boolean
        IsActivated: boolean
        IsOnline: boolean
        Role: boolean
        EMail: boolean
        Password: boolean
        NickName: boolean
        Avatar: boolean
        FirstName: boolean
        LastName: boolean
        Department: boolean
        AboutMe: boolean
        Country: boolean
        Region: boolean
        City: boolean
        Address: boolean
        PostCode: boolean
        PhoneNumber: boolean
        Tags: boolean
        Devices: boolean
        Created: boolean
        Updated: boolean
      }
      cursor?: { UserID: string }
      skip?: number
    } = {
      take: pageSize,
      orderBy: { NickName: 'asc' },
      select: {
        UserID: true,
        IsActivated: true,
        IsOnline: true,
        Role: true,
        EMail: true,
        Password: false,
        NickName: true,
        Avatar: true,
        FirstName: true,
        LastName: true,
        Department: true,
        AboutMe: true,
        Country: true,
        Region: true,
        City: true,
        Address: true,
        PostCode: true,
        PhoneNumber: true,
        Tags: true,
        Devices: true,
        Created: true,
        Updated: true,
      },
    }

    /* Если курсор установлен, пропускаем текущего пользователя */
    if (actualCursorID) {
      queryOptions.cursor = { UserID: actualCursorID }
      queryOptions.skip = 1
    }

    const users = await prisma.user.findMany(queryOptions)
    if (!users) {
      return new Response(JSON.stringify(ResponseManager('ER_GET_USER_LIST', lang)), { status: 500 })
    }

    /* Определяем курсор и формируем ответ */
    const newCursor = users.length > 0 ? users[users.length - 1].UserID : null
    const responseData = { user_list: users, cursor: newCursor }
    return new Response(JSON.stringify(ResponseManager('OK_GET_USER_LIST', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка user_list_get', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_USER_LIST', lang)), { status: 500 })
  }
}
