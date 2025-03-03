// src/routes/api/user_search/+server.ts
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

    /* Получаем строку поиска */
    const search = event.url.searchParams.get('search')
    const actualSearch = search === 'null' ? null : search ? search.trim() : ''
    const pageSize = 10

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
      where?: {
        OR?: Array<{
          UserID?: { contains: string; mode: 'insensitive' }
          EMail?: { contains: string; mode: 'insensitive' }
          NickName?: { contains: string; mode: 'insensitive' }
          FirstName?: { contains: string; mode: 'insensitive' }
          LastName?: { contains: string; mode: 'insensitive' }
        }>
      }
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

    if (actualSearch) {
      queryOptions.where = {
        OR: [
          { UserID: { contains: actualSearch, mode: 'insensitive' } },
          { EMail: { contains: actualSearch, mode: 'insensitive' } },
          { NickName: { contains: actualSearch, mode: 'insensitive' } },
          { FirstName: { contains: actualSearch, mode: 'insensitive' } },
          { LastName: { contains: actualSearch, mode: 'insensitive' } },
        ],
      }
    }

    const users = await prisma.user.findMany(queryOptions)
    const newCursor = users.length > 0 ? users[users.length - 1].UserID : null
    const responseData = { user_list: users, cursor: newCursor }
    return new Response(JSON.stringify(ResponseManager('OK_GET_USER_LIST', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка user_search', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_USER_LIST', lang)), { status: 500 })
  }
}
