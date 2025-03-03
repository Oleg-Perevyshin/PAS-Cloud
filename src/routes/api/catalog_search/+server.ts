// src/routes/api/catalog_search/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }
  try {
    /* Проверяем права доступа */
    if (requester_user && !['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем строку поиска */
    const search = event.url.searchParams.get('search')
    const actualSearch = search === 'null' ? null : search ? search.trim() : ''

    const pageSize = 10

    /* Определите тип для queryOptions */
    const queryOptions: {
      take: number
      orderBy: { DevID: 'asc' }
      select: {
        DevID: boolean
        DevName: boolean
        Brief: boolean
        Description: boolean
        Icon: boolean
        VerFW: boolean
        MetaData: boolean
        Created: boolean
        Updated: boolean
      }
      where?: {
        OR: Array<{
          DevID?: { contains: string; mode: 'insensitive' }
          DevName?: { contains: string; mode: 'insensitive' }
          Brief?: { contains: string; mode: 'insensitive' }
          Description?: { contains: string; mode: 'insensitive' }
        }>
      }
    } = {
      take: pageSize,
      orderBy: { DevID: 'asc' },
      select: {
        DevID: true,
        DevName: true,
        Brief: true,
        Description: true,
        Icon: true,
        VerFW: true,
        MetaData: true,
        Created: true,
        Updated: true,
      },
    }

    /* Формируем условия поиска */
    if (actualSearch) {
      queryOptions.where = {
        OR: [
          { DevID: { contains: actualSearch, mode: 'insensitive' } },
          { DevName: { contains: actualSearch, mode: 'insensitive' } },
          { Brief: { contains: actualSearch, mode: 'insensitive' } },
          { Description: { contains: actualSearch, mode: 'insensitive' } },
        ],
      }
    }

    /* Читаем данные из базы данных согласно опций queryOptions */
    const devices = await prisma.catalogDevice.findMany(queryOptions)
    if (!devices) {
      return new Response(JSON.stringify(ResponseManager('ER_CATALOG_SEARCH', lang)), { status: 500 })
    }
    const responseData = { catalog_list: devices }
    return new Response(JSON.stringify(ResponseManager('OK_CATALOG_SEARCH', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_search', error)
    return new Response(JSON.stringify(ResponseManager('ER_CATALOG_SEARCH', lang)), { status: 500 })
  }
}
